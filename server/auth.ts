import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import { pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";
import { applyCors, handlePreflight } from "../lib/cors";
import { checkRateLimit, getRequestClientId } from "../lib/rateLimit";
import {
  consumeNonce,
  mintPasswordSetToken,
  mintSessionToken,
  OAUTH_SESSION_PURPOSE,
  verifyPasswordSetToken,
  verifyToken,
} from "../lib/authToken";
import { requireSession } from "../lib/sessionAuth";

const getUserByEmailRef = makeFunctionReference<"query">("users:getUserByEmail");
const upsertUserCredentialsRef = makeFunctionReference<"mutation">("users:upsertUserCredentials");
const claimReferralCodeByEmailRef = makeFunctionReference<"mutation">("app:claimReferralCodeByEmail");
const isSkoolMemberByEmailRef = makeFunctionReference<"query">("app:isSkoolMemberByEmail");
const setProfileTierRef = makeFunctionReference<"mutation">("app:setProfileTier");
const validateInviteCodeRef = makeFunctionReference<"mutation">("inviteCodes:validateCode");
const consumeAuthNonceRef = makeFunctionReference<"mutation">("authNonces:consume");
const dbRefs = {
  getUserProfileByEmail: { mode: "query", ref: makeFunctionReference<"query">("app:getUserProfileByEmail") },
  upsertUserProfileByEmail: { mode: "mutation", ref: makeFunctionReference<"mutation">("app:upsertUserProfileByEmail") },
  getCreditsByEmail: { mode: "mutation", ref: makeFunctionReference<"mutation">("app:getCreditsByEmail") },
  spendCreditsByEmail: { mode: "mutation", ref: makeFunctionReference<"mutation">("app:spendCreditsByEmail") },
  getSongsByEmail: { mode: "query", ref: makeFunctionReference<"query">("app:getSongsByEmail") },
  getSongCountByEmail: { mode: "query", ref: makeFunctionReference<"query">("app:getSongCountByEmail") },
  saveSongByEmail: { mode: "mutation", ref: makeFunctionReference<"mutation">("app:saveSongByEmail") },
  deleteSongById: { mode: "mutation", ref: makeFunctionReference<"mutation">("app:deleteSongById") },
  deleteAllSongsByEmail: { mode: "mutation", ref: makeFunctionReference<"mutation">("app:deleteAllSongsByEmail") },
  getTransactionsByEmail: { mode: "query", ref: makeFunctionReference<"query">("app:getTransactionsByEmail") },
  deleteAccountByEmail: { mode: "mutation", ref: makeFunctionReference<"mutation">("app:deleteAccountByEmail") },
  getOrCreateReferralCodeByEmail: { mode: "mutation", ref: makeFunctionReference<"mutation">("app:getOrCreateReferralCodeByEmail") },
  claimReferralCodeByEmail: { mode: "mutation", ref: makeFunctionReference<"mutation">("app:claimReferralCodeByEmail") },
  getReferralSummaryByEmail: { mode: "query", ref: makeFunctionReference<"query">("app:getReferralSummaryByEmail") },
  validateInviteCode: { mode: "mutation", ref: makeFunctionReference<"mutation">("inviteCodes:validateCode") },
  // NOTE: setProfileTier is deliberately NOT client-reachable (C2). Tier only
  // changes through the validated invite path / server logic, never a raw setter.
} as const;

/**
 * db actions whose payload is scoped to an email — the acting email is FORCED to
 * the session token's email. `validateInviteCode` takes only a `code`.
 */
const EMAIL_SCOPED_DB_ACTIONS: ReadonlySet<string> = new Set(
  Object.keys(dbRefs).filter((k) => k !== "validateInviteCode")
);

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Mint the reusable session bearer returned to the client on every successful
 * login. Throws (→ 500) if AUTH_TOKEN_SECRET is unset — we never issue a session
 * we cannot later verify.
 */
function mintSessionForEmail(email: string): string {
  const secret = process.env.AUTH_TOKEN_SECRET;
  if (!secret) throw new Error("AUTH_TOKEN_SECRET is not configured");
  return mintSessionToken({ email, secret });
}

function hashPassword(password: string, salt: string): string {
  return pbkdf2Sync(password, salt, 210000, 32, "sha256").toString("hex");
}

function safeEqualHex(a: string, b: string): boolean {
  const ab = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

function rejectRateLimited(res: VercelResponse, resetAt: number) {
  const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  res.setHeader("Retry-After", String(retryAfter));
  return res.status(429).json({ error: "Too many requests. Please slow down." });
}

function getConvexClient() {
  const convexUrl = process.env.CONVEX_URL;
  const convexAdminKey = process.env.CONVEX_ADMIN_KEY;
  if (!convexUrl || !convexAdminKey) {
    throw new Error("Missing CONVEX_URL or CONVEX_ADMIN_KEY");
  }
  const client: any = new ConvexHttpClient(convexUrl);
  client.setAdminAuth(convexAdminKey);
  return client;
}

async function enforceSkoolTierIfEligible(client: any, email: string) {
  try {
    const isSkoolMember = await client.query(isSkoolMemberByEmailRef as any, { email });
    if (isSkoolMember) {
      await client.mutation(setProfileTierRef as any, { email, tier: "skool" });
    }
  } catch (e: any) {
    console.error("[Skool Tier Sync Error]", e?.message || e);
  }
}

function splitNameFromEmail(email: string): { firstName: string; lastName: string } {
  const local = email.split("@")[0] || "";
  const cleaned = local.replace(/[._-]+/g, " ").replace(/\s+/g, " ").trim();
  if (!cleaned) return { firstName: "", lastName: "" };
  const parts = cleaned.split(" ");
  const firstName = parts[0] || "";
  const lastName = parts.slice(1).join(" ");
  return { firstName, lastName };
}

async function syncContactToGHL(input: {
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
}) {
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
    tags: [appTag, campaignTag],
  };

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      Version: apiVersion,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`GHL sync failed (${response.status}): ${details || "Unknown error"}`);
  }
}

/** Public origin used to build emailed links. */
function getSiteOrigin(): string {
  return (process.env.PUBLIC_SITE_URL || "https://www.songghost.com").replace(/\/+$/, "");
}

function escapeHtmlText(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * Email the single-use password-set link through GoHighLevel, the same path the
 * Prompt Book delivery uses. Best-effort: a mail failure is logged but never
 * surfaced to the caller, because the request endpoint deliberately returns an
 * identical response whether or not the address is registered.
 */
async function sendPasswordSetEmail(email: string, token: string): Promise<void> {
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
  const hdrs = (t: string) => ({
    Authorization: `Bearer ${t}`,
    Version: apiVersion,
    "Content-Type": "application/json",
    Accept: "application/json",
  });

  // Resolve the contact id (create-or-recover, exactly like the ebook flow).
  const contactRes = await fetch(`${base}/contacts/`, {
    method: "POST",
    headers: hdrs(apiToken),
    body: JSON.stringify({ locationId, email, source: "Password reset" }),
  });
  const contactText = await contactRes.text().catch(() => "");
  let contactJson: any = {};
  try { contactJson = JSON.parse(contactText); } catch { /* non-JSON */ }
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
  <p>— Rudy</p>
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
      ...(from ? { emailFrom: from } : {}),
      message: text,
    }),
  });
  if (!mailRes.ok) {
    const detail = await mailRes.text().catch(() => "");
    console.error("[Password Set Email] send failed", mailRes.status, detail.slice(0, 200));
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return;
  applyCors(req, res);

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { action, email, password } = (req.body || {}) as {
      action?:
        | "signup"
        | "signin"
        | "oauth"
        | "validateCommunityCode"
        | "db"
        | "request-password-set"
        | "set-password";
      email?: string;
      password?: string;
      referralCode?: string;
    };
    const referralCode = (req.body as any)?.referralCode;
    const communityCode = String((req.body as any)?.code || "").toUpperCase().trim();
    const dbAction = String((req.body as any)?.dbAction || "") as keyof typeof dbRefs;
    const dbPayload = (req.body as any)?.payload || {};

    if (action === "validateCommunityCode") {
      if (!communityCode) return res.status(400).json({ error: "Missing code" });
      const client = getConvexClient();
      const data = await client.mutation(validateInviteCodeRef as any, { code: communityCode });
      return res.status(200).json({ data });
    }

    if (action === "db") {
      // Fail closed: a valid session bearer is REQUIRED before any Convex call.
      const session = requireSession(req, res);
      if (!session.ok) return;
      if (!dbAction || !dbRefs[dbAction]) return res.status(400).json({ error: "Invalid db action" });
      // Derive identity from the token; never trust a caller-supplied email.
      const args = EMAIL_SCOPED_DB_ACTIONS.has(dbAction as string)
        ? { ...(dbPayload || {}), email: session.email }
        : dbPayload || {};
      const client = getConvexClient();
      const selected: any = (dbRefs as any)[dbAction];
      const data =
        selected.mode === "query"
          ? await client.query(selected.ref, args)
          : await client.mutation(selected.ref, args);
      return res.status(200).json({ data });
    }

    // OAuth session mint — REQUIRES a signed single-use token minted by the
    // OAuth callback (api/oauth/callback.ts) after a real provider exchange. A
    // bare `{action:"oauth", email}` (the pre-existing hole) is now rejected:
    // the email is derived from the verified token, never from the caller.
    if (action === "oauth") {
      const ip = getRequestClientId(req as any);
      const oauthRl = checkRateLimit(`auth:oauth:ip:${ip}`, 20, 60_000);
      if (!oauthRl.allowed) return rejectRateLimited(res, oauthRl.resetAt);

      const secret = process.env.AUTH_TOKEN_SECRET;
      if (!secret) {
        console.error("[Auth API] AUTH_TOKEN_SECRET is not configured");
        return res.status(500).json({ error: "Server authentication is misconfigured" });
      }
      const token = String((req.body as any)?.token || "");
      const verified = verifyToken(token, secret, { expectedPurpose: OAUTH_SESSION_PURPOSE });
      if (!verified.valid) {
        return res.status(401).json({ error: "Invalid or expired sign-in token" });
      }
      // Single-use, layer 1: in-process fast-reject (same warm instance).
      if (!consumeNonce(verified.payload.nonce, verified.payload.exp)) {
        return res.status(401).json({ error: "Sign-in token has already been used" });
      }
      const oauthEmail = normalizeEmail(verified.payload.email);
      if (!oauthEmail) {
        return res.status(401).json({ error: "Invalid sign-in token" });
      }

      const client = getConvexClient();
      // Single-use, layer 2 (authoritative): Convex records the nonce atomically,
      // so a token replayed against a DIFFERENT cold instance is still rejected.
      // Fail closed — any error here falls through to the 500 catch, denying mint.
      const consumeResult: any = await client.mutation(consumeAuthNonceRef as any, {
        nonce: verified.payload.nonce,
        exp: verified.payload.exp,
      });
      if (!consumeResult?.firstUse) {
        return res.status(401).json({ error: "Sign-in token has already been used" });
      }
      const existing: any = await client.query(getUserByEmailRef as any, { email: oauthEmail });
      const isNetNewUser = !existing?._id;
      const user: any = await client.mutation(upsertUserCredentialsRef as any, { email: oauthEmail });
      await enforceSkoolTierIfEligible(client, oauthEmail);
      if (isNetNewUser) {
        try {
          await syncContactToGHL({ email: oauthEmail });
        } catch (e: any) {
          console.error("[GHL Sync Error][oauth]", e?.message || e);
        }
      }
      return res.status(200).json({
        session: { user: { id: user?._id || `user_${oauthEmail}`, email: oauthEmail } },
        sessionToken: mintSessionForEmail(oauthEmail),
      });
    }

    // -----------------------------------------------------------------------
    // PASSWORD SET / RESET — closes the dead end left by H1 + H2.
    //
    // H2 refuses sign-in for accounts holding no password (community imports,
    // Google/Apple-created). H1 refuses signup for any address that already
    // exists. Together they left those users with no way to EVER own a
    // password. These two actions restore that without reopening either hole:
    // the only way through is to present a token we emailed to the address, and
    // the account is taken FROM THE TOKEN, never from the request body.
    // -----------------------------------------------------------------------
    if (action === "request-password-set") {
      const ip = getRequestClientId(req as any);
      const ipRl = checkRateLimit(`auth:pwreq:ip:${ip}`, 5, 60_000);
      if (!ipRl.allowed) return rejectRateLimited(res, ipRl.resetAt);

      const requestEmail = normalizeEmail(email || "");
      const emailRl = checkRateLimit(`auth:pwreq:email:${requestEmail}`, 3, 15 * 60_000);
      if (!emailRl.allowed) return rejectRateLimited(res, emailRl.resetAt);

      // The SAME response either way. Varying it would turn this endpoint into
      // an account-enumeration oracle ("is this person a SongGhost user?").
      const genericOk = {
        ok: true,
        message: "If that address has an account, we just sent it a link.",
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
        const client = getConvexClient();
        const existing: any = await client.query(getUserByEmailRef as any, { email: requestEmail });
        if (existing?._id) {
          await sendPasswordSetEmail(requestEmail, mintPasswordSetToken({ email: requestEmail, secret }));
        }
      } catch (e: any) {
        // Swallow: the caller must not be able to tell a lookup/mail failure
        // apart from "no such account".
        console.error("[Password Set Request Error]", e?.message || e);
      }
      return res.status(200).json(genericOk);
    }

    if (action === "set-password") {
      const ip = getRequestClientId(req as any);
      const rl = checkRateLimit(`auth:pwset:ip:${ip}`, 10, 60_000);
      if (!rl.allowed) return rejectRateLimited(res, rl.resetAt);

      const secret = process.env.AUTH_TOKEN_SECRET;
      if (!secret) {
        console.error("[Auth API] AUTH_TOKEN_SECRET is not configured");
        return res.status(500).json({ error: "Server authentication is misconfigured" });
      }

      const resetToken = String((req.body as any)?.token || "");
      const newPassword = String((req.body as any)?.password || "");
      if (newPassword.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }

      const verified = verifyPasswordSetToken(resetToken, secret);
      if (!verified.valid) {
        return res.status(401).json({ error: "This link is invalid or has expired. Please request a new one." });
      }
      // Single-use, layer 1: in-process fast-reject on a warm instance.
      if (!consumeNonce(verified.payload.nonce, verified.payload.exp)) {
        return res.status(401).json({ error: "This link has already been used. Please request a new one." });
      }
      const tokenEmail = normalizeEmail(verified.payload.email);
      if (!tokenEmail) {
        return res.status(401).json({ error: "This link is invalid or has expired. Please request a new one." });
      }

      const client = getConvexClient();
      // Single-use, layer 2 (authoritative): Convex records the nonce atomically,
      // so the same link replayed against a cold instance is still rejected.
      const consumeResult: any = await client.mutation(consumeAuthNonceRef as any, {
        nonce: verified.payload.nonce,
        exp: verified.payload.exp,
      });
      if (!consumeResult?.firstUse) {
        return res.status(401).json({ error: "This link has already been used. Please request a new one." });
      }

      const salt = randomBytes(16).toString("hex");
      const passwordHash = hashPassword(newPassword, salt);
      const user: any = await client.mutation(upsertUserCredentialsRef as any, {
        email: tokenEmail,
        passwordHash,
        passwordSalt: salt,
      });
      await enforceSkoolTierIfEligible(client, tokenEmail);

      return res.status(200).json({
        session: { user: { id: user?._id || `user_${tokenEmail}`, email: tokenEmail } },
        sessionToken: mintSessionForEmail(tokenEmail),
      });
    }

    const normalizedEmail = normalizeEmail(email || "");
    if (!action || !normalizedEmail) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if ((action === "signup" || action === "signin") && !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const credentialPassword = (action === "signup" || action === "signin") ? password : undefined;
    if (credentialPassword && credentialPassword.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    // Rate limit credential auth per-IP and per-email to blunt brute force.
    if (action === "signin" || action === "signup") {
      const ip = getRequestClientId(req as any);
      const ipRl = checkRateLimit(`auth:${action}:ip:${ip}`, 10, 60_000);
      if (!ipRl.allowed) return rejectRateLimited(res, ipRl.resetAt);
      const emailRl = checkRateLimit(`auth:${action}:email:${normalizedEmail}`, 10, 60_000);
      if (!emailRl.allowed) return rejectRateLimited(res, emailRl.resetAt);
    }

    const client = getConvexClient();
    const existing: any = await client.query(getUserByEmailRef as any, { email: normalizedEmail });
    const isNetNewUser = !existing?._id;

    if (action === "signup") {
      // H1: NEVER attach a password to an already-existing account (password OR
      // passwordless OAuth/Apple/skool). Any existing record → route to sign-in.
      // Attaching a new password to a passwordless account was an account-takeover.
      if (existing?._id) {
        return res.status(409).json({ error: "Account already exists. Please sign in." });
      }

      const salt = randomBytes(16).toString("hex");
      const passwordHash = hashPassword(credentialPassword!, salt);
      const user: any = await client.mutation(upsertUserCredentialsRef as any, {
        email: normalizedEmail,
        passwordHash,
        passwordSalt: salt,
      });
      await enforceSkoolTierIfEligible(client, normalizedEmail);
      if (isNetNewUser) {
        try {
          await syncContactToGHL({ email: normalizedEmail });
        } catch (e: any) {
          console.error("[GHL Sync Error][signup]", e?.message || e);
        }
      }

      if (referralCode && String(referralCode).trim()) {
        try {
          await client.mutation(claimReferralCodeByEmailRef as any, {
            email: normalizedEmail,
            code: String(referralCode).trim().toUpperCase(),
          });
        } catch (e) {
          // Keep signup successful even if referral code is invalid.
        }
      }

      return res.status(200).json({
        session: {
          user: {
            id: user?._id || `user_${normalizedEmail}`,
            email: normalizedEmail,
          },
        },
        sessionToken: mintSessionForEmail(normalizedEmail),
      });
    }

    // signin
    if (!existing?.passwordHash || !existing?.passwordSalt) {
      // SECURITY (H2): never mint a session on email alone. Passwordless
      // accounts (community members, OAuth/Apple-created) must sign in through
      // a provider that actually proves identity — the OAuth/Apple paths apply
      // the skool tier themselves on mint.
      const isSkoolMember = await client.query(isSkoolMemberByEmailRef as any, { email: normalizedEmail });
      if (isSkoolMember) {
        return res.status(401).json({
          error:
            "This community account doesn't have a password yet. Sign in with Google or Apple to continue.",
        });
      }
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const candidateHash = hashPassword(credentialPassword!, existing.passwordSalt);
    const ok = safeEqualHex(candidateHash, existing.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    await enforceSkoolTierIfEligible(client, normalizedEmail);

    return res.status(200).json({
      session: {
        user: {
          id: existing._id || `user_${normalizedEmail}`,
          email: normalizedEmail,
        },
      },
      sessionToken: mintSessionForEmail(normalizedEmail),
    });
  } catch (error: any) {
    console.error("[Auth API Error]", error);
    return res.status(500).json({ error: error?.message || "Authentication failed" });
  }
}
