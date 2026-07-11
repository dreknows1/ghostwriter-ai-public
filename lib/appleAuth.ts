/**
 * Pure claim-validation for Sign in with Apple identity tokens (docs/PLAN.md
 * "Auth on iOS" — verify iss/aud/nonce/exp, handle relay email).
 *
 * The cryptographic signature check (JWKS lookup + RS256 verification) lives in
 * `api/auth-apple.ts` via `jose`. This module holds the *claim* checks so they
 * are unit-testable without network or key material, and doubles as
 * defense-in-depth: even though `jose.jwtVerify` already enforces iss/aud/exp,
 * we re-assert them here alongside the nonce check that jose does not do.
 */
import { createHash, timingSafeEqual } from "node:crypto";

export const APPLE_ISSUER = "https://appleid.apple.com";
export const APPLE_JWKS_URL = "https://appleid.apple.com/auth/keys";
/** iOS bundle id — the `aud` Apple stamps into tokens minted for our app. */
export const APPLE_AUDIENCE = "com.songghost.app";

export type AppleClaims = {
  iss?: string;
  aud?: string | string[];
  exp?: number; // seconds since epoch
  sub?: string;
  email?: string;
  email_verified?: boolean | string;
  is_private_email?: boolean | string;
  nonce?: string;
  [k: string]: unknown;
};

export type AppleValidation =
  | { valid: true; email: string | null; sub: string | null; isPrivateEmail: boolean }
  | {
      valid: false;
      reason: "bad_issuer" | "bad_audience" | "expired" | "nonce_mismatch" | "missing_nonce";
    };

function audienceMatches(aud: string | string[] | undefined, expected: string): boolean {
  if (aud === undefined) return false;
  return Array.isArray(aud) ? aud.includes(expected) : aud === expected;
}

function coerceBool(v: boolean | string | undefined): boolean {
  return v === true || v === "true";
}

/** Timing-safe string equality over UTF-8 bytes. */
function safeStrEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * Validate the Apple identity-token claims.
 *
 * Nonce handling: the native client sends the same nonce to the Apple plugin and
 * to our server. Apple echoes it into the `nonce` claim. Some client conventions
 * hash the nonce before handing it to Apple (SHA-256 hex), so we accept the
 * claim matching EITHER the raw expected nonce OR its SHA-256 hex digest.
 */
export function validateAppleClaims(
  claims: AppleClaims,
  opts: { nonce: string; now?: number; audience?: string }
): AppleValidation {
  const nowSec = opts.now ?? Math.floor(Date.now() / 1000);
  const audience = opts.audience ?? APPLE_AUDIENCE;

  if (claims.iss !== APPLE_ISSUER) return { valid: false, reason: "bad_issuer" };
  if (!audienceMatches(claims.aud, audience)) return { valid: false, reason: "bad_audience" };
  if (typeof claims.exp !== "number" || !(claims.exp > nowSec)) {
    return { valid: false, reason: "expired" };
  }

  if (!opts.nonce) return { valid: false, reason: "missing_nonce" };
  const claimNonce = typeof claims.nonce === "string" ? claims.nonce : "";
  if (!claimNonce) return { valid: false, reason: "nonce_mismatch" };
  const hashedExpected = createHash("sha256").update(opts.nonce).digest("hex");
  const nonceOk =
    safeStrEqual(claimNonce, opts.nonce) || safeStrEqual(claimNonce, hashedExpected);
  if (!nonceOk) return { valid: false, reason: "nonce_mismatch" };

  const email = typeof claims.email === "string" && claims.email ? claims.email.toLowerCase().trim() : null;
  const sub = typeof claims.sub === "string" && claims.sub ? claims.sub : null;
  return { valid: true, email, sub, isPrivateEmail: coerceBool(claims.is_private_email) };
}
