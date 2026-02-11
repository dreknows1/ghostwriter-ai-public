
import React, { useState } from 'react';

// Organized based on the "Complete guide to SUNO AI meta tags" (V5)
const CATEGORIES = {
    "Structure": [
        "[Verse]", "[Chorus]", "[Post-Chorus]", "[Bridge]", "[Pre-Chorus]", "[Intro]", "[Outro]", 
        "[Hook]", "[Interlude]", "[Break]", "[Breakdown]", "[Drop]", "[Pre-Drop]", "[Build]", 
        "[Transition]", "[Ad-Lib Section]", "[Instrumental]", "[Refrain]", "[Skit]", "[End]"
    ],
    "Sections (Styled)": [
        "[Short Instrumental Intro]", "[Long Melancholy Intro]", "[Ensemble Chorus]", 
        "[Powerful Outro]", "[Big Finish]", "[Fade to End]", "[Instrumental Bridge]",
        "[Short Accelerating Interlude]", "[Melodic Interlude]"
    ],
    "Vocals (Type)": [
        "[Male Vocal]", "[Female Vocal]", "[Duet]", "[Choir]", "[Gospel Choir]", 
        "[Vocalist: Female]", "[Vocalist: Male]", "[Layered Vocals]", "[Female Narrator]",
        "[Announcer]"
    ],
    "Vocal Styles": [
        "[Whisper]", "[Scream]", "[Falsetto]", "[Growl]", "[Rasp]", "[Melisma]", "[Staccato]",
        "[Spoken Word]", "[Rap Verse]", "[Belting]", "[Crooning]", "[Vulnerable Vocals]", 
        "[Opera Verse]", "(Backing Vocals)"
    ],
    "Instruments": [
        "[Guitar Solo]", "[Piano Solo]", "[Drum Solo]", "[Violin Solo]", "[Bass Solo]",
        "[Saxophone Solo]", "[Synth Solo]", "[Acoustic Guitar]", "[Heavy 808s]",
        "[Drum Break]", "[Violin Break]", "[Percussion Break]"
    ],
    "Instrument FX": [
        "[Soaring Lead Guitar Solo]", "[Fast and Intense Drum Solo]", "[Soft Piano Solo]", 
        "[Distorted Bass]", "[Dancing Fiddle Solo]", "[Finger Style Guitar]", "[Playful Flute Solo]"
    ],
    "Dynamics / FX": [
        "[Build Up]", "[Crescendo]", "[Fade-In]", "[Fade-Out]", "[Silence]", "[Pause]",
        "[Stop]", "[Texture: Lo-fi]", "[Texture: Gritty]",
        "[Texture: Tape-Saturated]", "[Warm Saturation]"
    ],
    "Mood & Energy": [
        "[Energy: High]", "[Energy: Low]", "[Tempo: Fast]", "[Tempo: Slow]",
        "[Mood: Intense]", "[Mood: Chill]", "[Mood: Sad]", "[Mood: Uplifting]",
        "[Mood: Joyful]", "[Mood: Melancholic]"
    ]
};

interface MetaTagLibraryProps {
    onDragStart: (e: React.DragEvent, tag: string) => void;
}

const MetaTagLibrary: React.FC<MetaTagLibraryProps> = ({ onDragStart }) => {
    const [activeCategory, setActiveCategory] = useState("Structure");

    return (
        <div className="bg-[#131722] border border-slate-800 rounded-[2rem] md:rounded-[3rem] h-[560px] md:h-[700px] flex flex-col shadow-2xl overflow-hidden">
            {/* Main Header - Fixed */}
            <div className="px-4 md:px-10 py-5 md:py-8 bg-slate-900/40 border-b border-slate-800 flex justify-between items-center shrink-0 gap-3">
                <h3 className="text-white text-sm md:text-base font-black uppercase tracking-[0.12em] md:tracking-[0.2em] flex items-center gap-3">
                   Master Tag Library
                </h3>
                <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-[0.1em] md:tracking-widest">DRAG TO EDITOR</span>
            </div>
            
            {/* Scrollable Content Pane */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* Category Navigation - Pill Style */}
                <div className="p-4 md:p-8 pb-4">
                    <div className="flex flex-wrap gap-2">
                        {Object.keys(CATEGORIES).map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                                    activeCategory === cat 
                                    ? 'bg-blue-600 text-white shadow-[0_5px_15px_rgba(37,99,235,0.4)]' 
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tags Grid Area */}
                <div className="p-4 md:p-8 pt-4">
                    <div className="flex flex-wrap gap-3 content-start pb-10">
                        {(CATEGORIES as any)[activeCategory].map((tag: string) => (
                            <div
                                key={tag}
                                draggable
                                onDragStart={(e) => onDragStart(e, tag)}
                                className={`
                                    cursor-grab active:cursor-grabbing select-none
                                    text-xs md:text-sm font-black py-3 md:py-4 px-4 md:px-6 rounded-2xl
                                    border transition-all active:scale-95 shadow-lg
                                    ${tag.startsWith('(') 
                                        ? 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-500 shadow-emerald-900/40' 
                                        : 'bg-blue-600 border-blue-500 text-white hover:bg-blue-500 shadow-blue-900/40'
                                    }
                                `}
                            >
                                {tag}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { 
                    width: 10px; 
                }
                .custom-scrollbar::-webkit-scrollbar-track { 
                    background: rgba(15, 23, 42, 0.5); 
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb { 
                    background: #1e293b; 
                    border-radius: 10px;
                    border: 2px solid #0b0f19;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #334155;
                }
            `}</style>
        </div>
    );
};

export default MetaTagLibrary;
