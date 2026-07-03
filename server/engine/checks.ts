// Step 6 of SONGWRITING_ENGINE_PLAN.md — code checks, no AI.
// Everything in this file is pure and deterministic: no LLM calls, no clock,
// no randomness, no I/O. runChecks() grades a finished draft against the
// story, hook, and musical spec; trimIsDeleteOnly() enforces the Step-5 rule
// that a trim pass may only DELETE lines — never rewrite or add.

import type { CheckResult, DraftReport, MusicalSpec, RoomCard } from "./types";

// ---------------------------------------------------------------------------
// Tokenizing
// ---------------------------------------------------------------------------

/** Lowercase word tokens; apostrophes collapse ("don't" → "dont"). */
function tokenize(text: string): string[] {
  const matches = text.toLowerCase().match(/[a-z']+/g);
  if (!matches) return [];
  const words: string[] = [];
  for (const raw of matches) {
    const word = raw.replace(/'/g, "");
    if (word.length > 0) words.push(word);
  }
  return words;
}

function distinctTokens(text: string): Set<string> {
  return new Set(tokenize(text));
}

/** |A ∩ B| / max(|A|, |B|) — 1 when both sets are empty. */
function overlapRatio(a: Set<string>, b: Set<string>): number {
  const larger = Math.max(a.size, b.size);
  if (larger === 0) return 1;
  let shared = 0;
  for (const token of a) if (b.has(token)) shared++;
  return shared / larger;
}

// ---------------------------------------------------------------------------
// Syllable estimation
// ---------------------------------------------------------------------------

/**
 * Heuristic English syllable counter: vowel groups, silent final -e,
 * y-as-vowel (except word-initially), silent "-ed"/"-es" suffixes,
 * syllabic "-le" ("table").
 *
 * Error bars (measured informally on plain lyric vocabulary): exact on
 * roughly nine words in ten, within ±1 on almost all the rest. Known misses:
 * - vowel-hiatus words ("poetry", "create", "quiet") under-count by 1
 *   because adjacent vowels merge into one group;
 * - "-ious"/"-eous" endings ("curious") under-count by 1;
 * - syllabic-y clusters ("everything") can over-count by 1;
 * - r-colored words ("fire", "hour") count 1 where singers often stretch to 2.
 * The checks consume per-LINE totals, so single-word misses mostly wash out.
 */
export function estimateSyllables(line: string): number {
  let total = 0;
  for (const word of tokenize(line)) total += syllablesInWord(word);
  return total;
}

function syllablesInWord(raw: string): number {
  const cleaned = raw.toLowerCase().replace(/[^a-z]/g, "");
  if (cleaned.length === 0) return 0;
  if (cleaned.length <= 3) return 1;
  let w = cleaned;
  if (/[^aeiouytd]ed$/.test(w)) {
    w = w.slice(0, -2); // silent past-tense "-ed" ("walked"); kept after t/d ("wanted")
  } else if (/[^aeiouysxz]es$/.test(w) && !/[cs]hes$/.test(w)) {
    w = w.slice(0, -2); // silent plural "-es" ("notes"); kept after sibilants ("wishes")
  } else if (/[^aeiouy]e$/.test(w) && !/[^aeiouy]le$/.test(w)) {
    w = w.slice(0, -1); // silent final e ("time"); kept in syllabic "-le" ("table")
  }
  const groups = w.replace(/^y/, "").match(/[aeiouy]+/g);
  return Math.max(1, groups ? groups.length : 0);
}

// ---------------------------------------------------------------------------
// Draft parsing (the app's song format: Title / ### SUNO Prompt / ### Lyrics)
// ---------------------------------------------------------------------------

type Section = { tag: string; lines: string[] };

type ParsedDraft = {
  title: string | null;
  sunoPrompt: string | null;
  lyricsBody: string | null;
  /** [Verse]/[Chorus]/... blocks, tags lowercased without brackets */
  sections: Section[];
  /** every non-empty, non-tag line of the lyrics body, in order */
  lyricLines: string[];
};

const TAG_LINE = /^\s*\[([^\]]+)\]/;

function parseDraft(draft: string): ParsedDraft {
  const lines = draft.split(/\r?\n/);
  let title: string | null = null;
  let sunoStart = -1;
  let lyricsStart = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (title === null) {
      const m = line.match(/^title\s*:\s*(.*)$/i);
      if (m && m[1].trim().length > 0) title = m[1].trim();
    }
    if (sunoStart === -1 && /^###\s*suno\s+prompt\s*$/i.test(line)) sunoStart = i;
    if (lyricsStart === -1 && /^###\s*lyrics\s*$/i.test(line)) lyricsStart = i;
  }

  let sunoPrompt: string | null = null;
  if (sunoStart !== -1) {
    const collected: string[] = [];
    for (let i = sunoStart + 1; i < lines.length; i++) {
      if (lines[i].trim().startsWith("###")) break;
      collected.push(lines[i]);
    }
    sunoPrompt = collected.join("\n").trim();
  }

  let lyricsBody: string | null = null;
  const sections: Section[] = [];
  const lyricLines: string[] = [];
  if (lyricsStart !== -1) {
    const bodyLines = lines.slice(lyricsStart + 1);
    lyricsBody = bodyLines.join("\n");
    let current: Section | null = null;
    for (const rawLine of bodyLines) {
      const line = rawLine.trim();
      if (line.length === 0) continue;
      const tag = line.match(TAG_LINE);
      if (tag) {
        current = { tag: tag[1].trim().toLowerCase(), lines: [] };
        sections.push(current);
        continue;
      }
      lyricLines.push(line);
      if (current) current.lines.push(line);
    }
  }

  return { title, sunoPrompt, lyricsBody, sections, lyricLines };
}

// ---------------------------------------------------------------------------
// Word lists
// ---------------------------------------------------------------------------

/** Function words excluded when comparing hook/title content words. */
const FUNCTION_WORDS = new Set([
  "a", "am", "an", "and", "are", "as", "at", "be", "been", "being", "but",
  "by", "did", "do", "does", "dont", "for", "from", "he", "her", "hers",
  "him", "his", "how", "i", "if", "im", "in", "is", "it", "its", "me",
  "mine", "my", "na", "no", "nor", "not", "of", "off", "oh", "on", "ooh",
  "or", "our", "ours", "out", "over", "she", "so", "than", "that", "the",
  "their", "them", "then", "these", "they", "this", "those", "to", "under",
  "up", "us", "was", "we", "were", "what", "when", "where", "who", "whom",
  "why", "with", "yeah", "yet", "you", "your", "yours",
]);

/** Function-ish words longer than 4 chars, dropped from story-fidelity tokens. */
const STORY_STOPWORDS = new Set([
  "about", "above", "after", "again", "against", "almost", "along",
  "already", "although", "always", "among", "another", "anybody",
  "anything", "anyway", "around", "because", "become", "before", "behind",
  "being", "below", "beneath", "beside", "besides", "between", "beyond",
  "cannot", "could", "couldnt", "didnt", "doesnt", "doing", "during",
  "either", "enough", "every", "everybody", "everyone", "everything",
  "getting", "going", "gonna", "gotta", "having", "herself", "himself",
  "itself", "maybe", "might", "myself", "neither", "never", "nobody",
  "nothing", "often", "other", "others", "ought", "ourselves", "quite",
  "rather", "really", "shall", "should", "shouldnt", "since", "somebody",
  "someone", "something", "sometimes", "still", "their", "theirs",
  "themselves", "there", "theres", "these", "theyll", "theyre", "thing",
  "things", "those", "though", "through", "throughout", "toward",
  "towards", "under", "underneath", "until", "wanna", "wasnt", "werent",
  "whatever", "whenever", "where", "whether", "which", "while", "whose",
  "within", "without", "would", "wouldnt", "youll", "youre", "yourself",
  "yourselves",
]);

/** Words so common in songs they prove nothing about story fidelity. */
const GENERIC_SONG_WORDS = new Set([
  "love", "loves", "loved", "loving", "heart", "hearts", "night", "nights",
  "tonight", "time", "times", "feel", "feels", "feeling", "feelings",
  "felt", "baby", "world", "dream", "dreams", "dreaming", "forever",
  "alone", "light", "lights", "shine", "shining", "fire", "rain", "tears",
  "eyes", "soul", "souls", "music", "dance", "dancing", "song", "songs",
  "smile", "touch",
]);

/** Planner/JSON artifacts that must never leak into lyrics (lowercased). */
const LEAK_TOKENS = [
  "coreemotion", "worddensity", "writingdials", "roomid", "step 1", "the brief",
];

function contentWords(text: string): string[] {
  const seen = new Set<string>();
  for (const word of tokenize(text)) {
    if (!FUNCTION_WORDS.has(word)) seen.add(word);
  }
  return [...seen];
}

function distinctiveStoryTokens(story: string): string[] {
  const seen = new Set<string>();
  for (const word of tokenize(story)) {
    if (word.length <= 4) continue;
    if (STORY_STOPWORDS.has(word) || GENERIC_SONG_WORDS.has(word)) continue;
    seen.add(word);
  }
  return [...seen];
}

/**
 * Rhyme key: the last word's final vowel group plus everything after it
 * (silent final e dropped first, so "gone" keys on "on" rather than "e").
 * A crude stand-in for "last stressed vowel + following letters".
 */
function rhymeKey(line: string): string | null {
  const wordsInLine = tokenize(line);
  if (wordsInLine.length === 0) return null;
  let last = wordsInLine[wordsInLine.length - 1];
  if (last.length > 3 && /[^aeiouy]e$/.test(last) && !/[^aeiouy]le$/.test(last)) {
    last = last.slice(0, -1);
  }
  const m = last.match(/[aeiouy]+[^aeiouy]*$/);
  return m ? m[0] : null;
}

// ---------------------------------------------------------------------------
// The checks
// ---------------------------------------------------------------------------

export function runChecks(
  draft: string,
  opts: {
    story: string;
    card: RoomCard;
    spec: MusicalSpec;
    hook: string;
    /** the brief's ONE ordinary physical image — must appear at least twice in the lyrics */
    centralImage?: string;
    /** the founder's house-style ban list (compiled from BRAIN Layer 3) — any hit fails */
    bannedPhrases?: string[];
    /** the valid Suno tag list (BRAIN Layer 6) — bracket tags outside this set are flagged */
    validTags?: string[];
    /** this room's adlib floor (Layer 6) — a real song needs at least this many adlibs */
    minAdlibs?: number;
    /** true when the user locked a title: hook-placement is then a hard fail (their title
     * must be sung); when the engine auto-picked the hook it's advisory (chorus-consistency
     * already guarantees a real repeated chorus) */
    hookLocked?: boolean;
  },
): DraftReport {
  // NOTE: opts.card is part of the stable call contract. The plan (§2 Step 6)
  // eventually lets a room's dials switch individual checks on/off; Phase 1
  // runs the full fixed set for every room.
  const parsed = parseDraft(draft);
  const body = parsed.lyricsBody ?? "";
  const checks: CheckResult[] = [];

  // format (fail): Title, both ### sections, [Verse]+[Chorus], SUNO 25-120 words
  {
    const problems: string[] = [];
    if (!parsed.title) problems.push("missing or empty Title line");
    if (parsed.sunoPrompt === null) {
      problems.push('missing "### SUNO Prompt" section');
    } else {
      const promptWords = parsed.sunoPrompt.split(/\s+/).filter((w) => w.length > 0).length;
      if (promptWords < 25 || promptWords > 120) {
        problems.push(`SUNO prompt is ${promptWords} words (need 25-120)`);
      }
    }
    if (parsed.lyricsBody === null) {
      problems.push('missing "### Lyrics" section');
    } else {
      if (!parsed.sections.some((s) => s.tag.startsWith("verse"))) problems.push("no [Verse] tag in lyrics");
      if (!parsed.sections.some((s) => s.tag.startsWith("chorus"))) problems.push("no [Chorus] tag in lyrics");
    }
    checks.push({
      id: "format",
      severity: "fail",
      ok: problems.length === 0,
      detail: problems.length > 0 ? problems.join("; ") : undefined,
    });
  }

  // leaked-labels (fail): planner/JSON artifacts must never reach the lyrics
  {
    const lowered = body.toLowerCase();
    const leaks: string[] = [];
    for (const token of LEAK_TOKENS) {
      if (lowered.includes(token)) leaks.push(`"${token}"`);
    }
    if (body.includes("GENERATION_DECLINED")) leaks.push("GENERATION_DECLINED");
    if (/\{[\s\S]{18,}?\}/.test(body)) leaks.push("curly-brace block");
    if (body.split(/\r?\n/).some((line) => line.trim().startsWith("#"))) {
      leaks.push("markdown header in lyrics");
    }
    checks.push({
      id: "leaked-labels",
      severity: "fail",
      ok: leaks.length === 0,
      detail: leaks.length > 0 ? `leaked: ${leaks.join(", ")}` : undefined,
    });
  }

  // story-fidelity (fail): >=2 distinctive story tokens must reach the lyrics
  {
    const storyTokens = distinctiveStoryTokens(opts.story);
    if (storyTokens.length < 2) {
      checks.push({ id: "story-fidelity", severity: "fail", ok: true, detail: "story too short to verify" });
    } else {
      const lyricStems = new Set(tokenize(body).map((w) => w.slice(0, 5)));
      const matched = storyTokens.filter((t) => lyricStems.has(t.slice(0, 5)));
      checks.push({
        id: "story-fidelity",
        severity: "fail",
        ok: matched.length >= 2,
        detail:
          matched.length >= 2
            ? `story tokens in lyrics: ${matched.slice(0, 6).join(", ")}`
            : `only ${matched.length} of ${storyTokens.length} distinctive story tokens reached the lyrics`,
      });
    }
  }

  // hook-placement (fail): >=60% of hook content words appear in a hook-bearing section.
  // The hook lives in whatever the room calls its anthem — [Chorus], [Hook], [Refrain],
  // or [Post-Chorus] (90s R&B labels it [Hook]) — so check the union of all of them.
  {
    // The song's OWN title is the hook that must live in its chorus — the writer may
    // sharpen an auto-suggested hook while writing, and the title follows that choice.
    // Strict only when the user locked a title; advisory when the engine auto-picked the
    // hook (chorus-consistency already guarantees a real repeated chorus).
    const hookSeverity: "fail" | "warn" = opts.hookLocked === false ? "warn" : "fail";
    const hookText = parsed.title && contentWords(parsed.title).length > 0 ? parsed.title : opts.hook;
    const hookContent = contentWords(hookText);
    const hookBearing = parsed.sections.filter((s) => /^(chorus|hook|refrain|post-?chorus|vamp)/.test(s.tag));
    if (hookBearing.length === 0) {
      checks.push({ id: "hook-placement", severity: hookSeverity, ok: false, detail: "no [Chorus]/[Hook] block to place the hook in" });
    } else if (hookContent.length === 0) {
      checks.push({ id: "hook-placement", severity: hookSeverity, ok: true, detail: "hook has no content words to place" });
    } else {
      const chorusTokens = distinctTokens(hookBearing.map((s) => s.lines.join("\n")).join("\n"));
      const found = hookContent.filter((w) => chorusTokens.has(w));
      checks.push({
        id: "hook-placement",
        severity: hookSeverity,
        ok: found.length / hookContent.length >= 0.6,
        detail: `${found.length}/${hookContent.length} hook words in the chorus/hook`,
      });
    }
  }

  // title-hook (warn): title shares at least one content word with the hook
  {
    const hookContent = new Set(contentWords(opts.hook));
    const shared = contentWords(parsed.title ?? "").filter((w) => hookContent.has(w));
    checks.push({
      id: "title-hook",
      severity: "warn",
      ok: shared.length >= 1,
      detail: shared.length > 0 ? `shared: ${shared.join(", ")}` : "title shares no content word with the hook",
    });
  }

  // chorus-consistency (fail): the chorus is recognizably the same each time. Adlibs are
  // stripped first (they're ornaments), and a vamp is allowed to embellish so long as it
  // still loops the hook — a room like Quiet Storm ends on exactly that kind of vamp.
  {
    const stripAdlibs = (s: string) => s.replace(/\([^)]*\)/g, " ");
    const chorusSections = parsed.sections.filter((s) => /^(chorus|hook|refrain|post-?chorus|vamp)/.test(s.tag));
    const hookWords = contentWords(parsed.title || opts.hook);
    const hasHook = (tokens: Set<string>) =>
      hookWords.length > 0 && hookWords.filter((w) => tokens.has(w)).length / hookWords.length >= 0.6;
    if (chorusSections.length < 2) {
      checks.push({ id: "chorus-consistency", severity: "fail", ok: true, detail: "fewer than two chorus blocks" });
    } else {
      const tokenSets = chorusSections.map((s) => distinctTokens(stripAdlibs(s.lines.join("\n"))));
      const ref = tokenSets[0];
      // each later chorus must either closely match the first OR still carry the hook (a vamp)
      const drifters = tokenSets.slice(1).filter((t) => overlapRatio(ref, t) < 0.6 && !hasHook(t));
      checks.push({
        id: "chorus-consistency",
        severity: "fail",
        ok: drifters.length === 0,
        detail: drifters.length ? `${drifters.length} chorus/vamp block(s) neither match the first nor carry the hook` : "choruses consistent (vamps carry the hook)",
      });
    }
  }

  // metric-parallel (warn): syllable spread within each chorus <=3
  {
    const offenders: string[] = [];
    for (const section of parsed.sections) {
      if (!section.tag.startsWith("chorus") || section.lines.length < 2) continue;
      const counts = section.lines.map(estimateSyllables);
      const spread = Math.max(...counts) - Math.min(...counts);
      if (spread > 3) offenders.push(`[${section.tag}] syllable spread ${spread} (max 3)`);
    }
    checks.push({
      id: "metric-parallel",
      severity: "warn",
      ok: offenders.length === 0,
      detail: offenders.length > 0 ? offenders.join("; ") : undefined,
    });
  }

  // nursery-rhyme (warn): 6+ consecutive lines, near-equal syllables, AABB endings
  {
    const counts = parsed.lyricLines.map(estimateSyllables);
    const keys = parsed.lyricLines.map(rhymeKey);
    let flaggedAt = -1;
    for (let i = 0; i + 6 <= parsed.lyricLines.length && flaggedAt === -1; i++) {
      const window = counts.slice(i, i + 6);
      if (Math.max(...window) - Math.min(...window) > 1) continue;
      let rhymed = true;
      for (let p = 0; p < 6 && rhymed; p += 2) {
        const a = keys[i + p];
        const b = keys[i + p + 1];
        rhymed = a !== null && b !== null && a === b;
      }
      if (rhymed) flaggedAt = i;
    }
    checks.push({
      id: "nursery-rhyme",
      severity: "warn",
      ok: flaggedAt === -1,
      detail: flaggedAt === -1 ? undefined : `sing-song wall starting at lyric line ${flaggedAt + 1}`,
    });
  }

  // word-density (warn): average words-per-line inside the spec's band
  {
    const densityText = opts.spec.wordDensity.toLowerCase();
    let band: [number, number] | null = null;
    if (densityText.includes("low")) band = [3, 7];
    else if (densityText.includes("moderate")) band = [5, 10];
    else if (densityText.includes("high") || densityText.includes("dense")) band = [8, 14];
    if (band === null || parsed.lyricLines.length === 0) {
      checks.push({
        id: "word-density",
        severity: "warn",
        ok: true,
        detail: band === null ? "no recognized density band in spec" : "no lyric lines to measure",
      });
    } else {
      const totalWords = parsed.lyricLines.reduce((sum, line) => sum + tokenize(line).length, 0);
      const avg = totalWords / parsed.lyricLines.length;
      checks.push({
        id: "word-density",
        severity: "warn",
        ok: avg >= band[0] && avg <= band[1],
        detail: `avg ${avg.toFixed(1)} words/line vs band ${band[0]}-${band[1]}`,
      });
    }
  }

  // verse-advance (warn): verse 2 is never verse 1 reworded
  {
    const verses = parsed.sections.filter((s) => s.tag.startsWith("verse"));
    if (verses.length < 2) {
      checks.push({ id: "verse-advance", severity: "warn", ok: true, detail: "fewer than two verse blocks" });
    } else {
      const v1 = distinctTokens(verses[0].lines.join("\n"));
      const v2 = distinctTokens(verses[1].lines.join("\n"));
      let shared = 0;
      for (const token of v2) if (v1.has(token)) shared++;
      const share = v2.size === 0 ? 1 : shared / v2.size;
      checks.push({
        id: "verse-advance",
        severity: "warn",
        ok: share < 0.6,
        detail: `${Math.round(share * 100)}% of verse-2 tokens already in verse 1`,
      });
    }
  }

  // banned-phrases (fail): the founder's house-style ban list (BRAIN Layer 3).
  // These are the AI's default lines — they belong to no one's story.
  {
    const banned = opts.bannedPhrases || [];
    if (banned.length > 0) {
      const lower = body.toLowerCase();
      const hits = banned.filter((p) => lower.includes(p));
      checks.push({
        id: "banned-phrases",
        severity: "fail",
        ok: hits.length === 0,
        detail: hits.length ? `house-style phrases found: ${hits.join("; ")}` : "clean",
      });
    }
  }

  // central-image (fail): the brief's ONE ordinary physical image must actually live
  // in the song — its key words appearing at least twice. Anti-greeting-card rule:
  // a song with no concrete anchor is a song anyone could have received.
  {
    const image = String(opts.centralImage || "").trim();
    if (image) {
      const keyWords = distinctTokens(image);
      let appearances = 0;
      const lowerLines = (parsed.lyricLines || []).map((l) => l.toLowerCase());
      for (const line of lowerLines) {
        for (const w of keyWords) {
          if (w.length > 3 && line.includes(w.slice(0, 5))) {
            appearances++;
            break;
          }
        }
      }
      checks.push({
        id: "central-image",
        severity: "fail",
        ok: keyWords.size === 0 || appearances >= 2,
        detail: `image "${image}" appears in ${appearances} lyric lines (needs 2+)`,
      });
    }
  }

  // artist-names-in-suno (fail): "think Sade meets Toni Braxton" — the renderer
  // rejects artist names, and the sound description should carry the room instead.
  {
    const suno = parsed.sunoPrompt || "";
    const nameDrop =
      // "X meets/x/vs Y"
      /\b[A-Z][\w.'&-]+\s+(?:meets|x|×|vs\.?)\s+[A-Z][\w.'&-]+/.test(suno)
      // "similar to / like / in the style of / reminiscent of ... A or/and/, B" (a list of names)
      || /(?:similar to|style of|reminiscent of|sounds like|inspired by|think|like|à ?la)\s+[A-Z][\w.'&-]+\s*(?:,|\bor\b|\band\b|&)\s*[A-Z][\w.'&-]+/.test(suno);
    checks.push({
      id: "artist-names-in-suno",
      severity: "fail",
      ok: !nameDrop,
      detail: nameDrop ? "production prompt name-drops artists — describe the sound instead" : "clean",
    });
  }

  // ── Performance layer (BRAIN Layer 6): tags & adlibs make a written song a
  //    performance. Founder mandate: no song ships bare. ───────────────────────
  const STRUCTURE_TAGS = new Set([
    "intro", "verse", "pre-chorus", "prechorus", "chorus", "post-chorus", "postchorus",
    "hook", "refrain", "bridge", "break", "breakdown", "interlude", "outro", "instrumental",
    "ad-lib section", "adlib section", "end",
  ]);
  const normalizeTag = (t: string) => t.trim().toLowerCase().replace(/\s+\d+$/, "").replace(/\s+/g, " ");
  const allBracketTags = [...(body.match(/\[[^\]]+\]/g) || [])].map((t) => t.slice(1, -1));

  // adlibs-present (fail): a real song in this room needs its adlib floor.
  if (typeof opts.minAdlibs === "number") {
    const adlibCount = (body.match(/\([^)]+\)/g) || []).length;
    checks.push({
      id: "adlibs-present",
      severity: "fail",
      ok: adlibCount >= opts.minAdlibs,
      detail: `${adlibCount} adlibs in parentheses (room floor ${opts.minAdlibs})`,
    });
  }

  // performance-tags (fail): at least one non-structure delivery/dynamics tag —
  // a song with only [Verse]/[Chorus] has no performance direction. Gated on the
  // performance-aware engine path (minAdlibs supplied) so it doesn't fire on callers
  // that aren't checking the performance layer.
  if (typeof opts.minAdlibs === "number") {
    const perfTags = allBracketTags.filter((t) => !STRUCTURE_TAGS.has(normalizeTag(t)) && !t.includes(":"));
    checks.push({
      id: "performance-tags",
      severity: "fail",
      ok: perfTags.length >= 1,
      detail: perfTags.length ? `${perfTags.length} performance tags: ${perfTags.slice(0, 5).join(", ")}` : "no delivery/dynamics tags",
    });
  }

  // invalid-tags (fail): the genuine junk — invented key:value tags like [Energy: High]
  // or [Vocals: Confident] that Suno ignores. High precision: only the colon pattern and
  // overly-wordy descriptive "tags" hard-fail, so real creative cues ([Vamp], [Sax Solo])
  // are never falsely blocked.
  if (typeof opts.minAdlibs === "number") {
    const junk = allBracketTags.filter((t) => t.includes(":") || t.trim().split(/\s+/).length > 4);
    checks.push({
      id: "invalid-tags",
      severity: "fail",
      ok: junk.length === 0,
      detail: junk.length ? `invented tags (renderer ignores these): ${[...new Set(junk)].slice(0, 5).map((t) => `[${t}]`).join(", ")}` : "no invented tags",
    });

    // unknown-tags (warn): a bracket tag not in the founder's valid list — probably fine
    // (Suno is permissive), but flagged so the writer trends toward known-good tags.
    if (opts.validTags && opts.validTags.length > 0) {
      const valid = new Set(opts.validTags.map((t) => normalizeTag(t.replace(/^\[|\]$/g, ""))));
      const unknown = [...new Set(allBracketTags.filter((t) => !t.includes(":") && !valid.has(normalizeTag(t))))];
      checks.push({
        id: "unknown-tags",
        severity: "warn",
        ok: unknown.length === 0,
        detail: unknown.length ? `off-list tags: ${unknown.slice(0, 6).map((t) => `[${t}]`).join(", ")}` : "all tags on the valid list",
      });
    }
  }

  // tags-own-line (fail): a bracket tag placed inside a lyric line is ignored by
  // the renderer. parseDraft consumes proper tag-lines into sections, so any bracket
  // tag left in a lyric content line is inline. Gated on the performance-aware path.
  if (typeof opts.minAdlibs === "number") {
    const inline = (parsed.lyricLines || []).filter((l) => /\[[^\]]+\]/.test(l));
    checks.push({
      id: "tags-own-line",
      severity: "fail",
      ok: inline.length === 0,
      detail: inline.length ? `${inline.length} lyric line(s) have an inline bracket tag` : "all tags on their own line",
    });
  }

  let failCount = 0;
  let warnCount = 0;
  for (const check of checks) {
    if (check.ok) continue;
    if (check.severity === "fail") failCount++;
    else warnCount++;
  }
  return { checks, failCount, warnCount };
}

// ---------------------------------------------------------------------------
// Trim-pass guard (plan Step 5: a trim may only DELETE lines)
// ---------------------------------------------------------------------------

/**
 * True when every non-empty line of `trimmed` exists verbatim (after
 * whitespace trim) in `original`, in the same order. Rewording, additions,
 * and reorderings all return false.
 */
export function trimIsDeleteOnly(original: string, trimmed: string): boolean {
  const originalLines = original.split(/\r?\n/).map((line) => line.trim());
  const keptLines = trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  let cursor = 0;
  for (const line of keptLines) {
    let found = -1;
    for (let i = cursor; i < originalLines.length; i++) {
      if (originalLines[i] === line) {
        found = i;
        break;
      }
    }
    if (found === -1) return false;
    cursor = found + 1;
  }
  return true;
}
