/**
 * Genre-grounded lyric judge — prompt construction + rewrite validation.
 *
 * The judge replaces the English-only regex cliché scrub with a single LLM
 * judge+rewrite pass grounded in the genre's OWN guide data (its cliché list,
 * authenticity-kit ethos and lexicon, language), so it works for every genre
 * in every language. This module is pure (no SDK calls) so it can be unit
 * tested; the LLM call lives in api/ai.ts.
 */

export const JUDGE_PASS_TOKEN = "VERDICT: PASS";

export interface JudgeGrounding {
  genreName: string;
  subGenre?: string;
  language: string;
  /** The guide's own tired-trope list for this genre. */
  cliches: string[];
  /** authenticityKit.writingEthos when the genre has a kit. */
  ethos?: string;
  /** A small sample of the kit's concrete vocabulary, for calibration. */
  lexiconSample?: string[];
}

export function buildJudgePrompt(songText: string, g: JudgeGrounding): string {
  const genreTag = g.subGenre ? `${g.subGenre} ${g.genreName}` : g.genreName;
  const clicheBlock = g.cliches.length
    ? `THIS GENRE'S TIRED TROPES (any line leaning on these is weak):\n${g.cliches.map((c) => `- ${c}`).join("\n")}`
    : "";
  const ethosBlock = g.ethos ? `THIS GENRE'S CRAFT STANDARD:\n${g.ethos}` : "";
  const lexBlock = g.lexiconSample?.length
    ? `CALIBRATION — the level of concreteness a strong line has (vocabulary from this genre's world): ${g.lexiconSample.join(", ")}`
    : "";

  return `
You are a ruthless ${genreTag} lyric editor, a native ${g.language} speaker, judging a draft line by line.

A line is WEAK if it:
- states an emotion or virtue instead of showing a concrete moment (object, place, texture, gesture, named specific)
- could appear in any genre's song (nothing marks it as ${genreTag})
- leans on a tired trope of this genre, or greeting-card/motivational-poster language in any language
  (e.g. "rise above", "spread my wings", "dreams come true", "believe in yourself", "found my voice",
  "unbreakable", "be the best I can be", "the world is mine" — and their equivalents in ${g.language})

CHORUS LINES ARE NOT EXEMPT. A cliché hook is the WORST offense, not a protected element —
judge and rewrite chorus/hook lines to the same standard, keeping them just as singable and repeatable.

${clicheBlock}

${ethosBlock}

${lexBlock}

YOUR TASK:
1. Judge every lyric line. Section tags like [Verse]/[Chorus] and adlibs in parentheses are structure, not lines to judge.
2. If fewer than 2 lines are weak, return EXACTLY this single line and nothing else:
${JUDGE_PASS_TOKEN}
3. Otherwise return the COMPLETE corrected song, rewriting ONLY the weak lines. Non-negotiable constraints:
   - Keep the language of the original lyrics (${g.language}) — do not translate.
   - Preserve the exact output format: the Title: line, ### SUNO Prompt section (unchanged), ### Lyrics section.
   - Preserve every section tag, the section order, the line count per section (±1), and the rhyme scheme.
   - Each replacement must match the original line's approximate syllable count so it stays singable.
   - Each replacement must contain a tangible specific (a real object, place, texture, sound, or named detail) true to ${genreTag}.
   - Do not add commentary, verdicts, or explanations — output only the corrected song.

Song:
${songText}
`.trim();
}

export interface RewriteValidation {
  ok: boolean;
  reason: string;
}

function countSectionTags(text: string): number {
  return (text.match(/^\s*\[[^\]\n]+\]\s*$/gm) || []).length;
}

function lyricsBody(text: string): string {
  const idx = text.indexOf("### Lyrics");
  return idx >= 0 ? text.slice(idx) : text;
}

/**
 * Sanity-validate a judge rewrite before accepting it. Any failure means the
 * caller keeps the original draft — the judge can only ever improve, never break.
 */
export function validateRewrite(original: string, rewritten: string): RewriteValidation {
  const out = (rewritten || "").trim();
  if (!out) return { ok: false, reason: "empty" };
  if (out.startsWith(JUDGE_PASS_TOKEN)) return { ok: false, reason: "pass-token" };
  if (!out.includes("### Lyrics")) return { ok: false, reason: "missing-lyrics-section" };
  if (!out.includes("### SUNO Prompt")) return { ok: false, reason: "missing-suno-section" };
  if (!/^\s*Title:/m.test(out)) return { ok: false, reason: "missing-title" };

  const origTags = countSectionTags(lyricsBody(original));
  const newTags = countSectionTags(lyricsBody(out));
  if (origTags > 0 && (newTags < Math.max(1, origTags - 2) || newTags > origTags + 2)) {
    return { ok: false, reason: `section-tags-changed(${origTags}->${newTags})` };
  }

  const origLen = lyricsBody(original).length;
  const newLen = lyricsBody(out).length;
  if (origLen > 0) {
    const ratio = newLen / origLen;
    if (ratio < 0.6 || ratio > 1.6) {
      return { ok: false, reason: `length-ratio(${ratio.toFixed(2)})` };
    }
  }

  return { ok: true, reason: "ok" };
}

/** True when the judge says the draft already meets the bar. */
export function isJudgePass(response: string): boolean {
  return (response || "").trim().startsWith(JUDGE_PASS_TOKEN);
}
