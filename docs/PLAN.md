# SongGhost iOS — PLAN v1.0 (final; reconciles CEO/Eng/Design reviews, 2026-07-11)

Inputs: BRIEF.md, AUDIT-IOS.md, DESIGN.md. Review verdicts: CEO = selectively
expand; Eng = architecture sound with 4 seams (not 3) + credit-system fix
required; Design = FAST_TRACK quick mode is the default create rail.

## Architecture: Capacitor shell, one codebase, four seams

- Capacitor 7 + `@capacitor/ios` on the existing Vite project; `dist/` is webDir.
  Web deploys (Vercel) and iOS builds (Xcode) from the SAME source. iOS release =
  `npm run build && npx cap sync ios` + archive.
- The ONLY places web/iOS fork:
  1. `lib/platform.ts` — `isNative()`, `isIOS()`.
  2. `lib/api.ts` — base-URL wrapper. Web: relative. Native: `VITE_API_BASE`
     (https://www.songghost.com). MUST cover all call sites:
     `services/authService.ts:20,37,54,71`, `services/geminiService.ts:43,163`,
     `services/creditService.ts:16`, `components/PricingView.tsx:33,53`,
     `App.tsx:830`.
  3. `services/entitlementService.ts` — payments interface (below).
  4. `lib/nativeBridge.ts` — post-purchase refresh (RevenueCat purchase/
     CustomerInfo listener → re-fetch credits; replaces web's `?status=success`
     URL-param reconcile at `App.tsx:767-846`, which stays web-only).
- Server: CORS explicit origin allowlist (`capacitor://localhost`,
  `https://www.songghost.com`) on Vercel fns — never `*`.

## Pre-wrap hardening (launch blockers; also improve web)
1. CDN Tailwind → build-time package (config out of index.html).
2. Self-host Manrope/Unbounded (bundled woff2).
3. Remove vestigial AI-Studio importmap from index.html.

## Credits & payments (fixes a live bug; Stripe aligned to same model)

Current bug (verified): monthly reset at `convex/app.ts:410-428` hard-overwrites
credits to 25/100 and cannot recognize a subscriber (`profiles.tier` is only
public|skool, schema.ts:23); Stripe renewals are additive on a different clock;
pack credits are wiped at rollover.

New model (applies to BOTH stores):
- Schema (`profiles`): add `plan?: "free"|"pro"`, `planExpiresAt?: number`,
  `planSource?: "stripe"|"revenuecat"`, `packCredits?: number` (never reset).
  Existing `credits` = monthly-allowance bucket.
- Reset: `proActive = plan==="pro" && planExpiresAt > now`;
  baseline = proActive ? 500 : skool ? 100 : 25. Calendar reset SKIPS active Pro
  (their refill comes from renewal events). `packCredits` untouched.
- Spend (`spendCreditsByEmail`): monthly bucket first, then packCredits.
- RevenueCat grant path: `api/revenuecat-webhook.ts` (bearer
  `REVENUECAT_WEBHOOK_SECRET`; app_user_id = login email) → Convex
  `billing:applyRevenueCatEvent` — idempotent via new `rcEvents` table
  (by_event index, mirrors stripeEvents) + `rcTransactionId` on transactions.
  Event map: INITIAL_PURCHASE/RENEWAL/UNCANCELLATION → plan=pro, expiry, bucket
  set-to-500; NON_RENEWING_PURCHASE → packCredits += pack size;
  CANCELLATION → no change; EXPIRATION/BILLING_ISSUE → plan=free after expiry,
  never zero credits; REFUND → claw back, clamp ≥0.
- Stripe path updated to match (renewal = set-to-500, not additive). No
  migration machinery — subscriber base negligible (owner decision).
- Products (RevenueCat): `sg_pro_monthly` $24.99 w/ 7-DAY FREE TRIAL;
  consumables `sg_pack_50` ($4.99, the FEATURED first purchase), `sg_pack_100`,
  `sg_pack_250`.
- Offer structure (CEO): free 25 credits usable before any ask; paywall appears
  on spend-block, not at the door; starter pack featured above Pro.
- Guideline 3.1.1: iOS build contains ZERO references to web purchasing or
  Skool discounts (entitlementService strips; verified in QA row 23).
- App Review: Restore Purchases button; StoreKit-sourced prices on paywall.

## Auth on iOS (v1 = email/password + Sign in with Apple ONLY)
- Google/Discord/Facebook/Microsoft: web-only. Cutting Google removes the
  native OAuth-redirect seam and the guideline 4.8 trigger is satisfied by
  Apple's presence.
- Sign in with Apple: `@capacitor-community/apple-sign-in` native sheet →
  NEW server endpoint verifying identity token against Apple JWKS
  (iss appleid.apple.com, aud = iOS bundle id com.songghost.app, nonce check,
  relay-email handling) → upsert by email. Do NOT reuse api/oauth/callback.ts
  (its decodeJwtEmail does no signature verification).
- SECURITY FIX (in scope, pre-existing): `api/auth.ts` `action:"oauth"` mints a
  session for any bare email — replace with signed single-use token
  (HMAC email+nonce+exp) minted by the OAuth callback / Apple verify endpoint;
  add rate limiting (lib/rateLimit.ts exists, unused here); CORS allowlist.
- Session storage → Capacitor Preferences behind authService interface
  (incl. intro-seen flag).

## Generation resilience (GC decision — no spike; designed fallback)
- Risk: SSE generation (server/ai.ts maxDuration 300) dies if app backgrounds
  >~30s (WKWebView suspension). Mitigation v1:
  1. `@capacitor-community/keep-awake` during GENERATING state.
  2. Generation idempotency key: retry/resume after failure never double-spends
     credits (spend recorded against the key).
  3. On foreground with a dead stream: auto-retry with same key; ghost-voiced
     "reconnecting the séance" state.
- QA rows 25-26 validate on device. If real-world failure rate is bad →
  fast-follow: server-side job persistence (pending-song record, server saves on
  completion, client polls). Explicitly OUT of v1 build.
- Verify Vercel plan supports maxDuration 300 + streaming on
  ghostwriter-ai-public (eng risk #6) before build completes.

## Create experience (design + CEO convergence)
- FAST_TRACK (`AppStep.FAST_TRACK`, types.ts:21 — designed but never built;
  App.tsx:1702 always renders full SongBuilder) becomes the DEFAULT create
  screen on all platforms: story textarea + genre chip row + "Let Ghost decide"
  defaults + Create. `buildInputs()` (App.tsx:254-268) already treats '' as
  ghost-decides. Full 9-step wizard stays, behind "Customize every detail".
- Result screen hierarchy inverted: "Open in Suno" (deep link `suno://` /
  universal link, fallback share sheet + clipboard) is the hero action;
  Save Record secondary.
- Rating prompt (SKStoreReviewController via capacitor plugin) after first
  successful song. Smart App Banner meta tag on songghost.com (web change).
- Strip on native: "Set AI Key" (MenuDrawer + LANDING footer), referral/earn
  hub, blog links out via @capacitor/browser.

## Native-feel layer (guideline 4.2)
- Safe areas (viewport-fit=cover + env() insets), status bar, splash + icon
  from brand/ ghost logo, haptics on step transitions/generation-complete/copy,
  kill hover-only affordances (126 sites — audit §6), pressed states,
  keyboard handling for story/lyrics editing, wizard transitions
  (framer-motion), blob downloads → @capacitor/share + Filesystem,
  window.open → @capacitor/browser, clipboard → @capacitor/clipboard.
- Visual direction: decided by design shotgun (DESIGN.md Part 2). Constraints:
  move OFF the purple-gradient/glassmorphism slop (theme.css:27-74); keep
  Manrope/Unbounded; ghost personality moments (generating copy, empty states,
  toasts) per design review.

## Store/ops
- Bundle ID com.songghost.app; ASC app "SongGhost". ASC API key
  ~/.app-store-keys/AuthKey_F233C7SK2J.p8 for uploads/metadata; IAP products +
  offer codes via ASC UI. Privacy labels: email, purchases, user content, no
  tracking. Account deletion already in-app. ASO: no "Suno"/"Udio" in
  name/subtitle (hidden keywords only). Phased release: Skool community first.

## Test matrix (30 rows — execute in QA stage)
| # | Area | Scenario | Expected |
|---|------|----------|----------|
| 1 | Happy | Fresh install → email signup → quick-create → song → saved → copy | Persists; clipboard OK in WKWebView |
| 2 | Happy | Returning user cold-launch, session in Preferences | LANDING, credits fetched, no re-login |
| 3 | Auth | Apple sign-in first time | Native sheet; JWKS-verified; aud=bundle id; upserted |
| 4 | Auth | Apple returning (relay email) | Same account, no dup profile |
| 5 | Auth | Apple "Hide My Email" | Relay address binds credits/songs |
| 6 | Auth | (web reg) Google OAuth on web unchanged | Works as today |
| 7 | Auth | Cancel Apple sheet mid-flow | Graceful, back to AUTH, no partial session |
| 8 | Sec | POST /api/auth {action:"oauth",email:other} | REJECTED without signed token |
| 9 | Auth | Email/pw over CORS from capacitor://localhost | 200; 401 wrong pw; rate-limited brute force |
| 10 | Pay | Buy sg_pack_50 sandbox | +50 exactly once; webhook idempotent |
| 11 | Pay | RC webhook redelivered same event id | rcEvents dedupe, no double grant |
| 12 | Pay | Pro sub sandbox purchase | plan=pro, expiry set, bucket=500 |
| 13 | Pay | Sandbox RENEWAL | Bucket set-to-500, not additive |
| 14 | Pay | Pro crosses UTC month pre-renewal | NOT clobbered to 25/100 |
| 15 | Pay | Pack credits across month rollover | packCredits survive |
| 16 | Pay | Monthly bucket empty, packs remain | Spend draws from packCredits |
| 17 | Pay | CANCELLATION (auto-renew off) | Credits kept until expiry |
| 18 | Pay | EXPIRATION past period end | plan=free; credits not zeroed |
| 19 | Pay | REFUND of a pack | Clawed back, clamped ≥0 |
| 20 | Pay | Restore Purchases on reinstall | Sub re-recognized |
| 21 | Pay | Purchase → immediate balance check | Optimistic UI, reconciles, no stuck 0 |
| 22 | Gate | 9 credits, song costs 10 | Blocked with paywall CTA, no charge |
| 23 | Gate | iOS build purchase surfaces | ZERO web-pricing/Skool-discount references (3.1.1) |
| 24 | Offline | Airplane-mode launch | No white screen; graceful errors |
| 25 | Bkgd | Background 60-120s mid-generation | Completes or auto-resumes, no double charge |
| 26 | Bkgd | Screen lock + Low Power mid-stream | Keep-awake prevents; retry clean |
| 27 | Native | Notch/Dynamic Island safe areas; no hover-hidden actions | Correct insets; all actions reachable |
| 28 | Native | Album art save via Share/Filesystem | Photos/share sheet works |
| 29 | WebReg | Stripe ?status=success reconcile on web | Unchanged |
| 30 | WebReg | Web bundle free of Capacitor/RC imports | Tree-shaken, isNative() guards hold |

## Branch plan
New branch `ios-app` off `logo-update-clean` (clean tree). Verify which branch
Vercel prod deploys from before merge planning.
