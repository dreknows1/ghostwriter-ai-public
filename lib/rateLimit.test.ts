import { describe, it, expect } from "vitest";
import { checkRateLimit, getRequestClientId } from "./rateLimit";

describe("checkRateLimit", () => {
  it("allows requests up to the limit, then blocks", () => {
    const key = `test:allow-block:${Math.random()}`;
    for (let i = 0; i < 5; i++) {
      const r = checkRateLimit(key, 5, 60_000);
      expect(r.allowed).toBe(true);
      expect(r.remaining).toBe(5 - (i + 1));
    }
    const blocked = checkRateLimit(key, 5, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetAt).toBeGreaterThan(Date.now());
  });

  it("keeps separate counters per key", () => {
    const a = `test:sep-a:${Math.random()}`;
    const b = `test:sep-b:${Math.random()}`;
    expect(checkRateLimit(a, 1, 60_000).allowed).toBe(true);
    expect(checkRateLimit(a, 1, 60_000).allowed).toBe(false);
    // Different key is unaffected.
    expect(checkRateLimit(b, 1, 60_000).allowed).toBe(true);
  });

  it("resets the window once the window has elapsed", () => {
    const key = `test:reset:${Math.random()}`;
    // Zero-length window: the bucket is already expired on the next call.
    expect(checkRateLimit(key, 1, 0).allowed).toBe(true);
    expect(checkRateLimit(key, 1, 0).allowed).toBe(true);
  });
});

describe("getRequestClientId", () => {
  it("takes the first IP from a comma-separated x-forwarded-for", () => {
    expect(
      getRequestClientId({ headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" } })
    ).toBe("1.2.3.4");
  });

  it("handles an array-valued header", () => {
    expect(
      getRequestClientId({ headers: { "x-forwarded-for": ["9.9.9.9", "8.8.8.8"] } })
    ).toBe("9.9.9.9");
  });

  it("falls back to a sentinel when the header is absent", () => {
    expect(getRequestClientId({ headers: {} })).toBe("unknown-client");
  });
});
