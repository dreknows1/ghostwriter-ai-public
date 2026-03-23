export type { GenreGuide, SubGenreProfile, SubGenreEmbodiedDelta } from './types';

// English-language genre guides
export { POP_GUIDE } from './pop';
export { HIP_HOP_GUIDE } from './hip-hop';
export { RNB_GUIDE } from './rnb';
export { ROCK_GUIDE } from './rock';
export { COUNTRY_GUIDE } from './country';
export { EDM_GUIDE } from './edm';
export { METAL_GUIDE } from './metal';
export { SOUL_GUIDE } from './soul';
export { BLUES_GUIDE } from './blues';
export { JAZZ_GUIDE } from './jazz';
export { FOLK_GUIDE } from './folk';
export { GOSPEL_GUIDE } from './gospel';
export { AFROBEATS_GUIDE } from './afrobeats';
export { REGGAE_GUIDE } from './reggae';

// Language-specific genre guides
export { ITALIAN_GUIDE } from './italian';
export { FRENCH_GUIDE } from './french';
export { LATIN_GUIDE } from './latin';
export { JPOP_GUIDE } from './jpop';
export { KPOP_GUIDE } from './kpop';
export { BRAZILIAN_GUIDE } from './brazilian';
export { MANDOPOP_GUIDE } from './mandopop';
export { GERMAN_GUIDE } from './german';
export { ARABIC_GUIDE } from './arabic';
export { HINDI_GUIDE } from './hindi';
export { SWAHILI_GUIDE } from './swahili';

import type { GenreGuide } from './types';
import { POP_GUIDE } from './pop';
import { HIP_HOP_GUIDE } from './hip-hop';
import { RNB_GUIDE } from './rnb';
import { ROCK_GUIDE } from './rock';
import { COUNTRY_GUIDE } from './country';
import { EDM_GUIDE } from './edm';
import { METAL_GUIDE } from './metal';
import { SOUL_GUIDE } from './soul';
import { BLUES_GUIDE } from './blues';
import { JAZZ_GUIDE } from './jazz';
import { FOLK_GUIDE } from './folk';
import { GOSPEL_GUIDE } from './gospel';
import { AFROBEATS_GUIDE } from './afrobeats';
import { REGGAE_GUIDE } from './reggae';
import { ITALIAN_GUIDE } from './italian';
import { FRENCH_GUIDE } from './french';
import { LATIN_GUIDE } from './latin';
import { JPOP_GUIDE } from './jpop';
import { KPOP_GUIDE } from './kpop';
import { BRAZILIAN_GUIDE } from './brazilian';
import { MANDOPOP_GUIDE } from './mandopop';
import { GERMAN_GUIDE } from './german';
import { ARABIC_GUIDE } from './arabic';
import { HINDI_GUIDE } from './hindi';
import { SWAHILI_GUIDE } from './swahili';

/** All genre guides in a single array */
export const ALL_GUIDES: GenreGuide[] = [
  POP_GUIDE,
  HIP_HOP_GUIDE,
  RNB_GUIDE,
  ROCK_GUIDE,
  COUNTRY_GUIDE,
  EDM_GUIDE,
  METAL_GUIDE,
  SOUL_GUIDE,
  BLUES_GUIDE,
  JAZZ_GUIDE,
  FOLK_GUIDE,
  GOSPEL_GUIDE,
  AFROBEATS_GUIDE,
  REGGAE_GUIDE,
  ITALIAN_GUIDE,
  FRENCH_GUIDE,
  LATIN_GUIDE,
  JPOP_GUIDE,
  KPOP_GUIDE,
  BRAZILIAN_GUIDE,
  MANDOPOP_GUIDE,
  GERMAN_GUIDE,
  ARABIC_GUIDE,
  HINDI_GUIDE,
  SWAHILI_GUIDE,
];

/** Lookup a genre guide by its id (e.g., 'pop', 'latin', 'jpop') */
export function getGuideById(id: string): GenreGuide | undefined {
  return ALL_GUIDES.find((g) => g.id === id);
}

/** Lookup all genre guides for a given language (e.g., 'English', 'Spanish') */
export function getGuidesByLanguage(language: string): GenreGuide[] {
  return ALL_GUIDES.filter(
    (g) => g.language.toLowerCase() === language.toLowerCase()
  );
}

/** Get all available genre IDs */
export function getAllGenreIds(): string[] {
  return ALL_GUIDES.map((g) => g.id);
}

/** Get all available languages (deduplicated) */
export function getAllLanguages(): string[] {
  return Array.from(new Set(ALL_GUIDES.map((g) => g.language)));
}

/**
 * Normalize a string for fuzzy matching: lowercase, strip spaces/hyphens.
 * Mirrors the pattern from genreAgents.ts.
 */
function normalizeKey(s: string): string {
  return s.toLowerCase().replace(/[\s\-_]+/g, "");
}

/**
 * Resolve a genre guide with sub-genre-specific overrides merged in.
 * If no matching sub-genre or no embodiedDelta, returns the guide unchanged.
 * Delta fields override at the property level (not deep-nested); array fields replace entirely.
 */
export function resolveSubGenreGuide(
  guide: GenreGuide,
  subGenreName: string
): GenreGuide {
  if (!subGenreName) return guide;

  const norm = normalizeKey(subGenreName);
  const matchedSub =
    guide.subGenres.find((s) => normalizeKey(s.name) === norm) ||
    guide.subGenres.find((s) => normalizeKey(s.name).includes(norm) || norm.includes(normalizeKey(s.name)));

  if (!matchedSub?.embodiedDelta) return guide;

  const delta = matchedSub.embodiedDelta;
  const resolved = { ...guide };

  // Merge each dimension: spread genre defaults, then override with delta fields
  const dimensionKeys = [
    "microTimingAndFeel",
    "silenceAndSpace",
    "callAndResponse",
    "regionalDialectSpecificity",
    "performancePractice",
    "socioeconomicSubtext",
    "intertextualityAndSampling",
    "genderAndBodyConventions",
    "tempoFeelVsNumber",
    "mistakeConventions",
    "sonicPalette",
    "rhythmAndGroove",
    "harmonicLanguage",
    "songStructure",
    "vocalDelivery",
    "lyricalConventions",
    "productionFingerprint",
    "instrumentation",
  ] as const;

  for (const key of dimensionKeys) {
    const deltaValue = delta[key];
    if (deltaValue) {
      (resolved as any)[key] = { ...(guide as any)[key], ...deltaValue };
    }
  }

  return resolved;
}
