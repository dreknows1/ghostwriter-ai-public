# PLAN — SongGhost landing page + /app migration

Read with `BRIEF.md` (audience, positioning, approved copy deck) and
`DESIGN-RESEARCH.md` (reference set, motion playbook, type ramp, anti-patterns).

## Architecture

`songghost.com` currently serves the Vite SPA from `dist/`. That same `dist/` is
Capacitor's `webDir` for the iOS app, so the SPA **cannot** be rebased to `/app/` —
it would break the iOS bundle, and it would drag the landing page's video into the
app binary.

Instead the deploy output is composed at build time:

```
vite build            -> dist/            (unchanged, byte-for-byte; iOS unaffected)
landing/              -> hand-written static marketing page
scripts/build-site.mjs-> site/            (what Vercel serves)

site/index.html        landing page                songghost.com
site/app/index.html    the SPA                     songghost.com/app
site/assets/*          Vite chunks (absolute refs, so /app resolves them)
site/brand/*           logo + Rudy artwork
site/media/*           landing video + product footage
site/fonts/*           self-hosted Unbounded + Manrope
site/privacy.html      unchanged
```

`vercel.json` sets `outputDirectory: "site"` and rewrites `/app`, `/app/`, and
`/app/*` to `/app/index.html`. `/api/*` functions are untouched.

### Migration hazards and how each is handled

| Hazard | Handling |
|---|---|
| `api/oauth/callback.ts` redirects to `/?oauth_token=…` | **Left alone.** The landing page bounces those params to `/app`. Changing the API would also change behaviour for the shipped iOS build. |
| `api/create-checkout-session.ts` returns to `/?status=success&session_id=…` | Same bounce. No Stripe dashboard change needed. |
| `App.tsx` rewrote the URL to `/` after OAuth and after checkout | Fixed — all three `replaceState` calls now preserve `window.location.pathname`, so a signed-in user is never moved off `/app`. |
| Invite links `origin/?ref=CODE` | `?ref` is **not** read from the URL by the app (it's a form field), so these can land on the marketing page. No bounce needed. |
| Preview deployments couldn't build | `check-auth-env.mjs` now fails closed on production only; previews warn and build. |

### The legacy-param bounce

`landing/index.html` runs this **before** anything renders:

```js
if (/[?&](oauth_token|oauth_error|status|session_id)=/.test(location.search))
  location.replace('/app/' + location.search + location.hash);
```

Deliberately excludes `ref`. Uses `replace` so it leaves no history entry.

## Page structure (approved)

Adapted from DESIGN-RESEARCH, with two overrides:

- **No social-proof band.** We have no verified App Store rating or real reviews.
  Inventing them is off the table; an empty proof band is worse than none.
- **No scroll-scrubbed hero video.** The hero is a mood loop, not a product scrub.
  Scrubbing buys nothing here and is the memo's own top mobile-jank risk.

1. **Hero** — full-bleed Rudy loop, mask-revealed H1, dual CTA.
2. **The prompts** — three real things someone would type.
3. **Meet Rudy** — the craft argument, character-led.
4. **How it works** — three steps, sticky-pinned, **real captured product footage**.
5. **Features** — six, from the copy deck.
6. **Who it's for** — three archetypes.
7. **Closing CTA** + footer (logo, ©, Privacy).

CTAs appear three times: hero, after the demo, closing.

## Non-negotiables

- Cream `#F7F3EA`, ink `#1a1a1a`, accent `#2b5be0`,
  CTA `linear-gradient(150deg,#3f78ff,#2b5be0 55%,#6a3cf0)`.
- Unbounded headlines, Manrope body, both self-hosted (`landing/fonts/`).
- App Store: `https://apps.apple.com/us/app/id6789995320`. Web app: `/app`.
- Every product image/clip is real captured footage.
- No framework, no build step for the landing page — plain HTML/CSS/JS.
- Respect `prefers-reduced-motion` everywhere.

## Test matrix — results

Executed against the preview deployment of `landing-page`, not localhost.

| # | Check | Result |
|---|---|---|
| 1 | `GET /` | ✅ 200, landing page |
| 2 | `GET /app` | ✅ 200, SPA boots to the auth screen, no console errors |
| 3 | `GET /app/`, `/app/deep/link` | ✅ 200, same SPA, no 404 |
| 4 | App Store CTA | ✅ resolves to `/us/app/songghost-ai-songwriting/id6789995320`, 200 |
| 5 | Web app CTA | ✅ navigates to `/app`, SPA boots |
| 6 | `/?oauth_token=…` | ✅ bounces to `/app/?oauth_token=…`; app consumes it, then cleans the URL **to `/app/`, not `/`** — which is the App.tsx fix working |
| 7 | `/?status=success&session_id=…` | ✅ bounces with the query intact |
| 7b | `/?status=live`, `/?ref=CODE` | ✅ stay on the landing page (regex tightened after the audit) |
| 8 | `/privacy.html` | ✅ 200 |
| 9 | `/brand/songghost-logo.png` | ✅ 200 (SPA depends on it) |
| 10 | Mobile 390×844 | ✅ `scrollWidth == clientWidth`, every element within 20–370px, all 13 tap targets ≥44px |
| 10b | 320px | ✅ no overflow, no masthead collision (was a real bug; fixed) |
| 11 | `prefers-reduced-motion` | ✅ no video attaches, typed line resolves complete, caret retired, nothing left invisible |
| 12 | Weight | ✅ above-fold ≈200 KB; hero video 874 KB desktop / 317 KB mobile |
| 13 | iOS build untouched | ✅ `dist/` is byte-for-byte what it was; the landing tree never enters it |
| 14 | Production after merge | see below |

### Known gap

`AUTH_TOKEN_SECRET` is set for the Production environment only, so authenticated
API routes 500 **on previews**. Everything above is verified; a full signed-in
session is only exercisable on production. Adding a *different* secret to the
Preview environment would close this — see the note in `scripts/check-auth-env.mjs`.
