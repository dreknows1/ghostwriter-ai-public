
// LyricsDisplay.tsx - Optimized for precision editing and professional songwriting
import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { CopyIcon, CheckIcon, SaveIcon, MinimizeIcon, MaximizeIcon, ImageIcon, SocialIcon, TranslateIcon, LoadingSpinner, MagicWandIcon, EditIcon, DownloadIcon } from './icons';
import { SocialPack } from '../types';
import MetaTagLibrary from './MetaTagLibrary';
import { polishSong, editSong } from '../services/geminiService';
import { hasEnoughCredits, deductCredits, COSTS } from '../services/creditService';

interface LyricsDisplayProps {
  song: string;
  albumArt: string | null;
  onAlbumArtChange: (art: string) => void;
  onStartOver: () => void;
  onGoHome: () => void;
  onEdit: (instruction: string) => void;
  onSave: (title: string, prompt: string, lyrics: string, albumArt?: string, socialPack?: SocialPack) => Promise<void>;
  onResizePrompt: (currentPrompt: string, action: 'shorten' | 'lengthen') => Promise<void>;
  onGenerateArt: (title: string, prompt: string) => Promise<string>;
  onGenerateSocial: (title: string, lyrics: string) => Promise<SocialPack>;
  onTranslate: (text: string, lang: string) => Promise<string>;
  refreshCredits?: () => Promise<void>;
  isResizing: boolean;
  email: string;
}

const LyricsDisplay: React.FC<LyricsDisplayProps> = ({ 
    song, 
    albumArt,
    onAlbumArtChange,
    onStartOver, 
    onGoHome,
    onSave, 
    onGenerateArt,
    onTranslate,
    refreshCredits,
    email
}) => {
  const [history, setHistory] = useState<string[]>([song]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const currentFullSong = history[historyIndex];

  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [activeDraggingTag, setActiveDraggingTag] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [quickEditInput, setQuickEditInput] = useState('');
  const [isQuickEditing, setIsQuickEditing] = useState(false);
  const [isGeneratingArt, setIsGeneratingArt] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedLyrics, setCopiedLyrics] = useState(false);

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

  const copyToClipboard = async (text: string, setFeedback: (v: boolean) => void) => {
    await navigator.clipboard.writeText(text);
    setFeedback(true);
    setTimeout(() => setFeedback(false), 2000);
  };

  const handleDownloadArt = () => {
    if (!albumArt) return;
    const link = document.createElement('a');
    link.href = albumArt;
    link.download = `${parsed.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_art.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderHighlights = useCallback((text: string) => {
    return text
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/(\[.*?\])/g, '<span class="studio-structure-tag">$1</span>')
      .replace(/(\(.*?\))/g, '<span class="studio-vocal-cue">$1</span>')
      .replace(/\.\.\./g, '<span class="text-slate-600">...</span>') + '<br/>';
  }, []);

  const handleQuickEdit = async () => {
    if (!quickEditInput.trim()) return;
    const canAfford = await hasEnoughCredits(email, COSTS.EDIT_SONG);
    if (!canAfford) { alert("Insufficient credits for revision."); return; }
    setIsQuickEditing(true);
    try {
      const generator = editSong(currentFullSong, quickEditInput, email);
      let res = ''; for await (const chunk of generator) { res = chunk; }
      if (res) { 
          addToHistory(res); 
          setQuickEditInput(''); 
          await deductCredits(email, COSTS.EDIT_SONG);
          if (refreshCredits) await refreshCredits();
      }
    } catch (e) { console.error(e); } finally { setIsQuickEditing(false); }
  };

  const handleGenerateArtwork = async () => {
    const canAfford = await hasEnoughCredits(email, COSTS.GENERATE_ART);
    if (!canAfford) { alert("Insufficient credits for artwork."); return; }
    setIsGeneratingArt(true);
    try {
      const art = await onGenerateArt(parsed.title, parsed.prompt);
      if (art) {
        onAlbumArtChange(art);
        await deductCredits(email, COSTS.GENERATE_ART);
        if (refreshCredits) await refreshCredits();
      }
    } catch (e: any) {
      console.error("Art generation error:", e);
      alert("Artwork generation failed.");
    } finally {
      setIsGeneratingArt(false);
    }
  };

  useEffect(() => { handleScroll(); }, [currentFullSong]);

  return (
    <div className="w-full max-w-7xl animate-fade-in flex flex-col items-center px-2 md:px-4">
      <div className="w-full mb-8 flex items-center">
        <button onClick={onGoHome} className="text-slate-500 hover:text-white transition-all font-black text-sm uppercase tracking-widest flex items-center gap-2 group">
            <span className="group-hover:-translate-x-1 transition-transform">←</span> DASHBOARD
        </button>
      </div>

      <div className="w-full flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
         <div className="flex flex-col text-left w-full">
            <span className="text-sm uppercase font-black tracking-[0.4em] text-[#3B82F6] mb-3">MASTER SESSION TITLE</span>
            <h2 className="heading-display text-4xl md:text-7xl font-black text-white tracking-tighter leading-none break-words">{parsed.title}</h2>
         </div>
         <div className="flex gap-4 flex-shrink-0">
            <button onClick={async () => {
                const lang = prompt("Translate to:", "Spanish");
                if (lang) {
                  const res = await onTranslate(parsed.lyrics, lang);
                  addToHistory(`Title: ${parsed.title}\n\n### SUNO Prompt\n${parsed.prompt}\n\n### Lyrics\n${res}`);
                }
            }} className="cta-secondary hover:bg-slate-800 px-5 md:px-8 py-4 rounded-2xl text-sm font-black text-slate-200 uppercase tracking-widest transition-all flex items-center gap-2">
                <TranslateIcon /> Translate
            </button>
            <button onClick={async () => { 
                setIsSaving(true); 
                try { await onSave(parsed.title, parsed.prompt, parsed.lyrics, albumArt || undefined); } 
                finally { setIsSaving(false); } 
            }} className="cta-primary px-6 md:px-12 py-4 rounded-2xl text-sm font-black uppercase tracking-[0.12em] md:tracking-[0.2em] transition-all min-h-[56px]">
                {isSaving ? 'Saving...' : 'Save Record'}
            </button>
         </div>
      </div>

      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 flex flex-col gap-8">
            <div className={`glass-panel-strong rounded-[2rem] md:rounded-[3.5rem] flex flex-col shadow-2xl ring-1 ring-white/5 min-h-[900px] md:min-h-[1200px] relative studio-container overflow-hidden`}>
                
                <div className="bg-[#131722]/60 px-10 py-7 border-b border-slate-800 flex justify-between items-center relative z-40">
                    <span className="text-sm uppercase font-black tracking-[0.2em] text-slate-500">Master Session Lyrics</span>
                    <button onClick={() => copyToClipboard(parsed.lyrics, setCopiedLyrics)} className={`px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest border transition-all ${copiedLyrics ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-white text-black hover:bg-slate-200'}`}>
                        {copiedLyrics ? 'Copied' : 'Copy Lyrics'}
                    </button>
                </div>

                <div className="p-10 pb-6 border-b border-slate-800/50 bg-slate-900/10 relative z-40">
                   <div className="flex justify-between items-center mb-4">
                      <label className="text-sm uppercase font-black tracking-widest text-[#6366F1]">Style / SUNO Prompt</label>
                      <button onClick={() => copyToClipboard(parsed.prompt, setCopiedPrompt)} className="text-slate-500 hover:text-[#6366F1] transition-colors">
                         {copiedPrompt ? <CheckIcon /> : <CopyIcon />}
                      </button>
                   </div>
                   <textarea value={parsed.prompt} onChange={(e) => addToHistory(`Title: ${parsed.title}\n\n### SUNO Prompt\n${e.target.value}\n\n### Lyrics\n${parsed.lyrics}`)} className="w-full bg-[#131722] border border-slate-800/60 rounded-3xl p-6 text-sm font-mono text-white/70 focus:border-[#6366F1] outline-none resize-none transition-all" rows={4} />
                </div>

                <div className="relative flex-grow cursor-text overflow-hidden">
                    <div 
                        ref={backdropRef} 
                        className="studio-text-layer studio-backdrop z-0 text-white select-none pointer-events-none" 
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
                        className="studio-text-layer studio-input z-20 bg-transparent text-transparent caret-white resize-none focus:outline-none"
                    />
                </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-10">
              <div className="flex flex-col">
                  <h3 className="text-cyan-400 text-lg font-black uppercase tracking-[0.3em] mb-4 flex items-center gap-3">
                    <MagicWandIcon /> STUDIO REVISION
                  </h3>
                  <textarea 
                    className="w-full bg-slate-800/90 border-2 border-cyan-400/60 shadow-[0_0_40px_rgba(34,211,238,0.25)] rounded-[2.5rem] p-10 text-lg leading-relaxed text-white placeholder:text-slate-500 focus:border-cyan-400 outline-none resize-none mb-6 shadow-inner transition-all focus:ring-1 focus:ring-cyan-400/30"
                    rows={10}
                    placeholder="e.g. Add more ad-libs, make the chorus hit harder..."
                    value={quickEditInput}
                    onChange={(e) => setQuickEditInput(e.target.value)}
                  />
                  <button onClick={handleQuickEdit} disabled={isQuickEditing} className="w-full bg-cyan-600 hover:bg-cyan-500 py-6 rounded-[1.5rem] text-sm font-black uppercase tracking-[0.3em] text-white shadow-lg shadow-cyan-900/40 transition-all flex justify-center min-h-[64px] items-center group-hover:scale-[1.02]">
                      {isQuickEditing ? <LoadingSpinner /> : `Master Revision (${COSTS.EDIT_SONG} Credits)`}
                  </button>
              </div>

              <MetaTagLibrary onDragStart={(e, tag) => { 
                  e.dataTransfer.setData('text', tag); 
                  setActiveDraggingTag(tag);
                  setIsDragging(true);
                  const img = new Image();
                  img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                  e.dataTransfer.setDragImage(img, 0, 0);
              }} />

              <div className="bg-[#131722] border border-slate-800 p-10 rounded-[3rem] shadow-xl">
                  <h3 className="text-white text-sm font-black uppercase tracking-widest mb-8 flex items-center gap-3"><ImageIcon /> Session Art</h3>
                  <div className="w-full aspect-[9/16] bg-[#0b0f19] rounded-[2rem] flex items-center justify-center text-slate-800 border-2 border-dashed border-slate-800/40 mb-8 overflow-hidden relative">
                      {isGeneratingArt ? <LoadingSpinner /> : albumArt ? <img src={albumArt} alt="Artwork" className="w-full h-full object-cover" /> : <ImageIcon />}
                  </div>
                  <button onClick={handleGenerateArtwork} disabled={isGeneratingArt} className="w-full bg-indigo-900/10 hover:bg-indigo-900/20 py-5 rounded-[1.5rem] text-sm font-black uppercase tracking-[0.3em] text-indigo-500 border border-indigo-900/20 transition-all">
                      {isGeneratingArt ? 'Visualizing...' : 'Generate Art'}
                  </button>
              </div>
          </div>
      </div>

      <div className="py-32">
          <button onClick={onStartOver} className="bg-white text-black px-20 py-7 rounded-full font-black uppercase tracking-[0.2em] text-base hover:scale-105 transition-all shadow-2xl active:scale-95">Start New Session</button>
      </div>

      <style>{`
        .studio-text-layer {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          padding: 64px; 
          
          /* CRITICAL: Identical metrics across all layers for cursor accuracy */
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          font-size: 24px; 
          font-weight: 700;
          line-height: 1.6;
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
          color: rgba(255, 255, 255, 0.9);
        }

        .studio-input {
          z-index: 10;
          background: transparent !important;
          color: transparent !important;
        }

        /* Span decorators MUST NOT change character width/height */
        .studio-structure-tag {
          color: #818cf8; 
          background: rgba(129, 140, 248, 0.15);
          border-radius: 4px;
          padding: 0 4px;
        }
        .studio-vocal-cue {
          color: #34d399; 
          background: rgba(52, 211, 153, 0.1);
          font-style: italic;
        }

        .studio-text-layer::-webkit-scrollbar { width: 12px; }
        .studio-text-layer::-webkit-scrollbar-track { background: transparent; }
        .studio-text-layer::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default LyricsDisplay;
