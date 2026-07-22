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
