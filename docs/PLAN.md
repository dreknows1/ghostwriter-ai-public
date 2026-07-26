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

## Test matrix (executed at Stage 6)

| # | Check | Pass condition |
|---|---|---|
| 1 | `GET /` on preview | Landing page, 200 |
| 2 | `GET /app` on preview | SPA boots, renders, no console errors |
| 3 | `GET /app/` and a deep link `/app/x` | Same SPA, no 404 |
| 4 | App Store CTA | Navigates to `apps.apple.com/us/app/id6789995320` |
| 5 | Web app CTA | Navigates to `/app`, SPA boots |
| 6 | `/?oauth_token=test` | Bounces to `/app/?oauth_token=test` |
| 7 | `/?status=success&session_id=x` | Bounces to `/app/?...` |
| 8 | `/privacy.html` | Still 200 |
| 9 | `/brand/songghost-logo.png` | Still 200 (SPA depends on it) |
| 10 | Mobile viewport 390×844 | No horizontal scroll, CTAs reachable, video plays inline |
| 11 | `prefers-reduced-motion: reduce` | No autoplaying motion, page still legible |
| 12 | Lighthouse-ish weight budget | Hero above-fold payload < 3 MB |
| 13 | iOS build untouched | `dist/` contents identical to a pre-change build |
| 14 | Production after merge | `/` and `/app` both healthy |
