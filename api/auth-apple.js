// server/auth-apple.ts
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import { createRemoteJWKSet, jwtVerify } from "jose";

// lib/appleAuth.ts
import { createHash, timingSafeEqual } from "node:crypto";
var APPLE_ISSUER = "https://appleid.apple.com";
var APPLE_JWKS_URL = "https://appleid.apple.com/auth/keys";
var APPLE_AUDIENCE = "com.songghost.app";
function audienceMatches(aud, expected) {
  if (aud === void 0) return false;
  return Array.isArray(aud) ? aud.includes(expected) : aud === expected;
}
function coerceBool(v) {
  return v === true || v === "true";
}
function safeStrEqual(a, b) {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
function validateAppleClaims(claims, opts) {
  const nowSec = opts.now ?? Math.floor(Date.now() / 1e3);
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
  const nonceOk = safeStrEqual(claimNonce, opts.nonce) || safeStrEqual(claimNonce, hashedExpected);
  if (!nonceOk) return { valid: false, reason: "nonce_mismatch" };
  const email = typeof claims.email === "string" && claims.email ? claims.email.toLowerCase().trim() : null;
  const sub = typeof claims.sub === "string" && claims.sub ? claims.sub : null;
  return { valid: true, email, sub, isPrivateEmail: coerceBool(claims.is_private_email) };
}

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
import { createHmac, timingSafeEqual as timingSafeEqual2, randomBytes } from "node:crypto";
function sign(payloadB64, secret) {
  return createHmac("sha256", secret).update(payloadB64).digest("base64url");
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

// server/auth-apple.ts
var upsertAppleUserRef = makeFunctionReference("users:upsertAppleUser");
var isSkoolMemberByEmailRef = makeFunctionReference("app:isSkoolMemberByEmail");
var setProfileTierRef = makeFunctionReference("app:setProfileTier");
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
    console.error("[Skool Tier Sync Error][apple]", e?.message || e);
  }
}
var APPLE_JWKS = createRemoteJWKSet(new URL(APPLE_JWKS_URL), {
  cooldownDuration: 3e4,
  cacheMaxAge: 6e5
});
async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  applyCors(req, res);
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  const ip = getRequestClientId(req);
  const rl = checkRateLimit(`apple:ip:${ip}`, 20, 6e4);
  if (!rl.allowed) {
    res.setHeader("Retry-After", String(Math.ceil((rl.resetAt - Date.now()) / 1e3)));
    return res.status(429).json({ error: "Too many requests. Please slow down." });
  }
  try {
    const { identityToken, nonce } = req.body || {};
    if (!identityToken || !nonce) {
      return res.status(400).json({ error: "Missing identityToken or nonce" });
    }
    const audience = process.env.APPLE_BUNDLE_ID || APPLE_AUDIENCE;
    let claims;
    try {
      const { payload } = await jwtVerify(identityToken, APPLE_JWKS, {
        issuer: APPLE_ISSUER,
        audience
      });
      claims = payload;
    } catch (e) {
      console.error("[Apple Verify Error]", e?.message || e);
      return res.status(401).json({ error: "Invalid Apple identity token" });
    }
    const validation = validateAppleClaims(claims, { nonce, audience });
    if (!validation.valid) {
      return res.status(401).json({ error: "Apple identity token rejected", reason: validation.reason });
    }
    const sub = validation.sub;
    if (!sub) {
      return res.status(401).json({ error: "Apple identity token missing subject" });
    }
    const claimEmail = validation.email || void 0;
    const secret = process.env.AUTH_TOKEN_SECRET;
    if (!secret) {
      console.error("[Apple Auth API] AUTH_TOKEN_SECRET is not configured");
      return res.status(500).json({ error: "Server authentication is misconfigured" });
    }
    const client = getConvexClient();
    const user = await client.mutation(upsertAppleUserRef, { sub, email: claimEmail });
    if (!user?.email) {
      return res.status(401).json({
        error: "Apple sign-in could not resolve your account. Please sign in again with email sharing enabled."
      });
    }
    const email = String(user.email).toLowerCase().trim();
    await enforceSkoolTierIfEligible(client, email);
    return res.status(200).json({
      session: {
        user: {
          id: user?._id || `user_${email}`,
          email
        }
      },
      sessionToken: mintSessionToken({ email, secret })
    });
  } catch (error) {
    console.error("[Apple Auth API Error]", error);
    return res.status(500).json({ error: error?.message || "Apple authentication failed" });
  }
}
export {
  handler as default
};
