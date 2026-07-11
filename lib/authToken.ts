/**
 * Signed single-use token for the OAuth / Sign-in-with-Apple → session-mint
 * handshake (docs/PLAN.md "Auth on iOS", SECURITY FIX).
 *
 * THE HOLE THIS CLOSES: `api/auth.ts` `action:"oauth"` used to mint a session
 * for any bare email posted to it — no proof the caller had actually completed
 * an OAuth exchange. Anyone could POST `{action:"oauth", email:"victim@x.com"}`
 * and receive a valid session.
 *
 * THE FIX: the OAuth callback (`api/oauth/callback.ts`) and the Apple verify
 * endpoint are the only places that can prove an identity. After a successful
 * provider exchange they mint an HMAC token binding {email, nonce, exp,
 * purpose} under AUTH_TOKEN_SECRET. `api/auth.ts` `action:"oauth"` then REQUIRES
 * a valid, unexpired, un-replayed token and derives the email FROM the token —
 * never from a caller-supplied field.
 *
 * SINGLE-USE STRATEGY (two layers, defense in depth):
 *  1. A SHORT expiry (<=120s, enforced here) bounds every token's replay window.
 *  2. Consumption is tracked so a token cannot be redeemed twice. The
 *     AUTHORITATIVE store is the Convex `authNonces` table
 *     (`convex/authNonces.ts` `consume`), which api/auth.ts calls before minting
 *     a session — that survives serverless statelessness and is atomic across
 *     cold instances. The in-process `consumeNonce` below is a cheap same-instance
 *     fast-reject and the pure-function unit-test target; it is NOT the source of
 *     truth on its own (a warm instance only sees its own consumptions).
 *
 * The pure functions in this module (mint/verify/consumeNonce) are deliberately
 * dependency-free so they unit-test without a live Convex or Vercel runtime.
 */
import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";

export const OAUTH_SESSION_PURPOSE = "oauth-session";

/** Hard cap on token lifetime. Tokens are always minted with exp <= now + this. */
export const MAX_TOKEN_TTL_MS = 120_000; // 120 seconds

export type TokenPayload = {
  email: string;
  nonce: string;
  /** Absolute expiry, epoch milliseconds. */
  exp: number;
  purpose: string;
};

export type VerifyResult =
  | { valid: true; payload: TokenPayload }
  | { valid: false; reason: "malformed" | "bad_signature" | "wrong_purpose" | "expired" };

function encodePayload(payload: TokenPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function sign(payloadB64: string, secret: string): string {
  return createHmac("sha256", secret).update(payloadB64).digest("base64url");
}

/**
 * Mint a signed token. `ttlMs` is clamped to MAX_TOKEN_TTL_MS. A random nonce is
 * generated unless one is supplied (tests may inject one for determinism).
 */
export function mintToken(opts: {
  email: string;
  secret: string;
  purpose?: string;
  ttlMs?: number;
  now?: number;
  nonce?: string;
}): string {
  if (!opts.secret) throw new Error("mintToken: missing secret");
  const now = opts.now ?? Date.now();
  const ttl = Math.min(opts.ttlMs ?? MAX_TOKEN_TTL_MS, MAX_TOKEN_TTL_MS);
  const payload: TokenPayload = {
    email: opts.email.toLowerCase().trim(),
    nonce: opts.nonce ?? randomBytes(16).toString("hex"),
    exp: now + ttl,
    purpose: opts.purpose ?? OAUTH_SESSION_PURPOSE,
  };
  const payloadB64 = encodePayload(payload);
  const sig = sign(payloadB64, opts.secret);
  return `${payloadB64}.${sig}`;
}

/**
 * Verify a token's signature (timing-safe), purpose, and expiry. Does NOT
 * consume the nonce — callers must additionally call `consumeNonce` to enforce
 * single use.
 */
export function verifyToken(
  token: string | undefined | null,
  secret: string | undefined | null,
  opts?: { expectedPurpose?: string; now?: number }
): VerifyResult {
  if (!token || !secret) return { valid: false, reason: "malformed" };
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return { valid: false, reason: "malformed" };
  const [payloadB64, providedSig] = parts;

  // Timing-safe signature comparison. Compare raw HMAC bytes; a length mismatch
  // (e.g. truncated signature) fails before timingSafeEqual, which throws on
  // unequal-length buffers.
  const expectedSig = sign(payloadB64, secret);
  const expectedBuf = Buffer.from(expectedSig, "base64url");
  const providedBuf = Buffer.from(providedSig, "base64url");
  if (expectedBuf.length !== providedBuf.length) return { valid: false, reason: "bad_signature" };
  if (!timingSafeEqual(expectedBuf, providedBuf)) return { valid: false, reason: "bad_signature" };

  let payload: TokenPayload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return { valid: false, reason: "malformed" };
  }
  if (
    !payload ||
    typeof payload.email !== "string" ||
    typeof payload.nonce !== "string" ||
    typeof payload.exp !== "number" ||
    typeof payload.purpose !== "string"
  ) {
    return { valid: false, reason: "malformed" };
  }

  const expectedPurpose = opts?.expectedPurpose ?? OAUTH_SESSION_PURPOSE;
  if (payload.purpose !== expectedPurpose) return { valid: false, reason: "wrong_purpose" };

  const now = opts?.now ?? Date.now();
  if (!(payload.exp > now)) return { valid: false, reason: "expired" };

  return { valid: true, payload };
}

// ---------------------------------------------------------------------------
// SESSION token — the server-verified identity bearer (SECURITY HOTFIX).
//
// Distinct from the single-use OAUTH token above: a session token is REUSABLE
// (no nonce, no consumption) and long-lived (~30 days). It is minted at every
// successful login (password sign-in/up, oauth-token redemption, Apple verify)
// and presented by the client on every authenticated API call as
// `Authorization: Bearer <token>`. The server derives the acting email FROM
// this token and IGNORES any email in the request body, so a caller can only
// ever act as themselves. Pure + timing-safe, so it unit-tests without a live
// runtime — the whole point of this hotfix.
// ---------------------------------------------------------------------------

export const SESSION_PURPOSE = "session";

/** Session lifetime: 30 days. */
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type SessionPayload = {
  email: string;
  /** Issued-at, epoch milliseconds. */
  iat: number;
  /** Absolute expiry, epoch milliseconds. */
  exp: number;
  purpose: typeof SESSION_PURPOSE;
};

export type VerifySessionResult =
  | { valid: true; email: string; payload: SessionPayload }
  | { valid: false; reason: "malformed" | "bad_signature" | "wrong_purpose" | "expired" };

/**
 * Mint a reusable, ~30-day session token binding {email, iat, exp,
 * purpose:"session"} under AUTH_TOKEN_SECRET. Unlike {@link mintToken} there is
 * NO nonce and NO single-use clamp — a session is meant to be presented on many
 * requests until it expires.
 */
export function mintSessionToken(opts: {
  email: string;
  secret: string;
  now?: number;
  ttlMs?: number;
}): string {
  if (!opts.secret) throw new Error("mintSessionToken: missing secret");
  const now = opts.now ?? Date.now();
  const ttl = opts.ttlMs ?? SESSION_TTL_MS;
  const payload: SessionPayload = {
    email: opts.email.toLowerCase().trim(),
    iat: now,
    exp: now + ttl,
    purpose: SESSION_PURPOSE,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = sign(payloadB64, opts.secret);
  return `${payloadB64}.${sig}`;
}

/**
 * Verify a session token's signature (timing-safe), purpose, and expiry, and
 * return the bound email. Callers derive identity from `email` here and must
 * NOT trust any caller-supplied email field.
 */
export function verifySessionToken(
  token: string | undefined | null,
  secret: string | undefined | null,
  opts?: { now?: number }
): VerifySessionResult {
  if (!token || !secret) return { valid: false, reason: "malformed" };
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return { valid: false, reason: "malformed" };
  const [payloadB64, providedSig] = parts;

  const expectedSig = sign(payloadB64, secret);
  const expectedBuf = Buffer.from(expectedSig, "base64url");
  const providedBuf = Buffer.from(providedSig, "base64url");
  if (expectedBuf.length !== providedBuf.length) return { valid: false, reason: "bad_signature" };
  if (!timingSafeEqual(expectedBuf, providedBuf)) return { valid: false, reason: "bad_signature" };

  let payload: SessionPayload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return { valid: false, reason: "malformed" };
  }
  if (
    !payload ||
    typeof payload.email !== "string" ||
    typeof payload.exp !== "number" ||
    typeof payload.purpose !== "string"
  ) {
    return { valid: false, reason: "malformed" };
  }
  if (payload.purpose !== SESSION_PURPOSE) return { valid: false, reason: "wrong_purpose" };
  const now = opts?.now ?? Date.now();
  if (!(payload.exp > now)) return { valid: false, reason: "expired" };
  const email = payload.email.toLowerCase().trim();
  if (!email) return { valid: false, reason: "malformed" };
  return { valid: true, email, payload };
}

/**
 * Extract the token from an `Authorization: Bearer <token>` header value.
 * Returns null when the header is absent or not a bearer.
 */
export function extractBearerToken(
  authHeader: string | string[] | undefined | null
): string | null {
  const h = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  if (!h || typeof h !== "string") return null;
  const m = /^Bearer\s+(.+)$/i.exec(h.trim());
  return m && m[1] ? m[1].trim() : null;
}

// ---------------------------------------------------------------------------
// Replay guard (best-effort, in-process). See module docstring for the tradeoff
// and the Convex upgrade path.
// ---------------------------------------------------------------------------

const consumedNonces = new Map<string, number>(); // nonce -> exp (epoch ms)

function sweepExpired(now: number): void {
  // Bounded, opportunistic cleanup so the map cannot grow without limit.
  for (const [nonce, exp] of consumedNonces) {
    if (exp <= now) consumedNonces.delete(nonce);
  }
}

/**
 * Record a nonce as consumed. Returns `true` the first time a nonce is seen and
 * `false` on any subsequent (replayed) presentation while still within its
 * lifetime. `exp` is the token's absolute expiry so the entry can be swept.
 */
export function consumeNonce(nonce: string, exp: number, now: number = Date.now()): boolean {
  sweepExpired(now);
  if (consumedNonces.has(nonce)) return false;
  consumedNonces.set(nonce, exp);
  return true;
}

/** Test-only: clear the replay guard between cases. */
export function __resetConsumedNonces(): void {
  consumedNonces.clear();
}
