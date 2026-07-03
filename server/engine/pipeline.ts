// The curriculum engine (Phase 1 — R&B). SONGWRITING_ENGINE_PLAN.md §2 is the spec:
// story arrives whole → structured brief → room landing → hook candidates →
// section jobs → parallel drafts → code checks → selection, never revision.
// Fail-loud: if every draft fails checks after one retry, the user gets an honest
// "let's try again" — never a least-bad song.

import type { Brief, CompiledCurriculum, DraftReport, GenrePack, Landing, MusicalSpec, RoomCard } from "./types";
import { landRoom, describeLanding } from "./landing";
import { runChecks } from "./checks";

export const ENGINE_VERSION = "v3.0-rnb";
// Pinned per plan §5 (drift protection). Changing this requires re-running the
// frozen regression batch and re-gating with the founder.
export const ENGINE_MODEL = "gpt-4.1";

/** kind "plan" = low-temperature JSON planning; kind "write" = the creative draft chain. */
export type EngineGenerate = (prompt: string, kind: "plan" | "write") => Promise<string>;
export type EngineStage = (label: string) => void;

export type EngineInputs = {
  genre: string;
  story: string;
  vocals?: string;
  subGenre?: string;
};

export type EngineResult = {
  text: string;
  meta: {
    engineVersion: string;
    curriculumHash: string;
    landing: Landing;
    landingNote: string;
    hook: string;
    brief: Brief;
    draftsTried: number;
    winnerWarnings: number;
  };
};

/** The genre isn't covered by the curriculum engine yet — caller falls back to interim. */
export class EngineNotAvailable extends Error {
  code = "engine_not_available";
}

/** Every draft failed code checks (plan Step 6): honest 422, never a least-bad song. */
export class EngineFailure extends Error {
  code = "engine_all_drafts_failed";
  status = 422;
  reasons: string[];
  constructor(reasons: string[]) {
    super("The writing didn't meet the bar this time. Let's try again — you were not charged.");
    this.reasons = reasons;
  }
}

export function resolveGenre(curriculum: CompiledCurriculum, genre: string): GenrePack | null {
  const norm = String(genre || "").toLowerCase().replace(/[^a-z0-9&]/g, "");
  for (const pack of Object.values(curriculum.genres)) {
    const candidates = [pack.id, pack.name.toLowerCase(), ...pack.aliases].map((a) =>
      a.toLowerCase().replace(/[^a-z0-9&]/g, "")
    );
    if (candidates.includes(norm)) return pack;
  }
  return null;
}

function voiceLine(vocals?: string): string {
  const v = String(vocals || "Female Solo");
  if (/duet|group/i.test(v)) return "duet vocals";
  if (/male/i.test(v) && !/female/i.test(v)) return "male vocal";
  return "female vocal";
}

/** Tolerant JSON extraction: parse the first balanced JSON object/array in the text. */
export function parseFirstJson(text: string): any {
  const start = text.search(/[{[]/);
  if (start === -1) throw new Error("no JSON found");
  const open = text[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return JSON.parse(text.slice(start, i + 1));
    }
  }
  throw new Error("unbalanced JSON");
}

async function planJson(generate: EngineGenerate, prompt: string): Promise<any> {
  try {
    return parseFirstJson(await generate(prompt, "plan"));
  } catch {
    return parseFirstJson(await generate(`${prompt}\n\nReturn ONLY the JSON. No prose, no markdown fences.`, "plan"));
  }
}

const STOPWORDS = new Set(
  "the a an and or but so of to in on at for with from by is are was were be been am i you he she it we they me him her them my your his its our their this that these those as if then than when where what who how not no yes do does did done have has had will would could should can just really very about into over under again there here all any some one two also".split(" ")
);

/** Distinctive words from the user's story — the currency of story-fit scoring. */
export function storyTokens(story: string): string[] {
  const seen = new Set<string>();
  for (const raw of String(story).toLowerCase().split(/[^a-z']+/)) {
    const w = raw.replace(/'/g, "");
    if (w.length > 4 && !STOPWORDS.has(w)) seen.add(w);
  }
  return [...seen];
}

const OPEN_VOWEL_END = /[aeiou]y?$|[aeiou]h?$|ow$|ay$|igh$/i;

/** Code-scored hook selection (plan Step 2): length, story fit, singable ending. */
export function scoreHook(hook: string, tokens: string[]): number {
  const words = hook.trim().split(/\s+/).filter(Boolean);
  let score = 0;
  if (words.length >= 2 && words.length <= 6) score += 2;
  if (words.length === 7) score += 1;
  const lower = hook.toLowerCase();
  if (tokens.some((t) => lower.includes(t.slice(0, 5)))) score += 2;
  const last = words[words.length - 1] || "";
  if (OPEN_VOWEL_END.test(last)) score += 1;
  if (/["“”:;]/.test(hook)) score -= 1;
  return score;
}

function briefPrompt(story: string, card: RoomCard): string {
  return `You are planning a song. Do not write any lyrics. Read the story and return ONLY a JSON object.

THE ROOM this song lives in: ${card.name} — ${card.oneLine}
Its tempo & groove: ${card.tempoGroove}

THE STORY (the user's own words):
${story}

Return JSON with exactly these string fields:
{
  "coreEmotion": "the ONE specific feeling (not a category — 'the ache of hearing they moved on' not 'sadness')",
  "purpose": "what this song is FOR (dance, testify, feel seen, flirt, grieve...)",
  "pov": "who is speaking, to whom, and why now",
  "turn": "what changes inside this song — where it starts, where it turns, where it lands",
  "spec": {
    "tempo": "a BPM range for THIS song, inside the room's range",
    "groove": "straight / swung / half-time — the feel for THIS song",
    "barsPerSection": "bars for verse / chorus / bridge, e.g. 'verse 8, chorus 8, bridge 4'",
    "wordDensity": "low / moderate / high — how densely words sit on this tempo"
  }
}`;
}

function validateBrief(raw: any, card: RoomCard, landing: Landing): Brief {
  const s = (v: any, fallback: string): string => {
    const t = typeof v === "string" ? v.trim() : "";
    return t || fallback;
  };
  const spec: MusicalSpec = {
    tempo: s(raw?.spec?.tempo, card.tempoGroove),
    groove: s(raw?.spec?.groove, "straight"),
    barsPerSection: s(raw?.spec?.barsPerSection, "verse 8, chorus 8, bridge 4"),
    wordDensity: s(raw?.spec?.wordDensity, "moderate"),
  };
  const brief: Brief = {
    coreEmotion: s(raw?.coreEmotion, ""),
    purpose: s(raw?.purpose, ""),
    pov: s(raw?.pov, ""),
    turn: s(raw?.turn, ""),
    spec,
    landing,
  };
  if (!brief.coreEmotion || !brief.purpose || !brief.pov || !brief.turn) {
    throw new Error("brief incomplete");
  }
  return brief;
}

function hooksPrompt(story: string, brief: Brief, card: RoomCard): string {
  return `You are naming a song, the way real writers sing twenty and keep one. Return ONLY a JSON array of 12 strings.

Each string is a hook/title candidate: short (2-6 words), rhythmic, emotionally loaded, built from THIS story's actual details — never a generic phrase that could belong to anyone's song. In this room (${card.name}), a hook that means two things at once beats a sincere flat one — but it must land naturally, never announced.

Core emotion: ${brief.coreEmotion}
The turn: ${brief.turn}

THE STORY:
${story}`;
}

function sectionsPrompt(brief: Brief, hook: string, card: RoomCard): string {
  return `Plan the sections for one song. No lyrics. Return ONLY a JSON array of 4-8 objects like {"tag":"[Verse]","job":"..."}.

Allowed tags: [Intro] [Verse] [Pre-Chorus] [Chorus] [Bridge] [Outro] (repeat [Verse]/[Chorus] as needed).
Every job is one sentence saying what THAT section must do for THIS song (what verse 1 establishes, what the bridge reveals). The chorus builds around the hook "${hook}".
Room conventions: ${card.name} — ${card.oneLine}
Bars: ${brief.spec.barsPerSection}. The song's turn: ${brief.turn}`;
}

type SectionPlan = Array<{ tag: string; job: string }>;

function validateSections(raw: any): SectionPlan {
  if (!Array.isArray(raw) || raw.length < 4 || raw.length > 10) throw new Error("bad section plan");
  const plan: SectionPlan = raw.map((s: any) => ({
    tag: String(s?.tag || "").trim(),
    job: String(s?.job || "").trim(),
  }));
  const tags = plan.map((p) => p.tag);
  if (!tags.some((t) => t.startsWith("[Verse")) || !tags.some((t) => t.startsWith("[Chorus"))) {
    throw new Error("section plan missing verse or chorus");
  }
  if (plan.some((p) => !p.tag.startsWith("[") || !p.job)) throw new Error("malformed section");
  return plan;
}

function writerPrompt(args: {
  core: string;
  pack: GenrePack;
  card: RoomCard;
  brief: Brief;
  hook: string;
  sections: SectionPlan;
  story: string;
  vocals?: string;
  variant: "straight" | "hook-first";
  guidance?: string;
}): string {
  const { core, pack, card, brief, hook, sections, story, vocals, variant, guidance } = args;
  const sectionLines = sections.map((s) => `${s.tag} — ${s.job}`).join("\n");
  const approach =
    variant === "hook-first"
      ? "Approach: get the chorus singing first in your head, then build every verse toward it. Output in normal top-to-bottom order."
      : "Approach: write the song straight through, top to bottom, one voice, one sitting.";
  return `You are writing one real song for one specific person. Their story is the only source of truth — use their real details; never invent replacements for them.

=== THE CRAFT (applies to every song) ===
${core}

=== HOW AN R&B WRITER THINKS ===
${pack.profileText}

=== THE ROOM: ${card.name} ===
${card.oneLine}
Tempo & groove: ${card.tempoGroove}
How the writing changes in this room:
${card.writingDials.map((d) => `- ${d}`).join("\n")}
What makes it a parody (avoid every one of these): ${card.parodyTraps}

=== THIS SONG'S BRIEF ===
Core emotion: ${brief.coreEmotion}
Purpose: ${brief.purpose}
Point of view: ${brief.pov}
The turn: ${brief.turn}
Musical spec: tempo ${brief.spec.tempo}; groove ${brief.spec.groove}; ${brief.spec.barsPerSection}; word density ${brief.spec.wordDensity}.
The hook (and title): ${hook}
Section plan:
${sectionLines}

=== THE STORY (the user's own words) ===
${story}

${approach}${guidance ? `\n\nOne more thing from the last attempt: ${guidance}` : ""}

Vocal: ${voiceLine(vocals)}.

Return exactly this format:
Title: ${hook}
### SUNO Prompt
One 40-70 word production prompt for this exact song. Ground it in this room's sound: ${card.rendering}
### Lyrics
The song, with section tags in brackets.

This is creative fiction for a music app. If you cannot write it, return ONLY the line "GENERATION_DECLINED".`;
}

/** Plain writer-voice guidance from failed check ids (plan: never paste raw checker strings). */
const GUIDANCE: Record<string, string> = {
  "story-fidelity": "use the real details from the story — name the actual places, objects, and moments the writer gave you",
  "hook-placement": "the chorus must be built around the hook — the hook line leads it",
  "chorus-consistency": "the chorus is the same words every time it returns",
  format: "keep the exact Title / SUNO Prompt / Lyrics format with bracketed section tags",
  "leaked-labels": "the lyrics must contain only the song itself — no notes, no labels, no planning talk",
};

function guidanceFor(reports: DraftReport[]): string {
  const failed = new Set<string>();
  for (const r of reports) for (const c of r.checks) if (!c.ok && c.severity === "fail") failed.add(c.id);
  const lines = [...failed].map((id) => GUIDANCE[id]).filter(Boolean);
  return lines.join("; ");
}

export async function runEngine(
  curriculum: CompiledCurriculum,
  inputs: EngineInputs,
  generate: EngineGenerate,
  stage: EngineStage = () => {}
): Promise<EngineResult> {
  const pack = resolveGenre(curriculum, inputs.genre);
  if (!pack) throw new EngineNotAvailable(`no curriculum for genre "${inputs.genre}"`);

  const story = String(inputs.story || "").trim();
  if (story.length < 10) {
    throw Object.assign(new Error("Tell us the story first — a few sentences in your own words."), {
      status: 400,
      code: "story_required",
    });
  }

  stage("Reading your story...");
  const landing = landRoom(pack, story, inputs.subGenre);
  const card = pack.rooms.find((r) => r.id === landing.roomId);
  if (!card) throw new EngineNotAvailable(`room "${landing.roomId}" missing from pack`);
  const landingNote = describeLanding(landing, pack);
  stage(`Room: ${card.name} — ${landingNote}`);

  const brief = validateBrief(await planJson(generate, briefPrompt(story, card)), card, landing);

  stage("Writing hooks...");
  const hooksRaw = await planJson(generate, hooksPrompt(story, brief, card));
  const hooks: string[] = (Array.isArray(hooksRaw) ? hooksRaw : [])
    .map((h: any) => String(h || "").trim())
    .filter((h: string) => h.length > 0 && h.length < 60);
  if (hooks.length < 5) throw new EngineFailure(["hook step returned too few candidates"]);
  const tokens = storyTokens(story);
  const hook = hooks
    .map((h, i) => ({ h, score: scoreHook(h, tokens), i }))
    .sort((a, b) => b.score - a.score || a.i - b.i)[0].h;

  stage("Planning sections...");
  const sections = validateSections(await planJson(generate, sectionsPrompt(brief, hook, card)));

  // ONE user input produces ONE song (founder order 2026-07-02). The engine writes
  // the song once, straight through; the checks GATE it, they never pick between
  // versions. A failed check earns one more write with plain guidance — then fail-loud.
  const writeOne = async (variant: "straight" | "hook-first", guidance?: string) => {
    const draft = await generate(
      writerPrompt({ core: curriculum.core, pack, card, brief, hook, sections, story, vocals: inputs.vocals, variant, guidance }),
      "write"
    ).catch(() => "");
    if (!draft || draft.includes("GENERATION_DECLINED")) return null;
    return { draft, report: runChecks(draft, { story, card, spec: brief.spec, hook }) };
  };

  stage("Writing your song...");
  const first = await writeOne("straight");
  let draftsTried = first ? 1 : 0;

  stage("Checking the writing...");
  let winner = first && first.report.failCount === 0 ? first : null;
  if (!winner) {
    stage("Not good enough yet — one more pass...");
    const guidance = first ? guidanceFor([first.report]) || undefined : undefined;
    const retry = await writeOne("hook-first", guidance);
    if (retry) draftsTried += 1;
    if (retry && retry.report.failCount === 0) winner = retry;
    if (!winner) {
      const reports = [first, retry].filter(Boolean) as Array<{ report: DraftReport }>;
      const reasons = [...new Set(reports.flatMap((a) => a.report.checks.filter((c) => !c.ok && c.severity === "fail").map((c) => c.id)))];
      throw new EngineFailure(reasons.length ? reasons : ["the writer declined the request"]);
    }
  }

  return {
    text: winner.draft.trim(),
    meta: {
      engineVersion: ENGINE_VERSION,
      curriculumHash: curriculum.hash,
      landing,
      landingNote,
      hook,
      brief,
      draftsTried,
      winnerWarnings: winner.report.warnCount,
    },
  };
}
