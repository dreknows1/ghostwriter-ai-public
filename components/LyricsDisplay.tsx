
// LyricsDisplay.tsx - the result screen (Suno-Cream). Live-editor layout: the
// lyrics are the editable surface with a docked meta-tag bar right under them
// (tags never scroll away — Andre's #6), a copyable Suno style prompt, an
// Open-in-Suno / Udio hand-off that copies the lyrics, and a clearly-priced
// cover-art action (#4). Rudy rides in the header.
import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { CopyIcon, ImageIcon, TranslateIcon, LoadingSpinner, MagicWandIcon, DownloadIcon, ShareIcon, BookmarkIcon, RefreshIcon } from './icons';
import { SocialPack, SongInputs } from '../types';
import { editSong } from '../services/geminiService';
import { toast, promptDialog } from './Feedback';
import { hasEnoughCredits, COSTS } from '../services/creditService';
import { openInSuno, openInUdio, copyText } from '../lib/nativeBridge';
import { Rudy } from './Rudy';
import { isNative } from '../lib/platform';
import { hapticLight } from '../lib/haptics';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';

const TAG_BAR = ['[Intro]', '[Verse]', '[Pre-Chorus]', '[Chorus]', '[Post-Chorus]', '[Bridge]', '[Hook]', '[Outro]', '(yeah)', '(oh)', '(uh)', '(ad-lib)'];

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
  const [showRevision, setShowRevision] = useState(false);
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
    toast('Lyrics copied — take them to Suno.', 'success');
  };

  const handleCopyPrompt = async () => {
    await copyToClipboard(parsed.prompt, setCopiedPrompt);
    hapticLight();
    toast('Style prompt copied.', 'success');
  };

  const handleOpenInSuno = async () => {
    hapticLight();
    // Copy the lyrics (with their [Verse]/[Chorus] tags — ready for Suno's
    // lyrics box). The style prompt has its own Copy action below.
    await openInSuno(parsed.lyrics);
    toast('Lyrics copied — paste into Suno, then grab your style below.', 'success');
  };

  const handleOpenInUdio = async () => {
    hapticLight();
    await openInUdio(parsed.lyrics);
    toast('Lyrics copied — paste into Udio, then grab your style below.', 'success');
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
        toast('Copied — take it to Suno.', 'success');
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
          // /api/ai). Reconcile the UI to the true post-spend balance.
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
        // /api/ai), which also refunds a charged-then-failed generation.
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
    <div className="min-h-screen w-full font-sans" style={{ background: '#F7F3EA', color: '#1a1a1a' }}>
      <div className="w-full max-w-xl mx-auto flex flex-col px-4 pt-14 pb-24 safe-top safe-bottom safe-x">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={onGoHome} className="text-[13px] font-bold text-[#8a8272] active:text-[#1a1a1a] flex items-center gap-1">‹ Dashboard</button>
          <Rudy size={30} variant="art" />
        </div>

        {/* Title */}
        <div className="mb-3">
          <span className="text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-[#2b5be0]">Your track</span>
          <h2 className="heading-display text-[27px] font-black tracking-tight leading-[1.05] break-words mt-1">{parsed.title}</h2>
        </div>

        {/* Lyric page — editable, with the docked tag bar right under it */}
        <div className="rounded-[22px] bg-white border border-[#eadfca] shadow-[0_8px_22px_rgba(90,70,30,0.06)] overflow-hidden">
          <div className="relative cursor-text" style={{ height: '40vh', minHeight: 260 }}>
            <div
              ref={backdropRef}
              className="cream-lyr-layer cream-lyr-backdrop"
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
              className="cream-lyr-layer cream-lyr-input"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto px-3 py-2.5 border-t border-[#efe6d3] bg-[#faf6ec] hide-scrollbar">
            {TAG_BAR.map((tag) => {
              const isCue = tag.startsWith('(');
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => { insertTagAtCursor(tag); hapticLight(); }}
                  className={`whitespace-nowrap text-[12.5px] font-bold px-3 py-2 rounded-full border ${isCue ? 'bg-[#e3f5f1] text-[#1f8a76] border-[#c9ece4] italic' : 'bg-[#efe7d7] text-[#5b5346] border-[#e3d8c1]'}`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Suno style prompt */}
        <div className="mt-3 rounded-2xl bg-[#f1ece0] border border-[#e6dcc6] p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-[#2b5be0]">Suno style</span>
            <button onClick={handleCopyPrompt} className="text-[11px] font-extrabold text-[#2b5be0] active:opacity-60">{copiedPrompt ? 'Copied ✓' : 'Copy'}</button>
          </div>
          <textarea
            value={parsed.prompt}
            onChange={(e) => addToHistory(`Title: ${parsed.title}\n\n### SUNO Prompt\n${e.target.value}\n\n### Lyrics\n${parsed.lyrics}`)}
            rows={2}
            className="w-full bg-transparent mt-1.5 text-[12.5px] font-mono leading-relaxed text-[#6b6357] outline-none resize-none"
          />
        </div>

        {/* Hand-off: Suno + Udio */}
        <div className="flex gap-2.5 mt-3.5">
          <button
            onClick={handleOpenInSuno}
            className="flex-[1.4] rounded-2xl text-white text-center py-4 font-black text-[15px] active:scale-[0.99] transition-transform"
            style={{ background: 'linear-gradient(150deg,#3f78ff,#2b5be0 55%,#6a3cf0)', boxShadow: '0 12px 26px rgba(47,91,224,0.32)' }}
          >
            Open in Suno
            <span className="block text-[10px] font-bold uppercase tracking-[0.08em] opacity-85 mt-0.5">Lyrics copied</span>
          </button>
          <button onClick={handleOpenInUdio} className="flex-1 rounded-2xl bg-white border-[1.5px] border-[#d8cdb4] text-[#1a1a1a] font-extrabold text-[15px] active:bg-[#faf6ec] transition-colors">Udio</button>
        </div>

        {/* Cover art — priced */}
        <div className="mt-3.5 rounded-2xl bg-[#f1ece0] border border-[#e6dcc6] p-3">
          <div className="flex items-center gap-3">
            <div className={`${artAspect === '9:16' ? 'aspect-[9/16] w-12' : artAspect === '1:1' ? 'aspect-square w-14' : 'aspect-[16/9] w-16'} rounded-xl bg-[#e2d8c4] flex items-center justify-center text-[#a99e86] overflow-hidden shrink-0`}>
              {isGeneratingArt ? <LoadingSpinner className="h-5 w-5 text-[#1a1a1a]" /> : albumArt ? <img src={albumArt} alt="Cover" className="w-full h-full object-cover" /> : <ImageIcon />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-extrabold">Cover art</div>
              <div className="text-[12px] text-[#8a8272]">Generate a matching cover</div>
            </div>
            <button onClick={handleGenerateArtwork} disabled={isGeneratingArt} className="bg-[#1a1a1a] text-white font-extrabold text-[12px] px-3.5 py-2.5 rounded-xl whitespace-nowrap disabled:opacity-60">
              {isGeneratingArt ? 'Generating…' : <>Generate · <b className="text-[#8fb0ff]">{COSTS.GENERATE_ART} cr</b></>}
            </button>
          </div>
          <div className="flex gap-2 mt-3">
            {(['9:16', '1:1', '16:9'] as const).map((ratio) => (
              <button
                key={ratio}
                type="button"
                onClick={() => setArtAspect(ratio)}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border ${artAspect === ratio ? 'bg-[#e7edff] border-[#2b5be0] text-[#2b5be0]' : 'bg-white border-[#e3d8c1] text-[#8a8272]'}`}
              >
                {ratio}
              </button>
            ))}
          </div>
          {albumArt && (
            <button onClick={handleDownloadArt} className="w-full mt-2 py-2.5 rounded-xl bg-white border border-[#e3d8c1] text-[#5b5346] text-[12px] font-bold flex items-center justify-center gap-2">
              <DownloadIcon className="!h-4 !w-4 !mr-0" /> {isNative() ? 'Save / Share art' : 'Download art'}
            </button>
          )}
        </div>

        {/* Action row */}
        <div className="flex justify-between mt-3.5 pt-3 border-t border-[#e7ddc9]">
          <button onClick={handleCopyLyrics} className="flex flex-col items-center gap-1 text-[#8a8272] active:text-[#2b5be0] transition-colors">
            <CopyIcon className="!h-5 !w-5 !mr-0" /><span className="text-[9.5px] font-extrabold uppercase tracking-wide">{copiedLyrics ? 'Copied' : 'Lyrics'}</span>
          </button>
          <button onClick={() => setShowRevision(v => !v)} className="flex flex-col items-center gap-1 text-[#8a8272] active:text-[#2b5be0] transition-colors">
            <MagicWandIcon /><span className="text-[9.5px] font-extrabold uppercase tracking-wide">Revise</span>
          </button>
          <button onClick={async () => { setIsSaving(true); try { await onSave(parsed.title, parsed.prompt, parsed.lyrics, albumArt || undefined); } finally { setIsSaving(false); } }} className="flex flex-col items-center gap-1 text-[#8a8272] active:text-[#2b5be0] transition-colors">
            {isSaving ? <LoadingSpinner className="h-5 w-5 text-[#2b5be0]" /> : <BookmarkIcon className="h-5 w-5" />}<span className="text-[9.5px] font-extrabold uppercase tracking-wide">Save</span>
          </button>
          <button onClick={handleShare} disabled={isSharing} className="flex flex-col items-center gap-1 text-[#8a8272] active:text-[#2b5be0] transition-colors">
            <ShareIcon className="h-5 w-5" /><span className="text-[9.5px] font-extrabold uppercase tracking-wide">Share</span>
          </button>
          <button onClick={onStartOver} className="flex flex-col items-center gap-1 text-[#8a8272] active:text-[#2b5be0] transition-colors">
            <RefreshIcon className="h-5 w-5" /><span className="text-[9.5px] font-extrabold uppercase tracking-wide">Redo</span>
          </button>
        </div>

        {/* Master revision — reveal on demand */}
        {showRevision && (
          <div className="mt-4 rounded-2xl bg-[#f1ece0] border border-[#e6dcc6] p-4 animate-fade-in">
            <div className="flex items-center gap-2 mb-3">
              <MagicWandIcon /><span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#2b5be0]">Master revision</span>
            </div>
            <textarea
              className="w-full bg-white border border-[#e3d8c1] rounded-xl p-3.5 text-[13.5px] leading-relaxed text-[#1a1a1a] placeholder:text-[#a99e86] outline-none resize-none focus:border-[#2b5be0]"
              rows={3}
              placeholder="e.g. Add more ad-libs, make the chorus hit harder…"
              value={quickEditInput}
              onChange={(e) => setQuickEditInput(e.target.value)}
            />
            <div className="flex gap-2 mt-2.5">
              <button
                onClick={async () => {
                  const lang = await promptDialog({ title: 'Translate lyrics', message: 'Which language should the lyrics be translated to?', placeholder: 'e.g. Spanish', initialValue: 'Spanish', confirmLabel: 'Translate' });
                  if (lang) { const res = await onTranslate(parsed.lyrics, lang); addToHistory(`Title: ${parsed.title}\n\n### SUNO Prompt\n${parsed.prompt}\n\n### Lyrics\n${res}`); }
                }}
                className="px-3.5 py-3 rounded-xl bg-white border border-[#e3d8c1] text-[#5b5346] text-[12px] font-bold flex items-center gap-1.5"
              >
                <TranslateIcon className="!h-4 !w-4 !mr-0" /> Translate
              </button>
              <button onClick={handleQuickEdit} disabled={isQuickEditing} className="flex-1 py-3 rounded-xl bg-[#1a1a1a] text-white text-[12px] font-extrabold uppercase tracking-wide flex justify-center items-center disabled:opacity-60">
                {isQuickEditing ? <LoadingSpinner /> : <>Master Revision · <b className="text-[#8fb0ff] ml-1">{COSTS.EDIT_SONG} cr</b></>}
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .cream-lyr-layer{ position:absolute; inset:0; width:100%; height:100%; padding:20px 20px 16px;
          font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
          font-size:15px; font-weight:500; line-height:1.75; letter-spacing:normal;
          white-space:pre-wrap; word-break:break-word; overflow:auto; box-sizing:border-box; border:none; outline:none; margin:0; }
        .cream-lyr-backdrop{ z-index:0; pointer-events:none; color:#2a2620; }
        .cream-lyr-input{ z-index:10; background:transparent !important; color:transparent !important; caret-color:#2b5be0; resize:none; }
        .cream-lyr-backdrop .studio-structure-tag{ display:inline-block; background:#e7edff; color:#2b5be0; font-weight:800; letter-spacing:.04em; text-transform:uppercase; font-size:.78em; padding:1px 8px; border-radius:6px; }
        .cream-lyr-backdrop .studio-vocal-cue{ color:#2ba18c; font-style:italic; }
        .cream-lyr-backdrop .text-page-ink-soft{ color:#b3a892; }
        .cream-lyr-layer::-webkit-scrollbar{ width:8px; } .cream-lyr-layer::-webkit-scrollbar-thumb{ background:#e2d8c4; border-radius:8px; }
        .hide-scrollbar::-webkit-scrollbar{ display:none; } .hide-scrollbar{ -ms-overflow-style:none; scrollbar-width:none; }
      `}</style>
    </div>
  );
};

export default LyricsDisplay;
