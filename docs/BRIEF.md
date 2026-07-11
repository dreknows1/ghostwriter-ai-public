# SongGhost iOS — BRIEF (GStack forcing questions)

Answered 2026-07-11 with Andre's decisions; assumptions marked.

## 1. Who exactly is this for?
The Suno hobbyist-musician: someone who generates songs in the Suno iOS app,
belongs to communities like Andre's Skool group, and wants their songs to sound
*written*, not prompted. They already know SongGhost from the web
(www.songghost.com). They live on their phone.

## 2. What painful problem does it solve?
"My Suno songs sound generic and my lyrics are weak — and the tool that fixes
that is stuck on my desktop while song ideas hit me everywhere else." SongGhost's
genre curriculum + guided studio turns an idea into pro-structured lyrics and a
Suno-ready style prompt; the iOS app puts that one tap away from the Suno app
itself.

## 3. What is the ONE core action?
Turn an idea into a complete, Suno-ready song — structured lyrics + style
prompt — through the guided Studio wizard, then copy/share it into Suno.
Everything else (library, credits, profile, referrals) is support.

## 4. Why use this instead of what they do today?
Today: SongGhost web on a phone browser (desktop-shaped, no native feel, easy to
forget), or ChatGPT (generic — no genre curriculum, no Suno meta-tag grammar, no
song-structure engine). The iOS app is the same songwriting brain, resident on
the home screen, built for thumbs, sharing straight into Suno.

## 5. Smallest shippable version (v1 scope — updated after plan reviews)
IN: auth (email/password + Sign in with Apple ONLY), FAST_TRACK quick-create
as the default rail (full 9-step wizard behind "Customize every detail"), song
display/edit with "Open in Suno" as the hero action, saved-songs library,
credit balance + spend, RevenueCat paywall (Pro w/ 7-day trial + credit packs,
$4.99 starter pack featured; free 25 credits usable before any ask), profile
(incl. account deletion — Apple requires it), terms/privacy, native polish
(safe areas, haptics, splash, icon, transitions), rating prompt after first
song, Smart App Banner on songghost.com.
OUT (stays web-only for v1): Google/Discord/Facebook/Microsoft sign-in, blog,
BYO-Gemini-key modal (and its prominent menu entry — stripped on native),
referral/earn hub, Skool-tier discount purchase path (Skool pricing never
mentioned in-app — guideline 3.1.1), admin/metrics, server-side generation job
persistence (fast-follow only if QA shows backgrounding failures).

## 6. What would make us kill this project?
- The wrapped app can't clear App Review guideline 4.2 (feels like a website) —
  polish is a launch requirement, not a nice-to-have.
- Maintaining iOS forks the codebase. Single source of truth is the point: if
  web and iOS diverge structurally, the approach has failed. Platform
  differences must live behind small, explicit seams (platform module,
  entitlement service), never as parallel screens.

## Owner decisions on record
- v1 = core songwriting flow (2026-07-11)
- Stripe is live but subscriber base is negligible → design entitlements cleanly
  around RevenueCat, no migration machinery (2026-07-11)
- Finish line = full App Store submission, not just TestFlight (2026-07-11)
- Trademark rule: "Suno"/"Udio" never in App Store name/subtitle; hidden
  keywords only (carried from Lyricon ASO playbook)
