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
