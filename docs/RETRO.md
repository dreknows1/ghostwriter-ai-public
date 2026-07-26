# Retro — SongGhost landing page

## What shipped

A cinematic single-page front door at `songghost.com`, with the existing web app
moved intact to `/app`. Editorial cream chassis, two full-bleed dark interludes
carrying generated Rudy footage, one genuine product capture, dual CTA repeated
three times.

## What worked

- **Composing the deploy output instead of rebasing the SPA.** `dist/` is
  Capacitor's `webDir`; rebasing it to `/app/` would have broken the iOS bundle
  and pushed the landing page's ~4.6 MB of video into the app binary. Building
  `site/` from `dist/` + `landing/` kept iOS byte-for-byte identical.
- **Pushing an infrastructure-only preview before building anything.** The
  routing contract was proven on real Vercel infra while the page was still a
  placeholder, which is also how the preview-build blocker surfaced early
  instead of at ship time.
- **Adversarial review earned its cost.** Two skeptics with distinct lenses
  found eleven things I had missed, including the one a visitor would have hit
  first: at 320px the wordmark rendered as "SongGhos" under the nav CTA. Their
  contrast numbers matched my independent calculation to 0.01, which is the
  cross-check that made the rest of their findings trustworthy.

## What I got wrong

- **Overlaying type on generated footage.** I spent three rounds nudging scrim
  gradients trying to make a headline legible across Rudy's chest. The right
  move — give the film its own column and put the type on solid black — was
  available at round one. When a fix needs its third gradient tweak, the layout
  is wrong, not the gradient.
- **Trusting one screenshot pipeline.** Headless Chrome clamps windows to
  ≥500px, so my 390px renders looked catastrophically clipped. I nearly "fixed"
  a layout that was already correct. The real browser's measured rects settled
  it. Measure before you fix.
- **Reveal-on-scroll as the only path to visible content.** `opacity: 0` waiting
  on an IntersectionObserver meant printing, non-scrolling renderers, and a
  blocked `main.js` all produced a blank page. Three separate failsafes now
  exist because the original design had none.

## Routing notes

- Haiku was never used; nothing on this job was mechanical enough.
- The three parallel design variants were worth it *as information* even though
  none shipped intact — the winner was A's chassis with B's premise and C's
  detailing. The two rejected variants cost ~275k tokens and bought a decision
  I'd otherwise have made blind.
- The product-footage agent was the one real routing failure. It burned ~40
  minutes stuck behind an `xcode-select` misconfiguration it could not diagnose
  or report. A brief that said "if the simulator tooling errors, stop and report
  within five minutes" would have saved all of it.

## Open items for Dre

1. **`AUTH_TOKEN_SECRET` is Production-only.** Add a *different* value to the
   Preview environment so preview deployments can exercise sign-in (and so
   preview sessions can never be replayed against production).
2. **`xcode-select` points away from Xcode**, which disables the iOS Simulator
   tooling entirely: `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`.
   Until that is run, no agent can drive the simulator.
3. **Deeper product footage.** Only one authenticated app screen could be
   captured. With (2) fixed, the language picker, genre picker, lyrics view,
   cover art and Suno/Udio handoff can all be shot and dropped into the
   "How it works" section, which is built to take them.
