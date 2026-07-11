# SongGhost Codebase Audit — iOS Conversion Input (2026-07-11)

Produced by audit subagent; verified claims cite file:line. Root:
`~/conductor/workspaces/suno-ai-songwriter/da-nang`.

## 1. Screens & navigation
- No router lib. State-based: `AppView` enum (LANDING, STUDIO, PRICING, HELP,
  PROFILE, AUTH, TERMS) + `AppStep` in `types.ts`; rendered by if-blocks in
  `App.tsx:1139-1712` (file is 1715 lines).
- Core flow: AUTH → LANDING dashboard → STUDIO wizard (`BuilderStepId`,
  `App.tsx:99`): language → genre → room → theme → purpose → audience → voice →
  instruments → story → GENERATING → SONG_DISPLAYED/EDITING_SONG
  (`components/LyricsDisplay.tsx`).
- Peripheral: `PricingView.tsx`, `ProfileView.tsx`, `TermsAndPrivacy.tsx`,
  `MenuDrawer.tsx` → `UtilityHub.tsx` (invite/earn/whatsnew/help/support/feedback/
  terms/privacy/about), `MetaTagLibrary.tsx` (Suno tag picker), `AskAndreWidget.tsx`
  (AI chat), `ApiKeyModal.tsx` (BYO Gemini key), `IntroAnimation.tsx` (framer-motion
  splash), `Feedback.tsx` (toasts).
- `blog-app/` = separate Next.js project, own deploy. Out of scope.

## 2. Auth
- Custom, NOT Convex Auth. `services/authService.ts`: session
  `{user:{id,email}}` in localStorage key `gwai_session`.
- `api/auth.ts`: PBKDF2 (210k iters) against Convex `users` table
  (`convex/users.ts`).
- OAuth (Google/Discord/Facebook/Microsoft/Apple): full-page redirect via
  `api/oauth/start.ts` (HttpOnly state cookies) → `api/oauth/callback.ts`.
- Identity = email string threaded through "...ByEmail" Convex functions. No JWTs.

## 3. Payments (all Stripe files)
- `lib/stripe.ts` (loader), `components/PricingView.tsx:53-66` (checkout via
  `window.location.href` full-page redirect), `api/create-checkout-session.ts`
  (SKUs: `pro_monthly` $24.99/mo sub = 500 credits; one-time `pack_250/100/50`;
  Skool tier 25% off pro), `api/stripe-webhook.ts` (checkout.session.completed +
  invoice.paid → `billing:applyStripeCheckoutCreditsByEmail`),
  `api/checkout-complete.ts` (client reconciliation fallback), `convex/billing.ts`
  (idempotent via `stripeEvents` + `transactions`).
- **Entitlement model = consumable credit economy**, not feature gates.
  `profiles.credits` + `tier: "public"|"skool"`; monthly reset to baseline
  (25 public / 100 skool) in `convex/app.ts:399-450`; costs in
  `services/creditService.ts` (song=10, art=8, social=1, edit=1, avatar=100).
  Owner email gets unlimited sentinel.
- Dead code: `convex/credits.ts`, `convex/songs.ts` (userId-keyed, zero callers);
  live path is email-keyed in `convex/app.ts`. Also emptied
  `app/api/create-checkout-session/route.ts`.

## 4. Backend topology
- Convex tables: users, profiles, savedSongs, creditLedger, transactions,
  stripeEvents, referralCodes, referrals, skoolMembers, inviteCodes, blogAuthors,
  blogPosts. Functions: `convex/app.ts` (24 exports incl. account deletion),
  `billing.ts`, `users.ts`, `inviteCodes.ts`; `http.ts` (token-gated dashboards);
  `crons.ts` (monthly Skool invite rotation).
- Vercel fns: auth, db, create-checkout-session, stripe-webhook,
  checkout-complete, health, oauth/start, oauth/callback, ai.js (compiled from
  `server/ai.ts`, 1237 lines).
- AI is server-only (OpenAI/Anthropic/Gemini keys in env); client uses
  `services/geminiService.ts` → `fetch('/api/ai')`. Exception: BYO-key modal
  calls Google directly from browser.
- Curriculum: 60+ `SONGWRITING_PROFILE_*.md` compiled at build time by
  `scripts/compile-curriculum.mjs` → `server/engine/curriculum.generated.ts`.

## 5. Deployment
- Vercel project `ghostwriter-ai-public`. Live prod inferred at
  `https://www.songghost.com` (referenced across code); fallback
  `ghostwriter-ai.vercel.app`. Convex dev deployment `dev:wry-vulture-422` in
  `.env.local`; prod Convex deployment not directly verified.

## 6. Styling
- **Tailwind via CDN `<script>` in index.html** (not in package.json!) + inline
  config. `app/theme.css` (139 lines, CSS custom props `--bg-0`, `--accent`).
- Google Fonts Manrope/Unbounded via <link> (network dependency). Vestigial
  importmap block (AI Studio export leftover) — unused by Vite build.
- Responsive prefixes used 169×; `hover:` used 126× (touch risk); one @media
  query in theme.css. Viewport meta correct. framer-motion used only in
  IntroAnimation.

## 7. Mobile-conversion risks (ranked)
1. HIGH — CDN Tailwind → must move to build-time package.
2. HIGH — Stripe full-page redirect breaks in Capacitor webview. (Moot on iOS:
   replaced by IAP; web build unaffected.)
3. MED — OAuth full-page redirect + HttpOnly cookies won't survive native flow;
   needs system browser + universal link/custom scheme callback.
4. MED — Google Fonts CDN → self-host.
5. MED — Blob/anchor album-art download (`LyricsDisplay.tsx:153-160`) → needs
   Capacitor Filesystem/Share.
6. LOW-MED — sessionStorage intro flag replays oddly in native lifecycle.
7. LOW — window.open/target=_blank (3 sites) → Browser plugin.
8. LOW — navigator.clipboard (2 sites) → verify under WKWebView.
9. LOW — drag-and-drop tag picker already has tap fallback.
10. NON-ISSUE — no audio playback/recording anywhere in the app.
- ADDITIONAL (GC): all API calls are relative `fetch('/api/...')` — breaks under
  capacitor:// origin. Needs API base-URL wrapper + CORS on Vercel fns.

## 8. Build & git
- `npx tsc --noEmit` passes clean (strict mode). Build:
  compile:curriculum && tsc && vite build && build:api. Vitest tests exist for
  server engine.
- Branch `logo-update-clean`, tree clean, remotes:
  dreknows1/ghostwriter-ai-public.
