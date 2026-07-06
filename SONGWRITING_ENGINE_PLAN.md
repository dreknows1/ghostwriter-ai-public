# How the App Learns to Write Songs — The Plan (v2)

> Companion to SONGWRITING_BRAIN.md (the curriculum). Plain language. Nothing gets built
> until the founder approves this plan.
> v2: revised after adversarial review by a working songwriter/producer and a skeptical
> engineer. Their two fatal findings and all major risks are folded in below.
> Status: DRAFT v2 — for founder review.

---

## 1. The Big Idea: the curriculum IS the engine — with real plumbing

**SONGWRITING_BRAIN.md — the plain-English curriculum you are writing — becomes the app's
actual brain.** When you edit it, the app's writing changes. No engineer between your taste
and the machine.

How that works mechanically (so it can't silently break like everything else has):
- At build time, a step converts the curriculum into code the app carries inside itself
  (the same "self-contained bundle" fix that ended the guides-never-loaded disaster).
  **No file reads at run time, ever.**
- **The build fails loudly** if the converted curriculum is missing, empty, or suspiciously small.
- The live site reports a **curriculum fingerprint** on its health check, and an automated
  smoke test confirms a known sentence from your curriculum is actually inside the deployed
  writer's instructions. If your words aren't in the machine, alarms ring — no more silent rot.
- **Size budget:** the compiled writing instructions are capped at **~3,700 tokens per
  song** (measured against the real approved curriculum: core ~1,200 + genre profile
  ~800 + largest room card ~750, with ~50 headroom — the build fails the moment content
  exceeds it). New rules must refine or replace old ones, not pile on — with a standing
  rule-pruning test (drop a rule, run the batch; if quality doesn't drop, the rule dies).
  This is the guard against rebuilding the 5,000-word rule wall one reasonable note at a time.
- **Per-song slice:** the writer never sees the whole curriculum. Compilation selects the
  universal core + the active genre's profile + the ONE active sub-genre page — nothing
  else. The sub-genre pages in SONGWRITING_SUBGENRES.md are teaching text; each compiles
  down to a compact writer card (~650-800 tokens of dials + spec defaults; the
  stories-it-serves notes stay behind for landing and never reach the writer), and the
  whole per-song slice is capped at **~3,700 tokens** (the size budget above). The
  composing-process layer also stays out of the slice — the engine's own steps enact it.
  Same pruning law applies to cards as to rules.

## 2. How composing works — now with the beat in the room

*(The songwriter critic's fatal catch #1: my draft had lyrics written in a rhythmic vacuum —
no tempo, no groove, no bar counts anywhere. "Per-song math is craft; uniform math was the sin.")*

**Step 0 — The story arrives whole.** ONE canonical input field, end to end. The old
second field is deleted and the server rejects (loudly) anything sent the old way.
An automated test drives the app's real request path and verifies every character of the
story reaches the writer. Runs on every change.

**Step 1 — The brief (structured data, never prose).** The app decides: core emotion,
song purpose, point of view (who's speaking, to whom), the turn — **and the musical spec
for THIS song: tempo range, groove feel (straight/swung/half-time), bars per section, and
how dense the words should sit on that tempo.** A hip-hop 16 at 140 half-time is a different
writing job than 90 BPM boom-bap; the brief says which one this is. Every field is checked
by code. Nothing free-text flows downstream (this is what makes another "Catchy" impossible).

**Step 1a — The room (sub-genre).** The brief carries exactly ONE sub-genre, landed by
the rules in SONGWRITING_SUBGENRES.md: the user's explicit pick wins; otherwise code
counts strong/weak story cues from the sub-genre pages; when cues are weak or split, the
genre's declared safe default. The chosen room fills in the musical-spec DEFAULTS above
and the writing dials the drafts are judged against. The decision (picked / inferred /
defaulted, plus which cues fired) is logged on the song record and SHOWN to the user —
never a silent swap. Fusions and era requests ("trap soul", "90s R&B") resolve to a named
page if one exists; otherwise nearest parent page, stamped "not-yet-deep". The brief
schema gains these as real code-checked fields: the sub-genre, the landing rule that
fired with its triggering cues, and the depth stamp — validated like every other field.

**Step 2 — Hooks, plural.** The app writes **10–15 hook/title candidates** and picks the
strongest by code-checkable criteria (length, meter, plainness, story fit) — the way real
writers sing twenty and keep one. In R&B and hip-hop, candidates that carry a double
entendre or a flipped common phrase get preference — that's where the hook pays rent.

**Step 3 — Section jobs for THIS song.** What verse 1 establishes, what the pre builds,
what the chorus declares, what the bridge reveals — planned against the musical spec
(a gospel song plans its vamp cell here; a hip-hop song plans its flow switch).

**Step 4 — Write THE song, straight through.** *(Founder order 2026-07-02: one user
input produces ONE song. The earlier 2–3-parallel-drafts design is dead.)* The engine
writes one complete draft, one voice, guided by: the compiled curriculum, the genre's
Composer Profile, the room card, the brief, the chosen hook, the section plan.
**No numeric one-size rules, no example lines to imitate.**

**Step 5 — The checks GATE the song; they never rewrite it and never pick between
versions.** The old "revise like a writer" idea is out — an AI can't actually "read
aloud," and an unconstrained revision pass is the photocopy machine with better branding
(engineer's words). Code checks the one draft: passing → it ships. If a trim pass exists
at all, it may only DELETE lines — enforced in code (every surviving line must exist in
the original draft) — never rewrite or add.

**Step 6 — Code checks (no AI) — now including the musical ones.** The checks are
parameterized by the chosen sub-genre page's dials — a check runs only where the room
turns it on (some rooms forbid perfect symmetry; drill forbids a lifted singable chorus):
- story-fidelity (the song references the user's actual specifics)
- hook placement, chorus consistency, **chorus lines metrically parallel** (matching
  syllable counts/stress — the single biggest "writing for melody" rule, where the room
  wants it)
- line lengths vs THIS song's musical spec (per-song math, not uniform math)
- singable line endings (open vowels where lines hold)
- nursery-rhyme detector (flags six consecutive same-length end-stopped lines)
- format, tags from the genre's own vocabulary, no leaked labels, no plagiarism
  (paraphrase-aware, not just word-for-word)

**If the draft fails the checks: ONE more write with plain writer-voice guidance**
("keep your chorus lines the same length" — never raw checker strings pasted into the
prompt), then an honest "let's try again" — never a least-bad song. One input, one song,
or an honest miss.

## 3. Composer Profiles — how a writer thinks per genre, AND how it renders

One page per priority genre — **R&B, Hip-Hop, Gospel, Reggae, Afrobeats, Pop** (the
"Reggae / Afrobeats" priority slot is TWO genres and gets two profiles, each with its own
declared safe default) — covering:
- how phrasing, line length, and rhyme expectations change (hip-hop's profile defines
  flow in bars and stress patterns — a **flow plan** is part of its brief)
- where the devices live (entendres in R&B/hip-hop; scripture allusion in gospel)
- section conventions (gospel vamps and ascends; pop crowns the chorus)
- point-of-view norms (gospel legitimately pivots I→we/You between verse and chorus —
  the "one POV" rule bends where the genre's tradition says so)
- **"How this renders" — the Suno section the first draft of this plan forgot entirely**
  (the songwriter critic's fatal catch #2): the tag vocabulary native to the genre, ad-lib
  notation, how to write a vamp cell the renderer will actually vamp, how to create
  instrumental space. The renderer is the singer, band, and arranger — writing for it is
  part of the craft, not an afterthought.
- what disqualifies a song in that genre
- **the genre's sub-genre pages** (from SONGWRITING_SUBGENRES.md), each with fixed slots:
  musical-spec defaults, writing dials, render vocabulary (sounds and delivery notes,
  never slang), a story-cue list with every cue marked strong or weak, era mappings, and
  what disqualifies a song in that room — plus the profile's ONE declared safe default.
  Adding a room later (bachata under Latin, say) is a new curriculum page held to the same
  standard, never new engineering.

**Dialect rule (hard):** patois/pidgin appears ONLY if the user wrote it in their story.
Otherwise the genre's rhythm and phrasing carry the identity in standard English — an AI
generating dialect the user didn't write produces parody, not authenticity.

**No quoted lyric lines allowed anywhere in profiles or curriculum** — enforced by a build
check. Profiles teach thinking. Example lines become house formulas (we lived it).

You review and approve every profile before it goes live.

## 4. Your ear is the gate — made statistically honest

The blind-judge panels are fired from ship decisions. But the engineer showed my "grade 10,
pass 7" idea was noise (a coin-flip engine passes it 1 time in 6). The honest version:

1. **20 songs per gate**, generated through the REAL deployed path (not my laptop —
   so what you grade is exactly what users get).
2. Salted with **ringers you aren't told about**: a couple of duplicates (checks your
   consistency), plus decoys from the old engine and plain ChatGPT (calibrates your bar
   and keeps the test honest in both directions).
3. **Pass bar: 14 of 20 of the new engine's songs**, judged blind.
4. Each fail gets **one reason tag** (hook / flow / generic / story-mismatch / genre-false /
   **wrong-room** (the sub-genre landing failed — fix the cue list) / **wrong-writing-in-
   the-right-room** (the sub-genre page failed — fix its dials) / other) — so your feedback
   compounds into targeted fixes instead of "everything is bad" with nothing to steer by.
5. Grade on your schedule — the batch waits; nothing ships meanwhile.
6. Your notes become **candidate** rules, tested before they become law (see the size
   budget in §1) — never auto-appended.

## 5. Drift protection — so a passed engine stays passed

- **Model pinning:** the exact AI model version is locked in the repo. If the provider
  or we change it, the frozen regression batch re-runs automatically and you re-gate.
- **Formula watchdog:** a nightly job compares recent songs across users per genre for
  repeated lines/images — the "everyone gets the same sad-objects song" failure becomes
  an alarm instead of a founder discovery months later.
- **Prod telemetry:** regenerate-rate per engine version (users re-rolling songs = the
  drift alarm), every skipped/degraded pipeline step logged on the song record.
- **Rollback:** every engine version keeps an env-flag switch back to the previous one.

## 6. Rollout: one genre at a time, R&B first

- **Phase 1 — R&B only:** compilation plumbing (§1), the new engine (§2), the R&B Composer
  Profile (your review), deletion of the live numeric-rules and example-line injection,
  story-integrity tests green — then your 20-song gate. Nothing else changes until R&B
  passes YOUR grade.
- **Phase 2 — Hip-Hop** (flow plan; hardest profile). **Phases 3–5 — Gospel,
  Reggae/Afrobeats, Pop.** Same loop each.
- Other genres run on the universal curriculum, clearly labeled not-yet-deep.
- Pace: R&B phase ≈ 1–2 weeks including your review cycles; the gate waits on your
  schedule, so review latency — not engineering — sets the pace.

## 7. What happens to today's app

- The live site keeps working untouched while Phase 1 is built beside it (per-engine
  rollback flag from day one).
- Input (founder direction 2026-07-02): a guided SONG BUILDER — composition questions,
  each with concrete choices and every one skippable ("let the app decide"):
  genre → room (the sub-genre pages' own one-liners as the choices) → theme → what the
  song should DO (purpose) → who it speaks to → voice → an OPTIONAL "tell us the real
  story" box (names, places, moments — the biggest quality lever, but the user may skip
  it) → title ideas generated FROM their picks and story (the engine's own hook
  candidates, shown as choices) → the app puts the puzzle together. Picks flow into the
  brief as structured constraints, never prose. One input set, ONE song. English-only
  buildout per your direction (patois/pidgin handled inside their genre profiles, under
  the dialect rule).
- The wizard/UI debate rides later; this plan changes the brain first.

---

## Sign-off

- [x] Founder approves this plan — approved 2026-07-02 ("lets go")
- [x] Founder approves the sub-genre rules + R&B's sub-genre pages (SONGWRITING_SUBGENRES.md — Parts 1–4 and the R&B section) — approved 2026-07-02 ("lets go")
- [ ] Founder approves the R&B Composer Profile (SONGWRITING_PROFILE_RNB.md — being drafted)
- Phase 1 build is underway behind a founder-only switch. Nothing reaches users until
  the profile box is checked AND the 20-song gate passes.
