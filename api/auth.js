// server/auth.ts
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import { pbkdf2Sync, randomBytes as randomBytes2, timingSafeEqual as timingSafeEqual2 } from "node:crypto";

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

// lib/rateLimit.ts
var buckets = /* @__PURE__ */ new Map();
function checkRateLimit(key, limit, windowMs) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: Math.max(0, limit - 1), resetAt };
  }
  if (current.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt };
  }
  current.count += 1;
  buckets.set(key, current);
  return { allowed: true, remaining: Math.max(0, limit - current.count), resetAt: current.resetAt };
}
function getRequestClientId(req) {
  const forwarded = req.headers["x-forwarded-for"];
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const first = String(value || "").split(",")[0].trim();
  return first || "unknown-client";
}

// lib/authToken.ts
import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";
var OAUTH_SESSION_PURPOSE = "oauth-session";
function sign(payloadB64, secret) {
  return createHmac("sha256", secret).update(payloadB64).digest("base64url");
}
function verifyToken(token, secret, opts) {
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
  if (!payload || typeof payload.email !== "string" || typeof payload.nonce !== "string" || typeof payload.exp !== "number" || typeof payload.purpose !== "string") {
    return { valid: false, reason: "malformed" };
  }
  const expectedPurpose = opts?.expectedPurpose ?? OAUTH_SESSION_PURPOSE;
  if (payload.purpose !== expectedPurpose) return { valid: false, reason: "wrong_purpose" };
  const now = opts?.now ?? Date.now();
  if (!(payload.exp > now)) return { valid: false, reason: "expired" };
  return { valid: true, payload };
}
var SESSION_PURPOSE = "session";
var SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1e3;
function mintSessionToken(opts) {
  if (!opts.secret) throw new Error("mintSessionToken: missing secret");
  const now = opts.now ?? Date.now();
  const ttl = opts.ttlMs ?? SESSION_TTL_MS;
  const payload = {
    email: opts.email.toLowerCase().trim(),
    iat: now,
    exp: now + ttl,
    purpose: SESSION_PURPOSE
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = sign(payloadB64, opts.secret);
  return `${payloadB64}.${sig}`;
}
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
var consumedNonces = /* @__PURE__ */ new Map();
function sweepExpired(now) {
  for (const [nonce, exp] of consumedNonces) {
    if (exp <= now) consumedNonces.delete(nonce);
  }
}
function consumeNonce(nonce, exp, now = Date.now()) {
  sweepExpired(now);
  if (consumedNonces.has(nonce)) return false;
  consumedNonces.set(nonce, exp);
  return true;
}
var PASSWORD_SET_PURPOSE = "password-set";
var PASSWORD_SET_TTL_MS = 60 * 60 * 1e3;
function mintPasswordSetToken(opts) {
  if (!opts.secret) throw new Error("mintPasswordSetToken: missing secret");
  const now = opts.now ?? Date.now();
  const ttl = Math.min(opts.ttlMs ?? PASSWORD_SET_TTL_MS, PASSWORD_SET_TTL_MS);
  const payload = {
    email: opts.email.toLowerCase().trim(),
    nonce: opts.nonce ?? randomBytes(16).toString("hex"),
    exp: now + ttl,
    purpose: PASSWORD_SET_PURPOSE
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${payloadB64}.${sign(payloadB64, opts.secret)}`;
}
function verifyPasswordSetToken(token, secret, opts) {
  return verifyToken(token, secret, {
    expectedPurpose: PASSWORD_SET_PURPOSE,
    now: opts?.now
  });
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

// server/auth.ts
var getUserByEmailRef = makeFunctionReference("users:getUserByEmail");
var upsertUserCredentialsRef = makeFunctionReference("users:upsertUserCredentials");
var claimReferralCodeByEmailRef = makeFunctionReference("app:claimReferralCodeByEmail");
var isSkoolMemberByEmailRef = makeFunctionReference("app:isSkoolMemberByEmail");
var setProfileTierRef = makeFunctionReference("app:setProfileTier");
var validateInviteCodeRef = makeFunctionReference("inviteCodes:validateCode");
var consumeAuthNonceRef = makeFunctionReference("authNonces:consume");
var dbRefs = {
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
var EMAIL_SCOPED_DB_ACTIONS = new Set(
  Object.keys(dbRefs).filter((k) => k !== "validateInviteCode")
);
function normalizeEmail(email) {
  return email.toLowerCase().trim();
}
function mintSessionForEmail(email) {
  const secret = process.env.AUTH_TOKEN_SECRET;
  if (!secret) throw new Error("AUTH_TOKEN_SECRET is not configured");
  return mintSessionToken({ email, secret });
}
function hashPassword(password, salt) {
  return pbkdf2Sync(password, salt, 21e4, 32, "sha256").toString("hex");
}
function safeEqualHex(a, b) {
  const ab = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual2(ab, bb);
}
function rejectRateLimited(res, resetAt) {
  const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1e3));
  res.setHeader("Retry-After", String(retryAfter));
  return res.status(429).json({ error: "Too many requests. Please slow down." });
}
function getConvexClient() {
  const convexUrl = process.env.CONVEX_URL;
  const convexAdminKey = process.env.CONVEX_ADMIN_KEY;
  if (!convexUrl || !convexAdminKey) {
    throw new Error("Missing CONVEX_URL or CONVEX_ADMIN_KEY");
  }
  const client = new ConvexHttpClient(convexUrl);
  client.setAdminAuth(convexAdminKey);
  return client;
}
async function enforceSkoolTierIfEligible(client, email) {
  try {
    const isSkoolMember = await client.query(isSkoolMemberByEmailRef, { email });
    if (isSkoolMember) {
      await client.mutation(setProfileTierRef, { email, tier: "skool" });
    }
  } catch (e) {
    console.error("[Skool Tier Sync Error]", e?.message || e);
  }
}
function splitNameFromEmail(email) {
  const local = email.split("@")[0] || "";
  const cleaned = local.replace(/[._-]+/g, " ").replace(/\s+/g, " ").trim();
  if (!cleaned) return { firstName: "", lastName: "" };
  const parts = cleaned.split(" ");
  const firstName = parts[0] || "";
  const lastName = parts.slice(1).join(" ");
  return { firstName, lastName };
}
async function syncContactToGHL(input) {
  const apiUrl = process.env.GHL_API_URL || "https://services.leadconnectorhq.com/contacts/";
  const apiToken = process.env.GHL_API_TOKEN;
  const locationId = process.env.GHL_LOCATION_ID;
  const apiVersion = process.env.GHL_API_VERSION || "2021-07-28";
  const appTag = process.env.GHL_APP_TAG || "app1";
  const campaignTag = process.env.GHL_CAMPAIGN_TAG || "campaign-app1";
  const source = process.env.GHL_SOURCE || "Song Ghost";
  if (!apiToken || !locationId) {
    return;
  }
  const guessedName = splitNameFromEmail(input.email);
  const firstName = (input.firstName || guessedName.firstName || "").slice(0, 50);
  const lastName = (input.lastName || guessedName.lastName || "").slice(0, 50);
  const payload = {
    locationId,
    firstName,
    lastName,
    email: input.email,
    phone: input.phone || "",
    source,
    tags: [appTag, campaignTag]
  };
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      Version: apiVersion,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`GHL sync failed (${response.status}): ${details || "Unknown error"}`);
  }
}
function getSiteOrigin() {
  return (process.env.PUBLIC_SITE_URL || "https://www.songghost.com").replace(/\/+$/, "");
}
function escapeHtmlText(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
async function sendPasswordSetEmail(email, token) {
  const base = process.env.GHL_API_URL_BASE || "https://services.leadconnectorhq.com";
  const apiToken = process.env.GHL_API_TOKEN;
  const mailToken = process.env.GHL_MESSAGE_TOKEN || apiToken;
  const locationId = process.env.GHL_LOCATION_ID;
  const apiVersion = process.env.GHL_API_VERSION || "2021-07-28";
  const from = process.env.GHL_FROM_EMAIL;
  if (!apiToken || !mailToken || !locationId) {
    console.error("[Password Set Email] GHL is not configured; link not sent");
    return;
  }
  const link = `${getSiteOrigin()}/set-password?token=${encodeURIComponent(token)}`;
  const safeLink = escapeHtmlText(link);
  const hdrs = (t) => ({
    Authorization: `Bearer ${t}`,
    Version: apiVersion,
    "Content-Type": "application/json",
    Accept: "application/json"
  });
  const contactRes = await fetch(`${base}/contacts/`, {
    method: "POST",
    headers: hdrs(apiToken),
    body: JSON.stringify({ locationId, email, source: "Password reset" })
  });
  const contactText = await contactRes.text().catch(() => "");
  let contactJson = {};
  try {
    contactJson = JSON.parse(contactText);
  } catch {
  }
  const contactId = contactJson?.contact?.id || contactJson?.id || contactJson?.meta?.contactId;
  if (!contactId) {
    console.error("[Password Set Email] no contact id", contactRes.status, contactText.slice(0, 200));
    return;
  }
  const html = `
<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#1a1a1a">
  <p>Hey,</p>
  <p>Here is your link to set a password for SongGhost.</p>
  <p><a href="${safeLink}" style="display:inline-block;background:#2b5be0;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:700">Set my password</a></p>
  <p>Or paste this into your browser:<br><a href="${safeLink}">${safeLink}</a></p>
  <p>This link works once and expires in 1 hour.</p>
  <p>If you did not ask for this, you can ignore this email. Nothing changes until
  you open the link and choose a password.</p>
  <p>\u2014 Rudy</p>
</div>`.trim();
  const text = `Hey,

Here is your link to set a password for SongGhost:

${link}

This link works once and expires in 1 hour.

If you did not ask for this, ignore this email. Nothing changes until you open
the link and choose a password.

- Rudy`;
  const mailRes = await fetch(`${base}/conversations/messages`, {
    method: "POST",
    headers: hdrs(mailToken),
    body: JSON.stringify({
      type: "Email",
      contactId,
      subject: "Set your SongGhost password",
      html,
      ...from ? { emailFrom: from } : {},
      message: text
    })
  });
  if (!mailRes.ok) {
    const detail = await mailRes.text().catch(() => "");
    console.error("[Password Set Email] send failed", mailRes.status, detail.slice(0, 200));
  }
}
async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  applyCors(req, res);
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  try {
    const { action, email, password } = req.body || {};
    const referralCode = req.body?.referralCode;
    const communityCode = String(req.body?.code || "").toUpperCase().trim();
    const dbAction = String(req.body?.dbAction || "");
    const dbPayload = req.body?.payload || {};
    if (action === "validateCommunityCode") {
      if (!communityCode) return res.status(400).json({ error: "Missing code" });
      const client2 = getConvexClient();
      const data = await client2.mutation(validateInviteCodeRef, { code: communityCode });
      return res.status(200).json({ data });
    }
    if (action === "db") {
      const session = requireSession(req, res);
      if (!session.ok) return;
      if (!dbAction || !dbRefs[dbAction]) return res.status(400).json({ error: "Invalid db action" });
      const args = EMAIL_SCOPED_DB_ACTIONS.has(dbAction) ? { ...dbPayload || {}, email: session.email } : dbPayload || {};
      const client2 = getConvexClient();
      const selected = dbRefs[dbAction];
      const data = selected.mode === "query" ? await client2.query(selected.ref, args) : await client2.mutation(selected.ref, args);
      return res.status(200).json({ data });
    }
    if (action === "oauth") {
      const ip = getRequestClientId(req);
      const oauthRl = checkRateLimit(`auth:oauth:ip:${ip}`, 20, 6e4);
      if (!oauthRl.allowed) return rejectRateLimited(res, oauthRl.resetAt);
      const secret = process.env.AUTH_TOKEN_SECRET;
      if (!secret) {
        console.error("[Auth API] AUTH_TOKEN_SECRET is not configured");
        return res.status(500).json({ error: "Server authentication is misconfigured" });
      }
      const token = String(req.body?.token || "");
      const verified = verifyToken(token, secret, { expectedPurpose: OAUTH_SESSION_PURPOSE });
      if (!verified.valid) {
        return res.status(401).json({ error: "Invalid or expired sign-in token" });
      }
      if (!consumeNonce(verified.payload.nonce, verified.payload.exp)) {
        return res.status(401).json({ error: "Sign-in token has already been used" });
      }
      const oauthEmail = normalizeEmail(verified.payload.email);
      if (!oauthEmail) {
        return res.status(401).json({ error: "Invalid sign-in token" });
      }
      const client2 = getConvexClient();
      const consumeResult = await client2.mutation(consumeAuthNonceRef, {
        nonce: verified.payload.nonce,
        exp: verified.payload.exp
      });
      if (!consumeResult?.firstUse) {
        return res.status(401).json({ error: "Sign-in token has already been used" });
      }
      const existing2 = await client2.query(getUserByEmailRef, { email: oauthEmail });
      const isNetNewUser2 = !existing2?._id;
      const user = await client2.mutation(upsertUserCredentialsRef, { email: oauthEmail });
      await enforceSkoolTierIfEligible(client2, oauthEmail);
      if (isNetNewUser2) {
        try {
          await syncContactToGHL({ email: oauthEmail });
        } catch (e) {
          console.error("[GHL Sync Error][oauth]", e?.message || e);
        }
      }
      return res.status(200).json({
        session: { user: { id: user?._id || `user_${oauthEmail}`, email: oauthEmail } },
        sessionToken: mintSessionForEmail(oauthEmail)
      });
    }
    if (action === "request-password-set") {
      const ip = getRequestClientId(req);
      const ipRl = checkRateLimit(`auth:pwreq:ip:${ip}`, 5, 6e4);
      if (!ipRl.allowed) return rejectRateLimited(res, ipRl.resetAt);
      const requestEmail = normalizeEmail(email || "");
      const emailRl = checkRateLimit(`auth:pwreq:email:${requestEmail}`, 3, 15 * 6e4);
      if (!emailRl.allowed) return rejectRateLimited(res, emailRl.resetAt);
      const genericOk = {
        ok: true,
        message: "If that address has an account, we just sent it a link."
      };
      if (!requestEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requestEmail)) {
        return res.status(200).json(genericOk);
      }
      const secret = process.env.AUTH_TOKEN_SECRET;
      if (!secret) {
        console.error("[Auth API] AUTH_TOKEN_SECRET is not configured");
        return res.status(500).json({ error: "Server authentication is misconfigured" });
      }
      try {
        const client2 = getConvexClient();
        const existing2 = await client2.query(getUserByEmailRef, { email: requestEmail });
        if (existing2?._id) {
          await sendPasswordSetEmail(requestEmail, mintPasswordSetToken({ email: requestEmail, secret }));
        }
      } catch (e) {
        console.error("[Password Set Request Error]", e?.message || e);
      }
      return res.status(200).json(genericOk);
    }
    if (action === "set-password") {
      const ip = getRequestClientId(req);
      const rl = checkRateLimit(`auth:pwset:ip:${ip}`, 10, 6e4);
      if (!rl.allowed) return rejectRateLimited(res, rl.resetAt);
      const secret = process.env.AUTH_TOKEN_SECRET;
      if (!secret) {
        console.error("[Auth API] AUTH_TOKEN_SECRET is not configured");
        return res.status(500).json({ error: "Server authentication is misconfigured" });
      }
      const resetToken = String(req.body?.token || "");
      const newPassword = String(req.body?.password || "");
      if (newPassword.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }
      const verified = verifyPasswordSetToken(resetToken, secret);
      if (!verified.valid) {
        return res.status(401).json({ error: "This link is invalid or has expired. Please request a new one." });
      }
      if (!consumeNonce(verified.payload.nonce, verified.payload.exp)) {
        return res.status(401).json({ error: "This link has already been used. Please request a new one." });
      }
      const tokenEmail = normalizeEmail(verified.payload.email);
      if (!tokenEmail) {
        return res.status(401).json({ error: "This link is invalid or has expired. Please request a new one." });
      }
      const client2 = getConvexClient();
      const consumeResult = await client2.mutation(consumeAuthNonceRef, {
        nonce: verified.payload.nonce,
        exp: verified.payload.exp
      });
      if (!consumeResult?.firstUse) {
        return res.status(401).json({ error: "This link has already been used. Please request a new one." });
      }
      const salt = randomBytes2(16).toString("hex");
      const passwordHash = hashPassword(newPassword, salt);
      const user = await client2.mutation(upsertUserCredentialsRef, {
        email: tokenEmail,
        passwordHash,
        passwordSalt: salt
      });
      await enforceSkoolTierIfEligible(client2, tokenEmail);
      return res.status(200).json({
        session: { user: { id: user?._id || `user_${tokenEmail}`, email: tokenEmail } },
        sessionToken: mintSessionForEmail(tokenEmail)
      });
    }
    const normalizedEmail = normalizeEmail(email || "");
    if (!action || !normalizedEmail) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if ((action === "signup" || action === "signin") && !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const credentialPassword = action === "signup" || action === "signin" ? password : void 0;
    if (credentialPassword && credentialPassword.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }
    if (action === "signin" || action === "signup") {
      const ip = getRequestClientId(req);
      const ipRl = checkRateLimit(`auth:${action}:ip:${ip}`, 10, 6e4);
      if (!ipRl.allowed) return rejectRateLimited(res, ipRl.resetAt);
      const emailRl = checkRateLimit(`auth:${action}:email:${normalizedEmail}`, 10, 6e4);
      if (!emailRl.allowed) return rejectRateLimited(res, emailRl.resetAt);
    }
    const client = getConvexClient();
    const existing = await client.query(getUserByEmailRef, { email: normalizedEmail });
    const isNetNewUser = !existing?._id;
    if (action === "signup") {
      if (existing?._id) {
        return res.status(409).json({ error: "Account already exists. Please sign in." });
      }
      const salt = randomBytes2(16).toString("hex");
      const passwordHash = hashPassword(credentialPassword, salt);
      const user = await client.mutation(upsertUserCredentialsRef, {
        email: normalizedEmail,
        passwordHash,
        passwordSalt: salt
      });
      await enforceSkoolTierIfEligible(client, normalizedEmail);
      if (isNetNewUser) {
        try {
          await syncContactToGHL({ email: normalizedEmail });
        } catch (e) {
          console.error("[GHL Sync Error][signup]", e?.message || e);
        }
      }
      if (referralCode && String(referralCode).trim()) {
        try {
          await client.mutation(claimReferralCodeByEmailRef, {
            email: normalizedEmail,
            code: String(referralCode).trim().toUpperCase()
          });
        } catch (e) {
        }
      }
      return res.status(200).json({
        session: {
          user: {
            id: user?._id || `user_${normalizedEmail}`,
            email: normalizedEmail
          }
        },
        sessionToken: mintSessionForEmail(normalizedEmail)
      });
    }
    if (!existing?.passwordHash || !existing?.passwordSalt) {
      const isSkoolMember = await client.query(isSkoolMemberByEmailRef, { email: normalizedEmail });
      if (isSkoolMember) {
        return res.status(401).json({
          error: "This community account doesn't have a password yet. Sign in with Google or Apple to continue."
        });
      }
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const candidateHash = hashPassword(credentialPassword, existing.passwordSalt);
    const ok = safeEqualHex(candidateHash, existing.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    await enforceSkoolTierIfEligible(client, normalizedEmail);
    return res.status(200).json({
      session: {
        user: {
          id: existing._id || `user_${normalizedEmail}`,
          email: normalizedEmail
        }
      },
      sessionToken: mintSessionForEmail(normalizedEmail)
    });
  } catch (error) {
    console.error("[Auth API Error]", error);
    return res.status(500).json({ error: error?.message || "Authentication failed" });
  }
}
export {
  handler as default
};
