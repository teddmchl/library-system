const request = require("supertest");
const mongoose = require("mongoose");

// The app requires a running MongoDB instance.
// Tests use the same database configured via MONGODB_URI (or the default local DB).
const app = require("../server");

/* ── Ensure DB is connected before tests run ── */
beforeAll(async () => {
  // wait up to 10s for mongoose to be connected
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
   1. Core page routes return 200
   ──────────────────────────────────────────────── */
describe("Core routes respond with 200", () => {
  test("GET / — Dashboard", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.text).toContain("Ashbrook");
  });

  test("GET /books — Catalogue", async () => {
    const res = await request(app).get("/books");
    expect(res.status).toBe(200);
    expect(res.text).toContain("Catalogue");
  });

  test("GET /members — Members list", async () => {
    const res = await request(app).get("/members");
    expect(res.status).toBe(200);
    expect(res.text).toContain("Members");
  });

  test("GET /loans — Loans list", async () => {
    const res = await request(app).get("/loans");
    expect(res.status).toBe(200);
    expect(res.text).toContain("Loans");
  });
});

/* ────────────────────────────────────────────────
   2. CRUD form pages return 200
   ──────────────────────────────────────────────── */
describe("CRUD form pages respond with 200", () => {
  test("GET /books/new — Add Book form", async () => {
    const res = await request(app).get("/books/new");
    expect(res.status).toBe(200);
    expect(res.text).toContain("Add Book");
  });

  test("GET /members/new — New Member form", async () => {
    const res = await request(app).get("/members/new");
    expect(res.status).toBe(200);
    expect(res.text).toContain("New Member");
  });

  test("GET /loans/new — Check Out form", async () => {
    const res = await request(app).get("/loans/new");
    expect(res.status).toBe(200);
    expect(res.text).toContain("Check Out");
  });
});

/* ────────────────────────────────────────────────
   3. Search with special chars (ReDoS fix verification)
   ──────────────────────────────────────────────── */
describe("ReDoS-safe search", () => {
  test("GET /books?q=(a+)+$ — does not hang or crash", async () => {
    const res = await request(app).get("/books?q=(a%2B)%2B%24");
    expect(res.status).toBe(200);
  }, 5000); // fail if takes > 5s (would indicate ReDoS)

  test("GET /members?q=(a+)+$ — does not hang or crash", async () => {
    const res = await request(app).get("/members?q=(a%2B)%2B%24");
    expect(res.status).toBe(200);
  }, 5000);

  test("GET /books?q=.*  — escapes wildcard chars", async () => {
    const res = await request(app).get("/books?q=.*");
    expect(res.status).toBe(200);
  });

  test("GET /members?q=[test] — escapes bracket chars", async () => {
    const res = await request(app).get("/members?q=%5Btest%5D");
    expect(res.status).toBe(200);
  });
});

/* ────────────────────────────────────────────────
   4. 404 page
   ──────────────────────────────────────────────── */
describe("404 handling", () => {
  test("GET /nonexistent — returns 404", async () => {
    const res = await request(app).get("/this-page-does-not-exist");
    expect(res.status).toBe(404);
    expect(res.text).toContain("Page Not Found");
  });
});

/* ────────────────────────────────────────────────
   5. Security headers (Helmet verification)
   ──────────────────────────────────────────────── */
describe("Security headers", () => {
  test("Response includes Helmet security headers", async () => {
    const res = await request(app).get("/");
    // Helmet sets these by default
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-frame-options"]).toBeDefined();
  });

  test("Content-Security-Policy is set", async () => {
    const res = await request(app).get("/");
    expect(res.headers["content-security-policy"]).toBeDefined();
    expect(res.headers["content-security-policy"]).toContain("default-src");
  });
});

/* ────────────────────────────────────────────────
   6. Meta tags (OG tags verification)
   ──────────────────────────────────────────────── */
describe("Meta tags", () => {
  test("Pages include meta description", async () => {
    const res = await request(app).get("/");
    expect(res.text).toContain('meta name="description"');
  });

  test("Pages include OG tags", async () => {
    const res = await request(app).get("/");
    expect(res.text).toContain('property="og:title"');
    expect(res.text).toContain('property="og:description"');
    expect(res.text).toContain('property="og:type"');
  });
});
