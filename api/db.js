// server/db.ts
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";

// lib/cors.ts
var CORS_ALLOWLIST = [
  "https://www.songghost.com",
  "https://songghost.com",
  "https://ghostwriter-ai-public.vercel.app",
  "capacitor://localhost",
  // iOS Capacitor shell (WKWebView origin)
  "http://localhost:5173"
  // Vite dev server
];
function headerValue(v) {
  return Array.isArray(v) ? v[0] : v;
}
function resolveAllowedOrigin(origin) {
  const o = headerValue(origin);
  if (!o) return null;
  return CORS_ALLOWLIST.includes(o) ? o : null;
}
function applyCors(req, res) {
  res.setHeader("Vary", "Origin");
  const allowed = resolveAllowedOrigin(req.headers.origin);
  if (allowed) {
    res.setHeader("Access-Control-Allow-Origin", allowed);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, x-gemini-api-key"
    );
    res.setHeader("Access-Control-Expose-Headers", "X-Session-Invalid");
    res.setHeader("Access-Control-Max-Age", "86400");
  }
}
function handlePreflight(req, res) {
  applyCors(req, res);
  if ((req.method || "").toUpperCase() === "OPTIONS") {
    res.status(204).end();
    return true;
  }
  return false;
}

// lib/authToken.ts
import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";
function sign(payloadB64, secret) {
  return createHmac("sha256", secret).update(payloadB64).digest("base64url");
}
var SESSION_PURPOSE = "session";
var SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1e3;
function verifySessionToken(token, secret, opts) {
  if (!token || !secret) return { valid: false, reason: "malformed" };
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return { valid: false, reason: "malformed" };
  const [payloadB64, providedSig] = parts;
  const expectedSig = sign(payloadB64, secret);
  const expectedBuf = Buffer.from(expectedSig, "base64url");
  const providedBuf = Buffer.from(providedSig, "base64url");
  if (expectedBuf.length !== providedBuf.length) return { valid: false, reason: "bad_signature" };
  if (!timingSafeEqual(expectedBuf, providedBuf)) return { valid: false, reason: "bad_signature" };
  let payload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return { valid: false, reason: "malformed" };
  }
  if (!payload || typeof payload.email !== "string" || typeof payload.exp !== "number" || typeof payload.purpose !== "string") {
    return { valid: false, reason: "malformed" };
  }
  if (payload.purpose !== SESSION_PURPOSE) return { valid: false, reason: "wrong_purpose" };
  const now = opts?.now ?? Date.now();
  if (!(payload.exp > now)) return { valid: false, reason: "expired" };
  const email = payload.email.toLowerCase().trim();
  if (!email) return { valid: false, reason: "malformed" };
  return { valid: true, email, payload };
}
function extractBearerToken(authHeader) {
  const h = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  if (!h || typeof h !== "string") return null;
  const m = /^Bearer\s+(.+)$/i.exec(h.trim());
  return m && m[1] ? m[1].trim() : null;
}

// lib/sessionAuth.ts
function requireSession(req, res) {
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
      code: "session_invalid"
    });
    return { ok: false };
  }
  return { ok: true, email: verified.email };
}

// server/db.ts
var refs = {
  getUserProfileByEmail: { mode: "query", ref: makeFunctionReference("app:getUserProfileByEmail") },
  upsertUserProfileByEmail: { mode: "mutation", ref: makeFunctionReference("app:upsertUserProfileByEmail") },
  getCreditsByEmail: { mode: "mutation", ref: makeFunctionReference("app:getCreditsByEmail") },
  spendCreditsByEmail: { mode: "mutation", ref: makeFunctionReference("app:spendCreditsByEmail") },
  getSongsByEmail: { mode: "query", ref: makeFunctionReference("app:getSongsByEmail") },
  getSongCountByEmail: { mode: "query", ref: makeFunctionReference("app:getSongCountByEmail") },
  saveSongByEmail: { mode: "mutation", ref: makeFunctionReference("app:saveSongByEmail") },
  deleteSongById: { mode: "mutation", ref: makeFunctionReference("app:deleteSongById") },
  deleteAllSongsByEmail: { mode: "mutation", ref: makeFunctionReference("app:deleteAllSongsByEmail") },
  getTransactionsByEmail: { mode: "query", ref: makeFunctionReference("app:getTransactionsByEmail") },
  deleteAccountByEmail: { mode: "mutation", ref: makeFunctionReference("app:deleteAccountByEmail") },
  getOrCreateReferralCodeByEmail: { mode: "mutation", ref: makeFunctionReference("app:getOrCreateReferralCodeByEmail") },
  claimReferralCodeByEmail: { mode: "mutation", ref: makeFunctionReference("app:claimReferralCodeByEmail") },
  getReferralSummaryByEmail: { mode: "query", ref: makeFunctionReference("app:getReferralSummaryByEmail") },
  validateInviteCode: { mode: "mutation", ref: makeFunctionReference("inviteCodes:validateCode") }
  // NOTE: setProfileTier is deliberately NOT client-reachable (C2). Tier only
  // changes through the validated invite path / server logic, never a raw setter.
};
var EMAIL_SCOPED_ACTIONS = new Set(
  Object.keys(refs).filter((k) => k !== "validateInviteCode")
);
function getClient() {
  const url = process.env.CONVEX_URL;
  const key = process.env.CONVEX_ADMIN_KEY;
  if (!url || !key) throw new Error("Missing CONVEX_URL or CONVEX_ADMIN_KEY");
  const client = new ConvexHttpClient(url);
  client.setAdminAuth(key);
  return client;
}
async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  applyCors(req, res);
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  const session = requireSession(req, res);
  if (!session.ok) return;
  try {
    const { action, payload } = req.body || {};
    if (!action || !refs[action]) return res.status(400).json({ error: "Invalid action" });
    const args = EMAIL_SCOPED_ACTIONS.has(action) ? { ...payload || {}, email: session.email } : payload || {};
    const client = getClient();
    const selected = refs[action];
    const data = selected.mode === "query" ? await client.query(selected.ref, args) : await client.mutation(selected.ref, args);
    return res.status(200).json({ data });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "DB API failed" });
  }
}
export {
  handler as default
};
