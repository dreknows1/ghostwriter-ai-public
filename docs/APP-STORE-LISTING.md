# SongGhost iOS — App Store Submission Text Package

Drafted 2026-07-11 for App Store Connect submission. Grounded in `docs/BRIEF.md`,
`docs/PLAN.md`, `docs/DESIGN.md`, `docs/AUDIT-IOS.md`. Bundle ID `com.songghost.app`
(confirmed in `capacitor.config.ts`). Content/copy only — nothing here is wired
into the app or ASC yet. Items needing Andre's decision are marked **[DECISION]**.

Voice: "Haunted Studio Noir" — friendly ghost/ghostwriter, séance-flavored
personality copy in marketing moments (promo text, What's New, description
close), but plain and benefit-first everywhere it needs to sell clearly. Working
copy (feature bullets) stays quiet per `DESIGN.md`'s own rule: "fun lives in
personality moments... never in the working surfaces."

**Trademark rule honored throughout:** "Suno" and "Udio" appear ONLY in the
Keywords field (§4) and in the private Review Notes to Apple (§10, not
customer-facing). They do not appear in Name, Subtitle, Promotional Text,
Description, or What's New.

---

## 1. App Name — limit 30 characters

| # | Option | Chars |
|---|--------|-------|
| **1 (recommended)** | **SongGhost: AI Songwriting** | **25/30** |
| 2 | SongGhost: Songwriting Studio | 29/30 |
| 3 | SongGhost: Lyric Generator AI | 29/30 |
| 4 | SongGhost: Lyrics & Prompts | 27/30 |
| 5 | SongGhost (brand-only) | 9/30 |

**Why #1:** leads with the brand, then the single highest-value non-trademarked
category phrase ("AI Songwriting"). Matches the brief's premium positioning —
"sound written, not prompted" — better than "Generator," which reads more
commodity/low-craft.

**[DECISION]** #1 vs #3 is a real trade-off: "Lyric Generator AI" is probably
the higher raw search-volume phrase (people type "ai lyric generator" a lot),
but it undersells the craft/curriculum angle that differentiates SongGhost from
ChatGPT-style tools per the brief. I led with the brand-forward option; swap to
#3 if Andre wants to optimize for search volume over positioning.

None of the options reference Suno or Udio.

---

## 2. Subtitle — limit 30 characters

| # | Option | Chars |
|---|--------|-------|
| **1 (recommended)** | **Lyrics & Prompts for AI Music** | **29/30** |
| 2 | AI Lyrics, Structured & Ready | 29/30 |
| 3 | Your Ghostwriter for AI Music | 29/30 |
| 4 | From Idea to Song-Ready Lyrics | 30/30 (zero margin) |

**Why #1:** names both deliverables (lyrics + style prompt) and the category
("AI music") without naming a specific competitor — captures generic search
intent ("lyrics for ai music") that trademarked terms can't touch in this field.

Note: #1 repeats "AI" from the recommended Name (#1 above). That's a minor,
acceptable redundancy — "AI Music" as a two-word phrase is worth it. If Andre
picks Name option #4 (no "AI" in the name), pairing with Subtitle #1 gives full,
non-redundant keyword coverage across the two fields.

Option #4 is flagged for zero character margin — safest to pick #1–#3 unless
Andre confirms #4's exact wording first.

---

## 3. Promotional Text — limit 170 characters

Editable anytime without a new build/review — good place for time-sensitive
hooks (e.g. a live offer code) later.

| # | Option | Chars |
|---|--------|-------|
| **1 (recommended)** | **Feed it an idea, get back studio-ready lyrics and a matching style prompt. Free 25 credits monthly. Try Pro free for 7 days — no séance required.** | **145/170** |
| 2 | Turn any idea into studio-ready lyrics and a matching style prompt — in minutes. Free 25 credits monthly. Try Pro free for 7 days. | 130/170 |
| 3 | Turn any idea into structured, studio-ready lyrics and a matching style prompt in minutes. Free 25 credits every month. Try Pro free for 7 days. | 144/170 |

**Why #1:** benefit-first (what you get), free-tier hook, trial CTA, and one
ghost-voice flourish at the close ("no séance required") — earns the brand
personality without burying the offer. 25 characters of headroom left for
future tweaks (e.g. swapping in `LYRICON30`-style offer-code language later,
by analogy to the Lyricon playbook).

---

## 4. Keywords — limit 100 characters, comma-separated, no spaces

**This is the ONLY field where "suno" and "udio" may appear.**

```
suno,udio,songwriter,lyricist,rhyme,verse,chorus,hook,rapper,hiphop,rnb,pop,afrobeat,trap,country
```

**97/100 characters.** 3 characters of headroom (intentionally left — no single
additional word fits cleanly; use the slack if Andre wants to swap one term).

Design notes:
- Does **not** repeat words already spent in Name/Subtitle ("AI," "lyrics,"
  "songwriting," "music," "prompts") — Apple indexes Name + Subtitle +
  Keywords together, so repeating a word here wastes budget that could hold a
  new term.
- `suno,udio` lead the string — highest-intent search traffic ("suno lyrics,"
  "udio prompts") and the entire reason this field exists in the ASO playbook.
- Genre terms (`hiphop,rnb,pop,afrobeat,trap,country`) map to the "genre
  curriculum spanning dozens of styles" claim in the description — keep these
  honest to whatever the curriculum actually covers at launch.
- `songwriter` and `lyricist` are distinct word-forms from "songwriting" /
  "lyrics" in the Name/Subtitle — kept deliberately for broader match coverage
  rather than dropped as duplicates.

**[DECISION]** If Andre's ASO priorities differ (e.g., he'd rather spend the
budget on `freestyle`, `melody`, `cowrite`, or a specific underrepresented
genre like `kpop` or `emo`), swap into the 3-char buffer or trade out
`country` (lowest-priority term in the current list) — 7 characters freed.

---

## 5. Description — limit 4000 characters (1,962/4000 used)

```
Every hobbyist musician knows the feeling: a great idea for a song, then a
blank page — or lyrics that sound like every other AI-generated song.
SongGhost is the songwriting studio that turns your idea into structured,
professional lyrics (verse, chorus, bridge, all mapped out) plus a matching
style prompt, ready to paste straight into your favorite AI music generator.

Tell SongGhost your idea, a feeling, a genre, a memory — whatever you've got.
Use Quick Create for a finished song in under a minute, or open the full
guided Studio to shape every choice yourself: genre, mood, story, voice,
instrumentation. Behind it all is a genre curriculum built for real
songwriting craft, not generic prompt-completion, so what comes back sounds
written, not autocompleted.

Every song lands in your personal library, ready to revisit, edit, or send to
your music app of choice with one tap. Sign in with Apple or email, start with
25 free credits every month, and top up with SongGhost Pro (7-day free trial)
or a one-time credit pack whenever inspiration outpaces your balance.

SongGhost is a companion for songwriters, not a black box. You bring the idea.
The ghost helps you write it right.

FEATURES
• Quick Create — idea in, complete song out, in under a minute
• Full guided Studio wizard for total control over genre, mood, story, voice,
  and instrumentation
• A genre curriculum spanning dozens of styles, from pop to hip-hop to
  afrobeat
• Section-tagged lyrics ([VERSE], [CHORUS], [BRIDGE]) so structure is never a
  guessing game
• A matching style prompt generated with every song, ready for your AI music
  app
• Personal song library — save, revisit, and edit anytime
• One-tap copy and share into any app
• Sign in with Apple or email
• Free to start: 25 credits every month, no credit card required
• SongGhost Pro: more monthly credits, priority generation, and new genre
  packs — try free for 7 days
• Credit packs for one-time top-ups, starting at $4.99
```

**[DECISION]** The description hard-codes "$4.99" and "25 credits" and "7-day
free trial." These are accurate per the brief today, but a Description edit
(unlike Promotional Text) ships with a new version's metadata, not instantly —
if pricing/credit amounts change, this needs updating in the same submission
cycle. Confirm these numbers are final before submitting.

No mention of Suno/Udio anywhere in this visible text — "your favorite AI
music generator" / "your music app of choice" carry the meaning without the
trademark.

---

## 6. What's New (v1.0) — Apple limit 4000 characters (438/4000 used)

```
SongGhost has landed on iPhone.

Turn any idea into structured, ready-to-produce lyrics and a matching style
prompt, right from your pocket. This first release includes:

• Quick Create and the full guided Studio wizard
• Your personal song library
• Sign in with Apple
• Free 25 credits every month, plus SongGhost Pro with a 7-day free trial

Thanks for being here for the first séance — more genres and features are
already on the way.
```

---

## 7. Category and Age Rating

### Category
- **Primary: Music.** This is where the target user already lives (Suno,
  GarageBand, Spotify) and matches the app's actual subject.
- **Secondary (recommended): Productivity.** SongGhost is functionally a
  structured-creation tool with a guided wizard and a saved-content library —
  fits the Productivity chart better than Entertainment, which is dominated by
  games/streaming and less aligned with real search intent.
- **[DECISION]** Alt secondary: Entertainment, if Andre wants presence in a
  more casual/browsing chart instead. My recommendation is Productivity.

### Age rating
Apple's age-rating system (current as of 2026) uses tiers **4+, 9+, 13+, 16+,
18+** — the older 12+/17+ labels are retired. Rating is set by a content
questionnaire, not chosen directly.

**The relevant questions for SongGhost, and why:**
- **Profanity or Crude Humor / Mature or Suggestive Themes / Alcohol, Tobacco,
  or Drug Use or References** — SongGhost generates lyrics from open-ended
  user prompts ("story," "theme," free text). Apple's current guidance is
  explicit that AI-assisted/generative features must be rated on their
  **realistic worst-case output**, not typical use — i.e., if a user *can*
  prompt for profane or mature lyrical content and the app doesn't block it,
  answer these questions as if it happens, not as "never." Nothing in the
  codebase (per `AUDIT-IOS.md`) indicates a profanity/content filter on
  generated lyrics.
  - **[DECISION]** Recommend answering **Infrequent/Mild** on these three
    unless a content filter exists or is added before submission, which
    likely lands the app at **13+**. If Andre adds output moderation, 9+
    becomes defensible — but that's a product decision, not a copy decision,
    and should be made (and tested) before the rating questionnaire is filled
    out, not guessed at.
- **Horror/Fear Themes** — recommend **None**. The ghost brand and "Haunted
  Studio Noir" dark UI are a visual/tonal choice (candlelit, whimsical), not
  horror content. Low risk, but worth a sanity-check against the actual
  screenshots/app icon before submitting, since reviewers do eyeball tone.
- **User-Generated Content** — SongGhost has no public feed or
  cross-user sharing; songs are private to each account, and "sharing" means
  the native OS share sheet to *other* apps. Recommend answering this
  questionnaire branch based on that reality (no in-app UGC surface between
  users) and saying so plainly in the Review Notes (§10) to preempt questions.

**[DECISION — needs verification, not just a copy call]** `AUDIT-IOS.md`
lists `AskAndreWidget.tsx (AI chat)` as an existing web feature, but neither
`BRIEF.md`'s v1 IN/OUT scope nor `PLAN.md`'s "strip on native" list mentions
it explicitly. Confirm whether this AI chat widget ships in the iOS v1 build:
if yes, it affects both the age-rating questionnaire (AI chat/assistant
content) and the Review Notes explanation; if it's staying web-only like the
other stripped features (BYO-key modal, referral hub), no action needed here.

---

## 8. App Privacy ("Nutrition Label")

Apple's label requires: what's **collected**, whether it's **linked to
identity**, and whether it's **used to track you** (per Apple's ATT
definition — combined with third-party data for ads/data-broker purposes).
Per the objective: **no tracking, no third-party ad SDKs** — confirmed
consistent with `package.json` (no AdMob/Meta-Ads/analytics-for-ads SDK in
dependencies).

| Apple category | Data type | Collected? | Linked to identity? | Used to track you? |
|---|---|---|---|---|
| Contact Info | Email Address | Yes (account/login) | Yes | No |
| Contact Info | Name | **No** — session object is `{user:{id,email}}` only (`AUDIT-IOS.md` §2); no name field in the auth model | — | — |
| User Content | Other User Content (song ideas, story input, generated lyrics + style prompts) | Yes (stored in `savedSongs`) | Yes | No |
| Purchases | Purchase History | Yes (subscription + credit-pack transactions) | Yes | No |
| Identifiers | User ID | Yes (account id / email-as-identity) | Yes | No |
| Financial Info | Payment Info (card numbers, etc.) | **No** — StoreKit/Apple handles payment credentials directly; SongGhost never sees them | — | — |
| Location | — | No | — | — |
| Contacts | — | No | — | — |
| Browsing/Search History | — | No | — | — |
| Sensitive Info | — | No (free-text song content the user chooses to write is not the same as the app collecting structured sensitive-info fields) | — | — |
| Usage Data / Diagnostics | Crash Data / Performance Data | Not evident — no analytics/crash SDK in current dependencies | — | — |

**[DECISION — two nuances worth Andre's attention, not just boilerplate]**
1. **AI processors are sub-processors, not "tracking."** Story ideas and
   prompts are sent server-side to OpenAI/Anthropic/Gemini (per
   `AUDIT-IOS.md` §4: "AI is server-only") to generate the output. Under
   Apple's framework, sending data to a service provider to fulfill the
   feature itself (not for ads/data-broker use) is **not** "tracking" and
   doesn't require an ATT prompt — but it should still be reflected as "User
   Content collected, linked to identity" in the label (already is, above),
   and the privacy policy text (§9) should name these processors so the
   policy and the label agree.
2. **RevenueCat's own SDK may collect data beyond what SongGhost explicitly
   sends it** (device/purchase identifiers for its own fraud-prevention and
   receipt-validation purposes). Apple attributes third-party SDK behavior to
   the app's privacy label. Before submitting, check RevenueCat's current
   privacy/data-collection disclosure and fold anything relevant into the
   label — don't assume RevenueCat's collection is zero just because
   SongGhost's own code doesn't request it.

---

## 9. URLs (placeholders — confirm live before submission)

| Field | URL |
|---|---|
| Marketing URL | `https://www.songghost.com` |
| Support URL | `https://www.songghost.com/support` |
| Privacy Policy URL | `https://www.songghost.com/privacy` |
| Terms of Use (EULA) | `https://www.songghost.com/terms` |

**[DECISION]** `AUDIT-IOS.md` confirms a `TermsAndPrivacy.tsx` component and a
`UtilityHub.tsx` with help/support entries exist in-app, but I did not verify
the actual public URL paths (e.g., support might live at `/help` rather than
`/support`). Confirm the real, live paths before entering them in App Store
Connect — Apple requires the Support URL specifically to be a working page
with an actual contact method, not just the marketing homepage. Also confirm
the privacy policy text on that page enumerates the AI sub-processors and
RevenueCat per §8 above — reviewers do occasionally cross-check the policy
against the nutrition label.

---

## 10. Review Notes for Apple

Private to App Review — **not** customer-facing, so the trademark restriction
on "Suno"/"Udio" does not apply here. Naming them explicitly is the fastest
way to help a reviewer understand what the app does and why it doesn't
generate audio itself.

```
SongGhost is a songwriting companion tool, not a music-generation app. It
turns a user's idea into structured lyrics (verse/chorus/bridge) plus a
matching text style-prompt. Users copy or share that output into a separate,
third-party AI music generation app of their choice (e.g. Suno or Udio) to
actually produce a song — SongGhost does not generate, host, or play audio.

ACCOUNT: Sign in with Apple is available alongside email/password. A demo
account is provided below with credits pre-loaded so the full create flow
(Quick Create and the guided Studio wizard) can be tested without hitting a
paywall immediately.

Demo account: [EMAIL] / [PASSWORD] — TO BE CREATED BY ANDRE BEFORE SUBMISSION.
Please pre-load this account with enough credits to generate several songs
during review, or grant it Pro-tier entitlements directly, so the reviewer
can also see the Pro-gated experience without needing to complete a real
purchase.

CREDITS & IN-APP PURCHASE MODEL: SongGhost uses a consumable-credit economy,
not a hard feature paywall. Every account gets 25 free credits monthly at no
cost (no card required). Generating a song costs credits; when a user runs
out, they're offered either SongGhost Pro (auto-renewing subscription,
$24.99/month, 7-day free trial) or a one-time consumable credit pack
(starting at $4.99). All purchases are processed via StoreKit/RevenueCat —
no external payment links or web-pricing references appear anywhere in this
build. A Restore Purchases control is available on the paywall screen.

ACCOUNT DELETION: available in-app under Profile — fully self-service, no
support request required.

This build contains no references to web-only pricing or community/Skool
discount pricing (guideline 3.1.1) — those purchase paths are web-only and
intentionally excluded from the iOS build.
```

**[DECISION]** The demo account itself does not exist yet — Andre needs to
create it (or designate an existing test account) and pre-load it with
credits/Pro entitlements, then fill in the `[EMAIL]` / `[PASSWORD]`
placeholders above before this goes into App Store Connect.

---

## Summary of open decisions for Andre

1. Name: brand-forward ("AI Songwriting") vs. search-volume-forward ("Lyric
   Generator AI") — led with brand-forward.
2. Keywords: 3-char buffer unused + `country` is the lowest-priority term if a
   swap is wanted.
3. Description hard-codes $4.99 / 25 credits / 7-day trial — confirm final
   before submission; changing later requires a metadata update.
4. Category secondary: Productivity (recommended) vs. Entertainment.
5. Age rating: recommend 13+ (Infrequent/Mild profanity/mature-themes/
   substance-reference answers) unless a lyric content filter exists —
   confirm whether one does, since that changes the honest answer, not just
   the label.
6. Verify whether `AskAndreWidget` (AI chat) ships in iOS v1 — affects age
   rating and review notes.
7. Confirm real Support/Privacy/Terms URLs (paths, not just domain) and that
   the privacy policy text lists AI sub-processors + RevenueCat.
8. RevenueCat's own SDK data collection — check their current disclosure
   before finalizing the privacy label.
9. Demo account for reviewers does not exist yet — must be created and
   credentials dropped into §10 before submission.
