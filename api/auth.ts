import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import { pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";

const getUserByEmailRef = makeFunctionReference<"query">("users:getUserByEmail");
const upsertUserCredentialsRef = makeFunctionReference<"mutation">("users:upsertUserCredentials");
const claimReferralCodeByEmailRef = makeFunctionReference<"mutation">("app:claimReferralCodeByEmail");

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { action, email, password } = (req.body || {}) as {
      action?: "signup" | "signin" | "oauth";
      email?: string;
      password?: string;
      referralCode?: string;
    };
    const referralCode = (req.body as any)?.referralCode;

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

    const client = getConvexClient();
    const existing: any = await client.query(getUserByEmailRef as any, { email: normalizedEmail });

    if (action === "oauth") {
      const user: any = await client.mutation(upsertUserCredentialsRef as any, {
        email: normalizedEmail,
      });
      return res.status(200).json({
        session: {
          user: {
            id: user?._id || `user_${normalizedEmail}`,
            email: normalizedEmail,
          },
        },
      });
    }

    if (action === "signup") {
      if (existing?.passwordHash && existing?.passwordSalt) {
        return res.status(409).json({ error: "Account already exists. Please sign in." });
      }

      const salt = randomBytes(16).toString("hex");
      const passwordHash = hashPassword(credentialPassword!, salt);
      const user: any = await client.mutation(upsertUserCredentialsRef as any, {
        email: normalizedEmail,
        passwordHash,
        passwordSalt: salt,
      });

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
      });
    }

    // signin
    if (!existing?.passwordHash || !existing?.passwordSalt) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const candidateHash = hashPassword(credentialPassword!, existing.passwordSalt);
    const ok = safeEqualHex(candidateHash, existing.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    return res.status(200).json({
      session: {
        user: {
          id: existing._id || `user_${normalizedEmail}`,
          email: normalizedEmail,
        },
      },
    });
  } catch (error: any) {
    console.error("[Auth API Error]", error);
    return res.status(500).json({ error: error?.message || "Authentication failed" });
  }
}
