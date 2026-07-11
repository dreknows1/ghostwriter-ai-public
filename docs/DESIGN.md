# SongGhost iOS — Design Document

## Part 1: Mobbin research (2026-07-11, GC pass)

Goal: ground the iOS design in proven, shipped patterns. Focus areas: the create
flow, generated-result handling, paywall, onboarding, and overall aesthetic that is
"fun but professional" and passes App Review guideline 4.2 (must not feel like a
wrapped website).

### Reference 1 — Suno iOS (the direct comp; SongGhost's users live here)
- Create screen: https://mobbin.com/screens/48165c4e-ed84-4b4b-bea0-74f7c77c0164
- Discover/home: https://mobbin.com/screens/adbae331-e11f-4dc1-a568-393452350a59
- Splash: https://mobbin.com/screens/c37fdf3e-f84f-4cf4-898d-217f7f96c945

Why it works:
- **Warm cream/off-white canvas, black text** — instantly avoids the dark-purple
  "AI slop" look. Feels like a creative tool, not a chatbot.
- **The create screen is 90% empty space**: one prompt field, model-version chips
  (v3.5/v4 with a lime highlight on the active one), a "songs left" credit counter,
  "Surprise me" + genre chips, Instrumental toggle, and ONE giant gradient-blue
  "Create" pill. Zero visual competition with the core action.
- **Persistent floating Create pill** on every browse screen — the core action is
  never more than one tap away.
- **Segmented control (Discover | Library)** instead of heavy tab bar for top-level
  nav; hamburger for the rest.
- **Personality via texture**: retro-photo splash with rotating marginalia text
  ("we're all creators", "bring back the fun"). Fun lives in moments, not in the
  working surfaces.

GC take: SongGhost should *rhyme* with Suno (its users are Suno users — familiarity
reduces friction) but not clone it; SongGhost's job is the writing brain that feeds
Suno, so the lyric/result surface deserves more weight than Suno gives it.

### Reference 2 — Generated-result action grammar
- Google Gemini result actions: https://mobbin.com/screens/3fcfa9eb-e611-465c-92aa-297005ad7db4
- Deepstash Rephrase/Enhance: https://mobbin.com/screens/c139797d-6ce8-4fc1-bf6d-3b38024f8f33
- Obsidian mobile editor toolbar: https://mobbin.com/screens/2092380b-d5a6-48c2-910a-671dd80ed973

Why they work:
- Gemini's row under generated text (👍 👎 ↻ share copy ⋯) is the *standard grammar*
  users already know for AI output. Use it under generated lyrics/prompts.
- Deepstash puts transformation actions ("Rephrase", "Enhance") as sparkle-chips at
  the TOP of content with one dark pill CTA at the bottom — clean split between
  "transform" and "commit" actions. Maps perfectly to lyric revision actions
  (tighten verse, change rhyme scheme, more imagery...).
- Obsidian's formatting toolbar docked above the keyboard is the pattern for
  editing lyrics on a phone without losing context.

### Reference 3 — Paywall
- Fabric Pro: https://mobbin.com/screens/667e5ecf-e086-4bc6-843a-1a129f8e82b4
- Otter trial-first: https://mobbin.com/screens/069b8d18-90af-4324-b05a-024153e9e5b6
- ABY Journal (personality + anti-pitch): https://mobbin.com/screens/65f1ef09-8067-43b6-a2d0-2210febda055
- Fixtured comparison table: https://mobbin.com/screens/0576cc85-bcfb-48ce-9115-cc4fbd774e02

Why they work:
- Fabric is the cleanest: soft brand-glow header, benefit line, "No commitment,
  cancel any time" ABOVE the plans, three stacked plan rows with SAVE % badges,
  single black CTA showing the actual price, "Restore purchase" link. This is the
  template.
- Otter frames the header as "Unlock pro features free for 7 days" — trial-first
  framing beats price-first.
- ABY's "Premium is NOT for you if…" section is a personality moment worth stealing
  in SongGhost's voice.
- Required by App Review: Restore Purchases link, real price near CTA, terms links.

### Reference 4 — Onboarding
- YouTube Music "Pick 5 artists": https://mobbin.com/flows/dfe30247-8a80-486a-9c65-545c30a8f4b6
- Epidemic Sound (editorial brand + personalization): https://mobbin.com/flows/0921b530-6c61-4a8b-8b8b-583fa5aab199
- Behance creative-field tile picker: https://mobbin.com/flows/f232980a-e49d-48bc-ae56-baccc5883db8

Why they work:
- Short personalization beats feature tours: 1–2 picker screens ("What genres do
  you write?" — tile grid like Behance/YT Music) that actually seed the app's
  defaults, then straight into creating. No 6-screen carousel.
- Epidemic Sound's bold flat-color editorial art direction shows how a music brand
  can be playful and grown-up at once.
- Progress bars on top, Skip always available.

### Distilled direction (feeds the design shotgun)
1. Warm light canvas + one electric accent for the core CTA + one supporting accent
   for chips/highlights. Dark mode later, not v1.
2. One giant prompt-first create screen; suggestion chips do the teaching.
3. Results get the Gemini action grammar + Deepstash-style revision chips.
4. Persistent floating Create pill wherever the user browses their library.
5. Fabric-template paywall, trial-first header, SongGhost voice.
6. Onboarding = 2 personalization pickers + permission/paywall, all skippable.
7. Fun lives in personality moments (splash, empty states, loading copy, "ghost"
   motif) — never in the working surfaces.

## Part 2: Design direction decision (GC, 2026-07-11)

Five variants produced (docs/design-variants/), all covering the same 5 screens.
Judged rendered, side by side, at phone size.

**WINNER: Variant 2 — Haunted Studio Noir** (variant-2-haunted-studio.html)
Ink-black/charcoal canvas, candlelight-amber primary, spectral teal secondary,
lyrics on a warm "lamplit page" that glows against the dark room.

Why it wins:
- It is the only variant that makes SongGhost feel like a BRAND, not a nice
  generic app. The ghost identity, the séance metaphor, and the late-night
  studio context (when musicians actually write) all reinforce each other.
- The lamplit lyric page is the best product moment in the shotgun: the app's
  entire value (the writing) literally glows. Hierarchy is perfect on the
  result screen: parchment lyrics → teal prompt → giant amber "Open in Suno".
- Best generating screen of the five (glowing ghost + VU meters + "Mixing the
  séance") — personality exactly where the user is waiting.
- Dark done right: zero purple, zero glassmorphism; music apps live in dark
  (Spotify, YT Music) so it reads native to the category.

Runners-up and why rejected:
- V3 Editorial Music-Mag (2nd): bold, charming, distinctive ticket-stub chips
  and color-coded song sections; rejected because the loud print style risks
  fatigue across a whole working app, and it serves the brand less than the
  ghost/studio concept.
- V1 Warm Minimal (3rd): flawless execution, perfect hierarchy — but reads as
  "Suno-adjacent" to the point of anonymity. Safe, forgettable.
- V5 Songwriter's Notebook (4th): the most beautiful lyric typography; too
  quiet for the "fun" half of the brief; action row at top is a thumb miss.
- V4 Soft Playful Ghost (5th): pleasant but the most generic; mascot energy
  undersold; one keeper idea (below).

Grafts from runners-up (mandatory in build):
1. From V5: serif/manuscript treatment for lyric text ON the lamplit page +
   [VERSE]/[CHORUS] editorial section marks; serif italic story placeholder.
2. From V4: "Uses 1 credit · N left this month" transparency line under Create.
3. From V5: "Let Ghost decide" chip WITH the small ghost icon on quick-create
   (V2's create screen was missing the ghost-decide chip entirely — defect).
4. Paywall copy corrections (V2's mockup copy is wrong about the product):
   no "Unlimited song generations" (credit model!), no "Full 9-step Studio"
   as a paid gate (wizard is free). Benefits must reflect real entitlements:
   500 credits/mo, priority generation, new genre packs.

Design tokens (build reference, from the winning mockup):
- bg-0 ink #141210-ish, bg-1 charcoal #1D1A17, hairlines rgba(255,255,255,.08)
- amber primary ~#E8963E→#F2B45C (CTA gradient, 2-stop only), amber-bright for
  glow accents
- teal secondary ~#4FC8B4 (links, checks, tags — never for CTAs)
- parchment page #F3E9D2 with ink text for lyrics
- Unbounded (display), Manrope (UI), + serif for lyric content (graft #1)
- Fun lives in: generating screen, empty states, toasts, paywall subline
  ("No séance required."). Working surfaces stay quiet.
