import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import { GoogleGenAI } from "@google/genai";
import {
  getGenreProfile,
  getSubgenreSonicProfile,
  inferWritingProfile,
  LANGUAGE_PROFILES,
} from "../lib/culturalLogic.ts";

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

function buildCulturalPromptContext(inputs: any) {
  const language = inputs?.language || "English";
  const genre = inputs?.genre || "Pop";
  const subGenre = inputs?.subGenre || "Modern";
  const register = detectRegisterHint(inputs);
  const writingProfile = inferWritingProfile({
    language,
    genre,
    subGenre,
    register,
    allowCodeSwitch: false,
  });
  const genreProfile = getGenreProfile(genre);
  const subProfile = getSubgenreSonicProfile(subGenre);
  const languageNotes = LANGUAGE_PROFILES[language]?.notes || "Use natural native phrasing.";
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
  const culturalContext = buildCulturalPromptContext(inputs);
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
- Do not add stereotypes, slurs, or tokenized dialect.
- Keep title and hook memorable and aligned with the core story.

Creator context:
- Artist persona: ${userProfile?.display_name || "N/A"} | vibe: ${userProfile?.preferred_vibe || "N/A"}

${culturalContext}

Song draft:
${rawSong}
  `.trim();

  try {
    return await openAIResponses(prompt);
  } catch {
    return rawSong;
  }
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
  const culturalContext = buildCulturalPromptContext(inputs || {});
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
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: prompt,
    }),
  });

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

async function generateSong(payload: any) {
  const { inputs, userProfile } = payload || {};
  const culturalContext = buildCulturalPromptContext(inputs || {});
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
- Distinguish verse cadence vs hook cadence clearly.
- Make the SUNO prompt production-ready and specific to the same cultural/genre profile.

${culturalContext}
  `.trim();

  const draft = await openAIResponses(prompt);
  const refined = await culturallyRefineSong(draft, inputs || {}, userProfile || {});
  const audit = await evaluateCulturalAudit(refined, inputs || {});
  return { text: refined, audit };
}

async function editSong(payload: any) {
  const { originalSong, editInstruction, inputs, userProfile } = payload || {};
  const culturalContext = buildCulturalPromptContext(inputs || {});
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

Original song:
${originalSong || ""}
  `.trim();

  const draft = await openAIResponses(prompt);
  const refined = await culturallyRefineSong(draft, inputs || {}, userProfile || {});
  const audit = await evaluateCulturalAudit(refined, inputs || {});
  return { text: refined, audit };
}

async function structureImportedSong(payload: any) {
  const { rawText, inputs, userProfile } = payload || {};
  const culturalContext = buildCulturalPromptContext(inputs || {});
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

Input:
${rawText || ""}
  `.trim();

  const draft = await openAIResponses(prompt);
  const refined = await culturallyRefineSong(draft, inputs || {}, userProfile || {});
  const audit = await evaluateCulturalAudit(refined, inputs || {});
  return { text: refined, audit };
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
    const avatarGuidedPrompt = `${prompt}
Primary subject guidance:
- Use the same person identity as the user's avatar.
- Preserve core facial structure, hairstyle, and skin tone.
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
