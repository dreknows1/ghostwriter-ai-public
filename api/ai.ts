import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import { GoogleGenAI } from "@google/genai";

type AIAction =
  | "generateSong"
  | "editSong"
  | "structureImportedSong"
  | "generateDynamicOptions"
  | "generateAlbumArt"
  | "generateSocialPack"
  | "translateLyrics";

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
`.trim();

  return { text: await openAIResponses(prompt) };
}

async function editSong(payload: any) {
  const { originalSong, editInstruction } = payload || {};
  const prompt = `
Revise the song per instruction.
Return only full song in this exact format:
Title: ...
### SUNO Prompt
...
### Lyrics
...

Instruction: ${editInstruction || ""}
Original song:
${originalSong || ""}
`.trim();

  return { text: await openAIResponses(prompt) };
}

async function structureImportedSong(payload: any) {
  const { rawText } = payload || {};
  const prompt = `
Turn the input into a full structured song.
Output format:
Title: ...
### SUNO Prompt
...
### Lyrics
...

Input:
${rawText || ""}
`.trim();

  return { text: await openAIResponses(prompt) };
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
  const prompt = `
Create a professional album cover image.
Title: ${songTitle || "Untitled"}
Style: ${style || "Cinematic"}
Vibe: ${(sunoPrompt || "").slice(0, 200)}
Aspect ratio: ${ratio}
The song context dictates the visual theme, scene, color, mood, styling, and composition.
No watermark, no logo, no extra text.
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
