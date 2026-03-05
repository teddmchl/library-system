const escapeRegex = require("../utils/escapeRegex");

describe("escapeRegex", () => {
  test("returns plain string unchanged", () => {
    expect(escapeRegex("hello world")).toBe("hello world");
  });

  test("escapes dots", () => {
    expect(escapeRegex("foo.bar")).toBe("foo\\.bar");
  });

  test("escapes asterisks", () => {
    expect(escapeRegex("a*b")).toBe("a\\*b");
  });

  test("escapes question marks", () => {
    expect(escapeRegex("is this ok?")).toBe("is this ok\\?");
  });

  test("escapes parentheses", () => {
    expect(escapeRegex("(group)")).toBe("\\(group\\)");
  });

  test("escapes square brackets", () => {
    expect(escapeRegex("[abc]")).toBe("\\[abc\\]");
  });

  test("escapes curly braces", () => {
    expect(escapeRegex("{1,3}")).toBe("\\{1,3\\}");
  });

  test("escapes caret and dollar", () => {
    expect(escapeRegex("^start$end")).toBe("\\^start\\$end");
  });

  test("escapes plus sign", () => {
    expect(escapeRegex("a+b")).toBe("a\\+b");
  });

  test("escapes backslash", () => {
    expect(escapeRegex("back\\slash")).toBe("back\\\\slash");
  });

  test("escapes pipe", () => {
    expect(escapeRegex("a|b")).toBe("a\\|b");
  });

  test("handles combined ReDoS payload", () => {
    // Classic payload: (a+)+$ — without escaping this causes catastrophic backtracking
    const payload = "(a+)+$";
    const escaped = escapeRegex(payload);
    expect(escaped).toBe("\\(a\\+\\)\\+\\$");

    // Verify the escaped string is safe to use in a regex
    const re = new RegExp(escaped);
    expect(re.test("(a+)+$")).toBe(true);
    expect(re.test("hello")).toBe(false);
  });

  test("handles empty string", () => {
    expect(escapeRegex("")).toBe("");
  });

  test("handles string with no special characters", () => {
    expect(escapeRegex("The Great Gatsby")).toBe("The Great Gatsby");
  });
});
