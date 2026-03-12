type ReferenceFeatureProfile = {
  key: string;
  genre: string;
  subGenre: string;
  corpusSize: number;
  structurePatterns: string[];
  hookPatterns: string[];
  cadenceGuidance: string[];
  rhymeGuidance: string[];
  dictionGuidance: string[];
  adlibGuidance: string[];
  arrangementGuidance: string[];
};

const DEFAULT_PROFILE: ReferenceFeatureProfile = {
  key: "default",
  genre: "General",
  subGenre: "General",
  corpusSize: 30,
  structurePatterns: ["Verse -> Chorus -> Verse -> Chorus -> Bridge -> Chorus"],
  hookPatterns: ["Hook title repeated with controlled variation"],
  cadenceGuidance: ["Verse cadence denser than chorus", "Stress falls naturally on beat accents"],
  rhymeGuidance: ["Balanced end-rhyme + internal rhyme", "Avoid long unrhymed prose runs"],
  dictionGuidance: ["Concrete imagery over generic abstractions", "Keep register culturally coherent"],
  adlibGuidance: ["Use adlibs sparingly where performance lift is needed"],
  arrangementGuidance: ["Clear section contrast", "Final chorus should feel larger than first chorus"],
};

const PROFILES: ReferenceFeatureProfile[] = [
  {
    key: "pop::dance pop",
    genre: "Pop",
    subGenre: "Dance Pop",
    corpusSize: 45,
    structurePatterns: [
      "Intro -> Verse -> Pre-Chorus -> Chorus -> Verse -> Pre-Chorus -> Chorus -> Bridge -> Final Chorus",
      "Verse -> Chorus -> Verse -> Chorus -> Post-Chorus -> Bridge -> Final Chorus",
    ],
    hookPatterns: ["High repetition in chorus", "Short title-centric motif"],
    cadenceGuidance: ["Tight, even line lengths in chorus", "Verse lines carry more narrative detail"],
    rhymeGuidance: ["Strong chorus end-rhyme clarity", "Internal rhyme used lightly in verses"],
    dictionGuidance: ["Simple, vivid phrases", "Avoid over-complex metaphors"],
    adlibGuidance: ["Adlibs mostly in pre-chorus/chorus transitions"],
    arrangementGuidance: ["Build/drop contour", "Pre-chorus tension before chorus payoff"],
  },
  {
    key: "hip hop::trap",
    genre: "Hip-Hop",
    subGenre: "Trap",
    corpusSize: 50,
    structurePatterns: [
      "Hook -> Verse -> Hook -> Verse -> Hook",
      "Intro -> Hook -> Verse -> Hook -> Bridge/Break -> Hook",
    ],
    hookPatterns: ["Chant-like hook phrases", "Rhythmic repetition over harmonic complexity"],
    cadenceGuidance: ["Triplet-capable phrasing", "Clear pocket shift between hook and verse"],
    rhymeGuidance: ["High internal rhyme density in verses", "Hook rhyme can be simpler and punchier"],
    dictionGuidance: ["Direct, scene-specific language", "Avoid filler bars"],
    adlibGuidance: ["Frequent short adlibs in pocket gaps", "Avoid cluttering every line"],
    arrangementGuidance: ["808/sub as spine", "Section contrast via drum density and space"],
  },
  {
    key: "r b::neo soul",
    genre: "R&B",
    subGenre: "Neo-Soul",
    corpusSize: 36,
    structurePatterns: [
      "Verse -> Pre-Chorus -> Chorus -> Verse -> Chorus -> Bridge -> Chorus",
      "Intro -> Verse -> Chorus -> Verse -> Chorus -> Outro",
    ],
    hookPatterns: ["Melodic hook with phrase variations", "Emotional lift in later chorus passes"],
    cadenceGuidance: ["Conversational verse cadence", "Longer vowel sustain in chorus lines"],
    rhymeGuidance: ["Soft end-rhyme + internal echoes", "Avoid rigid nursery-rhyme symmetry"],
    dictionGuidance: ["Sensory details and intimacy", "Natural spoken register"],
    adlibGuidance: ["Tasteful vocal responses in parentheses", "Layered adlibs near transitions"],
    arrangementGuidance: ["Pocket first, harmony second", "Bridge should pivot emotional intensity"],
  },
  {
    key: "regional mexican::general",
    genre: "Regional Mexican",
    subGenre: "General",
    corpusSize: 28,
    structurePatterns: [
      "Intro -> Verse -> Chorus -> Verse -> Chorus -> Outro",
      "Verse -> Chorus -> Verse -> Chorus -> Bridge -> Chorus",
    ],
    hookPatterns: ["Narrative refrain hooks", "Title phrase anchors each chorus"],
    cadenceGuidance: ["Story-led verse pacing", "Chorus cadence broadens for singalong"],
    rhymeGuidance: ["Consistent end-rhyme families", "Internal rhyme used for emphasis not density"],
    dictionGuidance: ["Place-anchored imagery", "Avoid tourist-stereotype references"],
    adlibGuidance: ["Minimal adlibs, mostly performance accents"],
    arrangementGuidance: ["Instrument motifs reinforce hook identity", "Outros resolve narrative stance"],
  },
];

function normalizeKey(value?: string): string {
  return (value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function selectProfile(genre?: string, subGenre?: string): ReferenceFeatureProfile {
  const g = normalizeKey(genre);
  const sg = normalizeKey(subGenre || "general");
  const exact = PROFILES.find((profile) => normalizeKey(profile.genre) === g && normalizeKey(profile.subGenre) === sg);
  if (exact) return exact;
  const byGenre = PROFILES.find((profile) => normalizeKey(profile.genre) === g);
  return byGenre || DEFAULT_PROFILE;
}

export function buildReferenceFeatureBlock(params: { genre?: string; subGenre?: string; language?: string }): string {
  const profile = selectProfile(params.genre, params.subGenre);
  return `
Reference feature library (non-lyric feature extraction corpus):
- Corpus size: ${profile.corpusSize} songs
- Target language/register: ${params.language || "English"} genre-appropriate natural register
- Structure patterns: ${profile.structurePatterns.join(" | ")}
- Hook patterns: ${profile.hookPatterns.join(" | ")}
- Cadence guidance: ${profile.cadenceGuidance.join(" | ")}
- Rhyme guidance: ${profile.rhymeGuidance.join(" | ")}
- Diction guidance: ${profile.dictionGuidance.join(" | ")}
- Adlib guidance: ${profile.adlibGuidance.join(" | ")}
- Arrangement guidance: ${profile.arrangementGuidance.join(" | ")}
  `.trim();
}

export function getReferenceFeatureScore(params: {
  songText: string;
  genre?: string;
  subGenre?: string;
}): number {
  const profile = selectProfile(params.genre, params.subGenre);
  const lower = (params.songText || "").toLowerCase();
  const hasChorus = /\[chorus(\s*\d+)?\]/i.test(params.songText);
  const hasVerse = /\[verse(\s*\d+)?\]/i.test(params.songText);
  const hasBridge = /\[bridge(\s*\d+)?\]/i.test(params.songText);
  const adlibs = (params.songText.match(/\([^)\n]{1,80}\)/g) || []).length;
  const structureScore = [hasChorus, hasVerse, hasBridge].filter(Boolean).length / 3;
  const hookSignal = (lower.match(/\[chorus/gi) || []).length >= 2 ? 1 : 0.5;
  const adlibTarget = profile.adlibGuidance.some((x) => x.toLowerCase().includes("minimal")) ? 2 : 4;
  const adlibScore = Math.max(0, Math.min(1, adlibs / adlibTarget));
  return Math.max(0, Math.min(100, Math.round(55 + structureScore * 18 + hookSignal * 15 + adlibScore * 12)));
}
