import { CulturalAudit, QualityGateReport, SongInputs, SocialPack, UserProfile } from "../types";
import { sanitizeEmail, sanitizeUnknown } from "../lib/sanitizeInput";

type AIAction =
  | "generateSong"
  | "editSong"
  | "structureImportedSong"
  | "generateDynamicOptions"
  | "generateAlbumArt"
  | "generateSocialPack"
  | "translateLyrics"
  | "askAndre";

let lastCulturalAudit: CulturalAudit | null = null;
let lastQualityGateReport: QualityGateReport | null = null;
const GEMINI_KEY_STORAGE = "songghost_gemini_api_key";

function setLastCulturalAudit(audit?: CulturalAudit | null) {
  if (!audit) return;
  if (typeof audit.overallScore !== "number" || !Array.isArray(audit.checklist)) return;
  lastCulturalAudit = audit;
}

export function getLastCulturalAudit(): CulturalAudit | null {
  return lastCulturalAudit;
}

export function getLastQualityGateReport(): QualityGateReport | null {
  return lastQualityGateReport;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callAI<T>(action: AIAction, email: string, payload: Record<string, unknown>): Promise<T> {
  const textActions = new Set<AIAction>([
    "generateSong",
    "editSong",
    "structureImportedSong",
    "generateDynamicOptions",
    "generateSocialPack",
    "translateLyrics",
  ]);
  const getKeyFromUserIfNeeded = () => {
    if (typeof window === "undefined" || !textActions.has(action)) return "";
    return window.localStorage.getItem(GEMINI_KEY_STORAGE) || "";
  };

  const safeEmail = sanitizeEmail(email || "");
  const safePayload = sanitizeUnknown(payload || {});
  const sendRequest = async (userGeminiApiKey: string) => fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, email: safeEmail, payload: { ...safePayload, userGeminiApiKey } }),
  });

  let userGeminiApiKey = getKeyFromUserIfNeeded();
  let response = await sendRequest(userGeminiApiKey);

  if (!response.ok) {
    const raw = await response.text();
    let parsedError: string | null = null;
    let parsedCode: string | null = null;
    try {
      const json = JSON.parse(raw);
      parsedError = typeof json?.error === "string" ? json.error : null;
      parsedCode = typeof json?.code === "string" ? json.code : null;
    } catch {
      parsedError = null;
    }
    const canRetryKey =
      textActions.has(action) &&
      typeof window !== "undefined" &&
      (parsedCode === "gemini_text_auth" || parsedCode === "missing_user_gemini_api_key");
    if (canRetryKey) {
      window.localStorage.removeItem(GEMINI_KEY_STORAGE);
      const entered = window.prompt("Members must use their own Gemini API key. Paste a valid Gemini API key:");
      if (entered && entered.trim()) {
        userGeminiApiKey = entered.trim();
        window.localStorage.setItem(GEMINI_KEY_STORAGE, userGeminiApiKey);
        response = await sendRequest(userGeminiApiKey);
        if (response.ok) return response.json();
      }
    }
    throw new Error(parsedError || raw || `AI request failed (${response.status})`);
  }

  return response.json();
}

export function promptToSetGeminiApiKey(): void {
  if (typeof window === "undefined") return;
  const entered = window.prompt(
    "Paste your Gemini API key (get one at https://aistudio.google.com/app/apikey):",
    window.localStorage.getItem(GEMINI_KEY_STORAGE) || ""
  );
  if (entered && entered.trim()) {
    window.localStorage.setItem(GEMINI_KEY_STORAGE, entered.trim());
  }
}

async function* singleYield(text: string): AsyncGenerator<string> {
  yield text;
}

export async function* generateSong(
  inputs: SongInputs,
  email: string,
  userProfile?: UserProfile | null
): AsyncGenerator<string> {
  const pending = callAI<{ text: string; audit?: CulturalAudit; qualityGate?: QualityGateReport }>("generateSong", email, { inputs, userProfile });
  const statusMessages = [
    "Song Ghost is listening...",
    "Drafting lyrics and structure...",
    "Applying genre/subgenre agent rules...",
    "Running cultural authenticity score...",
    "If score is under 85, rewrite pass starts automatically...",
    "Finalizing SUNO prompt + dynamic tag orchestration...",
  ];
  let statusIndex = 0;
  let settled = false;
  pending.finally(() => {
    settled = true;
  });

  while (!settled) {
    const msg = statusMessages[Math.min(statusIndex, statusMessages.length - 1)];
    yield `__STATUS__:${msg}`;
    statusIndex += 1;
    await sleep(1400);
  }

  const result = await pending;
  setLastCulturalAudit(result.audit || null);
  lastQualityGateReport = result.qualityGate || null;
  yield* singleYield(result.text || "");
}

export async function generateDynamicOptions(
  targetField: string,
  currentInputs: SongInputs
): Promise<string[]> {
  const result = await callAI<{ options: string[] }>("generateDynamicOptions", "system@songghost.local", {
    targetField,
    currentInputs,
  });
  return Array.isArray(result.options) ? result.options : [];
}

export async function* editSong(
  originalSong: string,
  editInstruction: string,
  email: string,
  inputs?: SongInputs,
  userProfile?: UserProfile | null
): AsyncGenerator<string> {
  const result = await callAI<{ text: string; audit?: CulturalAudit }>("editSong", email, {
    originalSong,
    editInstruction,
    inputs,
    userProfile,
  });
  setLastCulturalAudit(result.audit || null);
  yield* singleYield(result.text || "");
}

export async function* structureImportedSong(
  rawText: string,
  email: string,
  inputs?: SongInputs,
  userProfile?: UserProfile | null
): AsyncGenerator<string> {
  const result = await callAI<{ text: string; audit?: CulturalAudit }>("structureImportedSong", email, {
    rawText,
    inputs,
    userProfile,
  });
  setLastCulturalAudit(result.audit || null);
  yield* singleYield(result.text || "");
}

export async function generateAlbumArt(
  songTitle: string,
  sunoPrompt: string,
  style: string,
  aspectRatio: "9:16" | "1:1" | "16:9",
  email: string,
  avatarUrl?: string
): Promise<string> {
  const result = await callAI<{ imageDataUrl: string }>("generateAlbumArt", email, {
    songTitle,
    sunoPrompt,
    style,
    aspectRatio,
    avatarUrl,
  });
  if (!result.imageDataUrl) throw new Error("Image generation failed");
  return result.imageDataUrl;
}

export async function generateSocialPack(songTitle: string, lyrics: string, email: string): Promise<SocialPack> {
  const result = await callAI<{ pack: SocialPack }>("generateSocialPack", email, { songTitle, lyrics });
  return result.pack;
}

export async function translateLyrics(lyrics: string, targetLanguage: string, email: string): Promise<string> {
  const result = await callAI<{ text: string }>("translateLyrics", email, { lyrics, targetLanguage });
  return result.text || "Translation failed.";
}

export async function askAndre(question: string, email: string, history: Array<{ role: "user" | "assistant"; content: string }>): Promise<string> {
  const result = await callAI<{ text: string }>("askAndre", email || "guest@songghost.local", { question, history });
  return result.text || "I can help with that. What exact step are you on? Is there anything else I can help you with?";
}

export async function* polishSong(currentLyrics: string, genre: string, email: string): AsyncGenerator<string> {
  const result = await callAI<{ text: string; audit?: CulturalAudit }>("editSong", email, {
    originalSong: `Title: Draft\n### SUNO Prompt\n${genre}\n### Lyrics\n${currentLyrics}`,
    editInstruction: `Polish for ${genre}. Keep structure and improve performance cues.`,
    inputs: { genre },
  });
  setLastCulturalAudit(result.audit || null);
  yield* singleYield(result.text || "");
}
