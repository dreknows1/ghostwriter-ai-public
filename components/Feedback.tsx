import { useEffect, useRef, useState } from 'react';

/**
 * App-wide feedback layer: branded toasts + confirm/prompt modals replacing the
 * native alert()/confirm()/prompt() dialogs (which block the thread, look broken
 * on mobile, and can't carry a CTA).
 *
 * Call toast()/confirmDialog()/promptDialog() from anywhere — components or
 * services. A single <FeedbackHost /> is mounted next to <App /> in index.tsx;
 * if it isn't mounted yet, calls fall back to the native dialogs so nothing is
 * ever silently lost.
 */

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastOptions {
  kind?: ToastKind;
  /** Optional call-to-action rendered as a button inside the toast. */
  actionLabel?: string;
  onAction?: () => void;
  /** Auto-dismiss delay; errors default longer so they can be read. */
  durationMs?: number;
}

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Destructive styling (red confirm button). */
  danger?: boolean;
}

export interface PromptOptions {
  title?: string;
  message?: string;
  placeholder?: string;
  initialValue?: string;
  confirmLabel?: string;
}

type ToastItem = { id: number; message: string; kind: ToastKind; actionLabel?: string; onAction?: () => void; durationMs: number };
type ModalState =
  | { type: 'confirm'; opts: ConfirmOptions; resolve: (v: boolean) => void }
  | { type: 'prompt'; opts: PromptOptions; resolve: (v: string | null) => void }
  | null;

type HostApi = {
  pushToast: (t: Omit<ToastItem, 'id'>) => void;
  openModal: (m: ModalState) => void;
};

let host: HostApi | null = null;
let nextId = 1;

export function toast(message: string, kindOrOpts: ToastKind | ToastOptions = 'info'): void {
  const opts: ToastOptions = typeof kindOrOpts === 'string' ? { kind: kindOrOpts } : kindOrOpts;
  const kind = opts.kind || 'info';
  if (!host) {
    // Host not mounted (shouldn't happen in normal boot) — never swallow feedback.
    window.alert(message);
    return;
  }
  host.pushToast({
    message,
    kind,
    actionLabel: opts.actionLabel,
    onAction: opts.onAction,
    durationMs: opts.durationMs ?? (kind === 'error' ? 6000 : 3500),
  });
}

export function confirmDialog(opts: ConfirmOptions): Promise<boolean> {
  if (!host) return Promise.resolve(window.confirm(opts.message));
  return new Promise((resolve) => host!.openModal({ type: 'confirm', opts, resolve }));
}

export function promptDialog(opts: PromptOptions): Promise<string | null> {
  if (!host) return Promise.resolve(window.prompt(opts.message || opts.title || '', opts.initialValue || ''));
  return new Promise((resolve) => host!.openModal({ type: 'prompt', opts, resolve }));
}

const KIND_STYLES: Record<ToastKind, { border: string; icon: string }> = {
  success: { border: 'border-emerald-400/60', icon: '✓' },
  error: { border: 'border-rose-400/60', icon: '!' },
  info: { border: 'border-cyan-400/60', icon: 'ℹ' },
};

const KIND_ICON_STYLES: Record<ToastKind, string> = {
  success: 'bg-emerald-500/20 text-emerald-300',
  error: 'bg-rose-500/20 text-rose-300',
  info: 'bg-cyan-500/20 text-cyan-300',
};

export default function FeedbackHost() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [modal, setModal] = useState<ModalState>(null);
  const [promptValue, setPromptValue] = useState('');
  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    const api: HostApi = {
      pushToast: (t) => {
        const id = nextId++;
        setToasts((prev) => [...prev.slice(-3), { ...t, id }]); // max 4 on screen
        timers.current[id] = setTimeout(() => {
          setToasts((prev) => prev.filter((x) => x.id !== id));
          delete timers.current[id];
        }, t.durationMs);
      },
      openModal: (m) => {
        setPromptValue((m && m.type === 'prompt' && m.opts.initialValue) || '');
        setModal(m);
      },
    };
    host = api;
    return () => {
      if (host === api) host = null;
      Object.values(timers.current).forEach(clearTimeout);
    };
  }, []);

  const dismissToast = (id: number) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
    if (timers.current[id]) { clearTimeout(timers.current[id]); delete timers.current[id]; }
  };

  const settleModal = (value: boolean | string | null) => {
    if (!modal) return;
    if (modal.type === 'confirm') modal.resolve(Boolean(value));
    else modal.resolve(typeof value === 'string' ? value : null);
    setModal(null);
  };

  // Esc cancels the modal
  useEffect(() => {
    if (!modal) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') settleModal(modal.type === 'confirm' ? false : null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal]);

  return (
    <>
      {/* Toast stack */}
      {toasts.length > 0 && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[130] flex flex-col gap-2 w-[min(92vw,26rem)] pointer-events-none">
          {toasts.map((t) => (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto flex items-center gap-3 rounded-2xl border ${KIND_STYLES[t.kind].border} bg-[#181410] px-4 py-3 shadow-2xl animate-fade-in`}
            >
              <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${KIND_ICON_STYLES[t.kind]}`}>
                {KIND_STYLES[t.kind].icon}
              </span>
              <span className="flex-1 text-sm text-slate-100 leading-snug">{t.message}</span>
              {t.actionLabel && (
                <button
                  type="button"
                  onClick={() => { t.onAction?.(); dismissToast(t.id); }}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-200 text-xs font-black uppercase tracking-wide active:bg-cyan-500/30"
                >
                  {t.actionLabel}
                </button>
              )}
              <button type="button" aria-label="Dismiss" onClick={() => dismissToast(t.id)} className="shrink-0 text-slate-500 active:text-white text-lg leading-none px-1">×</button>
            </div>
          ))}
        </div>
      )}

      {/* Confirm / prompt modal */}
      {modal && (
        <div
          className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/80"
          onClick={() => settleModal(modal.type === 'confirm' ? false : null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-2xl border border-slate-700/70 bg-[#181410] shadow-2xl p-5" onClick={(e) => e.stopPropagation()}>
            {modal.opts.title && <h2 className="text-lg font-black text-white mb-2">{modal.opts.title}</h2>}
            {'message' in modal.opts && modal.opts.message && (
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{modal.opts.message}</p>
            )}
            {modal.type === 'prompt' && (
              <input
                autoFocus
                type="text"
                value={promptValue}
                placeholder={modal.opts.placeholder || ''}
                onChange={(e) => setPromptValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') settleModal(promptValue.trim() || null); }}
                className="mt-4 w-full rounded-xl border border-slate-700 bg-[#141110] px-4 py-3 text-base text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
              />
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => settleModal(modal.type === 'confirm' ? false : null)}
                className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-800/60 text-sm font-semibold text-slate-200 active:border-slate-500"
              >
                {(modal.type === 'confirm' && modal.opts.cancelLabel) || 'Cancel'}
              </button>
              <button
                type="button"
                autoFocus={modal.type === 'confirm'}
                onClick={() => settleModal(modal.type === 'confirm' ? true : (promptValue.trim() || null))}
                className={`px-4 py-2 rounded-lg text-sm font-black ${
                  modal.type === 'confirm' && modal.opts.danger
                    ? 'bg-rose-500 text-white active:bg-rose-400'
                    : 'bg-cyan-400 text-[#06121a] active:brightness-110'
                }`}
              >
                {modal.opts.confirmLabel || (modal.type === 'confirm' ? 'Confirm' : 'OK')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
