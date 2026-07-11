
// LyricsDisplay.tsx - the result screen. Hierarchy: lamplit parchment lyrics →
// teal Suno prompt block → hero "Open in Suno" → secondary icon row. Editing
// tools (quick revision, meta tags, session art) stay available below, for
// anyone who wants to go deeper than the quick result.
import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { CopyIcon, CheckIcon, ImageIcon, TranslateIcon, LoadingSpinner, MagicWandIcon, DownloadIcon, ExternalLinkIcon, ShareIcon, BookmarkIcon, RefreshIcon } from './icons';
import { SocialPack, SongInputs } from '../types';
import { editSong } from '../services/geminiService';
import MetaTagLibrary from './MetaTagLibrary';
import { toast, promptDialog } from './Feedback';
import { hasEnoughCredits, COSTS } from '../services/creditService';
import { openInSuno, copyText } from '../lib/nativeBridge';
import { isNative } from '../lib/platform';
import { hapticLight } from '../lib/haptics';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';

interface LyricsDisplayProps {
  song: string;
  albumArt: string | null;
  onAlbumArtChange: (art: string) => void;
  onStartOver: () => void;
  onGoHome: () => void;
  onEdit: (instruction: string) => void;
  onSave: (title: string, prompt: string, lyrics: string, albumArt?: string, socialPack?: SocialPack) => Promise<void>;
  onAutoSaveArt?: (title: string, prompt: string, lyrics: string, albumArt?: string) => Promise<void>;
  onResizePrompt: (currentPrompt: string, action: 'shorten' | 'lengthen') => Promise<void>;
  onGenerateArt: (title: string, prompt: string, aspectRatio: "9:16" | "1:1" | "16:9") => Promise<string>;
  onGenerateSocial: (title: string, lyrics: string) => Promise<SocialPack>;
  onTranslate: (text: string, lang: string) => Promise<string>;
  refreshCredits?: () => Promise<void>;
  isResizing: boolean;
  email: string;
  currentInputs?: SongInputs;
}

const LyricsDisplay: React.FC<LyricsDisplayProps> = ({
    song,
    albumArt,
    onAlbumArtChange,
    onStartOver,
    onGoHome,
    onSave,
    onAutoSaveArt,
    onGenerateArt,
    onTranslate,
    refreshCredits,
    email,
    currentInputs,
}) => {
  const questionnaireItems = useMemo(() => {
    const inputs = currentInputs || {};
    const rows: Array<{ label: string; value: string }> = [
      { label: "Language", value: String(inputs.language || "") },
      { label: "Genre", value: String(inputs.genre || "") },
      { label: "Subgenre", value: String(inputs.subGenre || "") },
      { label: "Instrumentation", value: String(inputs.instrumentation || "") },
      { label: "Audio Environment", value: String(inputs.audioEnv || "") },
      { label: "Scene", value: String(inputs.scene || "") },
      { label: "Emotion", value: String(inputs.emotion || "") },
      { label: "Vocals", value: String(inputs.vocals || "") },
      { label: "Duet Type", value: String(inputs.duetType || "") },
      { label: "Performer Type", value: String(inputs.performerType || "") },
      { label: "Reference Artist", value: String(inputs.referenceArtist || "") },
      { label: "Additional Direction", value: String(inputs.additionalInfo || "") },
      { label: "Mundane Objects", value: String(inputs.mundaneObjects || "") },
      { label: "Creative Direction", value: String(inputs.creativeDirection || (inputs as any).awkwardMoment || "") },
    ];
    return rows.filter((row) => row.value.trim().length > 0);
  }, [currentInputs]);

  const [history, setHistory] = useState<string[]>([song]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const currentFullSong = history[historyIndex];
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [quickEditInput, setQuickEditInput] = useState('');
  const [isQuickEditing, setIsQuickEditing] = useState(false);
  const [isGeneratingArt, setIsGeneratingArt] = useState(false);
  const [artAspect, setArtAspect] = useState<"9:16" | "1:1" | "16:9">("9:16");
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedLyrics, setCopiedLyrics] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const parsed = useMemo(() => {
    const raw = currentFullSong.trim();
    const lines = raw.split('\n');

    let titleIdx = lines.findIndex(l => l.startsWith('Title:'));
    if (titleIdx === -1) titleIdx = 0;

    let promptIdx = lines.findIndex(l => l.toLowerCase().includes('### suno prompt'));
    let lyricsIdx = lines.findIndex(l => l.toLowerCase().includes('### lyrics'));

    let title = lines[titleIdx]?.replace('Title: ', '').replace(/[*#]/g, '').trim() || 'Untitled Draft';

    if (title.toLowerCase().startsWith("here is") || title.toLowerCase().startsWith("sure") || title.toLowerCase().startsWith("i have")) {
        const nextPotentials = lines.slice(titleIdx + 1, 5);
        const actualTitleLine = nextPotentials.find(l => l.startsWith('Title:'));
        if (actualTitleLine) {
            title = actualTitleLine.replace('Title: ', '').replace(/[*#]/g, '').trim();
        }
    }

    let prompt = promptIdx !== -1 ? lines.slice(promptIdx + 1, lyricsIdx !== -1 ? lyricsIdx : undefined).join('\n').trim() : '';
    let lyrics = lyricsIdx !== -1 ? lines.slice(lyricsIdx + 1).join('\n').trim() : currentFullSong;

    return { title, prompt, lyrics };
  }, [currentFullSong]);

  const handleScroll = () => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const addToHistory = (newSong: string) => {
    if (newSong === currentFullSong) return;
    const newHistory = [...history.slice(0, historyIndex + 1), newSong];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleManualLyricsChange = (newLyrics: string) => {
    const newSong = `Title: ${parsed.title}\n\n### SUNO Prompt\n${parsed.prompt}\n\n### Lyrics\n${newLyrics}`;
    addToHistory(newSong);
  };

  // Insert a meta tag at the lyrics cursor (works on touch — the old drag-only flow did not).
  // Structure tags like [Verse] land on their own line; ad-libs like (yeah) insert inline.
  const insertTagAtCursor = (tag: string) => {
    const ta = textareaRef.current;
    const lyrics = parsed.lyrics;
    const isStructure = tag.startsWith('[');
    const start = ta?.selectionStart ?? lyrics.length;
    const end = ta?.selectionEnd ?? lyrics.length;
    const before = lyrics.slice(0, start);
    const after = lyrics.slice(end);
    let insert = tag;
    if (isStructure) {
      const lead = before.length > 0 && !before.endsWith('\n') ? '\n' : '';
      const trail = after.length > 0 && !after.startsWith('\n') ? '\n' : '';
      insert = `${lead}${tag}${trail}`;
    }
    handleManualLyricsChange(before + insert + after);
    const caret = start + insert.length;
    requestAnimationFrame(() => {
      if (!ta) return;
      ta.focus();
      try { ta.setSelectionRange(caret, caret); } catch { /* ignore */ }
    });
  };

  const copyToClipboard = async (text: string, setFeedback: (v: boolean) => void) => {
    await copyText(text);
    setFeedback(true);
    setTimeout(() => setFeedback(false), 2000);
  };

  const handleCopyLyrics = async () => {
    await copyToClipboard(parsed.lyrics, setCopiedLyrics);
    hapticLight();
    toast('Copied. Go haunt Suno with it.', 'success');
  };

  const handleCopyPrompt = async () => {
    await copyToClipboard(parsed.prompt, setCopiedPrompt);
    hapticLight();
    toast('Copied. Go haunt Suno with it.', 'success');
  };

  const handleOpenInSuno = async () => {
    hapticLight();
    await openInSuno(parsed.prompt);
    toast('Copied. Go haunt Suno with it.', 'success');
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const text = `${parsed.title}\n\n${parsed.lyrics}\n\n---\nSuno style prompt:\n${parsed.prompt}`;
      if (isNative()) {
        await Share.share({ title: parsed.title, text, dialogTitle: 'Share your song' });
      } else if (navigator.share) {
        await navigator.share({ title: parsed.title, text });
      } else {
        await copyText(text);
        toast('Copied. Go haunt Suno with it.', 'success');
      }
    } catch (e) {
      // User-cancelled shares throw too — stay quiet.
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownloadArt = async () => {
    if (!albumArt) return;
    const filename = `${parsed.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_art.png`;
    if (isNative()) {
      try {
        const base64 = albumArt.split(',')[1] || albumArt;
        const written = await Filesystem.writeFile({ path: filename, data: base64, directory: Directory.Cache });
        await Share.share({ title: parsed.title, url: written.uri, dialogTitle: 'Save artwork' });
      } catch (e: any) {
        toast(`Couldn't save artwork: ${e?.message || 'please try again.'}`, 'error');
      }
      return;
    }
    const link = document.createElement('a');
    link.href = albumArt;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderHighlights = useCallback((text: string) => {
    return text
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/(\[.*?\])/g, '<span class="studio-structure-tag">$1</span>')
      .replace(/(\(.*?\))/g, '<span class="studio-vocal-cue">$1</span>')
      .replace(/\.\.\./g, '<span class="text-page-ink-soft">...</span>') + '<br/>';
  }, []);

  const handleQuickEdit = async () => {
    if (!quickEditInput.trim()) return;
    const canAfford = await hasEnoughCredits(email, COSTS.EDIT_SONG);
    if (!canAfford) { toast('Even ghosts need fuel — top up to keep the hooks coming.', 'error'); return; }
    setIsQuickEditing(true);
    try {
      const generator = editSong(currentFullSong, quickEditInput, email, currentInputs);
      let res = ''; for await (const chunk of generator) { res = chunk; }
      if (res) {
          addToHistory(res);
          setQuickEditInput('');
          // Credit was spent SERVER-side before the revision (server-authoritative,
          // /api/ai). Reconcile the UI to the true post-spend balance — this
          // replaces the removed client deductCredits double-charge.
          if (refreshCredits) await refreshCredits();
      }
    } catch (e: any) {
      console.error(e);
      if (refreshCredits) refreshCredits();
      if (e?.code === 'insufficient_credits' || e?.status === 402) {
        toast('Even ghosts need fuel — top up to keep the hooks coming.', 'error');
      }
    } finally { setIsQuickEditing(false); }
  };

  const handleGenerateArtwork = async () => {
    const canAfford = await hasEnoughCredits(email, COSTS.GENERATE_ART);
    if (!canAfford) { toast('Even ghosts need fuel — top up to keep the hooks coming.', 'error'); return; }
    setIsGeneratingArt(true);
    try {
      const art = await onGenerateArt(parsed.title, parsed.prompt, artAspect);
      if (art) {
        onAlbumArtChange(art);
        if (onAutoSaveArt) {
          try {
            await onAutoSaveArt(parsed.title, parsed.prompt, parsed.lyrics, art);
          } catch (saveError) {
            console.error("Auto-save artwork failed:", saveError);
          }
        }
        // Credits were spent SERVER-side before the image call (server-authoritative,
        // /api/ai), which also refunds a charged-then-failed generation. Reconcile
        // the UI — this replaces the removed client deductCredits double-charge.
        if (refreshCredits) await refreshCredits();
      }
    } catch (e: any) {
      console.error("Art generation error:", e);
      if (refreshCredits) refreshCredits();
      if (e?.code === 'insufficient_credits' || e?.status === 402) {
        toast('Even ghosts need fuel — top up to keep the hooks coming.', 'error');
      } else {
        toast(`Artwork generation failed: ${e?.message || 'Unknown error'}`, 'error');
      }
    } finally {
      setIsGeneratingArt(false);
    }
  };

  useEffect(() => { handleScroll(); }, [currentFullSong]);
  return (
    <div className="w-full max-w-3xl mx-auto animate-fade-in flex flex-col items-center px-4 md:px-6 pb-20 safe-top safe-bottom safe-x">
      <div className="w-full mb-6 flex items-center pt-4">
        <button onClick={onGoHome} className="text-slate-500 active:text-white transition-all font-bold text-sm flex items-center gap-2">
            <span>←</span> Dashboard
        </button>
      </div>

      <div className="w-full flex flex-col">
        {/* Title block */}
        <div className="mb-4">
          <span className="section-label text-cyan-400">Track — Ghost-Picked</span>
          <h2 className="heading-display text-3xl md:text-5xl font-bold text-slate-100 tracking-tight leading-none break-words mt-2">{parsed.title}</h2>
        </div>

        {/* Lamplit lyric page */}
        <div className="lyric-page rounded-[1.6rem] p-6 md:p-8 relative">
          <div
            className="font-lyric text-[16px] leading-[1.7] max-h-[46vh] overflow-y-auto pr-1"
            style={{ color: 'var(--page-ink)' }}
          >
            {parsed.lyrics.split('\n').map((line, i) => {
              const sectionMatch = line.trim().match(/^\[(.+)\]$/);
              if (sectionMatch) {
                return (
                  <div key={i} className="lyric-section-mark mt-4 mb-1 first:mt-0">{sectionMatch[1]}</div>
                );
              }
              return <div key={i}>{line || ' '}</div>;
            })}
          </div>
        </div>

        {/* Teal Suno style prompt block */}
        <div className="mt-4 rounded-2xl border border-cyan-500/25 bg-slate-800 p-4 md:p-5">
          <div className="flex items-center justify-between">
            <span className="section-label text-cyan-400">Suno Style Prompt</span>
            <button onClick={handleCopyPrompt} aria-label="Copy prompt" className="w-8 h-8 rounded-lg border border-slate-700 flex items-center justify-center text-slate-400 active:text-cyan-300 active:border-cyan-400 transition-colors">
              {copiedPrompt ? <span className="text-cyan-300 text-xs">✓</span> : <CopyIcon className="!h-3.5 !w-3.5 !mr-0" />}
            </button>
          </div>
          <textarea
            value={parsed.prompt}
            onChange={(e) => addToHistory(`Title: ${parsed.title}\n\n### SUNO Prompt\n${e.target.value}\n\n### Lyrics\n${parsed.lyrics}`)}
            className="w-full bg-transparent mt-2 text-[13px] font-mono leading-relaxed text-slate-300 outline-none resize-none"
            rows={3}
          />
        </div>

        {/* Hero action */}
        <button
          onClick={handleOpenInSuno}
          className="cta-primary w-full mt-5 py-5 rounded-2xl text-[15px] uppercase tracking-[0.1em] flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
        >
          Open in Suno <ExternalLinkIcon className="h-4 w-4" />
        </button>

        {/* Secondary icon row */}
        <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-5 gap-2">
          <button onClick={handleCopyLyrics} className="flex flex-col items-center gap-1.5 text-slate-400 active:text-cyan-300 transition-colors">
            <CopyIcon className="!h-5 !w-5 !mr-0" />
            <span className="text-[9.5px] font-bold uppercase tracking-wide">{copiedLyrics ? 'Copied' : 'Lyrics'}</span>
          </button>
          <button onClick={handleCopyPrompt} className="flex flex-col items-center gap-1.5 text-slate-400 active:text-cyan-300 transition-colors">
            <CopyIcon className="!h-5 !w-5 !mr-0" />
            <span className="text-[9.5px] font-bold uppercase tracking-wide">{copiedPrompt ? 'Copied' : 'Prompt'}</span>
          </button>
          <button
            onClick={async () => { setIsSaving(true); try { await onSave(parsed.title, parsed.prompt, parsed.lyrics, albumArt || undefined); } finally { setIsSaving(false); } }}
            className="flex flex-col items-center gap-1.5 text-slate-400 active:text-cyan-300 transition-colors"
          >
            {isSaving ? <LoadingSpinner /> : <BookmarkIcon className="h-5 w-5" />}
            <span className="text-[9.5px] font-bold uppercase tracking-wide">Save</span>
          </button>
          <button onClick={handleShare} disabled={isSharing} className="flex flex-col items-center gap-1.5 text-slate-400 active:text-cyan-300 transition-colors">
            <ShareIcon className="h-5 w-5" />
            <span className="text-[9.5px] font-bold uppercase tracking-wide">Share</span>
          </button>
          <button onClick={onStartOver} className="flex flex-col items-center gap-1.5 text-slate-400 active:text-cyan-300 transition-colors">
            <RefreshIcon className="h-5 w-5" />
            <span className="text-[9.5px] font-bold uppercase tracking-wide">Redo</span>
          </button>
        </div>

        {/* Advanced editing — collapsed by default; the quick result stands alone above. */}
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="w-full mt-8 text-center text-xs font-bold uppercase tracking-widest text-slate-500 active:text-slate-300"
        >
          {showAdvanced ? 'Hide advanced editing ↑' : 'Advanced editing (lyrics, art, translate) ↓'}
        </button>

        {showAdvanced && (
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
            <div className="lg:col-span-8 flex flex-col gap-6">
              <div className="glass-panel-strong rounded-[2rem] flex flex-col relative overflow-hidden">

                  <div className="bg-slate-900/60 px-5 md:px-8 py-4 md:py-5 border-b border-slate-800 flex justify-between items-center relative z-40 gap-3">
                      <span className="section-label">Editable Lyrics</span>
                      <div className="flex items-center gap-2">
                        <button onClick={async () => {
                            const lang = await promptDialog({ title: 'Translate lyrics', message: 'Which language should the lyrics be translated to?', placeholder: 'e.g. Spanish', initialValue: 'Spanish', confirmLabel: 'Translate' });
                            if (lang) {
                              const res = await onTranslate(parsed.lyrics, lang);
                              addToHistory(`Title: ${parsed.title}\n\n### SUNO Prompt\n${parsed.prompt}\n\n### Lyrics\n${res}`);
                            }
                        }} className="cta-secondary px-3 py-2 rounded-xl text-xs font-bold text-slate-200 transition-all flex items-center justify-center gap-1.5">
                            <TranslateIcon className="!h-4 !w-4 !mr-0" /> Translate
                        </button>
                        <button onClick={handleCopyLyrics} className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${copiedLyrics ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-300' : 'bg-slate-100 text-slate-950 border-transparent'}`}>
                            {copiedLyrics ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                  </div>

                  <div className="relative flex-grow cursor-text overflow-hidden min-h-[420px]">
                      <div
                          ref={backdropRef}
                          className="studio-text-layer studio-backdrop z-0 select-none pointer-events-none"
                          dangerouslySetInnerHTML={{ __html: renderHighlights(parsed.lyrics) }}
                      />

                      <textarea
                          ref={textareaRef}
                          value={parsed.lyrics}
                          onChange={(e) => handleManualLyricsChange(e.target.value)}
                          onScroll={handleScroll}
                          spellCheck={false}
                          autoCorrect="off"
                          autoCapitalize="off"
                          className="studio-text-layer studio-input z-20 bg-transparent text-transparent caret-amber-300 resize-none focus:outline-none"
                      />
                  </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-8">
                <div className="flex flex-col">
                    <h3 className="text-cyan-400 text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                      <MagicWandIcon /> Studio Revision
                    </h3>
                    {questionnaireItems.length > 0 && (
                      <div className="mb-6 rounded-2xl border border-slate-700 bg-slate-800 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="section-label text-cyan-300">Questionnaire Context</span>
                          <span className="text-[11px] font-bold text-cyan-200">{questionnaireItems.length} fields</span>
                        </div>
                        <div className="space-y-1.5 max-h-64 overflow-auto pr-1">
                          {questionnaireItems.map((item) => (
                            <div key={item.label} className="text-[11px]">
                              <span className="text-slate-400">{item.label}: </span>
                              <span className="text-slate-200">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <textarea
                      className="w-full bg-slate-800 border border-cyan-500/40 rounded-2xl p-5 text-sm leading-relaxed text-white placeholder:text-slate-500 focus:border-cyan-400 outline-none resize-none mb-4 transition-all"
                      rows={6}
                      placeholder="e.g. Add more ad-libs, make the chorus hit harder..."
                      value={quickEditInput}
                      onChange={(e) => setQuickEditInput(e.target.value)}
                    />
                    <button onClick={handleQuickEdit} disabled={isQuickEditing} className="w-full bg-cyan-600 active:bg-cyan-500 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest text-white transition-all flex justify-center items-center min-h-[52px]">
                        {isQuickEditing ? <LoadingSpinner /> : `Master Revision (${COSTS.EDIT_SONG} Credits)`}
                    </button>
                </div>

                <MetaTagLibrary
                  onTagClick={insertTagAtCursor}
                  onDragStart={(e, tag) => {
                    e.dataTransfer.setData('text', tag);
                  }}
                />

                <div className="bg-slate-800 border border-slate-700 p-5 md:p-6 rounded-[1.5rem]">
                    <h3 className="text-white text-xs font-bold uppercase tracking-widest mb-5 flex items-center gap-2"><ImageIcon /> Session Art</h3>
                    <div className={`${artAspect === "9:16" ? "aspect-[9/16]" : artAspect === "1:1" ? "aspect-square" : "aspect-[16/9]"} w-full bg-slate-900 rounded-2xl flex items-center justify-center text-slate-700 border border-dashed border-slate-700 mb-4 overflow-hidden relative`}>
                        {isGeneratingArt ? <LoadingSpinner /> : albumArt ? <img src={albumArt} alt="Artwork" className="w-full h-full object-cover" /> : <ImageIcon />}
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {(["9:16", "1:1", "16:9"] as const).map((ratio) => (
                        <button
                          key={ratio}
                          type="button"
                          onClick={() => setArtAspect(ratio)}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                            artAspect === ratio
                              ? "bg-cyan-500/15 border-cyan-400 text-cyan-300"
                              : "bg-slate-900/60 border-slate-700 text-slate-400"
                          }`}
                        >
                          {ratio}
                        </button>
                      ))}
                    </div>
                    <button onClick={handleGenerateArtwork} disabled={isGeneratingArt} className="cta-secondary w-full py-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all">
                        {isGeneratingArt ? 'Visualizing...' : 'Generate Art'}
                    </button>
                    {albumArt && (
                      <button onClick={handleDownloadArt} className="cta-secondary w-full mt-2 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                        <DownloadIcon className="!h-4 !w-4 !mr-0" />
                        {isNative() ? 'Save / Share Art' : 'Download Art'}
                      </button>
                    )}
                </div>
            </div>
        </div>
        )}
      </div>

      <style>{`
        .studio-text-layer {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          padding: 32px;

          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          font-size: 16px;
          font-weight: 500;
          line-height: 1.7;
          letter-spacing: normal;
          text-transform: none;

          white-space: pre-wrap;
          word-break: break-word;
          overflow: auto;
          box-sizing: border-box;
          border: none;
          outline: none;
          margin: 0;
        }

        .studio-backdrop {
          z-index: 0;
          pointer-events: none;
          color: rgba(244, 239, 231, 0.92);
        }

        .studio-input {
          z-index: 10;
          background: transparent !important;
          color: transparent !important;
        }

        .studio-structure-tag {
          display: inline-block;
          color: var(--amber-bright);
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-size: 0.85em;
        }
        .studio-vocal-cue {
          color: var(--teal);
          font-style: italic;
        }

        .studio-text-layer::-webkit-scrollbar { width: 10px; }
        .studio-text-layer::-webkit-scrollbar-track { background: transparent; }
        .studio-text-layer::-webkit-scrollbar-thumb { background: var(--bg-3); border-radius: 10px; }

        @media (max-width: 768px) {
          .studio-text-layer {
            padding: 18px;
            font-size: 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default LyricsDisplay;
