/**
 * Server-side CORS helper with an explicit origin allowlist (docs/PLAN.md
 * "Architecture" — CORS explicit origin allowlist, never `*`).
 *
 * The Capacitor iOS shell serves the app from `capacitor://localhost`, so the
 * Vercel functions it calls (`/api/auth`, `/api/db`, `/api/ai`) are genuinely
 * cross-origin and must opt that origin in. We echo back ONLY the exact matched
 * origin (never a wildcard), always set `Vary: Origin` so caches key on it, and
 * answer preflight `OPTIONS` requests.
 *
 * Structural req/res types keep this unit-testable without a live Vercel
 * runtime while remaining assignable from VercelRequest / VercelResponse.
 */

export const CORS_ALLOWLIST: readonly string[] = [
  "https://www.songghost.com",
  "https://songghost.com",
  "https://ghostwriter-ai-public.vercel.app",
  "capacitor://localhost",
  "http://localhost:5173", // Vite dev server
];

export interface CorsRequestLike {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
}

export interface CorsResponseLike {
  setHeader(name: string, value: string | number | readonly string[]): unknown;
  status(code: number): { end(): unknown };
}

function headerValue(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/**
 * Returns the exact matched origin if it is on the allowlist, otherwise null.
 * Matching is exact-string only — no prefix/suffix/wildcard logic.
 */
export function resolveAllowedOrigin(origin: string | string[] | undefined): string | null {
  const o = headerValue(origin);
  if (!o) return null;
  return CORS_ALLOWLIST.includes(o) ? o : null;
}

/**
 * Apply CORS headers for an allowed origin. Always sets `Vary: Origin`. When the
 * request's Origin is not on the allowlist, no `Access-Control-Allow-Origin`
 * header is emitted (the browser then blocks the cross-origin read) — we never
 * fall back to `*`.
 */
export function applyCors(req: CorsRequestLike, res: CorsResponseLike): void {
  res.setHeader("Vary", "Origin");
  const allowed = resolveAllowedOrigin(req.headers.origin);
  if (allowed) {
    res.setHeader("Access-Control-Allow-Origin", allowed);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, x-gemini-api-key"
    );
    // Let the cross-origin (Capacitor) client READ the session-expiry signal so
    // it can distinguish an expired session from a bad-password 401 and re-login.
    res.setHeader("Access-Control-Expose-Headers", "X-Session-Invalid");
    res.setHeader("Access-Control-Max-Age", "86400");
  }
}

/**
 * Handle a CORS preflight. Applies CORS headers and, for an `OPTIONS` request,
 * ends the response with 204 and returns `true` (caller should stop). Returns
 * `false` for non-OPTIONS requests (caller continues normally).
 */
export function handlePreflight(req: CorsRequestLike, res: CorsResponseLike): boolean {
  applyCors(req, res);
  if ((req.method || "").toUpperCase() === "OPTIONS") {
    res.status(204).end();
    return true;
  }
  return false;
}
