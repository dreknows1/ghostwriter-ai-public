// server/oauth-callback.ts
import { createSign } from "node:crypto";

// lib/authToken.ts
import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";
var OAUTH_SESSION_PURPOSE = "oauth-session";
var MAX_TOKEN_TTL_MS = 12e4;
function encodePayload(payload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}
function sign(payloadB64, secret) {
  return createHmac("sha256", secret).update(payloadB64).digest("base64url");
}
function mintToken(opts) {
  if (!opts.secret) throw new Error("mintToken: missing secret");
  const now = opts.now ?? Date.now();
  const ttl = Math.min(opts.ttlMs ?? MAX_TOKEN_TTL_MS, MAX_TOKEN_TTL_MS);
  const payload = {
    email: opts.email.toLowerCase().trim(),
    nonce: opts.nonce ?? randomBytes(16).toString("hex"),
    exp: now + ttl,
    purpose: opts.purpose ?? OAUTH_SESSION_PURPOSE
  };
  const payloadB64 = encodePayload(payload);
  const sig = sign(payloadB64, opts.secret);
  return `${payloadB64}.${sig}`;
}
var SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1e3;

// server/oauth-callback.ts
function getBaseUrl(req) {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${proto}://${host}`;
}
function parseCookie(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = decodeURIComponent(part.slice(idx + 1).trim());
    out[key] = val;
  }
  return out;
}
async function exchangeCode(provider, req, code) {
  const redirectUri = `${getBaseUrl(req)}/api/oauth/callback`;
  const base64UrlJson = (obj) => Buffer.from(JSON.stringify(obj), "utf8").toString("base64url");
  const buildAppleClientSecret = () => {
    if (process.env.OAUTH_APPLE_CLIENT_SECRET) return process.env.OAUTH_APPLE_CLIENT_SECRET;
    const teamId = process.env.OAUTH_APPLE_TEAM_ID;
    const keyId = process.env.OAUTH_APPLE_KEY_ID;
    const clientId = process.env.OAUTH_APPLE_CLIENT_ID;
    const privateKey = process.env.OAUTH_APPLE_PRIVATE_KEY;
    if (!teamId || !keyId || !clientId || !privateKey) return void 0;
    const now = Math.floor(Date.now() / 1e3);
    const exp = now + 60 * 60 * 24 * 30;
    const header = base64UrlJson({ alg: "ES256", kid: keyId, typ: "JWT" });
    const payload = base64UrlJson({
      iss: teamId,
      iat: now,
      exp,
      aud: "https://appleid.apple.com",
      sub: clientId
    });
    const signer = createSign("SHA256");
    signer.update(`${header}.${payload}`);
    signer.end();
    const signature = signer.sign(privateKey).toString("base64url");
    return `${header}.${payload}.${signature}`;
  };
  const appleClientSecret = buildAppleClientSecret();
  const map = {
    google: {
      tokenUrl: "https://oauth2.googleapis.com/token",
      clientId: process.env.OAUTH_GOOGLE_CLIENT_ID,
      clientSecret: process.env.OAUTH_GOOGLE_CLIENT_SECRET
    },
    discord: {
      tokenUrl: "https://discord.com/api/oauth2/token",
      clientId: process.env.OAUTH_DISCORD_CLIENT_ID,
      clientSecret: process.env.OAUTH_DISCORD_CLIENT_SECRET
    },
    facebook: {
      tokenUrl: "https://graph.facebook.com/v20.0/oauth/access_token",
      clientId: process.env.OAUTH_FACEBOOK_CLIENT_ID,
      clientSecret: process.env.OAUTH_FACEBOOK_CLIENT_SECRET
    },
    microsoft: {
      tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      clientId: process.env.OAUTH_MICROSOFT_CLIENT_ID,
      clientSecret: process.env.OAUTH_MICROSOFT_CLIENT_SECRET
    },
    apple: {
      tokenUrl: "https://appleid.apple.com/auth/token",
      clientId: process.env.OAUTH_APPLE_CLIENT_ID,
      clientSecret: appleClientSecret
    }
  };
  const cfg = map[provider];
  if (!cfg.clientId || !cfg.clientSecret) {
    throw new Error(`${provider} OAuth is not configured`);
  }
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    redirect_uri: redirectUri
  });
  const resp = await fetch(cfg.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  const json = await resp.json();
  if (!resp.ok || !json.access_token) {
    throw new Error(json.error_description || json.error || "Token exchange failed");
  }
  return json;
}
function decodeJwtEmail(idToken) {
  if (!idToken) return null;
  const parts = idToken.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
    return typeof payload?.email === "string" ? payload.email : null;
  } catch {
    return null;
  }
}
async function fetchEmail(provider, accessToken, idToken) {
  const idTokenEmail = decodeJwtEmail(idToken);
  if (idTokenEmail) return idTokenEmail;
  if (provider === "google") {
    const r = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const j = await r.json();
    if (!r.ok || !j?.email) throw new Error("Google profile email missing");
    return String(j.email);
  }
  if (provider === "discord") {
    const r = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const j = await r.json();
    if (!r.ok || !j?.email) throw new Error("Discord account email missing");
    return String(j.email);
  }
  if (provider === "facebook") {
    const r = await fetch("https://graph.facebook.com/me?fields=id,name,email", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const j = await r.json();
    if (!r.ok || !j?.email) throw new Error("Facebook account email missing or private");
    return String(j.email);
  }
  if (provider === "microsoft") {
    const r = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const j = await r.json();
    const email = j?.mail || j?.userPrincipalName;
    if (!r.ok || !email) throw new Error("Microsoft account email missing");
    return String(email);
  }
  if (provider === "apple") {
    const email = decodeJwtEmail(idToken);
    if (!email) throw new Error("Apple email unavailable. Verify scope and first-time consent.");
    return email;
  }
  throw new Error("Unsupported provider");
}
async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  try {
    const source = req.method === "POST" ? req.body : req.query;
    const code = String(source?.code || "");
    const state = String(source?.state || "");
    const oauthError = String(source?.error || "");
    if (oauthError) {
      return res.redirect(`/?oauth_error=${encodeURIComponent(oauthError)}`);
    }
    const cookies = parseCookie(req.headers.cookie);
    const expectedState = cookies.oauth_state || "";
    const provider = cookies.oauth_provider || "";
    res.setHeader("Set-Cookie", [
      "oauth_state=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax",
      "oauth_provider=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax"
    ]);
    if (!code || !state || !expectedState || state !== expectedState) {
      return res.redirect(`/?oauth_error=${encodeURIComponent("OAuth state mismatch")}`);
    }
    if (!["google", "discord", "facebook", "microsoft", "apple"].includes(provider)) {
      return res.redirect(`/?oauth_error=${encodeURIComponent("Unknown OAuth provider")}`);
    }
    const tokens = await exchangeCode(provider, req, code);
    const email = await fetchEmail(provider, tokens.access_token, tokens.id_token);
    const secret = process.env.AUTH_TOKEN_SECRET;
    if (!secret) {
      console.error("[OAuth Callback] AUTH_TOKEN_SECRET is not configured");
      return res.redirect(`/?oauth_error=${encodeURIComponent("Sign-in is temporarily unavailable")}`);
    }
    const token = mintToken({ email, secret });
    return res.redirect(`/?oauth_token=${encodeURIComponent(token)}`);
  } catch (error) {
    console.error("[OAuth Callback Error]", error);
    return res.redirect(`/?oauth_error=${encodeURIComponent(error?.message || "OAuth authentication failed")}`);
  }
}
export {
  handler as default
};
