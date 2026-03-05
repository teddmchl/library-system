const express = require("express");
const router = express.Router();
const Loan = require("../models/Loan");
const Book = require("../models/Book");
const Member = require("../models/Member");

const VALID_STATUSES = ["active", "overdue", "returned", "all"];

/* ── GET /loans — all active loans ── */
router.get("/", async (req, res) => {
  try {
    const { status = "active", sort = "due" } = req.query;
    const statusParam = VALID_STATUSES.includes(status) ? status : "active";

    const query = statusParam === "all" ? {} : { status: statusParam };
    const sortMap = {
      due: { dueAt: 1 },
      recent: { borrowedAt: -1 },
      member: { "member.name": 1 },
    };

    const loans = await Loan.find(query).sort(sortMap[sort] || { dueAt: 1 });

    // Mark and update overdue
    const now = new Date();
    const toUpdate = loans.filter((l) => l.status === "active" && l.dueAt < now);
    if (toUpdate.length) {
      await Loan.updateMany(
        { _id: { $in: toUpdate.map((l) => l._id) } },
        { status: "overdue" }
      );
      toUpdate.forEach((l) => (l.status = "overdue"));
    }

    res.render("loans/index", {
      title: "Loans",
      loans,
      query: req.query,
      activeStatus: statusParam,
    });
  } catch (err) {
    req.flash("error", "Could not load loans");
    res.redirect("/");
  }
});

/* ── GET /loans/new — checkout form ── */
router.get("/new", async (req, res) => {
  try {
    const members = await Member.find({ status: "active" }).sort({ name: 1 });
    const books = await Book.find({ availableCopies: { $gt: 0 } }).sort({ title: 1 });
    const preselectedBook = req.query.book || null;
    const preselectedMember = req.query.member || null;

    res.render("loans/new", {
      title: "Check Out",
      members,
      books,
      preselectedBook,
      preselectedMember,
    });
  } catch (err) {
    req.flash("error", "Could not load checkout form");
    res.redirect("/loans");
  }
});

/* ── POST /loans — create loan ── */
router.post("/", async (req, res) => {
  try {
    const { book: bookId, member: memberId, notes } = req.body;

    const book = await Book.findById(bookId);
    if (!book || book.availableCopies < 1) {
      req.flash("error", "This book is not available for checkout");
      return res.redirect("/loans/new");
    }

    const member = await Member.findById(memberId);
    if (!member || member.status !== "active") {
      req.flash("error", "Member account is not active");
      return res.redirect("/loans/new");
    }

    // Check if member already has this book
    const existing = await Loan.findOne({ book: bookId, member: memberId, status: { $in: ["active", "overdue"] } });
    if (existing) {
      req.flash("error", `${member.name} already has this book checked out`);
      return res.redirect("/loans/new");
    }

    await Loan.create({ book: bookId, member: memberId, notes });
    await Book.findByIdAndUpdate(bookId, { $inc: { availableCopies: -1 } });

    req.flash("success", `"${book.title}" checked out to ${member.name} — due in 14 days`);
    res.redirect(`/members/${memberId}`);
  } catch (err) {
    req.flash("error", "Checkout failed");
    res.redirect("/loans/new");
  }
});

/* ── POST /loans/:id/return — return a book ── */
router.post("/:id/return", async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) { req.flash("error", "Loan not found"); return res.redirect("/loans"); }
    if (loan.returnedAt) { req.flash("error", "This book has already been returned"); return res.redirect("/loans"); }

    await Loan.findByIdAndUpdate(req.params.id, {
      returnedAt: new Date(),
      status: "returned",
    });
    await Book.findByIdAndUpdate(loan.book._id, { $inc: { availableCopies: 1 } });

    const bookTitle = loan.book?.title || "Book";
    const memberName = loan.member?.name || "Member";
    req.flash("success", `"${bookTitle}" returned by ${memberName}`);

    // Redirect back — only allow same-origin paths (prevent open redirect)
    const ref = req.get("Referrer") || "/loans";
    const safeRef = ref.startsWith("/") ? ref : "/loans";
    res.redirect(safeRef);
  } catch (err) {
    req.flash("error", "Return failed");
    res.redirect("/loans");
  }
});

module.exports = router;
