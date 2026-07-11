import { describe, it, expect, beforeEach } from "vitest";
import {
  mintToken,
  verifyToken,
  consumeNonce,
  __resetConsumedNonces,
  OAUTH_SESSION_PURPOSE,
  MAX_TOKEN_TTL_MS,
  mintSessionToken,
  verifySessionToken,
  extractBearerToken,
  SESSION_PURPOSE,
  SESSION_TTL_MS,
} from "./authToken";

const SECRET = "test-secret-please-ignore-0123456789";

describe("authToken.mintToken / verifyToken", () => {
  it("mints a token that verifies with the same secret", () => {
    const now = 1_000_000;
    const token = mintToken({ email: "User@Example.com", secret: SECRET, now, nonce: "n1" });
    const result = verifyToken(token, SECRET, { now: now + 1000 });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.payload.email).toBe("user@example.com"); // normalized
      expect(result.payload.nonce).toBe("n1");
      expect(result.payload.purpose).toBe(OAUTH_SESSION_PURPOSE);
      expect(result.payload.exp).toBe(now + MAX_TOKEN_TTL_MS);
    }
  });

  it("clamps ttl to MAX_TOKEN_TTL_MS (<=120s)", () => {
    const now = 5_000;
    const token = mintToken({ email: "a@b.com", secret: SECRET, now, ttlMs: 10 * 60_000 });
    const result = verifyToken(token, SECRET, { now });
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.payload.exp).toBe(now + MAX_TOKEN_TTL_MS);
  });

  it("rejects an expired token", () => {
    const now = 1_000_000;
    const token = mintToken({ email: "a@b.com", secret: SECRET, now, ttlMs: 60_000 });
    const result = verifyToken(token, SECRET, { now: now + 60_001 });
    expect(result).toEqual({ valid: false, reason: "expired" });
  });

  it("rejects a token whose payload was tampered with", () => {
    const now = 1_000_000;
    const token = mintToken({ email: "victim@b.com", secret: SECRET, now, nonce: "n" });
    const [, sig] = token.split(".");
    const forgedPayload = Buffer.from(
      JSON.stringify({ email: "attacker@b.com", nonce: "n", exp: now + 60_000, purpose: OAUTH_SESSION_PURPOSE })
    ).toString("base64url");
    const forged = `${forgedPayload}.${sig}`;
    const result = verifyToken(forged, SECRET, { now });
    expect(result).toEqual({ valid: false, reason: "bad_signature" });
  });

  it("rejects a token signed with a different secret", () => {
    const now = 1_000_000;
    const token = mintToken({ email: "a@b.com", secret: "other-secret", now });
    const result = verifyToken(token, SECRET, { now });
    expect(result).toEqual({ valid: false, reason: "bad_signature" });
  });

  it("rejects a token with the wrong purpose", () => {
    const now = 1_000_000;
    const token = mintToken({ email: "a@b.com", secret: SECRET, now, purpose: "password-reset" });
    const result = verifyToken(token, SECRET, { now, expectedPurpose: OAUTH_SESSION_PURPOSE });
    expect(result).toEqual({ valid: false, reason: "wrong_purpose" });
  });

  it("rejects malformed / empty / missing-secret inputs", () => {
    expect(verifyToken("", SECRET)).toEqual({ valid: false, reason: "malformed" });
    expect(verifyToken("onlyonepart", SECRET)).toEqual({ valid: false, reason: "malformed" });
    expect(verifyToken("a.b.c", SECRET)).toEqual({ valid: false, reason: "malformed" });
    expect(verifyToken(mintToken({ email: "a@b.com", secret: SECRET }), "")).toEqual({
      valid: false,
      reason: "malformed",
    });
  });
});

describe("authToken.consumeNonce (single-use replay guard)", () => {
  beforeEach(() => __resetConsumedNonces());

  it("accepts the first use and rejects a replay of the same nonce", () => {
    const exp = Date.now() + 60_000;
    expect(consumeNonce("nonce-abc", exp)).toBe(true);
    expect(consumeNonce("nonce-abc", exp)).toBe(false);
    expect(consumeNonce("nonce-abc", exp)).toBe(false);
  });

  it("treats distinct nonces independently", () => {
    const exp = Date.now() + 60_000;
    expect(consumeNonce("n1", exp)).toBe(true);
    expect(consumeNonce("n2", exp)).toBe(true);
  });

  it("sweeps expired nonces so an old nonce value can be reused after expiry", () => {
    const now = 1_000_000;
    expect(consumeNonce("stale", now + 1_000, now)).toBe(true);
    // A later call past the entry's exp sweeps it; the value is then fresh again.
    expect(consumeNonce("stale", now + 1_000, now + 2_000)).toBe(true);
  });
});

describe("sessionToken.mint / verify (the identity bearer)", () => {
  it("mints a 30-day session that verifies and returns the normalized email", () => {
    const now = 1_000_000;
    const token = mintSessionToken({ email: "Person@Example.com", secret: SECRET, now });
    const result = verifySessionToken(token, SECRET, { now: now + 1000 });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.email).toBe("person@example.com");
      expect(result.payload.purpose).toBe(SESSION_PURPOSE);
      expect(result.payload.exp).toBe(now + SESSION_TTL_MS);
      expect(result.payload.iat).toBe(now);
    }
  });

  it("is reusable — the same token verifies many times (no single-use nonce)", () => {
    const token = mintSessionToken({ email: "a@b.com", secret: SECRET });
    expect(verifySessionToken(token, SECRET).valid).toBe(true);
    expect(verifySessionToken(token, SECRET).valid).toBe(true);
    expect(verifySessionToken(token, SECRET).valid).toBe(true);
  });

  it("rejects an expired session", () => {
    const now = 1_000_000;
    const token = mintSessionToken({ email: "a@b.com", secret: SECRET, now, ttlMs: 60_000 });
    expect(verifySessionToken(token, SECRET, { now: now + 60_001 })).toEqual({
      valid: false,
      reason: "expired",
    });
  });

  it("rejects a tampered payload (attacker swaps the email under a stolen sig)", () => {
    const now = 1_000_000;
    const token = mintSessionToken({ email: "victim@b.com", secret: SECRET, now });
    const [, sig] = token.split(".");
    const forgedPayload = Buffer.from(
      JSON.stringify({ email: "attacker@b.com", iat: now, exp: now + SESSION_TTL_MS, purpose: SESSION_PURPOSE })
    ).toString("base64url");
    expect(verifySessionToken(`${forgedPayload}.${sig}`, SECRET, { now })).toEqual({
      valid: false,
      reason: "bad_signature",
    });
  });

  it("rejects a session signed with a different secret", () => {
    const token = mintSessionToken({ email: "a@b.com", secret: "other-secret" });
    expect(verifySessionToken(token, SECRET)).toEqual({ valid: false, reason: "bad_signature" });
  });

  it("rejects an OAuth (single-use) token presented as a session — wrong purpose", () => {
    const oauth = mintToken({ email: "a@b.com", secret: SECRET });
    expect(verifySessionToken(oauth, SECRET)).toEqual({ valid: false, reason: "wrong_purpose" });
  });

  it("rejects malformed / missing inputs", () => {
    expect(verifySessionToken("", SECRET)).toEqual({ valid: false, reason: "malformed" });
    expect(verifySessionToken("only-one-part", SECRET)).toEqual({ valid: false, reason: "malformed" });
    expect(verifySessionToken(null, SECRET)).toEqual({ valid: false, reason: "malformed" });
    expect(verifySessionToken(mintSessionToken({ email: "a@b.com", secret: SECRET }), "")).toEqual({
      valid: false,
      reason: "malformed",
    });
  });
});

describe("extractBearerToken", () => {
  it("extracts a bearer token (case-insensitive scheme)", () => {
    expect(extractBearerToken("Bearer abc.def")).toBe("abc.def");
    expect(extractBearerToken("bearer abc.def")).toBe("abc.def");
    expect(extractBearerToken(["Bearer xyz"])).toBe("xyz");
  });
  it("returns null for absent / non-bearer headers", () => {
    expect(extractBearerToken(undefined)).toBeNull();
    expect(extractBearerToken("")).toBeNull();
    expect(extractBearerToken("Basic abc")).toBeNull();
    expect(extractBearerToken("Bearer ")).toBeNull();
  });
});
