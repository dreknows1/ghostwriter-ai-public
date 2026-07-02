I have all the audit and design inputs I need. This is a synthesis task — no further file exploration is required since every claim is already grounded in file:line evidence from the five specialist reports and the adversarial critique. I'll write the master deliverable directly.

# Song Ghost — Master Audit & Design Report

*Prepared for the founder. Scope: genre-authenticity engine, UI/UX, iOS sister app, and the architecture that gates all three. The `blog-app/` is out of scope.*

---

## 1. Executive Summary

Five things matter most. Read these even if you read nothing else.

1. **Your genre engine is dead code.** The 25 hand-authored guides (50–86KB each, 22 dimensions), the entire `lib/genreAgents.ts` "agent" system, the UNIVERSAL_155 protocol, cultural-logic context, and reference-features module are **loaded but never injected into the song prompt.** Every builder that would carry that knowledge to the model — `compileGuideToDirectives` (`api/ai.ts:475`), `getGenreAgentDirectives` (`371`), `buildCulturalPromptContext` (`1381`), `getReferenceFeatureBlock` (`429`) — has **exactly one occurrence in the file: its own definition, zero callers** (verified by grep). What actually reaches the model is a ~6-sentence adjective paragraph. **This is the single biggest cause of the cliché complaint**, and fixing it is mostly wiring, not new invention.

2. **The song is drafted by a weak model.** The creative draft defaults to OpenAI `gpt-4.1-nano` (`api/ai.ts:888,895`), not a top-tier model and — contrary to the product premise — **not the user's Gemini key** (that's only a fallback). A small model asked to embody 25 genres across 11 languages with a thin adjective paragraph is the *ceiling* on quality, and no prompt tuning raises it.

3. **Anti-cliché is English-only whack-a-mole.** The only cliché filter that actually fires is a ~90-pattern English regex list (`SONG_CLICHE_PATTERNS`, `api/ai.ts:1920`) plus a hardcoded English find/replace scrub (`3178-3210`) that only triggers at `clicheCount>=2` — so **all 11 non-English genres get essentially zero cliché filtering**, and the per-guide check (`checkGuideCompliance`, `726`) is structurally inert because guide clichés are meta-descriptions (`'"dil" (heart) in every other line'`) that can never substring-match real lyrics.

4. **The UI leaks trust, money, and successful generations at every commit point.** The Gemini-key requirement is never enforced before the paid Generate button (`App.tsx:708-755`), so users spend 12 wizard steps and *then* fail — your #1 support driver. Save shows "Saved!" with no error handling (`App.tsx:800-803`), silently losing songs at the 25-song cap. The 7-second intro replays on every refresh (`sg_intro_seen` is written but never read, `App.tsx:905-907`). "Drag tags to editor" has no drop target and no touch support. And the wizard's "AI-tailored options" are also dead code (`App.tsx:325-352`).

5. **The iOS app is ~90% backend-reusable but blocked by three hard gates.** The service layer and genre engine are pure, DOM-free TypeScript — an Expo/React Native app can import them unchanged. But the API has **no real authentication** (`isAllowedEmail` returns true for any string with an `@`, `api/ai.ts:843-845`), Apple will force **StoreKit IAP** to replace Stripe on iOS (30% cut), and **BYO-Gemini-key is an App Review risk.** These are business-model decisions, not just code.

### The true root cause of the cliché problem, in three sentences

Your app tells a weak model *about* a genre in a flattened adjective paragraph while the rich guide knowledge that would *show* it how to write sits inert as dead code, then tries to clean up the generic result with an English-only find/replace that swaps one platitude for another. The fix is not to tune the guides — it is to **wire the guide knowledge into the prompt, draft on a capable model, and demonstrate good writing with concrete examples instead of describing it.** Everything else is secondary.

---

## 2. Part 1 — Genre Authenticity (the priority)

### 2.1 Diagnosis (evidence-grounded)

| # | Finding | Severity | Evidence |
|---|---------|----------|----------|
| G1 | **The genre engine is dead code.** Guides, agents, UNIVERSAL_155, cultural context, and reference features never reach the prompt. | Critical | `compileGuideToDirectives` `api/ai.ts:475`, `getGenreAgentDirectives` `371`, `getGenreReferenceBlueprint` `392`, `getReferenceFeatureBlock` `429`, `buildCulturalPromptContext` `1381` — each occurs **once** (own definition), zero call sites. `generateSong` (`3049`) assembles from only `getGenreTruthParagraph`, `getSpecificityAnchors`, `compileReferenceTrackTeaching`, meta-tag/vocal helpers. |
| G2 | **The guide is flattened to ~6 generic sentences** — the model is told *about* the genre, not shown it. | Critical | `getGenreTruthParagraph` `2918-2961` emits ~7 sentences via `.split('.')[0]` fragments; `getSpecificityAnchors` `2967-2996` adds 3 themes + one cliché. None of the 22 embodied dimensions (`callAndResponse`, `regionalDialectSpecificity`, `microTiming`, etc.) are used. |
| G3 | **The draft is written by `gpt-4.1-nano`, not a top model or the user's key.** | Critical | `getDraftLLM` defaults `'openai'` `888`; `getOpenAIModel` defaults `'gpt-4.1-nano'` `895`. User's Gemini key is fallback-only. Config trap: if `OPENAI_TEXT_MODEL` is unset in prod, it silently uses nano. |
| G4 | **Cliché enforcement is English-only and reactive.** | High | `SONG_CLICHE_PATTERNS` `1920-2008` (~90 English regexes); scrub `3178-3210` fires only at `clicheCount>=2`; non-English genres match nothing. |
| G5 | **Per-guide `checkGuideCompliance` is structurally inert.** | High | `lyrics.includes(cliche)` at `745` against meta-descriptions like hindi `'"dil" (heart) in every other line'` — can never match. |
| G6 | **Zero good-lyric exemplars exist anywhere.** | High | No `lyricExample`/`exampleLines` in `lib/guides`. `referenceTracks` carry only abstract prose (`craftHighlight`, e.g. `soul.ts:465`), and `compileReferenceTrackTeaching` even *forbids* naming the songs (`677`). |
| G7 | **Depth/texture pass is edit-only; the first song users see is the least-processed.** | Medium | `enforceSongDepthAndTexture` called only in `editSong` `3269`, never in `generateSong`. |
| G8 | **Non-English guides are under-populated:** cliché ban-lists capped at exactly 4 entries vs 6–10 for English/Italian. | High (content) | Counts: english 6–7, italian 10, but french/latin/jpop/kpop/brazilian/mandopop/german/arabic/hindi/swahili **all exactly 4** (e.g. `arabic.ts:110-115`, `hindi.ts:109-114`). |

**Important nuance from the adversarial review:** the guide *content* that was sampled in full (hip-hop, country, gospel, afrobeats, reggae, arabic, latin, italian) is largely **authentic and well-researched** — this is not primarily a "your guides are bad" problem. It is a **plumbing and enforcement** problem. Also, G5's "inert matcher" is a spectrum, not absolute: a few English guides have semi-literal clichés (country's "Cold beer on a Friday night") that *do* sometimes match; the meta-description and non-English ones never do.

### 2.2 Recommended fix architecture

The strategy is **stop describing genres, start demonstrating them**, on a capable model, measured honestly.

1. **Wire the dead code back in — but trimmed.** Call `compileGuideToDirectives` inside `generateSong`, consumed as a compact **8–12 line "spec card"** (POV, groove, 3 do-this imagery moves, 3 literal don't-do clichés, dialect notes), not the full 60-line DO/DO-NOT dump. Attention is finite.
2. **Add a per-genre "Authenticity Kit"** to `GenreGuide` (`lib/guides/types.ts`) with four purpose-built fields, each with one job:
   - `exemplars[]` — concrete lines demonstrating a craft move, few-shot into the draft.
   - `sensoryLexicon` — positive in-language vocabulary (objects, textures, dialect) → word-bank + a deterministic "each section grounds in ≥1 concrete noun" validator.
   - `bannedPhrases[]` — **literal, matchable** strings (per-language) that drive the detector, replacing the global English `SONG_CLICHE_PATTERNS`.
   - `clicheTropes[]` — human-readable tropes (the old `cliches` semantics) fed to a judge as rubric, never substring-matched. **This split fixes the inert-matcher bug at its source.**
3. **Set a model-tier floor.** Make the draft default a strong model (`claudeGenerate` already exists, `api/ai.ts:939`); at minimum pin `OPENAI_TEXT_MODEL` in prod. Route non-English/dialect-heavy/explicit/complex prompts to top-tier; allow the cheap model only for simple English pop.
4. **Replace the reactive scrub with a genre-grounded LLM judge** that scores each line (specificity, cliché-freeness, genre-idiom fit, language/dialect authenticity, show-don't-tell) using the resolved guide as rubric and returns targeted line-level rewrites. Language-agnostic — works for all 25 genres for free.
5. **Run depth enforcement on initial generation, not just edits.**
6. **Build a cheap eval harness:** a frozen prompt matrix (~120–150 inputs across 25 genres) scored by (a) deterministic banned-phrase density, (b) sensory-noun coverage, (c) judge authenticity score. Add a **golden integration test** asserting resolved-guide content appears as substrings in the outgoing prompt — the exact test whose absence let the engine rot into dead code.

### 2.3 Honest caveats (from the adversarial critique — do not skip these)

- **Do NOT ship quoted commercial lyrics as exemplars.** The redesign's own worked example *misquoted* "Fancy Like" and cited a `country.ts` block that contains **no lyric lines at all** — proving that hand-authoring "6–10 real admired lines × 25 genres" will be riddled with misquotes and **copyright/clearance exposure**, plus a regurgitation-into-user-output infringement vector. **Author *original*, clearly-synthetic lines that demonstrate a craft move** instead. This is the plan's most dangerous trap.
- **Few-shot shifts cliché, it doesn't eliminate it.** A small fixed exemplar pool creates a *new* house sameness (the redesign itself reused "screen door slapping" twice). Concrete nouns ≠ authentic — "Applebee's, tailgate, Wrangler" is country cosplay. Mitigate: large rotating pools, an anti-homogenization signal (penalize n-gram overlap with exemplars *and* the app's own recent output), and ban verbatim lexicon paste.
- **The judge is fragile and expensive on the hot path.** Draft (now slower/stronger) + judge (strong, "always") + up-to-2× rewrite = 3–5 strong-model round-trips inside a 70s budget where there's currently ~1 nano call. Under load the `hasTimeBudget` guards will simply *skip* the judge — the same silent no-op failure you're fixing. Exact-match line splicing is brittle; "preserve rhyme/meter" is what LLMs do worst. **Run the judge in the eval harness and on edits first; gate any hot-path judge behind a fast deterministic pre-check with a deterministic fallback.**
- **The Authenticity Kit is a cultural-sourcing problem, not an engineering backfill.** A CI lint that fails the build under 6 exemplars will pressure whoever's on deadline to **fill quota with plausible-but-wrong content** — encoding outsider stereotypes into shipped data. Budget native-speaker/practitioner authors; make the lint check *provenance*, not just count; ship English + the 2–3 languages you can source properly first. And don't crown `italian.ts` the gold standard — nobody verified it's actually good.

### 2.4 START HERE (first step, hours of work, lowest regret)

**Ship Phase 0 alone and measure it in isolation:** unpin nano (set `SONG_DRAFT_LLM=claude` or a real `OPENAI_TEXT_MODEL`) + add the golden "guide-content-reaches-prompt" wiring test. This is the biggest quality jump per unit effort, and by *not* bundling it with the exemplar/judge/kit work you'll learn whether **model-tier alone fixes 80% of the complaint** — which would make the entire multi-week kit project optional. Then prove the exemplar concept on **one** genre with original synthetic lines, blind-tested against Phase-0-only output, before writing any `types.ts` field or CI lint.

---

## 3. Part 2 — UI/UX

**One-sentence diagnosis:** every high-cost moment (first generation, save, paywall) is designed *optimistically* — the app assumes the key exists, assumes save succeeds, and only discovers otherwise *after* the user has invested 12 wizard steps. Invert it: **verify before you charge, confirm before you celebrate, front-load the one hard requirement.**

### Top findings

| # | Finding | Severity | Evidence |
|---|---------|----------|----------|
| U1 | **Gemini-key onboarding is optional, deferred, unexplained** — the #1 support driver. Modal never uses its `required` mode; Generate never checks for a key before charging. | Critical | `App.tsx:555-560, 708-755`; `ApiKeyModal.tsx:151-159, 260-267`; key fetched lazily in `geminiService.ts:29-32`. |
| U2 | **Wizard's "AI-tailored" options are dead code** — every genre shows static lists; the engine's depth is invisible. | High | `generateDynamicOptions` imported (`App.tsx:4`) but `setDynamicOptions`/`setIsLoadingOptions` never called; `getOptionsForStep` `325-352` always falls to static maps. |
| U3 | **Save has no error handling** — 25-song cap (or any DB error) silently fails after a false "Saved!". | High | `saveSong` throws at 25 (`songService.ts:30-37`); `handleSave` `App.tsx:800-803` unconditional alert, no try/catch; `LyricsDisplay.tsx:219-225` swallows the error. |
| U4 | **Intro replays ~7s on every refresh** (unskippable). | High | `sg_intro_seen` written (`IntroAnimation.tsx:399`) but never read; `App.tsx:471,905-907` gates without it. |
| U5 | **"Drag tags to editor" is broken** — no drop target, no touch support on a phone-first app. | High | `MetaTagLibrary.tsx:19,47-50`; textarea has no `onDrop`/`onDragOver` `LyricsDisplay.tsx:257-266`; drag state `68-71` is dead. |
| U6 | **Fake generation progress; no timeout.** A stall looks like a hang. | Medium | `geminiService.ts:117-145` yields from a `sleep(1400)` loop; `App.tsx:1500-1505` reads the fake messages. |
| U7 | **Credit/plan numbers contradict across three screens** (25 vs 30 free; 500 vs 2,000 Pro; 25% vs 50% discount). | Medium | `ProfileView.tsx:306-308` vs `450-452`; `PricingView.tsx:13-16,88,118`; `App.tsx:925`. |
| U8 | **17 native `alert()/confirm()/prompt()` dialogs** stand in for a feedback system. | Medium | `App.tsx:645,649,746,802,895`; `LyricsDisplay.tsx:155,171,189,211`; `ProfileView.tsx:122-197`. |

### Prioritized redesign

**Sprint 1 — stop the bleeding (quick wins, one-file, low-risk):**
1. Gate `handleGenerate`/`handlePasteImport` on a stored key *before* charging; pass `required={!hasStoredKey}` at blocking sites (kills the #1 support driver). Consider a first-run **activation screen** with two doors: "Use my own key (free)" and "Just let me write (managed, N free songs)" — the latter finally makes the credit system coherent and collapses time-to-first-song.
2. Wrap save in try/catch; show "Saved" only after the promise resolves; surface the 25-limit with a "Manage discography" CTA.
3. Read `sg_intro_seen` + add tap-to-skip.
4. Reconcile all credit/plan numbers to one constants source.
5. Replace drag with **tap-to-insert-at-cursor** (works on touch + desktop); remove dead drag state.
6. Honest "~20–40s" copy + a 60s timeout/cancel on the generation screen; map errors to friendly CTAs (fix key / buy credits / retry).
7. Real `href`s (or hide) the dead social buttons; stop the optimistic credit decrement.

**Sprint 2 — make the promise visible:** wire `generateDynamicOptions` into a per-step effect *or delete the scaffolding and stop advertising authenticity the UI can't deliver*; add a toast + confirm-modal + inline-form system replacing all 17 native dialogs; add a **Fast Track** creation lane (Genre → Vibe → Generate) alongside the full "Deep Studio" wizard.

**Sprint 3 — deepen:** design tokens + component kit; extract the duplicated menu drawer (`App.tsx:1273-1340` vs `1399-1460`); SSE/token streaming so loading reflects the real pipeline; server-side deduct-on-success; library card view with a usage meter; local draft auto-save so a generation is never lost.

---

## 4. Part 3 — iOS Sister App

**Verdict:** Build in **Expo / React Native (managed, TypeScript)** in a monorepo importing the existing `services/*` and `lib/*` unchanged. **Reject Capacitor** (ships the desktop-grid `App.tsx`, localStorage auth, and window.location OAuth into a WebView, dragging every security hole onto an inspectable surface) and **reject native SwiftUI for v1** (re-implements the entire genre engine in Swift for zero benefit, since generation runs server-side). The reuse math is decisive: every service module is already a thin HTTP client, and nothing in the data/generation path touches the DOM.

### The three hard gates (must be decided before scoping)

| Gate | Reality | Recommendation |
|------|---------|----------------|
| **No real auth** | `isAllowedEmail` returns true for any string with `@` (`api/ai.ts:843-845`); the entire engine is gated on only that (`3540`); "session" is a plaintext email in localStorage, no token; OAuth ends at `/?oauth_email=` (`oauth/callback.ts:220`). Anyone can spend another user's credits or drain the platform key. | **Phase 0 (prerequisite):** issue a signed session token from `/api/auth`, verify it on `/api/ai` + the db proxy, and derive `email` from the token, not the body. **Ship to web too** — it hardens the live product. This is the largest hidden cost of the sister app. |
| **Apple IAP vs Stripe** | Credits are "digital content used in-app" → Guideline 3.1.1 requires StoreKit; 3.1.3 forbids even mentioning the cheaper web price. | Add `api/appstore-notifications.ts` (mirror `stripe-webhook.ts`) calling the **same** Convex grant mutation (`billing:applyStripeCheckoutCreditsByEmail`). Use **RevenueCat** to avoid fragile receipt code. Price to absorb the 30% cut (e.g. 50 credits $6.99 iOS vs $4.99 web); check Small Business Program (15%). Note: Pro Monthly is a *subscription*, so it becomes a StoreKit auto-renewable, not a consumable. |
| **BYO-Gemini-key** | Only required for `tier==='skool'` (`ai.ts:2742-2754`); everyone else uses the platform key; images always use the platform key. Asking consumers to paste a Google key is a 2.1/4.0 friction flag. | **Hide `ApiKeyModal` entirely on iOS;** default everyone to the platform key. Zero functional loss for non-skool users. |

### MVP scope (v1)

**In:** the creation wizard → `generateSong` rebuilt as native screens; song display + copy-to-Suno; saved-songs library; buy credits via IAP; auth incl. **mandatory Sign in with Apple** (Guideline 4.8, since you offer 4 social logins); album art *if IAP economics cover the image cost*; **account deletion** (Guideline 5.1.1(v)).
**Deferred to v2:** social pack, translate, Ask Andre, referrals, community/skool codes, BYO-key.

**Timeline:** ~9–12 weeks. Schedule is eaten by (1) the missing auth token, (2) StoreKit + App Store Connect setup, and (3) App Review cycles — **not** the UI and **not** the genre engine, which ports for free. Cross-cutting win: because the cliché engine lives entirely server-side, every genre fix benefits web *and* iOS automatically.

---

## 5. Part 4 — Architecture / Tech Debt (blocks the above)

| # | Issue | Severity | Evidence | Why it blocks |
|---|-------|----------|----------|---------------|
| A1 | **`api/ai.ts` is a 3,584-line god-module** with ~120 functions, **zero tests**, no test runner in `package.json`. | High | `wc -l` = 3584; only `*.test.*` files are in `blog-app/node_modules`. | Every song-quality change is a blind edit shipped to prod; you can't verify a fix didn't regress cliché-scrub, meta-tags, or gender-tag alignment. |
| A2 | **Cliché control has 3 unsynchronized sources of truth**, all English. | High | per-guide `cliches` (`745`), `SONG_CLICHE_PATTERNS` (`1920`), two hardcoded prompt lists (`3067`, `3182`) — zero overlap. | A single fix requires editing 3 disconnected places; non-English gets nothing. |
| A3 | **6–9 sequential LLM round-trips** under a hand-rolled 70s budget with **unguarded tail steps**. | High | `generateSong` `3049`; budget magic number `1071` unrelated to `maxDuration=300s` (`17`); only the draft has a timeout (`975`). | High p95 latency/cost; later passes overwrite earlier gains; poor foundation for a latency-sensitive mobile client. |
| A4 | **User's Gemini key held in mutable module-level globals.** | Medium | `api/ai.ts:2696-2697`, set `3541`, cleared `3581`. | Correct only if one instance serves one request at a time; any concurrency/streaming leaks one user's key into another's generation. |
| A5 | **No observability;** fake progress bar hides real state; `enforce*` passes swallow errors. | Medium | 10 `console.*` calls, no Sentry/analytics; silent `catch{}` at `3207`. | Quality work is guesswork — no signal on which stage/genre misbehaves. |
| A6 | **`App.tsx` is a ~1,100-line component, 37 `useState`,** inline auth/billing/storage. | Medium | `App.tsx:470+`; localStorage/window.location throughout. | No framework-agnostic core to share with iOS; the domain logic is fused to React/DOM. |
| A7 | **`noUnusedLocals`/`noUnusedParameters` off;** 54 `any` casts. | Low | `tsconfig.json:14-16`. | **This is *why* the dead code went undetected.** Turning these on is a near-free guardrail. |

**Two near-free architectural wins that pay for everything downstream:** turn on `noUnusedLocals`/`noUnusedParameters` (would have caught the dead engine at build time), and add `vitest` with unit tests on the pure functions (`parseStructuredSong`, `countClicheHits`, `resolveGuide`, metrics) to create a regression net before any quality change.

---

## 6. Prioritized Roadmap (single ordered list, all areas)

Sequenced so the highest-leverage, lowest-regret work comes first. Effort: S (hours–1 day) / M (days) / L (1+ weeks).

| # | Item | Area | Effort | Impact | Why here |
|---|------|------|--------|--------|----------|
| 1 | **Unpin nano** — set a strong draft model (`SONG_DRAFT_LLM=claude` or real `OPENAI_TEXT_MODEL`); ship alone and measure | Genre | S | **High** | Biggest quality jump per unit effort; the model is the current ceiling. Isolate it to learn if it fixes 80%. |
| 2 | **Gate the key before charging** + `required` modal + first-run activation | UI | S | **High** | Kills the #1 support driver; stops wasted-credit churn. |
| 3 | **Fix save** — try/catch, real success gating, 25-limit CTA | UI | S | **High** | Stops silent song loss on the core deliverable. |
| 4 | **`tsconfig` unused-checks on** + add `vitest` + unit-test pure functions | Arch | S–M | **High** | Guardrail that would have prevented the dead engine; regression net for all genre work. |
| 5 | **Wire `compileGuideToDirectives` into `generateSong`** (trimmed spec card) + golden "guide-reaches-prompt" test | Genre | M | **High** | Puts the genre knowledge into the prompt for the first time; test prevents re-rot. |
| 6 | **Fix intro replay**, honest generation copy + 60s timeout, tap-to-insert tags, reconcile credit numbers, real/hidden social links | UI | S–M | **High** | Cluster of one-file fixes removing friction, false state, and broken interactions. |
| 7 | **Split `cliches` → `bannedPhrases`+`clicheTropes`**; point detector at literal phrases; expand non-English ban-lists (latin, arabic, hindi, kpop, jpop first) | Genre | M | **High** | Fixes the inert matcher and gives non-English genres real filtering. |
| 8 | **Prove exemplars on ONE genre** with *original synthetic* lines, blind-tested vs Phase-0 | Genre | M | Med–High | De-risks the 25-guide kit before committing to it; avoids the clearance/stereotype trap. |
| 9 | **Build the eval harness** (banned density + sensory coverage + judge score over a frozen matrix) | Genre | M | **High** | Turns "feels cliché" into a number; drives every later decision; run judge *offline* first. |
| 10 | **Toast/confirm/inline-form system** replacing 17 native dialogs; wire or delete `generateDynamicOptions` | UI | M | Med | Makes the app feel premium; makes genre depth visible (or stops false advertising). |
| 11 | **Difficulty-based model routing** + BYO-key floor + surface which model wrote the song | Genre | M | Med | Manages cost/quality honestly; decide the business model explicitly (see Q's). |
| 12 | **Genre-grounded LLM judge** on edits/eval, then gated hot-path with deterministic fallback; run depth pass on initial gen | Genre | L | Med–High | Language-agnostic quality gate; keep off the naive hot path until proven to preserve meter. |
| 13 | **Extract shared TS core** (services + genre engine + taxonomy) from `App.tsx` into a monorepo package | Arch/iOS | L | **High** (enables iOS) | Prerequisite for the sister app; splits `App.tsx` monolith. |
| 14 | **iOS Phase 0: real session token** on `/api/auth`, verified on `/api/ai`; derive email from token | iOS/Arch | M–L | **High** | Unblocks a trustworthy native launch; hardens web too. |
| 15 | **Author remaining Authenticity Kits** with native-speaker review; provenance-based CI lint | Genre | L | Med | The durable content work — gated on §8 open questions; ship sourced languages only. |
| 16 | **iOS Phases 1–5:** Expo scaffold, native auth incl. Sign in with Apple, StoreKit/RevenueCat IAP, MVP screens, review hardening | iOS | L | Med | The sister-app build; depends on 13–14. |
| 17 | **Pipeline refactor + observability** — budgeted/observable steps, thread key via context, Convex generation-event logging | Arch | L | Med | Removes global-key hazard, tames latency, enables measured iteration; foundational but not urgent. |

---

## 7. Open Questions / Decisions the Founder Must Make

1. **Model economics.** Is the creative draft **operator-paid** (you eat strong-model cost, credits fund it) or genuinely **BYO-key** (users pay for their own inference)? The redesign's "floored primary" silently makes *you* pay for most users — a margin hit that could dwarf the nano savings. Decide explicitly; it changes pricing and the whole BYO story.

2. **Managed generation (UI Door B).** Do you add a "just let me write" managed-key tier with N free songs? This is likely the single biggest activation lever (collapses time-to-first-song) and finally makes the credit system coherent — but it's an operator-cost commitment.

3. **Exemplar sourcing & legal.** Confirm the policy: **original synthetic lines only** (recommended), or a funded legal-clearance effort for real fragments? The latter is a licensing project, not a code task, and carries a regurgitation-into-user-output infringement risk.

4. **Cultural authorship budget.** The Authenticity Kits for 11 non-English + Black-American-rooted genres need **native-speaker/practitioner authors** to avoid shipping stereotypes. Will you fund this, and which 2–3 languages ship first? (Also: which "Latin" — reggaetón vs regional Mexican vs Argentine are different traditions.)

5. **iOS monetization.** Confirm **StoreKit consumables replace Stripe on iOS** and the iOS price points that absorb Apple's 15–30%. This unblocks all v1 scoping and must be decided before design.

6. **The 25-song library cap.** Is 25 (`songService.ts:30`) intentional? It's low for an active writer and currently fails *silently*. Tier it with the plan, or raise it.

7. **Sequencing bet.** Are you willing to ship Phase 0 (item 1) *alone* and measure before authorizing the multi-week kit/judge work? Strongly recommended — it may prove the expensive content project optional.


---

# Appendix A — Genre-Quality Redesign (full)

I now have complete, precise evidence. Here is the redesign.

---

# Song Ghost — Genre-Authenticity Redesign

## Thesis (the true root cause and the single highest-leverage change)

The songs are cliché because the genre knowledge never reaches the model: the app tells a weak model (`gpt-4.1-nano`, `api/ai.ts:895`) *about* a genre in ~7 flattened sentences (`getGenreTruthParagraph`, `api/ai.ts:2918`) while the rich 22-dimension guides, `compileGuideToDirectives` (`api/ai.ts:475`), and the entire `genreAgents` layer sit as dead code that no call site ever invokes. Anti-cliché is then a reactive English-only find/replace (`api/ai.ts:3182`) that is structurally inert for 11 non-English genres and merely swaps one platitude for another. **The single highest-leverage change is to stop describing genres and start demonstrating them: inject 3-5 real, cleared exemplar lyric lines plus a per-genre concrete-noun lexicon into the draft prompt, written by a quality-floored model — replacing "the tradition demands X" with "here is what a great line in this genre looks like; now write like this."** Everything else in this plan (the LLM judge, model routing, evals) is downstream of that show-don't-tell shift.

---

## 1. Prompt architecture: from directive-dumps to embodiment + few-shot

### The core move

The current draft prompt (`api/ai.ts:3063-3151`) is ~90 lines of *negative* instruction — the banned-cliché list alone (lines 3067-3081) is a 15-line wall of "don't." The genre signal is a single `GENRE TRUTH` paragraph (line 3119) plus three `SPECIFICITY` anchors (line 3122). A small model reading this has been told what *not* to write far more forcefully than it has been shown what *to* write. It has zero concrete examples to imitate, so it falls back on its generic training priors — the exact cliché behavior the user is complaining about.

Replace the "describe then forbid" structure with **"demonstrate then constrain."** The prompt should lead with concrete exemplars and a sensory word-bank, put the genre spec card second, and shrink the giant banned list to a short per-genre list plus one universal rule.

### BEFORE (current, condensed from `api/ai.ts:3063-3151`)

```
You are a professional songwriter who has lived and breathed Country/Bro-Country for 20 years.

RULE #1 — NO CLICHÉS (violating this = automatic failure):
- "precious like gold", "diamond in the rough", "worth your weight in gold"
- "dim your/her/my light", "shine bright", "let your wings fly"...
  [15 lines of banned English phrases, mostly irrelevant to country]

GENRE TRUTH:
Country at its core is a storytelling tradition rooted in working-class American life.
The groove lives in Boom-chuck waltz or two-step — steady and grounded.
Lyrically, the tradition demands narrative-driven storytelling...
The voice carries plainspoken sincerity...

SPECIFICITY:
Core themes for this genre: Love and heartbreak, Family and home, Drinking.
Ground these in specific details...
Instead of worn-out phrases like "Cold beer on a Friday night", show the same emotion...

CRAFT DIRECTIVES — non-negotiable writing techniques...
- DO THIS: Brand-name specificity as authenticity tool...
- STRUCTURE: Verse-chorus-verse-chorus-bridge-chorus...
```

### AFTER (proposed)

```
You are writing an authentic Country / Bro-Country song. Study how real songs in this
genre write, then write one that belongs beside them.

── HOW THIS GENRE ACTUALLY WRITES (imitate this concreteness, not these exact lines) ──
These are real, admired lines in this tradition. Notice: named brands, physical objects,
one scene per couplet, plainspoken diction, no abstractions.
  • "She got that Fancy Like Applebee's on a date night" — specificity as intimacy
  • "Tennessee whiskey ... smooth as the summer wind" — sensory comparison, not adjective
  • "Dirt on my boots, that's all I need" — status through concrete object
[3-5 EXEMPLAR LINES pulled from this guide's new `exemplars` field, rotated per generation]

── WORD-BANK — reach for these, they are this genre's native vocabulary ──
Objects/places: tailgate, gravel lot, screen door, county line, church parking lot, deer stand
Textures/sounds: gravel crunch, screen-door slap, transmission whine, cicadas
Dialect: "y'all", "fixin' to", "reckon", "back forty"
Ground EVERY section in at least one item from this bank or an equally concrete detail
of your own. (validated after generation)

── GENRE SPEC CARD (8 lines, the essentials) ──
POV: first-person story or first-person to a lover; each verse advances a plot.
Groove/feel: boom-chuck two-step, 120 BPM, relaxed forward motion.
Do-this imagery moves: (1) name a real brand/place, (2) one physical scene per couplet,
  (3) let an object carry the emotion.
Never-do (this genre's tired tropes): "cold beer on a Friday night", "dirt roads and back
  roads", "small town Saturday night", "boots, jeans, cowboy hats" [from guide.bannedPhrases]
Structure: V–C–V–C–Bridge–C. Chorus = emotional thesis. Bridge = the twist.

── THE STORY (this is what the song is ABOUT) ──
[userDirection + extractCharacterRequirements — unchanged, still law]

── ONE UNIVERSAL RULE ──
If a line could be printed on a coffee mug or a graduation card, delete it and write a
scene instead. Every line needs one tangible noun.

Return only:
Title / ### SUNO Prompt / ### Lyrics
```

### What changes structurally

- **Exemplars lead.** Few-shot demonstration is the highest-signal thing you can give a model; it goes first, before any rule.
- **The 15-line universal banned list (`api/ai.ts:3067-3081`) shrinks to ONE sentence** plus a short *per-genre* never-do list drawn from the guide. Today's list bans "spread your wings" for a country song — noise that wastes attention and teaches nothing about country.
- **`compileGuideToDirectives` gets wired in but trimmed.** Call it in `generateSong` (it is currently dead — defined at `api/ai.ts:475`, zero callers) but consume it as the compact 8-line **spec card**, not the full 8-section DO/DO-NOT dump. Attention is finite; the full compile is ~60 lines of prose that would drown the exemplars.
- **Retire `getGenreTruthParagraph` / `getSpecificityAnchors` as the primary path.** They flatten 22 dimensions into fragments via `.split(".")[0]` (`api/ai.ts:2930,2934,2949`). Keep at most one sentence of `culturalContext` for tone; the exemplars + word-bank + spec card now carry the load.
- **Reference-track teaching stays but demotes.** `compileReferenceTrackTeaching` (`api/ai.ts:623`) emits abstract "DO THIS: <craftHighlight>" directives and then *forbids naming the songs* (`api/ai.ts:677`). Abstract craft prose is weak signal; the concrete `exemplars` replace it as the teaching mechanism. Keep reference tracks only for the structure note.

---

## 2. Per-genre "Authenticity Kit" — a `GenreGuide` extension

The guides already hold real knowledge but in shapes the pipeline can't consume: `cliches` doubles as human-readable trope description *and* substring-match target (`api/ai.ts:745`), so entries like hindi's `'"dil" (heart) in every other line'` never match. The fix is to add three purpose-built fields to `GenreGuide` (in `lib/guides/types.ts`), each with exactly one job.

```ts
// Add to interface GenreGuide in lib/guides/types.ts
export interface AuthenticityKit {
  /** 6-10 REAL, admired lines that model this genre's craft. Few-shot into the draft.
   *  Short fragments (≤ ~12 words), cleared/original, tagged so we can retrieve by fit. */
  exemplars: Array<{
    line: string;
    language: string;        // matches guide.language or a code-switch note
    register: "clean" | "radio" | "explicit";
    theme: string;           // maps to lyricalConventions.themes
    craftNote: string;       // one phrase: WHY it works ("status via object")
  }>;

  /** Positive vocabulary the model should reach for — the antidote to abstraction.
   *  In-language for non-English guides (NOT English examples). */
  sensoryLexicon: {
    objectsAndPlaces: string[];   // tailgate, gravel lot, screen door
    texturesAndSounds: string[];  // gravel crunch, screen-door slap
    dialect: string[];            // y'all, fixin' to, reckon
  };

  /** LITERAL, matchable banned phrases — what the substring/regex detector uses.
   *  Distinct from the human-readable `cliches` array. In-language + transliterations. */
  bannedPhrases: string[];        // "cold beer on a friday night", "dirt roads"

  /** Human-readable tropes to avoid (the old `cliches` semantics), never substring-matched.
   *  Fed to the LLM JUDGE as rubric, and rendered in the spec card's "never-do" line. */
  clicheTropes: string[];         // 'dil (heart) in every other line'
}
```

### How it plugs in

- **`exemplars`** → few-shot block in section 1 (retrieve 3-5 matching `inputs.emotion`/`subGenre`/`register`/`language`; fall back to random if no match).
- **`sensoryLexicon`** → the word-bank block *and* a deterministic post-gen validator ("each section contains ≥1 lexicon item or a concrete noun"). This is the positive replacement for today's negative-only English scrub.
- **`bannedPhrases`** → drives a per-guide, per-language detector, replacing the global-English `SONG_CLICHE_PATTERNS` (`api/ai.ts:1920`) and `countClicheHits` (`api/ai.ts:2050`). Point the compliance loop at `guide.authenticityKit.bannedPhrases` instead of `guide.lyricalConventions.cliches`, fixing the inert-matcher bug (`api/ai.ts:745`).
- **`clicheTropes`** → judge rubric (section 3) and the spec-card never-do line.

### Authoring order (highest traffic / worst-served first)

Latin, Arabic, Hindi, K-pop, J-pop, then the remaining non-English, then English. Backfill: migrate each guide's existing `cliches` into `clicheTropes`, then hand-author `bannedPhrases` (literal) and `exemplars`. Treat `italian.ts` as the depth benchmark. Gate with a CI lint (section 5) so no guide ships with `<6` exemplars, `<10` bannedPhrases, or empty lexicon buckets.

---

## 3. Replace the reactive scrub with preventive + judge-based rewrite

### Kill the hardcoded scrub

The scrub at `api/ai.ts:3178-3210` is: (a) English-only (fires on `countClicheHits >= 2`, which counts only English regexes, so non-English songs never trigger it); (b) cliché-for-cliché (it bans "strength inside her soul" as a *repackaged* cliché — evidence the approach fights symptoms); (c) reactive. Remove it. Anti-cliché becomes **preventive** (exemplars + lexicon + short per-genre banned line, already in the prompt) plus **a genre-grounded LLM judge** that runs on *initial* generation, not just edits.

### The judge (language-agnostic, works for all 25 genres)

After the draft, run one judge call (strong model — see section 4) that scores the lyric against the resolved guide as rubric and returns *targeted line-level rewrites only*. This replaces both the inert `checkGuideCompliance` (`api/ai.ts:726`) and the English scrub.

**Judge rubric (0-5 each, guide-parameterized):**

| Dimension | Question | Grounded in |
|---|---|---|
| **Specificity** | Does each section contain a concrete noun / named place / object? | `sensoryLexicon` |
| **Cliché-freeness** | Any line matches or paraphrases a known trope? | `bannedPhrases` + `clicheTropes` |
| **Genre-idiom fit** | Does diction/imagery match how the genre actually writes? | `exemplars` + spec card |
| **Language/dialect authenticity** | Correct in-language idiom, dialect markers, no translationese? | `regionalDialectSpecificity` + `language` |
| **Show-don't-tell** | Emotion shown via scene, not stated via abstraction? | universal |

**Judge output contract:** JSON `{ scores: {...}, weakestLines: [{ original, why, rewrite }] }`. Only rewrite lines scoring below threshold — preserve rhyme scheme, syllable count, and structure (the same constraints the old scrub demanded, but semantic instead of find/replace). Run the loop at most twice; accept when all dimensions ≥ 3 or budget expires.

**Latency/cost control:** cache the compiled rubric per `guideId+subGenre` (it's static). One judge call + one conditional rewrite fits the existing `hasTimeBudget` guards (`api/ai.ts:3170,3175`). Because it consumes `guide` data, it is automatically per-language — no separate internationalization work, which is the whole reason the current English scrub can't be salvaged.

---

## 4. Model-tier strategy given BYO-Gemini reality

Two facts collide: the audit found the creative draft defaults to `gpt-4.1-nano` (`api/ai.ts:895`) with Gemini only a fallback, yet the product premise is "uses the end user's own Gemini key." A weak model is the hard ceiling on lyric quality regardless of prompt work.

### Establish a quality floor

1. **Set a floor for the creative draft.** `generateDraft` already supports Claude (`claudeGenerate`, `api/ai.ts:939`) and Gemini. Make the default draft LLM a strong model, not nano. At minimum, pin `OPENAI_TEXT_MODEL` in production so it can't silently fall back to nano via the `getOpenAIModel` default (`api/ai.ts:895`).
2. **Difficulty-based routing.** Route to a top-tier model when: `language !== "English"`, the genre is dialect/culture-heavy (afrobeats, reggae, arabic, hindi, swahili, gospel), `register === "explicit"`, or `userDirection` is long/complex. Allow the cheaper model only for simple English pop. Non-English + culturally specific is exactly where nano fails hardest and where the user's complaint concentrates.

### Make the user's Gemini key a real primary — with a floor

- Use the BYO Gemini key for the draft **only if it meets a minimum model tier** (e.g. `gemini-2.5-pro`-class). If the user's key is a weak/free-tier model, use it for the cheap mechanical passes (meta-tag orchestration, Suno driver) but route the *creative draft and the judge* to the server's quality-floored model.
- **Surface which model wrote the song** in the UI, and if the BYO key can't clear the floor, show a one-line "for best genre authenticity, a stronger key/model is recommended" nudge. This aligns the cost story with quality honestly instead of silently degrading.

The judge (section 3) should **always** run on a strong model — it's the quality gate; a weak judge can't catch what a weak drafter produced.

---

## 5. Cheap way to measure improvement

You cannot iterate on "feels less cliché." Build a lightweight, repeatable eval so every change is scored.

### Eval set

- **A frozen prompt matrix:** for each of the 25 genres, 4-6 fixed generation inputs varying `emotion`, `subGenre`, `register`, and (for non-English) `language`. ~120-150 prompts total. Store as a JSON fixture in the repo.
- Run the full `generateSong` pipeline over the matrix on demand (a script, not in the request path).

### Scoring (three cheap signals)

1. **Deterministic banned-phrase density** — count `bannedPhrases` hits per 100 words, per genre, per language. Free, regression-proof, and now actually works for non-English (unlike today's English-only `countClicheHits`).
2. **Sensory-noun coverage** — % of sections containing ≥1 `sensoryLexicon` item or concrete noun. Cheap heuristic.
3. **LLM-judge authenticity score** — reuse the section-3 judge rubric as an eval scorer (specificity / cliché / genre-fit / dialect / show-don't-tell, 0-5). One judge call per sample. Track mean per genre over time.

### Guardrail tests (prevent the exact failure that caused this)

- **Golden integration test:** assert that for each genre, resolved-guide content (exemplar text, `bannedPhrases`, spec-card fields) actually appears as substrings in the *outgoing draft prompt*. This is the test whose absence let `compileGuideToDirectives` and the whole `genreAgents` layer rot into dead code.
- **Guide-completeness lint (CI):** fail the build if any guide has `<6` exemplars, `<10` bannedPhrases, empty lexicon buckets, or a field left at a one-line template default.

**Report format:** a per-genre before/after table (banned density ↓, sensory coverage ↑, judge score ↑). This turns the user's subjective "uber cliché" complaint into a number you can drive down.

---

## 6. Phased rollout (max quality gain, least effort first)

### Phase 0 — Stop the bleeding (hours, config-only)

- Pin `OPENAI_TEXT_MODEL` in prod and/or set `SONG_DRAFT_LLM=claude` so the draft is no longer nano (`api/ai.ts:888,895`). **This alone is the biggest quality jump per unit effort** — the model, not the prompt, is the current ceiling.

### Phase 1 — Show-don't-tell prompt + wire dead code (days)

- Add `exemplars`, `sensoryLexicon`, `bannedPhrases`, `clicheTropes` to `types.ts`; author them for the **5 highest-traffic genres** (pop, hip-hop, country, latin, arabic) to prove the pattern.
- Restructure the draft prompt (`api/ai.ts:3063`) to the AFTER sketch: exemplars first, word-bank, compact spec card (wire `compileGuideToDirectives` in trimmed), shrink the 15-line banned list to one rule + per-genre line.
- Point `checkGuideCompliance` at `bannedPhrases` (fixes `api/ai.ts:745`).
- Ship the golden integration test so this can't silently unwire again.

### Phase 2 — Judge-based rewrite on initial gen (days)

- Build the LLM judge (section 3), run it on **initial** generation, delete the hardcoded English scrub (`api/ai.ts:3178-3210`). Cache rubrics per guide.
- Run the deterministic depth pass on initial gen too (`enforceSongDepthAndTexture` is edit-only today, `api/ai.ts:3269`).

### Phase 3 — Difficulty routing + BYO-key floor (days)

- Difficulty-based model routing; make BYO Gemini a floored primary; surface the model in the UI.

### Phase 4 — Fill out the corpus + evals (ongoing)

- Author authenticity kits for the remaining 20 guides (non-English first), leveling to the `italian.ts` benchmark; add the CI completeness lint and the eval harness; track per-genre scores.
- Retire `UNIVERSAL_155` theater (`lib/genreAgents.ts:53-85`) — it's non-actionable ("silent... do not print") and disconnected anyway.

---

## Key file references

- Draft prompt assembly: `api/ai.ts:3049-3153` (main), banned wall `3067-3081`, GENRE TRUTH `3119`, SPECIFICITY `3122`.
- Dead-code builders to wire/trim: `compileGuideToDirectives` `api/ai.ts:475`; `compileReferenceTrackTeaching` `api/ai.ts:623` (demote).
- Flattening helpers to retire as primary: `getGenreTruthParagraph` `api/ai.ts:2918`; `getSpecificityAnchors` `api/ai.ts:2967`.
- Model floor: `getDraftLLM` `api/ai.ts:887`; `getOpenAIModel` default nano `api/ai.ts:895`; `claudeGenerate` (exists) `api/ai.ts:939`; `getClaudeModel` `api/ai.ts:877`.
- Cliché machinery to replace: `SONG_CLICHE_PATTERNS` `api/ai.ts:1920`; `countClicheHits` `api/ai.ts:2050`; inert substring match `api/ai.ts:745`; hardcoded scrub `api/ai.ts:3178-3210`; `checkGuideCompliance` `api/ai.ts:726`.
- Depth pass edit-only: `enforceSongDepthAndTexture` call at `api/ai.ts:3269`.
- Data model to extend: `GenreGuide` / `LyricalConventions.cliches` in `lib/guides/types.ts:56-64,243-283`; `ReferenceTrack` (`craftHighlight` only, no lines) `lib/guides/types.ts:229-239`.
- Guide content examples: `country.ts` cliches `114-122`, reference tracks with real specificity `550-565` ("Fancy Like" / Applebee's — the model to imitate).
- Theater to retire: `UNIVERSAL_155_RESEARCH_*` `lib/genreAgents.ts:53-85`.


---

# Appendix B — UI/UX Redesign (full)

I now have full grounding. Here is the redesign proposal.

---

# Song Ghost — UI/UX Redesign Proposal

*A concrete, prioritized plan to make the interface deliver on the "authentic, non-cliché songwriting" promise, stop the BYO-key churn, and stop leaking trust, money, and successful generations.*

The bones are strong: the wizard concept, studio editor, and dark aesthetic are genuinely good. The problem is that **the flows around them leak at every step where the user commits trust, money, or effort.** This proposal fixes those leaks in priority order, then layers on a design system so the fixes stay coherent.

Throughout, I reference exact evidence: e.g. the key modal is never enforced (`App.tsx:555-560`, `708-755`), dynamic options are dead code (`App.tsx:325-352`, `477-478`), and save has no error handling (`App.tsx:800-803`).

---

## 0. The one-sentence diagnosis

Every high-cost moment — first generation, save, paywall — is designed **optimistically**: the app assumes the key exists (`geminiService.ts:29-32`), assumes save succeeds (`App.tsx:802`), assumes credits are spent well, and only discovers otherwise *after* the user has invested 12 wizard steps. The redesign inverts this: **verify before you charge, confirm before you celebrate, and front-load the one hard requirement (the key) before any effort is spent.**

---

## 1. Onboarding + the BYO-Gemini-Key problem (the #1 support driver)

### The failure today
`promptForGeminiApiKeyIfMissing()` opens `ApiKeyModal` with no `required` prop (`App.tsx:555-560`), so it is always dismissable — close "×", Esc, backdrop click, and a "Not now" button (`ApiKeyModal.tsx:151-159, 260-267`). `handleGenerate` never checks for a stored key before charging (`App.tsx:708-755`); the key is fetched lazily deep inside `callAI` (`geminiService.ts:29-32`). So the real-world path is: **login → dismiss modal (it reads as an interruption) → 12 wizard steps → click "MASTER THE RECORD" → fail.** That single mis-sequencing is the bulk of the support load.

### The redesign: make the key a *first-run gate*, not a settings nicety

**Recommended flow (first run, no stored key):**

1. **Login →** a full-screen, non-dismissable **"Activate your studio"** step (not the current cramped modal). This replaces the wizard as the first thing a keyless user sees.
2. **Value-forward framing first, form second.** Lead with *why*, in one line the user believes: *"Song Ghost runs on Google's free Gemini key — you keep it, it stays in your browser, and it's free for ~1,500 songs/day."* The current modal buries this benefit in a subtitle (`ApiKeyModal.tsx:147-149`). Make it the headline.
3. **Three-tap setup, inline, with a live confirm.** Reuse the excellent `testGeminiKey()` that already exists (`ApiKeyModal.tsx:13-32`) as a *mandatory* gate: the "Continue" button stays disabled until `status.kind === "ok"`. The green "✓ Key works — Google returned N models" state (`ApiKeyModal.tsx:219-222`) becomes the unlock, not an optional nicety.
4. **Never prompt again** unless the key is later rejected mid-flight (see §3 recovery).

**The `required` mode already exists and is simply never used.** `ApiKeyModal` hides the close-x, Esc handler, backdrop dismiss, and "Not now" when `required` is true (`ApiKeyModal.tsx:84, 136, 151, 260`). The quick win is literally passing `required={!hasStoredKey}` at the blocking call sites.

### Should you offer a managed-key / credits option?

**Yes — but as a deliberate second tier, and this is the strategic recommendation.** The BYO-key model is the single biggest conversion killer: it asks a non-technical songwriter to visit Google AI Studio, create a project, and copy an `AIza...` string *before they have made anything.* Many will bounce at "create a project."

Propose **two doors on the activation screen:**

- **Door A — "Use my own key (free)":** the BYO flow above. Zero marginal cost to you; power users prefer it.
- **Door B — "Just let me write (managed)":** you proxy generation through your own Gemini key and meter it with the credits you already have (`COSTS.GENERATE_SONG`, `deductCredits`, the whole Convex/Stripe rig is already built). This is the paywall's reason to exist. Give every new account a few free managed generations (e.g. 3 songs) so **the first song happens with zero setup friction** — the single highest-leverage change for activation.

This also resolves a latent architecture smell: today the key requirement and the credits system are two disconnected gates. Door B unifies them — credits become the thing free-key users never touch and managed users buy, which finally makes the pricing page coherent (see §7).

> **Rationale:** "Time to first song" is the metric that predicts retention for a creative tool. Door B collapses it from *"go get a Google API key"* to *"tap Country → tap a vibe → watch it write."* Keep Door A for cost control and the technically inclined.

### Priority
- **Quick win (this week):** Pass `required` at blocking sites; gate `handleGenerate`/`handlePasteImport` on a stored key *before* charging (`App.tsx:708-718, 849-864`); move the key check ahead of the wizard.
- **Redesign:** Full activation screen with A/B doors + N free managed songs.

---

## 2. The song-creation flow (genre → subgenre → topic → generate → result)

### The failure today
The wizard's advertised "AI-tailored authenticity" is **dead code.** `generateDynamicOptions` is imported (`App.tsx:4`) and `dynamicOptions`/`isLoadingOptions` exist (`App.tsx:477-478`), but `setDynamicOptions`/`setIsLoadingOptions` are **never called anywhere.** So `getOptionsForStep` (`App.tsx:325-352`) always fails the `if (dynamicOptions.length > 0)` check and falls to static maps; the "Loading genre options..." spinner (`App.tsx:358-362`) can never render. Every subgenre with no static entry gets the generic `['Alternative','Mainstream','Underground','Experimental',...]` (`App.tsx:339`). **The genre engine's intelligence — 25 guides, 50-86KB each — is completely invisible in the UI.** A user picking "Drill" or "Shoegaze" sees the same seven generic words as everyone else, which directly manifests the "not respectful to the genre" complaint *at the UI layer, before a single lyric is written.*

Compounding it: the wizard is **long and undifferentiated.** Ten-plus taps through Language → Genre → Subgenre → Instrumentation → Sonic Space → Scene → Emotion → Vocals → (Duet) → Performer → Specifics → Creative Direction (`STEP_ORDER`, steps rendered `App.tsx:433-458`), every step a grid of near-identical uppercase buttons (`App.tsx:369-373`). It feels like a form, not a studio.

### The redesign

**A. Wire the genre engine into the options — or stop advertising it.**
Add a per-step effect that calls `generateDynamicOptions(field, inputs)` on step entry, sets `isLoadingOptions` true, and populates `dynamicOptions` — the spinner and fallback already exist and will finally light up. Now when someone picks "Drill," the subgenre/instrumentation/scene steps reflect *actual drill conventions* pulled from the guide, not `['Alternative','Mainstream',...]`. **This is the single change that makes the product's core promise visible.** If you won't wire it, delete the scaffolding and the "Building authenticity for the {genre} session" copy (`App.tsx:431`) — advertising authenticity the UI can't deliver is worse than not claiming it.

- Cache per (genre, subgenre) so back/forward navigation doesn't re-fetch.
- Always keep the static map as instant fallback so the grid is never empty while loading.
- **Reuse it in the guide, not just the options:** surface one line of genre context per step ("Drill leans on sliding 808s and triplet hi-hats — pick your low end") sourced from the guide's `instrumentation`/`productionFingerprint` dimensions. This turns dead taps into education and makes the depth *felt.*

**B. Collapse the wizard into "Fast Track" + "Deep Studio."**
Most users want a song, not a 12-field intake. Offer two lanes off the dashboard:

- **Fast Track (3 decisions):** Genre → a single "Vibe/Topic" free-text (merge today's Scene + Emotion + Creative Direction) → Generate. Everything else gets smart defaults from the genre guide. This is the flow that should pair with Door B's free managed songs.
- **Deep Studio:** the full step chain, for users who want control. Keep it, but make the extra steps *optional refinements shown after a first draft* rather than gates before it.

**C. Make progress honest and reversible.** The step dots (`App.tsx:416-423`) are good; keep them. But show the running "song DNA" chips (`App.tsx:461-465`) as *editable* — tapping a chip jumps back to that step. Right now Back is linear only (`handlePrev`, `App.tsx:~695-706`).

**D. Kill the all-caps button wall.** Every option is `font-black uppercase tracking-widest` (`App.tsx:369`), which reads as shouting and hurts scannability. Use sentence case with a small uppercase category label (see §5 type scale).

### Priority
- **Redesign (high):** Wire `generateDynamicOptions`; add Fast Track lane.
- **Quick win:** Editable DNA chips; sentence-case options.

---

## 3. Generation / loading / streaming experience

### The failure today
Progress is **theater.** `generateSong` yields status strings from a fixed 5-item array on a `sleep(1400)` loop until the single request settles (`geminiService.ts:123-141`); the model returns the whole text at once via `singleYield` (`geminiService.ts:113-115, 144`). The UI's `GENERATION_STAGES` and progress bar advance off keyword-matching these fake messages (`App.tsx:95-102`), not real work. There is **no timeout and no honest "this can take a while" state** — if the real call stalls, the UI loops the same messages forever, which users read as a hang and rage-refresh. Combined with the intro replay (below), a stalled generate is a trust catastrophe.

Separately, on **failure** the handler does `alert("Generation failed: " + err.message)` exposing raw error strings, then dumps the user back to the last step (`App.tsx:744-750`) — after optimistically deducting credits at `App.tsx:721`, so the user *perceives being charged for nothing* even though `loadCredits()` reloads the true balance.

### The redesign

**A. Honest telemetry.** Since generation is one round-trip, don't fake five stages. Show:
- A single clear state: *"Writing your {genre} song — this usually takes 20-40 seconds."*
- A real elapsed timer.
- A **timeout at ~60s** that flips to *"Still working — Gemini is taking longer than usual. Keep waiting or cancel?"* with a Cancel that aborts and refunds. No more infinite loop.

**B. Real streaming (deeper fix).** The generation pipeline in `api/ai.ts` runs discrete stages (draft → genre agent → compliance check → cliché scrub → meta-tags). Emit **server-sent progress** from those actual stages, and — even better — stream the draft tokens so the user watches lyrics *appear*. Watching a song write itself is the single most compelling thing this app could show, and it ties the loading UI directly to the anti-cliché work the engine already does (the compliance/scrub passes become visible reassurance: *"Removing clichés…"* backed by a real pass).

**C. Recovery, not dead-ends.** Map errors to friendly copy + an action:
- Rejected/absent key → *"Your Gemini key was rejected"* + **re-open activation** (this is the only place the key modal should reappear).
- Quota/rate limit → *"Google is rate-limiting your key — wait a minute or switch to managed"* + CTA.
- Generic failure → *"Something went wrong. You weren't charged."* + **Retry** (and make that statement true — see §7).

**D. Fix the intro replay — it compounds every stall.** `IntroAnimation` writes `sg_intro_seen` on completion (`IntroAnimation.tsx:399`), but `App.tsx:471` inits `introComplete=false` and gates on it (`App.tsx:905-907`) **without ever reading the flag.** So every refresh, every OAuth redirect, every Stripe-success return replays ~7 unskippable seconds (`IntroAnimation.tsx:394-402`). Read `sg_intro_seen` before showing it, add a tap-to-skip, and cap it to first-visit-per-session.

### Priority
- **Quick win:** Read `sg_intro_seen` + skip affordance; add honest "~20-40s" copy + a 60s timeout/cancel; friendly error→action mapping.
- **Redesign:** SSE/token streaming from `api/ai.ts`.

---

## 4. Mobile-first layout system

### The failure today
This app targets phones, yet its two flagship interactions **break on touch:**

- **Drag-tags-to-editor is non-functional.** Tags are `draggable` with `onDragStart` only (`MetaTagLibrary.tsx:47-50`), the header shouts "DRAG TO EDITOR" (`MetaTagLibrary.tsx:19`), but the lyrics textarea has **no `onDrop`/`onDragOver`/`onDragEnter`** (`LyricsDisplay.tsx:257-266`) and there is no click fallback. HTML5 DnD doesn't fire on touch, so it's fully dead on phones *and* has no drop target on desktop. The `dragOverIndex/activeDraggingTag/isDragging/dragCounter` state (`LyricsDisplay.tsx:68-71`) is dead code.
- **17 native `alert()/confirm()/prompt()`** (e.g. `App.tsx:645,649,746,802,895`; `LyricsDisplay.tsx:155,171,189,211`; `ProfileView.tsx:122-197`) look broken and spammy on mobile, block the thread, and can't carry a CTA.

### The redesign

**A. Tap-to-insert, everywhere.** Replace the drag metaphor with **tap-a-tag → inserts at the textarea cursor** (works identically on touch and desktop). Keep drag as a *desktop-only enhancement* by finally adding `onDrop`/`onDragOver` to the editor. Remove the dead drag state. This is core to the studio's editing promise on the phones the app actually runs on.

**B. A real feedback layer.** One toast system (success/error, auto-dismiss, branded) + one confirm-modal (destructive actions) + inline forms (the translate language picker currently uses `window.prompt`, `LyricsDisplay.tsx:211`). This single system retires all 17 native dialogs and lets errors carry CTAs ("Buy credits," "Fix key").

**C. Layout primitives.** Extract the duplicated menu drawer (copy-pasted between LANDING `App.tsx:1273-1340` and STUDIO `App.tsx:1399-1460`), header credit chip, and view wrappers into shared components so the two menus stop drifting. The menu items render at `text-[2.05rem]/[2.2rem]` (`App.tsx:1284-1311`) — ~33px list items that look unpolished; bring them into the type scale (§5).

**D. Thumb-first ergonomics.** Primary actions (Generate, Save, Next) live in a bottom action bar within thumb reach, not mid-screen. The wizard grid already stacks responsively (`App.tsx:357`) — good; extend the same discipline to the studio editor, which is desktop-column-heavy today.

### Priority
- **Quick win:** Tap-to-insert tags; toast+confirm system replacing native dialogs; give the 5 dead social buttons real `href`s or hide them (`App.tsx:1319-1335, 1439-1455`).
- **Redesign:** Extract shared chrome; bottom action bar.

---

## 5. Lightweight design system (keep the dark aesthetic)

The visual language is genuinely good — deep indigo `#120e24`/`#1a1530`, orange→cyan gradient accents, generous radii. The problem is **ad-hoc, aesthetic-first styling**: tiny tracked uppercase everywhere (`text-[10px]` slate-500/600, e.g. `App.tsx:361,424,431,1210`) that's low-contrast and hard to read on phones, and one-off values scattered across components.

**Type scale (replaces the tiny-uppercase habit):**
| Token | Use | Spec |
|---|---|---|
| Display | Step titles, hero | `font-black`, tight tracking — keep (`App.tsx:430`) |
| Title | Section heads | 22-28px, sentence case |
| Body | Options, lyrics, help | 15-16px, **sentence case, normal tracking** |
| Label | One category word above a control | 12px uppercase, `tracking-wide`, **slate-300 min** (not 500/600) |
| Caption | Costs, hints | 13px, slate-400 |
Rule: **uppercase only for one-word labels; never for readable sentences or option lists.** This alone fixes most of the "shouty and hard to read" feel and the option-wall in the wizard.

**Color tokens** (name the existing values so they stop being magic strings): `--surface-0 #0c0a1d`, `--surface-1 #120e24`, `--surface-2 #1a1530`, `--border #334155-ish`, `--accent-warm orange-500`, `--accent-cool cyan-400`, semantic `--success emerald`, `--danger rose`, `--warning amber`. Contrast-check every label against its surface (WCAG AA).

**Spacing scale:** 4/8/12/16/24/32/48. Replace bespoke paddings (`p-8`, `rounded-[2rem]`, `p-4 sm:p-5 lg:p-6`) with a small set of tokens so density is consistent.

**Component kit (the reusable set the app is missing):** `<Button>` (primary/secondary/ghost/danger), `<OptionCard>`, `<Toast>`, `<ConfirmModal>`, `<Sheet>` (the shared menu drawer), `<CreditChip>`, `<Field>`. Every native dialog and duplicated block collapses into these.

**Motion:** add `prefers-reduced-motion` guards to `IntroAnimation` (heavy infinite framer-motion, no guard today, `IntroAnimation.tsx:100-401`) and the biggest hover/scale transitions. Motion-sensitive users currently have no escape.

### Priority
- **Quick win:** Label contrast bump (slate-500/600 → slate-300); reduced-motion guard.
- **Redesign:** Token file + component kit; refactor call sites.

---

## 6. Results / library + save reliability

### The failure today
`saveSong` throws `'STORAGE LIMIT REACHED'` at 25 songs (`songService.ts:30-37`). But `handleSave` calls `await persistSong(...)` then **unconditionally** `alert('Session saved to library!')` with **no try/catch** (`App.tsx:800-803`); `persistSong` has none either (`App.tsx:774-798`). In the editor, the Save button's `try/finally` **swallows** the error (only resets `isSaving`, `LyricsDisplay.tsx:219-225`), so the throw becomes an unhandled rejection. Net result: a user at the cap (or any DB blip) either sees nothing or a **false "Saved!"**, then loses the generated song with no path forward. This is the reported save-reliability bug, and it's the worst kind — it lies about success on the core deliverable.

### The redesign

**A. Confirm-then-celebrate.** Wrap `persistSong`/`handleSave` in try/catch; show "Saved" **only after** the promise resolves with a persisted id. On failure, a toast with the real reason.

**B. Make the 25-song limit a *feature moment*, not a silent failure.** On limit error, show: *"Your library is full (25 songs). Manage your discography or upgrade for more room."* + a **"Manage discography"** CTA into the library. (And revisit the cap itself — 25 is low for an active writer; consider tiering it with the plan.)

**C. Auto-save the draft so a generation is never lost.** Persist the generated song to a local draft the instant it completes (before the user taps Save), so a failed save or a refresh never destroys work. Today a lost save = a lost song.

**D. Library polish.** Results/library should show cover art (already generated), title, genre, and date, with the studio re-openable from a card. This makes the 25-cap tangible ("you have 23/25") instead of a surprise wall.

### Priority
- **Quick win:** try/catch around save + real success gating + limit toast with CTA (`App.tsx:800-803`, `LyricsDisplay.tsx:219-225`).
- **Redesign:** Local draft auto-save; library card view with usage meter.

---

## 7. Paywall / credit UX

### The failure today
Credit/plan numbers **contradict across three screens**: ProfileView overview says free "25/mo, Members 100/mo, Pro 500/mo" (`ProfileView.tsx:306-308`), the Wallet tab says "Free resets to 30 monthly… Pro grants 2,000" (`ProfileView.tsx:450-452`), PricingView sells "Pro Monthly… 500 Credits… ~50 songs/mo" (`PricingView.tsx:13-16,118`). The community discount is "50% off" in the auth banner (`App.tsx:925`) but "25% Off" on the pricing card (`PricingView.tsx:88,111`). A user literally cannot tell what they're buying **at the exact moment they decide to pay** — an invitation to chargebacks and "where are my credits" tickets.

Worse, credits are **deducted optimistically** (`App.tsx:721`) before generation succeeds; on failure the app reloads the true balance (`loadCredits`, `App.tsx:749`) but the user has already seen their balance drop, so a failed generate *feels* like a theft.

### The redesign

**A. One source of truth for pricing.** A single constants module (`PLANS`, `CREDIT_GRANTS`, `DISCOUNTS`) consumed by ProfileView, PricingView, and the auth banner. Reconcile the numbers to one set (25 vs 30 free; 500 vs 2,000 Pro; 25% vs 50% community) and never hardcode them in copy again.

**B. Deduct-on-success (transactional).** Move the charge to *after* a confirmed generation, server-side, or at minimum stop the optimistic UI decrement at `App.tsx:721` and only reflect the balance after `deductCredits` resolves (`App.tsx:742`). Then the "You weren't charged" recovery copy in §3 becomes literally true. This is the fix that ends "charged for a failure" anger.

**C. In-context paywall with a CTA, everywhere.** The pre-generation affordability check routes to PRICING (`App.tsx:713-718`) — good. But mid-editor "insufficient credits" (revisions/art, `LyricsDisplay.tsx:155,171,189`) just `alert()`s with no path. Every insufficient-credit surface should show a compact "Out of credits — buy more" sheet with cost, current balance, and a one-tap purchase, inline, without losing the user's work.

**D. Make cost legible before the click.** The wizard already shows "COST: 5 CREDITS" (`App.tsx:456`) — good pattern; extend it to every paid action (revision, art, translate) and always pair it with the live balance so there are no surprises.

**E. Tie the paywall to Door B (from §1).** If you adopt managed generation, the pricing page finally has a clean story: *free-key users pay nothing; managed users buy credits.* Right now credits exist but their relationship to the BYO-key requirement is unexplained, which is part of why the numbers drifted.

### Priority
- **Quick win:** Single pricing-constants source; reconcile all copy; stop the optimistic decrement.
- **Redesign:** Server-side deduct-on-success; in-context buy sheet.

---

## Consolidated priority roadmap

### Sprint 1 — Stop the bleeding (quick wins, highest ROI)
1. **Gate the key before charging** + pass `required` at blocking sites (`App.tsx:708-718`, `ApiKeyModal.tsx:151`). *Kills the #1 support driver.*
2. **Fix save** — try/catch, real success gating, 25-limit toast with CTA (`App.tsx:800-803`, `LyricsDisplay.tsx:219-225`). *Stops silent data loss.*
3. **Fix the intro replay** — read `sg_intro_seen` + skip (`App.tsx:905-907`). *Removes 7s of friction on every refresh.*
4. **Reconcile all credit/plan numbers** to one source (`ProfileView`, `PricingView`, `App.tsx:925`). *Restores purchase confidence.*
5. **Tap-to-insert tags** + kill the broken drag copy (`MetaTagLibrary.tsx:19,47`, `LyricsDisplay.tsx:257`). *Un-breaks the studio on mobile.*
6. **Honest generation copy + 60s timeout/cancel**; friendly error→CTA mapping (`App.tsx:744-750`). *Stops rage-refreshes.*
7. **Real hrefs (or hide) social buttons**; stop optimistic credit decrement (`App.tsx:721,1319-1335`).

### Sprint 2 — Make the promise visible
8. **Wire `generateDynamicOptions`** into a per-step effect (or delete the scaffolding + authenticity claims) (`App.tsx:325-352,477-478`). *The change that makes the genre engine's depth felt.*
9. **Toast + confirm + inline-form system** replacing all 17 native dialogs.
10. **First-run activation screen** with Door A (BYO) / Door B (managed + N free songs).
11. **Fast Track creation lane** (Genre → Vibe → Generate).

### Sprint 3 — Deepen
12. **Design tokens + component kit**; extract shared chrome (the two duplicated menus).
13. **SSE/token streaming** from `api/ai.ts` so loading reflects the real draft→genre→compliance→scrub pipeline.
14. **Server-side deduct-on-success**; in-context buy sheet; library card view with usage meter; local draft auto-save.

---

## Why this order
Sprints 1 fixes are almost all **one-file, low-risk changes to code that already exists** (the `required` prop, `testGeminiKey`, `sg_intro_seen`, the loading spinner) — they cost little and stop active churn/data-loss/trust damage. Sprint 2 turns the *invisible* genre intelligence into something the user can see and feel, which is the direct antidote to the "not respectful to the genre" complaint at the UI layer. Sprint 3 is the durable foundation (design system, honest streaming, transactional credits) that keeps all of it coherent as the app grows.

**Relevant files:** `/Users/andrethomas/conductor/workspaces/suno-ai-songwriter/da-nang/App.tsx`, `/Users/andrethomas/conductor/workspaces/suno-ai-songwriter/da-nang/components/ApiKeyModal.tsx`, `/Users/andrethomas/conductor/workspaces/suno-ai-songwriter/da-nang/services/geminiService.ts`, plus `components/MetaTagLibrary.tsx`, `components/LyricsDisplay.tsx`, `components/ProfileView.tsx`, `components/PricingView.tsx`, `components/IntroAnimation.tsx`, `services/songService.ts`, and `api/ai.ts` (for streaming).


---

# Appendix C — iOS Sister-App Blueprint (full)

All claims verified against the code. The audit is accurate. Now I'll write the build-ready blueprint.

---

# Song Ghost — iOS Sister-App Blueprint

**Verdict up front:** Build the iOS app in **Expo / React Native (managed workflow, TypeScript)** in a monorepo that imports the existing `services/*` and `lib/*` modules unchanged. Ship a **StoreKit-consumable credit model** on iOS (Stripe stays web-only), **hide the BYO-Gemini-key flow entirely** on iOS, and put a **real server-issued session token** in front of `/api/*` *before* the app ships. This is a ~9–12 week build, front-loaded by a mandatory ~1–2 week backend-hardening phase that also improves the web product.

The single most important thing to internalize: **the reusable value of this codebase is the service layer plus the genre engine, and both are DOM-free TypeScript.** The liabilities (fake auth, web-redirect OAuth, Stripe-only credits, desktop-grid UI) all live in `App.tsx` and the browser-coupled edges. That asymmetry — clean logic core, dirty presentation/security shell — is exactly the profile that makes Expo win and Capacitor lose.

---

## 1. Recommended Stack — Expo / React Native (decisive)

### The decision

| Option | Verdict | Why |
|---|---|---|
| **Expo / React Native (TS)** | ✅ **CHOSEN** | Imports `services/*` + `lib/guides/*` + `lib/culturalLogic.ts` etc. directly (all pure TS, no DOM). One language across web + mobile. Native UI, native auth/IAP via first-class Expo modules (`expo-apple-authentication`, `expo-in-app-purchases`/RevenueCat, `expo-secure-store`, `expo-web-browser`). Thin client, server-side engine. |
| **Capacitor (wrap the SPA)** | ❌ Rejected | Ships the 1,564-line desktop-grid `App.tsx` (`grid-cols-4`, `lg:`/`md:` layouts ~lines 302–468), `localStorage`-based fake auth, and `window.location` OAuth into a WebView. It boots but feels like "a website in a box," and it drags every security hole (§below) onto a *documented, inspectable* mobile surface that App Review will probe. It also cannot cleanly satisfy Sign in with Apple or StoreKit. |
| **Native SwiftUI** | ❌ Rejected (for v1) | Forces a full re-implementation of `services/*` **and** the entire genre engine (`lib/guides/*` — 25 guides at 50–86KB each, `genreAgents.ts`, `culturalLogic.ts`, `referenceFeatures.ts`, `metaTagLibrary.ts`) in Swift, for zero incremental v1 benefit — because **generation runs server-side in `api/ai.ts`, not on-device.** Revisit only if you later want deep iOS-only polish. |

### Why the reuse math favors Expo so heavily

Every service module is already a thin HTTP client — verified:

- `services/creditService.ts` posts to `/api/auth` with `{action:"db", dbAction, payload}` (line 11–16).
- `services/authService.ts` posts to `/api/auth` for `signup`/`signin`/`oauth` and writes `gwai_session` to `localStorage` (lines 20–67).
- `services/geminiService.ts` reads the key from `localStorage` key `songghost_gemini_api_key` (line 14, 31).

The **only** web couplings in the reusable layer are: (a) `localStorage`, (b) `window.location` (OAuth start, line 71 of authService), and (c) relative `/api/*` base URLs. Each is swappable behind a tiny adapter (§5). Nothing in the data or generation path touches the DOM — so Expo imports the engine as-is and you write only a new native UI + a native auth/payments adapter.

### Repo shape

```
songghost/  (monorepo — pnpm or npm workspaces)
├─ packages/core/        # extracted services/* + lib/* (shared web + iOS)
│   └─ adapters/         # Storage, Session, Config — platform-injected
├─ apps/web/             # existing Vite SPA (unchanged behavior)
└─ apps/mobile/          # NEW Expo app (native UI + native auth/IAP adapters)
```

Keep `api/` (Vercel) and `convex/` exactly as they are — both apps call the same front door.

---

## 2. Monetization — the two hard blockers, resolved

### 2A. Apple IAP vs Stripe credits — **replace Stripe with StoreKit on iOS**

**This is a business-model decision, not an engineering one, and it must be made before scoping.** Credits are "digital content used within the app" (they unlock `generateSong`, `generateAlbumArt`, etc.). Apple **Guideline 3.1.1** requires that to be sold via In-App Purchase. Shipping the current web checkout (`api/create-checkout-session.ts`) inside an iOS app is a near-certain rejection. **Guideline 3.1.3 (anti-steering)** additionally forbids linking to or even mentioning the cheaper web purchase from inside the app.

**Recommendation: StoreKit consumables on iOS, Stripe stays web-only.** The good news is the grant path already has a clean seam. The Stripe webhook grants credits by calling **one** Convex mutation:

```
api/stripe-webhook.ts:5-6  → makeFunctionReference('billing:applyStripeCheckoutCreditsByEmail')
```

You add a **parallel** endpoint — `api/appstore-notifications.ts` — that verifies the StoreKit receipt / App Store Server Notification (v2, JWS-signed) and calls the **same grant primitive** (or a near-identical `billing:applyIapCreditsByEmail` to keep provenance separate in `transactions`/`creditLedger`). No change to how credits are *spent* — `services/creditService.ts` `COSTS` (verified: `GENERATE_SONG:10, EDIT_SONG:1, GENERATE_ART:8, SOCIAL_PACK:1, CREATE_AVATAR:100`) and `getUserCredits` are identical on both platforms.

**Price to absorb Apple's cut.** Current web packs (verified in `create-checkout-session.ts`):

| Pack | Web (Stripe) | iOS (StoreKit) — nets ~web after 30% |
|---|---|---|
| 50 credits | $4.99 | **$6.99** |
| 100 credits | $9.99 | **$12.99** |
| 250 credits | $14.99 | **$19.99** |
| Pro Monthly (500) — subscription | $24.99 (`recurring`) | **$29.99/mo** (StoreKit auto-renewable subscription) |

Notes: the Pro Monthly product is a Stripe **subscription** (`mode:'subscription'`, `recurring:{interval:'month'}`), so on iOS it becomes a StoreKit **auto-renewable subscription**, not a consumable — plan the App Store Server Notification handler for both product classes. Small caveat on Apple's cut: the **Small Business Program** drops the fee to 15% under $1M/yr, which materially improves these price points — check eligibility before finalizing.

**Implementation shortcut:** use **RevenueCat** rather than raw `expo-in-app-purchases`. It handles StoreKit 2 receipts, App Store Server Notifications, and gives you a webhook that fires "purchase confirmed → grant N credits." Point that webhook at `api/appstore-notifications.ts` → same Convex grant mutation. This saves 1–2 weeks of fragile receipt-validation code and is the recommended path.

### 2B. BYO-Gemini-key — **hide it entirely on iOS**

The BYO-key model is both an App Review risk and, for most users, **functionally pointless** — verified:

- `shouldRequireUserGeminiKey` (ai.ts:2742–2754) returns `true` **only** when `profile.tier === 'skool'`. Every other tier silently uses the platform `GEMINI_API_KEY` (ai.ts:858).
- Image generation *always* uses `getRequestGeminiTextApiKey()` (ai.ts:2777, 2853), which falls back to the platform key for non-skool users.
- So for the entire non-skool consumer base, the key isn't even used for text, and never for images.

Asking a consumer to obtain and paste a Google AI Studio key is textbook **Guideline 2.1 / 4.0** friction, and — because it can look like a way to route generation cost around IAP — a possible **3.1.1** flag too.

**Recommendation:** On iOS, **default every user to the platform key and do not ship `components/ApiKeyModal.tsx` at all.** The 'skool' tier is a web-community construct (invite codes, `skoolMembers` table) and is explicitly deferred from v1 (§4). If a skool user ever signs in on iOS, treat them as platform-key like everyone else for v1. Cost is fully covered by IAP credit pricing. This removes a scary setup step for zero functional loss on mobile.

---

## 3. Auth & Sign in with Apple

### The problem (verified)

There is **no real authentication today.** Confirmed by code:

- `isAllowedEmail(email)` = `sanitizeEmail(email).includes("@")` (ai.ts:843–845). The entire generation engine is gated on only that (ai.ts:3540: `if (!isAllowedEmail(email)) return 401`).
- The "session" is a plaintext email in `localStorage` under `gwai_session`, no token (authService.ts:11–16, 45).
- Privileged Convex mutations are keyed by the email **in the request body** (creditService.ts:15, stripe-webhook grant, etc.).
- `grep` for `authorization|bearer|jwt|verifyToken` across `api/ai.ts`, `api/db.ts`, `services/` returns **nothing.**
- OAuth terminates by redirecting the browser to `/?oauth_email=<email>` (oauth/callback.ts:220) — an email in a URL param, not a signed token.

**Consequence:** anyone can POST `{email:'victim@x.com'}` and spend their credits, read/delete their saved songs (`savedSongs` table), or drain the platform Gemini key. On the web this hides behind obscurity; **a native app ships a documented, proxied API surface** that reviewers and researchers will inspect. **You cannot responsibly launch a paid iOS app on this model.** This is the true prerequisite and the largest hidden cost of the sister app.

### The design (Phase 0 — do this first, ship to web too)

1. **Issue a signed session token** from `/api/auth` on `signup` / `signin` / `oauth` (a JWT with `email` + `exp` + a rotation-capable secret is sufficient; you already control the server).
2. **Require and verify the token** on `/api/ai` and the `/api/auth` db-action proxy, replacing the `isAllowedEmail` shim.
3. **Derive `email` from the verified token, never from the request body** — so a caller can only act as themselves. This is the actual fix for the whole finding class.

### Native auth flows (Phase 2)

- **Email/password** → hardened `/api/auth`, store the returned token in **Keychain via `expo-secure-store`** (Session adapter, §5).
- **Social (Google / Discord / Facebook / Microsoft)** → **`ASWebAuthenticationSession`** (`expo-web-browser` `openAuthSessionAsync`) against the existing `/api/oauth/start`. **Change the callback** so that instead of `/?oauth_email=`, it redirects to a **custom URL scheme** (e.g. `songghost://auth?token=<jwt>`) carrying the Phase-0 signed token. This is coupled to Phase 0 — the callback can't return a token until Phase 0 issues one.
- **Sign in with Apple — mandatory.** Under **Guideline 4.8**, offering any third-party social login (you offer four) forces you to *also* offer Sign in with Apple. Implement natively with **`expo-apple-authentication`**; map the returned Apple identity to a user in Convex (`users`/`profiles`) and issue your own Phase-0 token. Note Apple's private-relay email — persist the stable `user` identifier, not just the (possibly relay) email, so account linkage survives.

---

## 4. v1 MVP Scope + Screen List

**Design principle:** thin native client, server-side engine, review-safe surface. Reuse ~90% of the backend and 100% of the genre engine.

### In scope (v1)

1. **Core generation wizard** — the 12-step `CreationWizard` flow (`App.tsx`) → `generateSong`, rebuilt as native mobile screens using the existing cultural-logic tables (`INSTRUMENTS_BY_GENRE`, `SCENES_BY_GENRE`, `EMOTIONS_BY_GENRE`, `App.tsx` ~121–285) imported from `packages/core`.
2. **Song display + copy-to-Suno** (the primary output action).
3. **Saved songs library** (`savedSongs` table via `services/songService.ts`; server enforces the per-user cap).
4. **Buy credits via IAP** (StoreKit consumables, §2A).
5. **Auth incl. Sign in with Apple** (§3).
6. **Album art generation** (`generateAlbumArt`) — include **only if IAP unit economics cover the image cost** (`GENERATE_ART` = 8 credits; image path always burns the platform key).

### Deferred to v2

Social pack (`generateSocialPack`), translate (`translateLyrics`), Ask Andre widget (`askAndre`), referral system (`referralCodes`/`referrals` tables), community/skool invite codes (`inviteCodes`/`skoolMembers`), and the **BYO-Gemini-key** flow (hidden on iOS entirely, §2B).

### Screen list

| # | Screen | Backend action(s) | Notes |
|---|---|---|---|
| 1 | Onboarding / value prop | — | 2–3 slides, no forced login |
| 2 | **Auth** (email + social + **Sign in with Apple**) | `/api/auth`, `/api/oauth/start` | Apple button mandatory |
| 3 | Home / Studio hub | `getUserCredits` | Shows credit balance, "New Song," Library |
| 4 | **Creation Wizard** (multi-step, native) | `generateDynamicOptions` (dynamic dropdowns) | Genre → subgenre → mood/scene/instruments → theme/lyrics-in. Mobile stepper, one decision per screen |
| 5 | Generating (progress) | `generateSong` | Long-running; show engaged loading state |
| 6 | **Song Result** | — | Structured lyrics + Suno prompt; **Copy to Suno**, **Save**, **Generate Art** |
| 7 | Album Art (optional) | `generateAlbumArt` | Gated on credits; skippable |
| 8 | **Library** (saved songs) | `songService` (list/get/delete) | Server-side cap enforced |
| 9 | Song Detail (from library) | `editSong` (optional in v1) | Re-copy, delete |
| 10 | **Buy Credits** (IAP) | RevenueCat → `api/appstore-notifications` | StoreKit paywall; **no web-price mention** (3.1.3) |
| 11 | Settings / Account | `signOut`, account delete | **Account deletion required** (Guideline 5.1.1(v)). **No ApiKeyModal.** |

---

## 5. Shared-Backend Plan

**Reuse the entire `/api/*` contract verbatim.** No backend rewrite is needed for songs, credits, profiles, dynamic options, album art, or auth. Verified action set in `api/ai.ts` (3548–3562): `generateSong`, `editSong`, `structureImportedSong`, `generateDynamicOptions`, `generateAlbumArt`, `generateSocialPack`, `translateLyrics`, `askAndre`.

**Keep the Vercel `/api` layer as the single front door.** Every serverless function reaches Convex with a shared `CONVEX_ADMIN_KEY` (`api/auth.ts` pattern), so **the proxy is the only security boundary.** The native app **must never** embed the Convex admin key or hit Convex directly. All authz fixes (§3) live in that proxy.

**Three tiny platform adapters** are the entire "port" of the shared core (`packages/core/adapters/`):

| Adapter | Web impl | iOS impl | Touches |
|---|---|---|---|
| **Storage** | `localStorage` | `expo-secure-store` (tokens) + `AsyncStorage` (non-secret) | `authService.ts`, `geminiService.ts` key read (iOS: no-op / removed) |
| **Session** | `gwai_session` email | signed token in Keychain | `authService.ts` |
| **Config (API base)** | relative `/api/*` | absolute `https://www.songghost.com` | all of `services/*` |

Inject these at app startup so `services/*` stays untouched. The genre engine (`lib/guides/*`, `genreAgents.ts`, `culturalLogic.ts`, `referenceFeatures.ts`, `metaTagLibrary.ts`) imports with **zero** changes.

**Two new server endpoints only:** (1) token issuance + verification in `/api/auth` and enforcement in `/api/ai` (Phase 0); (2) `api/appstore-notifications.ts` for IAP credit grants, mirroring `api/stripe-webhook.ts` and calling the same `billing:*` grant mutation.

**Cross-cutting win:** the "uber-cliché" genre problem (the user's #1 complaint) lives entirely server-side (`api/ai.ts` `compileGuideToDirectives`/`checkGuideCompliance` + `lib/`). **Any generation-quality fix benefits web and iOS automatically** — the sister app never re-solves it. This is itself a strong argument for keeping generation server-side and the mobile client thin.

---

## 6. Phased Delivery Timeline

| Phase | Scope | Effort | Blocking? |
|---|---|---|---|
| **Phase 0 — Backend hardening** | Signed session token from `/api/auth`; verify on `/api/ai` + db proxy; derive `email` from token not body; kill `isAllowedEmail`. **Ship to web too.** | **1–2 wks** (server-only) | **Hard prerequisite.** Nothing native should ship without it. |
| **Phase 1 — Monorepo + shared-core extraction** | Stand up pnpm workspace; move `services/*` + `lib/*` into `packages/core`; add Storage/Session/Config adapters; scaffold Expo app; wire absolute API base. | **1–2 wks** | Web must keep passing (regression-guard the extraction). |
| **Phase 2 — Native auth** | Email/pw against hardened `/api/auth`; `ASWebAuthenticationSession` for 4 social providers; **native Sign in with Apple**; callback returns token via custom scheme; Keychain storage. | **1–2 wks** | Depends on Phase 0 token. |
| **Phase 3 — StoreKit IAP** | RevenueCat consumables + subscription mirroring credit packs; `api/appstore-notifications.ts` → same Convex grant; iOS price points absorbing 30% (or 15% SBP); no anti-steering violations. | **~2 wks** | The real monetization blocker; App Store Connect product setup lead time. |
| **Phase 4 — MVP UI** | Screens 1–11 (§4); native Creation Wizard from cultural-logic tables; song result + copy-to-Suno; library; album art (if economics allow); account deletion. | **2–3 wks** | — |
| **Phase 5 — Review hardening + submit** | Sign in with Apple QA, account deletion, privacy nutrition labels, no web-price mentions, TestFlight, App Review. | **1 wk + review latency** | Budget for 1–2 rejection cycles. |

**Total: ~9–12 weeks** to a review-ready iOS v1, with Phase 0 (~1–2 wks) as an unskippable gate that *also* hardens the live web product. The three things that will actually eat schedule are, in order: **(1) the missing auth token** (largest hidden cost), **(2) StoreKit + App Store Connect** economics and plumbing, and **(3) App Review cycles** around Sign in with Apple, account deletion, and anti-steering — not the UI, and *not* the genre engine, which ports for free.

---

**Files that anchor this blueprint:**
- `/Users/andrethomas/conductor/workspaces/suno-ai-songwriter/da-nang/services/authService.ts` (fake session, web-redirect OAuth)
- `/Users/andrethomas/conductor/workspaces/suno-ai-songwriter/da-nang/services/creditService.ts` (COSTS, `/api/auth` db proxy)
- `/Users/andrethomas/conductor/workspaces/suno-ai-songwriter/da-nang/services/geminiService.ts` (BYO-key in localStorage)
- `/Users/andrethomas/conductor/workspaces/suno-ai-songwriter/da-nang/api/ai.ts` (`isAllowedEmail` L843, engine gate L3540, `shouldRequireUserGeminiKey` L2742, action switch L3548–3562)
- `/Users/andrethomas/conductor/workspaces/suno-ai-songwriter/da-nang/api/create-checkout-session.ts` (Stripe packs/prices L58–149)
- `/Users/andrethomas/conductor/workspaces/suno-ai-songwriter/da-nang/api/stripe-webhook.ts` (`billing:applyStripeCheckoutCreditsByEmail` grant seam L5–6, L102)
- `/Users/andrethomas/conductor/workspaces/suno-ai-songwriter/da-nang/api/oauth/callback.ts` (`?oauth_email=` redirect L220)
- `/Users/andrethomas/conductor/workspaces/suno-ai-songwriter/da-nang/convex/schema.ts` (reusable tables — savedSongs, creditLedger, transactions, referrals, skoolMembers, inviteCodes)
- `/Users/andrethomas/conductor/workspaces/suno-ai-songwriter/da-nang/lib/guides/` + `lib/genreAgents.ts`, `lib/culturalLogic.ts` (portable genre engine)


---

# Appendix D — Adversarial Critique of the Genre Fix

I have verified enough. The core structural claims (dead code, nano default, English-only scrub, edit-only depth pass, no exemplars) are all confirmed against the code. The "inert matcher" claim is real but partially overstated (some English guides have semi-literal clichés). And I found a serious self-inflicted flaw in the redesign itself: it fabricates a "real" exemplar line while preaching accuracy, exposing the clearance problem. Now I'll write the adversarial review.

---

# Adversarial Review — Genre-Authenticity Diagnosis & Redesign

I verified the load-bearing claims against the code before critiquing. The **audit's structural diagnosis is largely correct and well-evidenced** — dead builders (`compileGuideToDirectives`=1, `getGenreAgentDirectives`=1, `getGenreReferenceBlueprint`=1, `getReferenceFeatureBlock`=1, `buildCulturalPromptContext`=1 occurrence each, confirmed via grep), `openai`/`gpt-4.1-nano` defaults (`api/ai.ts:888,895`), English-only scrub (`3178-3210`), edit-only depth pass (`enforceSongDepthAndTexture` called only at `3269`, not in `generateSong`), and zero exemplars anywhere in `lib/guides`. Phase 0 (unpin nano) is the right first move and I endorse it.

But the **redesign has real weaknesses**, and one of them the proposal commits *in its own worked example*. Ranked most severe first.

---

## 1. The redesign fabricates a "real, admired line" in the one place it demos the fix — and this is the whole plan's fatal flaw at scale (CRITICAL)

The proposed AFTER prompt hands the model:
> • "She got that Fancy Like Applebee's on a date night" — specificity as intimacy

**That is not a real lyric.** The actual "Fancy Like" hook is *"Yeah, we fancy like Applebee's on a date night."* The proposal misquotes the one song it uses to prove the exemplar concept. And it cites `country.ts:550-565` as the source of "reference tracks with real specificity" — but I read that block: `referenceTracks` contain **no lyric lines at all**, only `whyExemplary`/`structuralNotes`/`craftHighlight` prose. So the exemplar was invented, not retrieved.

**Why it matters:** This is the redesign's thesis ("stop describing, start demonstrating with *real* lines") failing on contact with reality. If a careful proposal author fabricates/misquotes one line, then hand-authoring "6-10 REAL, admired lines" × 25 genres × subgenres = **hundreds of quoted fragments** will be riddled with (a) misquotes and (b) uncleared copyrighted lyrics. The proposal waves this away with "cleared/original" — but those are contradictory: a *real, admired* line by definition is not original, and "cleared" for hundreds of commercial lyrics is a legal/licensing project, not a code task. Few-shotting copyrighted lyric fragments into prompts also risks the model regurgitating them near-verbatim into user output — a direct infringement vector for a paid product.

**Safer alternative:** Do not ship quoted commercial lyrics as exemplars. Instead author **original, genre-authentic lines written to demonstrate a craft move** (clearly labeled synthetic), plus **structural/rhetorical patterns** ("one physical scene per couplet; let the object carry the emotion") anchored to *publicly citable* facts about real songs (which the guides already do via `whyExemplary`). This keeps the show-don't-tell benefit without the misquote/clearance minefield. If real lines are used at all, restrict to short, clearly-fair-use fragments with a written clearance review, and add an output-similarity guard so drafts can't echo them.

---

## 2. Few-shot exemplars will shift cliché, not eliminate it — and can *induce* a new stereotyping failure (HIGH)

The proposal asserts few-shot "directly attacks the tell-not-show root cause." Partly true. But three unaddressed failure modes:

- **Exemplar overfit / homogenization.** 6-10 fixed lines retrieved by `emotion+subGenre+language` means every "country + heartbreak + clean" song draws from the same tiny pool. Users generating repeatedly will get variations-on-the-exemplars — a *new* sameness. The old cliché ("neon lights") gets replaced by a house cliché ("screen door slapping shut at dusk" — which the proposal itself uses **twice**, at `3186` in the current scrub and again in its AFTER word-bank). You'd be codifying the model's next rut.
- **Concrete ≠ authentic.** Naming "Applebee's, tailgate, Wrangler" produces *country cosplay* — the tourist output the guides warn against — just with brand nouns instead of abstractions. Specificity is necessary, not sufficient; a checklist of "genre nouns" is exactly the "culture as a checklist" trap the pressure-test names.
- **The judge inherits the drafter's blind spots.** The rubric scores "genre-idiom fit" *against the same exemplars/spec card* fed to the drafter. A drafter and judge sharing one rubric will happily agree a line is authentic when it's stereotyped, because the rubric encodes the stereotype. Self-consistent ≠ correct.

**Correction:** (a) Make exemplar pools large and rotate/sample so output doesn't converge; treat exemplars as *illustrations of a move*, never a phrase bank to lift. (b) Add an explicit **anti-homogenization signal** to the judge/eval: penalize n-gram overlap with the exemplars and with the app's own recent outputs, not just overlap with the banned list. (c) Ban the word-bank nouns from appearing *verbatim and unmodified* — force the model to generate its own concrete detail *in the spirit of* the bank rather than pasting from it.

---

## 3. The "Authenticity Kit for 25 genres/11 languages" is the actual project, and the plan under-scopes who authors it (HIGH)

The kit needs, per guide: 6-10 exemplars + 3 lexicon buckets + ≥10 literal `bannedPhrases` + `clicheTropes` — **in-language, dialect-correct, culturally current**, for Arabic, Hindi, Swahili, Latin (which Spanish? Mexican regional ≠ Puerto Rican reggaetón ≠ Argentine), Mandopop, K-pop, etc. The CI lint (`<6 exemplars fails build`) will pressure whoever's on deadline to **fill quota with plausible-sounding-but-wrong content** — the fastest way to encode outsider stereotypes into a shipped product. A non-native author hand-writing "authentic Arabic idioms" to pass a lint is precisely how you get the disrespect the user complained about, now baked into data instead of emerging from a weak model.

**Correction:** This is not an engineering backfill; it's a **cultural-consultant sourcing problem**. Budget for native-speaker/practitioner authors per language *before* writing the lint. Make the lint check *provenance* (who authored/reviewed this guide's kit) not just *count*. Ship English + the 2-3 languages you can properly source first; leave the rest on the current path (honestly labeled) rather than shipping quota-filled stereotypes. "Author `latin.ts` to the `italian.ts` benchmark" assumes `italian.ts` is actually good — nobody in this audit verified that; don't make an unvalidated guide the gold standard.

---

## 4. The judge is the highest-cost, highest-latency, most-fragile piece — and it's placed on the hot path (HIGH)

The proposal adds an LLM-judge call **plus a conditional rewrite** on *initial* generation, inside a 70s budget (`hasTimeBudget` guards). Reality:

- **Latency/cost.** Draft (now on a *stronger, slower* model per Phase 0) + judge (strong model, "always") + rewrite loop (up to 2×) + existing meta-tag/Suno passes. That's plausibly 3-5 strong-model round-trips where there's currently ~1 nano draft. The proposal's "fits existing guards" is optimistic; the guards will simply *skip* the judge under load, so the quality gate silently doesn't run — the same failure class (silent no-op) the audit is fixing.
- **JSON-contract fragility.** `{scores, weakestLines:[{original,why,rewrite}]}` requires the judge to reproduce `original` lines exactly to splice rewrites. Lyric lines with punctuation/adlibs/section tags make exact-match splicing brittle; mismatches either no-op or corrupt structure. The old find/replace scrub is dumb but deterministic; the judge is smart but flaky.
- **Rewrite drift.** "Preserve rhyme, syllable count, structure" is exactly what LLMs are worst at under a rewrite instruction. You risk trading cliché for broken meter — a *different* kind of genre-disrespect a working songwriter will hear instantly.

**Correction:** Make the judge **async/off-hot-path for iteration** (run it in the eval harness and on edits, not blocking first generation), or gate it behind a fast deterministic pre-check so it only fires when banned-density is high. Keep a deterministic fallback. Prove the rewrite preserves meter on a test set *before* trusting it on the path users see.

---

## 5. The BYO-Gemini "floored primary" plan is quietly a cost/UX regression the proposal doesn't price (MEDIUM-HIGH)

The task premise says the app "uses the END USER'S OWN Gemini key" for text. The redesign's answer — route the *creative draft and always the judge* to "the server's quality-floored model" whenever the user's key can't clear a tier — means **the operator eats the cost of the strong drafter + strong judge for most users**, since most BYO keys won't be `gemini-2.5-pro`-class. That inverts the app's cost model (the whole point of BYO is the *user* pays for inference). The proposal never states this; it's a silent margin hit that could dwarf the "cost optimization (nano)" it criticizes.

**Correction:** Decide the business model explicitly. Either (a) BYO users get their-key quality with honest labeling ("your key = this tier = this authenticity ceiling") and the operator only subsidizes the judge, or (b) it's operator-paid premium generation and BYO is deprecated for the creative step. Don't split the difference silently. Also: "surface which model wrote the song" is good, but a "get a better key" nudge on a paid product reads as blaming the customer for the app's cliché output — soften or make it a paid upgrade path, not a scold.

---

## 6. Retiring `getGenreTruthParagraph`/`getSpecificityAnchors` also rips them out of `editSong` — under-scoped blast radius (MEDIUM)

The redesign says "retire `getGenreTruthParagraph`/`getSpecificityAnchors` as the primary path" and treats it as a `generateSong` change. But `getGenreTruthParagraph` is also called in `editSong` (`3236`) and a third path (`3297`). Any signature/return change ripples to all three. Minor, but the plan's file-reference section lists only the generate path — the kind of omission that produces a half-migrated pipeline (exactly how the current dead code happened). Enumerate all three call sites in the migration.

## 7. "Golden test asserts guide substrings appear in the prompt" prevents *unwiring*, not *badness* (MEDIUM)

This test is genuinely valuable (it catches the regression that caused this whole mess) and I endorse it. But be honest about what it proves: that *some* guide text is in the prompt — **not** that the song is authentic. It will pass on a garbage exemplar as readily as a great one. Don't let its green checkmark stand in for the human/native-speaker review that's the actual quality gate. Pair it with the judge-score eval *and* periodic native-speaker spot-checks, or you've built a regression guard that certifies confident stereotyping.

## 8. Minor but real: the "inert matcher" claim is overstated for English guides (LOW)

The audit says `checkGuideCompliance` "does essentially nothing." Verified nuance: it's **inert for the meta-description guides** (hindi `'"dil" (heart) in every other line'` can't match) — correct. But several English guides have **semi-literal** clichés (`country.ts`: "Cold beer on a Friday night", "Dirt roads and back roads") that *can* substring-match when the model uses that exact phrasing. So it fires *sometimes* for English, *never* for the meta-description/non-English ones. The fix (a separate literal `bannedPhrases` field) is right regardless, but the diagnosis slightly overstates "fires almost never" as universal — it's a spectrum. Doesn't change the recommendation.

---

## What I would actually do first (a skeptic endorses these)

1. **Ship Phase 0 only, and measure it in isolation.** Unpin nano (`SONG_DRAFT_LLM=claude` or a real `OPENAI_TEXT_MODEL`) and the golden "guide-content-reaches-prompt" wiring test. These are hours of work, low-risk, and the audit's own evidence says the model is the current ceiling. **Do not bundle the exemplar/judge/kit work with it** — otherwise you can't tell whether model-tier alone fixed 80% of the complaint, which would make the entire kit project optional.

2. **Prove the exemplar concept on ONE genre with real cultural review before writing any `types.ts` field or CI lint.** Pick one genre you can source authentically (e.g. country, in-house competence), author *original* demonstrative lines (not quoted commercial lyrics), A/B it against Phase-0-only output with blind native/practitioner listeners. If original-synthetic exemplars don't beat "strong model + current prompt," the whole kit thesis is unproven and you've saved a 25-guide slog.

3. **Replace the hot-path judge with an offline eval harness first.** Build the banned-density + sensory-coverage + judge-score eval as a *script over a frozen prompt matrix* (the proposal's section 5) and use it to drive decisions — before putting any judge call in the request path. This gives you the number to replace "feels cliché," de-risks latency/margin, and lets you validate that rewrites preserve meter *before* users ever see them.

**Net:** The diagnosis is sound and the direction (show-don't-tell, wire the dead code, floor the model, measure) is right. The redesign's danger is that it treats a **cultural-sourcing and legal-clearance problem as an engineering-backfill problem**, puts its most fragile component (judge + rewrite) on the user-facing hot path, and — proven by its own misquoted "Fancy Like" exemplar — will fabricate/misquote or stereotype its way through 25 guides unless real native authorship gates the content. Floor the model, measure honestly, and earn the kit one genre at a time.

Key evidence files: `api/ai.ts:888,895` (model defaults), `api/ai.ts:3053-3232` (generateSong assembly + edit-only depth at `3269`), `api/ai.ts:744-755` (substring cliché match), `api/ai.ts:3178-3210` (English scrub), `lib/guides/country.ts:114-122` (semi-literal cliches) and `550-565` (referenceTracks with **no lyric lines**), `lib/guides/hindi.ts:110-112` (meta-description cliches), `lib/guides/soul.ts:465` (craftHighlight is prose, not lines).