import React, { useEffect, useMemo, useRef, useState } from "react";
import { confirmDialog, toast } from "./Feedback";

const STORAGE_KEY = "songghost_gemini_api_key";

type Status = { kind: "idle" } | { kind: "testing" } | { kind: "ok"; modelCount: number } | { kind: "error"; message: string };

function maskKey(key: string): string {
  if (!key) return "";
  if (key.length <= 10) return "•".repeat(key.length);
  return `${key.slice(0, 6)}${"•".repeat(Math.max(4, key.length - 10))}${key.slice(-4)}`;
}

async function testGeminiKey(key: string): Promise<{ ok: boolean; modelCount?: number; error?: string }> {
  const trimmed = key.trim();
  if (!trimmed) return { ok: false, error: "Key is empty." };
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(trimmed)}`);
    if (res.ok) {
      const data = await res.json();
      const count = Array.isArray(data?.models) ? data.models.length : 0;
      return { ok: true, modelCount: count };
    }
    if (res.status === 400 || res.status === 401 || res.status === 403) {
      const data = await res.json().catch(() => ({} as any));
      const msg = data?.error?.message || `Google rejected the key (${res.status}).`;
      return { ok: false, error: msg };
    }
    return { ok: false, error: `Unexpected response from Google: ${res.status}` };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Network error testing the key." };
  }
}

export type ApiKeyModalProps = {
  isOpen: boolean;
  onClose: () => void;
  /** Optional callback invoked with the saved key after a successful save. */
  onSaved?: (key: string) => void;
  /** When true, the close button is hidden — used when a feature is blocked by the missing key. */
  required?: boolean;
};

function notifyClosed() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("songghost:apiKeyModalClosed"));
  }
}

export default function ApiKeyModal({ isOpen, onClose, onSaved, required }: ApiKeyModalProps) {
  const existing = useMemo(() => {
    if (typeof window === "undefined") return "";
    return (window.localStorage.getItem(STORAGE_KEY) || "").trim();
  }, [isOpen]);

  const [value, setValue] = useState<string>("");
  const [reveal, setReveal] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [showHelp, setShowHelp] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setValue("");
    setReveal(false);
    setStatus({ kind: "idle" });
    setShowHelp(false);
    // Defer focus to next tick so the input is mounted
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [isOpen]);

  // Block scroll on body while modal open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  // Esc to close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !required) { notifyClosed(); onClose(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, required, onClose]);

  if (!isOpen) return null;

  const closeAndNotify = () => {
    notifyClosed();
    onClose();
  };

  const handleTest = async () => {
    setStatus({ kind: "testing" });
    const result = await testGeminiKey(value);
    if (result.ok) setStatus({ kind: "ok", modelCount: result.modelCount ?? 0 });
    else setStatus({ kind: "error", message: result.error || "Invalid key." });
  };

  const handleSave = async () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setStatus({ kind: "error", message: "Paste a key first." });
      return;
    }
    // If we haven't tested yet, test before saving to catch typos.
    if (status.kind !== "ok") {
      setStatus({ kind: "testing" });
      const result = await testGeminiKey(trimmed);
      if (!result.ok) {
        setStatus({ kind: "error", message: result.error || "Invalid key." });
        return;
      }
      setStatus({ kind: "ok", modelCount: result.modelCount ?? 0 });
    }
    window.localStorage.setItem(STORAGE_KEY, trimmed);
    onSaved?.(trimmed);
    notifyClosed();
    onClose();
  };

  const handleClear = async () => {
    const ok = await confirmDialog({
      title: "Remove saved key",
      message: "Remove your saved Gemini API key from this browser?",
      confirmLabel: "Remove",
      danger: true,
    });
    if (!ok) return;
    window.localStorage.removeItem(STORAGE_KEY);
    setValue("");
    setStatus({ kind: "idle" });
    toast("Saved key removed from this browser.", "success");
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={() => { if (!required) closeAndNotify(); }}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-700/70 bg-[#1a1530] text-slate-100 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-black text-white">Connect your Gemini API key</h2>
            <p className="text-sm text-slate-400 mt-1">
              Song Ghost uses your own free Gemini key for lyric generation. The key stays in your browser — it's never sent to our servers.
            </p>
          </div>
          {!required && (
            <button
              onClick={closeAndNotify}
              aria-label="Close"
              className="text-slate-400 hover:text-white text-2xl leading-none px-2 -mt-1"
            >
              ×
            </button>
          )}
        </div>

        <div className="p-5 space-y-4">
          {existing && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm">
              <div className="text-emerald-300 font-semibold">Key already saved on this device</div>
              <div className="font-mono text-xs text-slate-400 mt-1 break-all">{maskKey(existing)}</div>
              <div className="text-slate-400 mt-2">Paste a new key below to replace it, or remove it.</div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Your Gemini API key</label>
              <button
                type="button"
                onClick={() => setReveal((v) => !v)}
                className="text-xs text-cyan-300 hover:text-cyan-200"
              >
                {reveal ? "Hide" : "Show"}
              </button>
            </div>
            <input
              ref={inputRef}
              type={reveal ? "text" : "password"}
              autoComplete="off"
              spellCheck={false}
              placeholder="AIza..."
              value={value}
              onChange={(e) => { setValue(e.target.value); setStatus({ kind: "idle" }); }}
              className="w-full rounded-xl border border-slate-700 bg-[#0f0a22] px-4 py-3 text-base font-mono text-cyan-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
            />
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <button
                type="button"
                onClick={handleTest}
                disabled={!value.trim() || status.kind === "testing"}
                className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-800/60 text-sm font-semibold text-slate-200 hover:border-cyan-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {status.kind === "testing" ? "Testing..." : "Test key"}
              </button>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-lg border border-cyan-400/40 bg-cyan-500/10 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/20 hover:text-white"
              >
                Get a free key →
              </a>
              <button
                type="button"
                onClick={() => setShowHelp((v) => !v)}
                className="px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200"
              >
                {showHelp ? "Hide steps" : "Where do I get this?"}
              </button>
            </div>

            {status.kind === "ok" && (
              <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                ✓ Key works — Google returned {status.modelCount} model{status.modelCount === 1 ? "" : "s"}.
              </div>
            )}
            {status.kind === "error" && (
              <div className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {status.message}
              </div>
            )}
          </div>

          {showHelp && (
            <div className="rounded-xl border border-slate-700 bg-[#0f0a22] px-4 py-3 text-sm text-slate-300 space-y-2">
              <div className="font-bold text-white">How to get a Gemini API key (free):</div>
              <ol className="list-decimal pl-5 space-y-1 text-slate-300">
                <li>Click <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-cyan-300 underline">Get a free key</a> above (opens Google AI Studio in a new tab).</li>
                <li>Sign in with the Google account you want to use.</li>
                <li>Click <strong>"Create API key"</strong> → pick or create a project → copy the key (starts with <span className="font-mono">AIza...</span>).</li>
                <li>Come back here, paste it above, click <strong>Test key</strong> or just <strong>Save</strong>.</li>
              </ol>
              <div className="text-xs text-slate-500 pt-2 border-t border-slate-800">
                The free tier is generous and renews monthly. Song Ghost never sees this key — it's stored only on this device.
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 p-5 border-t border-slate-800">
          <div>
            {existing && (
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-2 rounded-lg text-sm text-rose-300 hover:text-rose-200"
              >
                Remove saved key
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {!required && (
              <button
                type="button"
                onClick={closeAndNotify}
                className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-800/60 text-sm font-semibold text-slate-200 hover:border-slate-500"
              >
                {existing ? "Close" : "Not now"}
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={!value.trim() || status.kind === "testing"}
              className="px-4 py-2 rounded-lg bg-cyan-400 text-[#06121a] text-sm font-black hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Save key
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
