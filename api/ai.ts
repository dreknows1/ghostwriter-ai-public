import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI, Type } from "@google/genai";

type AIAction =
  | "generateSong"
  | "editSong"
  | "structureImportedSong"
  | "generateDynamicOptions"
  | "generateAlbumArt"
  | "generateSocialPack"
  | "translateLyrics";

function getApiKey(): string | null {
  return process.env.GEMINI_API_KEY || process.env.API_KEY || null;
}

function getClient() {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY (or API_KEY) in environment");
  }
  return new GoogleGenAI({ apiKey });
}

function sanitizeEmail(email?: string): string {
  return (email || "").toLowerCase().trim();
}

function isAllowedEmail(email?: string): boolean {
  const cleaned = sanitizeEmail(email);
  return cleaned.includes("@");
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

  const ai = getClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents: prompt,
  });
  return { text: response.text || "" };
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

  const ai = getClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents: prompt,
  });
  return { text: response.text || "" };
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

  const ai = getClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents: prompt,
  });
  return { text: response.text || "" };
}

async function generateDynamicOptions(payload: any) {
  const { targetField, currentInputs } = payload || {};
  const prompt = `
Generate 8 options for field "${targetField}".
Session context:
${JSON.stringify(currentInputs || {}, null, 2)}
Rules:
- Keep options unique
- Match genre/language context
- Return only JSON array of strings
`.trim();

  const ai = getClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
    },
  });

  let options: string[] = [];
  try {
    const parsed = JSON.parse(response.text || "[]");
    if (Array.isArray(parsed)) {
      options = parsed
        .map((v) => (typeof v === "string" ? v.trim() : ""))
        .filter(Boolean)
        .slice(0, 8);
    }
  } catch {
    options = [];
  }

  return { options };
}

async function generateAlbumArt(payload: any) {
  const { songTitle, sunoPrompt, style } = payload || {};
  const prompt = `
Create a professional 9:16 album cover image.
Title: ${songTitle || "Untitled"}
Style: ${style || "Cinematic"}
Vibe: ${(sunoPrompt || "").slice(0, 200)}
No watermark, no logo, no extra text.
`.trim();

  const ai = getClient();
  const response: any = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: [{ parts: [{ text: prompt }] }],
    config: { imageConfig: { aspectRatio: "9:16" } },
  });

  const candidate = response?.candidates?.[0];
  const parts = candidate?.content?.parts || [];
  const imagePart = parts.find((p: any) => p?.inlineData?.data);
  if (!imagePart?.inlineData?.data) {
    throw new Error("Image generation returned no image data");
  }

  return { imageDataUrl: `data:image/png;base64,${imagePart.inlineData.data}` };
}

async function generateSocialPack(payload: any) {
  const { songTitle, lyrics } = payload || {};
  const prompt = `
Create a social media launch pack for this song.
Title: ${songTitle || "Untitled"}
Lyrics snippet: ${(lyrics || "").slice(0, 350)}
Return JSON:
{
  "shortDescription": "...",
  "instagramCaption": "...",
  "tiktokCaption": "...",
  "youtubeShortsCaption": "...",
  "hashtags": ["#..."],
  "cta": "..."
}
`.trim();

  const ai = getClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          shortDescription: { type: Type.STRING },
          instagramCaption: { type: Type.STRING },
          tiktokCaption: { type: Type.STRING },
          youtubeShortsCaption: { type: Type.STRING },
          hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
          cta: { type: Type.STRING },
        },
        required: [
          "shortDescription",
          "instagramCaption",
          "tiktokCaption",
          "youtubeShortsCaption",
          "hashtags",
          "cta",
        ],
      },
    },
  });

  let pack = {};
  try {
    pack = JSON.parse(response.text || "{}");
  } catch {
    pack = {};
  }
  return { pack };
}

async function translateLyrics(payload: any) {
  const { lyrics, targetLanguage } = payload || {};
  const prompt = `
Translate these lyrics to ${targetLanguage || "English"}.
Keep section tags and preserve singable rhythm.

Lyrics:
${lyrics || ""}
`.trim();

  const ai = getClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });
  return { text: response.text || "" };
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
        return res.status(200).json(await generateAlbumArt(payload));
      case "generateSocialPack":
        return res.status(200).json(await generateSocialPack(payload));
      case "translateLyrics":
        return res.status(200).json(await translateLyrics(payload));
      default:
        return res.status(400).json({ error: "Unsupported action" });
    }
  } catch (error: any) {
    console.error("[AI API Error]", error);
    return res.status(500).json({ error: error?.message || "AI API failed" });
  }
}
