/**
 * The LLM "house style" lexicon — words and phrases AI models reach for in every
 * song regardless of genre. Research: a study of 5,700 AI poems found the same
 * narrow vocabulary every time; successful community prompts ban it UP FRONT.
 * Exact words/phrases only — never topics (banning topics sterilizes writing).
 */

export const BANNED_WORDS: string[] = [
  // The classic AI-poem furniture
  "neon", "echo", "echoes", "echoing", "whisper", "whispers", "whispering", "whispered",
  "shadows", "shadow", "embrace", "symphony", "tapestry", "canvas", "kaleidoscope",
  "labyrinth", "hollow", "soar", "soaring", "shimmer", "shimmering", "glimmer",
  "glimmering", "gossamer", "ethereal", "luminous", "radiant", "celestial", "infinite",
  "eternity", "eternal", "abyss", "void", "veil", "veins", "ignite", "ignited",
  "unspoken", "unseen", "untold", "silhouette", "silhouettes", "twilight", "dusk's",
  "moonlit", "starlit", "stardust", "cosmic", "universe", "galaxies", "constellation",
  "phoenix", "wildfire", "inferno", "embers", "ember", "ashes of",
  // Motivational-poster verbs and nouns
  "unbreakable", "unstoppable", "masterpiece", "warrior", "conqueror",
  // Cliché rhyme-bait
  "fire in my soul", "deep inside my soul", "in my veins", "through my veins",
];

export const BANNED_PHRASES: string[] = [
  "shine bright", "rise above", "spread my wings", "spread your wings",
  "dreams come true", "believe in yourself", "find my voice", "found my voice",
  "stand tall", "hold my head high", "hold your head high", "the world is mine",
  "the world is yours", "never give up", "don't give up", "you got this",
  "light up the night", "burning bright", "set my soul on fire", "heart of gold",
  "diamond in the rough", "story left untold", "chapter of my life",
  "dancing in the rain", "city lights", "neon lights", "test of time",
  "shoulder to cry on", "wear my heart on my sleeve",
];

/** Grammar traps LLMs write colloquially that read as errors in a lyric sheet. */
export const GRAMMAR_FIXES: Array<[RegExp, string]> = [
  [/\bshould of\b/gi, "should've"],
  [/\bcould of\b/gi, "could've"],
  [/\bwould of\b/gi, "would've"],
  [/\bmust of\b/gi, "must've"],
];

/** Internal labels that must never leak from planning/prompting into lyrics. */
export const LEAK_MARKERS: RegExp[] = [
  /\bHOOK\s*[—:-]/i,
  /\bSTORY\s*[—:-]/,
  /\bSECTIONS\s*[—:-]/,
  /\bYOUR PLAN\b/i,
  /\bcraft note/i,
  /^\s*Catchy,/im, // the exact historical leak: plan label read as a name
];

export function findBannedHits(lyrics: string): string[] {
  const lower = lyrics.toLowerCase();
  const hits: string[] = [];
  for (const w of BANNED_WORDS) {
    const re = new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (re.test(lower)) hits.push(w);
  }
  for (const p of BANNED_PHRASES) {
    if (lower.includes(p)) hits.push(p);
  }
  return hits;
}

/** Render the ban list for inclusion in a writing prompt (compact). */
export function bannedLexiconPromptBlock(): string {
  return [
    `NEVER use these words/phrases (AI-cliché house style — automatic failure):`,
    BANNED_WORDS.join(", "),
    `Banned phrases: ${BANNED_PHRASES.join("; ")}`,
    `Also banned: "should of / could of / would of" (write should've/could've/would've).`,
  ].join("\n");
}
