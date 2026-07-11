/**
 * Sign in with Apple — native identity-token verification endpoint
 * (docs/PLAN.md "Auth on iOS"). The `@capacitor-community/apple-sign-in` native
 * sheet returns an identity token (a JWT signed by Apple); the client POSTs it
 * here. We verify the signature against Apple's JWKS and check iss/aud/exp/nonce
 * BEFORE trusting any identity. We deliberately do NOT reuse
 * `api/oauth/callback.ts` — its `decodeJwtEmail` does no signature check.
 *
 * On success we upsert the user by email using the same Convex `users` pattern
 * as `api/auth.ts` and return the identical session shape.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import { createRemoteJWKSet, jwtVerify } from "jose";
import {
  APPLE_AUDIENCE,
  APPLE_ISSUER,
  APPLE_JWKS_URL,
  validateAppleClaims,
  type AppleClaims,
} from "../lib/appleAuth";
import { applyCors, handlePreflight } from "../lib/cors";
import { checkRateLimit, getRequestClientId } from "../lib/rateLimit";

const upsertUserCredentialsRef = makeFunctionReference<"mutation">("users:upsertUserCredentials");
const isSkoolMemberByEmailRef = makeFunctionReference<"query">("app:isSkoolMemberByEmail");
const setProfileTierRef = makeFunctionReference<"mutation">("app:setProfileTier");

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
    console.error("[Skool Tier Sync Error][apple]", e?.message || e);
  }
}

/**
 * Module-scoped remote JWK set. `jose` caches the fetched keys internally
 * (honoring Cache-Control, with a coalescing cooldown) so warm invocations reuse
 * them and Apple's `/auth/keys` is not hit on every request. Creating it once at
 * module scope is what makes that cache effective across requests.
 */
const APPLE_JWKS = createRemoteJWKSet(new URL(APPLE_JWKS_URL), {
  cooldownDuration: 30_000,
  cacheMaxAge: 600_000,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return;
  applyCors(req, res);

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Rate limit per IP — sign-in attempts should be low-volume per client.
  const ip = getRequestClientId(req as any);
  const rl = checkRateLimit(`apple:ip:${ip}`, 20, 60_000);
  if (!rl.allowed) {
    res.setHeader("Retry-After", String(Math.ceil((rl.resetAt - Date.now()) / 1000)));
    return res.status(429).json({ error: "Too many requests. Please slow down." });
  }

  try {
    const { identityToken, nonce, email: bodyEmail } = (req.body || {}) as {
      identityToken?: string;
      nonce?: string;
      email?: string;
      fullName?: unknown;
    };

    if (!identityToken || !nonce) {
      return res.status(400).json({ error: "Missing identityToken or nonce" });
    }

    // The `aud` Apple stamps in is the app bundle id; allow an env override so a
    // rename/staging bundle can be verified without a code change.
    const audience = process.env.APPLE_BUNDLE_ID || APPLE_AUDIENCE;

    // 1. Cryptographic verification: signature (Apple JWKS) + iss + aud + exp.
    let claims: AppleClaims;
    try {
      const { payload } = await jwtVerify(identityToken, APPLE_JWKS, {
        issuer: APPLE_ISSUER,
        audience,
      });
      claims = payload as AppleClaims;
    } catch (e: any) {
      console.error("[Apple Verify Error]", e?.message || e);
      return res.status(401).json({ error: "Invalid Apple identity token" });
    }

    // 2. Claim validation (defense-in-depth iss/aud/exp) + nonce (jose skips it).
    const validation = validateAppleClaims(claims, { nonce, audience });
    if (!validation.valid) {
      return res.status(401).json({ error: "Apple identity token rejected", reason: validation.reason });
    }

    // 3. Resolve the binding email. Apple includes `email` (relay or real) in the
    //    identity token; fall back to the client-supplied value only if absent.
    const email = (validation.email || (bodyEmail || "")).toLowerCase().trim();
    if (!email) {
      return res.status(401).json({ error: "Apple account did not provide an email" });
    }

    const client = getConvexClient();
    const user: any = await client.mutation(upsertUserCredentialsRef as any, { email });
    await enforceSkoolTierIfEligible(client, email);

    return res.status(200).json({
      session: {
        user: {
          id: user?._id || `user_${email}`,
          email,
        },
      },
    });
  } catch (error: any) {
    console.error("[Apple Auth API Error]", error);
    return res.status(500).json({ error: error?.message || "Apple authentication failed" });
  }
}
