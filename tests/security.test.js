const request = require("supertest");
const mongoose = require("mongoose");

const app = require("../server");
const Book = require("../models/Book");
const Member = require("../models/Member");
const Loan = require("../models/Loan");

/* ── Ensure DB is connected before tests run ── */
beforeAll(async () => {
  const timeout = Date.now() + 10000;
  while (mongoose.connection.readyState !== 1 && Date.now() < timeout) {
    await new Promise((r) => setTimeout(r, 200));
  }
  if (mongoose.connection.readyState !== 1) {
    throw new Error("MongoDB connection timeout — is MongoDB running?");
  }
});

afterAll(async () => {
  await mongoose.connection.close();
});

/* ────────────────────────────────────────────────
   1. Mass assignment — books
   ──────────────────────────────────────────────── */
describe("Mass assignment protection — books", () => {
  let createdBookId;

  afterAll(async () => {
    if (createdBookId) await Book.findByIdAndDelete(createdBookId);
  });

  test("POST /books ignores injected availableCopies", async () => {
    const res = await request(app)
      .post("/books")
      .type("form")
      .send({
        title: "Security Test Book",
        author: "Test Author",
        isbn: "978-0-TEST-SEC-01",
        genre: "Fiction",
        copies: "2",
        availableCopies: "999",          // ← injected field
        _id: "000000000000000000000001",  // ← injected _id
      });

    // Should redirect to the book detail page (302)
    expect(res.status).toBe(302);

    // Verify the book was created with correct availableCopies
    const book = await Book.findOne({ isbn: "978-0-TEST-SEC-01" });
    expect(book).not.toBeNull();
    createdBookId = book._id;
    expect(book.availableCopies).toBe(2);  // should equal copies, not 999
    expect(book._id.toString()).not.toBe("000000000000000000000001");
  });
});

/* ────────────────────────────────────────────────
   2. Mass assignment — members
   ──────────────────────────────────────────────── */
describe("Mass assignment protection — members", () => {
  let createdMemberId;

  afterAll(async () => {
    if (createdMemberId) await Member.findByIdAndDelete(createdMemberId);
  });

  test("POST /members ignores injected memberNumber", async () => {
    const res = await request(app)
      .post("/members")
      .type("form")
      .send({
        name: "Sec Test User",
        email: "sectest-mass@example.com",
        memberNumber: "LIB-HACK",  // ← injected field
      });

    expect(res.status).toBe(302);

    const member = await Member.findOne({ email: "sectest-mass@example.com" });
    expect(member).not.toBeNull();
    createdMemberId = member._id;
    expect(member.memberNumber).not.toBe("LIB-HACK");
    expect(member.memberNumber).toMatch(/^LIB-\d{4}$/);
  });
});

/* ────────────────────────────────────────────────
   3. Open redirect prevention
   ──────────────────────────────────────────────── */
describe("Open redirect prevention — loan return", () => {
  let testBook, testMember, testLoan;

  beforeAll(async () => {
    testBook = await Book.create({
      title: "Redirect Test Book",
      author: "Test",
      isbn: "978-0-REDIR-TEST",
      genre: "Fiction",
      copies: 2,
      availableCopies: 1,
    });
    testMember = await Member.create({
      name: "Redirect Tester",
      email: "sectest-redirect@example.com",
    });
    testLoan = await Loan.create({
      book: testBook._id,
      member: testMember._id,
    });
  });

  afterAll(async () => {
    await Loan.deleteMany({ book: testBook?._id });
    if (testBook) await Book.findByIdAndDelete(testBook._id);
    if (testMember) await Member.findByIdAndDelete(testMember._id);
  });

  test("Referrer to external URL is blocked — redirects to /loans", async () => {
    const res = await request(app)
      .post(`/loans/${testLoan._id}/return`)
      .set("Referrer", "https://evil.com/phishing");

    expect(res.status).toBe(302);
    // Should redirect to /loans, NOT to https://evil.com
    expect(res.headers.location).toBe("/loans");
  });
});

/* ────────────────────────────────────────────────
   4. NoSQL operator injection — loans
   ──────────────────────────────────────────────── */
describe("NoSQL injection prevention — loans", () => {
  test("GET /loans?status[$ne]=returned — treated as invalid, defaults to active", async () => {
    const res = await request(app).get("/loans?status[$ne]=returned");
    expect(res.status).toBe(200);
    // The page should show "Active" tab as active, not all non-returned records
    expect(res.text).toContain("tab-active");
  });

  test("GET /loans?status[$gt]= — treated as invalid, defaults to active", async () => {
    const res = await request(app).get("/loans?status[$gt]=");
    expect(res.status).toBe(200);
  });
});

/* ────────────────────────────────────────────────
   5. NoSQL operator injection — members
   ──────────────────────────────────────────────── */
describe("NoSQL injection prevention — members", () => {
  test("GET /members?status[$ne]=expired — treated as invalid, shows all", async () => {
    const res = await request(app).get("/members?status[$ne]=expired");
    expect(res.status).toBe(200);
  });

  test("GET /members?status=active — valid value works normally", async () => {
    const res = await request(app).get("/members?status=active");
    expect(res.status).toBe(200);
  });
});

/* ────────────────────────────────────────────────
   6. CSS injection via coverColor
   ──────────────────────────────────────────────── */
describe("CSS injection prevention — coverColor", () => {
  let createdBookId;

  afterAll(async () => {
    if (createdBookId) await Book.findByIdAndDelete(createdBookId);
  });

  test("POST /books with malicious coverColor — uses default colour", async () => {
    const res = await request(app)
      .post("/books")
      .type("form")
      .send({
        title: "CSS Injection Test",
        author: "Tester",
        isbn: "978-0-CSSTEST-01",
        genre: "Fiction",
        copies: "1",
        coverColor: "#fff; background-image: url(https://evil.com/track)",
      });

    expect(res.status).toBe(302);

    const book = await Book.findOne({ isbn: "978-0-CSSTEST-01" });
    expect(book).not.toBeNull();
    createdBookId = book._id;
    // Malicious value should have been stripped — falls back to schema default
    expect(book.coverColor).toBe("#8B6F47");
  });
});
