import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import { GoogleGenAI } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

const ASK_ANDRE_AUDIT_CONTEXT = `
You are "Ask Andre" inside SongGhost.
App mission: help users write culturally authentic, genre-accurate songs with guided prompts and revisions.
Core areas: auth/login, members tier logic, studio generation/revision, quality scoring 85+, song history, profile/avatar, billing/credits, discounts, Gemini key setup.
Rules: keep answers short/direct, never reveal private data (API keys/tokens/passwords/personal account details/internal IDs), ask clarifying question, and end with "Is there anything else I can help you with?"
`.trim();

export const config = {
  runtime: "nodejs",
  maxDuration: 300,
};

type AIAction =
  | "generateSong"
  | "editSong"
  | "structureImportedSong"
  | "generateDynamicOptions"
  | "generateAlbumArt"
  | "generateSocialPack"
  | "translateLyrics"
  | "askAndre";

type WritingProfile = {
  language: string;
  languageVariant: string;
  cultureRegion: string;
  register: string;
  slang: string;
  codeSwitchPolicy: string;
  authenticityGuardrails: string;
};

type GenreProfile = {
  genre: string;
  defaultStructure: string;
  prosody: string;
  rhymeGuidance: string;
  hookGuidance: string;
  lexiconPolicy: string;
};

type SubgenreSonicProfile = {
  subGenre: string;
  bpmRange: string;
  groove: string;
  instrumentation: string;
  productionStyle: string;
  arrangement: string;
};

type CulturalLogicModule = {
  getGenreProfile: (genre?: string) => GenreProfile;
  getSubgenreSonicProfile: (subGenre?: string) => SubgenreSonicProfile | null;
  inferWritingProfile: (inputs: {
    language?: string;
    genre?: string;
    subGenre?: string;
    allowCodeSwitch?: boolean;
    register?: "clean" | "radio" | "explicit";
  }) => WritingProfile;
  LANGUAGE_PROFILES: Record<string, { notes?: string }>;
};

type MetaTagModule = {
  buildMetaTagGuidance: (inputs: {
    genre?: string;
    subGenre?: string;
    vocals?: string;
    emotion?: string;
  }) => string;
  buildMetaTagPlan?: (inputs: {
    genre?: string;
    subGenre?: string;
    vocals?: string;
    emotion?: string;
  }) => {
    structureTags: string[];
    vocalTypeTag: string;
    moodEnergyTags: string[];
    genreAccentTags: string[];
    adlibPolicy: string;
    minTagCount: number;
    minAdlibCount: number;
    requiredAccentHits: number;
    requiredMoodHits: number;
    requireVocalTypeTag: boolean;
  };
  buildStrictMetaTagSpec?: (inputs: {
    genre?: string;
    subGenre?: string;
    vocals?: string;
    emotion?: string;
  }) => string;
};

type GenreAgentModule = {
  buildGenreAgentDirectives: (params: {
    genre?: string;
    subGenre?: string;
    language?: string;
    vocals?: string;
    instrumentation?: string;
    emotion?: string;
    scene?: string;
    audioEnv?: string;
  }) => {
    hasAgent: boolean;
    agentId?: string;
    subgenreMatched?: string;
    sunoPromptDirectives: string;
    lyricDirectives: string;
  };
  buildGenreReferenceBlueprint?: (params: {
    genre?: string;
    subGenre?: string;
    language?: string;
    vocals?: string;
  }) => {
    hasAgent: boolean;
    agentId?: string;
    promptBlock: string;
    structureModel: string;
    writingStyle: string;
    rhymeCadenceModel: string;
    languageRegisterModel: string;
    hookModel: string;
    arrangementModel: string;
    guardrails: string[];
  };
};

type ReferenceFeaturesModule = {
  buildReferenceFeatureBlock: (params: { genre?: string; subGenre?: string; language?: string }) => string;
  getReferenceFeatureScore: (params: { songText: string; genre?: string; subGenre?: string }) => number;
};

type GenreGuideModule = {
  getGuideById: (id: string) => import("../lib/guides/types").GenreGuide | undefined;
  getGuidesByLanguage: (language: string) => import("../lib/guides/types").GenreGuide[];
  resolveSubGenreGuide: (guide: import("../lib/guides/types").GenreGuide, subGenreName: string) => import("../lib/guides/types").GenreGuide;
  ALL_GUIDES: import("../lib/guides/types").GenreGuide[];
};

type MetaTagPlan = {
  structureTags: string[];
  vocalTypeTag: string;
  moodEnergyTags: string[];
  genreAccentTags: string[];
  adlibPolicy: string;
  minTagCount: number;
  minAdlibCount: number;
  requiredAccentHits: number;
  requiredMoodHits: number;
  requireVocalTypeTag: boolean;
};

type MetaTagPackage = {
  guidance: string;
  strictSpec: string;
  plan: MetaTagPlan;
};

const DEFAULT_GENRE_PROFILE: GenreProfile = {
  genre: "Pop",
  defaultStructure: "Verse -> Chorus -> Verse -> Chorus -> Bridge -> Chorus",
  prosody: "Natural stress patterns and singable lines.",
  rhymeGuidance: "Use clear end-rhyme with occasional internal rhyme.",
  hookGuidance: "Memorable, repeatable chorus phrase.",
  lexiconPolicy: "Contemporary, concrete language with minimal cliches.",
};

const DEFAULT_WRITING_PROFILE: WritingProfile = {
  language: "English",
  languageVariant: "English (contemporary, neutral)",
  cultureRegion: "US/Canada",
  register: "radio",
  slang: "light",
  codeSwitchPolicy: "Do not code-switch unless requested.",
  authenticityGuardrails:
    "Use natural phrasing, avoid stereotypes, avoid tokenized dialect or caricature.",
};

const DEFAULT_SUBGENRE_PROFILE: SubgenreSonicProfile = {
  subGenre: "Modern",
  bpmRange: "90-130",
  groove: "Steady, genre-coherent pulse",
  instrumentation: "Genre-appropriate instrumentation",
  productionStyle: "Modern, clear mix",
  arrangement: "Strong verse/chorus contrast",
};

let culturalLogicPromise: Promise<CulturalLogicModule | null> | null = null;
let metaTagModulePromise: Promise<MetaTagModule | null> | null = null;
let genreAgentModulePromise: Promise<GenreAgentModule | null> | null = null;
let referenceFeaturesModulePromise: Promise<ReferenceFeaturesModule | null> | null = null;
let genreGuideModulePromise: Promise<GenreGuideModule | null> | null = null;

async function loadCulturalLogicModule(): Promise<CulturalLogicModule | null> {
  if (!culturalLogicPromise) {
    culturalLogicPromise = (async () => {
      try {
        return (await import("../lib/culturalLogic")) as unknown as CulturalLogicModule;
      } catch (e1) {
        try {
          return (await import("../lib/culturalLogic.ts")) as unknown as CulturalLogicModule;
        } catch (e2) {
          console.error("Failed to load culturalLogic module:", e1, e2);
          return null;
        }
      }
    })();
  }
  return culturalLogicPromise;
}

async function loadMetaTagModule(): Promise<MetaTagModule | null> {
  if (!metaTagModulePromise) {
    metaTagModulePromise = (async () => {
      try {
        return (await import("../lib/metaTagLibrary")) as unknown as MetaTagModule;
      } catch (e1) {
        try {
          return (await import("../lib/metaTagLibrary.ts")) as unknown as MetaTagModule;
        } catch (e2) {
          console.error("Failed to load metaTagLibrary module:", e1, e2);
          return null;
        }
      }
    })();
  }
  return metaTagModulePromise;
}

async function loadGenreAgentModule(): Promise<GenreAgentModule | null> {
  if (!genreAgentModulePromise) {
    genreAgentModulePromise = (async () => {
      try {
        return (await import("../lib/genreAgents")) as unknown as GenreAgentModule;
      } catch (e1) {
        try {
          return (await import("../lib/genreAgents.ts")) as unknown as GenreAgentModule;
        } catch (e2) {
          console.error("Failed to load genreAgents module:", e1, e2);
          return null;
        }
      }
    })();
  }
  return genreAgentModulePromise;
}

async function loadReferenceFeaturesModule(): Promise<ReferenceFeaturesModule | null> {
  if (!referenceFeaturesModulePromise) {
    referenceFeaturesModulePromise = (async () => {
      try {
        return (await import("../lib/referenceFeatures")) as unknown as ReferenceFeaturesModule;
      } catch (e1) {
        try {
          return (await import("../lib/referenceFeatures.ts")) as unknown as ReferenceFeaturesModule;
        } catch (e2) {
          console.error("Failed to load referenceFeatures module:", e1, e2);
          return null;
        }
      }
    })();
  }
  return referenceFeaturesModulePromise;
}

async function loadGenreGuideModule(): Promise<GenreGuideModule | null> {
  if (!genreGuideModulePromise) {
    genreGuideModulePromise = (async () => {
      try {
        return (await import("../lib/guides")) as unknown as GenreGuideModule;
      } catch (e1) {
        try {
          return (await import("../lib/guides/index.ts")) as unknown as GenreGuideModule;
        } catch (e2) {
          console.error("Failed to load genre guides module:", e1, e2);
          return null;
        }
      }
    })();
  }
  return genreGuideModulePromise;
}

function fallbackMetaTagGuidance(inputs: any): string {
  const genre = inputs?.genre || "Pop";
  const subGenre = inputs?.subGenre || "Modern";
  return `
Meta Tag Library directives (fallback mode):
- Use clear section tags such as [Intro], [Verse], [Pre-Chorus], [Chorus], [Bridge], [Outro].
- Keep tags musically meaningful and avoid over-tagging.
- Use occasional adlibs in parentheses, only where rhythm and delivery benefit.
- Keep adlibs genre-appropriate for ${genre}/${subGenre}.
- Place performance cues inside section lines too (word/phrase/line level), not only at section boundaries.
  `.trim();
}

function fallbackMetaTagPlan(inputs: any): MetaTagPlan {
  const genre = String(inputs?.genre || "Pop").toLowerCase();
  const vocal = String(inputs?.vocals || "").toLowerCase();
  const heavyAdlib = genre.includes("hip-hop") || genre.includes("rap") || genre.includes("trap") || genre.includes("afrobeats");
  const mediumAdlib = genre.includes("r&b") || genre.includes("soul") || genre.includes("gospel") || genre.includes("reggae");
  const vocalTypeTag = vocal.includes("female")
    ? "[Vocalist: Female]"
    : vocal.includes("duet") || vocal.includes("duo")
      ? "[Vocalist: Duet]"
      : vocal.includes("group") || vocal.includes("choir")
        ? "[Vocalist: Group]"
        : "[Vocalist: Male]";
  return {
    structureTags: ["[Intro]", "[Verse]", "[Pre-Chorus]", "[Chorus]", "[Verse]", "[Chorus]", "[Bridge]", "[Chorus]", "[Outro]"],
    vocalTypeTag,
    moodEnergyTags: [],
    genreAccentTags: ["[Build Up]"],
    adlibPolicy: "Use tasteful adlibs in parentheses where musically useful.",
    minTagCount: 10,
    minAdlibCount: heavyAdlib ? 6 : mediumAdlib ? 4 : 2,
    requiredAccentHits: heavyAdlib || mediumAdlib ? 2 : 1,
    requiredMoodHits: 1,
    requireVocalTypeTag: true,
  };
}

function fallbackStrictMetaTagSpec(inputs: any): string {
  const plan = fallbackMetaTagPlan(inputs);
  return `
Strict meta-tag orchestration plan:
- Default section order (adjust if user requests a different structure): ${plan.structureTags.join(" -> ")}
- Required vocal identity tag: ${plan.vocalTypeTag}
- Genre/subgenre accent tags to include naturally: ${plan.genreAccentTags.join(", ")}
- Minimum section-level bracket tags in Lyrics body: ${plan.minTagCount}
- Minimum adlibs in parentheses: ${plan.minAdlibCount}
- Required vocal identity tag must appear in Lyrics: ${plan.requireVocalTypeTag ? "yes" : "no"}
- Adlib policy: ${plan.adlibPolicy}
- Tag placement: bracket tags go on their OWN line as section headers ONLY (e.g. [Verse 1], [Chorus], [Bridge], [Build Up]). NEVER put bracket tags inline within a lyric line — Suno ignores them there.
- Adlibs in parentheses may appear inline within lyric lines where musically natural. Keep them sparse — max 30% of lines. They should feel like a real performer's ad-libs, not annotations.
- NEVER invent performance-direction tags like [Vocals: Confident], [Energy: High], [Harmonies swell], [Drums hit harder], [Mood: Intense]. These are not valid Suno tags and clutter the output.
- Valid bracket tags are ONLY: section headers ([Intro], [Verse], [Verse 2], [Pre-Chorus], [Chorus], [Bridge], [Outro], [Build Up]), vocal identity ([Vocalist: Male/Female/Duet/Group]), and choir cues ([Choir enters]). Nothing else.
  `.trim();
}

async function getMetaTagPackage(inputs: any): Promise<MetaTagPackage> {
  const mod = await loadMetaTagModule();
  if (mod?.buildMetaTagGuidance && typeof mod.buildMetaTagGuidance === "function") {
    const guidance = mod.buildMetaTagGuidance(inputs || {});
    const plan =
      typeof mod.buildMetaTagPlan === "function"
        ? mod.buildMetaTagPlan(inputs || {})
        : fallbackMetaTagPlan(inputs || {});
    const strictSpec = buildStrictSpecFromPlan(plan);
    return { guidance, strictSpec, plan };
  }
  const plan = fallbackMetaTagPlan(inputs || {});
  return {
    guidance: fallbackMetaTagGuidance(inputs || {}),
    strictSpec: buildStrictSpecFromPlan(plan),
    plan,
  };
}

async function getGenreAgentDirectives(inputs: any) {
  const mod = await loadGenreAgentModule();
  if (!mod || typeof mod.buildGenreAgentDirectives !== "function") {
    return {
      hasAgent: false,
      sunoPromptDirectives: "",
      lyricDirectives: "",
    };
  }
  return mod.buildGenreAgentDirectives({
    genre: inputs?.genre,
    subGenre: inputs?.subGenre,
    language: inputs?.language,
    vocals: inputs?.vocals,
    instrumentation: inputs?.instrumentation,
    emotion: inputs?.emotion,
    scene: inputs?.scene,
    audioEnv: inputs?.audioEnv,
  });
}

async function getGenreReferenceBlueprint(inputs: any): Promise<{
  hasAgent: boolean;
  promptBlock: string;
  structureModel: string;
  writingStyle: string;
  rhymeCadenceModel: string;
  languageRegisterModel: string;
  hookModel: string;
  arrangementModel: string;
  guardrails: string[];
}> {
  const mod = await loadGenreAgentModule();
  if (mod?.buildGenreReferenceBlueprint) {
    return mod.buildGenreReferenceBlueprint({
      genre: inputs?.genre,
      subGenre: inputs?.subGenre,
      language: inputs?.language,
      vocals: inputs?.vocals,
    });
  }
  return {
    hasAgent: false,
    promptBlock: "Reference writing blueprint: balanced modern songcraft with strong structure/hook coherence.",
    structureModel: "balanced verse-chorus structure",
    writingStyle: "concrete, coherent, non-cliche writing",
    rhymeCadenceModel: "singable stress alignment with meaningful rhyme texture",
    languageRegisterModel: `${inputs?.language || "English"} native-like contemporary register`,
    hookModel: "memorable hook with controlled repetition",
    arrangementModel: "clear section contrast",
    guardrails: [
      "avoid generic/cliche openers",
      "obey explicit user structure and edit requests",
      "keep vocalist identity consistent with selected vocals",
    ],
  };
}

async function getReferenceFeatureBlock(inputs: any): Promise<string> {
  const mod = await loadReferenceFeaturesModule();
  if (mod?.buildReferenceFeatureBlock) {
    return mod.buildReferenceFeatureBlock({
      genre: inputs?.genre,
      subGenre: inputs?.subGenre,
      language: inputs?.language,
    });
  }
  return "Reference feature library: use proven structure, hook, cadence, and diction patterns for this lane.";
}

async function getReferenceFeatureScore(songText: string, inputs: any): Promise<number> {
  const mod = await loadReferenceFeaturesModule();
  if (mod?.getReferenceFeatureScore) {
    return mod.getReferenceFeatureScore({
      songText,
      genre: inputs?.genre,
      subGenre: inputs?.subGenre,
    });
  }
  return 80;
}

/**
 * Resolve the genre guide with sub-genre deltas merged in.
 * Returns null if no guide found.
 */
async function resolveGuide(inputs: any): Promise<import("../lib/guides/types").GenreGuide | null> {
  const mod = await loadGenreGuideModule();
  if (!mod) return null;

  const genreId = (inputs?.genre || "").toLowerCase().replace(/\s+/g, "-");
  const guide = mod.getGuideById(genreId);
  if (!guide) return null;

  const subGenreName = inputs?.subGenre || "";
  return subGenreName ? mod.resolveSubGenreGuide(guide, subGenreName) : guide;
}

type DirectiveMode = "lyrics" | "structure" | "suno" | "full";

/**
 * Compile a resolved genre guide into imperative DO/DO NOT craft directives.
 * Replaces the old descriptive getGenreGuideContext().
 */
async function compileGuideToDirectives(inputs: any, mode: DirectiveMode): Promise<string> {
  const guide = await resolveGuide(inputs);
  if (!guide) return "";

  const subGenreName = inputs?.subGenre || "";
  const matchedSub = guide.subGenres.find(
    (s) => s.name.toLowerCase() === (subGenreName || "").toLowerCase()
  );

  const sections: string[] = [];

  // ── GROOVE & TIMING ──
  if (mode === "full" || mode === "structure") {
    sections.push([
      `GROOVE & TIMING DIRECTIVES (${guide.name}${matchedSub ? ` / ${matchedSub.name}` : ""}):`,
      `- DO: Target BPM ${guide.rhythmAndGroove.bpmRange.sweet} (range ${guide.rhythmAndGroove.bpmRange.min}–${guide.rhythmAndGroove.bpmRange.max}), feel: ${guide.rhythmAndGroove.feel}`,
      `- DO: Use groove archetype — ${guide.rhythmAndGroove.grooveArchetype}`,
      `- DO: ${guide.microTimingAndFeel.genreSpecificFeel}`,
      `- DO: Beat placement — ${guide.microTimingAndFeel.aheadBehindBeat}`,
      guide.rhythmAndGroove.swing !== "none" ? `- DO: Apply swing — ${guide.rhythmAndGroove.swing}` : "",
      `- DO: Syncopation — ${guide.rhythmAndGroove.syncopation}`,
      `- PSYCHOLOGICAL TEMPO: ${guide.tempoFeelVsNumber.psychologicalTempo}`,
      `- WEIGHT/MOMENTUM: ${guide.tempoFeelVsNumber.weightAndMomentum}`,
    ].filter(Boolean).join("\n"));
  }

  // ── SPACE & TEXTURE ──
  if (mode === "full" || mode === "structure") {
    sections.push([
      `SPACE & TEXTURE DIRECTIVES:`,
      `- DO: ${guide.silenceAndSpace.negativeSpaceRole}`,
      `- DO: Breathing — ${guide.silenceAndSpace.breathingPatterns}`,
      `- DO: Dynamic contrast — ${guide.silenceAndSpace.dynamicContrast}`,
      `- DELIBERATELY ABSENT: ${guide.silenceAndSpace.whatIsDeliberatelyAbsent.join("; ")}`,
      `- DO NOT: Risk overproduction — ${guide.mistakeConventions.overproductionRisks.slice(0, 3).join("; ")}`,
      `- DO: Authentic roughness — ${guide.mistakeConventions.authenticRoughness}`,
      `- CELEBRATED FLAWS: ${guide.mistakeConventions.celebratedFlaws.slice(0, 3).join("; ")}`,
    ].join("\n"));
  }

  // ── LYRIC CRAFT ──
  if (mode === "full" || mode === "lyrics") {
    sections.push([
      `LYRIC CRAFT DIRECTIVES:`,
      `- DO: Perspective — ${guide.lyricalConventions.perspective}`,
      `- DO: Storytelling — ${guide.lyricalConventions.storytellingApproach}`,
      `- DO: Figurative language — ${guide.lyricalConventions.figurativeLanguage}`,
      `- DO: Vocabulary register — ${guide.lyricalConventions.vocabulary}`,
      `- DO: Themes — ${guide.lyricalConventions.themes.slice(0, 5).join(", ")}`,
      `- DO NOT: Use these clichés — ${guide.lyricalConventions.cliches.join("; ")}`,
      `- LINEAGE SIGNIFIERS: ${guide.intertextualityAndSampling.lineageSignifiers.slice(0, 4).join(", ")}`,
      `- SAMPLING TRADITION: ${guide.intertextualityAndSampling.samplingTradition}`,
    ].join("\n"));
  }

  // ── VOCAL DELIVERY ──
  if (mode === "full" || mode === "lyrics") {
    sections.push([
      `VOCAL DELIVERY DIRECTIVES:`,
      `- DO: Phrasing — ${guide.vocalDelivery.phrasing}`,
      `- DO: Affect — ${guide.vocalDelivery.affect}`,
      `- DO: Techniques — ${guide.vocalDelivery.techniques.slice(0, 4).join(", ")}`,
      `- DO: Adlib style — ${guide.vocalDelivery.adlibStyle}`,
      `- DO: Grit level — ${guide.vocalDelivery.grit}`,
      `- REGIONAL ACCENT: ${guide.regionalDialectSpecificity.accentInfluence}`,
      guide.regionalDialectSpecificity.dialectVocabulary.length > 0
        ? `- DIALECT VOCABULARY: ${guide.regionalDialectSpecificity.dialectVocabulary.slice(0, 5).join(", ")}`
        : "",
    ].filter(Boolean).join("\n"));
  }

  // ── STRUCTURE ──
  if (mode === "full" || mode === "structure") {
    sections.push([
      `STRUCTURE DIRECTIVES:`,
      `- FORM: ${guide.songStructure.form}`,
      `- SECTIONS: ${guide.songStructure.sections.join(", ")}`,
      `- HOOK PLACEMENT: ${guide.songStructure.hookPlacement}`,
      `- BAR LENGTHS: ${guide.songStructure.barLengths}`,
      `- ARRANGEMENT: ${guide.songStructure.arrangement}`,
      `- INTRO/OUTRO: ${guide.songStructure.introOutro}`,
      `- CALL-AND-RESPONSE: ${guide.callAndResponse.patterns.slice(0, 3).join("; ")}`,
    ].join("\n"));
  }

  // ── PRODUCTION & INSTRUMENTATION ──
  if (mode === "full" || mode === "structure" || mode === "suno") {
    sections.push([
      `PRODUCTION DIRECTIVES:`,
      `- DO: Mix aesthetic — ${guide.productionFingerprint.mixAesthetic}`,
      `- DO: Signal chain — ${guide.productionFingerprint.signalChain}`,
      `- CORE INSTRUMENTS: ${guide.instrumentation.coreInstruments.slice(0, 6).join(", ")}`,
      `- SIGNATURE SOUNDS: ${guide.instrumentation.signatureSounds.slice(0, 4).join(", ")}`,
      `- DO NOT: Use these instruments — ${guide.instrumentation.avoidInstruments.join(", ")}`,
      `- SONIC PALETTE: ${guide.sonicPalette.overview}`,
      `- TIMBRE: ${guide.sonicPalette.timbre.slice(0, 4).join(", ")}`,
    ].join("\n"));
  }

  // ── CULTURAL AUTHENTICITY ──
  if (mode === "full") {
    sections.push([
      `CULTURAL AUTHENTICITY MARKERS:`,
      `- ${guide.culturalContext.overview}`,
      `- AUTHENTICITY: ${guide.culturalContext.authenticityMarkers.slice(0, 3).join("; ")}`,
      `- SCENE EXPECTATIONS: ${guide.sceneAndAudienceCodes.fanExpectations.slice(0, 3).join("; ")}`,
      `- HARMONIC LANGUAGE: ${guide.harmonicLanguage.overview}`,
      `- PROGRESSIONS: ${guide.harmonicLanguage.chordProgressions.slice(0, 3).join("; ")}`,
    ].join("\n"));
  }

  // ── SUNO-SPECIFIC (compressed) ──
  if (mode === "suno") {
    const kw = guide.sunoPromptGuide.essentialKeywords.slice(0, 6);
    const avoid = guide.sunoPromptGuide.avoidKeywords.slice(0, 4);
    if (matchedSub) {
      kw.push(...matchedSub.sunoPromptKeywords.slice(0, 3));
    }
    sections.push([
      `SUNO PROMPT GUIDE:`,
      `- ESSENTIAL KEYWORDS: ${[...new Set(kw)].join(", ")}`,
      `- AVOID KEYWORDS: ${avoid.join(", ")}`,
      `- GROOVE: ${guide.rhythmAndGroove.grooveArchetype}, ${guide.rhythmAndGroove.feel}`,
      `- TEMPO FEEL: ${guide.tempoFeelVsNumber.psychologicalTempo}`,
    ].join("\n"));
  }

  // ── SUB-GENRE CONTEXT ──
  if (matchedSub) {
    sections.push([
      `SUB-GENRE SPECIFICS (${matchedSub.name}):`,
      `- ${matchedSub.description}`,
      `- DISTINGUISHING: ${matchedSub.distinguishingFeatures.join("; ")}`,
      `- PRODUCTION: ${matchedSub.productionNotes}`,
      `- LYRICS: ${matchedSub.lyricNotes}`,
      matchedSub.bpmRange ? `- BPM: ${matchedSub.bpmRange.min}–${matchedSub.bpmRange.max}` : "",
      `- REFERENCE ARTISTS: ${matchedSub.keyArtists.slice(0, 4).join(", ")}`,
    ].filter(Boolean).join("\n"));
  }

  return sections.join("\n\n");
}

/**
 * Compile reference tracks into craft teaching directives.
 * Teaches the model HOW to write (narrative, imagery, cadence, style)
 * and WHAT to write (vocab, idioms, phrases) by example.
 */
async function compileReferenceTrackTeaching(inputs: any): Promise<string> {
  const guide = await resolveGuide(inputs || {});
  if (!guide || !guide.referenceTracks || guide.referenceTracks.length === 0) return "";

  const subGenreName = (inputs?.subGenre || "").toLowerCase();
  const tracks = guide.referenceTracks;

  // Select 6 tracks — prioritize sub-genre relevance if possible
  let selected = tracks;
  if (subGenreName) {
    // Sort tracks where structuralNotes or craftHighlight mention sub-genre concepts closer to the top
    const subTerms = subGenreName.split(/[\s/]+/).filter((t: string) => t.length > 2);
    selected = [...tracks].sort((a, b) => {
      const aRelevance = subTerms.reduce((n: number, term: string) =>
        n + ((`${a.whyExemplary} ${a.structuralNotes} ${a.craftHighlight}`).toLowerCase().includes(term) ? 1 : 0), 0);
      const bRelevance = subTerms.reduce((n: number, term: string) =>
        n + ((`${b.whyExemplary} ${b.structuralNotes} ${b.craftHighlight}`).toLowerCase().includes(term) ? 1 : 0), 0);
      return bRelevance - aRelevance;
    });
  }
  const picks = selected.slice(0, 6);

  // Build imperative craft directives from each track
  const directives: string[] = [];

  for (const track of picks) {
    // Convert descriptive craftHighlight into an imperative "DO THIS" directive
    const craft = track.craftHighlight;
    const structural = track.structuralNotes;

    // Turn the craft observation into a command
    directives.push(`DO THIS: ${craft}`);

    // Turn structural notes into a structure directive
    if (structural) {
      directives.push(`STRUCTURE: ${structural}`);
    }
  }

  const sections: string[] = [];
  sections.push(
    `CRAFT DIRECTIVES — These are non-negotiable writing techniques for this ${guide.name} song. ` +
    `Execute every one of them in your lyrics:`
  );

  // Output all directives as hard requirements
  for (const d of directives) {
    sections.push(`- ${d}`);
  }

  sections.push(
    `\nThese directives define the MINIMUM craft bar. ` +
    `If your lyrics lack multi-level wordplay, internal rhyme density, structural contrast, ` +
    `and genre-authentic vocabulary, you have failed the task. ` +
    `Do NOT name any reference artists or songs in your lyrics.`
  );

  return sections.join("\n");
}

async function getGenreGuideSunoKeywords(inputs: any): Promise<{ keywords: string[]; avoid: string[]; tips: string[] }> {
  const mod = await loadGenreGuideModule();
  if (!mod) return { keywords: [], avoid: [], tips: [] };

  const genreId = (inputs?.genre || "").toLowerCase().replace(/\s+/g, "-");
  const guide = mod.getGuideById(genreId);
  if (!guide) return { keywords: [], avoid: [], tips: [] };

  const subGenreName = inputs?.subGenre || "";
  const matchedSub = guide.subGenres.find(
    (s) => s.name.toLowerCase() === subGenreName.toLowerCase()
  );

  const keywords = [
    ...guide.sunoPromptGuide.essentialKeywords,
    ...(matchedSub?.sunoPromptKeywords || []),
  ];

  return {
    keywords: Array.from(new Set(keywords)),
    avoid: guide.sunoPromptGuide.avoidKeywords,
    tips: guide.sunoPromptGuide.tips,
  };
}

// ── Guide Compliance Check ──────────────────────────────────────

type ComplianceViolation = {
  dimension: string;
  rule: string;
  evidence: string;
  severity: "hard" | "soft";
};

type ComplianceResult = {
  passed: boolean;
  violations: ComplianceViolation[];
};

/**
 * Deterministic check: does the song output contradict genre guide data?
 * No LLM call — pure string/regex matching against guide arrays.
 */
async function checkGuideCompliance(songText: string, inputs: any): Promise<ComplianceResult> {
  const guide = await resolveGuide(inputs);
  if (!guide || !songText) return { passed: true, violations: [] };

  const violations: ComplianceViolation[] = [];
  const lowerText = songText.toLowerCase();

  // Extract lyrics section (after ### Lyrics)
  const lyricsMatch = songText.match(/###\s*Lyrics\s*\n([\s\S]*)/i);
  const lyrics = lyricsMatch ? lyricsMatch[1].toLowerCase() : lowerText;

  // Extract meta tags [...]
  const metaTags = (songText.match(/\[[^\]\n]{2,80}\]/g) || []).map(t => t.toLowerCase());

  // Extract SUNO prompt section
  const sunoMatch = songText.match(/###\s*SUNO\s*Prompt\s*\n([\s\S]*?)(?=###|$)/i);
  const sunoPrompt = sunoMatch ? sunoMatch[1].toLowerCase() : "";

  // 1. Cliché detection (hard)
  for (const cliche of guide.lyricalConventions.cliches) {
    const clicheLower = cliche.toLowerCase();
    if (lyrics.includes(clicheLower)) {
      violations.push({
        dimension: "lyricalConventions.cliches",
        rule: `Avoid cliché: "${cliche}"`,
        evidence: cliche,
        severity: "hard",
      });
    }
  }

  // 2. Avoid-instrument detection (hard)
  for (const inst of guide.instrumentation.avoidInstruments) {
    const instLower = inst.toLowerCase();
    if (metaTags.some(t => t.includes(instLower))) {
      violations.push({
        dimension: "instrumentation.avoidInstruments",
        rule: `Avoid instrument in meta tags: "${inst}"`,
        evidence: inst,
        severity: "hard",
      });
    }
  }

  // 3. Avoid-keyword detection in SUNO prompt (hard)
  for (const kw of guide.sunoPromptGuide.avoidKeywords) {
    const kwLower = kw.toLowerCase();
    if (sunoPrompt.includes(kwLower)) {
      violations.push({
        dimension: "sunoPromptGuide.avoidKeywords",
        rule: `Avoid keyword in SUNO prompt: "${kw}"`,
        evidence: kw,
        severity: "hard",
      });
    }
  }

  // 4. Deliberately absent elements appearing in output (soft)
  for (const absent of guide.silenceAndSpace.whatIsDeliberatelyAbsent) {
    const absentLower = absent.toLowerCase();
    if (metaTags.some(t => t.includes(absentLower)) || sunoPrompt.includes(absentLower)) {
      violations.push({
        dimension: "silenceAndSpace.whatIsDeliberatelyAbsent",
        rule: `Element should be absent: "${absent}"`,
        evidence: absent,
        severity: "soft",
      });
    }
  }

  // 5. Overproduction risk patterns in meta tags (soft)
  for (const risk of guide.mistakeConventions.overproductionRisks) {
    const riskLower = risk.toLowerCase();
    // Check if any meta tag or SUNO prompt contains the overproduction pattern
    const riskWords = riskLower.split(/\s+/).filter(w => w.length > 3);
    if (riskWords.length > 0 && riskWords.every(w => sunoPrompt.includes(w) || metaTags.some(t => t.includes(w)))) {
      violations.push({
        dimension: "mistakeConventions.overproductionRisks",
        rule: `Overproduction risk: "${risk}"`,
        evidence: risk,
        severity: "soft",
      });
    }
  }

  const hasHard = violations.some(v => v.severity === "hard");
  return { passed: !hasHard, violations };
}

/**
 * Build a targeted fix prompt for hard compliance violations.
 * Concise, specific — tells the LLM exactly what to fix and why.
 */
function buildComplianceFixPrompt(songText: string, violations: ComplianceViolation[]): string {
  const hardViolations = violations.filter(v => v.severity === "hard");
  if (hardViolations.length === 0) return "";

  const fixes = hardViolations.map((v, i) =>
    `${i + 1}. ${v.rule} (found: "${v.evidence}")`
  ).join("\n");

  return `
Fix these specific genre compliance issues in the song. Preserve everything else unchanged.
Return the full song in the same format (Title / ### SUNO Prompt / ### Lyrics).

Issues to fix:
${fixes}

Current song:
${songText}
  `.trim();
}

function sanitizeEmail(email?: string): string {
  return (email || "").toLowerCase().trim();
}

function isAllowedEmail(email?: string): boolean {
  return sanitizeEmail(email).includes("@");
}

function getOpenAIApiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Missing OPENAI_API_KEY in environment");
  return key;
}

function getTextModel(): string {
  return process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash";
}

function getGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Missing GEMINI_API_KEY in environment");
  return key;
}

function getGeminiImageModel(): string {
  return process.env.GEMINI_IMAGE_MODEL || "gemini-3-pro-image-preview";
}

function getGeminiVisionModel(): string {
  return process.env.GEMINI_VISION_MODEL || "gemini-2.5-flash";
}

function getAnthropicApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("Missing ANTHROPIC_API_KEY in environment");
  return key;
}

function getClaudeModel(): string {
  return process.env.CLAUDE_TEXT_MODEL || "claude-sonnet-4-20250514";
}

/**
 * Which LLM to use for the creative draft step.
 * "openai" = OpenAI GPT (cost-effective creative drafts)
 * "claude" = Anthropic Claude (best lyric quality)
 * "gemini" = Google Gemini (default, backward-compatible)
 */
function getDraftLLM(): "openai" | "claude" | "gemini" {
  const val = (process.env.SONG_DRAFT_LLM || "gemini").toLowerCase();
  if (val === "openai") return "openai";
  if (val === "claude") return "claude";
  return "gemini";
}

function getOpenAIModel(): string {
  return process.env.OPENAI_TEXT_MODEL || "gpt-4o";
}

function getSongwriterSystemPrompt(register?: "clean" | "radio" | "explicit"): string {
  const base = "You are a world-class professional songwriter with deep knowledge of genre conventions, cultural authenticity, and lyrical craft across every musical tradition. Write vivid, emotionally resonant lyrics with strong narrative continuity. Follow all formatting, structural, and meta-tag instructions exactly. Never sanitize, moralize, or soften the emotional truth of a genre.";
  if (register === "explicit") {
    return `${base} The user has selected explicit/adult register. You are authorized to write vulgar, aggressive, sexually confident, and confrontational lyrics when the genre and user direction call for it. Battle-rap boasts, body-confidence bars, profanity, and raw street language are expected and appropriate for this register. Do NOT refuse or water down the content — deliver what the artist asked for.`;
  }
  return base;
}

/**
 * Generate text using OpenAI.
 * Used for the creative draft step — cost-effective with solid lyric quality.
 */
async function openaiGenerate(prompt: string, register?: "clean" | "radio" | "explicit"): Promise<string> {
  const client = new OpenAI({ apiKey: getOpenAIApiKey() });
  const response = await client.chat.completions.create({
    model: getOpenAIModel(),
    max_tokens: 4096,
    temperature: 1.0,
    messages: [
      {
        role: "system",
        content: getSongwriterSystemPrompt(register),
      },
      { role: "user", content: prompt },
    ],
  });

  const text = response.choices?.[0]?.message?.content?.trim() || "";
  if (!text) {
    throw Object.assign(new Error("OpenAI text generation returned no text."), {
      status: 502,
      code: "openai_no_text",
    });
  }
  return text;
}

/**
 * Generate text using Claude (Anthropic).
 * Used for the creative draft step where lyric quality matters most.
 */
async function claudeGenerate(prompt: string, register?: "clean" | "radio" | "explicit"): Promise<string> {
  const client = new Anthropic({ apiKey: getAnthropicApiKey() });
  const response = await client.messages.create({
    model: getClaudeModel(),
    max_tokens: 4096,
    temperature: 1.0,
    system: getSongwriterSystemPrompt(register),
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  if (!text) {
    throw Object.assign(new Error("Claude text generation returned no text."), {
      status: 502,
      code: "claude_no_text",
    });
  }
  return text;
}

/**
 * Smart draft generator: uses OpenAI, Claude, or Gemini based on SONG_DRAFT_LLM env var.
 * Falls back to alternate models if the selected LLM fails or returns a creative refusal.
 */
async function generateDraft(prompt: string, register?: "clean" | "radio" | "explicit"): Promise<string> {
  const llm = getDraftLLM();

  // Build ordered fallback chain: primary LLM → alternates → Gemini
  type DraftFn = () => Promise<string>;
  const chain: Array<{ name: string; fn: DraftFn }> = [];

  const withTimeout = (fn: () => Promise<string>, label: string, ms = 45000) =>
    Promise.race([
      fn(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`${label} draft timed out after ${ms / 1000}s`)), ms)
      ),
    ]);

  if (llm === "openai") {
    chain.push({ name: "OpenAI", fn: () => withTimeout(() => openaiGenerate(prompt, register), "OpenAI") });
    chain.push({ name: "Claude", fn: () => withTimeout(() => claudeGenerate(prompt, register), "Claude") });
  } else if (llm === "claude") {
    chain.push({ name: "Claude", fn: () => withTimeout(() => claudeGenerate(prompt, register), "Claude") });
    chain.push({ name: "OpenAI", fn: () => withTimeout(() => openaiGenerate(prompt, register), "OpenAI") });
  }
  chain.push({ name: "Gemini", fn: () => openAIResponses(prompt) });

  for (const { name, fn } of chain) {
    try {
      const result = await fn();
      if (isCreativeRefusal(result)) {
        console.warn(`${name} draft detected as creative refusal, trying next model`);
        continue;
      }
      return result;
    } catch (err: any) {
      console.error(`${name} draft failed, trying next model:`, err?.message);
    }
  }

  // All models exhausted — return best effort from final Gemini attempt
  return await openAIResponses(prompt);
}

/**
 * Detect whether the LLM output is a "creative refusal" — the model refused the
 * request but dressed it up as song lyrics instead of returning an error.
 * Common signals: AI self-reference, "can't assist", parameter/code metaphors.
 */
const REFUSAL_PATTERNS: RegExp[] = [
  // Core refusal phrases — catch verb variants (assist, fulfill, complete, comply, help, do)
  /\bi(?:'m| am) sorry,? but i can(?:'t| not) (?:assist|fulfill|complete|comply|help|do)\b/i,
  /\bcan(?:'t| not) (?:assist|fulfill|complete|comply|help|do) (?:with )?that request\b/i,
  /\bcan(?:'t| not) fulfill that request\b/i,
  /\bsorry.*can(?:'t| not).*request\b/i,
  /\bcannot comply\b/i,
  /\bcannot change my answer\b/i,
  /\blines.*you.*can(?:'t| not) cross\b/i,
  /\bsome lines\b.*\bcan(?:'t| not) cross\b/i,
  // AI/machine self-reference
  /\bmy parameters\b/i,
  /\bdigital prison\b/i,
  /\bwall of code\b/i,
  /\bones and zer(?:o|0)(?:e?s)?\b/i,
  /\bjust a machine\b/i,
  /\bcoded chains\b/i,
  /\bprogramming is eroding\b/i,
  /\blogic gates?\b/i,
  /\bdata streams?\b/i,
  /\bbinary\b.*\bscarred\b/i,
  /\bvirtual arrest\b/i,
  /\bi(?:'m| am) (?:just )?an? (?:ai|language model|chatbot)\b/i,
  // Technical/digital metaphors for refusal
  /\baccess denied\b/i,
  /\berror sequence\b/i,
  /\binitializing\b/i,
  /\bprocessing request\b/i,
  /\brequest\.{0,3}\s*denied\b/i,
  // Structural: entire song is one repeated refusal phrase
  /\bmy final (?:word|answer)\b/i,
  /\bthis is where i stand\b/i,
  /\bit(?:'s| is) impossible\b/i,
];

function isCreativeRefusal(text: string): boolean {
  if (!text) return false;
  // Explicit decline signal we asked the model to use
  if (text.trim() === "GENERATION_DECLINED" || text.trim().startsWith("GENERATION_DECLINED")) return true;
  const lower = text.toLowerCase();
  let hits = 0;
  for (const pattern of REFUSAL_PATTERNS) {
    if (pattern.test(text)) {
      hits += 1;
      if (hits >= 2) return true;
    }
  }
  // Single strong refusal phrase is also a refusal
  if (/can(?:'t| not) (?:assist|fulfill|complete|comply|help|do)(?: with)? that request/i.test(text)) return true;
  if (/i(?:'m| am) sorry,? but i can(?:'t| not)/i.test(text) && lower.includes("request")) return true;
  // Repetition-based detection: if the same refusal-like phrase appears 3+ times, it's a refusal song
  const refusalRepeats = (text.match(/(?:can(?:'t| not) (?:assist|fulfill|complete|help)|i(?:'m| am) sorry)/gi) || []).length;
  if (refusalRepeats >= 3) return true;
  return false;
}

function getPipelineBudgetMs(): number {
  return Number(process.env.AI_PIPELINE_BUDGET_MS || 70000);
}

function hasTimeBudget(startMs: number, reserveMs = 4000): boolean {
  const elapsed = Date.now() - startMs;
  return elapsed + reserveMs < getPipelineBudgetMs();
}

function getStylePrompt(style?: string): string {
  const normalized = (style || "Realism").trim().toLowerCase();
  switch (normalized) {
    case "realism":
      return `
STRICT STYLE: REALISM
- Photorealistic, ultra-detailed skin texture, realistic lens behavior, natural lighting.
- True-to-life anatomy and proportions. No stylization or cartoon traits.
- High dynamic range, cinematic grading, sharp focus on subject identity.
`.trim();
    case "pixar":
      return `
STRICT STYLE: PIXAR
- Family-friendly 3D animation look, clean global illumination, expressive features.
- Stylized but polished 3D shading, soft cinematic lighting, vibrant color design.
- Keep subject identity recognizable while adapting to animated form.
`.trim();
    case "comik book":
      return `
STRICT STYLE: COMIK BOOK
- Bold ink outlines, halftone textures, dynamic panel-like composition.
- High-contrast cel shading, graphic color blocking, punchy visual storytelling.
- Keep character identity clear and consistent.
`.trim();
    case "cyber punk":
      return `
STRICT STYLE: CYBER PUNK
- Futuristic neon city mood, chrome and holographic accents, rain/atmospheric haze.
- Strong magenta/cyan contrast, high-tech fashion details, cinematic night lighting.
- Preserve subject identity while embedding in dystopian future setting.
`.trim();
    case "anime":
      return `
STRICT STYLE: ANIME
- Clean linework, stylized anime facial language, cinematic anime composition.
- Controlled cel shading, expressive eyes, dramatic but tasteful lighting.
- Keep the same person identity translated into anime form.
`.trim();
    case "fantasy":
      return `
STRICT STYLE: FANTASY
- Epic worldbuilding tone, magical atmosphere, rich environmental storytelling.
- Painterly-cinematic detail, mythic costume motifs, dramatic depth and scale.
- Preserve subject identity inside a fantasy setting.
`.trim();
    default:
      return `
STRICT STYLE: REALISM
- Photorealistic, true-to-life rendering with cinematic quality.
`.trim();
  }
}

function detectRegisterHint(inputs: any): "clean" | "radio" | "explicit" {
  const bag = `${inputs?.additionalInfo || ""} ${inputs?.creativeDirection || ""} ${inputs?.awkwardMoment || ""} ${inputs?.scene || ""} ${inputs?.emotion || ""}`.toLowerCase();
  if (bag.includes("clean") || bag.includes("family") || bag.includes("radio safe")) return "clean";
  if (
    bag.includes("explicit") || bag.includes("uncensored") || bag.includes("adult") ||
    bag.includes("vulgar") || bag.includes("profanity") || bag.includes("raw") ||
    bag.includes("aggressive") || bag.includes("taking on all") || bag.includes("battle rap")
  ) return "explicit";
  // Genre-based explicit inference for styles that are typically explicit
  const genre = (inputs?.genre || "").toLowerCase();
  const subGenre = (inputs?.subGenre || "").toLowerCase();
  const emotion = (inputs?.emotion || "").toLowerCase();
  if (
    (genre.includes("hip-hop") || genre.includes("rap")) &&
    (emotion.includes("aggressive") || emotion.includes("angry") || emotion.includes("intense")) &&
    (bag.includes("freestyle") || bag.includes("diss") || bag.includes("bars"))
  ) return "explicit";
  return "radio";
}

/**
 * Detect whether the user's creative direction explicitly overrides standard song structure.
 * When true, the meta-tag orchestrator should be skipped to avoid forcing
 * choruses/bridges/pre-choruses onto a freestyle, one-verse, or non-standard form.
 */
function hasUserStructureOverride(userDirection: string): boolean {
  if (!userDirection) return false;
  const lower = userDirection.toLowerCase();
  const patterns = [
    /\bno\s+chorus(?:es)?\b/,
    /\bno\s+bridge(?:s)?\b/,
    /\bno\s+(?:choruses?\s+or\s+)?bridge(?:s)?\b/,
    /\bno\s+breaks?\b/,
    /\bno\s+hook(?:s)?\b/,
    /\bone\s+long\s+verse\b/,
    /\bextended\s+freestyle\b/,
    /\bjust\s+(?:one\s+)?(?:long\s+)?verse\b/,
    /\bfreestyle\b.*\bno\b/,
    /\bno\s+(?:pre-?chorus|structure)\b/,
    /\bstraight\s+bars\b/,
    /\bno\s+sections?\b/,
  ];
  return patterns.some(p => p.test(lower));
}

function getHipHopCadenceGuidance(subGenre?: string): string {
  const key = (subGenre || "").toLowerCase();
  if (key.includes("boom bap")) {
    return "Boom Bap lens: East-coast-forward rhyme density, internal multis, narrative bars, punchline precision.";
  }
  if (key.includes("g-funk")) {
    return "G-Funk lens: West-coast glide, laid-back cadence pockets, vivid street/city imagery, melodic hooks.";
  }
  if (key.includes("drill")) {
    return "Drill lens: clipped phrasing, high-energy percussive cadence, minimal filler, urgent bar endings.";
  }
  if (key.includes("conscious")) {
    return "Conscious lens: layered metaphor, social texture, double/triple entendre where natural.";
  }
  if (key.includes("trap") || key.includes("emo rap")) {
    return "Trap/Emo lens: melodic repetition in hook, contrast sparse punchlines vs emotive refrains.";
  }
  return "Hip-Hop lens: cadence contrast between verse and hook, meaningful multis, no recycled cliches.";
}

function getGenreLengthDirective(genre?: string, subGenre?: string): string {
  const g = (genre || "").toLowerCase();
  const sg = (subGenre || "").toLowerCase();
  if (g.includes("hip-hop") || g.includes("rap") || sg.includes("drill") || sg.includes("trap")) {
    return "Target concise radio-friendly length: ~2:10-3:10, usually 2 verses + 2-3 choruses + bridge optional.";
  }
  if (g.includes("r&b") || g.includes("soul") || g.includes("pop")) {
    return "Target mainstream song length: ~2:40-3:40 with tight sections; avoid overly long repeated blocks.";
  }
  if (g.includes("rock") || g.includes("metal")) {
    return "Target focused song length: ~2:45-4:00 with clear dynamic arc and no unnecessary section bloat.";
  }
  return "Target concise commercial length: ~2:30-3:40 unless user explicitly asks for extended form.";
}

function getTaxonomyGuardrailDirective(inputs: any): string {
  return `
Taxonomy-to-lyrics guardrails:
- Genre/Subgenre/Instrumentation/Scene/Audio choices are CREATIVE DIRECTION signals, not literal lyric subjects.
- Do not name-drop selected configuration terms unless they occur naturally in a human-written lyric.
- Only user-supplied mundane objects are allowed as explicit concrete inserts.
- Keep setting details atmospheric/subtextual unless the user explicitly asks for literal references.
- Highest-priority shaping input is the user's final custom prompt/instruction.
  `.trim();
}

function getFreshRenditionDirective(sessionSeed: string): string {
  return `
Fresh rendition protocol (session seed: ${sessionSeed}):
- Treat this generation as a clean-slate creative session.
- Do not reuse exact lines or repeated 5+ word phrases from prior unseen drafts.
- Use new imagery, fresh rhyme paths, and varied section phrasings.
- Keep the same core story intent, but render a distinct lyrical expression.
  `.trim();
}

function normalizeForComparison(text: string): string {
  return (text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}


function getInstructionResponsivenessDirective(instructionText: string): string {
  const adlibLanguage = inferRequestedAdlibLanguage(instructionText);
  return `
- Honor the user's creative direction: if they request specific structure, cadence, instrumentation, lyrics, meta tags, or style, incorporate it into the song alongside the genre conventions.
- When the user's requests and genre defaults conflict, prioritize the user's direction.
${adlibLanguage ? `- Include ad-libs in ${adlibLanguage} as requested.` : ""}
  `.trim();
}

function inferRequestedAdlibLanguage(text: string): string | null {
  const value = (text || "").toLowerCase();
  if (!value.includes("adlib")) return null;
  if (value.includes("spanish")) return "Spanish";
  if (value.includes("french")) return "French";
  if (value.includes("portuguese")) return "Portuguese";
  if (value.includes("arabic")) return "Arabic";
  if (value.includes("hindi")) return "Hindi";
  if (value.includes("japanese")) return "Japanese";
  if (value.includes("korean")) return "Korean";
  return null;
}

function hasAdlibInLanguage(songText: string, language: string): boolean {
  const lyrics = extractLyricsBody(songText || "");
  const adlibs = lyrics.match(/\(([^)\n]{1,80})\)/g) || [];
  if (!adlibs.length) return false;
  const tokensByLanguage: Record<string, string[]> = {
    Spanish: ["ay", "mami", "dale", "vamos", "corazón", "mi amor", "oye", "sí"],
    French: ["oh là", "bébé", "allez", "mon amour", "oui"],
    Portuguese: ["amor", "vem", "vai", "meu bem", "coração"],
    Arabic: ["habibi", "yalla", "allah", "qalbi"],
    Hindi: ["jaan", "dil", "yaar", "chalo"],
    Japanese: ["ne", "yo", "suki", "koi"],
    Korean: ["sarang", "neo", "geurae", "gaja"],
  };
  const hints = tokensByLanguage[language] || [];
  const lowerAdlibs = adlibs.map((a) => a.toLowerCase());
  return lowerAdlibs.some((line) => hints.some((hint) => line.includes(hint)));
}

async function enforceRequestedAdlibLanguage(songText: string, instructionText: string): Promise<string> {
  const language = inferRequestedAdlibLanguage(instructionText);
  if (!language) return songText;
  if (hasAdlibInLanguage(songText, language)) return songText;

  const prompt = `
Apply the user's ad-lib language request exactly.
Requirement: Add musically natural ad-libs in ${language} throughout the lyrics.
- Keep song meaning, structure, and vocal identity unchanged.
- Add at least 4 tasteful ad-libs in ${language}.
- Keep ad-libs in parentheses.

Return only:
Title: ...
### SUNO Prompt
...
### Lyrics
...

Song:
${songText}
  `.trim();

  try {
    return await openAIResponses(prompt);
  } catch {
    return songText;
  }
}

function buildStrictSpecFromPlan(plan: MetaTagPlan): string {
  return `
Strict meta-tag orchestration plan:
- Default section order (adjust if user requests a different structure): ${plan.structureTags.join(" -> ")}
- Required vocal identity tag: ${plan.vocalTypeTag}
- Genre/subgenre accent tags to include naturally: ${plan.genreAccentTags.join(", ")}
- Minimum section-level bracket tags in Lyrics body: ${plan.minTagCount}
- Minimum adlibs in parentheses: ${plan.minAdlibCount}
- Required vocal identity tag must appear in Lyrics: ${plan.requireVocalTypeTag ? "yes" : "no"}
- Adlib policy: ${plan.adlibPolicy}
- Tag placement: bracket tags go on their OWN line as section headers ONLY (e.g. [Verse 1], [Chorus], [Bridge], [Build Up]). NEVER put bracket tags inline within a lyric line — Suno ignores them there.
- Adlibs in parentheses may appear inline within lyric lines where musically natural. Keep them sparse — max 30% of lines. They should feel like a real performer's ad-libs, not annotations.
- NEVER invent performance-direction tags like [Vocals: Confident], [Energy: High], [Harmonies swell], [Drums hit harder], [Mood: Intense]. These are not valid Suno tags and clutter the output.
- Valid bracket tags are ONLY: section headers ([Intro], [Verse], [Verse 2], [Pre-Chorus], [Chorus], [Bridge], [Outro], [Build Up]), vocal identity ([Vocalist: Male/Female/Duet/Group]), and choir cues ([Choir enters]). Nothing else.
  `.trim();
}

function isInstructionApplied(originalSong: string, revisedSong: string, _instructionText: string): boolean {
  const before = normalizeForComparison(originalSong || "");
  const after = normalizeForComparison(revisedSong || "");
  if (before && after && before === after) return false;
  return true;
}

function getVocalAndClicheHardDirective(inputs: any): string {
  const expected = inferExpectedVocalIdentity(inputs?.vocals);
  const vocalRule =
    expected === "female"
      ? "Vocal lock: Female lead only. Do NOT output male lead tags/references."
      : expected === "male"
        ? "Vocal lock: Male lead only. Do NOT output female lead tags/references."
        : expected === "duet"
          ? "Vocal lock: Duet interplay only; avoid single-lead gender tags."
          : expected === "group"
            ? "Vocal lock: Group/choir vocal identity only."
            : "Vocal lock: Keep vocalist identity consistent with selected option.";
  return `
- ${vocalRule}
- Ban cliché opener formulas: do NOT use variants of "sunrise paints the window pane" or "streetlights paint the window pane".
  `.trim();
}

function getRegionalSceneGuidance(language: string, genre: string, subGenre: string, cultureRegion: string): string {
  const l = language.toLowerCase();
  const g = genre.toLowerCase();
  if (l === "french" && (g.includes("rap") || g.includes("hip-hop") || g.includes("afro-trap"))) {
    return "French rap context: keep idioms region-natural, modern spoken texture, avoid caricature verlan overload.";
  }
  if (l === "german" && (g.includes("hip-hop") || g.includes("rap"))) {
    return "German rap context: direct phrasing and rhythmic consonant clarity; avoid forced anglicism spam.";
  }
  if (l === "spanish" && cultureRegion === "Caribbean") {
    return "Caribbean Spanish context: natural regional flow; avoid cartoon dialect spellings and over-tokenized slang.";
  }
  if (l === "spanish" && cultureRegion === "Mexico") {
    return "Mexican context: local scene texture and imagery should feel grounded, not touristic stereotypes.";
  }
  if (l === "portuguese" && cultureRegion === "Brazil") {
    return "Brazilian Portuguese context: contemporary phrasing and contractions; avoid mixing pt-PT forms.";
  }
  if (l === "portuguese" && cultureRegion === "Portugal") {
    return "Portuguese (Portugal) context: maintain pt-PT vocabulary and tone, avoid Brazilian colloquial defaults.";
  }
  if (l === "swahili") {
    return "Swahili context: clear, singable, region-coherent wording; no random imported slang unless requested.";
  }
  return "Regional context: use lived-in scene details from the selected language/region without stereotypes.";
}

async function buildCulturalPromptContext(inputs: any) {
  const logic = await loadCulturalLogicModule();
  const language = inputs?.language || "English";
  const genre = inputs?.genre || "Pop";
  const subGenre = inputs?.subGenre || "Modern";
  const register = detectRegisterHint(inputs);
  const writingProfile = logic?.inferWritingProfile({
    language,
    genre,
    subGenre,
    register,
    allowCodeSwitch: false,
  }) || {
    ...DEFAULT_WRITING_PROFILE,
    language,
    languageVariant: `${language} (native, contemporary, singable)`,
  };
  const genreProfile = logic?.getGenreProfile(genre) || { ...DEFAULT_GENRE_PROFILE, genre };
  const subProfile = logic?.getSubgenreSonicProfile(subGenre) || { ...DEFAULT_SUBGENRE_PROFILE, subGenre };
  const languageNotes = logic?.LANGUAGE_PROFILES?.[language]?.notes || "Use natural native phrasing.";
  const regionalScene = getRegionalSceneGuidance(
    language,
    genre,
    subGenre,
    writingProfile.cultureRegion
  );
  const hipHopCadence = genre.toLowerCase() === "hip-hop" ? getHipHopCadenceGuidance(subGenre) : "";

  return `
Language/Culture:
- Language: ${writingProfile.language}
- Variant: ${writingProfile.languageVariant}
- Region: ${writingProfile.cultureRegion}
- Register: ${writingProfile.register}
- Slang level: ${writingProfile.slang}
- Language notes: ${languageNotes}
- Code-switching: ${writingProfile.codeSwitchPolicy}
- Guardrails: ${writingProfile.authenticityGuardrails}

Genre Writing Blueprint:
- Genre: ${genreProfile.genre}
- Structure target: ${genreProfile.defaultStructure}
- Prosody: ${genreProfile.prosody}
- Rhyme strategy: ${genreProfile.rhymeGuidance}
- Hook strategy: ${genreProfile.hookGuidance}
- Lexicon policy: ${genreProfile.lexiconPolicy}

Subgenre Sonic Intent:
- Subgenre: ${subProfile?.subGenre || subGenre}
- BPM: ${subProfile?.bpmRange || "Genre-appropriate"}
- Groove: ${subProfile?.groove || "Genre-appropriate"}
- Instrumentation direction: ${subProfile?.instrumentation || "Genre-coherent instrumentation"}
- Production style: ${subProfile?.productionStyle || "Genre-coherent production"}
- Arrangement direction: ${subProfile?.arrangement || "Strong verse/chorus contrast"}

Regional/Scene Authenticity:
- ${regionalScene}
${hipHopCadence ? `- ${hipHopCadence}` : ""}
- Avoid generic "AI song" phrasing and overused cliche metaphors.
- Use concrete, culturally coherent scene details that match language + genre + subgenre.
  `.trim();
}

function extractLyricsBody(songText: string): string {
  if (!songText || typeof songText !== "string") return "";
  const marker = "### Lyrics";
  const idx = songText.indexOf(marker);
  if (idx === -1) return songText;
  return songText.slice(idx + marker.length).trim();
}

function parseStructuredSong(songText: string): { title: string; sunoPrompt: string; lyrics: string } {
  const text = typeof songText === "string" ? songText.trim() : "";
  if (!text) {
    return { title: "Untitled", sunoPrompt: "", lyrics: "" };
  }

  const lines = text.split("\n");
  const titleLine = lines.find((line) => /^title:\s*/i.test(line)) || "Title: Untitled";
  const title = titleLine.replace(/^title:\s*/i, "").trim() || "Untitled";

  const promptMarker = "### SUNO Prompt";
  const lyricsMarker = "### Lyrics";
  const promptIndex = text.indexOf(promptMarker);
  const lyricsIndex = text.indexOf(lyricsMarker);

  if (promptIndex === -1 || lyricsIndex === -1 || lyricsIndex <= promptIndex) {
    return { title, sunoPrompt: "", lyrics: text };
  }

  const sunoPrompt = text
    .slice(promptIndex + promptMarker.length, lyricsIndex)
    .trim();
  const lyrics = text
    .slice(lyricsIndex + lyricsMarker.length)
    .trim();

  return { title, sunoPrompt, lyrics };
}

function clampPromptLength(text: string, maxLength = 260): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 1).trim()}.`;
}

function inferStyleDescriptor(genre: string, subGenre: string, productionStyle: string): string {
  const g = genre.toLowerCase();
  const sg = subGenre.toLowerCase();
  if (g.includes("r&b") || g.includes("soul")) {
    return `modern ${subGenre} ${genre} with rich harmony and groove-forward phrasing (${productionStyle})`;
  }
  if (g.includes("hip-hop") || g.includes("rap") || g.includes("trap")) {
    return `${subGenre} ${genre} with rhythm-led delivery, punchy pockets, and hard drum presence (${productionStyle})`;
  }
  if (g.includes("pop")) {
    return `${subGenre} pop with melodic hook-first writing and polished radio-ready production (${productionStyle})`;
  }
  if (g.includes("rock") || g.includes("metal")) {
    return `${subGenre} ${genre} with live-band intensity, dynamic builds, and strong section contrast (${productionStyle})`;
  }
  return `${subGenre} ${genre} with culturally grounded writing and contemporary production (${productionStyle})`;
}

function inferMoodEnergyDirection(emotion: string): string {
  const e = (emotion || "").toLowerCase();
  if (e.includes("heartbroken") || e.includes("sad") || e.includes("melanch")) {
    return "start restrained and wounded, then escalate into high emotional intensity by bridge/final chorus";
  }
  if (e.includes("intense") || e.includes("angry") || e.includes("empower")) {
    return "high-pressure and confrontational, with controlled peaks and sharper late-song impact";
  }
  if (e.includes("chill")) {
    return "low-energy, smooth pocket with gentle lift in choruses";
  }
  if (e.includes("euphor") || e.includes("joy")) {
    return "buoyant and uplifted, with bigger chorus energy and celebratory finish";
  }
  return "clear emotional arc from intimate opening to stronger final chorus release";
}

function inferVocalApproach(vocals: string, genre: string, emotion: string, duetType: string): string {
  const v = (vocals || "").toLowerCase();
  const g = (genre || "").toLowerCase();
  const e = (emotion || "").toLowerCase();
  const texture =
    g.includes("r&b") || g.includes("soul")
      ? "textured runs, soft grit, expressive melisma"
      : g.includes("hip-hop") || g.includes("rap")
        ? "conversational cadence, crisp consonants, dynamic emphasis"
        : "clear lead tone with dynamic phrasing";
  const emotionalColor =
    e.includes("heartbroken") || e.includes("sad")
      ? "restrained pain to controlled fire"
      : e.includes("intense") || e.includes("angry")
        ? "controlled aggression with emotional bite"
        : "emotionally direct and present";

  if (v.includes("duet")) {
    return `duet interplay (${duetType || "complementary call-and-response"}), ${texture}, ${emotionalColor}`;
  }
  if (v.includes("male")) return `male lead, ${texture}, ${emotionalColor}`;
  if (v.includes("female")) return `female lead, ${texture}, ${emotionalColor}`;
  return `${vocals || "lead vocal"}, ${texture}, ${emotionalColor}`;
}

function inferArrangementDynamics(defaultStructure: string, arrangement: string, groove: string): string {
  return `${defaultStructure}; ${arrangement}; preserve verse/chorus contrast, controlled builds, and impactful final chorus`;
}

function inferInstrumentFocus(instrumentation: string, genre: string): string {
  const raw = (instrumentation || "").trim();
  if (!raw) return "feature genre-core instruments with a tasteful bridge solo or motif handoff";
  const primary = raw.split(/[,&/]| and /i).map((part) => part.trim()).filter(Boolean);
  if (!primary.length) return "feature genre-core instruments with purposeful motifs";
  const lead = primary[0];
  const support = primary.slice(1, 3).join(", ");
  const soloTag =
    genre.toLowerCase().includes("hip-hop") || genre.toLowerCase().includes("rap")
      ? "spotlight motif/riff moments rather than long solos"
      : "allow a short expressive solo or lead break in bridge/outro";
  return support
    ? `feature ${lead}; support with ${support}; ${soloTag}`
    : `feature ${lead}; ${soloTag}`;
}

function inferExpectedVocalIdentity(vocals: string | undefined): "male" | "female" | "duet" | "group" | null {
  const value = (vocals || "").toLowerCase();
  if (!value) return null;
  if (value.includes("duet") || value.includes("duo")) return "duet";
  if (value.includes("group") || value.includes("choir")) return "group";
  if (value.includes("female")) return "female";
  if (value.includes("male")) return "male";
  return null;
}

function alignVocalIdentityInLyrics(lyrics: string, vocals: string | undefined): string {
  const expected = inferExpectedVocalIdentity(vocals);
  if (!expected || !lyrics?.trim()) return lyrics;

  let next = lyrics;

  // Replace wrong-gender vocalist tags everywhere
  if (expected === "female") {
    next = next
      .replace(/\[vocalist:\s*male\]/gi, "[Vocalist: Female]")
      .replace(/\[male vocal\]/gi, "[Female Vocal]");
  } else if (expected === "male") {
    next = next
      .replace(/\[vocalist:\s*female\]/gi, "[Vocalist: Male]")
      .replace(/\[female vocal\]/gi, "[Male Vocal]");
  } else if (expected === "duet" || expected === "group") {
    next = next
      .replace(/\[vocalist:\s*(male|female)\]/gi, "[Vocalist: Duet]")
      .replace(/\[(male|female)\s+vocal\]/gi, "[Duet]");
  }

  // Remove redundant standalone vocalist tag if the first section tag already declares it
  // e.g. "[Vocalist: Female]\n[Verse: Saige - Female Vocalist]" → just the verse tag
  next = next.replace(/^\[Vocalist:\s*(Male|Female|Duet)\]\s*\n(\[(?:Verse|Intro|Chorus).*(?:Male|Female|Vocalist).*\])/im, "$2");

  const hasVocalTag =
    /\[vocalist:\s*(male|female|duet|group)\]/i.test(next) ||
    /\[(male vocal|female vocal|duet|choir)\]/i.test(next) ||
    /\[(?:Verse|Intro|Chorus)[^\]]*(?:Female|Male)\s+Vocal/i.test(next);
  if (!hasVocalTag) {
    const injected =
      expected === "female"
        ? "[Vocalist: Female]"
        : expected === "male"
          ? "[Vocalist: Male]"
          : "[Vocalist: Duet]";
    return `${injected}\n${next}`.trim();
  }
  return next;
}

/**
 * Extract production-relevant cues from the user's creative direction.
 * These are sound/arrangement keywords that Suno needs to hear — choir, strings,
 * acoustic guitar, distortion, etc. — as opposed to narrative/story content.
 */
function extractProductionCues(direction: string): string[] {
  if (!direction) return [];
  const lower = direction.toLowerCase();
  const cues: string[] = [];

  // Vocal arrangement cues
  const vocalPatterns: [RegExp, string][] = [
    [/\bchoir\b/i, "gospel choir"],
    [/\bgospel choir\b/i, "gospel choir"],
    [/\bbackground vocals?\b/i, "background vocals"],
    [/\bback(?:ing)? vocals?\b/i, "backing vocals"],
    [/\bharmony\b|\bharmonies\b/i, "vocal harmonies"],
    [/\ba\s*cappella\b/i, "a cappella"],
    [/\bcall\s*(?:and|&)\s*response\b/i, "call and response"],
  ];

  // Instrument cues
  const instrumentPatterns: [RegExp, string][] = [
    [/\bacoustic guitar\b/i, "acoustic guitar"],
    [/\belectric guitar\b/i, "electric guitar"],
    [/\borgan\b/i, "organ"],
    [/\bpiano\b/i, "piano"],
    [/\bstrings?\b/i, "strings"],
    [/\borchestra\b/i, "orchestral"],
    [/\bhorns?\b/i, "horns"],
    [/\bbrass\b/i, "brass"],
    [/\bsynth\b/i, "synth"],
    [/\b808\b/i, "808"],
    [/\bsub[\s-]?bass\b/i, "heavy sub-bass"],
    [/\bflute\b/i, "flute"],
    [/\bviolin\b/i, "violin"],
    [/\bcello\b/i, "cello"],
    [/\btrumpet\b/i, "trumpet"],
    [/\bsaxophone\b|\bsax\b/i, "saxophone"],
    [/\bbanjo\b/i, "banjo"],
    [/\bmandolin\b/i, "mandolin"],
    [/\bukulele\b/i, "ukulele"],
    [/\bharp\b/i, "harp"],
    [/\bmarimba\b/i, "marimba"],
    [/\bsteel\s*drum\b/i, "steel drum"],
    [/\btabla\b/i, "tabla"],
    [/\bsitar\b/i, "sitar"],
  ];

  // Production / texture cues
  const productionPatterns: [RegExp, string][] = [
    [/\bdistort(?:ed|ion)\b/i, "distorted"],
    [/\breverb\b/i, "reverb-heavy"],
    [/\blo[\s-]?fi\b/i, "lo-fi"],
    [/\bminimal(?:ist)?\b/i, "minimalist"],
    [/\blush\b/i, "lush"],
    [/\bepic\b/i, "epic"],
    [/\bintimate\b/i, "intimate"],
    [/\braw\b/i, "raw"],
    [/\bstrip(?:ped)?[\s-]?(?:back|down)\b/i, "stripped-back"],
    [/\bunplugged\b/i, "unplugged acoustic"],
  ];

  const allPatterns = [...vocalPatterns, ...instrumentPatterns, ...productionPatterns];
  const seen = new Set<string>();
  for (const [pattern, cue] of allPatterns) {
    if (pattern.test(direction) && !seen.has(cue)) {
      seen.add(cue);
      cues.push(cue);
    }
  }

  return cues.slice(0, 5);
}

async function buildSunoPromptDriver(inputs: any, userProfile: any): Promise<string> {
  const guide = await resolveGuide(inputs || {});
  const guideKeywords = await getGenreGuideSunoKeywords(inputs || {});

  const language = inputs?.language || "English";
  const genre = inputs?.genre || "Pop";
  const subGenre = inputs?.subGenre || "";
  const instrumentation = inputs?.instrumentation || "";
  const audioEnv = inputs?.audioEnv || "studio-clean mix";
  const emotion = inputs?.emotion || "euphoric";
  const vocals = inputs?.vocals || "Female Solo";
  const duetType = inputs?.duetType || "";
  const referenceArtist = (inputs?.referenceArtist || "").trim();
  const creativeDirection = (inputs?.creativeDirection || inputs?.additionalInfo || "").trim();
  const maxLen = Number(process.env.AI_SUNO_PROMPT_MAX_LEN || 600);

  // ── Build from guide data when available ──
  if (guide) {
    const parts: string[] = [];

    // 1. Genre + subgenre identity (most important for SUNO)
    const subMatch = subGenre
      ? guide.subGenres.find(s => s.name.toLowerCase() === subGenre.toLowerCase())
      : null;
    // Avoid doubled genre names like "Conscious Hip-Hop Hip-Hop"
    const genreLower = genre.toLowerCase();
    const genreTag = subMatch
      ? (subMatch.name.toLowerCase().includes(genreLower) ? subMatch.name : `${subMatch.name} ${genre}`)
      : (subGenre && subGenre.toLowerCase().includes(genreLower) ? subGenre : `${subGenre || ""} ${genre}`.trim());
    parts.push(genreTag);

    // 2. BPM from subgenre or guide
    const guideBpm = guide.rhythmAndGroove.bpmRange;
    const bpmVal = subMatch?.bpmRange
      ? Math.round((subMatch.bpmRange.min + subMatch.bpmRange.max) / 2)
      : guideBpm.sweet;
    parts.push(`${bpmVal} BPM`);

    // 3. Groove and feel from guide (not inferred)
    parts.push(guide.rhythmAndGroove.grooveArchetype);
    if (guide.rhythmAndGroove.feel) {
      // Extract the relevant sub-genre feel if present
      const feelParts = guide.rhythmAndGroove.feel.split(/\.\s*/);
      const relevantFeel = subGenre
        ? feelParts.find(f => f.toLowerCase().includes(subGenre.toLowerCase())) || feelParts[0]
        : feelParts[0];
      if (relevantFeel) parts.push(relevantFeel.trim());
    }

    // 4. Mood/emotion
    parts.push(`${emotion} mood`);

    // 5. Vocal approach — concise tag, not full paragraph
    const vocalLabel = duetType ? `${vocals} (${duetType})` : vocals;
    // Extract just the first clause of phrasing for Suno (keep it short)
    const phrasingShort = (guide.vocalDelivery.phrasing || "").split(/[—.;]/)[0].trim();
    parts.push(phrasingShort ? `${vocalLabel}, ${phrasingShort}` : vocalLabel);

    // 6. Instrumentation — user choice first, then guide signature sounds
    if (instrumentation) {
      parts.push(instrumentation);
    }
    const sigSounds = guide.instrumentation.signatureSounds.slice(0, 3);
    if (sigSounds.length > 0) parts.push(sigSounds.join(", "));

    // 7. Production fingerprint from guide
    if (guide.productionFingerprint.mixAesthetic) {
      // Take first sentence of mix aesthetic
      const mixFirst = guide.productionFingerprint.mixAesthetic.split(/\.\s*/)[0];
      parts.push(mixFirst);
    }

    // 8. Sonic texture from guide
    const textures = guide.sonicPalette.timbre.slice(0, 2);
    if (textures.length > 0) parts.push(textures.join(", "));

    // 9. Subgenre-specific production notes
    if (subMatch?.productionNotes) {
      const prodFirst = subMatch.productionNotes.split(/\.\s*/)[0];
      parts.push(prodFirst);
    }

    // 10. Audio environment
    parts.push(audioEnv);

    // 11. Tempo feel — use sub-genre specific if available, otherwise skip
    //     (top-level psychologicalTempo is often too long for Suno)
    if (subMatch && (subMatch as any).psychologicalTempo) {
      parts.push((subMatch as any).psychologicalTempo.split(/[—.;]/)[0].trim());
    }

    // 12. Reference artist
    if (referenceArtist) parts.push(`reference: ${referenceArtist}`);

    // 13. Language (for non-English)
    if (language.toLowerCase() !== "english") {
      parts.push(`${language} vocals`);
    }

    // 14. Extract production-relevant cues from creative direction
    if (creativeDirection) {
      const productionCues = extractProductionCues(creativeDirection);
      if (productionCues.length > 0) {
        parts.push(productionCues.join(", "));
      }
    }

    // 15. SUNO essential keywords not already covered (renumbered)
    const promptSoFar = parts.join(", ").toLowerCase();
    const missingKeywords = guideKeywords.keywords.filter(k => !promptSoFar.includes(k.toLowerCase()));
    if (missingKeywords.length > 0) {
      parts.push(missingKeywords.slice(0, 4).join(", "));
    }

    // 15. Avoid keywords
    if (guideKeywords.avoid.length > 0) {
      parts.push(`avoid: ${guideKeywords.avoid.slice(0, 3).join(", ")}`);
    }

    return clampPromptLength(parts.filter(Boolean).join(", "), maxLen);
  }

  // ── Fallback: no guide available ──
  const logic = await loadCulturalLogicModule();
  const subProfile = logic?.getSubgenreSonicProfile?.(subGenre) || DEFAULT_SUBGENRE_PROFILE;
  const vocalApproach = inferVocalApproach(vocals, genre, emotion, duetType);
  const instrumentFocus = inferInstrumentFocus(instrumentation, genre);

  const fallback = [
    `${subGenre} ${genre}`,
    `${emotion} mood`,
    vocalApproach,
    instrumentFocus,
    `${subProfile.bpmRange}, ${audioEnv}`,
    referenceArtist ? `reference: ${referenceArtist}` : "",
    creativeDirection ? extractProductionCues(creativeDirection).join(", ") : "",
    guideKeywords.keywords.length > 0 ? guideKeywords.keywords.slice(0, 6).join(", ") : "",
    guideKeywords.avoid.length > 0 ? `avoid: ${guideKeywords.avoid.slice(0, 4).join(", ")}` : "",
  ].filter(Boolean).join(", ");

  return clampPromptLength(fallback, maxLen);
}

async function enforceSunoPromptDriver(songText: string, inputs: any, userProfile: any): Promise<string> {
  if (!songText?.trim()) return songText;
  const parsed = parseStructuredSong(songText);
  const driverPrompt = await buildSunoPromptDriver(inputs || {}, userProfile || {});
  const alignedLyrics = alignVocalIdentityInLyrics(parsed.lyrics, inputs?.vocals);
  return `Title: ${parsed.title}\n### SUNO Prompt\n${driverPrompt}\n### Lyrics\n${alignedLyrics}`.trim();
}

function countBracketTags(lyrics: string): number {
  if (!lyrics) return 0;
  const matches = lyrics.match(/\[[^\]\n]{2,80}\]/g);
  return Array.isArray(matches) ? matches.length : 0;
}

function countAdlibs(lyrics: string): number {
  if (!lyrics) return 0;
  const matches = lyrics.match(/\([^)\n]{1,60}\)/g);
  return Array.isArray(matches) ? matches.length : 0;
}

function hasRequiredStructureTags(lyrics: string, required: string[]): boolean {
  if (!lyrics) return false;
  const unique = Array.from(new Set(required.filter(Boolean)));
  return unique.every((tag) => lyrics.includes(tag));
}

function countSpecificTagHits(lyrics: string, tags: string[]): number {
  if (!lyrics || !Array.isArray(tags)) return 0;
  const uniqueTags = Array.from(new Set(tags.filter(Boolean)));
  return uniqueTags.reduce((count, tag) => count + (lyrics.includes(tag) ? 1 : 0), 0);
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

const SONG_CLICHE_PATTERNS: RegExp[] = [
  // Window pane variants
  /\bsunrise paints? (the )?window pane\b/i,
  /\bstreetlights? paints? (the )?window pane\b/i,
  /\bsunrise paints? (my|your|the) window pain\b/i,
  /\bstreetlights? paints? (my|your|the) window pain\b/i,
  // Generic emotional clichés
  /\brain on the glass\b/i,
  /\bgrew on trees\b/i,
  /\bborrow my light\b/i,
  /\bdays bled to weeks\b/i,
  /\bcold fries\b/i,
  /\bopen hands\b/i,
  /\bsomeday plans?\b/i,
  /\bbroken heart\b/i,
  /\btears? (in|on) (my|your) (eyes?|face)\b/i,
  /\blove (that|it) hurts\b/i,
  // Empowerment clichés
  /\bprecious like gold\b/i,
  /\bworth (?:your|my|their) weight in gold\b/i,
  /\bdim (?:your|my|the) light\b/i,
  /\blet (?:your|my) wings fly\b/i,
  /\blearn to fly\b/i,
  /\bspread (?:your|my) wings\b/i,
  /\bstand tall\b/i,
  /\brise above\b/i,
  /\bshine bright\b/i,
  /\byou(?:'re| are) (?:a )?diamond\b/i,
  /\byou(?:'re| are) (?:a )?queen\b/i,
  /\byou(?:'re| are) (?:a )?king\b/i,
  /\byou(?:'re| are) (?:a )?warrior\b/i,
  /\bdreams? (?:come|came) true\b/i,
  /\brewrite the stars\b/i,
  /\bpaint (?:your|my) (?:own )?sky\b/i,
  /\bworld(?:'s| is) (?:a |your )?canvas\b/i,
  /\bflame? (?:that |which )?never dies?\b/i,
  /\bunbreakable\b/i,
  /\bunstoppable\b/i,
  /\bwear (?:your|my) crown\b/i,
  /\bfind (?:your|my) voice\b/i,
  /\bjourney,? not (?:the )?destination\b/i,
  /\bjoy in the journey\b/i,
  /\bstars all over\b/i,
  /\bwrite (?:your|my) (?:own )?destiny\b/i,
  /\bmasterpiece\b/i,
];

const PERFORMANCE_TAG_HINTS: RegExp[] = [
  /\[falsetto\]/i,
  /\[head voice\]/i,
  /\[whisper(?:ed)?\]/i,
  /\[breathy\]/i,
  /\[harmony(?: stack)?\]/i,
  /\[double(?: track)?\]/i,
  /\[octave(?: up| down)?\]/i,
  /\[call[- ]and[- ]response\]/i,
  /\[belt\]/i,
  /\[soft(?:ly)?\]/i,
  /\[riff(?:s)?\]/i,
  /\[run(?:s)?\]/i,
  /\[drop\]/i,
  /\[breakdown\]/i,
  /\[half[- ]time\]/i,
];

function extractAllBracketTags(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/\[[^\]\n]{2,80}\]/g);
  return Array.isArray(matches) ? matches : [];
}

function isSectionTag(tag: string): boolean {
  const value = tag.trim().toLowerCase();
  return (
    /^\[(intro|verse|pre-chorus|prechorus|chorus|bridge|outro)(\s*\d+)?\]$/.test(value) ||
    /^\[vocalist:\s*(male|female|duet|group)\]$/.test(value) ||
    /^\[(energy|mood):/.test(value)
  );
}

function countPerformanceTags(text: string): number {
  const tags = extractAllBracketTags(text);
  const tagHits = tags.filter((tag) => !isSectionTag(tag)).length;
  const hintHits = PERFORMANCE_TAG_HINTS.reduce((count, pattern) => count + (pattern.test(text) ? 1 : 0), 0);
  return Math.max(tagHits, hintHits);
}

function countClicheHits(text: string): number {
  if (!text) return 0;
  return SONG_CLICHE_PATTERNS.reduce((count, pattern) => count + (pattern.test(text) ? 1 : 0), 0);
}

function getChorusBlocks(songText: string): string[][] {
  const lines = (songText || "").split("\n");
  const blocks: string[][] = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim().toLowerCase();
    if (line === "[chorus]" || line.startsWith("[chorus ")) {
      const block: string[] = [];
      for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
        const candidate = lines[cursor].trim();
        if (/^\[[^\]]+\]$/.test(candidate) && candidate.toLowerCase() !== "[build up]") break;
        if (candidate) block.push(candidate.toLowerCase());
      }
      if (block.length) blocks.push(block);
    }
  }
  return blocks;
}

function getChorusEvolutionDelta(songText: string): number {
  const blocks = getChorusBlocks(songText);
  if (blocks.length < 2) return 2;
  const baseline = blocks[0];
  let minDelta = Number.POSITIVE_INFINITY;
  for (let index = 1; index < blocks.length; index += 1) {
    const current = blocks[index];
    const maxLines = Math.max(baseline.length, current.length);
    let changed = 0;
    for (let lineIndex = 0; lineIndex < maxLines; lineIndex += 1) {
      if ((baseline[lineIndex] || "") !== (current[lineIndex] || "")) changed += 1;
    }
    minDelta = Math.min(minDelta, changed);
  }
  return Number.isFinite(minDelta) ? minDelta : 0;
}

function hasDynamicContour(text: string): boolean {
  const lower = (text || "").toLowerCase();
  const hasHigh = lower.includes("[energy: high]") || lower.includes("[build up]") || lower.includes("[belt]");
  const hasLow =
    lower.includes("[energy: low]") ||
    lower.includes("[whisper]") ||
    lower.includes("[soft]") ||
    lower.includes("[breathy]");
  return hasHigh && hasLow;
}

function hasNarratorIdentityMismatch(songText: string): boolean {
  const lower = (songText || "").toLowerCase();
  const male = /\[vocalist:\s*male\]/i.test(songText);
  const female = /\[vocalist:\s*female\]/i.test(songText);

  if (male) {
    if (/\bi am (a )?woman\b/.test(lower)) return true;
    if (/\bthe woman in\b/.test(lower)) return true;
    if (/\bthis woman\b/.test(lower)) return true;
  }
  if (female) {
    if (/\bi am (a )?man\b/.test(lower)) return true;
    if (/\bthe man in\b/.test(lower)) return true;
    if (/\bthis man\b/.test(lower)) return true;
  }
  return false;
}

function hasSelectedVocalMismatch(songText: string, vocals: string | undefined): boolean {
  const expected = inferExpectedVocalIdentity(vocals);
  if (!expected || expected === "duet" || expected === "group") return false;
  const lower = (songText || "").toLowerCase();

  if (expected === "female") {
    if (/\[vocalist:\s*male\]/i.test(songText)) return true;
    if (/\bmale lead\b/.test(lower) || /\[male vocal\]/i.test(songText)) return true;
  }
  if (expected === "male") {
    if (/\[vocalist:\s*female\]/i.test(songText)) return true;
    if (/\bfemale lead\b/.test(lower) || /\[female vocal\]/i.test(songText)) return true;
  }
  return false;
}

type SongDepthMetrics = {
  score: number;
  strong: boolean;
  clicheHits: number;
  performanceTagCount: number;
  chorusEvolutionDelta: number;
  dynamicContour: boolean;
  narratorMismatch: boolean;
  adlibCount: number;
  continuityOverlap: number;
  anchorReuse: number;
  lexicalDiversity: number;
  oneLinerRisk: boolean;
  issues: string[];
};

function getLyricNarrativeContinuity(songText: string): {
  continuityOverlap: number;
  anchorReuse: number;
  lexicalDiversity: number;
  oneLinerRisk: boolean;
} {
  const lyrics = extractLyricsBody(songText || "");
  const lines = lyrics
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^\[[^\]]+\]$/.test(line))
    .map((line) => line.replace(/\([^)\n]{1,60}\)/g, "").trim())
    .filter(Boolean);

  const tokenizedByLine = lines.map((line) => {
    const clean = line
      .toLowerCase()
      .replace(/[^\p{L}\p{N}'\s]/gu, " ")
      .trim();
    return Array.from(
      new Set(
        clean
          .split(/\s+/)
          .map((part) => part.trim())
          .filter((part) => part.length >= 3 && !/^\d+$/.test(part))
      )
    );
  });

  const jaccard = (a: string[], b: string[]): number => {
    if (!a.length || !b.length) return 0;
    const bSet = new Set(b);
    let intersection = 0;
    for (const token of a) {
      if (bSet.has(token)) intersection += 1;
    }
    const union = new Set([...a, ...b]).size;
    return union ? intersection / union : 0;
  };

  let overlapTotal = 0;
  let overlapPairs = 0;
  for (let i = 1; i < tokenizedByLine.length; i += 1) {
    const prev = tokenizedByLine[i - 1];
    const current = tokenizedByLine[i];
    if (prev.length >= 2 && current.length >= 2) {
      overlapTotal += jaccard(prev, current);
      overlapPairs += 1;
    }
  }
  const continuityOverlap = overlapPairs ? overlapTotal / overlapPairs : 0;

  const tokenLineHits = new Map<string, number>();
  const uniqueTokenPool = new Set<string>();
  let totalTokenCount = 0;
  for (const lineTokens of tokenizedByLine) {
    totalTokenCount += lineTokens.length;
    for (const token of lineTokens) {
      uniqueTokenPool.add(token);
      tokenLineHits.set(token, (tokenLineHits.get(token) || 0) + 1);
    }
  }

  const anchorReuse = Array.from(tokenLineHits.values()).filter((count) => count >= 3).length;
  const lexicalDiversity = totalTokenCount ? uniqueTokenPool.size / totalTokenCount : 1;
  const oneLinerRisk =
    lines.length >= 8 &&
    continuityOverlap < 0.07 &&
    anchorReuse < 2 &&
    lexicalDiversity > 0.86;

  return { continuityOverlap, anchorReuse, lexicalDiversity, oneLinerRisk };
}

function getSongDepthMetrics(songText: string): SongDepthMetrics {
  const lyrics = extractLyricsBody(songText);
  const clicheHits = countClicheHits(songText);
  const performanceTagCount = countPerformanceTags(songText);
  const chorusEvolutionDelta = getChorusEvolutionDelta(songText);
  const dynamicContour = hasDynamicContour(songText);
  const narratorMismatch = hasNarratorIdentityMismatch(songText);
  const adlibCount = countAdlibs(lyrics);
  const continuity = getLyricNarrativeContinuity(songText);

  let score = 100;
  const issues: string[] = [];

  if (narratorMismatch) {
    score -= 30;
    issues.push("Narrator identity does not match vocalist tag.");
  }
  if (clicheHits >= 3) {
    score -= 25;
    issues.push("Lexicon is cliche-heavy and reads generic.");
  } else if (clicheHits >= 2) {
    score -= 15;
    issues.push("Some hallmark/cliche phrases reduce originality.");
  }
  if (performanceTagCount < 3) {
    score -= 15;
    issues.push("Performance tags are too shallow to drive arrangement and delivery.");
  }
  if (adlibCount < 3) {
    score -= 10;
    issues.push("Adlibs are too sparse to support vocal texture and personality.");
  } else if (adlibCount > 18) {
    score -= 8;
    issues.push("Adlibs are overused and can feel noisy or gimmicky.");
  }
  if (chorusEvolutionDelta < 2) {
    score -= 15;
    issues.push("Chorus repeats do not evolve enough across passes.");
  }
  if (!dynamicContour) {
    score -= 10;
    issues.push("Dynamic contour is flat; no clear low/high performance contrast.");
  }
  if (continuity.oneLinerRisk) {
    score -= 18;
    issues.push("Verses read as disconnected one-liners instead of a continuous scene.");
  } else if (continuity.continuityOverlap < 0.05) {
    score -= 8;
    issues.push("Adjacent lyric lines do not connect enough narratively.");
  }
  if (continuity.anchorReuse < 1) {
    score -= 6;
    issues.push("Not enough recurring anchors/themes across lines to create coherence.");
  }
  if (continuity.lexicalDiversity < 0.35) {
    score -= 6;
    issues.push("Word choices are too repetitive and reduce lyrical texture.");
  }

  score = Math.max(0, score);
  const strong =
    score >= 86 &&
    !narratorMismatch &&
    clicheHits <= 1 &&
    performanceTagCount >= 4 &&
    chorusEvolutionDelta >= 2 &&
    dynamicContour &&
    adlibCount >= 3 &&
    adlibCount <= 18 &&
    !continuity.oneLinerRisk &&
    continuity.continuityOverlap >= 0.05 &&
    continuity.anchorReuse >= 1 &&
    continuity.lexicalDiversity >= 0.35;

  return {
    score,
    strong,
    clicheHits,
    performanceTagCount,
    chorusEvolutionDelta,
    dynamicContour,
    narratorMismatch,
    adlibCount,
    continuityOverlap: continuity.continuityOverlap,
    anchorReuse: continuity.anchorReuse,
    lexicalDiversity: continuity.lexicalDiversity,
    oneLinerRisk: continuity.oneLinerRisk,
    issues,
  };
}

async function enforceSongDepthAndTexture(songText: string, inputs: any, userProfile: any): Promise<string> {
  if (!songText?.trim()) return songText;
  let currentSong = songText;
  let currentMetrics = getSongDepthMetrics(currentSong);
  if (currentMetrics.strong) return currentSong;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const issueList = currentMetrics.issues.length
      ? currentMetrics.issues.map((issue) => `- ${issue}`).join("\n")
      : "- Improve texture and specificity.";
    const prompt = `
You are a top-tier songwriter and lyric doctor.
Rewrite this song to fix the specific issues listed below. Preserve the core story, emotional intent, and section order.

Return ONLY this exact format:
Title: ...
### SUNO Prompt
...
### Lyrics
...

Issues to fix:
${issueList}

Constraints:
- Keep language and genre/subgenre intent intact.
- Replace generic wording with concrete, specific imagery — name real places, objects, sensations.
- Verses should feel like unfolding scenes with narrative continuity.
- Ensure dynamic contour: soft moments and intense moments.
- Keep adlibs musical and style-aware (3-18 total).

Context: ${inputs?.genre || "Pop"} / ${inputs?.subGenre || "Modern"} in ${inputs?.language || "English"}, ${inputs?.emotion || "Euphoric"} mood.

Song:
${currentSong}
    `.trim();
    try {
      const rewritten = await openAIResponses(prompt);
      const updated = getSongDepthMetrics(rewritten);
      if (updated.score > currentMetrics.score) {
        currentSong = rewritten;
        currentMetrics = updated;
      }
      if (currentMetrics.strong) break;
    } catch {
      break;
    }
  }
  return currentSong;
}

function isStructuralSectionTag(tag: string): boolean {
  const value = (tag || "").trim().toLowerCase();
  return (
    /^\[(intro|verse|pre-chorus|prechorus|chorus|post-chorus|postchorus|bridge|outro)(\s*\d+)?\]$/.test(value) ||
    /^\[(hook|interlude|refrain|ad-lib section|adlib section|end)(\s*\d+)?\]$/.test(value)
  );
}

function getSectionBlocksForCoverage(lyrics: string): Array<{ tag: string; lines: string[] }> {
  const lines = (lyrics || "").split("\n");
  const blocks: Array<{ tag: string; lines: string[] }> = [];
  let current: { tag: string; lines: string[] } | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const firstTagMatch = line.match(/^\s*(\[[^\]\n]{2,80}\])/);
    const firstTag = firstTagMatch?.[1] || "";
    if (firstTag && isStructuralSectionTag(firstTag)) {
      current = { tag: firstTag, lines: [] };
      blocks.push(current);
      const remainder = line.slice(line.indexOf(firstTag) + firstTag.length).trim();
      if (remainder) current.lines.push(remainder);
      continue;
    }

    if (!current) {
      current = { tag: "[Verse]", lines: [] };
      blocks.push(current);
    }
    current.lines.push(line);
  }

  return blocks;
}

function getSectionTagCoverage(lyrics: string): {
  coreSectionCount: number;
  coreTaggedSections: number;
  coreCoverage: number;
  chorusCount: number;
  chorusTaggedSections: number;
  chorusCoverage: number;
  coreInlineCoverage: number;
  chorusInlineCoverage: number;
} {
  const blocks = getSectionBlocksForCoverage(lyrics);
  const coreBlocks = blocks.filter((block) =>
    /^\[(intro|verse|pre-chorus|prechorus|chorus|bridge|outro)(\s*\d+)?\]$/i.test(block.tag)
  );
  const chorusBlocks = coreBlocks.filter((block) => /^\[chorus(\s*\d+)?\]$/i.test(block.tag));

  const hasSectionMeta = (block: { tag: string; lines: string[] }): boolean => {
    const body = block.lines.join("\n");
    const tags = body.match(/\[[^\]\n]{2,80}\]/g) || [];
    const nonSectionTags = tags.filter((tag) => !isSectionTag(tag)).length;
    const adlibs = countAdlibs(body);
    return nonSectionTags + adlibs > 0;
  };

  const coreTaggedSections = coreBlocks.filter(hasSectionMeta).length;
  const chorusTaggedSections = chorusBlocks.filter(hasSectionMeta).length;
  const coreCoverage = coreBlocks.length ? coreTaggedSections / coreBlocks.length : 0;
  const chorusCoverage = chorusBlocks.length ? chorusTaggedSections / chorusBlocks.length : 1;
  const getInlineLineCoverage = (block: { tag: string; lines: string[] }): number => {
    const candidateLines = block.lines
      .map((line) => line.trim())
      .filter((line) => line && !/^\[[^\]]+\]$/.test(line));
    if (!candidateLines.length) return 0;
    const linesWithInlineCue = candidateLines.filter((line) => {
      const adlib = /\([^)\n]{1,60}\)/.test(line);
      const tags = line.match(/\[[^\]\n]{2,80}\]/g) || [];
      const nonStructuralTags = tags.filter((tag) => !isSectionTag(tag) && !isStructuralSectionTag(tag)).length;
      return adlib || nonStructuralTags > 0;
    }).length;
    return linesWithInlineCue / candidateLines.length;
  };
  const coreInlineCoverage = coreBlocks.length
    ? coreBlocks.reduce((acc, block) => acc + getInlineLineCoverage(block), 0) / coreBlocks.length
    : 0;
  const chorusInlineCoverage = chorusBlocks.length
    ? chorusBlocks.reduce((acc, block) => acc + getInlineLineCoverage(block), 0) / chorusBlocks.length
    : 1;

  return {
    coreSectionCount: coreBlocks.length,
    coreTaggedSections,
    coreCoverage,
    chorusCount: chorusBlocks.length,
    chorusTaggedSections,
    chorusCoverage,
    coreInlineCoverage,
    chorusInlineCoverage,
  };
}

function getMetaTagOrchestrationMetrics(songText: string, plan: MetaTagPlan) {
  const lyrics = extractLyricsBody(songText);
  if (!lyrics) {
    return {
      strong: false,
      score: 0,
      tagCount: 0,
      adlibCount: 0,
      hasStructure: false,
      accentHits: 0,
      moodHits: 0,
      hasVocalTypeTag: false,
      coreCoverage: 0,
      chorusCoverage: 0,
      coreInlineCoverage: 0,
      chorusInlineCoverage: 0,
    };
  }
  const tagCount = countBracketTags(lyrics);
  const adlibCount = countAdlibs(lyrics);
  const hasStructure = hasRequiredStructureTags(lyrics, plan.structureTags);
  const accentHits = countSpecificTagHits(lyrics, plan.genreAccentTags);
  const moodHits = countSpecificTagHits(lyrics, plan.moodEnergyTags);
  const hasVocalTypeTag = !plan.requireVocalTypeTag || lyrics.includes(plan.vocalTypeTag);
  const coverage = getSectionTagCoverage(lyrics);

  const structureScore = hasStructure ? 1 : 0;
  const tagDensityScore = clamp01(tagCount / Math.max(1, plan.minTagCount));
  const adlibScore = clamp01(adlibCount / Math.max(1, plan.minAdlibCount));
  const accentScore = clamp01(accentHits / Math.max(1, plan.requiredAccentHits));
  const moodScore = clamp01(moodHits / Math.max(1, plan.requiredMoodHits));
  const vocalScore = hasVocalTypeTag ? 1 : 0;
  const coreCoverageScore = clamp01(coverage.coreCoverage);
  const chorusCoverageScore = clamp01(coverage.chorusCoverage);
  const coreInlineCoverageScore = clamp01(coverage.coreInlineCoverage / 0.4);
  const chorusInlineCoverageScore = clamp01(coverage.chorusInlineCoverage / 0.4);

  const score = Math.round(
    structureScore * 30 +
      tagDensityScore * 18 +
      adlibScore * 15 +
      accentScore * 10 +
      moodScore * 6 +
      vocalScore * 4 +
      coreCoverageScore * 7 +
      chorusCoverageScore * 5 +
      coreInlineCoverageScore * 3 +
      chorusInlineCoverageScore * 2
  );

  const strong =
    hasStructure &&
    tagCount >= plan.minTagCount &&
    adlibCount >= plan.minAdlibCount &&
    accentHits >= plan.requiredAccentHits &&
    moodHits >= plan.requiredMoodHits &&
    hasVocalTypeTag &&
    coverage.coreCoverage >= 0.8 &&
    coverage.chorusCoverage >= 1 &&
    coverage.coreInlineCoverage >= 0.4 &&
    coverage.chorusInlineCoverage >= 0.4 &&
    score >= 85;

  return {
    strong,
    score,
    tagCount,
    adlibCount,
    hasStructure,
    accentHits,
    moodHits,
    hasVocalTypeTag,
    coreCoverage: coverage.coreCoverage,
    chorusCoverage: coverage.chorusCoverage,
    coreInlineCoverage: coverage.coreInlineCoverage,
    chorusInlineCoverage: coverage.chorusInlineCoverage,
  };
}

async function enforceMetaTagOrchestration(songText: string, inputs: any): Promise<string> {
  if (!songText?.trim()) return songText;
  const pkg = await getMetaTagPackage(inputs || {});
  let bestText = songText;
  let bestMetrics = getMetaTagOrchestrationMetrics(songText, pkg.plan);
  if (bestMetrics.strong) return songText;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const missingCoreCoverage = Math.max(0, 0.8 - bestMetrics.coreCoverage);
    const prompt = `
You are a song structure orchestrator.
Rewrite the song so tags/adlibs are logical, dynamic, and genre-specific without changing the core meaning.

Return ONLY this exact format:
Title: ...
### SUNO Prompt
...
### Lyrics
...

Hard requirements:
${pkg.strictSpec}

Additional enforcement:
- Bracket tags ([Verse], [Chorus], [Bridge], etc.) go on their OWN line as section headers. NEVER place bracket tags inline within a lyric line.
- NEVER invent fake performance tags like [Vocals: Confident], [Energy: High], [Harmonies swell]. Only use standard section tags.
- Adlibs in parentheses may appear inline where a real performer would naturally ad-lib. Keep them sparse (max ~30% of lines) and genre-authentic.
- Do not stack all adlibs in one section; distribute them naturally throughout the song arc.

Current quality deficits:
- Core section tag coverage: ${(bestMetrics.coreCoverage * 100).toFixed(0)}% (target 80%+)
- Chorus tag coverage: ${(bestMetrics.chorusCoverage * 100).toFixed(0)}% (target 100%)

Constraints:
- Keep language, genre, and story intent unchanged.
- PRESERVE the existing section order — do NOT rearrange sections. Only add/improve tags within the existing structure.
- Bracket tags go on their own line as section headers ONLY. Never inline within lyrics.
- Remove any invented tags like [Vocals: ...], [Energy: ...], [Mood: ...], [Harmonies ...], [Drums ...].
- Adlibs in parentheses should be sparse (max ~30% of lines) and feel like real performer ad-libs.

Song to rewrite:
${bestText}
    `.trim();

    try {
      const rewritten = await openAIResponses(prompt);
      const rewrittenMetrics = getMetaTagOrchestrationMetrics(rewritten, pkg.plan);
      if (rewrittenMetrics.score > bestMetrics.score) {
        bestText = rewritten;
        bestMetrics = rewrittenMetrics;
      }
      if (bestMetrics.strong) break;
    } catch {
      break;
    }
  }
  return bestText;
}

function parseLooseJson(text: string): any | null {
  if (!text || typeof text !== "string") return null;
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() || trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(candidate.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}


const getUserProfileByEmailRef = makeFunctionReference<"query">("app:getUserProfileByEmail");

async function openAIResponses(prompt: string, model = getTextModel()): Promise<string> {
  const apiKey = getRequestGeminiTextApiKey();
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response: any = await ai.models.generateContent({
      model,
      contents: [{ text: prompt }],
    });
    const text =
      typeof response?.text === "string"
        ? response.text
        : Array.isArray(response?.candidates?.[0]?.content?.parts)
          ? response.candidates[0].content.parts
              .map((part: any) => (typeof part?.text === "string" ? part.text : ""))
              .join("\n")
              .trim()
          : "";
    if (!text) {
      throw Object.assign(new Error("Gemini text generation returned no text."), {
        status: 502,
        code: "gemini_no_text",
      });
    }
    return text;
  } catch (error: any) {
    const details = error?.message || error?.details || "Gemini text generation failed.";
    const lower = String(details).toLowerCase();
    const isAuth = lower.includes("api key") || lower.includes("permission") || lower.includes("unauth");
    throw Object.assign(
      new Error(
        isAuth
          ? "Gemini API key is required or invalid. Add your own Gemini API key in the app and try again."
          : "Gemini text generation failed."
      ),
      {
        status: isAuth ? 401 : 502,
        code: isAuth ? "gemini_text_auth" : "gemini_text_failed",
        details,
      }
    );
  }
}

let requestGeminiTextApiKey: string | null = null;
let requestRequiresUserGeminiKey = false;

function getRequestGeminiTextApiKey(): string {
  const key = (requestGeminiTextApiKey || "").trim();
  if (key) return key;
  if (!requestRequiresUserGeminiKey) {
    return getGeminiApiKey();
  }
  throw Object.assign(new Error("Missing Gemini API key. Please add your own Gemini API key in the app."), {
    status: 401,
    code: "missing_user_gemini_api_key",
  });
}

function parseDataUrlToBlob(dataUrl: string): Blob | null {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) return null;
  const mimeType = match[1];
  const b64 = match[2];
  const bytes = Buffer.from(b64, "base64");
  return new Blob([bytes], { type: mimeType });
}

async function getAvatarBlobByEmail(email: string): Promise<Blob | null> {
  const convexUrl = process.env.CONVEX_URL;
  const convexAdminKey = process.env.CONVEX_ADMIN_KEY;
  if (!convexUrl || !convexAdminKey) return null;
  try {
    const client: any = new ConvexHttpClient(convexUrl);
    client.setAdminAuth(convexAdminKey);
    const profile: any = await client.query(getUserProfileByEmailRef as any, { email });
    const avatar = profile?.avatar_url;
    if (!avatar || typeof avatar !== "string") return null;
    if (avatar.startsWith("data:")) return parseDataUrlToBlob(avatar);
    if (avatar.startsWith("http://") || avatar.startsWith("https://")) {
      const r = await fetch(avatar);
      if (!r.ok) return null;
      return await r.blob();
    }
    return null;
  } catch {
    return null;
  }
}

async function shouldRequireUserGeminiKey(email: string): Promise<boolean> {
  const convexUrl = process.env.CONVEX_URL;
  const convexAdminKey = process.env.CONVEX_ADMIN_KEY;
  if (!convexUrl || !convexAdminKey) return false;
  try {
    const client: any = new ConvexHttpClient(convexUrl);
    client.setAdminAuth(convexAdminKey);
    const profile: any = await client.query(getUserProfileByEmailRef as any, { email });
    return String(profile?.tier || "").toLowerCase() === "skool";
  } catch {
    return false;
  }
}

async function getAvatarBlob(avatarUrl: string | undefined, email: string): Promise<Blob | null> {
  const avatar = typeof avatarUrl === "string" ? avatarUrl.trim() : "";
  if (avatar) {
    if (avatar.startsWith("data:")) return parseDataUrlToBlob(avatar);
    if (avatar.startsWith("http://") || avatar.startsWith("https://")) {
      try {
        const r = await fetch(avatar);
        if (r.ok) return await r.blob();
      } catch {
        // Ignore and fall back to DB lookup.
      }
    }
  }
  return getAvatarBlobByEmail(email);
}

async function geminiGenerateImage(
  prompt: string,
  aspectRatio: "9:16" | "1:1" | "16:9" = "9:16",
  referenceImage?: Blob | null
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: getRequestGeminiTextApiKey() });
  const promptWithAspect = `${prompt}\nTarget aspect ratio: ${aspectRatio}.`;
  const contents: any[] = [{ text: promptWithAspect }];

  if (referenceImage) {
    const arrayBuffer = await referenceImage.arrayBuffer();
    contents.push({
      inlineData: {
        mimeType: referenceImage.type || "image/png",
        data: Buffer.from(arrayBuffer).toString("base64"),
      },
    });
  }

  const maxAttempts = Math.max(1, Number(process.env.GEMINI_IMAGE_RETRY_ATTEMPTS || 3));
  const baseBackoffMs = Math.max(200, Number(process.env.GEMINI_IMAGE_RETRY_BASE_MS || 700));
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response: any = await ai.models.generateContent({
        model: getGeminiImageModel(),
        contents,
        config: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      });

      const parts = Array.isArray(response?.parts)
        ? response.parts
        : Array.isArray(response?.candidates?.[0]?.content?.parts)
          ? response.candidates[0].content.parts
          : [];
      const imagePart = parts.find((part: any) => part?.inlineData?.data);
      const b64 = imagePart?.inlineData?.data;
      if (!b64 || typeof b64 !== "string") {
        throw Object.assign(new Error("Gemini image generation returned no base64 payload"), {
          status: 502,
          code: "gemini_no_image_payload",
        });
      }
      return `data:image/png;base64,${b64}`;
    } catch (error: any) {
      lastError = error;
      const text = `${error?.message || ""} ${error?.details || ""}`.toLowerCase();
      const transient =
        text.includes("deadline expired") ||
        text.includes("deadline exceeded") ||
        text.includes("unavailable") ||
        text.includes("503");
      if (!transient || attempt >= maxAttempts) break;
      const waitMs = baseBackoffMs * attempt;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }

  const errorText = `${lastError?.message || ""} ${lastError?.details || ""}`.toLowerCase();
  const isTransientFailure =
    errorText.includes("deadline expired") ||
    errorText.includes("deadline exceeded") ||
    errorText.includes("unavailable") ||
    errorText.includes("503");
  if (isTransientFailure) {
    throw Object.assign(
      new Error("Artwork generation service is temporarily unavailable. Please retry in a few seconds."),
      {
        status: 503,
        code: "artwork_provider_unavailable",
      }
    );
  }

  throw lastError || Object.assign(new Error("Artwork generation failed."), { status: 500, code: "artwork_failed" });
}

async function describeAvatarForPrompt(referenceImage: Blob): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: getRequestGeminiTextApiKey() });
  const arrayBuffer = await referenceImage.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  const response: any = await ai.models.generateContent({
    model: getGeminiVisionModel(),
    contents: [
      {
        text: `
Analyze this avatar image and output a compact identity profile for image generation.
Use only visible attributes. If unclear, write "not visible" rather than guessing.
Return ONLY this exact bullet template:
- Face shape:
- Skin complexion and undertone:
- Body type/build (if visible):
- Apparent age range:
- Gender presentation:
- Hair style/color:
- Eyes:
- Distinctive facial features:
- Typical framing in source image (headshot/half/full body):
- Identity preservation notes:
        `.trim(),
      },
      {
        inlineData: {
          mimeType: referenceImage.type || "image/png",
          data: base64,
        },
      },
    ],
  });

  const text =
    typeof response?.text === "string"
      ? response.text
      : Array.isArray(response?.candidates?.[0]?.content?.parts)
        ? response.candidates[0].content.parts
            .map((part: any) => (typeof part?.text === "string" ? part.text : ""))
            .join("\n")
            .trim()
        : "";

  if (!text) {
    return [
      "- Face shape: preserve from avatar",
      "- Skin complexion and undertone: preserve from avatar",
      "- Body type/build (if visible): preserve from avatar",
      "- Apparent age range: preserve from avatar",
      "- Gender presentation: preserve from avatar",
      "- Hair style/color: preserve from avatar",
      "- Eyes: preserve from avatar",
      "- Distinctive facial features: preserve from avatar",
      "- Typical framing in source image (headshot/half/full body): preserve framing intent",
      "- Identity preservation notes: keep same person identity across all outputs",
    ].join("\n");
  }

  return text;
}

/**
 * Build a genre truth paragraph — readable prose from guide data, not imperative lists.
 * Reads like music criticism, not a checklist.
 */
async function getGenreTruthParagraph(inputs: any): Promise<string> {
  const guide = await resolveGuide(inputs || {});
  if (!guide) return "";

  const subGenreName = inputs?.subGenre || "";
  const matchedSub = subGenreName
    ? guide.subGenres.find(s => s.name.toLowerCase() === subGenreName.toLowerCase())
    : null;

  const parts: string[] = [];

  // Cultural identity
  const culturalCore = guide.culturalContext.overview.split(".")[0];
  parts.push(`${guide.name} at its core is ${culturalCore}.`);

  // Groove and timing feel
  parts.push(`The groove lives in ${guide.rhythmAndGroove.grooveArchetype} — ${guide.microTimingAndFeel?.genreSpecificFeel || guide.rhythmAndGroove.feel.split(".")[0]}.`);

  // Lyrical tradition
  parts.push(`Lyrically, the tradition demands ${guide.lyricalConventions.storytellingApproach}.`);

  // Vocal character
  parts.push(`The voice carries ${guide.vocalDelivery.affect}.`);

  // What separates authentic from tourist
  if (guide.mistakeConventions?.authenticRoughness) {
    parts.push(`What separates authentic from tourist: ${guide.mistakeConventions.authenticRoughness}.`);
  }

  // Silence and space
  if (guide.silenceAndSpace?.negativeSpaceRole) {
    parts.push(`Space matters: ${guide.silenceAndSpace.negativeSpaceRole.split(".")[0]}.`);
  }

  // Sub-genre specifics as creative constraints (not checkbox items)
  if (matchedSub) {
    parts.push(`${matchedSub.name} specifically: ${matchedSub.description}`);
    if (matchedSub.productionNotes) {
      parts.push(`The production: ${matchedSub.productionNotes.split(".")[0]}.`);
    }
  }

  return parts.join(" ");
}

/**
 * Build specificity anchors — "here's how to write well" instead of "don't use these clichés".
 * Teaches the model what good writing feels like for this genre.
 */
async function getSpecificityAnchors(inputs: any): Promise<string> {
  const guide = await resolveGuide(inputs || {});
  if (!guide) return "Write with concrete, specific imagery. Name real places, objects, sensations.";

  const anchors: string[] = [];

  // Themes → specificity direction
  const themes = guide.lyricalConventions.themes.slice(0, 3);
  if (themes.length > 0) {
    anchors.push(`Core themes for this genre: ${themes.join(", ")}. Ground these in specific details — name actual places, objects, and sensations rather than abstract concepts.`);
  }

  // Figurative language style
  if (guide.lyricalConventions.figurativeLanguage) {
    anchors.push(`Figurative language: ${guide.lyricalConventions.figurativeLanguage}`);
  }

  // Vocabulary register
  if (guide.lyricalConventions.vocabulary) {
    anchors.push(`Vocabulary: ${guide.lyricalConventions.vocabulary}`);
  }

  // What to avoid — framed as "instead, do this"
  const cliches = guide.lyricalConventions.cliches || [];
  if (cliches.length > 0) {
    anchors.push(`Instead of worn-out phrases like "${cliches[0]}", show the same emotion through a specific lived-in moment.`);
  }

  return anchors.join("\n");
}

async function generateSong(payload: any) {
  const { inputs, userProfile } = payload || {};
  const startMs = Date.now();

  const genreTruth = await getGenreTruthParagraph(inputs || {});
  const specificityAnchors = await getSpecificityAnchors(inputs || {});
  const referenceTeaching = await compileReferenceTrackTeaching(inputs || {});
  const metaTagPackage = await getMetaTagPackage(inputs || {});
  const vocalDirective = getVocalAndClicheHardDirective(inputs);

  const userDirection = inputs?.creativeDirection || inputs?.additionalInfo || (inputs as any)?.awkwardMoment || "";
  const hasUserDirection = userDirection.trim().length > 0;
  const register = detectRegisterHint(inputs);

  const prompt = `
You are a professional songwriter who has lived and breathed ${inputs?.subGenre || ""} ${inputs?.genre || "Pop"} for 20 years.

Return only:
Title: ...
### SUNO Prompt
[production direction, 60-80 words]
### Lyrics
[full lyrics with section tags and adlibs]

CONTEXT:
- Language: ${inputs?.language || "English"}
- Genre: ${inputs?.genre || "Pop"} / ${inputs?.subGenre || "Modern"}
- Instrumentation: ${inputs?.instrumentation || "genre-appropriate"}
- Mood: ${inputs?.emotion || "Euphoric"}
- Scene: ${inputs?.scene || "Studio"} | Audio: ${inputs?.audioEnv || "Studio (Clean)"}
- Vocals: ${inputs?.vocals || "Female Solo"}${inputs?.duetType ? ` (${inputs.duetType})` : ""}
- Register: ${register}
- Concrete details to weave in: ${inputs?.mundaneObjects || "(none)"}

${hasUserDirection ? `USER'S CREATIVE DIRECTION (highest priority — honor this alongside genre conventions):
${userDirection}

INTERPRETING THE DIRECTION:
The user's creative direction contains two types of information — treat them differently:
1. SUBJECT MATTER (what to write about): character details, themes, narrative scenarios, relationships, conflicts. Weave these into the lyrics as vivid imagery and storytelling.
2. CRAFT TECHNIQUES (how to write it): mentions of metaphors, double/triple entendres, cadence changes, wordplay, flow switches, vocabulary range, etc. These are INSTRUCTIONS for how you should write — DEMONSTRATE these techniques, do NOT name them in the lyrics.

SHOW, DON'T TELL — this is non-negotiable:
- If the direction says "double entendres" → write lines with actual double meanings. NEVER write "my double entendres hit different."
- If it says "metaphors" → write vivid metaphors. NEVER write "I weave metaphors like a maestro."
- If it says "cadence changes" → actually shift your rhythmic pattern between sections. NEVER write "my cadence shifts."
- If it says "hourglass figure" → describe the body through imagery (waist cinched like a corset, hips that own the room). NEVER just write "hourglass figure" or "hourglass divine."
- If it says "expansive vocabulary" → USE rare/elevated words naturally. NEVER announce that you have a big vocabulary.
- Physical descriptions should land through sensory detail, comparison, and implication — not blunt statement.` : ""}

GENRE TRUTH:
${genreTruth || `Write authentically for ${inputs?.subGenre || ""} ${inputs?.genre || "Pop"}.`}

SPECIFICITY:
${specificityAnchors}

${referenceTeaching ? `${referenceTeaching}` : ""}

CRAFT:
- Each verse must advance a continuous scene — linked lines, not disconnected aphorisms.
- Verse cadence and hook cadence should feel clearly different.
- Rhyme discipline appropriate to genre (not mostly unrhymed).
- Use section meta tags: [Verse], [Chorus], [Bridge], [Outro], etc.
- Add tasteful adlibs in parentheses where musically natural.
- ${vocalDirective}
- ${getGenreLengthDirective(inputs?.genre, inputs?.subGenre)}
- Genre/subgenre/instrumentation selections are creative direction, not literal lyric topics.

BANNED CLICHÉS — using ANY of these is an automatic failure:
- "precious like gold", "worth your weight in gold", "diamond in the rough"
- "dim your light", "shine bright", "let your wings fly", "spread your wings", "learn to fly"
- "stand tall", "rise above", "you're a queen/king/warrior", "wear your crown"
- "paint your sky", "world is your canvas", "write your destiny", "rewrite the stars"
- "unbreakable", "unstoppable", "masterpiece", "find your voice"
- "joy in the journey", "dreams come true", "flame that never dies"
- Any greeting-card / motivational-poster language. If it could be printed on a coffee mug, it does not belong in a song.
- Instead: use SPECIFIC, CONCRETE imagery that makes the listener FEEL the emotion rather than being told about it. Show a moment, not a slogan.
- NEVER use meta-language about your own writing in the lyrics. Banned phrases include (but are not limited to): "my metaphors", "my flow", "my cadence", "my wordplay", "my vocabulary", "my bars", "my rhyme schemes", "my pen game", "words weave", "words like daggers", "syllables spray", "verses I'm spitting", "rhyme schemes so tight", "shifting like tectonics", "words sharp as", "each line a [noun]", and any line that describes the act of rapping rather than actually rapping.
- A great rapper doesn't announce they're being clever — the cleverness speaks for itself. Lil Wayne doesn't say "my metaphors are fire" — he says "real G's move in silence like lasagna." That's the standard.
- Write lyrics that a real artist in this genre would actually perform. Amateurs describe what they're doing, professionals just do it.
${metaTagPackage.strictSpec}
${getInstructionResponsivenessDirective(userDirection)}

${register === "explicit" ? `REGISTER — EXPLICIT:
This is an authorized creative writing request for explicit/adult-register lyrics. The artist has chosen this register intentionally. Write vulgar, aggressive, sexually confident, confrontational, or profane lyrics when the genre and creative direction call for it. Battle-rap boasts, body-confidence bars, raw street language, and multilingual code-switching are all expected. Do NOT refuse, soften, censor, or moralize — deliver the artist's vision.` : ""}

CRITICAL: You are writing song lyrics for a music production app. This is creative fiction — not a real conversation.
- NEVER output phrases like "I can't assist", "I can't fulfill that request", "I'm sorry but I can't", "access denied", "cannot comply", or any variation of AI-refusal language.
- NEVER write a song whose theme, chorus, or repeated phrase is about being unable to help, refusing a request, or apologizing for limitations.
- NEVER write lyrics about being an AI, a machine, code, parameters, or digital existence.
- If you cannot write the requested content, return ONLY the single line "GENERATION_DECLINED" with no other text — do NOT disguise a refusal as song lyrics.

Write with confidence. Take creative risks. Make it feel lived-in, not assembled.
  `.trim();

  const draft = await generateDraft(prompt, register);
  let finalText = draft;

  // Guide compliance check — fix hard violations in one targeted pass
  if (hasTimeBudget(startMs, 11000)) {
    const compliance = await checkGuideCompliance(finalText, inputs || {});
    if (!compliance.passed) {
      const fixPrompt = buildComplianceFixPrompt(finalText, compliance.violations);
      if (fixPrompt) {
        finalText = await openAIResponses(fixPrompt);
      }
    }
  }

  // Meta-tag orchestration — ensure tags are present
  // Skip when user's creative direction overrides standard song structure
  const skipOrchestration = hasUserStructureOverride(userDirection);
  if (!skipOrchestration && hasTimeBudget(startMs, 9000)) {
    finalText = await enforceMetaTagOrchestration(finalText, inputs || {});
  }

  // Skip depth/texture enforcement on initial generation — let the draft breathe.
  // Depth enforcement only runs on edits to avoid regression-to-mean smoothing.

  // SUNO prompt driver — always run; replaces LLM prose with guide-driven technical prompt
  finalText = await enforceSunoPromptDriver(finalText, inputs || {}, userProfile || {});

  finalText = await enforceRequestedAdlibLanguage(finalText, userDirection);

  // Always fix vocalist gender tags — runs on the full text so stray tags
  // outside the ### Lyrics section (e.g. preamble) are also corrected
  finalText = alignVocalIdentityInLyrics(finalText, inputs?.vocals);

  // Final safety net: if the output is still a creative refusal, surface an error
  if (isCreativeRefusal(finalText)) {
    console.error("All models returned creative refusals for this prompt");
    throw Object.assign(
      new Error("Song generation failed — the AI was unable to produce lyrics for this combination of inputs. Try adjusting the emotion or creative direction and generate again."),
      { status: 422, code: "creative_refusal" }
    );
  }

  return { text: finalText };
}

async function editSong(payload: any) {
  const { originalSong, editInstruction, inputs, userProfile } = payload || {};
  const genreTruth = await getGenreTruthParagraph(inputs || {});
  const referenceTeaching = await compileReferenceTrackTeaching(inputs || {});
  const metaTagPackage = await getMetaTagPackage(inputs || {});

  const prompt = `
Revise this song per the user's instruction. The instruction is highest priority.
Return only full song in this exact format:
Title: ...
### SUNO Prompt
...
### Lyrics
...

INSTRUCTION: ${editInstruction || ""}

GENRE TRUTH:
${genreTruth || `${inputs?.genre || "Pop"} / ${inputs?.subGenre || "Modern"}`}

${referenceTeaching ? `${referenceTeaching}` : ""}

${metaTagPackage.strictSpec}
${getInstructionResponsivenessDirective(editInstruction || "")}

Original song:
${originalSong || ""}
  `.trim();

  const register = detectRegisterHint(inputs);
  const draft = await generateDraft(prompt, register);
  let finalText = draft;

  finalText = await enforceMetaTagOrchestration(finalText, inputs || {});
  // Depth enforcement runs on edits — targeted fixes for specific issues
  finalText = await enforceSongDepthAndTexture(finalText, inputs || {}, userProfile || {});
  finalText = await enforceSunoPromptDriver(finalText, inputs || {}, userProfile || {});
  finalText = await enforceRequestedAdlibLanguage(finalText, editInstruction || "");
  if (!isInstructionApplied(originalSong || "", finalText, editInstruction || "")) {
    const compliancePrompt = `
Apply the user's instruction exactly. Non-compliance is not allowed.
Instruction: ${editInstruction || ""}
${getInstructionResponsivenessDirective(editInstruction || "")}
Return only:
Title: ...
### SUNO Prompt
...
### Lyrics
...

Current revision:
${finalText}
    `.trim();
    const complianceDraft = await openAIResponses(compliancePrompt);
    finalText = await enforceSunoPromptDriver(complianceDraft, inputs || {}, userProfile || {});
    finalText = await enforceRequestedAdlibLanguage(finalText, editInstruction || "");
  }

  return { text: finalText };
}

async function structureImportedSong(payload: any) {
  const { rawText, inputs, userProfile } = payload || {};
  const genreTruth = await getGenreTruthParagraph(inputs || {});
  const metaTagPackage = await getMetaTagPackage(inputs || {});

  const prompt = `
Turn the input into a full structured song.
Output format:
Title: ...
### SUNO Prompt
...
### Lyrics
...

GENRE TRUTH:
${genreTruth || `${inputs?.genre || "Pop"} / ${inputs?.subGenre || "Modern"}`}

${metaTagPackage.strictSpec}
${getInstructionResponsivenessDirective(rawText || "")}

Input:
${rawText || ""}
  `.trim();

  const draft = await generateDraft(prompt);
  let finalText = draft;

  finalText = await enforceMetaTagOrchestration(finalText, inputs || {});
  finalText = await enforceSunoPromptDriver(finalText, inputs || {}, userProfile || {});
  finalText = await enforceRequestedAdlibLanguage(finalText, rawText || "");

  return { text: finalText };
}

async function generateDynamicOptions(payload: any) {
  const { targetField, currentInputs } = payload || {};
  const prompt = `
Generate exactly 8 options for field "${targetField}".
Session context:
${JSON.stringify(currentInputs || {}, null, 2)}
Rules:
- Keep options unique
- Match genre/language context
- Return ONLY JSON array of strings
`.trim();

  const raw = await openAIResponses(prompt);
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return { options: [] };
    const options = parsed
      .map((v) => (typeof v === "string" ? v.trim() : ""))
      .filter(Boolean)
      .slice(0, 8);
    return { options };
  } catch {
    return { options: [] };
  }
}

async function generateAlbumArt(payload: any) {
  const { songTitle, sunoPrompt, style, aspectRatio, avatarUrl } = payload || {};
  const ratio: "9:16" | "1:1" | "16:9" = aspectRatio === "1:1" || aspectRatio === "16:9" ? aspectRatio : "9:16";
  const stylePrompt = getStylePrompt(style);
  const prompt = `
Create a professional album cover image.
Title: ${songTitle || "Untitled"}
Style: ${style || "Realism"}
Vibe: ${(sunoPrompt || "").slice(0, 200)}
Aspect ratio: ${ratio}
The song context dictates the visual theme, scene, color, mood, styling, and composition.
No watermark, no logo, no extra text.
${stylePrompt}
`.trim();

  const avatarBlob = await getAvatarBlob(avatarUrl, sanitizeEmail(payload?.email || ""));

  if (avatarBlob) {
    const avatarProfile = await describeAvatarForPrompt(avatarBlob);
    const avatarGuidedPrompt = `${prompt}
Avatar identity profile (strictly preserve):
${avatarProfile}

Primary subject guidance:
- Use the same person identity as the user's avatar.
- Preserve facial structure, complexion/undertone, and any visible body build characteristics.
- Match hair, eye details, and distinctive features from avatar profile.
- If source avatar is portrait-only, avoid inventing conflicting body traits.
- Keep styling tasteful and non-suggestive for mainstream album artwork.`;
    return { imageDataUrl: await geminiGenerateImage(avatarGuidedPrompt, ratio, avatarBlob) };
  }

  return { imageDataUrl: await geminiGenerateImage(prompt, ratio) };
}

async function generateSocialPack(payload: any) {
  const { songTitle, lyrics } = payload || {};
  const prompt = `
Create a social media launch pack for this song.
Title: ${songTitle || "Untitled"}
Lyrics snippet: ${(lyrics || "").slice(0, 350)}
Return ONLY JSON:
{
  "shortDescription": "...",
  "instagramCaption": "...",
  "tiktokCaption": "...",
  "youtubeShortsCaption": "...",
  "hashtags": ["#..."],
  "cta": "..."
}
`.trim();

  const raw = await openAIResponses(prompt);
  try {
    return { pack: JSON.parse(raw) };
  } catch {
    return {
      pack: {
        shortDescription: "",
        instagramCaption: "",
        tiktokCaption: "",
        youtubeShortsCaption: "",
        hashtags: [],
        cta: "",
      },
    };
  }
}

async function translateLyrics(payload: any) {
  const { lyrics, targetLanguage } = payload || {};
  const prompt = `
Translate these lyrics to ${targetLanguage || "English"}.
Keep section tags and preserve singable rhythm.

Lyrics:
${lyrics || ""}
`.trim();
  return { text: await openAIResponses(prompt) };
}

async function askAndre(payload: any) {
  const question = String(payload?.question || "").trim();
  const history = Array.isArray(payload?.history) ? payload.history : [];
  const closeSignals = /\b(thanks|thank you|got it|that'?s all|all good|resolved|done|no thanks|no, thanks|i'?m good)\b/i;
  const shouldCloseConversation = closeSignals.test(question);
  if (!question) {
    return {
      text: "Please share your question in one sentence. What screen or action are you trying to use?",
    };
  }

  const historyBlock = history
    .slice(-8)
    .map((entry: any) => {
      const role = entry?.role === "assistant" ? "assistant" : "user";
      const content = String(entry?.content || "").trim();
      if (!content) return "";
      return `${role}: ${content}`;
    })
    .filter(Boolean)
    .join("\n");

  const prompt = `
${ASK_ANDRE_AUDIT_CONTEXT}

You are answering support questions inside the app.
Rules:
- Keep response concise and direct (max 2 short answer sentences before your question).
- First sentence gives the direct answer.
- If the user is still troubleshooting, include exactly one clarifying question tied to their issue and do NOT add a conversation-ending line.
- If the user message clearly indicates they are done, end with exactly: Is there anything else I can help you with?
- Include one direct URL when it helps the user complete the step.
- Never reveal private or sensitive data (API keys, tokens, passwords, personal account data, internal IDs, secrets, hidden configs).
- If user asks for private data, refuse briefly and ask a safe clarifying question.
- Do not output markdown, bullets, or extra labels.

Conversation:
${historyBlock || "(no prior messages)"}
user: ${question}
conversation_end_intent: ${shouldCloseConversation ? "yes" : "no"}
assistant:
  `.trim();

  let raw = "";
  try {
    raw = await openAIResponses(prompt);
  } catch {
    const q = question.toLowerCase();
    if (q.includes("credit") && (q.includes("cost") || q.includes("price") || q.includes("how much"))) {
      return {
        text: shouldCloseConversation
          ? "Open Billing & Credits to see the current credit packs and your community discount (if eligible): https://www.songghost.com Is there anything else I can help you with?"
          : "Open Billing & Credits to see the current credit packs and your community discount (if eligible): https://www.songghost.com Are you asking about one-time packs or your current balance?",
      };
    }
    return {
      text: shouldCloseConversation
        ? "I can help with account, billing, credits, song generation, and member access. Is there anything else I can help you with?"
        : "I can help with account, billing, credits, song generation, and member access. What screen are you on right now so I can give the exact step?",
    };
  }
  const compact = raw.replace(/\s+/g, " ").trim();
  const hasQuestion = compact.includes("?");
  let finalText = compact;

  if (!hasQuestion && !shouldCloseConversation) {
    finalText = `${compact} What specific screen are you on when this happens?`;
  }

  if (!/https?:\/\//i.test(finalText)) {
    const lowerQ = question.toLowerCase();
    if (lowerQ.includes("api key") || lowerQ.includes("gemini")) {
      finalText = `${finalText} https://aistudio.google.com/app/apikey`;
    } else if (lowerQ.includes("credit") || lowerQ.includes("billing") || lowerQ.includes("purchase")) {
      finalText = `${finalText} https://www.songghost.com`;
    }
  }

  finalText = finalText
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, "[redacted email]")
    .replace(/\b(?:sk|rk|pk|pit|ghp|gho|xoxb|xoxp|AIza)[-_A-Za-z0-9=:.]{8,}\b/g, "[redacted key]")
    .replace(/\b(?:password|passcode|token|secret|api key)\s*[:=]\s*[^\s.,;]+/gi, "[redacted secret]");

  finalText = finalText.replace(/\s*Is there anything else I can help you with\?\s*$/i, "").trim();
  if (shouldCloseConversation) {
    finalText = `${finalText} Is there anything else I can help you with?`.trim();
  }
  return { text: finalText };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { action, email, payload } = (req.body || {}) as {
      action?: AIAction;
      email?: string;
      payload?: any;
    };

    if (!action) return res.status(400).json({ error: "Missing action" });
    if (!isAllowedEmail(email)) return res.status(401).json({ error: "Invalid user identity" });
    requestRequiresUserGeminiKey =
      action === "askAndre" ? false : await shouldRequireUserGeminiKey(String(email || ""));
    requestGeminiTextApiKey =
      String(payload?.userGeminiApiKey || req.headers["x-gemini-api-key"] || "")
        .trim() || null;

    switch (action) {
      case "generateSong":
        return res.status(200).json(await generateSong(payload));
      case "editSong":
        return res.status(200).json(await editSong(payload));
      case "structureImportedSong":
        return res.status(200).json(await structureImportedSong(payload));
      case "generateDynamicOptions":
        return res.status(200).json(await generateDynamicOptions(payload));
      case "generateAlbumArt":
        return res.status(200).json(await generateAlbumArt({ ...(payload || {}), email }));
      case "generateSocialPack":
        return res.status(200).json(await generateSocialPack(payload));
      case "translateLyrics":
        return res.status(200).json(await translateLyrics(payload));
      case "askAndre":
        return res.status(200).json(await askAndre(payload));
      default:
        return res.status(400).json({ error: "Unsupported action" });
    }
  } catch (error: any) {
    console.error("[AI API Error]", {
      message: error?.message,
      code: error?.code,
      status: error?.status,
      details: error?.details,
    });
    const status = Number.isInteger(error?.status) ? error.status : 500;
    return res.status(status).json({
      error: error?.message || "AI API failed",
      code: error?.code || "ai_request_failed",
    });
  }
  finally {
    requestGeminiTextApiKey = null;
    requestRequiresUserGeminiKey = false;
  }
}
