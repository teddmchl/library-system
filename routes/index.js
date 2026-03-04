const express = require("express");
const router = express.Router();
const Book = require("../models/Book");
const Member = require("../models/Member");
const Loan = require("../models/Loan");

router.get("/", async (req, res) => {
  try {
    const [totalBooks, totalMembers, activeLoans, allLoans] = await Promise.all([
      Book.countDocuments(),
      Member.countDocuments({ status: "active" }),
      Loan.countDocuments({ status: "active" }),
      Loan.find({ status: "active" }).sort({ dueAt: 1 }).limit(50),
    ]);

    // Mark overdue
    const overdueLoans = allLoans.filter((l) => l.isOverdue);
    const recentBooks = await Book.find().sort({ createdAt: -1 }).limit(6);

    // Genre breakdown
    const genreAgg = await Book.aggregate([
      { $group: { _id: "$genre", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]);

    res.render("index", {
      title: "Dashboard",
      stats: {
        totalBooks,
        totalMembers,
        activeLoans,
        overdueCount: overdueLoans.length,
      },
      recentBooks,
      overdueLoans: overdueLoans.slice(0, 5),
      genreBreakdown: genreAgg,
    });
  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to load dashboard");
    res.render("index", { title: "Dashboard", stats: {}, recentBooks: [], overdueLoans: [], genreBreakdown: [] });
  }
});

module.exports = router;
