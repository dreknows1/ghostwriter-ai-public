import { SongInputs, SocialPack, UserProfile } from "../types";
import { sanitizeEmail, sanitizeUnknown } from "../lib/sanitizeInput";
import { apiFetch } from "../lib/api";

type AIAction =
  | "generateSong"
  | "suggestTitles"
  | "editSong"
  | "structureImportedSong"
  | "generateAlbumArt"
  | "generateSocialPack"
  | "translateLyrics"
  | "askAndre";

const GEMINI_KEY_STORAGE = "songghost_gemini_api_key";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Per-generation idempotency key. The server charges credits against this key
 * before the LLM call; minting it ONCE per logical generation and reusing it
 * across the streaming POST and its classic-fallback POST is what makes one
 * generation charge exactly once (a dropped stream that falls back never
 * double-charges). See server/ai.ts spendCreditsForRequest.
 */
function newGenerationKey(): string {
  try {
    const uuid = globalThis.crypto?.randomUUID?.();
    if (uuid) return uuid;
  } catch {
    /* fall through */
  }
  return `gen_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

async function callAI<T>(action: AIAction, email: string, payload: Record<string, unknown>, externalSignal?: AbortSignal): Promise<T> {
  const textActions = new Set<AIAction>([
    "generateSong",
    "editSong",
    "structureImportedSong",
    "generateSocialPack",
    "translateLyrics",
  ]);
  const getKeyFromUserIfNeeded = () => {
    if (typeof window === "undefined" || !textActions.has(action)) return "";
    return window.localStorage.getItem(GEMINI_KEY_STORAGE) || "";
  };

  const safeEmail = sanitizeEmail(email || "");
  const safePayload = sanitizeUnknown(payload || {});
  // Client-side safety timeout. The server pipeline budgets ~70s and hard-caps at 300s,
  // so 120s covers any valid generation while preventing an indefinite "GENERATING" hang
  // if the connection stalls. On timeout we throw before any credit is charged.
  const REQUEST_TIMEOUT_MS = 120000;
  const sendRequest = async (userGeminiApiKey: string) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    // Let a caller-supplied signal (e.g. the user cancelling) also abort the request.
    const onExternalAbort = () => controller.abort();
    if (externalSignal) {
      if (externalSignal.aborted) controller.abort();
      else externalSignal.addEventListener("abort", onExternalAbort, { once: true });
    }
    try {
      return await apiFetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, email: safeEmail, payload: { ...safePayload, userGeminiApiKey } }),
        signal: controller.signal,
      });
    } catch (e: any) {
      if (e?.name === "AbortError") {
        if (externalSignal?.aborted) {
          throw Object.assign(new Error("Generation cancelled."), { canceled: true, fromServer: true });
        }
        throw new Error("This is taking longer than expected. Please try again — you were not charged.");
      }
      throw e;
    } finally {
      clearTimeout(timer);
      if (externalSignal) externalSignal.removeEventListener("abort", onExternalAbort);
    }
  };

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
    // Preserve the server's error code + status so callers can act on it —
    // notably a 402 insufficient_credits routes the user to the paywall.
    const err: any = new Error(parsedError || raw || `AI request failed (${response.status})`);
    if (parsedCode) err.code = parsedCode;
    err.status = response.status;
    throw err;
  }

  return response.json();
}

/**
 * Song Builder: title ideas built FROM the user's picks and story. Returns up to 5
 * candidates, plus (when the curriculum engine handled it) which room the song will
 * live in and why — shown to the user, never a silent swap.
 */
export async function suggestTitles(
  inputs: Partial<SongInputs>,
  email: string
): Promise<{ titles: string[]; room?: { name: string; note: string } }> {
  const result = await callAI<{ titles: string[]; room?: { name: string; note: string } }>(
    "suggestTitles",
    email,
    { inputs }
  );
  return { titles: Array.isArray(result?.titles) ? result.titles : [], room: result?.room };
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

/**
 * Live streaming path: reads the server's SSE events so lyrics appear as they're
 * written and pipeline stages report real progress. Throws if the stream can't
 * start (caller falls back to the classic request) or dies midway (caller must
 * NOT silently regenerate — that would double-charge).
 */
// If the SSE connection goes quiet for this long mid-generation, stop waiting
// rather than stranding the user on the generating screen forever.
const STREAM_INACTIVITY_MS = 45000;

async function* streamSongEvents(
  inputs: unknown,
  email: string,
  userProfile: unknown,
  userGeminiApiKey: string,
  generationKey: string,
  signal?: AbortSignal
): AsyncGenerator<string> {
  const resp = await apiFetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "generateSong",
      email,
      payload: { inputs, userProfile, userGeminiApiKey, stream: true, generationKey },
    }),
    signal,
  });
  if (resp.status === 402) {
    // Server-authoritative spend rejected the request (out of credits). Mark it
    // fromServer so generateSong does NOT retry the classic path (which would
    // 402 again) and carry the code so the UI routes to the paywall.
    const body = await resp.json().catch(() => ({} as any));
    throw Object.assign(new Error(body?.error || "You're out of credits."), {
      code: "insufficient_credits",
      status: 402,
      fromServer: true,
    });
  }
  if (!resp.ok || !resp.body) {
    throw new Error(`stream unavailable (${resp.status})`);
  }
  const contentType = resp.headers.get("content-type") || "";
  if (!contentType.includes("text/event-stream")) {
    // Older server build ignored the stream flag and returned plain JSON.
    const json = await resp.json();
    yield json?.text || "";
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let draft = "";
  let finished = false;

  while (true) {
    // Cancelled by the user (they left the generating screen).
    if (signal?.aborted) {
      try { await reader.cancel(); } catch { /* ignore */ }
      throw Object.assign(new Error("Generation cancelled."), { canceled: true, fromServer: true });
    }
    // Inactivity watchdog: a stalled-open connection would otherwise hang forever.
    let inactivityTimer: ReturnType<typeof setTimeout> | undefined;
    let result: ReadableStreamReadResult<Uint8Array>;
    try {
      result = await Promise.race([
        reader.read(),
        new Promise<never>((_, reject) => {
          inactivityTimer = setTimeout(
            () => reject(Object.assign(new Error("Rudy went quiet — the connection stalled. Please try again — you were not charged."), { stalled: true })),
            STREAM_INACTIVITY_MS
          );
        }),
      ]);
    } catch (streamErr) {
      try { await reader.cancel(); } catch { /* ignore */ }
      if (signal?.aborted) {
        throw Object.assign(new Error("Generation cancelled."), { canceled: true, fromServer: true });
      }
      throw streamErr;
    } finally {
      if (inactivityTimer) clearTimeout(inactivityTimer);
    }
    const { value, done } = result;
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";
    for (const evt of events) {
      const dataLine = evt.split("\n").find((l) => l.startsWith("data: "));
      if (!dataLine) continue;
      let obj: any;
      try { obj = JSON.parse(dataLine.slice(6)); } catch { continue; }
      if (obj.type === "stage") {
        yield `__STATUS__:${obj.label}`;
      } else if (obj.type === "d") {
        draft += obj.t || "";
        yield draft;
      } else if (obj.type === "done") {
        yield obj.text || draft;
        finished = true;
      } else if (obj.type === "error") {
        // The server answered and said no — surface it. Marking it fromServer stops the
        // caller's transport-failure fallback from silently generating a SECOND song.
        throw Object.assign(new Error(obj.error || "Song generation failed."), { fromServer: true });
      }
    }
  }
  if (!finished) throw new Error("Generation stream ended early. Please try again — you were not charged.");
}

export async function* generateSong(
  inputs: SongInputs,
  email: string,
  userProfile?: UserProfile | null,
  signal?: AbortSignal
): AsyncGenerator<string> {
  const safeEmail = sanitizeEmail(email || "");
  const safeInputs = sanitizeUnknown(inputs || {});
  const safeProfile = sanitizeUnknown(userProfile || {});
  const storedKey =
    typeof window !== "undefined" ? (window.localStorage.getItem(GEMINI_KEY_STORAGE) || "") : "";
  // ONE idempotency key for this whole generation. Shared by the stream POST and
  // the classic-fallback POST below so the server charges credits exactly once.
  const generationKey = newGenerationKey();

  // Prefer the live stream: lyrics appear as they're written, stages are real.
  let yieldedLyrics = false;
  try {
    for await (const chunk of streamSongEvents(safeInputs, safeEmail, safeProfile, storedKey, generationKey, signal)) {
      if (typeof chunk === "string" && !chunk.startsWith("__STATUS__:") && chunk.trim()) {
        yieldedLyrics = true;
      }
      yield chunk;
    }
    return;
  } catch (err) {
    // ONE user input produces ONE song. If lyrics already streamed, the server
    // itself reported the failure (incl. a 402 out-of-credits), or the user
    // cancelled, a silent re-request would generate (and pay for) a second song —
    // surface the error instead.
    if (yieldedLyrics || (err as any)?.fromServer || (err as any)?.canceled) throw err;
    // Stream never got going (older deploy, proxy buffering, network) — classic path.
  }

  const pending = callAI<{ text: string }>("generateSong", email, { inputs, userProfile, generationKey });
  const statusMessages = [
    "Rudy is listening...",
    "Drafting lyrics and structure...",
    "Applying genre conventions...",
    "Tightening lines and cutting clichés...",
    "Finalizing your SUNO prompt and tags...",
  ];
  let statusIndex = 0;
  let settled = false;
  // Mark settled on resolve OR reject (e.g. timeout) so the status loop stops. The real
  // error is surfaced by `await pending` below; swallow here to avoid an unhandled rejection.
  pending.finally(() => {
    settled = true;
  }).catch(() => {});

  while (!settled) {
    const msg = statusMessages[Math.min(statusIndex, statusMessages.length - 1)];
    yield `__STATUS__:${msg}`;
    statusIndex += 1;
    await sleep(1400);
  }

  const result = await pending;
  yield* singleYield(result.text || "");
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
    // Per-edit idempotency key: the server charges EDIT_SONG against it before the
    // revision, so a network retry of THIS edit charges exactly once.
    generationKey: newGenerationKey(),
  });
  yield* singleYield(result.text || "");
}

export async function* structureImportedSong(
  rawText: string,
  email: string,
  inputs?: SongInputs,
  userProfile?: UserProfile | null,
  signal?: AbortSignal
): AsyncGenerator<string> {
  const result = await callAI<{ text: string }>("structureImportedSong", email, {
    rawText,
    inputs,
    userProfile,
    generationKey: newGenerationKey(),
  }, signal);
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
    // Per-generation idempotency key: the server charges GENERATE_ART against it
    // before the image call and refunds on failure, so one click = one charge.
    generationKey: newGenerationKey(),
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
