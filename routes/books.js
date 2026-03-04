const express = require("express");
const router = express.Router();
const Book = require("../models/Book");
const Loan = require("../models/Loan");

/** Escape special regex characters to prevent ReDoS attacks */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const GENRES = [
  "Fiction","Non-Fiction","Science","History","Biography",
  "Philosophy","Poetry","Mystery","Science Fiction","Children","Art","Technology",
];

/* ── GET /books — catalog with search & filter ── */
router.get("/", async (req, res) => {
  try {
    const { q, genre, available, sort = "title" } = req.query;
    const query = {};

    if (q) {
      const safe = escapeRegex(q.trim());
      query.$or = [
        { title: { $regex: safe, $options: "i" } },
        { author: { $regex: safe, $options: "i" } },
        { isbn: { $regex: safe, $options: "i" } },
      ];
    }
    if (genre) query.genre = genre;
    if (available === "1") query.availableCopies = { $gt: 0 };

    const sortMap = {
      title: { title: 1 },
      author: { author: 1 },
      newest: { createdAt: -1 },
      oldest: { publishedYear: 1 },
    };

    const books = await Book.find(query).sort(sortMap[sort] || { title: 1 });

    res.render("books/index", {
      title: "Catalogue",
      books,
      genres: GENRES,
      query: req.query,
    });
  } catch (err) {
    req.flash("error", "Could not load catalogue");
    res.redirect("/");
  }
});

/* ── GET /books/new ── */
router.get("/new", (req, res) => {
  res.render("books/new", { title: "Add Book", genres: GENRES, book: {} });
});

/* ── POST /books ── */
router.post("/", async (req, res) => {
  try {
    const copies = parseInt(req.body.copies) || 1;
    const book = await Book.create({ ...req.body, copies, availableCopies: copies });
    req.flash("success", `"${book.title}" added to the catalogue`);
    res.redirect(`/books/${book._id}`);
  } catch (err) {
    req.flash("error", err.code === 11000 ? "A book with that ISBN already exists" : "Failed to add book");
    res.render("books/new", { title: "Add Book", genres: GENRES, book: req.body });
  }
});

/* ── GET /books/:id ── */
router.get("/:id", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) { req.flash("error", "Book not found"); return res.redirect("/books"); }

    const activeLoans = await Loan.find({ book: book._id, status: "active" });
    const loanHistory = await Loan.find({ book: book._id, status: "returned" })
      .sort({ returnedAt: -1 })
      .limit(10);

    res.render("books/show", { title: book.title, book, activeLoans, loanHistory });
  } catch (err) {
    req.flash("error", "Book not found");
    res.redirect("/books");
  }
});

/* ── GET /books/:id/edit ── */
router.get("/:id/edit", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) { req.flash("error", "Book not found"); return res.redirect("/books"); }
    res.render("books/edit", { title: `Edit — ${book.title}`, book, genres: GENRES });
  } catch (err) {
    res.redirect("/books");
  }
});

/* ── PUT /books/:id ── */
router.put("/:id", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) { req.flash("error", "Book not found"); return res.redirect("/books"); }

    const newCopies = parseInt(req.body.copies) || book.copies;
    const diff = newCopies - book.copies;
    req.body.availableCopies = Math.max(0, book.availableCopies + diff);
    req.body.copies = newCopies;

    await Book.findByIdAndUpdate(req.params.id, req.body, { runValidators: true });
    req.flash("success", "Book updated");
    res.redirect(`/books/${req.params.id}`);
  } catch (err) {
    req.flash("error", "Failed to update book");
    res.redirect(`/books/${req.params.id}/edit`);
  }
});

/* ── DELETE /books/:id ── */
router.delete("/:id", async (req, res) => {
  try {
    const activeLoans = await Loan.countDocuments({ book: req.params.id, status: "active" });
    if (activeLoans > 0) {
      req.flash("error", "Cannot remove a book with active loans");
      return res.redirect(`/books/${req.params.id}`);
    }
    const book = await Book.findByIdAndDelete(req.params.id);
    req.flash("success", `"${book.title}" removed from catalogue`);
    res.redirect("/books");
  } catch (err) {
    req.flash("error", "Failed to remove book");
    res.redirect("/books");
  }
});

module.exports = router;
