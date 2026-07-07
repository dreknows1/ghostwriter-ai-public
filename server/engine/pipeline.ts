// The curriculum engine (Phase 1 — R&B). SONGWRITING_ENGINE_PLAN.md §2 is the spec:
// story arrives whole → structured brief → room landing → hook candidates →
// section jobs → parallel drafts → code checks → selection, never revision.
// Fail-loud: if every draft fails checks after one retry, the user gets an honest
// "let's try again" — never a least-bad song.

import type { Brief, CompiledCurriculum, DraftReport, GenrePack, Landing, MusicalSpec, RoomCard } from "./types";
import { landRoom, describeLanding } from "./landing";
import { runChecks } from "./checks";

export const ENGINE_VERSION = "v3.2-multigenre";
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
  // Song Builder picks — structured constraints the brief must honor (never prose)
  theme?: string;
  purpose?: string;
  audience?: string;
  /** a user-chosen title: becomes THE hook, no candidates generated */
  title?: string;
  /** Song Builder instrument picks (comma-joined), featured in the render */
  instrumentation?: string;
  /** lyric language (English default). Tags stay English; sung parens follow the language. */
  language?: string;
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

// Words that describe or connect an image but aren't the thing itself — allowed
// alongside a real noun, but never enough to make an image concrete on their own.
const IMAGE_MODIFIERS = new Set(
  ("the a an my your his her our their this that of in on at with and or to for from by " +
    "between beneath beyond around through without within into onto over under us we you me it " +
    "old broken little big small warm cold soft hard bright dark faded fading last first final only " +
    "one two every long short sweet gentle quiet loud deep high low new young lost sweetest").split(" ")
);

/** The concrete-image law (BRAIN Layer 2): a central image must name at least one real
 * thing — a word that is neither an abstraction nor a mere modifier. "orange enamel pot"
 * passes (pot); "fading sunlight" / "the long goodbye" / "colors" do not. */
export function isConcreteImage(image: string, abstractionWords: string[]): boolean {
  const abstract = new Set(abstractionWords.map((w) => w.toLowerCase()));
  const words = String(image).toLowerCase().split(/[^a-z]+/).filter(Boolean);
  return words.some((w) => !abstract.has(w) && !IMAGE_MODIFIERS.has(w) && w.length > 2);
}

function picksBlock(inputs: EngineInputs): string {
  const picks: string[] = [];
  if (inputs.theme) picks.push(`Theme: ${inputs.theme}`);
  if (inputs.purpose) picks.push(`What the song should do: ${inputs.purpose}`);
  if (inputs.audience) picks.push(`Who it speaks to: ${inputs.audience}`);
  if (inputs.instrumentation) picks.push(`Featured instruments: ${inputs.instrumentation}`);
  if (!picks.length) return "";
  return `\nTHE USER'S CHOICES (honor these exactly — they are decisions, not suggestions):\n${picks.join("\n")}\n`;
}

function briefPrompt(story: string, card: RoomCard, inputs: EngineInputs, imageFeedback = ""): string {
  const storyBlock = story
    ? `THE STORY (the user's own words):\n${story}`
    : `No story details were given — build the brief from the choices alone. Keep it universal but concrete, and NEVER invent fake personal details (no invented names, streets, dates, or events pretending to be the user's).`;
  return `You are planning a song. Do not write any lyrics. Read the story and return ONLY a JSON object.

THE ROOM this song lives in: ${card.name} — ${card.oneLine}
Its tempo & groove: ${card.tempoGroove}
${picksBlock(inputs)}
${storyBlock}${imageFeedback ? `\n\nIMPORTANT — fix your central image: ${imageFeedback}` : ""}

Return JSON with exactly these string fields:
{
  "coreEmotion": "the ONE specific feeling (not a category — 'the ache of hearing they moved on' not 'sadness')",
  "purpose": "what this song is FOR (dance, testify, feel seen, flirt, grieve...)",
  "pov": "who is speaking, to whom, and why now",
  "turn": "what changes inside this song — where it starts, where it turns, where it lands",
  "centralImage": "ONE real object or place you could photograph — a thing with edges, named in 2-5 plain words. GOOD: a chipped coffee mug, the back porch steps, his old army jacket, a bus transfer ticket, the kitchen radio. BAD (rejected): sunlight, colors, the distance, a long goodbye, our love, the space between us — those are moods, not things. From the story when there is one; universal-but-real for the theme when there isn't (an object anyone could own — never a fake personal detail).",
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
    centralImage: s(raw?.centralImage, ""),
    spec,
    landing,
  };
  if (!brief.coreEmotion || !brief.purpose || !brief.pov || !brief.turn || !brief.centralImage) {
    throw new Error("brief incomplete");
  }
  return brief;
}

function hooksPrompt(story: string, brief: Brief, card: RoomCard, inputs: EngineInputs): string {
  const source = story
    ? `built from THIS story's actual details — never a generic phrase that could belong to anyone's song`
    : `built from the core emotion and the user's choices — concrete and singable, but NEVER inventing fake personal details`;
  const storyBlock = story ? `\nTHE STORY:\n${story}` : "";
  return `You are naming a song, the way real writers sing twenty and keep one. Return ONLY a JSON array of 12 strings.

Each string is a hook/title candidate: short (2-6 words), rhythmic, emotionally loaded, ${source}. In this room (${card.name}), a hook that means two things at once beats a sincere flat one — but it must land naturally, never announced.

Core emotion: ${brief.coreEmotion}
The turn: ${brief.turn}
${picksBlock(inputs)}${storyBlock}`;
}

function sectionsPrompt(brief: Brief, hook: string, card: RoomCard): string {
  return `Plan the sections for one song. No lyrics. Return ONLY a JSON array of 4-8 objects like {"tag":"[Verse]","job":"..."}.

Allowed tags: [Intro] [Verse] [Pre-Chorus] [Chorus] [Bridge] [Outro] (repeat [Verse]/[Chorus] as needed).
Every job is one sentence saying what THAT section must do for THIS song (what verse 1 establishes, what the bridge reveals). The chorus builds around the hook "${hook}".
THE VERSE CARRIES THE STORY — it is the substance. Plan the verses to be as long as the chorus or longer (about 6–8 lines each), each verse advancing the story with new, specific detail. A song whose verses are shorter than its chorus has no room for meaning — do NOT plan thin 4-line verses under a big repeating hook.
PLAN THE WHOLE-SONG ARC like a live record: intimate opening, the chorus opens up, a turn or interlude, a bridge that pulls the beat back for the emotional peak, and where the room fits — a call-and-response / crown moment where a choir or crowd answers the lead — then the fullest final chorus and a stripped outro. Each section's job includes its DYNAMIC (where it sits on the rise-and-fall), not just its words.
Room conventions: ${card.name} — ${card.oneLine}
How this room writes (plan the sections to honor these — if the room vamps, PLAN the vamp):
${card.writingDials.map((d) => `- ${d}`).join("\n")}
Bars: ${brief.spec.barsPerSection}. The song's turn: ${brief.turn}. The central image: ${brief.centralImage}`;
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
  bannedPhrases: string[];
  hookLocked: boolean;
  instrumentation?: string;
  language?: string;
}): string {
  const { core, pack, card, brief, hook, sections, story, vocals, variant, guidance, bannedPhrases, hookLocked, instrumentation, language } = args;
  const lang = String(language || "English").trim();
  const languageLine = /^english$/i.test(lang)
    ? ""
    : `\nLANGUAGE: write ALL lyrics in ${lang} — natural, native phrasing a native speaker would sing, never translated-sounding. Bracket [tags] and the SUNO Prompt stay in ENGLISH; sung words in (parentheses) follow the lyrics' language. The Title is in ${lang}.\n`;
  const sectionLines = sections.map((s) => `${s.tag} — ${s.job}`).join("\n");
  const approach =
    variant === "hook-first"
      ? "Approach: get the chorus singing first in your head, then build every verse toward it. Output in normal top-to-bottom order."
      : "Approach: write the song straight through, top to bottom, one voice, one sitting.";
  const banList = bannedPhrases.slice(0, 40).join("; ");
  return `You are writing one real song for one specific person. Their story is the only source of truth — use their real details; never invent replacements for them.

=== THE ONE RULE ABOVE ALL ===
Every line must be one a stranger could NOT have written about their own love. If a line would fit any love song ever made, it has failed — cut it and write the specific true thing instead. The test for the whole song: could two different people with different stories both receive it? If yes, you failed.
BANNED — these are the machine's default phrases; using even one fails the song: ${banList}.
No greeting-card abstractions (no "beat of my heart", "words I never spoke", "let the world slip away", "you complete me"). Concrete nouns over feeling-words. A real thing the listener can touch beats any adjective.

=== THE CRAFT (applies to every song) ===
${core}

=== HOW A ${pack.name.toUpperCase()} WRITER THINKS ===
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
The central image: ${brief.centralImage} — the song returns to it; the feelings live in and around this real thing, never floating free. If the room welcomes a second meaning, this image carries it.
${hookLocked
  ? `The hook (and title) is FIXED: ${hook}. Use it exactly as the Title and lead the chorus with it, word-for-word.`
  : `Suggested hook: ${hook} — keep it, or sharpen it into a stronger, more specific hook straight from the story. Whatever you choose becomes BOTH the Title AND the line that leads the chorus, word-for-word. Title and chorus must use the SAME hook.`}
Section plan:
${sectionLines}

=== THE PERFORMANCE (write it like a live record, richly directed) ===
${card.performance.prose}
This room's delivery colors: ${card.performance.deliveryTags.map((t) => t.replace(/[[\]]/g, "").toLowerCase()).join(", ")}.
Include AT LEAST ${card.performance.minAdlibs} adlib/backing lines across the song (density: ${card.performance.adlibDensity}).
Direct the performance INTO the song — this is what turns a lyric sheet into a record:
- Give each section a DESCRIPTIVE header on its own line that names the section AND how it's performed — who sings, the arrangement, the dynamics. e.g. [Verse 1 — singing, lead only, choir hums softly], [Chorus 1 — full harmonies, crowd claps light], [Bridge — band pulls back, spotlight on the lead]. Rich detail is GOOD; it guides the render. (A short folded form like [Chorus: belted] is also fine.)
- You may open with a production/setting header ([Live Performance — small theater], [Production: slow-burn R&B, ~80 BPM, live piano, hip-hop drums, ambient pads]) and close with a stage direction ([final chord rings, choir fades]).
- Parentheses are HEARD and do double duty: (1) sung backing/adlibs, labeled — (Choir: "the words they sing"), (Ad-lib: "I'm sorry"), (background: "oohs") — put the actual short sung words in quotes after the label; and (2) short scene directions — (crowd cheers), (piano breathes). Use them freely where a singer answers or the room reacts.
- Build the WHOLE-SONG ARC: intimate verses, the chorus opens up, a bridge that pulls the beat back for the emotional peak, a call-and-response or crown moment, the fullest final chorus, then a stripped outro. The performance should rise and fall across the whole song, never stay flat.
- Density follows that arc — lighter in verses, fuller in choruses, heaviest at the peak. Match this room's character above.
- Your final hook (the Title) leads the chorus (or [Hook]) and appears word-for-word.

${story ? `=== THE STORY (the user's own words) ===\n${story}` : `=== NO STORY WAS GIVEN ===\nWrite from the brief alone. Keep it universal but concrete. NEVER invent fake personal details — no invented names, streets, dates, or events pretending to be the user's.`}

${approach}${guidance ? `\n\nOne more thing from the last attempt: ${guidance}` : ""}

Vocal: ${voiceLine(vocals)}.${languageLine}

Return exactly this format:
Title: ${hookLocked ? hook : "<your final hook>"}
### SUNO Prompt
One 40-70 word production prompt for this exact song. Ground it in this room's sound (never name real artists — describe the sound instead)${instrumentation ? `, and FEATURE the writer's chosen instruments: ${instrumentation}` : ""}: ${card.rendering}
### Lyrics
The song, with section tags in brackets.

This is creative fiction for a music app. If you cannot write it, return ONLY the line "GENERATION_DECLINED".`;
}

/** For auto-hooks, the title should BE the line the chorus actually loops — the writer
 * sometimes titles the song something poetic that differs from its own chorus hook. Adopt
 * the dominant chorus line as the Title so the sung hook and the title always agree (and
 * the listener gets the memorable line as the title). Never touches a user-locked title. */
export function adoptChorusHookAsTitle(draft: string): string {
  const lyricsAt = draft.search(/^###\s*lyrics\s*$/im);
  if (lyricsAt === -1) return draft;
  const body = draft.slice(lyricsAt);
  const HOOK_TAG = /^\s*\[(chorus|hook|refrain|post-?chorus|vamp)/i;
  const ANY_TAG = /^\s*\[[^\]]+\]/;
  const lines = body.split(/\r?\n/);
  const counts = new Map<string, { display: string; n: number }>();
  let inHook = false;
  for (const raw of lines) {
    if (ANY_TAG.test(raw)) { inHook = HOOK_TAG.test(raw); continue; }
    if (!inHook) continue;
    const display = raw.replace(/\([^)]*\)/g, "").trim(); // drop adlibs
    const key = display.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
    const words = key.split(" ").filter(Boolean);
    if (words.length < 2 || words.length > 9) continue;
    const cur = counts.get(key) || { display, n: 0 };
    cur.n += 1;
    counts.set(key, cur);
  }
  // Prefer the most-repeated line; on ties, the shorter one (that's the hook, not a
  // longer chorus line that happened to repeat).
  let best: { display: string; n: number; words: number } | null = null;
  for (const v of counts.values()) {
    if (v.n < 2) continue;
    const words = v.display.split(/\s+/).length;
    if (!best || v.n > best.n || (v.n === best.n && words < best.words)) best = { ...v, words };
  }
  if (!best) return draft;
  const title = best.display.replace(/[—–-]+$/, "").trim();
  if (!title) return draft;
  // Replace the existing Title line (or insert one if somehow missing).
  if (/^\s*title\s*:/im.test(draft)) {
    return draft.replace(/^\s*title\s*:.*$/im, `Title: ${title}`);
  }
  return `Title: ${title}\n${draft}`;
}

/** Plain writer-voice guidance from failed check ids (plan: never paste raw checker strings). */
const GUIDANCE: Record<string, string> = {
  "story-fidelity": "use the real details from the story — name the actual places, objects, and moments the writer gave you",
  "hook-placement": "the chorus must be built around the hook — the hook line leads it",
  "chorus-consistency": "the chorus is the same words every time it returns",
  format: "keep the exact Title / SUNO Prompt / Lyrics format with bracketed section tags",
  "leaked-labels": "the lyrics must contain only the song itself — no notes, no labels, no planning talk",
  "banned-phrases": "some lines were stock phrases that belong to no one's story — say the specific true thing instead",
  "central-image": "keep coming back to the one real thing at the center of this song — put it in the listener's hands",
  "artist-names-in-suno": "describe the sound in the production prompt without naming any real artist",
  "adlibs-present": "add the room's adlibs in parentheses where a singer would answer or echo — this song sounds bare without them",
  "performance-tags": "fold this room's delivery into the section headers, like [Chorus: belted] or [Verse: soft]",
  "invalid-tags": "a colon is only valid after a section word ([Chorus: belted]); remove invented tags like [Energy: High]",
  "tags-own-line": "every square-bracket tag goes on its own line, never inside a lyric line",
  "verse-substance": "make the verses carry the story — as long as the chorus or longer, each adding new specific detail, never thin 4-line verses under a big hook",
  "empty-tags": "don't stack delivery tags on empty lines — fold them into the section header like [Chorus: belted]",
};

function guidanceFor(reports: DraftReport[]): string {
  const failed = new Set<string>();
  for (const r of reports) for (const c of r.checks) if (!c.ok && c.severity === "fail") failed.add(c.id);
  const lines = [...failed].map((id) => GUIDANCE[id]).filter(Boolean);
  return lines.join("; ");
}

type SongPlan = {
  pack: GenrePack;
  card: RoomCard;
  landing: Landing;
  landingNote: string;
  brief: Brief;
  story: string;
  /** hook candidates, best first (empty when the user brought their own title) */
  rankedHooks: string[];
};

/** The shared front half: landing → brief → hook candidates. Used by the full engine
 * run AND by the Song Builder's title-ideas step. */
async function planSong(
  curriculum: CompiledCurriculum,
  inputs: EngineInputs,
  generate: EngineGenerate,
  stage: EngineStage
): Promise<SongPlan> {
  const pack = resolveGenre(curriculum, inputs.genre);
  if (!pack) throw new EngineNotAvailable(`no curriculum for genre "${inputs.genre}"`);

  const story = String(inputs.story || "").trim();
  // The Song Builder makes the story optional: picks alone can carry a song.
  if (story.length < 10 && !inputs.theme) {
    throw Object.assign(new Error("Pick a theme or tell us the story first — a few sentences in your own words."), {
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

  // Plan the brief, then enforce the concrete-image law: if the central image is pure
  // abstraction (sun, colors, distance...), re-plan with explicit feedback. Up to 3 tries,
  // then fail loud — a song with no real thing at its center is the greeting-card failure.
  let brief!: Brief;
  let imageFeedback = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    brief = validateBrief(await planJson(generate, briefPrompt(story, card, inputs, imageFeedback)), card, landing);
    if (isConcreteImage(brief.centralImage, curriculum.abstractionWords)) break;
    imageFeedback = `Your last central image "${brief.centralImage}" was too abstract — it named a mood, not a thing. Give ONE real object or place you could photograph (a jacket, a kitchen table, a bus stop, a scar), never a weather/light/feeling word.`;
    if (attempt === 2) {
      throw new EngineFailure(["could not anchor the song to a concrete image"]);
    }
  }

  const userTitle = String(inputs.title || "").trim();
  if (userTitle) {
    return { pack, card, landing, landingNote, brief, story, rankedHooks: [] };
  }

  stage("Writing hooks...");
  const hooksRaw = await planJson(generate, hooksPrompt(story, brief, card, inputs));
  const hooks: string[] = (Array.isArray(hooksRaw) ? hooksRaw : [])
    .map((h: any) => String(h || "").trim())
    .filter((h: string) => h.length > 0 && h.length < 60);
  if (hooks.length < 5) throw new EngineFailure(["hook step returned too few candidates"]);
  const tokens = storyTokens(`${story} ${inputs.theme || ""}`);
  const rankedHooks = hooks
    .map((h, i) => ({ h, score: scoreHook(h, tokens), i }))
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .map((x) => x.h);
  return { pack, card, landing, landingNote, brief, story, rankedHooks };
}

/** Song Builder title ideas: the engine's own hook candidates, best first. */
export async function runTitleIdeas(
  curriculum: CompiledCurriculum,
  inputs: EngineInputs,
  generate: EngineGenerate
): Promise<{ titles: string[]; roomName: string; landingNote: string }> {
  const plan = await planSong(curriculum, { ...inputs, title: undefined }, generate, () => {});
  return { titles: plan.rankedHooks.slice(0, 5), roomName: plan.card.name, landingNote: plan.landingNote };
}

export async function runEngine(
  curriculum: CompiledCurriculum,
  inputs: EngineInputs,
  generate: EngineGenerate,
  stage: EngineStage = () => {}
): Promise<EngineResult> {
  const plan = await planSong(curriculum, inputs, generate, stage);
  const { pack, card, landing, landingNote, brief, story } = plan;
  const userTitle = String(inputs.title || "").trim();
  const hookLocked = userTitle.length > 0;
  const hook = userTitle.slice(0, 80) || plan.rankedHooks[0];

  stage("Planning sections...");
  const sections = validateSections(await planJson(generate, sectionsPrompt(brief, hook, card)));

  // ONE user input produces ONE song (founder order 2026-07-02). The engine writes
  // the song once, straight through; the checks GATE it, they never pick between
  // versions. A failed check earns one more write with plain guidance — then fail-loud.
  const writeOne = async (variant: "straight" | "hook-first", guidance?: string) => {
    const raw = await generate(
      writerPrompt({ core: curriculum.core, pack, card, brief, hook, sections, story, vocals: inputs.vocals, variant, guidance, bannedPhrases: curriculum.bannedPhrases, hookLocked, instrumentation: inputs.instrumentation, language: inputs.language }),
      "write"
    ).catch(() => "");
    if (!raw || raw.includes("GENERATION_DECLINED")) return null;
    // Auto-hooks: make the Title the song's actual chorus hook before checking.
    const draft = hookLocked ? raw : adoptChorusHookAsTitle(raw);
    return {
      draft,
      report: runChecks(draft, {
        story, card, spec: brief.spec, hook,
        centralImage: brief.centralImage,
        bannedPhrases: curriculum.bannedPhrases,
        validTags: curriculum.validTags,
        minAdlibs: card.performance.minAdlibs,
        hookLocked,
      }),
    };
  };

  // ONE song out — but give the write up to 3 internal attempts to clear the code checks,
  // each with plain guidance from the last failure, before failing loud. (Heavy rooms like
  // 90s R&B juggle the most constraints and occasionally need the extra pass.)
  const variants: Array<"straight" | "hook-first"> = ["straight", "hook-first", "hook-first"];
  const attempted: Array<{ report: DraftReport } | null> = [];
  let winner: { draft: string; report: DraftReport } | null = null;
  let draftsTried = 0;
  for (let i = 0; i < variants.length; i++) {
    stage(i === 0 ? "Writing your song..." : "Not quite — refining the performance...");
    const guidance = i === 0 ? undefined : guidanceFor((attempted.filter(Boolean) as Array<{ report: DraftReport }>).map((a) => a.report)) || undefined;
    const attempt = await writeOne(variants[i], guidance);
    attempted.push(attempt);
    if (attempt) {
      draftsTried += 1;
      if (attempt.report.failCount === 0) { winner = attempt; break; }
    }
  }
  if (!winner) {
    const reports = attempted.filter(Boolean) as Array<{ report: DraftReport }>;
    const reasons = [...new Set(reports.flatMap((a) => a.report.checks.filter((c) => !c.ok && c.severity === "fail").map((c) => c.id)))];
    throw new EngineFailure(reasons.length ? reasons : ["the writer declined the request"]);
  }

  // The hook the listener actually gets is the winning draft's own Title (the writer
  // may have sharpened the suggested hook), so report that.
  const winnerTitle = (winner.draft.match(/^\s*title\s*:\s*(.+)$/im)?.[1] || hook).trim();

  return {
    text: winner.draft.trim(),
    meta: {
      engineVersion: ENGINE_VERSION,
      curriculumHash: curriculum.hash,
      landing,
      landingNote,
      hook: winnerTitle,
      brief,
      draftsTried,
      winnerWarnings: winner.report.warnCount,
    },
  };
}
