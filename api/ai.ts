import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import { GoogleGenAI } from "@google/genai";

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
  | "translateLyrics";

type CulturalAuditItem = {
  dimension: string;
  score: number;
  notes: string;
};

type CulturalAudit = {
  overallScore: number;
  summary: string;
  checklist: CulturalAuditItem[];
};

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

async function loadCulturalLogicModule(): Promise<CulturalLogicModule | null> {
  if (!culturalLogicPromise) {
    culturalLogicPromise = (async () => {
      try {
        return (await import("../lib/culturalLogic")) as unknown as CulturalLogicModule;
      } catch {
        try {
          return (await import("../lib/culturalLogic.ts")) as unknown as CulturalLogicModule;
        } catch {
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
      } catch {
        try {
          return (await import("../lib/metaTagLibrary.ts")) as unknown as MetaTagModule;
        } catch {
          return null;
        }
      }
    })();
  }
  return metaTagModulePromise;
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
  `.trim();
}

function fallbackMetaTagPlan(inputs: any): MetaTagPlan {
  const genre = String(inputs?.genre || "Pop").toLowerCase();
  const heavyAdlib = genre.includes("hip-hop") || genre.includes("rap") || genre.includes("trap") || genre.includes("afrobeats");
  const mediumAdlib = genre.includes("r&b") || genre.includes("soul") || genre.includes("gospel") || genre.includes("reggae");
  return {
    structureTags: ["[Intro]", "[Verse]", "[Pre-Chorus]", "[Chorus]", "[Verse]", "[Chorus]", "[Bridge]", "[Chorus]", "[Outro]"],
    vocalTypeTag: "[Vocalist: Male]",
    moodEnergyTags: ["[Energy: High]", "[Mood: Intense]"],
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
- Section order to follow: ${plan.structureTags.join(" -> ")}
- Required vocal identity tag: ${plan.vocalTypeTag}
- Mood/energy tags to include across song: ${plan.moodEnergyTags.join(", ")}
- Genre/subgenre accent tags to include naturally: ${plan.genreAccentTags.join(", ")}
- Minimum bracket tags in Lyrics body: ${plan.minTagCount}
- Minimum adlibs in parentheses: ${plan.minAdlibCount}
- Minimum genre-accent tag hits: ${plan.requiredAccentHits}
- Minimum mood/energy tag hits: ${plan.requiredMoodHits}
- Required vocal identity tag must appear in Lyrics: ${plan.requireVocalTypeTag ? "yes" : "no"}
- Adlib policy: ${plan.adlibPolicy}
- Tag logic: opening sections establish mood + voice; mid-song sections escalate arrangement tags; final sections resolve with refrain/outro tags.
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
    const strictSpec =
      typeof mod.buildStrictMetaTagSpec === "function"
        ? mod.buildStrictMetaTagSpec(inputs || {})
        : fallbackStrictMetaTagSpec(inputs || {});
    return { guidance, strictSpec, plan };
  }
  return {
    guidance: fallbackMetaTagGuidance(inputs || {}),
    strictSpec: fallbackStrictMetaTagSpec(inputs || {}),
    plan: fallbackMetaTagPlan(inputs || {}),
  };
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
  return process.env.OPENAI_TEXT_MODEL || process.env.OPENAI_MODEL || "gpt-5.2";
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

function shouldRunMultiPassRefinement(): boolean {
  return process.env.AI_MULTIPASS_REFINEMENT !== "0";
}

function shouldRunDeepAudit(): boolean {
  return process.env.AI_DEEP_AUDIT === "1";
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
  const bag = `${inputs?.additionalInfo || ""} ${inputs?.scene || ""} ${inputs?.emotion || ""}`.toLowerCase();
  if (bag.includes("clean") || bag.includes("family") || bag.includes("radio safe")) return "clean";
  if (bag.includes("explicit") || bag.includes("uncensored") || bag.includes("adult")) return "explicit";
  return "radio";
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

async function culturallyRefineSong(rawSong: string, inputs: any, userProfile: any): Promise<string> {
  if (!rawSong?.trim()) return rawSong;
  const culturalContext = await buildCulturalPromptContext(inputs);
  const metaTagPackage = await getMetaTagPackage(inputs || {});
  const prompt = `
You are a senior lyric editor specializing in cultural authenticity.
Refine the song below for cultural and stylistic accuracy while preserving intent and emotional arc.

Return ONLY this exact format:
Title: ...
### SUNO Prompt
...
### Lyrics
...

Rules:
- Preserve the original language and regional variant.
- Keep strong genre/subgenre identity and avoid cliche stock lines.
- Improve metaphors, cadence, rhyme texture, and scene authenticity.
- Keep line-to-line narrative continuity so verses feel connected, not like isolated one-liners.
- Do not add stereotypes, slurs, or tokenized dialect.
- Keep title and hook memorable and aligned with the core story.
- Keep section meta tags consistent and musically meaningful.
- Keep adlibs in parentheses tasteful, sparse, and genre-appropriate.
- Do not invent new tag syntax outside bracket/parenthesis styles.

Creator context:
- Artist persona: ${userProfile?.display_name || "N/A"} | vibe: ${userProfile?.preferred_vibe || "N/A"}

${culturalContext}
${metaTagPackage.guidance}
${metaTagPackage.strictSpec}

Song draft:
${rawSong}
  `.trim();

  try {
    return await openAIResponses(prompt);
  } catch {
    return rawSong;
  }
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
  if (value.includes("male")) return "male";
  if (value.includes("female")) return "female";
  return null;
}

function alignVocalIdentityInLyrics(lyrics: string, vocals: string | undefined): string {
  const expected = inferExpectedVocalIdentity(vocals);
  if (!expected || !lyrics?.trim()) return lyrics;

  let next = lyrics;
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

  const hasVocalTag =
    /\[vocalist:\s*(male|female|duet|group)\]/i.test(next) ||
    /\[(male vocal|female vocal|duet|choir)\]/i.test(next);
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

async function buildSunoPromptDriver(inputs: any, userProfile: any): Promise<string> {
  const logic = await loadCulturalLogicModule();

  const language = inputs?.language || "English";
  const genre = inputs?.genre || "Pop";
  const subGenre = inputs?.subGenre || "Modern";
  const instrumentation = inputs?.instrumentation || "genre-appropriate instrumentation";
  const audioEnv = inputs?.audioEnv || "studio-clean mix";
  const scene = inputs?.scene || "intimate urban night setting";
  const emotion = inputs?.emotion || "euphoric";
  const vocals = inputs?.vocals || "Female Solo";
  const duetType = inputs?.duetType ? `, ${inputs.duetType}` : "";
  const vibe = userProfile?.preferred_vibe || "emotionally honest";
  const referenceArtist = (inputs?.referenceArtist || "").trim();

  const writingProfile =
    logic?.inferWritingProfile?.({
      language,
      genre,
      subGenre,
      register: detectRegisterHint(inputs),
      allowCodeSwitch: false,
    }) || DEFAULT_WRITING_PROFILE;

  const subProfile = logic?.getSubgenreSonicProfile?.(subGenre) || DEFAULT_SUBGENRE_PROFILE;
  const genreProfile = logic?.getGenreProfile?.(genre) || DEFAULT_GENRE_PROFILE;
  const maxLen = Number(process.env.AI_SUNO_PROMPT_MAX_LEN || 320);

  const styleDescriptor = inferStyleDescriptor(genre, subGenre, subProfile.productionStyle);
  const moodEnergyDirection = inferMoodEnergyDirection(emotion);
  const vocalApproach = inferVocalApproach(vocals, genre, emotion, duetType);
  const arrangementDynamics = inferArrangementDynamics(
    genreProfile.defaultStructure,
    subProfile.arrangement,
    subProfile.groove
  );
  const instrumentFocus = inferInstrumentFocus(instrumentation, genre);

  const referenceClause = referenceArtist ? `; reference feel: ${referenceArtist}` : "";
  const prompt = `
Style: ${styleDescriptor}.
Mood/Energy: ${moodEnergyDirection}.
Vocals: ${vocalApproach}.
Arrangement/Dynamics: ${arrangementDynamics}.
Instrument focus: ${instrumentFocus}.
Production context: ${subProfile.bpmRange}, ${audioEnv}, ${scene}; vibe ${vibe}${referenceClause}.
Language/culture: ${language} (${writingProfile.languageVariant}, ${writingProfile.cultureRegion}); avoid cliche writing.
  `.trim();

  return clampPromptLength(prompt, maxLen);
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

  const bannedPhraseList = SONG_CLICHE_PATTERNS.map((pattern) => pattern.source.replace(/\\b/g, "")).slice(0, 8).join(", ");

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const issueList = currentMetrics.issues.length
      ? currentMetrics.issues.map((issue) => `- ${issue}`).join("\n")
      : "- Improve texture and specificity.";
    const prompt = `
You are a top-tier songwriter and lyric doctor.
Rewrite this song to increase texture, originality, and performance depth while preserving core story and emotional intent.

Return ONLY this exact format:
Title: ...
### SUNO Prompt
...
### Lyrics
...

Hard constraints:
- Keep language and genre/subgenre intent intact.
- Make narrator identity consistent with vocalist tags.
- Replace hallmark/generic wording with concrete, specific imagery.
- Maintain narrative continuity: verses should feel like unfolding scenes, not disconnected aphorisms.
- Reuse thematic anchors across sections so the story feels coherent.
- Add arrangement-driving performance tags (at least 4 non-section tags such as [Whisper], [Falsetto], [Harmony Stack], [Drop], [Half-Time], [Belt], [Call-and-Response]).
- Ensure each repeated chorus evolves meaningfully (at least 2 changed lines while preserving hook identity).
- Establish dynamic contour across sections (soft/low moments and high/intense moments).
- Keep adlibs musical, intentional, and style-aware (target range: 3 to 18 total).

Detected issues to fix:
${issueList}

Avoid these phrase patterns:
${bannedPhraseList}

Session context:
- Genre: ${inputs?.genre || "Pop"}
- Subgenre: ${inputs?.subGenre || "Modern"}
- Language: ${inputs?.language || "English"}
- Emotion: ${inputs?.emotion || "Euphoric"}
- Artist persona: ${userProfile?.display_name || "N/A"} | vibe: ${userProfile?.preferred_vibe || "N/A"}

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

  return {
    coreSectionCount: coreBlocks.length,
    coreTaggedSections,
    coreCoverage,
    chorusCount: chorusBlocks.length,
    chorusTaggedSections,
    chorusCoverage,
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

  const score = Math.round(
    structureScore * 30 +
      tagDensityScore * 18 +
      adlibScore * 15 +
      accentScore * 10 +
      moodScore * 6 +
      vocalScore * 4 +
      coreCoverageScore * 10 +
      chorusCoverageScore * 7
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
- Every core section ([Intro]/[Verse]/[Pre-Chorus]/[Chorus]/[Bridge]/[Outro]) should include at least one non-structural performance tag or a musically useful adlib.
- Every [Chorus] must contain at least one arrangement/vocal meta tag or adlib.
- Do not stack all tags in one section; distribute them throughout the song arc.

Current quality deficits:
- Core section tag coverage: ${(bestMetrics.coreCoverage * 100).toFixed(0)}% (target 80%+)
- Chorus tag coverage: ${(bestMetrics.chorusCoverage * 100).toFixed(0)}% (target 100%)
- Missing core coverage gap: ${(missingCoreCoverage * 100).toFixed(0)}%

Constraints:
- Keep language, genre, and story intent unchanged.
- Keep section order logical and musically performable.
- Place tags where they drive arrangement and vocal delivery (not random).
- Ensure adlibs are natural and rhythmic, not spammed.
- Maintain coherent progression from intro to outro.

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

function clampScore(value: any): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function normalizeAudit(raw: any): CulturalAudit {
  const fallbackChecklist: CulturalAuditItem[] = [
    { dimension: "Language Authenticity", score: 0, notes: "" },
    { dimension: "Cultural Context", score: 0, notes: "" },
    { dimension: "Genre Fidelity", score: 0, notes: "" },
    { dimension: "Subgenre Fidelity", score: 0, notes: "" },
    { dimension: "Lyrical Originality", score: 0, notes: "" },
    { dimension: "Cadence & Prosody", score: 0, notes: "" },
  ];

  const checklist = Array.isArray(raw?.checklist)
    ? raw.checklist
        .map((item: any) => ({
          dimension: typeof item?.dimension === "string" ? item.dimension : "",
          score: clampScore(item?.score),
          notes: typeof item?.notes === "string" ? item.notes : "",
        }))
        .filter((item: CulturalAuditItem) => item.dimension)
        .slice(0, 8)
    : [];

  const normalizedChecklist = checklist.length ? checklist : fallbackChecklist;
  const derivedAverage = Math.round(
    normalizedChecklist.reduce((acc: number, item: CulturalAuditItem) => acc + item.score, 0) /
      normalizedChecklist.length
  );
  const overallScore = raw?.overallScore !== undefined ? clampScore(raw.overallScore) : derivedAverage;
  const summary =
    typeof raw?.summary === "string" && raw.summary.trim()
      ? raw.summary.trim()
      : "Audit completed using cultural authenticity rubric.";

  return {
    overallScore,
    summary,
    checklist: normalizedChecklist,
  };
}

function fallbackAudit(inputs: any): CulturalAudit {
  const language = inputs?.language || "English";
  const genre = inputs?.genre || "Pop";
  const subGenre = inputs?.subGenre || "Modern";
  return {
    overallScore: 72,
    summary: `Baseline audit fallback for ${language} ${genre}/${subGenre}.`,
    checklist: [
      { dimension: "Language Authenticity", score: 72, notes: "Fallback audit: verify native phrasing manually." },
      { dimension: "Cultural Context", score: 70, notes: "Fallback audit: validate local scene references." },
      { dimension: "Genre Fidelity", score: 75, notes: "Fallback audit: confirm genre writing conventions." },
      { dimension: "Subgenre Fidelity", score: 70, notes: "Fallback audit: align cadence and sonic cues." },
      { dimension: "Lyrical Originality", score: 74, notes: "Fallback audit: reduce cliches where needed." },
      { dimension: "Cadence & Prosody", score: 71, notes: "Fallback audit: tighten line stress and flow." },
    ],
  };
}

async function evaluateCulturalAudit(songText: string, inputs: any): Promise<CulturalAudit> {
  if (!songText?.trim()) return fallbackAudit(inputs);
  const culturalContext = await buildCulturalPromptContext(inputs || {});
  const prompt = `
You are evaluating one song draft for cultural authenticity and stylistic quality.
Score strictly and return ONLY JSON:
{
  "overallScore": number,
  "summary": string,
  "checklist": [
    { "dimension": "Language Authenticity", "score": number, "notes": string },
    { "dimension": "Cultural Context", "score": number, "notes": string },
    { "dimension": "Genre Fidelity", "score": number, "notes": string },
    { "dimension": "Subgenre Fidelity", "score": number, "notes": string },
    { "dimension": "Lyrical Originality", "score": number, "notes": string },
    { "dimension": "Cadence & Prosody", "score": number, "notes": string }
  ]
}

Scoring rules:
- 90-100: excellent/authentic
- 75-89: strong but has notable improvements
- 60-74: mixed quality with clear authenticity gaps
- below 60: weak authenticity/fidelity
- Keep notes concise and actionable.

${culturalContext}

Song to audit:
${songText}
  `.trim();

  try {
    const raw = await openAIResponses(prompt);
    const parsed = parseLooseJson(raw);
    if (!parsed) return fallbackAudit(inputs);
    return normalizeAudit(parsed);
  } catch {
    return fallbackAudit(inputs);
  }
}

const getUserProfileByEmailRef = makeFunctionReference<"query">("app:getUserProfileByEmail");

async function openAIResponses(prompt: string, model = getTextModel()): Promise<string> {
  const apiKey = getOpenAIApiKey();
  const timeoutMs = Number(process.env.AI_HTTP_TIMEOUT_MS || 45000);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;

  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: prompt,
      }),
      signal: controller.signal,
    });
  } catch (error: any) {
    if (error?.name === "AbortError") {
      throw Object.assign(new Error(`AI text request timed out after ${timeoutMs}ms.`), {
        status: 504,
        code: "provider_timeout",
      });
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    let errorCode = "provider_error";
    let errorMessage = "Text generation failed.";
    try {
      const data: any = await response.json();
      errorCode = data?.error?.code || errorCode;
      errorMessage = data?.error?.message || errorMessage;
    } catch {
      // Ignore parse errors and keep safe defaults.
    }

    const sanitizedMessage =
      response.status === 401 || errorCode === "invalid_api_key"
        ? "AI service authentication failed. Please verify OPENAI_API_KEY in server environment."
        : `OpenAI text request failed (${response.status}).`;

    throw Object.assign(new Error(sanitizedMessage), {
      status: response.status,
      code: errorCode,
      details: errorMessage,
    });
  }

  const data: any = await response.json();
  const text = data?.output_text;
  if (typeof text === "string") return text;

  const chunks: string[] = [];
  const output = Array.isArray(data?.output) ? data.output : [];
  for (const item of output) {
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const part of content) {
      if (part?.type === "output_text" && typeof part?.text === "string") {
        chunks.push(part.text);
      }
    }
  }
  return chunks.join("\n").trim();
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
  const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
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

  const response: any = await ai.models.generateContent({
    model: getGeminiImageModel(),
    contents,
    config: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  });

  const parts = Array.isArray(response?.parts) ? response.parts : Array.isArray(response?.candidates?.[0]?.content?.parts) ? response.candidates[0].content.parts : [];
  const imagePart = parts.find((part: any) => part?.inlineData?.data);
  const b64 = imagePart?.inlineData?.data;
  if (!b64 || typeof b64 !== "string") {
    throw new Error("Gemini image generation returned no base64 payload");
  }
  return `data:image/png;base64,${b64}`;
}

async function describeAvatarForPrompt(referenceImage: Blob): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
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

async function generateSong(payload: any) {
  const { inputs, userProfile } = payload || {};
  const culturalContext = await buildCulturalPromptContext(inputs || {});
  const metaTagPackage = await getMetaTagPackage(inputs || {});
  const prompt = `
You are a professional songwriter.
Return only:
Title: ...
### SUNO Prompt
...
### Lyrics
...

Context:
- Language: ${inputs?.language || "English"}
- Genre: ${inputs?.genre || "Pop"}
- Subgenre: ${inputs?.subGenre || "Modern"}
- Instrumentation: ${inputs?.instrumentation || "Piano"}
- Mood: ${inputs?.emotion || "Euphoric"}
- Scene: ${inputs?.scene || "Studio"}
- Audio: ${inputs?.audioEnv || "Studio (Clean)"}
- Vocals: ${inputs?.vocals || "Female Solo"} ${inputs?.duetType ? `(Duet: ${inputs.duetType})` : ""}
- Extra details: ${inputs?.mundaneObjects || ""} ${inputs?.awkwardMoment || ""}
- Artist persona: ${userProfile?.display_name || "N/A"} | vibe: ${userProfile?.preferred_vibe || "N/A"}

Non-negotiable writing directives:
- The song must sound native to the selected language/region and faithful to the selected subgenre's writing traditions.
- Avoid generic AI patterns, filler hooks, and repetitive cliche imagery.
- Ensure each verse has narrative continuity (linked lines that advance the same lived-in scene).
- Distinguish verse cadence vs hook cadence clearly.
- Make the SUNO prompt production-ready and specific to the same cultural/genre profile.
- In Lyrics, use section meta tags from the library style (e.g., [Verse], [Chorus], [Bridge], [Ad-Lib Section]).
- Add musically appropriate adlibs in parentheses where helpful, not on every line.

${culturalContext}
${metaTagPackage.guidance}
${metaTagPackage.strictSpec}
  `.trim();

  const draft = await openAIResponses(prompt);
  let finalText = draft;

  if (shouldRunMultiPassRefinement()) {
    finalText = await culturallyRefineSong(draft, inputs || {}, userProfile || {});
  }

  finalText = await enforceMetaTagOrchestration(finalText, inputs || {});
  finalText = await enforceSongDepthAndTexture(finalText, inputs || {}, userProfile || {});
  finalText = await enforceSunoPromptDriver(finalText, inputs || {}, userProfile || {});

  const audit = shouldRunDeepAudit()
    ? await evaluateCulturalAudit(finalText, inputs || {})
    : fallbackAudit(inputs || {});

  return { text: finalText, audit };
}

async function editSong(payload: any) {
  const { originalSong, editInstruction, inputs, userProfile } = payload || {};
  const culturalContext = await buildCulturalPromptContext(inputs || {});
  const metaTagPackage = await getMetaTagPackage(inputs || {});
  const prompt = `
Revise the song per instruction.
Return only full song in this exact format:
Title: ...
### SUNO Prompt
...
### Lyrics
...

Instruction: ${editInstruction || ""}
Cultural context requirements:
${culturalContext}
Meta tag and adlib requirements:
${metaTagPackage.guidance}
${metaTagPackage.strictSpec}

Original song:
${originalSong || ""}
  `.trim();

  const draft = await openAIResponses(prompt);
  let finalText = draft;

  if (shouldRunMultiPassRefinement()) {
    finalText = await culturallyRefineSong(draft, inputs || {}, userProfile || {});
  }

  finalText = await enforceMetaTagOrchestration(finalText, inputs || {});
  finalText = await enforceSongDepthAndTexture(finalText, inputs || {}, userProfile || {});
  finalText = await enforceSunoPromptDriver(finalText, inputs || {}, userProfile || {});

  const audit = shouldRunDeepAudit()
    ? await evaluateCulturalAudit(finalText, inputs || {})
    : fallbackAudit(inputs || {});

  return { text: finalText, audit };
}

async function structureImportedSong(payload: any) {
  const { rawText, inputs, userProfile } = payload || {};
  const culturalContext = await buildCulturalPromptContext(inputs || {});
  const metaTagPackage = await getMetaTagPackage(inputs || {});
  const prompt = `
Turn the input into a full structured song.
Output format:
Title: ...
### SUNO Prompt
...
### Lyrics
...

Cultural context requirements:
${culturalContext}
Meta tag and adlib requirements:
${metaTagPackage.guidance}
${metaTagPackage.strictSpec}

Input:
${rawText || ""}
  `.trim();

  const draft = await openAIResponses(prompt);
  let finalText = draft;

  if (shouldRunMultiPassRefinement()) {
    finalText = await culturallyRefineSong(draft, inputs || {}, userProfile || {});
  }

  finalText = await enforceMetaTagOrchestration(finalText, inputs || {});
  finalText = await enforceSongDepthAndTexture(finalText, inputs || {}, userProfile || {});
  finalText = await enforceSunoPromptDriver(finalText, inputs || {}, userProfile || {});

  const audit = shouldRunDeepAudit()
    ? await evaluateCulturalAudit(finalText, inputs || {})
    : fallbackAudit(inputs || {});

  return { text: finalText, audit };
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
}
