// Shared types for the curriculum engine (Phase 1 — R&B).
// The curriculum documents are the source of truth; scripts/compile-curriculum.mjs
// turns them into server/engine/curriculum.generated.ts at build time.
// SONGWRITING_ENGINE_PLAN.md governs everything here.

/** One sub-genre page ("room") compiled from SONGWRITING_SUBGENRES.md. */
export type RoomCard = {
  /** stable kebab-case id, e.g. "contemporary-rnb" */
  id: string;
  name: string;
  /** the italic picker one-liner */
  oneLine: string;
  /** tempo range + groove feel + word density, verbatim from the page */
  tempoGroove: string;
  /** the "How the writing changes" bullets, verbatim */
  writingDials: string[];
  /** the Suno production-prompt paragraph */
  rendering: string;
  storyFit: string;
  parodyTraps: string;
  /** Song Builder data: instrument palette + which themes/purposes fit this room (UI concern, never in the writer slice) */
  builder?: {
    instruments: string[];
    themes: string[];
    purposes: string[];
  };
  /** Layer 6 performance policy for this room (tags & adlibs) */
  performance: {
    /** the writer-facing "How it performs" prose */
    prose: string;
    adlibDensity: "sparse" | "moderate" | "heavy";
    /** the code floor: a real song in this room needs at least this many adlibs */
    minAdlibs: number;
    /** the real Suno delivery/dynamics tags that fit this room, e.g. ["[Soft]","[Sax Solo]"] */
    deliveryTags: string[];
  };
};

/** A landing cue from the Composer Profile, marked strong or weak. */
export type CueMark = {
  /** lowercase match phrase or short pattern, e.g. "situationship" */
  cue: string;
  strength: "strong" | "weak";
  roomId: string;
};

/** Everything the engine knows about one genre. */
export type GenrePack = {
  /** stable id, e.g. "rnb" */
  id: string;
  /** display name + aliases users might type, lowercase, e.g. ["r&b", "rnb", "r and b"] */
  name: string;
  aliases: string[];
  /** genre-level writing profile text (from SONGWRITING_PROFILE_RNB.md) */
  profileText: string;
  defaultRoomId: string;
  rooms: RoomCard[];
  cues: CueMark[];
};

export type CompiledCurriculum = {
  /** universal writer core compiled from SONGWRITING_BRAIN.md */
  core: string;
  /** the founder's house-style ban list (BRAIN Layer 3) — any hit fails the draft */
  bannedPhrases: string[];
  /** abstraction words (BRAIN Layer 2) — a central image made only of these is rejected */
  abstractionWords: string[];
  /** the only Suno tags the renderer reads (BRAIN Layer 6) — anything else is invalid */
  validTags: string[];
  /** per-genre questionnaire worlds (SONGWRITING_GENRES.md) — themes/purposes/instruments; UI concern */
  genreBuilder?: Record<string, { themes: string[]; purposes: string[]; instruments: string[] }>;
  genres: Record<string, GenrePack>;
  /** sha256 of all source docs — reported on /api/health as curriculumHash */
  hash: string;
  /** rough size accounting (chars/4) so the budget check is visible */
  approxTokens: { core: number; largestSlice: number };
};

/** How the engine landed on a room (plan Step 1a — always logged, always shown). */
export type Landing = {
  roomId: string;
  rule: "picked" | "inferred" | "defaulted";
  /** the cues that fired, empty for picked/defaulted */
  firedCues: string[];
  /** true when the pick had no page and fell to a parent */
  notYetDeep: boolean;
};

/** Per-song musical spec (defaults come from the room card). */
export type MusicalSpec = {
  tempo: string;
  groove: string;
  barsPerSection?: string;
  wordDensity: string;
};

/** The Step-1 brief — structured data, never prose. Every field code-checked. */
export type Brief = {
  coreEmotion: string;
  purpose: string;
  pov: string;
  turn: string;
  /** ONE ordinary physical image the song returns to — from the story when there is
   * one, universal for the theme when there isn't. Code-checked: it must actually
   * appear (twice) in the lyrics. This is the anti-greeting-card enforcement. */
  centralImage: string;
  spec: MusicalSpec;
  landing: Landing;
};

export type CheckResult = {
  id: string;
  ok: boolean;
  /** "fail" blocks shipping a draft; "warn" only ranks passing drafts */
  severity: "fail" | "warn";
  detail?: string;
};

export type DraftReport = {
  checks: CheckResult[];
  failCount: number;
  warnCount: number;
};
