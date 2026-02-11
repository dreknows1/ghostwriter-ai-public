
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppStep, AppView, SongInputs, SavedSong, UserProfile } from './types';
import { generateSong, generateAlbumArt, generateSocialPack, translateLyrics, editSong, generateDynamicOptions, structureImportedSong } from './services/geminiService';
import { saveSong } from './services/songService';
import { getUserProfile } from './services/userService';
import { getSession, signOut, signIn, signUp } from './services/authService';
import { getUserCredits, hasEnoughCredits, deductCredits, COSTS } from './services/creditService';
import LyricsDisplay from './components/LyricsDisplay';
import ProfileView from './components/ProfileView';
import PricingView from './components/PricingView';
import TermsAndPrivacy from './components/TermsAndPrivacy';
import { Logo } from './components/Logo';
import { LoadingSpinner, ProfileIcon, WalletIcon, CheckIcon, MagicWandIcon, EditIcon, ClockIcon } from './components/icons';
import {
  LANGUAGES,
  GENRES_BY_LANG,
  SUBGENRES,
  getBaseCulture,
  getBaseEnv
} from './lib/culturalLogic';

const STEP_ORDER = [
  AppStep.AWAITING_LANGUAGE,
  AppStep.AWAITING_GENRE,
  AppStep.AWAITING_SUBGENRE,
  AppStep.AWAITING_INSTRUMENTATION,
  AppStep.AWAITING_AUDIO_ENV,
  AppStep.AWAITING_SCENE,
  AppStep.AWAITING_EMOTION,
  AppStep.AWAITING_VOCALS,
  AppStep.AWAITING_DUET_CONFIG,
  AppStep.AWAITING_PERFORMER,
  AppStep.AWAITING_SPECIFICS,
  AppStep.AWAITING_ADDITIONAL_INFO
];

// --- CULTURAL LOGIC DATA ---

const INSTRUMENTS_BY_GENRE: Record<string, string[]> = {
  'Regional Mexican': ['Guitarrón', 'Trumpets', 'Accordion', 'Bajo Sexto', 'Tuba', 'Vihuela', 'Violin'],
  'Chinese': ['Guzheng', 'Erhu', 'Pipa', 'Dizi Flute', 'Traditional Bells', 'Modern Sub-Bass', 'Sheng', 'Yangqin'],
  'Swahili': ['Marimba', 'Zeze', 'Talking Drums', 'Electric Bass', 'Synthesizer Lead', 'Percussion Loops', 'Mbira', 'Kanun'],
  'Arabic': ['Oud', 'Darbuka', 'Qanun', 'Ney Flute', 'Riqq', 'Violin Ensemble', 'Quarter-tone Synth', 'Bendir'],
  'Italian': ['Mandolin', 'Orchestral Strings', 'Operatic Piano', 'Vintage Synths', 'Accordion', 'Classical Guitar'],
  'Trot': ['Haegeum', 'Gayageum', 'Accordion', 'Synthesizer', 'Brass Section', 'Trot Beats'],
  'Japanese': ['Koto', 'Shamisen', 'Taiko Drums', 'DX7 Keys', 'Electric Guitar (High Gain)', 'Shakuhachi Flute', 'Hichiriki', 'Virtual Synths'],
  'French': ['Accordion', 'Rhodes Piano', 'Saxophone', '808s', 'Upright Bass', 'Synthesizers', 'Nylon Guitar', 'Cora (West Africa)'],
  'Spanish': ['Requinto Guitar', 'Bongo & Güira', 'Classical Guitar', 'Accordion', 'Cajón', 'Castanets', 'Piano Montuno'],
  'Hindi': ['Tabla', 'Sitar', 'Harmonium', 'Dholak', 'Sarangi', 'Bansuri Flute', 'Modern Beats', 'Santoor'],
  'Pop': ['Synth Lead', 'Clean Electric Guitar', 'Acoustic Piano', '808 Sub-Bass', 'Electronic Drums', 'Vocoder'],
  'Hip-Hop': ['MPC Samples', 'Thick Sub-Bass', 'Crisp Snare', 'DJ Scratches', 'Synthesizer Bass', 'Electric Keys'],
  'Metal': ['Electric Guitar (High Gain)', 'Double Kick Drum', 'Bass Guitar (Distorted)', 'Vocals (Aggressive)', 'Synthesizers'],
  'Rock': ['Electric Guitar', 'Bass Guitar', 'Drum Kit', 'Acoustic Guitar', 'Piano', 'Hammond Organ'],
  'Electronic/EDM': ['Synthesizers', 'Drum Machines', 'Sequencers', 'Samplers', 'Vocoder', 'Sub-Bass'],
  'Country': ['Acoustic Guitar', 'Steel Guitar', 'Fiddle', 'Banjo', 'Mandolin', 'Upright Bass'],
  'R&B': ['Electric Piano', 'Synthesizers', 'Drum Machine', 'Bass Guitar', 'Saxophone', 'Fingersnaps'],
  'Soul': ['Brass Section', 'String Section', 'Electric Bass', 'Piano', 'Drums', 'Rhodes'],
  'Blues': ['Acoustic Guitar', 'Electric Guitar', 'Harmonica', 'Upright Bass', 'Drums', 'Piano'],
  'Jazz': ['Saxophone', 'Trumpet', 'Double Bass', 'Piano', 'Drums (Brushes)', 'Vibraphone'],
  'Folk': ['Acoustic Guitar', 'Banjo', 'Fiddle', 'Harmonica', 'Upright Bass', 'Mandolin'],
  'Gospel': ['Hammond Organ', 'Piano', 'Choir Vocals', 'Drums', 'Bass Guitar', 'Tambourine'],
  'Afrobeats': ['Talking Drum', 'Kalimba', 'Shekere', 'Synth Bass', 'Electric Guitar', 'Log Drum', 'Saxophone'],
  'Reggae': ['Bass Guitar', 'Electric Guitar (Skank)', 'Hammond Organ', 'Drums (One Drop)', 'Bongos', 'Melodica', 'Brass Section'],
  'General': ['Piano', 'Acoustic Guitar', 'Drums', 'Strings', 'Synthesizer', 'Electric Guitar']
};

const SCENES_BY_GENRE: Record<string, string[]> = {
  'Regional Mexican': ['Jalisco Agave Fields', 'Traditional Mexican Plaza', 'Rancho Fiesta', 'Border Cantina', 'Zócalo Celebration'],
  'Enka': ['Kyoto Temple Garden', 'Shinto Shrine', 'Traditional Tea House', 'Mountain Onsen', 'Fishing Village'],
  'Portuguese': ['Coimbra Fado House', 'Lisbon Alfama', 'Rio Carnival', 'Ipanema Beach', 'Douro Valley Vineyard'],
  'Zouk': ['Martinique Cafe', 'Caribbean Beach', 'Antilles Nightclub', 'Guadeloupe Sunset'],
  'Afro-Trap': ['Abidjan Market', 'Parisian Banlieue', 'West African Block Party', 'Lagos Street Night'],
  'Swahili': ['Dar es Salaam Waterfront', 'Zanzibar Stone Town', 'Nairobi Skyline', 'Mount Kilimanjaro View', 'Mombasa Beach Party', 'Serengeti Sunset'],
  'Chinese': ['Shanghai Bund Night', 'Forbidden City Courtyard', 'Chengdu Tea House', 'Cyberpunk Chongqing', 'Bamboo Forest', 'Ancient Jiangnan Town'],
  'Japanese': ['Shibuya Crossing', 'Kyoto Temple Garden', 'Shinjuku Golden Gai', 'Harajuku Pink Cafe', 'Snowy Hokkaido Lodge'],
  'Spanish': ['Old San Juan Street', 'Medellín Night Club', 'Miami Beach Drive', 'Andalucian Courtyard', 'Mexico City Night'],
  'French': ['Montmartre Rainy Cafe', 'Paris Underground Club', 'Côte d’Azur Sunset', 'Lyon Jazz Bar'],
  'Italian': ['Venice Canals', 'Rome Colosseum Night', 'Naples Coastal View', 'Milan Fashion District', 'Sicilian Lemon Grove'],
  'Arabic': ['Dubai Skyline Rooftop', 'Cairo Old Market (Khan el-Khalili)', 'Beirut Mediterranean Coast', 'Sahara Desert Camp', 'Casablanca Courtyard'],
  'Hindi': ['Mumbai Monsoon Street', 'Himalayan Foothills', 'Jaipur Palace', 'Varanasi Ghats', 'Bollywood Soundstage'],
  'Pop': ['Modern Studio', 'Stadium Stage', 'Music Video Set', 'High-End Penthouse', 'Fashion Runway', 'Hollywood Hills'],
  'Hip-Hop': ['Underground Club', 'New York Rooftop', 'Recording Studio (Booth)', 'Luxury Car Interior', 'Graffiti Alley', 'Project Courtyard'],
  'Rock': ['Garage Session', 'Music Festival Mainstage', 'Grungy Dive Bar', 'Desert Road Trip', 'Warehouse Rehearsal'],
  'Country': ['Nashville Honky Tonk', 'Back Porch at Sunset', 'Empty Wheat Field', 'Small Town Diner', 'Pickup Truck Tailgate'],
  'Electronic/EDM': ['Laser-Lit Rave', 'Neon-Drenched Penthouse', 'Techno Bunker', 'Pool Party', 'Outer Space Station'],
  'R&B': ['Rainy City Penthouse', 'Intimate Jazz Lounge', 'Lush Garden at Night', 'Private Candlelit Studio'],
  'Afrobeats': ['Lagos Beach Party', 'Vibrant Street Market', 'Tropical Island Resort', 'Gold-Drenched Mansion'],
  'Reggae': ['Jamaican Beach Shack', 'Misty Mountain Top', 'Sound System Lawn', 'Kingston Street Corner'],
  'Metal': ['Industrial Forge', 'Dungeon Hall', 'Stormy Moor', 'Pyrotechnic Stage'],
  'Jazz': ['Smoky Underground Club', 'New Orleans Street Corner', 'Upscale Lounge', 'Outdoor Jazz Festival', 'Late Night Piano Bar'],
  'Folk': ['Campfire in Woods', 'Rustic Cabin Porch', 'Open Prairie', 'Coffee Shop Stage', 'Mountain Trail'],
  'Gospel': ['Historic Church Hall', 'Sunday Morning Service', 'Revival Tent', 'Community Center', 'Cathedral Sanctuary'],
  'General': ['Recording Studio', 'Live Concert Stage', 'Intimate Bedroom Studio', 'Cinematic Landscape']
};

const AUDIO_ENV_BY_GENRE: Record<string, string[]> = {
  'Traditional': ['Natural Reverb', 'Outdoor Space', 'Vintage Tape', 'Acoustic Room', 'Temple Hall', 'Palace Courtyard'],
  'Urban': ['Studio (Heavy Sub)', 'Club PA System', 'Street Recording', 'Radio Edit', 'Warehouse Reverb', 'Ghetto PA System'],
  'Pop': ['Modern Polished Studio', 'Radio Ready', 'Stadium Echo', 'Bedroom Demo', 'Vocal Booth'],
  'General': ['Studio (Clean)', 'Live Performance', 'Lo-Fi Tape', 'Acoustic Hall', 'Vintage Vinyl', 'Radio Edit']
};

const EMOTIONS_BY_GENRE: Record<string, string[]> = {
  'Latin': ['Passionate', 'Heartbroken (Amargura)', 'Festive', 'Sensual', 'Nostalgic', 'Resilient'],
  'Asian': ['Poetic', 'Yearning', 'Joyful', 'Melancholic', 'Zen-like', 'Honor-bound'],
  'African': ['Joyful', 'Resilient', 'Spiritual', 'Celebratory', 'Vibrant', 'Ancestral Pride'],
  'European': ['Sophisticated', 'Romantic', 'Melancholic', 'Euphoric', 'Angst-ridden', 'Ironical'],
  'General': ['Euphoric', 'Melancholic', 'Aggressive', 'Hopeful', 'Heartbroken', 'Chilled', 'Nostalgic', 'Romantic', 'Empowered', 'Anxious']
};

const DEFAULT_INPUTS: SongInputs = {
  language: 'English',
  genre: '',
  subGenre: '',
  audioEnv: 'Studio (Clean)',
  emotion: 'Euphoric',
  vocals: 'Female Solo',
  performerType: 'Solo Artist',
  referenceArtist: '',
  mundaneObjects: '',
  awkwardMoment: '',
  additionalInfo: ''
};

const CreationWizard: React.FC<{
  step: AppStep;
  inputs: SongInputs;
  dynamicOptions: string[];
  isLoadingOptions: boolean;
  onUpdate: (key: keyof SongInputs, val: string) => void;
  onNext: (customVal?: string) => void;
  onPrev: () => void;
  onGenerate: () => void;
}> = ({ step, inputs, dynamicOptions, isLoadingOptions, onUpdate, onNext, onPrev, onGenerate }) => {
  const [isOther, setIsOther] = useState(false);
  const [otherText, setOtherText] = useState('');

  useEffect(() => { setIsOther(false); setOtherText(''); }, [step]);

  const handleOtherSubmit = (field: keyof SongInputs) => {
    if (otherText.trim()) { 
      onUpdate(field, otherText.trim()); 
      onNext(otherText.trim()); 
    }
  };

  const getOptionsForStep = () => {
    // If we have AI generated dynamic options, prioritize them
    if (dynamicOptions && dynamicOptions.length > 0) return dynamicOptions;

    const lang = (inputs.language || 'English') as keyof typeof GENRES_BY_LANG;
    const genre = inputs.genre || 'General';
    
    const baseCulture = getBaseCulture(lang);
    const baseEnv = getBaseEnv(genre);

    switch (step) {
      case AppStep.AWAITING_LANGUAGE: return LANGUAGES;
      case AppStep.AWAITING_GENRE: return GENRES_BY_LANG[lang] || GENRES_BY_LANG.English;
      case AppStep.AWAITING_SUBGENRE: return SUBGENRES[genre] || ['Alternative', 'Mainstream', 'Underground', 'Experimental', 'Classic', 'Modern', 'Fusion'];
      case AppStep.AWAITING_INSTRUMENTATION: return INSTRUMENTS_BY_GENRE[genre] || INSTRUMENTS_BY_GENRE[lang] || INSTRUMENTS_BY_GENRE['General'];
      case AppStep.AWAITING_AUDIO_ENV: return AUDIO_ENV_BY_GENRE[baseEnv] || AUDIO_ENV_BY_GENRE['General'];
      case AppStep.AWAITING_SCENE: return SCENES_BY_GENRE[genre] || SCENES_BY_GENRE[lang] || SCENES_BY_GENRE['Pop'] || SCENES_BY_GENRE['General'];
      case AppStep.AWAITING_EMOTION: return EMOTIONS_BY_GENRE[baseCulture] || EMOTIONS_BY_GENRE['General'];
      case AppStep.AWAITING_VOCALS: return ['Female Solo', 'Male Solo', 'Duo/Group', 'Duet (Mixed)', 'Whisper', 'Soulful', 'Choir', 'Auto-Tuned', 'Spoken Word', 'Screaming', 'Growling'];
      case AppStep.AWAITING_DUET_CONFIG: return ['Male & Female', 'Female Duo', 'Male Duo', 'Artist & AI Feature', 'Rapper & Singer', 'Choir & Lead', 'Call & Response', 'Harmonized'];
      case AppStep.AWAITING_PERFORMER: return ['Solo Artist', 'Featured Collaboration', 'Indie Band', 'Underground Artist', 'Supergroup', 'Orchestral Ensemble', 'Acoustic Trio', 'Vocal Harmony Group', 'DJ/Producer'];
      default: return [];
    }
  };

  const renderOptions = (field: keyof SongInputs) => {
    const options = getOptionsForStep();
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8">
        {isLoadingOptions ? (
          <div className="col-span-full py-12 flex flex-col items-center gap-4 animate-pulse">
            <LoadingSpinner />
            <span className="text-slate-500 font-black uppercase tracking-[0.14em] md:tracking-[0.3em] text-xs text-center">Researching cultural parameters...</span>
          </div>
        ) : (
          <>
            {options.map((opt: string) => (
              <button
                key={opt}
                onClick={() => { onUpdate(field, opt); onNext(); }}
                className={`w-full p-4 sm:p-5 lg:p-6 rounded-3xl border transition-all text-sm sm:text-base leading-tight font-black uppercase tracking-[0.08em] sm:tracking-widest min-h-[56px] flex items-center justify-center text-center break-words ${
                  inputs[field] === opt 
                  ? 'bg-blue-600 border-blue-400 text-white shadow-lg z-10' 
                  : 'bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600 hover:border-slate-500 hover:text-white'
                }`}
              >
                {opt}
              </button>
            ))}
            {!isOther ? (
              <button onClick={() => setIsOther(true)} className="w-full p-4 sm:p-5 lg:p-6 rounded-3xl border bg-slate-800 border-slate-700 text-cyan-400 hover:bg-slate-700 hover:border-cyan-400 hover:text-white transition-all text-sm sm:text-base leading-tight font-black uppercase tracking-[0.08em] sm:tracking-widest min-h-[56px] flex items-center justify-center">CUSTOM</button>
            ) : (
              <div className="col-span-full flex flex-col sm:flex-row gap-4 animate-fade-in">
                <input autoFocus type="text" placeholder={`Enter custom ${field}...`} className="flex-grow bg-slate-800 border border-cyan-500/50 p-4 md:p-6 rounded-3xl text-white outline-none text-base font-black uppercase tracking-wide md:tracking-widest" value={otherText} onChange={(e) => setOtherText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleOtherSubmit(field)} />
                <div className="flex gap-2">
                  <button onClick={() => handleOtherSubmit(field)} className="flex-grow sm:flex-none px-6 md:px-10 bg-cyan-600 rounded-3xl text-sm font-black uppercase tracking-wide md:tracking-widest text-white py-4">Confirm</button>
                  <button onClick={() => setIsOther(false)} className="flex-grow sm:flex-none px-6 md:px-10 bg-slate-800 rounded-3xl text-sm font-black uppercase tracking-wide md:tracking-widest text-slate-500 py-4">Cancel</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const stepTitle = useMemo(() => {
    switch(step) {
      case AppStep.AWAITING_LANGUAGE: return "Language Basis";
      case AppStep.AWAITING_GENRE: return "Cultural Genre";
      case AppStep.AWAITING_SUBGENRE: return "Subgenre Style";
      case AppStep.AWAITING_INSTRUMENTATION: return "Core Instrumentation";
      case AppStep.AWAITING_AUDIO_ENV: return "Sonic Space";
      case AppStep.AWAITING_SCENE: return "The Visual Scene";
      case AppStep.AWAITING_EMOTION: return "Lyrical Frequency";
      case AppStep.AWAITING_VOCALS: return "Vocal Texture";
      case AppStep.AWAITING_DUET_CONFIG: return "Collaboration Pairing";
      case AppStep.AWAITING_PERFORMER: return "Artist Persona";
      default: return "Studio Configuration";
    }
  }, [step]);

  return (
    <div className="max-w-6xl mx-auto py-6 md:py-12 px-3 sm:px-4 animate-fade-in overflow-x-hidden">
      <div className="flex justify-between items-center mb-8 md:mb-16 gap-2">
        <button onClick={onPrev} className="text-slate-500 hover:text-white text-xs sm:text-sm font-black uppercase tracking-[0.08em] sm:tracking-widest flex items-center gap-2">← Back</button>
        <div className="flex flex-col items-center gap-2">
            <div className="flex gap-2">
            {STEP_ORDER.filter(s => {
                if (s === AppStep.AWAITING_DUET_CONFIG && (inputs.vocals !== 'Duo/Group' && inputs.vocals !== 'Duet (Mixed)')) return false;
                return true;
            }).map((s, i) => (
                <div key={i} className={`h-1.5 w-5 sm:w-8 rounded-full transition-all duration-500 ${STEP_ORDER.indexOf(step) >= STEP_ORDER.indexOf(s) ? 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]' : 'bg-slate-800'}`}></div>
            ))}
            </div>
            <span className="text-[10px] md:text-xs font-black text-slate-600 uppercase tracking-wide md:tracking-widest text-center">Studio Progress: {Math.round((STEP_ORDER.indexOf(step) / STEP_ORDER.length) * 100)}%</span>
        </div>
        <div className="w-6 sm:w-10 md:w-20"></div>
      </div>

      <div className="text-center">
        <h2 className="text-[2.2rem] sm:text-5xl md:text-7xl leading-[0.95] font-black text-white mb-3 sm:mb-4 tracking-tight break-words">{stepTitle}</h2>
        <p className="text-slate-500 font-black uppercase tracking-[0.08em] sm:tracking-[0.12em] md:tracking-[0.4em] text-[10px] sm:text-xs md:text-sm mb-6 sm:mb-8 md:mb-12 break-words px-1">Building authenticity for the {inputs.genre || 'Universal'} session</p>
        
        {step === AppStep.AWAITING_LANGUAGE && renderOptions('language')}
        {step === AppStep.AWAITING_GENRE && renderOptions('genre')}
        {step === AppStep.AWAITING_SUBGENRE && renderOptions('subGenre')}
        {step === AppStep.AWAITING_INSTRUMENTATION && renderOptions('instrumentation')}
        {step === AppStep.AWAITING_AUDIO_ENV && renderOptions('audioEnv')}
        {step === AppStep.AWAITING_SCENE && renderOptions('scene')}
        {step === AppStep.AWAITING_EMOTION && renderOptions('emotion')}
        {step === AppStep.AWAITING_VOCALS && renderOptions('vocals')}
        {step === AppStep.AWAITING_DUET_CONFIG && renderOptions('duetType')}
        {step === AppStep.AWAITING_PERFORMER && renderOptions('performerType')}

        {step === AppStep.AWAITING_SPECIFICS && (
          <div className="text-center space-y-6 max-w-2xl mx-auto mt-12">
            <input type="text" placeholder="Reference Artist (e.g. Bad Bunny, Utada Hikaru)" className="w-full bg-slate-800 border border-slate-700 p-8 rounded-[2rem] text-white outline-none focus:border-blue-500 text-lg transition-all" value={inputs.referenceArtist || ''} onChange={(e) => onUpdate('referenceArtist', e.target.value)} />
            <input type="text" placeholder="Mundane Objects (e.g. cold coffee, cracked phone)" className="w-full bg-slate-800 border border-slate-700 p-8 rounded-[2rem] text-white outline-none focus:border-blue-500 text-lg transition-all" value={inputs.mundaneObjects || ''} onChange={(e) => onUpdate('mundaneObjects', e.target.value)} />
            <button onClick={() => onNext()} className="w-full bg-blue-600 py-6 md:py-8 rounded-[2rem] text-sm md:text-base font-black uppercase tracking-[0.16em] md:tracking-[0.4em] text-white hover:bg-blue-500 transition-all">Next Module</button>
          </div>
        )}

        {step === AppStep.AWAITING_ADDITIONAL_INFO && (
          <div className="text-center space-y-6 max-w-2xl mx-auto mt-12">
            <textarea autoFocus placeholder="e.g. A conversation at a train station in the rain..." className="w-full bg-slate-800 border border-slate-700 p-8 rounded-[2rem] text-white outline-none focus:border-blue-500 min-h-[250px] text-lg leading-relaxed" value={inputs.awkwardMoment || ''} onChange={(e) => onUpdate('awkwardMoment', e.target.value)} />
            <button onClick={onGenerate} className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 py-6 md:py-8 rounded-[2rem] text-base md:text-xl font-black uppercase tracking-[0.16em] md:tracking-[0.5em] text-white shadow-xl transition-all hover:scale-[1.02]">MASTER THE RECORD</button>
            <p className="text-sm text-slate-500 uppercase tracking-widest mt-4">COST: {COSTS.GENERATE_SONG} CREDITS</p>
          </div>
        )}
      </div>

      <div className="mt-20 flex flex-wrap justify-center gap-4">
          <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-full text-xs font-black uppercase tracking-widest text-slate-500">DNA: {inputs.language || '???'}</div>
          {inputs.genre && <div className="px-4 py-2 bg-blue-900/20 border border-blue-500/30 rounded-full text-xs font-black uppercase tracking-widest text-blue-400">GENRE: {inputs.genre}</div>}
          {inputs.instrumentation && <div className="px-4 py-2 bg-cyan-900/20 border border-cyan-500/30 rounded-full text-xs font-black uppercase tracking-widest text-cyan-400">CORE: {inputs.instrumentation}</div>}
      </div>
    </div>
  );
}

export const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [view, setView] = useState<AppView>(AppView.AUTH);
  const [step, setStep] = useState<AppStep>(AppStep.AWAITING_LANGUAGE);
  const [inputs, setInputs] = useState<SongInputs>(DEFAULT_INPUTS);
  const [dynamicOptions, setDynamicOptions] = useState<string[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [generatedSong, setGeneratedSong] = useState('');
  const [albumArt, setAlbumArt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [loadedSongId, setLoadedSongId] = useState<string | null>(null);
  const [credits, setCredits] = useState<number>(0);
  
  // Paste / Import State
  const [isPasteMode, setIsPasteMode] = useState(false);
  const [pasteContent, setPasteContent] = useState('');

  const loadCredits = async () => {
     if (session?.user?.email) {
         const c = await getUserCredits(session.user.email || '');
         setCredits(c);
     }
  };

  useEffect(() => {
    getSession().then((sess) => {
      setSession(sess);
      if (sess) {
        setView(AppView.LANDING); // Default to Landing Dashboard
        getUserCredits(sess.user.email || '').then(c => setCredits(c));

        if (window.location.search.includes('status=success')) {
           // Public-safe flow: credits should be granted by server webhook only.
           // We only refresh balances on return.
           getUserCredits(sess.user.email || '').then(c => setCredits(c));
           alert('Payment received. Your credits will update once confirmation completes.');
           window.history.replaceState({}, '', '/');
        }
      } else {
        setView(AppView.AUTH);
      }
    });
  }, []);

  const handleUpdate = (key: keyof SongInputs, val: string) => {
    setInputs(prev => ({ ...prev, [key]: val }));
  };

  const handleNext = (customVal?: string) => {
    // Check if we need to skip DUET config
    const currentIdx = STEP_ORDER.indexOf(step);
    if (currentIdx === -1) return;

    let nextStep = STEP_ORDER[currentIdx + 1];
    
    // Logic to skip DUET if not a duo/group/duet
    if (step === AppStep.AWAITING_VOCALS) {
        const vocalVal = customVal || inputs.vocals;
        const isDuet = vocalVal?.includes('Duet') || vocalVal?.includes('Duo') || vocalVal?.includes('Group');
        if (!isDuet) {
             // Skip AWAITING_DUET_CONFIG
             const duetIdx = STEP_ORDER.indexOf(AppStep.AWAITING_DUET_CONFIG);
             if (currentIdx + 1 === duetIdx) {
                 nextStep = STEP_ORDER[duetIdx + 1];
             }
        }
    }

    if (nextStep) setStep(nextStep);
  };

  const handlePrev = () => {
    const currentIdx = STEP_ORDER.indexOf(step);
    if (currentIdx > 0) {
        let prevStep = STEP_ORDER[currentIdx - 1];
        // Logic to skip DUET if coming back
        if (prevStep === AppStep.AWAITING_DUET_CONFIG) {
            const isDuet = inputs.vocals?.includes('Duet') || inputs.vocals?.includes('Duo') || inputs.vocals?.includes('Group');
            if (!isDuet) {
                 prevStep = STEP_ORDER[currentIdx - 2];
            }
        }
        setStep(prevStep);
    } else {
        // If at start of wizard, return to Dashboard
        setView(AppView.LANDING);
    }
  };

  const handleGenerate = async () => {
      if (!session) return;
      const canAfford = await hasEnoughCredits(session.user.email || '', COSTS.GENERATE_SONG);
      if (!canAfford) {
          setView(AppView.PRICING);
          return;
      }

      // Immediate UI reduction for better UX
      setCredits(prev => Math.max(0, prev - COSTS.GENERATE_SONG));

      setIsLoading(true);
      setLoadingMessage("Ghostwriter is listening...");
      setStep(AppStep.GENERATING);

      try {
          const profile = await getUserProfile(session.user.email || '');
          const generator = generateSong(inputs, session.user.email || '', profile);
          
          let fullText = '';
          for await (const chunk of generator) {
              setGeneratedSong(chunk);
              fullText = chunk;
          }
          
          await deductCredits(session.user.email || '', COSTS.GENERATE_SONG);
          setStep(AppStep.SONG_DISPLAYED);
      } catch (err: any) {
          console.error(err);
          alert("Generation failed: " + err.message);
          // Revert credits if failed? 
          // For simplicity we just reload actual from DB in case of error
          loadCredits();
          setStep(AppStep.AWAITING_ADDITIONAL_INFO);
      } finally {
          setIsLoading(false);
      }
  };

  const handleStartOver = () => {
      setInputs(DEFAULT_INPUTS);
      setGeneratedSong('');
      setAlbumArt(null);
      setStep(AppStep.AWAITING_LANGUAGE);
      setView(AppView.STUDIO);
  };

  const handleSave = async (title: string, prompt: string, lyrics: string, art?: string, social?: any) => {
      if (!session) return;
      await saveSong(session.user.email || '', title, prompt, lyrics, art, social, loadedSongId || undefined);
      alert('Session saved to library!');
  };

  const handleAuth = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!authEmail || !authPassword) return;
      setIsAuthLoading(true);
      try {
          const { data, error } = isSignUpMode
            ? await signUp(authEmail, authPassword)
            : await signIn(authEmail, authPassword);
          if (error) throw error;
          if (data?.session) {
            setSession(data.session);
            setView(AppView.LANDING);
            const c = await getUserCredits(data.session.user.email || '');
            setCredits(c);
          }
      } catch (e: any) {
          alert(e.message);
      } finally {
          setIsAuthLoading(false);
      }
  };

  // Handle manual paste import with intelligent structuring
  const handlePasteImport = async () => {
      if (!pasteContent.trim()) return;

      if (!session) return;
      
      // Cost of "Structuring" is treated as a FULL GENERATION (5 credits) as it builds the song.
      const canAfford = await hasEnoughCredits(session.user.email || '', COSTS.GENERATE_SONG);
      if (!canAfford) {
          setView(AppView.PRICING);
          return;
      }

      setIsLoading(true);
      setLoadingMessage("Analyzing Structure & Formatting...");
      setStep(AppStep.GENERATING);
      setIsPasteMode(false); // Close the modal
      setView(AppView.STUDIO); // Switch context to studio

      try {
          const generator = structureImportedSong(pasteContent, session.user.email || '');
          
          let fullText = '';
          for await (const chunk of generator) {
              setGeneratedSong(chunk);
              fullText = chunk;
          }
          
          // Deduct credits for the AI service
          await deductCredits(session.user.email || '', COSTS.GENERATE_SONG);
          setCredits(prev => Math.max(0, prev - COSTS.GENERATE_SONG));

          setInputs(DEFAULT_INPUTS);
          setAlbumArt(null);
          setLoadedSongId(null);
          setStep(AppStep.SONG_DISPLAYED);
      } catch (e: any) {
          console.error(e);
          alert("Import failed: " + e.message);
          setStep(AppStep.AWAITING_LANGUAGE); // Fallback
          setView(AppView.LANDING);
      } finally {
          setIsLoading(false);
          setPasteContent('');
      }
  };

  if (!session || view === AppView.AUTH) {
    return (
      <div className="app-shell min-h-screen flex flex-col items-center justify-center p-3 sm:p-4 relative overflow-hidden">
        <div className="fixed top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0d17] to-[#06080f] pointer-events-none z-0"></div>
        <div className="relative z-10 w-full max-w-xl rounded-[1.75rem] sm:rounded-[2rem] border border-slate-800/80 bg-[#0f121b]/95 shadow-[0_20px_80px_rgba(0,0,0,0.55)] overflow-hidden">
          <div className="p-5 sm:p-8">
            <div className="flex justify-center mb-5"><Logo size={74} /></div>
            <h1 className="text-3xl sm:text-4xl font-black text-center tracking-tight text-white mb-2">Sign In</h1>
            <p className="text-center text-slate-400 text-base mb-7">Welcome back. Sign in to continue.</p>

            <>
              <div className="grid grid-cols-5 gap-2 sm:gap-3 mb-6">
                {['Apple', 'Discord', 'Facebook', 'Google', 'Microsoft'].map((provider) => (
                  <button
                    key={provider}
                    type="button"
                    className="h-11 rounded-xl border border-slate-700/90 bg-[#111522] text-slate-300 text-xs font-bold hover:border-slate-500 hover:text-white transition-all"
                    aria-label={`${provider} sign in coming soon`}
                    title={`${provider} sign in coming soon`}
                  >
                    {provider.slice(0, 1)}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="h-px flex-1 bg-slate-800"></div>
                <span className="text-slate-500 text-base">or</span>
                <div className="h-px flex-1 bg-slate-800"></div>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                <div>
                  <label className="block text-left text-white font-semibold mb-2">Email</label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full bg-[#101522] border border-slate-700 p-4 rounded-xl text-white outline-none focus:border-slate-400 text-base placeholder:text-slate-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-left text-white font-semibold mb-2">Password</label>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full bg-[#101522] border border-slate-700 p-4 rounded-xl text-white outline-none focus:border-slate-400 text-base placeholder:text-slate-500 transition-all"
                    required
                    minLength={8}
                  />
                </div>
                <button
                  disabled={isAuthLoading}
                  className="w-full h-12 rounded-xl bg-white text-black font-black text-lg hover:bg-slate-200 transition-all disabled:opacity-70 flex items-center justify-center"
                >
                  {isAuthLoading ? <LoadingSpinner /> : (isSignUpMode ? 'Create Account' : 'Continue')}
                </button>
              </form>
            </>
          </div>

          <div className="border-t border-slate-800 p-4 sm:p-5 bg-[#111522]">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <p className="text-slate-400 text-base">{isSignUpMode ? 'Already have an account?' : "Don't have an account?"}</p>
              <button
                type="button"
                onClick={() => setIsSignUpMode((v) => !v)}
                className="w-full sm:w-auto px-10 h-12 rounded-xl bg-white text-black font-bold"
              >
                {isSignUpMode ? 'Sign in' : 'Sign up'}
              </button>
            </div>
            <div className="mt-4 text-center">
              <button onClick={() => setView(AppView.TERMS)} className="text-xs text-slate-500 hover:text-slate-300">
                By continuing, you accept our Privacy Policy and Terms
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === AppView.TERMS) {
      return <TermsAndPrivacy onBack={() => setView(AppView.AUTH)} />;
  }

  if (view === AppView.PRICING) {
      return <PricingView email={session.user.email} onClose={() => setView(AppView.LANDING)} onPurchaseComplete={() => {}} />;
  }

  if (view === AppView.PROFILE) {
      return <ProfileView email={session.user.email} onLoadSong={(s) => {
          setInputs({ ...DEFAULT_INPUTS, genre: 'Loaded Song' }); 
          setGeneratedSong(s.lyrics || `Title: ${s.title}\n\n### SUNO Prompt\n${s.suno_prompt}\n\n### Lyrics\n${s.lyrics}`);
          setAlbumArt(s.album_art || null);
          setLoadedSongId(s.id);
          setView(AppView.STUDIO);
          setStep(AppStep.SONG_DISPLAYED);
      }} onBack={() => setView(AppView.LANDING)} onSignOut={() => signOut().then(() => { setSession(null); setView(AppView.AUTH); })} onBuyCredits={() => setView(AppView.PRICING)} />;
  }

  if (view === AppView.LANDING) {
      return (
        <div className="app-shell min-h-screen text-slate-200 font-sans selection:bg-blue-500/30 relative overflow-hidden flex flex-col items-center justify-center p-4 md:p-6">
             <div className="fixed top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#020617] to-[#020617] pointer-events-none z-0"></div>
             
             {isPasteMode ? (
                 <div className="glass-panel-strong relative z-10 w-full max-w-2xl p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] animate-fade-in shadow-emerald-900/20">
                     <h2 className="text-2xl font-black text-white tracking-tight mb-2">Import & Structure Session</h2>
                     <p className="text-slate-500 text-sm font-black uppercase tracking-widest mb-6">Paste lyrics, choruses, verses, or just an idea. The AI will format and complete the song structure.</p>
                     
                     <textarea 
                        className="w-full h-64 bg-[#131722] border border-slate-800 rounded-3xl p-6 text-slate-300 focus:border-emerald-500 outline-none resize-none mb-6 font-mono text-sm shadow-inner"
                        placeholder="Paste your lyrics or raw ideas here..."
                        value={pasteContent}
                        onChange={(e) => setPasteContent(e.target.value)}
                        autoFocus
                     />
                     
                     <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                         <button onClick={handlePasteImport} className="cta-primary flex-1 py-4 rounded-2xl font-black uppercase tracking-widest transition-all">
                             Structure Song ({COSTS.GENERATE_SONG} Credits)
                         </button>
                         <button onClick={() => { setIsPasteMode(false); setPasteContent(''); }} className="cta-secondary flex-1 py-4 rounded-2xl text-slate-300 font-black uppercase tracking-widest transition-all">
                             Cancel
                         </button>
                     </div>
                 </div>
             ) : (
                     <div className="relative z-10 w-full max-w-4xl animate-fade-in text-center">
                     <div className="mb-12 flex flex-col items-center">
                        <Logo size={100} className="mb-6" />
                        <h1 className="heading-display text-4xl md:text-5xl font-black text-white tracking-tighter mb-2">Studio Dashboard</h1>
                        <p className="text-slate-500 font-black uppercase tracking-[0.18em] md:tracking-[0.4em] text-xs md:text-sm">Welcome back, {session?.user?.email?.split('@')[0]}</p>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         
                         {/* Option 1: New Session (BLUE) */}
                         <button 
                            onClick={() => { setView(AppView.STUDIO); setStep(AppStep.AWAITING_LANGUAGE); setInputs(DEFAULT_INPUTS); }}
                            className="group glass-panel bg-[#0b0f19]/65 hover:border-blue-400 p-8 rounded-[2rem] md:rounded-[2.5rem] flex flex-col items-center gap-6 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-600/20 relative overflow-hidden"
                         >
                             <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                             <div className="w-20 h-20 rounded-full bg-blue-900/20 text-blue-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all relative z-10">
                                 <MagicWandIcon />
                             </div>
                             <div className="relative z-10">
                                 <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2 group-hover:text-blue-400 transition-colors">New Session</h3>
                                 <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Start from scratch</p>
                             </div>
                         </button>

                         {/* Option 2: Paste Lyrics (EMERALD) */}
                         <button 
                            onClick={() => setIsPasteMode(true)}
                            className="group glass-panel bg-[#0b0f19]/65 hover:border-emerald-400 p-8 rounded-[2rem] md:rounded-[2.5rem] flex flex-col items-center gap-6 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-600/20 relative overflow-hidden"
                         >
                             <div className="absolute inset-0 bg-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                             <div className="w-20 h-20 rounded-full bg-emerald-900/20 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all relative z-10">
                                 <EditIcon />
                             </div>
                             <div className="relative z-10">
                                 <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2 group-hover:text-emerald-400 transition-colors">Paste / Import</h3>
                                 <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Structure Lyrics & Ideas</p>
                             </div>
                         </button>

                         {/* Option 3: Discography (VIOLET/PURPLE) */}
                         <button 
                            onClick={() => setView(AppView.PROFILE)}
                            className="group glass-panel bg-[#0b0f19]/65 hover:border-cyan-400 p-8 rounded-[2rem] md:rounded-[2.5rem] flex flex-col items-center gap-6 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-600/20 relative overflow-hidden"
                         >
                             <div className="absolute inset-0 bg-violet-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                             <div className="w-20 h-20 rounded-full bg-violet-900/20 text-violet-400 flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-all relative z-10">
                                 <ClockIcon />
                             </div>
                             <div className="relative z-10">
                                 <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2 group-hover:text-cyan-400 transition-colors">Discography</h3>
                                 <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">View Past Sessions</p>
                             </div>
                         </button>

                     </div>

                     <div className="mt-16 flex flex-wrap justify-center gap-4 md:gap-6">
                         <div className="flex items-center gap-2 px-5 py-2 bg-slate-900 rounded-full border border-slate-800">
                             <WalletIcon className="w-4 h-4 text-slate-500" />
                             <span className="text-xs font-black text-slate-300 uppercase tracking-widest">Balance: {credits}</span>
                         </div>
                         <button onClick={() => signOut().then(() => { setSession(null); setView(AppView.AUTH); })} className="text-xs font-black text-slate-600 uppercase tracking-widest hover:text-white transition-colors">Sign Out</button>
                     </div>
                 </div>
             )}
        </div>
      );
  }

  // STUDIO VIEW
  return (
    <div className="app-shell min-h-screen text-slate-200 font-sans selection:bg-blue-500/30 relative overflow-x-hidden">
      <div className="fixed top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#020617] to-[#020617] pointer-events-none z-0"></div>
      
      {/* Header */}
      <nav className="glass-panel relative z-50 p-4 md:p-6 mt-3 flex justify-between items-center max-w-7xl mx-auto rounded-2xl md:rounded-3xl gap-3">
         <div onClick={() => setView(AppView.LANDING)} className="cursor-pointer hover:opacity-80 transition-opacity">
            <Logo size={48} />
         </div>
         <div className="flex items-center gap-2 md:gap-4">
             <div className="md:hidden flex items-center gap-1 px-3 py-2 rounded-full bg-slate-900 border border-slate-800 text-cyan-400">
                <WalletIcon className="w-3.5 h-3.5" />
                <span className="text-[11px] font-black tracking-wider tabular-nums">{credits}</span>
             </div>
             {/* Credit Monitor & Add Button */}
             <div className="hidden md:flex items-center bg-[#0b0f19] border border-slate-800 rounded-full p-1 pl-1 pr-4 gap-3 shadow-inner">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 border border-slate-700 text-cyan-400">
                    <WalletIcon className="w-4 h-4" />
                    <span className="text-sm font-black tracking-widest tabular-nums">{credits}</span>
                </div>
                <button onClick={() => setView(AppView.PRICING)} className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-colors">
                    Add Credits
                </button>
             </div>

             <button onClick={() => setView(AppView.PROFILE)} className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-slate-700 hover:text-white transition-all">
                 <ProfileIcon />
             </button>
         </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 min-h-[80vh] flex flex-col">
          {step === AppStep.SONG_DISPLAYED || step === AppStep.EDITING_SONG ? (
              <LyricsDisplay 
                song={generatedSong}
                albumArt={albumArt}
                onAlbumArtChange={setAlbumArt}
                onStartOver={handleStartOver}
                onGoHome={() => setView(AppView.LANDING)}
                onEdit={() => {}}
                onSave={handleSave}
                onResizePrompt={async () => {}}
                onGenerateArt={async (t, p) => generateAlbumArt(t, p, `${inputs.genre || 'Cinematic'}`, `${session?.user?.email || ''}`)}
                onGenerateSocial={async (t, l) => generateSocialPack(t, l, `${session?.user?.email || ''}`)}
                onTranslate={(txt, lang) => translateLyrics(txt, lang, `${session?.user?.email || ''}`)}
                refreshCredits={loadCredits}
                isResizing={false}
                email={session?.user?.email || ''}
              />
          ) : step === AppStep.GENERATING ? (
              <div className="flex flex-col items-center justify-center flex-grow animate-pulse">
                  <LoadingSpinner />
                  <h2 className="mt-8 text-2xl font-black text-white tracking-tight">{loadingMessage}</h2>
                  <p className="mt-2 text-slate-500 font-black uppercase tracking-widest text-xs">This may take up to 30 seconds</p>
              </div>
          ) : (
              <CreationWizard 
                step={step}
                inputs={inputs}
                dynamicOptions={dynamicOptions}
                isLoadingOptions={isLoadingOptions}
                onUpdate={handleUpdate}
                onNext={handleNext}
                onPrev={handlePrev}
                onGenerate={handleGenerate}
              />
          )}
      </div>
    </div>
  );
};
