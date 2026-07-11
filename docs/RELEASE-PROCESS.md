# SongGhost — Release & Integration Process

Written after the 2026-07-11 production incident (below). This is the model for
how the web app and the iOS app share one codebase **without** the iOS work ever
breaking the live web site.

## The incident (what must never recur)
PR #90 merged the whole `ios-app` branch into `main`. `main` auto-deploys to
Vercel (www.songghost.com), so unfinished iOS work went straight to production.
Two defects turned that into a full login/generation outage:
1. The new session-auth API routes imported `../lib/cors` etc., but Vercel didn't
   bundle those cross-dir imports in ESM mode → `ERR_MODULE_NOT_FOUND` at load →
   every `/api/auth` and `/api/ai` call 500'd.
2. The auth code fails closed without `AUTH_TOKEN_SECRET`, which was never set in
   prod → the parts that did load still 500'd.
Recovery was a Vercel rollback to the last-good deployment (`a5602a9`, PR #89).

Root cause was as much **process** as code: work-in-progress on a shared branch
was merged to the auto-deploying production branch, and the code wasn't safe to
deploy without config it never received.

## The integration model (how web + iOS share one codebase)
Single repo, single source of truth = **`main`**.
- **Web**: `main` auto-deploys to Vercel → songghost.com.
- **iOS**: built from the **same `main`** tree. Capacitor wraps the web build
  (`dist/`) into the native shell: `npm run build && npx cap sync ios`, then
  archive in Xcode. **App Store release is a manual step**, never automatic.
- Net effect (the original goal): a change to shared code lands on `main` → web
  deploys automatically **and** the next iOS build picks it up via `cap sync`.
  "Update once, both update."
- **Platform differences live behind seams**, inert on the other platform:
  `lib/platform.ts` (isNative), `lib/api.ts` (API base URL),
  `services/entitlementService.ts` (Stripe on web / RevenueCat IAP on iOS),
  `lib/nativeBridge.ts` (native helpers). iOS-only code is allowed on `main`
  **only because** these seams make it a no-op on web.

## The rules that prevent recurrence
1. **Nothing reaches `main` unless it is web-safe.** Backend/engine/shared changes
   must not break the web app. If a change touches `api/**`, `convex/**`,
   `server/**`, or shared UI, it is a WEB change first.
2. **Verify on a Vercel PREVIEW deploy before production.** Every PR gets a
   preview URL. Exercise `/api/auth`, `/api/ai`, and login on the preview before
   promoting. Local `tsc`/`build` do NOT replicate Vercel's serverless function
   bundling — the preview is the only real test.
3. **The iOS branch is never merged wholesale into `main`.** It **rebases from**
   `main`. iOS work lands on `main` in small, independently-deployable, web-safe
   slices:
   - Capacitor config + native seams (inert on web) → safe to land anytime.
   - The security/auth backend fix → lands as its OWN web-verified PR (it benefits
     web too), NOT bundled with UI.
   - The Haunted Studio redesign → lands on `main` ONLY when it is the intended
     web look too and has passed web QA; otherwise it stays iOS-gated behind
     `isNative()`.
4. **Deploy safety is enforced in code, not memory:**
   - API routes must be self-contained on Vercel (pre-bundle like `api/ai.js`, or
     `vercel.json` includeFiles) — no un-bundled cross-dir imports.
   - The build fails loudly if `AUTH_TOKEN_SECRET` is missing while session-auth
     code is present — a misconfigured deploy can't silently 500 the site.
   - Required env vars are documented and set in Vercel/Convex BEFORE the code
     that needs them is deployed.
5. **One Conductor session per branch.** Multiple sessions sharing one worktree
   (as happened here — 5 on `ios-app`) causes concurrent commits and merges no
   single session is aware of. One session owns a branch at a time.

## The go-live sequence for the iOS work (once complete)
1. Land the **web-safe backend** (session-auth security fix) on `main` as its own
   PR → preview-verify → set `AUTH_TOKEN_SECRET` in prod → promote. Web keeps
   working; security holes close for web too.
2. Land **Capacitor + native seams** on `main` (inert on web) → preview-verify.
3. Decide the **redesign**: ship to web (deliberate, QA'd) OR keep iOS-gated.
4. iOS release: `npm run build && npx cap sync ios` → Xcode archive → TestFlight →
   App Store. RevenueCat + ASC provisioning per docs/PLAN.md.
5. From then on: shared changes to `main` flow to web (auto) and iOS (next
   `cap sync` + build). iOS-specific changes stay behind seams.

## Env / config that must exist before deploying the auth code
- Vercel (prod): `AUTH_TOKEN_SECRET`, plus existing `CONVEX_URL`,
  `CONVEX_ADMIN_KEY` (rotate — it guarded formerly-open endpoints),
  `STRIPE_*`, `REVENUECAT_WEBHOOK_SECRET`.
- Convex (prod): deploy the schema/functions (`authNonces`, tightened
  validators) BEFORE the Vercel code that calls them.
