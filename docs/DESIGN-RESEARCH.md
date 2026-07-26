# SongGhost Landing Page — Design Research Memo

Mobbin MCP was unavailable this session (unauthenticated); all references below were verified via live web fetch/browser navigation, not invented.

## Reference set

- **Duolingo** — [duolingo.com](https://duolingo.com). Duo the owl sits inside a full cluster of ensemble characters, not alone — steal the idea that a mascot reads as *alive* when it shares the frame with a world, not a logo lockup.
- **Finch** — [finchcare.com](https://finchcare.com). The App Store badge and "500k+ ratings, 5.0" sit directly beside the character in the hero, before any explanatory copy — steal the proof-before-pitch ordering.
- **Replika** — [replika.com](https://replika.com). A rendered 3D companion overlaid with a live chat bubble on a soft sky gradient — the closest visual cousin to Rudy-as-ghostwriter; steal the chat-bubble-over-character compositing.
- **Character.AI** — [character.ai](https://character.ai). Full-bleed cinematic character art inside one rounded card against near-black — proves a character scene alone can carry drama with zero UI chrome around it.
- **Arc / Dia** — [arc.net](https://arc.net). Dual CTA done right: "Download for Mac/Windows" repeats as the loud action, "Try Dia" (web) stays a single quiet text link — steal the weight asymmetry, not an even split.
- **AG1** — [drinkag1.com](https://drinkag1.com). Autoplaying full-bleed real-footage video sits directly on a white page, no dark scrim — proof that video contrast doesn't require a dark section.
- **Apple AirPods Pro** — [apple.com/airpods-pro](https://www.apple.com/airpods-pro/). Still the reference implementation for scroll-scrubbed product video that everyone else benchmarks against.
- **Jones Road Beauty** — [jonesroadbeauty.com](https://jonesroadbeauty.com). Cream base plus exactly one warm serif-italic accent line — steal the restraint: one decorative type flourish per screen, not a system.
- **Cluely** — [cluely.com](https://cluely.com). One oversized serif claim on a gradient sky, no supporting clutter — steal the confidence of a single-line hero with nothing competing for attention.

## Structural recommendation

1. **Hero** — Rudy full-bleed cinematic loop behind a mask-revealed headline; dual CTA (App Store badge primary, "Try it in your browser" as a quiet secondary link). *Sets emotional tone in the first second, matching the Replika/Duolingo character-first pattern.*
2. **Proof marquee** — CSS ticker of real generated lyric lines / song titles. *Establishes product breadth immediately at near-zero performance cost.*
3. **Narrative scene (sticky-pinned)** — three beats scrub across one pinned viewport: a feeling → a memory → a finished song, Rudy reacting at each beat. *Explains the product through story instead of a feature list, the single highest-leverage character moment on the page.*
4. **Product demo** — real iOS + web footage side by side in device frames, scroll-scrubbed. *Grounds the fantasy in an actual, working product before asking for belief.*
5. **Social proof band** — App Store rating + real review lines. *Trust checkpoint right before the second conversion ask, per Finch's ordering.*
6. **Secondary CTA band** — dual CTA repeats. *Catches scroll-past visitors without feeling like a paywall.*
7. **Closing beat** — a small Rudy callback animation + final CTA. *Bookends the emotional arc the hero opened.*

CTA repeats exactly three times (hero, mid-demo, closing) — enough to catch every scroll depth without diluting urgency.

## Motion playbook

1. **Scroll-scrubbed hero video** — bind `video.currentTime` to scroll fraction via `IntersectionObserver` + `requestVideoFrameCallback` (fallback `rAF`); never toggle play/pause. *Perf: keep clip ≤10s at 720p — mobile Safari hitches on 4K decode-per-frame seeking.*
2. **Sticky-pinned narrative** — pure CSS `position: sticky; top: 0` inside a `height: 300vh` wrapper, content driven by scroll fraction. *Perf: avoid `position: fixed` + JS-computed offsets — that's the classic layout-thrash trap; native sticky never triggers reflow.*
3. **Text mask reveal (headline)** — `IntersectionObserver` flips a class once on enter, animate `opacity`/`transform` only. *Perf: never drive `clip-path` continuously per scroll frame on mobile — GPU cost spikes; fire once, not scroll-linked.*
4. **Marquee ticker** — pure CSS `@keyframes translateX` loop, zero JS. *Perf: cheapest effect available; add `will-change: transform` and pause under `prefers-reduced-motion`.*
5. **CTA magnetic hover** — `pointermove` listener throttled via `rAF`, `transform: translate()` only. *Perf: desktop-only — gate behind a hover-capability media query so touch devices skip the listener entirely.*
6. **Parallax (single layer)** — native `animation-timeline: scroll()` where supported, static fallback otherwise. *Perf: this is the trap category — multi-layer parallax via scroll-listener `rAF` polling is the #1 mobile jank source; CSS scroll-timeline avoids the JS listener altogether.*
7. **Section background transitions** — `IntersectionObserver` threshold toggles a CSS custom property; use a layered `opacity` overlay rather than repainting `background-color`. *Perf: `background-color` transitions are a paint operation, not a composite one — expensive at full-bleed size.*

## Type ramp

**Unbounded** (headlines/eyebrow — display only, never body):

| Role | Desktop | Mobile | Weight | Tracking |
|---|---|---|---|---|
| Eyebrow | 13px | 11px | 500 | 0.12em, uppercase |
| H1 | `clamp(2.75rem, 5vw + 1rem, 5.5rem)` | floor ~2.25rem | 700–800 | -0.01em |
| H2/subhead | `clamp(1.75rem, 2.5vw + 1rem, 2.75rem)` | floor ~1.5rem | 600 | -0.005em |

Keep weight 800/900 out of anything under ~28px — Unbounded's wide, tall-x-height letterforms clot at small sizes.

**Manrope** (all body copy):

| Role | Desktop | Mobile | Weight | Line-height |
|---|---|---|---|---|
| Lede/large body | 1.25rem | 1.125rem | 500 | 1.5 |
| Body | `clamp(1rem, 0.5vw + 0.9rem, 1.125rem)` | 1rem min | 400–500 | 1.6 |

Never render Unbounded as a fallback stack failure into system-sans — self-host both faces with `font-display: swap` so a flash of Manrope-as-headline never happens.

## Anti-pattern checklist

- [ ] No purple/blue gradient blur blobs floating behind hero text as generic decoration.
- [ ] No 3–4 card grid of generic feature icons with one-line abstractions ("Fast", "Secure", "Simple").
- [ ] No glassmorphic frosted navbar unless it's load-bearing for an actual layered scroll effect.
- [ ] No floating social-proof chips with fake blurred avatars.
- [ ] No auto-scrolling testimonial carousel with generic first-name-only quotes and 5-star icon rows.
- [ ] No hero copy that could belong to any AI SaaS ("Unlock your creativity," "Powered by AI") — name the exact action: turning a text you never sent into a real song.
- [ ] No CTA labeled just "Learn More" — every button names its destination (App Store / web app).
- [ ] No more than one parallax layer active in a single viewport at once.
- [ ] No scroll-jacking that overrides native scroll momentum — pinning is fine, hijacking direction/speed is not.
- [ ] No Unbounded rendered below ~14px, and never as body text under any circumstance.
