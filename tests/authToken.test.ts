import { describe, it, expect } from "vitest";
import {
  mintSessionToken,
  verifySessionToken,
  extractBearerToken,
  mintToken,
  verifyToken,
  consumeNonce,
  __resetConsumedNonces,
  OAUTH_SESSION_PURPOSE,
  mintPasswordSetToken,
  verifyPasswordSetToken,
  PASSWORD_SET_TTL_MS,
} from "../lib/authToken";

const SECRET = "test-secret-please-ignore-0123456789abcdef";

describe("session token — the requireSession bearer", () => {
  it("round-trips: a freshly minted token verifies and yields its (normalized) email", () => {
    const token = mintSessionToken({ email: "Alice@Example.com", secret: SECRET });
    const res = verifySessionToken(token, SECRET);
    expect(res.valid).toBe(true);
    if (res.valid) expect(res.email).toBe("alice@example.com");
  });

  it("rejects a tampered signature", () => {
    const token = mintSessionToken({ email: "a@b.com", secret: SECRET });
    const [payload] = token.split(".");
    expect(verifySessionToken(`${payload}.deadbeef`, SECRET).valid).toBe(false);
  });

  it("rejects a token signed with a different secret (no forgery)", () => {
    const token = mintSessionToken({ email: "a@b.com", secret: SECRET });
    expect(verifySessionToken(token, "some-other-secret").valid).toBe(false);
  });

  it("rejects an expired token", () => {
    const now = Date.now();
    const token = mintSessionToken({ email: "a@b.com", secret: SECRET, now: now - 10_000, ttlMs: 1_000 });
    expect(verifySessionToken(token, SECRET, { now }).valid).toBe(false);
  });

  it("rejects an oauth-purpose token presented as a session token (purpose isolation)", () => {
    const oauth = mintToken({ email: "a@b.com", secret: SECRET });
    expect(verifySessionToken(oauth, SECRET).valid).toBe(false);
  });

  it("rejects a missing token or missing secret", () => {
    expect(verifySessionToken(undefined, SECRET).valid).toBe(false);
    const good = mintSessionToken({ email: "a@b.com", secret: SECRET });
    expect(verifySessionToken(good, undefined).valid).toBe(false);
  });
});

describe("extractBearerToken", () => {
  it("parses a Bearer header (case-insensitive)", () => {
    expect(extractBearerToken("Bearer abc.def")).toBe("abc.def");
    expect(extractBearerToken("bearer   xyz")).toBe("xyz");
  });
  it("returns null for non-bearer or missing headers", () => {
    expect(extractBearerToken(undefined)).toBeNull();
    expect(extractBearerToken("Basic abc")).toBeNull();
    expect(extractBearerToken("")).toBeNull();
  });
});

describe("oauth single-use token — closes the bare-email oauth hole", () => {
  it("mints with the oauth purpose and clamps ttl to <= 120s", () => {
    const now = Date.now();
    const token = mintToken({ email: "a@b.com", secret: SECRET, ttlMs: 999_999, now });
    const res = verifyToken(token, SECRET, { now });
    expect(res.valid).toBe(true);
    if (res.valid) {
      expect(res.payload.purpose).toBe(OAUTH_SESSION_PURPOSE);
      expect(res.payload.exp - now).toBeLessThanOrEqual(120_000);
    }
  });

  it("consumeNonce is single-use (replay rejected)", () => {
    __resetConsumedNonces();
    const exp = Date.now() + 60_000;
    expect(consumeNonce("nonce-1", exp)).toBe(true);
    expect(consumeNonce("nonce-1", exp)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// PASSWORD-SET token. The security question this suite answers: can a link that
// lets someone set a password on an EXISTING account be forged, replayed,
// stretched, or swapped in for the far more powerful OAuth token?
// ---------------------------------------------------------------------------
describe("password-set token — the emailed set/reset link", () => {
  it("round-trips: a freshly minted link verifies and carries the normalized email", () => {
    const token = mintPasswordSetToken({ email: "  John@Example.COM ", secret: SECRET });
    const res = verifyPasswordSetToken(token, SECRET);
    expect(res.valid).toBe(true);
    if (res.valid) expect(res.payload.email).toBe("john@example.com");
  });

  it("rejects a tampered signature", () => {
    const token = mintPasswordSetToken({ email: "a@b.com", secret: SECRET });
    const [payload] = token.split(".");
    expect(verifyPasswordSetToken(`${payload}.deadbeef`, SECRET).valid).toBe(false);
  });

  it("rejects a link signed with a different secret (no forgery)", () => {
    const token = mintPasswordSetToken({ email: "a@b.com", secret: SECRET });
    expect(verifyPasswordSetToken(token, "some-other-secret").valid).toBe(false);
  });

  it("rejects an expired link", () => {
    const now = Date.now();
    const token = mintPasswordSetToken({ email: "a@b.com", secret: SECRET, ttlMs: 1000, now });
    expect(verifyPasswordSetToken(token, SECRET, { now: now + 500 }).valid).toBe(true);
    expect(verifyPasswordSetToken(token, SECRET, { now: now + 1001 }).valid).toBe(false);
  });

  it("clamps the lifetime to one hour even if a longer TTL is requested", () => {
    const now = Date.now();
    const token = mintPasswordSetToken({
      email: "a@b.com",
      secret: SECRET,
      ttlMs: 30 * 24 * 60 * 60 * 1000, // a month
      now,
    });
    // Still dead one millisecond past the cap.
    expect(verifyPasswordSetToken(token, SECRET, { now: now + PASSWORD_SET_TTL_MS + 1 }).valid).toBe(false);
  });

  // THE IMPORTANT ONE: purposes must not be interchangeable. A password-set
  // link must never be redeemable at the OAuth session-mint endpoint, and an
  // OAuth token must never be redeemable as a password-set link.
  it("is not interchangeable with the OAuth session token (purpose is enforced)", () => {
    const pwToken = mintPasswordSetToken({ email: "a@b.com", secret: SECRET });
    const oauthToken = mintToken({ email: "a@b.com", secret: SECRET, purpose: OAUTH_SESSION_PURPOSE });

    // password-set link presented where an OAuth token is expected → rejected
    const asOauth = verifyToken(pwToken, SECRET, { expectedPurpose: OAUTH_SESSION_PURPOSE });
    expect(asOauth.valid).toBe(false);
    if (!asOauth.valid) expect(asOauth.reason).toBe("wrong_purpose");

    // OAuth token presented as a password-set link → rejected
    const asPwSet = verifyPasswordSetToken(oauthToken, SECRET);
    expect(asPwSet.valid).toBe(false);
    if (!asPwSet.valid) expect(asPwSet.reason).toBe("wrong_purpose");
  });

  it("carries a unique nonce per mint, so each link can be consumed exactly once", () => {
    __resetConsumedNonces();
    const a = mintPasswordSetToken({ email: "a@b.com", secret: SECRET });
    const b = mintPasswordSetToken({ email: "a@b.com", secret: SECRET });
    const ra = verifyPasswordSetToken(a, SECRET);
    const rb = verifyPasswordSetToken(b, SECRET);
    expect(ra.valid && rb.valid).toBe(true);
    if (!ra.valid || !rb.valid) return;

    expect(ra.payload.nonce).not.toBe(rb.payload.nonce);
    // First presentation wins; the same link replayed is refused.
    expect(consumeNonce(ra.payload.nonce, ra.payload.exp)).toBe(true);
    expect(consumeNonce(ra.payload.nonce, ra.payload.exp)).toBe(false);
    // A different link is unaffected.
    expect(consumeNonce(rb.payload.nonce, rb.payload.exp)).toBe(true);
  });

  it("refuses to mint without a secret", () => {
    expect(() => mintPasswordSetToken({ email: "a@b.com", secret: "" })).toThrow();
  });
});
