import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import {
  validateAppleClaims,
  APPLE_ISSUER,
  APPLE_AUDIENCE,
  type AppleClaims,
} from "./appleAuth";

const NOW = 1_700_000_000; // seconds
const NONCE = "raw-nonce-abc123";

function baseClaims(overrides: Partial<AppleClaims> = {}): AppleClaims {
  return {
    iss: APPLE_ISSUER,
    aud: APPLE_AUDIENCE,
    exp: NOW + 600,
    sub: "001234.abcdef",
    email: "user@example.com",
    nonce: NONCE,
    ...overrides,
  };
}

describe("validateAppleClaims", () => {
  it("accepts valid claims and returns the normalized email", () => {
    const r = validateAppleClaims(baseClaims({ email: "User@Example.com" }), { nonce: NONCE, now: NOW });
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.email).toBe("user@example.com");
      expect(r.sub).toBe("001234.abcdef");
      expect(r.isPrivateEmail).toBe(false);
    }
  });

  it("accepts an audience array containing our bundle id", () => {
    const r = validateAppleClaims(baseClaims({ aud: ["other.app", APPLE_AUDIENCE] }), { nonce: NONCE, now: NOW });
    expect(r.valid).toBe(true);
  });

  it("handles Hide-My-Email private relay addresses", () => {
    const relay = "abc123@privaterelay.appleid.com";
    const r = validateAppleClaims(baseClaims({ email: relay, is_private_email: "true" }), {
      nonce: NONCE,
      now: NOW,
    });
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.email).toBe(relay);
      expect(r.isPrivateEmail).toBe(true);
    }
  });

  it("accepts a SHA-256-hashed nonce claim (Firebase-style convention)", () => {
    const hashed = createHash("sha256").update(NONCE).digest("hex");
    const r = validateAppleClaims(baseClaims({ nonce: hashed }), { nonce: NONCE, now: NOW });
    expect(r.valid).toBe(true);
  });

  it("returns null email when Apple omits it (later logins)", () => {
    const c = baseClaims();
    delete c.email;
    const r = validateAppleClaims(c, { nonce: NONCE, now: NOW });
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.email).toBeNull();
  });

  it("rejects a bad issuer", () => {
    const r = validateAppleClaims(baseClaims({ iss: "https://evil.example.com" }), { nonce: NONCE, now: NOW });
    expect(r).toEqual({ valid: false, reason: "bad_issuer" });
  });

  it("rejects a wrong audience (token minted for another app)", () => {
    const r = validateAppleClaims(baseClaims({ aud: "com.someone.else" }), { nonce: NONCE, now: NOW });
    expect(r).toEqual({ valid: false, reason: "bad_audience" });
  });

  it("rejects an expired token", () => {
    const r = validateAppleClaims(baseClaims({ exp: NOW - 1 }), { nonce: NONCE, now: NOW });
    expect(r).toEqual({ valid: false, reason: "expired" });
  });

  it("rejects a mismatched nonce (replay / different session)", () => {
    const r = validateAppleClaims(baseClaims({ nonce: "someone-elses-nonce" }), { nonce: NONCE, now: NOW });
    expect(r).toEqual({ valid: false, reason: "nonce_mismatch" });
  });

  it("rejects when the caller supplies no expected nonce", () => {
    const r = validateAppleClaims(baseClaims(), { nonce: "", now: NOW });
    expect(r).toEqual({ valid: false, reason: "missing_nonce" });
  });

  it("rejects when the token carries no nonce claim", () => {
    const c = baseClaims();
    delete c.nonce;
    const r = validateAppleClaims(c, { nonce: NONCE, now: NOW });
    expect(r).toEqual({ valid: false, reason: "nonce_mismatch" });
  });
});
