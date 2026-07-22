#!/usr/bin/env node
/**
 * Build-time guard for AUTH_TOKEN_SECRET (SECURITY HOTFIX).
 *
 * The web app's authenticated API routes (/api/auth, /api/db, /api/ai,
 * /api/oauth/callback) sign and verify session bearer tokens with
 * AUTH_TOKEN_SECRET. If that secret is missing in a deployed build, every
 * authenticated request fails closed with a 500 and the live site is
 * effectively down. This guard makes a misconfigured PRODUCTION build fail
 * LOUDLY at build time instead of shipping a site that 500s at runtime.
 *
 * Escape hatch for LOCAL dev ONLY: set SKIP_AUTH_ENV_CHECK=1 to bypass (e.g. a
 * `pnpm build` smoke test on a laptop that doesn't have the production secret).
 * A real Vercel production build does NOT set that flag, so it fails closed.
 */

if (process.env.SKIP_AUTH_ENV_CHECK === "1") {
  console.log(
    "[check-auth-env] SKIP_AUTH_ENV_CHECK=1 set — skipping AUTH_TOKEN_SECRET check (local dev only)."
  );
  process.exit(0);
}

const secret = process.env.AUTH_TOKEN_SECRET;
if (!secret || !secret.trim()) {
  console.error(
    [
      "",
      "✖ Build blocked: AUTH_TOKEN_SECRET is not set.",
      "",
      "The authenticated API routes (/api/auth, /api/db, /api/ai,",
      "/api/oauth/callback) sign and verify session tokens with AUTH_TOKEN_SECRET.",
      "Deploying without it ships a site whose every authenticated request 500s.",
      "",
      "Fix: set AUTH_TOKEN_SECRET in this environment to a long random string",
      "(Vercel → Project → Settings → Environment Variables, or your shell).",
      "",
      "Local-only escape hatch: re-run with SKIP_AUTH_ENV_CHECK=1 to bypass this",
      "check for a local build that does not exercise auth.",
      "",
    ].join("\n")
  );
  process.exit(1);
}

console.log("[check-auth-env] AUTH_TOKEN_SECRET present — build may proceed.");
