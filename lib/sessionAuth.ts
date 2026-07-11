/**
 * Server-side session enforcement seam (SECURITY HOTFIX).
 *
 * Every authenticated API boundary — /api/db, /api/ai, and the /api/auth
 * `action:"db"` dispatch — calls `requireSession` FIRST. It reads the
 * `Authorization: Bearer <token>` header, verifies it against AUTH_TOKEN_SECRET,
 * and returns the bound email. Endpoints then derive the acting identity from
 * that email and ignore any email in the request body, so a caller can only ever
 * act as themselves.
 *
 * Failure is fail-closed: no/invalid/expired token → 401 with an
 * `X-Session-Invalid: 1` header (which the client uses to distinguish an expired
 * session from a normal credential rejection and route to re-login). A missing
 * AUTH_TOKEN_SECRET is a 500 (server misconfig), never an open door.
 *
 * Structural req/res types keep this unit-testable without a live Vercel
 * runtime while remaining assignable from VercelRequest / VercelResponse.
 */
import { extractBearerToken, verifySessionToken } from "./authToken";

export interface SessionRequestLike {
  headers: Record<string, string | string[] | undefined>;
}

export interface SessionResponseLike {
  setHeader(name: string, value: string | number | readonly string[]): unknown;
  status(code: number): { json(obj: unknown): unknown };
}

export type RequireSessionResult = { ok: true; email: string } | { ok: false };

/**
 * Enforce a valid session bearer. On success returns `{ ok:true, email }`. On
 * any failure it has ALREADY written the response (401/500) and returns
 * `{ ok:false }` — callers must `return` immediately.
 */
export function requireSession(
  req: SessionRequestLike,
  res: SessionResponseLike
): RequireSessionResult {
  const secret = process.env.AUTH_TOKEN_SECRET;
  if (!secret) {
    console.error("[Session Auth] AUTH_TOKEN_SECRET is not configured");
    res.status(500).json({ error: "Server authentication is misconfigured" });
    return { ok: false };
  }
  const token = extractBearerToken(req.headers?.authorization ?? req.headers?.Authorization);
  const verified = verifySessionToken(token, secret);
  if (!verified.valid) {
    res.setHeader("X-Session-Invalid", "1");
    res.status(401).json({
      error: "Your session has expired. Please sign in again.",
      code: "session_invalid",
    });
    return { ok: false };
  }
  return { ok: true, email: verified.email };
}
