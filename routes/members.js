const express = require("express");
const router = express.Router();
const Member = require("../models/Member");
const Loan = require("../models/Loan");

/* ── GET /members ── */
router.get("/", async (req, res) => {
  try {
    const { q, status } = req.query;
    const query = {};
    if (q) query.$or = [
      { name: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
      { memberNumber: { $regex: q, $options: "i" } },
    ];
    if (status) query.status = status;

    const members = await Member.find(query).sort({ name: 1 });

    // Attach active loan count per member
    const loanCounts = await Loan.aggregate([
      { $match: { status: "active" } },
      { $group: { _id: "$member", count: { $sum: 1 } } },
    ]);
    const loanMap = Object.fromEntries(loanCounts.map((l) => [l._id.toString(), l.count]));

    res.render("members/index", {
      title: "Members",
      members,
      loanMap,
      query: req.query,
    });
  } catch (err) {
    req.flash("error", "Could not load members");
    res.redirect("/");
  }
});

/* ── GET /members/new ── */
router.get("/new", (req, res) => {
  res.render("members/new", { title: "New Member", member: {} });
});

/* ── POST /members ── */
router.post("/", async (req, res) => {
  try {
    const member = await Member.create(req.body);
    req.flash("success", `Welcome, ${member.name}! Member #${member.memberNumber} created.`);
    res.redirect(`/members/${member._id}`);
  } catch (err) {
    req.flash("error", err.code === 11000 ? "A member with that email already exists" : "Failed to create member");
    res.render("members/new", { title: "New Member", member: req.body });
  }
});

/* ── GET /members/:id ── */
router.get("/:id", async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) { req.flash("error", "Member not found"); return res.redirect("/members"); }

    const activeLoans = await Loan.find({ member: member._id, status: "active" }).sort({ dueAt: 1 });
    const loanHistory = await Loan.find({ member: member._id, status: "returned" }).sort({ returnedAt: -1 }).limit(20);

    res.render("members/show", {
      title: member.name,
      member,
      activeLoans,
      loanHistory,
    });
  } catch (err) {
    req.flash("error", "Member not found");
    res.redirect("/members");
  }
});

/* ── GET /members/:id/edit ── */
router.get("/:id/edit", async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) { req.flash("error", "Member not found"); return res.redirect("/members"); }
    res.render("members/edit", { title: `Edit — ${member.name}`, member });
  } catch (err) {
    res.redirect("/members");
  }
});

/* ── PUT /members/:id ── */
router.put("/:id", async (req, res) => {
  try {
    await Member.findByIdAndUpdate(req.params.id, req.body, { runValidators: true });
    req.flash("success", "Member updated");
    res.redirect(`/members/${req.params.id}`);
  } catch (err) {
    req.flash("error", "Failed to update member");
    res.redirect(`/members/${req.params.id}/edit`);
  }
});

/* ── DELETE /members/:id ── */
router.delete("/:id", async (req, res) => {
  try {
    const activeLoans = await Loan.countDocuments({ member: req.params.id, status: "active" });
    if (activeLoans > 0) {
      req.flash("error", "Cannot remove a member with active loans");
      return res.redirect(`/members/${req.params.id}`);
    }
    const member = await Member.findByIdAndDelete(req.params.id);
    req.flash("success", `${member.name} removed from records`);
    res.redirect("/members");
  } catch (err) {
    req.flash("error", "Failed to remove member");
    res.redirect("/members");
  }
});

module.exports = router;
