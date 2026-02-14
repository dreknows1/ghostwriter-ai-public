import { CulturalAudit, QualityGateReport, SongInputs, SocialPack, UserProfile } from "../types";

type AIAction =
  | "generateSong"
  | "editSong"
  | "structureImportedSong"
  | "generateDynamicOptions"
  | "generateAlbumArt"
  | "generateSocialPack"
  | "translateLyrics";

let lastCulturalAudit: CulturalAudit | null = null;
let lastQualityGateReport: QualityGateReport | null = null;

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
  const response = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, email, payload }),
  });

  if (!response.ok) {
    const raw = await response.text();
    let parsedError: string | null = null;
    try {
      const json = JSON.parse(raw);
      parsedError = typeof json?.error === "string" ? json.error : null;
    } catch {
      parsedError = null;
    }
    throw new Error(parsedError || raw || `AI request failed (${response.status})`);
  }

  return response.json();
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

export async function* polishSong(currentLyrics: string, genre: string, email: string): AsyncGenerator<string> {
  const result = await callAI<{ text: string; audit?: CulturalAudit }>("editSong", email, {
    originalSong: `Title: Draft\n### SUNO Prompt\n${genre}\n### Lyrics\n${currentLyrics}`,
    editInstruction: `Polish for ${genre}. Keep structure and improve performance cues.`,
    inputs: { genre },
  });
  setLastCulturalAudit(result.audit || null);
  yield* singleYield(result.text || "");
}
