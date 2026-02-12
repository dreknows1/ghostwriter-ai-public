import type { VercelRequest, VercelResponse } from "@vercel/node";
import { randomBytes } from "node:crypto";

type Provider = "google" | "discord" | "facebook" | "microsoft" | "apple";

type ProviderConfig = {
  authorizeUrl: string;
  clientId?: string;
  scope: string;
  extraParams?: Record<string, string>;
};

function getBaseUrl(req: VercelRequest): string {
  const proto = (req.headers["x-forwarded-proto"] as string) || "https";
  const host = (req.headers["x-forwarded-host"] as string) || req.headers.host;
  return `${proto}://${host}`;
}

function getProviderConfig(provider: Provider): ProviderConfig {
  const configs: Record<Provider, ProviderConfig> = {
    google: {
      authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      clientId: process.env.OAUTH_GOOGLE_CLIENT_ID,
      scope: "openid email profile",
      extraParams: { access_type: "online", prompt: "select_account" },
    },
    discord: {
      authorizeUrl: "https://discord.com/api/oauth2/authorize",
      clientId: process.env.OAUTH_DISCORD_CLIENT_ID,
      scope: "identify email",
      extraParams: { prompt: "consent" },
    },
    facebook: {
      authorizeUrl: "https://www.facebook.com/v20.0/dialog/oauth",
      clientId: process.env.OAUTH_FACEBOOK_CLIENT_ID,
      scope: "email public_profile",
    },
    microsoft: {
      authorizeUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
      clientId: process.env.OAUTH_MICROSOFT_CLIENT_ID,
      scope: "openid profile email User.Read",
      extraParams: { prompt: "select_account" },
    },
    apple: {
      authorizeUrl: "https://appleid.apple.com/auth/authorize",
      clientId: process.env.OAUTH_APPLE_CLIENT_ID,
      scope: "name email",
      extraParams: { response_mode: "form_post" },
    },
  };
  return configs[provider];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const provider = String(req.query.provider || "").toLowerCase() as Provider;
  if (!["google", "discord", "facebook", "microsoft", "apple"].includes(provider)) {
    return res.status(400).json({ error: "Unsupported OAuth provider" });
  }

  const config = getProviderConfig(provider);
  if (!config.clientId) {
    return res.redirect(`/?oauth_error=${encodeURIComponent(`${provider} sign-in is not configured`)}`);
  }

  const state = randomBytes(24).toString("hex");
  const callbackUrl = `${getBaseUrl(req)}/api/oauth/callback`;

  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: callbackUrl,
    scope: config.scope,
    state,
  });

  if (config.extraParams) {
    for (const [k, v] of Object.entries(config.extraParams)) {
      params.set(k, v);
    }
  }

  res.setHeader("Set-Cookie", [
    `oauth_state=${state}; Max-Age=600; Path=/; HttpOnly; Secure; SameSite=Lax`,
    `oauth_provider=${provider}; Max-Age=600; Path=/; HttpOnly; Secure; SameSite=Lax`,
  ]);

  return res.redirect(`${config.authorizeUrl}?${params.toString()}`);
}
