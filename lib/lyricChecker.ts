/**
 * Pure-code quality checker for generated songs — zero AI, zero cost, deterministic.
 * Research: models can't count syllables (~80% error) and "improve this line" loops
 * make lyrics worse. So code does the counting/scanning, and a failing draft is
 * DISCARDED and redrafted — never patched.
 */

import { findBannedHits, GRAMMAR_FIXES, LEAK_MARKERS } from "./bannedLexicon";

export interface CheckResult {
  ok: boolean;
  failures: string[]; // hard fails — draft must be discarded
  warnings: string[]; // soft notes — logged, not fatal
}

export interface CheckOptions {
  language?: string;
  /** The chosen hook line — chorus must open with it (normalized match). */
  hookLine?: string;
  /** Extra tags allowed for this genre (e.g. EDM gets [Build Up], [Drop]). */
  extraAllowedTags?: string[];
  /** User explicitly asked for ad-libs → parenthetical cap is lifted. */
  adlibsRequested?: boolean;
  /** Teaching/exemplar lines the song must not copy (kit lines are calibration, not content). */
  forbiddenLines?: string[];
}

const STANDARD_TAGS = [
  "intro", "verse", "verse 1", "verse 2", "verse 3", "pre-chorus", "chorus",
  "final chorus", "bridge", "outro", "hook", "refrain", "interlude", "instrumental",
];

function normalize(s: string): string {
  return s.toLowerCase().replace(/\(.*?\)/g, "").replace(/[^a-z0-9à-ÿ' ]+/gi, " ").replace(/\s+/g, " ").trim();
}

/** Heuristic English syllable count (vowel groups). Good enough for range checks. */
export function countSyllables(line: string): number {
  const words = normalize(line).split(" ").filter(Boolean);
  let total = 0;
  for (const w of words) {
    const groups = w.replace(/e$/, "").match(/[aeiouy]+/g);
    total += Math.max(1, groups ? groups.length : 1);
  }
  return total;
}

export function extractLyricsBody(songText: string): string {
  const i = songText.indexOf("### Lyrics");
  return i >= 0 ? songText.slice(i + "### Lyrics".length) : songText;
}

function lyricLines(body: string): string[] {
  return body
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !/^\[[^\]]+\]$/.test(l) && !/^\(.*\)$/.test(l));
}

function sectionTags(body: string): string[] {
  return (body.match(/^\s*\[([^\]\n]+)\]\s*$/gm) || []).map((t) => t.replace(/[\[\]]/g, "").trim());
}

function firstChorusLines(body: string, n = 2): string[] {
  const lines = body.split("\n").map((l) => l.trim());
  const idx = lines.findIndex((l) => /^\[(final )?chorus[^\]]*\]$/i.test(l));
  if (idx < 0) return [];
  const out: string[] = [];
  for (let i = idx + 1; i < lines.length && out.length < n; i++) {
    const l = lines[i];
    if (!l) continue;
    if (/^\[[^\]]+\]$/.test(l)) break;
    if (/^\(.*\)$/.test(l)) continue;
    out.push(l);
  }
  return out;
}

export function checkSong(songText: string, opts: CheckOptions = {}): CheckResult {
  const failures: string[] = [];
  const warnings: string[] = [];
  const isEnglish = !opts.language || opts.language.toLowerCase() === "english";

  // Format basics
  if (!/^\s*Title:/m.test(songText)) failures.push("missing Title line");
  if (!songText.includes("### SUNO Prompt")) failures.push("missing SUNO Prompt section");
  if (!songText.includes("### Lyrics")) failures.push("missing Lyrics section");
  const body = extractLyricsBody(songText);

  // Leaked internal labels (the "Catchy" class of bug)
  for (const re of LEAK_MARKERS) {
    if (re.test(body)) failures.push(`leaked internal label: ${re}`);
  }

  // Grammar traps
  for (const [re] of GRAMMAR_FIXES) {
    if (re.test(body)) failures.push(`grammar trap: ${re.source}`);
    re.lastIndex = 0;
  }

  // Banned lexicon (English only — per-language lists are future work)
  if (isEnglish) {
    const hits = findBannedHits(body);
    if (hits.length > 0) failures.push(`banned words/phrases: ${hits.slice(0, 6).join(", ")}`);
  }

  // Tag whitelist
  const allowed = new Set([...STANDARD_TAGS, ...(opts.extraAllowedTags || []).map((t) => t.toLowerCase())]);
  for (const tag of sectionTags(body)) {
    const t = tag.toLowerCase();
    const isVocalist = t.startsWith("vocalist:") || t === "female vocal" || t === "male vocal";
    if (!allowed.has(t) && !isVocalist) failures.push(`off-whitelist tag: [${tag}]`);
  }

  // Word budget (research: good Suno lyrics run ~150-250 words; enforce loose bounds)
  const words = lyricLines(body).join(" ").split(/\s+/).filter(Boolean).length;
  if (words < 90) failures.push(`too short: ${words} words`);
  if (words > 340) failures.push(`too long: ${words} words`);
  else if (words > 280) warnings.push(`long: ${words} words`);

  // Syllable sanity (English): fail only on egregious unsingable lines
  if (isEnglish) {
    const longLines = lyricLines(body).filter((l) => countSyllables(l) > 15);
    if (longLines.length > 2) {
      failures.push(`unsingable lines (>15 syllables): ${longLines.length}, e.g. "${longLines[0].slice(0, 60)}"`);
    } else if (longLines.length > 0) {
      warnings.push(`${longLines.length} long line(s)`);
    }
  }

  // Hook placement: first chorus line must open with the chosen hook
  if (opts.hookLine) {
    const chorusFirst = firstChorusLines(body, 1)[0] || "";
    const hookNorm = normalize(opts.hookLine);
    if (!normalize(chorusFirst).startsWith(hookNorm.split(" ").slice(0, 3).join(" "))) {
      failures.push(`chorus does not open with the hook ("${chorusFirst.slice(0, 40)}" vs hook "${opts.hookLine}")`);
    }
  }

  // Chorus consistency: all chorus sections should start with the same line
  const allChorusStarts: string[] = [];
  const lines = body.split("\n").map((l) => l.trim());
  lines.forEach((l, i) => {
    if (/^\[(final )?chorus[^\]]*\]$/i.test(l)) {
      for (let j = i + 1; j < lines.length; j++) {
        const c = lines[j];
        if (!c) continue;
        if (/^\[[^\]]+\]$/.test(c)) break;
        if (/^\(.*\)$/.test(c)) continue;
        allChorusStarts.push(normalize(c));
        break;
      }
    }
  });
  if (allChorusStarts.length > 1 && new Set(allChorusStarts).size > 1) {
    failures.push("choruses are not consistent (different opening lines)");
  }

  // Exemplar plagiarism: kit teaching lines must never appear in user songs
  for (const f of opts.forbiddenLines || []) {
    const fNorm = normalize(f);
    if (fNorm.length < 12) continue;
    const probe = fNorm.split(" ").slice(0, 6).join(" ");
    if (lyricLines(body).some((l) => normalize(l).includes(probe))) {
      failures.push(`copied exemplar line: "${f.slice(0, 40)}..."`);
    }
  }

  // Parenthetical ad-lib cap
  if (!opts.adlibsRequested) {
    const adlibs = (body.match(/\([^)]{1,40}\)/g) || []).length;
    if (adlibs > 6) failures.push(`ad-lib spam: ${adlibs} parentheticals`);
    else if (adlibs > 3) warnings.push(`${adlibs} parentheticals`);
  }

  return { ok: failures.length === 0, failures, warnings };
}

/** Validate + normalize a hook candidate from the Hook Smith. Returns null if unusable. */
export function validateHook(raw: { title?: string; hook_line?: string }): { title: string; hookLine: string } | null {
  let title = (raw?.title || "").trim();
  let hook = (raw?.hook_line || raw?.title || "").trim();
  if (!title || !hook) return null;
  for (const [re, fix] of GRAMMAR_FIXES) {
    title = title.replace(re, fix);
    hook = hook.replace(re, fix);
    re.lastIndex = 0;
  }
  // Strip stray quotes/labels
  title = title.replace(/^["'`]+|["'`]+$/g, "").replace(/^(title|hook)\s*[:—-]\s*/i, "").trim();
  hook = hook.replace(/^["'`]+|["'`]+$/g, "").replace(/^(title|hook)\s*[:—-]\s*/i, "").trim();
  const wc = hook.split(/\s+/).filter(Boolean).length;
  if (wc < 2 || wc > 8) return null;
  if (findBannedHits(hook).length > 0) return null;
  for (const re of LEAK_MARKERS) { if (re.test(hook) || re.test(title)) return null; }
  return { title, hookLine: hook };
}
