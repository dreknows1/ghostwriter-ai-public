// server/ai.ts
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import { GoogleGenAI } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
var ASK_ANDRE_AUDIT_CONTEXT = `
You are "Ask Andre" inside SongGhost.
App mission: help users write culturally authentic, genre-accurate songs with guided prompts and revisions.
Core areas: auth/login, members tier logic, studio generation/revision, quality scoring 85+, song history, profile/avatar, billing/credits, discounts, Gemini key setup.
Rules: keep answers short/direct, never reveal private data (API keys/tokens/passwords/personal account details/internal IDs), ask clarifying question, and end with "Is there anything else I can help you with?"
`.trim();
var config = {
  runtime: "nodejs",
  maxDuration: 300,
  // Allows the generateSong SSE path to flush events as they happen. If the platform
  // ignores this, events arrive buffered at completion — degraded, not broken.
  supportsResponseStreaming: true
};
function sanitizeEmail(email) {
  return (email || "").toLowerCase().trim();
}
function isAllowedEmail(email) {
  return sanitizeEmail(email).includes("@");
}
function getOpenAIApiKey() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Missing OPENAI_API_KEY in environment");
  return key;
}
function getTextModel() {
  return process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash";
}
function getGeminiApiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Missing GEMINI_API_KEY in environment");
  return key;
}
function getGeminiImageModel() {
  return process.env.GEMINI_IMAGE_MODEL || "gemini-3-pro-image-preview";
}
function getGeminiVisionModel() {
  return process.env.GEMINI_VISION_MODEL || "gemini-2.5-flash";
}
function getAnthropicApiKey() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("Missing ANTHROPIC_API_KEY in environment");
  return key;
}
function getClaudeModel() {
  return process.env.CLAUDE_TEXT_MODEL || "claude-sonnet-4-20250514";
}
function getDraftLLM() {
  const val = (process.env.SONG_DRAFT_LLM || "openai").toLowerCase();
  if (val === "openai") return "openai";
  if (val === "claude") return "claude";
  return "gemini";
}
function getOpenAIModel() {
  return process.env.OPENAI_TEXT_MODEL || "gpt-4.1";
}
function getSongwriterSystemPrompt(register) {
  const base = "You are a world-class professional songwriter with deep knowledge of genre conventions, cultural authenticity, and lyrical craft across every musical tradition. Write vivid, emotionally resonant lyrics with strong narrative continuity. Follow all formatting, structural, and meta-tag instructions exactly. Never sanitize, moralize, or soften the emotional truth of a genre.";
  if (register === "explicit") {
    return `${base} The user has selected explicit/adult register. You are authorized to write vulgar, aggressive, sexually confident, and confrontational lyrics when the genre and user direction call for it. Battle-rap boasts, body-confidence bars, profanity, and raw street language are expected and appropriate for this register. Do NOT refuse or water down the content \u2014 deliver what the artist asked for.`;
  }
  return base;
}
async function openaiGenerate(prompt, register) {
  const client = new OpenAI({ apiKey: getOpenAIApiKey() });
  const response = await client.chat.completions.create({
    model: getOpenAIModel(),
    max_tokens: 4096,
    temperature: 0.8,
    // creative but coherent; 1.0 produced rhyme-forced word salad
    messages: [
      {
        role: "system",
        content: getSongwriterSystemPrompt(register)
      },
      { role: "user", content: prompt }
    ]
  });
  const text = response.choices?.[0]?.message?.content?.trim() || "";
  if (!text) {
    throw Object.assign(new Error("OpenAI text generation returned no text."), {
      status: 502,
      code: "openai_no_text"
    });
  }
  return text;
}
async function claudeGenerate(prompt, register) {
  const client = new Anthropic({ apiKey: getAnthropicApiKey() });
  const response = await client.messages.create({
    model: getClaudeModel(),
    max_tokens: 4096,
    temperature: 0.8,
    // creative but coherent; 1.0 produced rhyme-forced word salad
    system: getSongwriterSystemPrompt(register),
    messages: [{ role: "user", content: prompt }]
  });
  const text = response.content.filter((block) => block.type === "text").map((block) => block.text).join("\n").trim();
  if (!text) {
    throw Object.assign(new Error("Claude text generation returned no text."), {
      status: 502,
      code: "claude_no_text"
    });
  }
  return text;
}
async function generateDraft(prompt, register) {
  const llm = getDraftLLM();
  const chain = [];
  const withTimeout = (fn, label, ms = 45e3) => Promise.race([
    fn(),
    new Promise(
      (_, reject) => setTimeout(() => reject(new Error(`${label} draft timed out after ${ms / 1e3}s`)), ms)
    )
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
    } catch (err) {
      console.error(`${name} draft failed, trying next model:`, err?.message);
    }
  }
  return await openAIResponses(prompt);
}
var REFUSAL_PATTERNS = [
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
  /\bit(?:'s| is) impossible\b/i
];
function isCreativeRefusal(text) {
  if (!text) return false;
  if (text.trim() === "GENERATION_DECLINED" || text.trim().startsWith("GENERATION_DECLINED")) return true;
  const lower = text.toLowerCase();
  let hits = 0;
  for (const pattern of REFUSAL_PATTERNS) {
    if (pattern.test(text)) {
      hits += 1;
      if (hits >= 2) return true;
    }
  }
  if (/can(?:'t| not) (?:assist|fulfill|complete|comply|help|do)(?: with)? that request/i.test(text)) return true;
  if (/i(?:'m| am) sorry,? but i can(?:'t| not)/i.test(text) && lower.includes("request")) return true;
  const refusalRepeats = (text.match(/(?:can(?:'t| not) (?:assist|fulfill|complete|help)|i(?:'m| am) sorry)/gi) || []).length;
  if (refusalRepeats >= 3) return true;
  return false;
}
function getStylePrompt(style) {
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
var getUserProfileByEmailRef = makeFunctionReference("app:getUserProfileByEmail");
async function openAIResponses(prompt, model) {
  const useOpenAI = getDraftLLM() === "openai";
  if (useOpenAI) {
    try {
      const client = new OpenAI({ apiKey: getOpenAIApiKey() });
      const response = await client.chat.completions.create({
        model: model || getOpenAIModel(),
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }]
      });
      const text = response.choices?.[0]?.message?.content?.trim() || "";
      if (!text) {
        throw Object.assign(new Error("OpenAI text generation returned no text."), {
          status: 502,
          code: "openai_no_text"
        });
      }
      return text;
    } catch (error) {
      console.error("OpenAI mechanical pass failed, falling back to Gemini:", error?.message);
    }
  }
  const geminiModel = model || getTextModel();
  const apiKey = getRequestGeminiTextApiKey();
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: geminiModel,
      contents: [{ text: prompt }]
    });
    const text = typeof response?.text === "string" ? response.text : Array.isArray(response?.candidates?.[0]?.content?.parts) ? response.candidates[0].content.parts.map((part) => typeof part?.text === "string" ? part.text : "").join("\n").trim() : "";
    if (!text) {
      throw Object.assign(new Error("Gemini text generation returned no text."), {
        status: 502,
        code: "gemini_no_text"
      });
    }
    return text;
  } catch (error) {
    const details = error?.message || error?.details || "Gemini text generation failed.";
    const lower = String(details).toLowerCase();
    const isAuth = lower.includes("api key") || lower.includes("permission") || lower.includes("unauth");
    throw Object.assign(
      new Error(
        isAuth ? "Gemini API key is required or invalid. Add your own Gemini API key in the app and try again." : "Gemini text generation failed."
      ),
      {
        status: isAuth ? 401 : 502,
        code: isAuth ? "gemini_text_auth" : "gemini_text_failed",
        details
      }
    );
  }
}
var requestGeminiTextApiKey = null;
var requestRequiresUserGeminiKey = false;
function getRequestGeminiTextApiKey() {
  const key = (requestGeminiTextApiKey || "").trim();
  if (key) return key;
  if (!requestRequiresUserGeminiKey) {
    return getGeminiApiKey();
  }
  throw Object.assign(new Error("Missing Gemini API key. Please add your own Gemini API key in the app."), {
    status: 401,
    code: "missing_user_gemini_api_key"
  });
}
function parseDataUrlToBlob(dataUrl) {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) return null;
  const mimeType = match[1];
  const b64 = match[2];
  const bytes = Buffer.from(b64, "base64");
  return new Blob([bytes], { type: mimeType });
}
async function getAvatarBlobByEmail(email) {
  const convexUrl = process.env.CONVEX_URL;
  const convexAdminKey = process.env.CONVEX_ADMIN_KEY;
  if (!convexUrl || !convexAdminKey) return null;
  try {
    const client = new ConvexHttpClient(convexUrl);
    client.setAdminAuth(convexAdminKey);
    const profile = await client.query(getUserProfileByEmailRef, { email });
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
async function shouldRequireUserGeminiKey(email) {
  const convexUrl = process.env.CONVEX_URL;
  const convexAdminKey = process.env.CONVEX_ADMIN_KEY;
  if (!convexUrl || !convexAdminKey) return false;
  try {
    const client = new ConvexHttpClient(convexUrl);
    client.setAdminAuth(convexAdminKey);
    const profile = await client.query(getUserProfileByEmailRef, { email });
    return String(profile?.tier || "").toLowerCase() === "skool";
  } catch {
    return false;
  }
}
async function getAvatarBlob(avatarUrl, email) {
  const avatar = typeof avatarUrl === "string" ? avatarUrl.trim() : "";
  if (avatar) {
    if (avatar.startsWith("data:")) return parseDataUrlToBlob(avatar);
    if (avatar.startsWith("http://") || avatar.startsWith("https://")) {
      try {
        const r = await fetch(avatar);
        if (r.ok) return await r.blob();
      } catch {
      }
    }
  }
  return getAvatarBlobByEmail(email);
}
async function geminiGenerateImage(prompt, aspectRatio = "9:16", referenceImage) {
  const ai = new GoogleGenAI({ apiKey: getRequestGeminiTextApiKey() });
  const promptWithAspect = `${prompt}
Target aspect ratio: ${aspectRatio}.`;
  const contents = [{ text: promptWithAspect }];
  if (referenceImage) {
    const arrayBuffer = await referenceImage.arrayBuffer();
    contents.push({
      inlineData: {
        mimeType: referenceImage.type || "image/png",
        data: Buffer.from(arrayBuffer).toString("base64")
      }
    });
  }
  const maxAttempts = Math.max(1, Number(process.env.GEMINI_IMAGE_RETRY_ATTEMPTS || 3));
  const baseBackoffMs = Math.max(200, Number(process.env.GEMINI_IMAGE_RETRY_BASE_MS || 700));
  let lastError = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await ai.models.generateContent({
        model: getGeminiImageModel(),
        contents,
        config: {
          responseModalities: ["TEXT", "IMAGE"]
        }
      });
      const parts = Array.isArray(response?.parts) ? response.parts : Array.isArray(response?.candidates?.[0]?.content?.parts) ? response.candidates[0].content.parts : [];
      const imagePart = parts.find((part) => part?.inlineData?.data);
      const b64 = imagePart?.inlineData?.data;
      if (!b64 || typeof b64 !== "string") {
        throw Object.assign(new Error("Gemini image generation returned no base64 payload"), {
          status: 502,
          code: "gemini_no_image_payload"
        });
      }
      return `data:image/png;base64,${b64}`;
    } catch (error) {
      lastError = error;
      const text = `${error?.message || ""} ${error?.details || ""}`.toLowerCase();
      const transient = text.includes("deadline expired") || text.includes("deadline exceeded") || text.includes("unavailable") || text.includes("503");
      if (!transient || attempt >= maxAttempts) break;
      const waitMs = baseBackoffMs * attempt;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
  const errorText = `${lastError?.message || ""} ${lastError?.details || ""}`.toLowerCase();
  const isTransientFailure = errorText.includes("deadline expired") || errorText.includes("deadline exceeded") || errorText.includes("unavailable") || errorText.includes("503");
  if (isTransientFailure) {
    throw Object.assign(
      new Error("Artwork generation service is temporarily unavailable. Please retry in a few seconds."),
      {
        status: 503,
        code: "artwork_provider_unavailable"
      }
    );
  }
  throw lastError || Object.assign(new Error("Artwork generation failed."), { status: 500, code: "artwork_failed" });
}
async function describeAvatarForPrompt(referenceImage) {
  const ai = new GoogleGenAI({ apiKey: getRequestGeminiTextApiKey() });
  const arrayBuffer = await referenceImage.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const response = await ai.models.generateContent({
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
        `.trim()
      },
      {
        inlineData: {
          mimeType: referenceImage.type || "image/png",
          data: base64
        }
      }
    ]
  });
  const text = typeof response?.text === "string" ? response.text : Array.isArray(response?.candidates?.[0]?.content?.parts) ? response.candidates[0].content.parts.map((part) => typeof part?.text === "string" ? part.text : "").join("\n").trim() : "";
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
      "- Identity preservation notes: keep same person identity across all outputs"
    ].join("\n");
  }
  return text;
}
async function generateAlbumArt(payload) {
  const { songTitle, sunoPrompt, style, aspectRatio, avatarUrl } = payload || {};
  const ratio = aspectRatio === "1:1" || aspectRatio === "16:9" ? aspectRatio : "9:16";
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
async function generateSocialPack(payload) {
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
        cta: ""
      }
    };
  }
}
async function translateLyrics(payload) {
  const { lyrics, targetLanguage } = payload || {};
  const prompt = `
Translate these lyrics to ${targetLanguage || "English"}.
Keep section tags and preserve singable rhythm.

Lyrics:
${lyrics || ""}
`.trim();
  return { text: await openAIResponses(prompt) };
}
async function askAndre(payload) {
  const question = String(payload?.question || "").trim();
  const history = Array.isArray(payload?.history) ? payload.history : [];
  const closeSignals = /\b(thanks|thank you|got it|that'?s all|all good|resolved|done|no thanks|no, thanks|i'?m good)\b/i;
  const shouldCloseConversation = closeSignals.test(question);
  if (!question) {
    return {
      text: "Please share your question in one sentence. What screen or action are you trying to use?"
    };
  }
  const historyBlock = history.slice(-8).map((entry) => {
    const role = entry?.role === "assistant" ? "assistant" : "user";
    const content = String(entry?.content || "").trim();
    if (!content) return "";
    return `${role}: ${content}`;
  }).filter(Boolean).join("\n");
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
        text: shouldCloseConversation ? "Open Billing & Credits to see the current credit packs and your community discount (if eligible): https://www.songghost.com Is there anything else I can help you with?" : "Open Billing & Credits to see the current credit packs and your community discount (if eligible): https://www.songghost.com Are you asking about one-time packs or your current balance?"
      };
    }
    return {
      text: shouldCloseConversation ? "I can help with account, billing, credits, song generation, and member access. Is there anything else I can help you with?" : "I can help with account, billing, credits, song generation, and member access. What screen are you on right now so I can give the exact step?"
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
  finalText = finalText.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, "[redacted email]").replace(/\b(?:sk|rk|pk|pit|ghp|gho|xoxb|xoxp|AIza)[-_A-Za-z0-9=:.]{8,}\b/g, "[redacted key]").replace(/\b(?:password|passcode|token|secret|api key)\s*[:=]\s*[^\s.,;]+/gi, "[redacted secret]");
  finalText = finalText.replace(/\s*Is there anything else I can help you with\?\s*$/i, "").trim();
  if (shouldCloseConversation) {
    finalText = `${finalText} Is there anything else I can help you with?`.trim();
  }
  return { text: finalText };
}
function buildInterimSongPrompt(inputs) {
  const genre = String(inputs?.genre || "Pop").trim();
  const story = String(inputs?.creativeDirection || inputs?.additionalInfo || "").trim();
  const vocals = String(inputs?.vocals || "Female Solo").trim();
  const voice = /female/i.test(vocals) ? "female vocal" : /male/i.test(vocals) ? "male vocal" : "duet vocals";
  return `Write a ${genre} song${story ? ` about the following:

${story}

` : ". "}It should have a ${voice} and section tags like [Verse] [Chorus] [Bridge].

Also write a 40-70 word Suno production prompt describing how the track should sound.

Return exactly this format:
Title: ...
### SUNO Prompt
...
### Lyrics
...

This is creative fiction for a music app. If you cannot write it, return ONLY the line "GENERATION_DECLINED".`;
}
async function generateSongInterim(payload) {
  const prompt = buildInterimSongPrompt(payload?.inputs);
  const text = await generateDraft(prompt);
  if (isCreativeRefusal(text)) {
    throw Object.assign(
      new Error("Song generation failed \u2014 try adjusting the story and generate again."),
      { status: 422, code: "creative_refusal" }
    );
  }
  return { text };
}
async function streamSongInterim(payload, res) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive"
  });
  const send = (obj) => {
    res.write(`data: ${JSON.stringify(obj)}

`);
    res.flush?.();
  };
  try {
    const prompt = buildInterimSongPrompt(payload?.inputs);
    send({ type: "stage", label: "Writing your song\u2026" });
    let draft = "";
    try {
      const client = new OpenAI({ apiKey: getOpenAIApiKey() });
      const stream = await client.chat.completions.create({
        model: getOpenAIModel(),
        max_tokens: 4096,
        temperature: 0.8,
        stream: true,
        messages: [{ role: "user", content: prompt }]
      });
      let pending = "";
      let last = Date.now();
      for await (const chunk of stream) {
        const d = chunk.choices?.[0]?.delta?.content || "";
        if (!d) continue;
        draft += d;
        pending += d;
        if (Date.now() - last > 150) {
          send({ type: "d", t: pending });
          pending = "";
          last = Date.now();
        }
      }
      if (pending) send({ type: "d", t: pending });
    } catch {
      draft = "";
    }
    if (!draft.trim() || isCreativeRefusal(draft)) {
      draft = await generateDraft(prompt);
      send({ type: "d", t: draft });
    }
    send({ type: "done", text: draft });
  } catch (error) {
    send({ type: "error", error: error?.message || "Song generation failed." });
  } finally {
    res.end();
  }
}
async function editSongInterim(payload) {
  const { originalSong, editInstruction } = payload || {};
  const prompt = `Revise this song per the instruction. Instruction is highest priority.
Return only the full song in this exact format:
Title: ...
### SUNO Prompt
...
### Lyrics
...

INSTRUCTION: ${String(editInstruction || "").trim()}

SONG:
${String(originalSong || "").trim()}`;
  const text = await generateDraft(prompt);
  if (isCreativeRefusal(text)) {
    throw Object.assign(new Error("Revision failed \u2014 try rephrasing the instruction."), { status: 422, code: "creative_refusal" });
  }
  return { text };
}
async function structureImportedSongInterim(payload) {
  const { pastedContent, inputs } = payload || {};
  const genre = String(inputs?.genre || "").trim();
  const prompt = `Structure the pasted lyrics/ideas below into a complete song${genre ? ` (${genre})` : ""} with section tags like [Verse] [Chorus] [Bridge]. Preserve the writer's own words wherever possible.

Also write a 40-70 word Suno production prompt describing how the track should sound.

Return exactly this format:
Title: ...
### SUNO Prompt
...
### Lyrics
...

PASTED CONTENT:
${String(pastedContent || "").trim()}`;
  const text = await generateDraft(prompt);
  if (isCreativeRefusal(text)) {
    throw Object.assign(new Error("Import failed \u2014 try cleaning up the pasted text."), { status: 422, code: "creative_refusal" });
  }
  return { text };
}
async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  try {
    const { action, email, payload } = req.body || {};
    if (!action) return res.status(400).json({ error: "Missing action" });
    if (!isAllowedEmail(email)) return res.status(401).json({ error: "Invalid user identity" });
    requestRequiresUserGeminiKey = action === "askAndre" ? false : await shouldRequireUserGeminiKey(String(email || ""));
    requestGeminiTextApiKey = String(payload?.userGeminiApiKey || req.headers["x-gemini-api-key"] || "").trim() || null;
    switch (action) {
      case "generateSong":
        if (payload?.stream) return await streamSongInterim(payload, res);
        return res.status(200).json(await generateSongInterim(payload));
      case "editSong":
        return res.status(200).json(await editSongInterim(payload));
      case "structureImportedSong":
        return res.status(200).json(await structureImportedSongInterim(payload));
      case "generateAlbumArt":
        return res.status(200).json(await generateAlbumArt({ ...payload || {}, email }));
      case "generateSocialPack":
        return res.status(200).json(await generateSocialPack(payload));
      case "translateLyrics":
        return res.status(200).json(await translateLyrics(payload));
      case "askAndre":
        return res.status(200).json(await askAndre(payload));
      default:
        return res.status(400).json({ error: "Unsupported action" });
    }
  } catch (error) {
    console.error("[AI API Error]", {
      message: error?.message,
      code: error?.code,
      status: error?.status,
      details: error?.details
    });
    const status = Number.isInteger(error?.status) ? error.status : 500;
    return res.status(status).json({
      error: error?.message || "AI API failed",
      code: error?.code || "ai_request_failed"
    });
  } finally {
    requestGeminiTextApiKey = null;
    requestRequiresUserGeminiKey = false;
  }
}
export {
  buildInterimSongPrompt,
  config,
  handler as default
};
