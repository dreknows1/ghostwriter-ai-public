import { SongInputs, SocialPack, UserProfile } from "../types";
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

const GEMINI_KEY_STORAGE = "songghost_gemini_api_key";

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
      const newKey = await requestKeyViaModal();
      if (newKey) {
        userGeminiApiKey = newKey;
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
  window.dispatchEvent(new CustomEvent("songghost:openApiKeyModal"));
}

/**
 * Opens the API key modal and resolves with the saved key (or null if the user
 * dismisses it). Used by the AI request retry path when a saved key is rejected.
 */
function requestKeyViaModal(): Promise<string | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    let settled = false;
    const cleanup = () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("songghost:apiKeyModalClosed", onClosed);
    };
    const settle = (value: string | null) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(value);
    };
    const onStorage = (e: StorageEvent) => {
      // Modal saves via localStorage.setItem — but storage events don't fire
      // in the same window. We poll instead below as a backup.
      if (e.key === GEMINI_KEY_STORAGE && e.newValue) settle(e.newValue.trim());
    };
    const onClosed = () => {
      const saved = window.localStorage.getItem(GEMINI_KEY_STORAGE) || "";
      settle(saved.trim() || null);
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("songghost:apiKeyModalClosed", onClosed);
    window.dispatchEvent(new CustomEvent("songghost:openApiKeyModal"));
  });
}

async function* singleYield(text: string): AsyncGenerator<string> {
  yield text;
}

export async function* generateSong(
  inputs: SongInputs,
  email: string,
  userProfile?: UserProfile | null
): AsyncGenerator<string> {
  const pending = callAI<{ text: string }>("generateSong", email, { inputs, userProfile });
  const statusMessages = [
    "Song Ghost is listening...",
    "Drafting lyrics and structure...",
    "Applying genre/subgenre agent rules...",
    "Applying genre authenticity fingerprint...",
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
  const result = await callAI<{ text: string }>("editSong", email, {
    originalSong,
    editInstruction,
    inputs,
    userProfile,
  });
  yield* singleYield(result.text || "");
}

export async function* structureImportedSong(
  rawText: string,
  email: string,
  inputs?: SongInputs,
  userProfile?: UserProfile | null
): AsyncGenerator<string> {
  const result = await callAI<{ text: string }>("structureImportedSong", email, {
    rawText,
    inputs,
    userProfile,
  });
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
  const result = await callAI<{ text: string }>("editSong", email, {
    originalSong: `Title: Draft\n### SUNO Prompt\n${genre}\n### Lyrics\n${currentLyrics}`,
    editInstruction: `Polish for ${genre}. Keep structure and improve performance cues.`,
    inputs: { genre },
  });
  yield* singleYield(result.text || "");
}
