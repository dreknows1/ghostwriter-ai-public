All spot-checks confirm the postmortem's code claims ([Build Up] catch-all at metaTagLibrary.ts:153, (Backing Vocals) quotas at 147-149, 'Body/skin/touch imagery' at rnb.ts:114, the 'HOOK —' label at ai.ts:3346, dead performerType input). Here is the synthesized report.

---

# SONG GHOST: THE LYRIC ENGINE RETHINK — FINAL REPORT

*(Plain-language report for the founder. Technical appendix for the engineer at the end.)*

---

## PART 1: WHAT THE SUCCESSFUL PEOPLE DO

We studied four things: how real users get great lyrics out of ChatGPT and Claude, how Suno power users format songs, how Nashville pros write hits, and what published research says about AI lyric writing. All four groups agree on the same short list. Here it is.

**1. They ban the AI's favorite words — up front, in the prompt.**
AI models have a "house style": whisper, echo, neon, shadows, embrace, symphony, hollow. Research confirmed this is baked in — a study of 5,700 AI poems found the same narrow word list every time. The most popular community prompts fix it with big "never use these" lists (200-400 banned words, phrases, and even banned metaphors like "storm = anger"). There are now free tools that just scan lyrics for these words. Banning up front works better than fixing after.

**2. They pick the hook first, and keep it plain.**
Nashville writers spend hours picking a title before writing one line. Then the chorus is built around it, then the verses. The hook is 3-6 plain spoken words a real person would say. Community guides do the same: ask for 5-10 title and hook ideas, pick the best one, then write. A hit repeats its title about 7 times. Our hookless choruses come from skipping this step.

**3. They feed the AI a real story with real details.**
"I still set two coffee cups out every morning" beats "I miss you every day." Every guide says the same thing: the AI averages everything into mush unless you give it one concrete moment — a place, a time of day, an object, a thing someone did. This is the single biggest quality lever, and it comes from the USER, not from menus. The people beating us with plain ChatGPT win because they type their story in their own words.

**4. They let rhymes be loose.**
Left alone, the AI forces perfect rhymes over everything — that's where nonsense lines come from. Winners tell it: "near-rhymes are fine; if the rhyme fights the meaning, drop the rhyme; rhyme every 2nd or 4th line, not every line." Research found the same: the best systems pick the rhyme word first, then write a sensible line toward it — they never ask the AI to rhyme freely.

**5. They keep songs short and do the counting themselves.**
Good Suno lyrics are 150-250 words. Lines are 6-10 syllables. Choruses are 2-4 lines. And here's the key: AI literally cannot count syllables — a study measured an 80% error rate. Nobody trusts the model to count. They count with a tool (or read lines out loud) and regenerate what's too long. Counting is a job for code, not AI.

**6. They show feelings through actions, and leave plain lines to breathe.**
"I spray your perfume on my pillow every night," not "I miss you so much" — and not "every shiver's perfume" either. Pros warn against wall-to-wall imagery: listeners need simple spoken lines between the pretty ones. Rule of thumb: at most one metaphor per 4-line section, and the chorus stays plain.

**7. They show the AI full example songs in the genre, not vibe words.**
Telling the AI "make it neo-soul" does nothing — research shows style copying fails without examples and works well WITH them. One full verse + chorus in the target style transfers the feel. Genre is also carried by craft rules (R&B = fewer words per line, room for vocal runs, "you" in the first lines; country = plain talk, one slice-of-life moment), not adjectives.

**8. They never let the AI patch single lines — they pick the best of several whole tries.**
This one is proven and it's the opposite of what we do. A direct study found that "improve this lyric" loops make lyrics MORE average, and research shows models often change right things to wrong when self-correcting. What works: generate 2-3 full drafts, check them with hard rules, and SELECT the best one. Community calls it the "highlighter mentality." If a draft fails, throw it out and write a fresh one — don't patch it.

---

## PART 2: WHAT WE DO WRONG

The engineering postmortem traced every failure you saw to a specific cause in our code. None of them are bad luck. Here's the map.

**Failure: nonsense rhyme lines ("the weight starts easing thin").**
Cause: our "fix-it" passes. After the draft, up to 8 different cleanup steps can rewrite lines. Every one of them runs at a HOTTER randomness setting than the draft, with no songwriter instructions, while being forced to keep the rhyme and syllable count of the line it's replacing. That's the hardest writing job in the pipeline given to the worst setup. Nonsense rhymes are the escape valve. Our own code comments even say this setting "produced rhyme-forced word salad."

**Failure: purple imagery, no plain lines, hookless choruses ("every shiver's perfume").**
Three causes. First, this is the AI's documented default style, and we don't ban its pet words in the draft prompt. Second — this one hurts — our own R&B guide bans "Body/skin/touch imagery" as a "tired trope." So we literally forbid R&B from writing about touch, and the AI writes weird abstract workarounds instead. Third, we never pick a hook first, and our judge punishes plain lines as "weak," so simple singable choruses get rewritten into mush.

**Failure: [Build Up] in R&B and "(Backing Vocals)" spam.**
Cause: our tag system REQUIRES these. It has quotas: minimum 6-8 ad-libs per song, required "accent tags" that literally include "(Backing Vocals)" for R&B and "[Build Up]" as the default for every genre without its own list. It scores drafts higher for having MORE tags and keeps the highest-scoring (most spammed) of 3 tries. The fix we shipped earlier patched a backup code path that never runs. And every time a user EDITS a song, this system runs again — so editing a clean song re-infects it. Community rules are the exact opposite: few tags, from a short fixed list, and anything in parentheses gets literally sung.

**Failure: the song about a person named "Catchy" / "should of told me."**
Cause: our planner step. A weaker, hotter model writes a free-text plan whose own template contains the label "HOOK — the exact repeatable hook phrase." That raw text gets pasted into the writer's prompt with the order "follow it." A line like `HOOK — catchy: "should of told me"` looks like a character name and a quote, so the writer wrote a song to "Catchy." Nothing ever checks the plan's grammar or format — the hook is the most protected, least inspected string in the whole system. And "Repeat it" instructions multiply the error through every chorus.

**Failure: neo-soul comes out as generic alt-pop.**
Cause: the subgenre is decorative. When a user picks Neo-Soul, all the real neo-soul data we have (Rhodes keys, live drums, 65-100 BPM, reference artists) never reaches the writer — a code gate skips it — and usually never reaches the Suno style prompt either, because a coin-flip heuristic decides whether to use our guide data or the AI's own prose. The user gets the generic R&B card with "Neo-Soul" as a cosmetic label.

**Failure: the wizard feels like work but doesn't help.**
Of the 12 steps, only genre, the free-text direction, and one crammed context line actually reach the writer. The "performer" step is read NOWHERE — dead input. The "scene" step's only real effect is dangerous: if a scene option contains a word like "raw," it silently flips the song into explicit mode. And the streaming UX shows the user one song being written, then swaps in a different one after the hidden cleanup passes — a bait-and-switch that burns trust.

**The big picture:** plain ChatGPT beats us because it is one strong model, one coherent prompt, zero passes fighting each other afterward. Our draft prompt is actually competitive. Everything after the draft is where we lose.

---

## PART 3: THE NEW PROCESS

One design. No menu.

### (a) What we ask the user — 4 inputs plus one fun choice

1. **Language.**
2. **Genre + optional subgenre.** (One picker, not two steps.)
3. **The story — one free-text box** with smart nudges: "What happened? Who is it about? Give us one real detail — an object, a place, a time of day." This box is the product. Everything the research says about quality starts here.
4. **Optional "sound" chips** (collapsed by default): voice type (male/female/duet), mood, and an explicit-lyrics ON/OFF switch the user flips themselves. These feed ONLY the Suno style prompt, never the lyric writer.

Then one interactive moment: **we show 4 hook options ("Your song could be called...") and the user taps one.** This is the one decision pros spend hours on, it takes the user 5 seconds, it feels like co-writing, and it structurally kills the hookless-chorus problem. (Auto-pick the top one if they skip.)

Deleted from the wizard: scene, performer, audio environment, instrumentation, duet-type, emotion, specifics as separate steps, and all the extra AI calls that generated their dynamic options.

### (b) The generation steps — 4 AI calls + free code checks

**Call 1 — Hook Smith.** Input: language, genre, the user's story. Output: strict JSON — 4 candidates, each `{title, hook_line}`. Code validates every candidate before the user sees it: 2-6 words, real grammar (auto-fix "should of" → "should've"), no banned words, no label text. The plan is now data, not prose. The "Catchy" bug becomes impossible.

**Calls 2a + 2b — Two Writers, in parallel.** Each writes the COMPLETE song in one pass (one voice, one context — the thing that makes plain ChatGPT coherent). Each gets:
- The songwriter system prompt, temperature ~0.8 (and every call in the pipeline now gets a system prompt and a sane temperature).
- The genre card rebuilt: **1-2 FULL exemplar sections** (verse + chorus in the target subgenre) instead of 3 loose lines, plus one worked example of "user story → finished section."
- The **banned lexicon** (~150 commodity items: neon, echoes, whispers, shadows, hollow, embrace, soar... plus banned metaphor categories) — in the prompt, not just a cleanup pass.
- **Form rules as numbers:** chorus 2-4 lines starting with the chosen hook line verbatim; verses 4-6 lines; 6-10 syllables per line; 150-250 words total; choruses written out in full every time; rhyme on 2nd/4th lines only, slant rhymes preferred, "drop the rhyme before you bend the meaning"; max 1 metaphor per section; show-don't-tell with the user's own concrete details.
- The **per-genre tag whitelist** (standard sections only — no [Build Up] outside EDM; no parentheticals unless the user asked for ad-libs).
- The user's story and the chosen hook. Nothing else. No instrumentation, no audio env.

**Code Checker — zero AI, zero cost.** Mechanically verifies each draft: tag whitelist, syllable ranges, word budget, banned-word scan, grammar lint, hook placed as chorus line 1, choruses verbatim-identical, parenthetical cap (max 3 per song), no leaked labels. A failing draft is **thrown away and redrafted once** with the failure reasons appended — never patched line-by-line.

**Call 3 — Selector.** A judge (different model than the writers) picks the better of the two passing drafts and says why. It is not allowed to rewrite anything. Selection over rewriting is the single best-evidenced change in this whole redesign.

**Suno style prompt — zero AI.** Built deterministically from guide + subgenre data + the user's sound chips: subgenre name, 4-7 descriptors, concrete instruments, vocal texture, BPM range, 3-4 mood words pointing the same way. The coin-flip heuristic dies. Neo-soul's Rhodes and 65-100 BPM now show up every single time. This — not the lyrics — is most of the neo-soul fix.

**UX contract:** no more bait-and-switch. Show honest progress states ("finding your hook... writing two drafts... picking the best"), then reveal the final song once. Same total latency as today or better: 4 focused calls replace up to 8 whole-song rewrites.

### (c) What we DELETE

- The entire tag orchestration system and its quota library (the [Build Up]/(Backing Vocals) machine) — including its calls in the edit and import paths.
- The compliance substring-check → whole-song-rewrite loop (it currently rewrites entire songs because an R&B lyric said "all night long").
- The legacy cliché-scrub rewrite pass and the ad-lib enforcement pass.
- The judge's rewrite powers (it becomes the Selector).
- The free-prose planner and the paste-plan-into-prompt function.
- Wizard steps: scene, performer, audio environment, instrumentation, emotion, duet-type, specifics — and the hidden scene-keyword trigger that flips songs explicit.
- Topic-category entries in every genre's cliché list ("Body/skin/touch imagery" etc.) — split into exact banned phrases vs. themes we merely note, and never feed themes to the judge.

### (d) The eval gate — no bad song reaches you again

Before this ships, and on every change after:

1. **A golden set of 20 briefs** — real user-style stories across our genres (including the exact neo-soul brief that failed).
2. **Hard checks run automatically on every output:** zero banned words, zero off-whitelist tags, zero parenthetical labels, syllable ranges met, hook in position, grammar clean. These are pass/fail unit tests. One red = doesn't ship.
3. **Blind taste test:** for each brief, the new pipeline vs. plain ChatGPT ("write me an R&B song about X") — the founder's own benchmark. Songs shown unlabeled, scored by 3 raters (can be you + two music-literate friends, or an LLM panel for daily runs with human spot-checks weekly). **Ship rule: we win or tie at least 60% of blind matchups, with zero hard-check failures.** Until then, we don't ship.
4. Re-run the golden set nightly so regressions get caught the day they're introduced, not by a customer.

---

## PART 4: RISKS & OPEN QUESTIONS

1. **Over-banning can sterilize.** Big banned lists can push the AI into strange word choices (the same failure our R&B "no touch imagery" rule caused). Mitigation: ban exact words/phrases only, never topics; watch the eval for stilted output; trim the list if drafts get weird.
2. **Empty story box.** Some users will type "a love song." Quality then falls back to average. Mitigation: the nudge microcopy, plus a one-question follow-up ("give me one real detail?") — worth an A/B test. This is the biggest open product question.
3. **Non-English songs.** The banned lexicon and syllable counter are English-first. We need per-language lists and a syllable strategy per language, or the checker must relax for non-English until we do.
4. **Suno changes under us.** Tag behavior differs across Suno versions; our whitelist needs a version note and periodic re-testing.
5. **Hook-pick step vs. founder's "fewer steps" instinct.** It adds one tap. Evidence says it's the highest-value tap in the product, and it's skippable. If eval shows auto-pick performs equally, make it invisible.
6. **Model choice.** The redesign is model-agnostic; the eval harness should A/B gpt-4.1 vs. a stronger writer model. Temperature tuning is proven noise — don't spend time there.
7. **Edit flow is only half-solved.** We removed the re-infection bug, but the best-evidenced edit interaction (tap a weak line, get 3 form-preserving alternatives, user picks — the LyricStudio pattern) is a v2 feature worth scoping. It's also our differentiation vs. plain ChatGPT.
8. **Two drafts = 2x draft cost.** Offset by deleting up to 8 rewrite calls and all dynamic-option calls; net cost and latency should drop. Verify in the eval harness.

---

---

# TECHNICAL APPENDIX (for the engineer)

All paths relative to `/Users/andrethomas/conductor/workspaces/suno-ai-songwriter/da-nang/`.

## A. Verified root causes (spot-checked against source this session)

| Failure | Root cause | Location |
|---|---|---|
| Plan leakage ("Catchy") | Free-prose plan template contains literal label `2. HOOK — the exact repeatable hook phrase...`; plan pasted verbatim after format instructions under "follow it" | `api/ai.ts:3346` (template), `3339-3356` (draftSongPlan), `3358-3360` (promptWithPlan) |
| "should of" survives | Plan authored by gpt-4.1-mini via `openAIResponses` (no temperature set → default 1.0, no system prompt); only validation is `plan.length < 1500`; judge PASS gate + rewrite constraints protect the hook | `api/ai.ts:2655-2678, 3352`; `lib/lyricJudge.ts:51-72` |
| (Backing Vocals)/[Build Up] | Live path `getMetaTagPackage` → `buildMetaTagPlan`; `inferGenreAccentTags` returns `"(Backing Vocals)"` for r&b/soul/gospel (147-149) and `["[Build Up]"]` as catch-all (153); minAdlibCount 6-8; scoring keeps most-tagged of 3 attempts; earlier fix patched only the dead fallback (`ai.ts:347-357`) | `lib/metaTagLibrary.ts:143-154, 182-193`; `api/ai.ts:2493-2629`; unconditional calls in `editSong` (3479) and `structureImportedSong` (3534) |
| Purple imagery / genre self-sabotage | Topic-category "cliché" `'Body/skin/touch imagery'` fed to both drafter and judge as weak-line criteria | `lib/guides/rnb.ts:114`; `api/ai.ts:3153`; `lib/lyricJudge.ts:27-28` |
| Subgenre never reaches draft | `resolveSubGenreGuide` merges only when `embodiedDelta` exists; no rnb subgenre has one; subgenre production data only reachable via `buildSunoPromptDriver` guide branch, skipped when `isNarrative` regex passes (~always) | `lib/guides/index.ts:134`; `lib/guides/rnb.ts:203-211`; `api/ai.ts:1749-1817, 1881-1883` |
| Rhyme-forced nonsense | All fix passes run through `openAIResponses` (temp 1.0, no system prompt) while constrained to preserve rhyme scheme + per-line syllables; `validateRewrite` only checks tag count ±2 and 0.6-1.6 length ratio | `api/ai.ts:2617, 3106, 3240, 3300, 1334`; `lib/lyricJudge.ts:69-70, 105-118` |
| Dead/hazardous inputs | `performerType` read nowhere in api/ai.ts; `scene` only feeds `detectRegisterHint` keyword bag → silent explicit flip | `api/ai.ts:1160-1178, 928-929`; `types.ts:46` |

## B. Target architecture

```
USER INPUTS: language, genre(+subgenre), story (free text),
             [optional chips: vocals, mood, explicit toggle]
        │
        ▼
CALL 1  HookSmith (writer model, temp 0.8, system prompt)
        → strict JSON: [{title, hook_line} x4]
        → code validation: 2-6 words, grammar lint ("should of"→"should've",
          contraction/agreement checks), banned-lexicon scan, no label tokens
        → user picks (or argmax)
        │
        ▼
CALLS 2a/2b  Writer x2 in parallel (temp ~0.8, songwriter system prompt,
             distinct persona seeds — NOT distinct temperatures; per
             Peeperkorn temp is noise)
        Prompt contents per call:
          • genre card v2: 1-2 FULL exemplar sections (verse+chorus, subgenre-
            specific) + 1 worked brief→section example  [replaces 3 loose lines
            in buildAuthenticityKitBlock, ai.ts:3123-3136]
          • banned lexicon (~150 exact words/phrases + metaphor categories)
          • numeric form spec: chorus 2-4 lines, hook verbatim as chorus line 1;
            verses 4-6 lines; 6-10 syll/line (hard cap 15); 150-250 words;
            choruses written out verbatim; rhyme 2nd/4th lines, slant preferred,
            meaning-over-rhyme; ≤1 figurative image per section; ≤3
            parentheticals/song and only if ad-libs requested
          • per-genre tag whitelist (standard set only; derive per-genre form
            from guide, e.g. R&B: Intro/Verse/Pre/Chorus/Bridge/Outro; [End]
            terminal)
          • user story verbatim + chosen hook
          • internal plan-then-write in ONE response; parser strips the plan
            block (zero cross-model leakage surface)
        │
        ▼
CODE CHECKER (deterministic, no LLM):
        tag-whitelist, tags-on-own-line, syllable counter (per-line + paired-
        section delta ≤1), word budget, banned-lexicon scan, grammar lint,
        hook-position check, chorus-identity check, parenthetical cap,
        label-leak regex ("HOOK", "TITLE:", etc.)
        FAIL → reject-and-redraft (same prompt + failure notes), max 1 retry.
        Never line-patch.
        │
        ▼
CALL 3  Selector (different model than writer; judge prompt rebuilt from
        lib/lyricJudge.ts): pick better draft + one-line rationale.
        SELECT ONLY — no rewrite path. (Checker/Judger pattern,
        arXiv 2410.01450; self-refinement bias, arXiv 2402.11436;
        Glazkov edit-loop regression.)
        │
        ▼
SUNO STYLE PROMPT: pure function of guide + subgenre productionNotes +
        sunoPromptKeywords + user chips. Delete enforceSunoPromptDriver's
        isNarrative branch (ai.ts:1871-1917) and the 40-70-word prose ask
        (3206). Format: subgenre, 4-7 descriptors, instruments, vocal texture,
        BPM/key, 3-4 aligned mood words, <950 chars, no brackets.
```

Every remaining LLM call gets the songwriter system prompt and explicit temperature (writers ~0.8; HookSmith 0.8; Selector 0.2). Fix `openAIResponses` (ai.ts:2655-2678) to require both parameters.

## C. Delete list (exact)

- `enforceMetaTagOrchestration` + metrics (ai.ts:2493-2629), `lib/metaTagLibrary.ts` entirely, calls in `editSong`/`structureImportedSong` (3479, 3534), `fallbackMetaTagPlan`/`getMetaTagPackage` (331-394)
- Compliance substring→rewrite loop: `checkGuideCompliance` cliché-substring dimension + `buildComplianceFixPrompt` + unvalidated replace (751-862, 3235-3243)
- Legacy scrub (1948-2036, 3273-3309), `enforceRequestedAdlibLanguage` (1310-1338)
- Judge rewrite path in `lib/lyricJudge.ts` (keep prompt skeleton for Selector; delete rewrite constraints 66-72 and `validateRewrite` 97-121)
- `draftSongPlan`/`promptWithPlan` (3339-3360) — replaced by HookSmith JSON + in-call planning
- Wizard steps scene/performer/audioEnv/instrumentation/emotion/duetType/specifics (App.tsx:85-96, 323-330, 430-433), `generateDynamicOptions` round-trips (3541+), `detectRegisterHint` scene inference (1160-1178) → explicit user toggle; dead `getTaxonomyGuardrailDirective` (1240-1248)
- Guide data migration: split every guide's `cliches` into `bannedPhrases: string[]` (exact-match only) and `overusedTerritory: string[]` (never fed to judge/checker); add subgenre card assembly from `subGenres[].lyricNotes/productionNotes` so subgenre selection is load-bearing without requiring `embodiedDelta` (lib/guides/index.ts:123-169)

The `FAST_TRACK` enum in types.ts:22 already anticipates the reduced input flow — build on it.

## D. Eval harness

- `evals/golden/` — 20 briefs (JSON: language, genre, subgenre, story, chips), including the failed neo-soul brief and one per shipped Authenticity Kit genre.
- Mechanical suite = the Code Checker run as unit tests over pipeline output; CI-blocking; nightly cron over the golden set.
- Blind A/B: pipeline output vs one-shot gpt-4.1 baseline ("write me a {genre} song about {story}"), randomized order, 3 raters (LLM panel daily — use a non-writer model family to avoid self-bias — human spot-check weekly). Ship gate: ≥60% win/tie AND zero mechanical failures.
- Track per-failure-mode counters (banned-word hits, off-whitelist tags, hook-position misses, syllable violations) to catch which prompt change regressed what.

## E. Evidence base (strongest citations per decision)

- Selection over rewriting: Glazkov 2024 (edit loops → more average); arXiv 2402.11436 (self-bias amplification); arXiv 2410.01450 (Checker/Judger, 68% listening-test win)
- Structured plans, never prose labels: Lyra (arXiv 2305.19228, +24% human-rated); PoeLM (arXiv 2205.12206); arXiv 2411.13100
- Code-side counting: arXiv 2411.13100 (79.8% LLM syllable error); fill-in-blank templates 80% vs 7-27% compliance (arXiv 2410.01450)
- Banned lexicon + GPT house style: Walsh et al. CHR 2024 (arXiv 2410.15299); r/SunoAI 1gsd4oo/1jhvaka; freesongwritingtools.com checker list
- Full-section exemplars: Kenyon one-shot study; ACL Findings 2025 (2025.findings-emnlp.532); arXiv 2406.15267
- Hook-first + form numbers: Nashville/Pattison/Murphy (title-first, ~7 title reps); r/SunoAI 1dwqexa (189 upvotes, 4-line sections); HookGenius/Jack Righteous (6-10 syll, 150-250 words, chorus 2-4 lines, first-line melodic weighting)
- Temperature is not a lever: Peeperkorn et al. ICCC 2024 (arXiv 2405.00492)
- Input minimalism: every surveyed competitor uses 1-3 inputs + free text (Suno: one box; TheseLyricsDoNotExist: 3; LyricStudio: genre+topic)