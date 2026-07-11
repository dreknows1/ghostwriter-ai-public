
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppStep, AppView, SongInputs, UserProfile } from './types';
import { generateSong, generateAlbumArt, generateSocialPack, translateLyrics, structureImportedSong, suggestTitles } from './services/geminiService';
import { saveSong } from './services/songService';
import { getUserProfile } from './services/userService';
import { getSession, signOut, signIn, signUp, signInWithOAuthToken, startProviderSignIn } from './services/authService';
import { getUserCredits, hasEnoughCredits, deductCredits, COSTS, formatCredits } from './services/creditService';
import { apiFetch, SESSION_EXPIRED_EVENT } from './lib/api';
import LyricsDisplay from './components/LyricsDisplay';
import ProfileView from './components/ProfileView';
import PricingView from './components/PricingView';
import TermsAndPrivacy from './components/TermsAndPrivacy';
import UtilityHub, { UtilitySection } from './components/UtilityHub';
import ApiKeyModal from './components/ApiKeyModal';
import MenuDrawer from './components/MenuDrawer';
import { toast } from './components/Feedback';
import AskAndreWidget from './components/AskAndreWidget';
import { Logo } from './components/Logo';
import IntroAnimation from './components/IntroAnimation';
import { LoadingSpinner, ProfileIcon, WalletIcon, EditIcon, ClockIcon, GhostIcon, BoltIcon } from './components/icons';
import { isNative } from './lib/platform';
import { hapticLight, hapticSuccess } from './lib/haptics';
import { openExternal } from './lib/nativeBridge';

const AuthAppleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
    <path d="M16.7 12.8c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.5-.2-2.9.9-3.6.9-.7 0-1.9-.9-3.1-.9-1.6 0-3.1 1-3.9 2.3-1.7 2.9-.4 7.2 1.2 9.5.8 1.1 1.7 2.3 2.9 2.2 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.9-2.2.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.5-1-2.5-3.8zM14.4 5.8c.7-.9 1.1-2.1 1-3.3-1 .1-2.2.7-2.9 1.6-.7.8-1.2 2-1 3.2 1.1.1 2.2-.6 2.9-1.5z" />
  </svg>
);

const AuthFacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
    <path d="M22 12a10 10 0 10-11.6 9.9v-7h-2.1V12h2.1V9.8c0-2.1 1.2-3.3 3.2-3.3.9 0 1.9.2 1.9.2v2.1h-1.1c-1.1 0-1.5.7-1.5 1.4V12h2.5l-.4 2.9h-2.1v7A10 10 0 0022 12z" />
  </svg>
);

const AuthGoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
    <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.8-5.5 3.8-3.3 0-6-2.8-6-6.2s2.7-6.2 6-6.2c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.8 2.8 14.6 2 12 2 6.7 2 2.4 6.4 2.4 11.8S6.7 21.6 12 21.6c6.9 0 9.6-4.8 9.6-7.3 0-.5 0-.9-.1-1.3H12z"/>
  </svg>
);

const AuthMicrosoftIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
    <rect x="3" y="3" width="8" height="8" fill="#F35325" />
    <rect x="13" y="3" width="8" height="8" fill="#81BC06" />
    <rect x="3" y="13" width="8" height="8" fill="#05A6F0" />
    <rect x="13" y="13" width="8" height="8" fill="#FFBA08" />
  </svg>
);

const AuthDiscordIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
    <path d="M20 5.4A16 16 0 0016.1 4l-.2.4a11 11 0 00-4-.1l-.2-.4A16 16 0 007.8 5.4C5 9.6 4.2 13.7 4.4 17.7A16.5 16.5 0 009 20l.8-1.2a10.4 10.4 0 01-1.6-.8l.4-.3c3.2 1.5 6.7 1.5 9.8 0l.4.3c-.5.3-1 .5-1.6.8L18 20a16.5 16.5 0 004.6-2.3c.3-4.6-.6-8.6-2.6-12.3zM9.8 14.8c-.9 0-1.6-.8-1.6-1.8s.7-1.8 1.6-1.8 1.6.8 1.6 1.8-.7 1.8-1.6 1.8zm4.4 0c-.9 0-1.6-.8-1.6-1.8s.7-1.8 1.6-1.8 1.6.8 1.6 1.8-.7 1.8-1.6 1.8z" />
  </svg>
);
// English-only genre list (founder-set priorities first). The old multi-language
// option machinery is deleted; genre is a label the user picks, nothing more.
const ENGLISH_GENRES = [
  'R&B', 'Hip-Hop', 'Gospel', 'Reggae', 'Afrobeats', 'Pop',
  'Country', 'Rock', 'Soul', 'Blues', 'Jazz', 'Folk', 'EDM', 'Metal',
];
import { sanitizeEmail, sanitizeText, sanitizeUnknown } from './lib/sanitizeInput';


// Ghost-voiced generation stages (docs/DESIGN.md Part 2) — ids/keywords drive the
// real telemetry match against server __STATUS__ chunks; labels are the séance copy
// shown on screen, replacing the old "Process Stages" system-log presentation.
const GENERATION_STAGES = [
  { label: 'Channeling your story', keywords: ['listening', 'analyzing'] },
  { label: 'Casting the first verse', keywords: ['drafting', 'structure'] },
  { label: 'Possessing the bridge', keywords: ['agent', 'genre', 'subgenre'] },
  { label: 'Haunting the hook', keywords: ['guide', 'compliance', 'check'] },
  { label: 'Mixing the séance', keywords: ['refine', 'polish'] },
  { label: 'Sealing the record', keywords: ['finalizing', 'suno prompt'] },
] as const;


const DEFAULT_INPUTS: SongInputs = {
  language: 'English',
  genre: '',
  artStyle: 'Realism',
  subGenre: '',
  audioEnv: 'Studio (Clean)',
  emotion: 'Euphoric',
  vocals: 'Female Solo',
  performerType: 'Solo Artist',
  referenceArtist: '',
  mundaneObjects: '',
  creativeDirection: '',
  additionalInfo: ''
};

/** A room card from GET /api/ai — one sub-genre the curriculum engine can write in. */
type RoomCard = {
  id?: string;
  name: string;
  oneLine: string;
  instruments?: string[];
  themes?: string[];
  purposes?: string[];
};
type RoomPacks = Record<string, RoomCard[]>;

type BuilderStepId = 'language' | 'genre' | 'room' | 'theme' | 'purpose' | 'audience' | 'voice' | 'instruments' | 'story';

type GenreWorld = { themes: string[]; purposes: string[]; instruments: string[] };
const LANGUAGE_OPTIONS = ['English', 'Spanish', 'French', 'Portuguese'];

const LET_GHOST_DECIDE = 'Let Song Ghost decide';

const THEME_OPTIONS = [
  'New love', 'Deep love / devotion', 'Complicated love', 'Heartbreak / letting go',
  'Missing someone', 'Celebration / milestone', 'Family', 'Faith / gratitude',
  'Growth / proving myself', 'Remembering someone',
];

const PURPOSE_OPTIONS = [
  'Slow dance', 'Bring happy tears', 'Party / celebrate', 'Make them feel seen',
  'Testify / give thanks', 'Win them back', 'Say what I never said',
];

const AUDIENCE_OPTIONS = [
  "One person — I'm talking right to them",
  "My own story — I'm telling it",
  'Everybody — made to sing along',
];

const VOICE_OPTIONS = ['Female Solo', 'Male Solo', 'Duo/Group'];

/**
 * Match a display genre against the room packs' ids. Pack ids are squashed
 * lowercase ("rnb", "hiphop"); "R&B" needs the &→n form to land on "rnb".
 */
const roomsForGenre = (packs: RoomPacks | null, genre: string): RoomCard[] => {
  if (!packs || !genre) return [];
  const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const candidates = new Set([
    squash(genre),
    squash(genre.replace(/&/g, 'n')),
    squash(genre.replace(/&/g, ' and ')),
  ]);
  for (const [packId, rooms] of Object.entries(packs)) {
    if (!candidates.has(squash(packId))) continue;
    return (Array.isArray(rooms) ? rooms : []).filter(
      (r): r is RoomCard => !!r && typeof r.name === 'string' && typeof r.oneLine === 'string'
    );
  }
  return [];
};

const FAST_TRACK_GENRES = ENGLISH_GENRES;
const STORY_MAX = 600;

/**
 * FAST_TRACK — the default Studio entry (docs/PLAN.md "Create experience").
 * One screen: story + genre chips + Create. Every unset field stays '' so
 * buildInputs() below reads as "Ghost decides" exactly like the full wizard's
 * own default. "Customize every detail" drops into the unchanged 9-step
 * SongBuilder for anyone who wants full control.
 */
const FastTrackCreate: React.FC<{
  isGenerating: boolean;
  credits: number;
  onGenerate: (builtInputs: SongInputs) => void;
  onCustomize: () => void;
}> = ({ isGenerating, credits, onGenerate, onCustomize }) => {
  const [story, setStory] = useState('');
  const [genre, setGenre] = useState('');

  const buildInputs = (): SongInputs => ({
    ...DEFAULT_INPUTS,
    genre,
    emotion: 'Match the creative direction',
    creativeDirection: story.trim(),
  });

  const pickGenre = (g: string) => {
    hapticLight();
    setGenre((prev) => (prev === g ? '' : g));
  };

  return (
    <div className="w-full max-w-xl mx-auto px-5 pt-6 pb-10 animate-fade-in flex flex-col min-h-[75vh]">
      <h1 className="heading-display text-3xl md:text-5xl font-bold text-slate-100 leading-[1.1] tracking-tight">
        What's your <span style={{ color: 'var(--amber-bright)' }}>song</span> about?
      </h1>
      <p className="mt-3 text-sm text-slate-400 leading-relaxed max-w-sm">
        Give Ghost the story — a memory, a text you never sent, a feeling you can't quite name.
      </p>

      <div className="mt-6">
        <textarea
          autoFocus
          value={story}
          maxLength={STORY_MAX}
          onChange={(e) => setStory(e.target.value)}
          onFocus={(e) => {
            // Keep the textarea clear of the keyboard on native — WKWebView doesn't
            // always scroll focused inputs into view on its own.
            requestAnimationFrame(() => e.currentTarget.scrollIntoView({ block: 'center', behavior: 'smooth' }));
          }}
          placeholder="A breakup text I never sent, but wish I had…"
          rows={5}
          className="w-full rounded-[1.4rem] p-5 text-[15px] leading-relaxed resize-none outline-none transition-all font-serif italic placeholder:font-serif placeholder:italic bg-slate-800 border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-amber-400"
        />
        <div className="mt-2 text-right text-[11px] font-bold uppercase tracking-widest text-slate-600">
          {story.length}/{STORY_MAX}
        </div>
      </div>

      <div className="mt-2">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5" style={{ scrollbarWidth: 'none' }}>
          <button
            type="button"
            onClick={() => { hapticLight(); setGenre(''); }}
            className={`shrink-0 inline-flex items-center gap-1.5 whitespace-nowrap px-4 py-2.5 rounded-full border text-[12.5px] font-bold transition-all ${
              genre === ''
                ? 'border-cyan-400 text-cyan-200 bg-cyan-500/10 shadow-[0_0_18px_-6px_rgba(79,215,196,0.65)]'
                : 'border-slate-700 text-slate-400'
            }`}
          >
            <GhostIcon className="h-4 w-4" /> Let Ghost decide
          </button>
          {FAST_TRACK_GENRES.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => pickGenre(g)}
              className={`shrink-0 whitespace-nowrap px-4 py-2.5 rounded-full border text-[12.5px] font-bold transition-all ${
                genre === g
                  ? 'border-amber-400 text-amber-200 bg-amber-500/10 shadow-[0_0_18px_-6px_rgba(226,153,60,0.65)]'
                  : 'border-slate-700 text-slate-400'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1" />

      <div className="mt-8">
        <p className="text-center text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3">
          Uses {COSTS.GENERATE_SONG} credits · {formatCredits(credits)} left this month
        </p>
        <button
          type="button"
          onClick={() => { hapticLight(); onGenerate(buildInputs()); }}
          disabled={isGenerating}
          className="cta-primary w-full py-5 rounded-2xl text-[15px] uppercase tracking-[0.1em] flex items-center justify-center gap-2 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <GhostIcon className="h-5 w-5" /> {isGenerating ? 'Creating…' : 'Create My Song'}
        </button>
        <button
          type="button"
          onClick={onCustomize}
          className="w-full mt-4 text-center text-sm font-bold text-cyan-300 active:text-cyan-200"
        >
          Customize every detail →
        </button>
      </div>
    </div>
  );
};

/**
 * Song Builder — the guided creation flow. One composition question per screen
 * (genre → room → theme → purpose → audience → voice → story + title), big
 * tappable chips that auto-advance, every step skippable ("Let Song Ghost
 * decide"), then the app puts the puzzle together into a single SongInputs.
 */
const SongBuilder: React.FC<{
  isGenerating: boolean;
  email: string;
  onGenerate: (builtInputs: SongInputs) => void;
}> = ({ isGenerating, email, onGenerate }) => {
  const [stepId, setStepId] = useState<BuilderStepId>('language');
  // The puzzle pieces — '' everywhere means "Song Ghost decides".
  const [language, setLanguage] = useState('English');
  const [genre, setGenre] = useState('');
  const [subGenre, setSubGenre] = useState('');
  const [theme, setTheme] = useState('');
  const [purpose, setPurpose] = useState('');
  const [audience, setAudience] = useState('');
  const [vocals, setVocals] = useState('Female Solo');
  const [instruments, setInstruments] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [story, setStory] = useState('');
  // Rooms (sub-genres) from the engine; null until fetched — the room step only exists when the genre has rooms.
  const [roomPacks, setRoomPacks] = useState<RoomPacks | null>(null);
  // Per-genre questionnaire worlds (themes/purposes/instruments) from the curriculum.
  const [genreWorlds, setGenreWorlds] = useState<Record<string, GenreWorld> | null>(null);
  // language -> its native genre worlds (English + es/fr/pt from the curriculum)
  const [genresByLang, setGenresByLang] = useState<Record<string, Record<string, GenreWorld>> | null>(null);
  // "Write my own" affordance — one draft box, keyed to the step it's open on.
  const [customFor, setCustomFor] = useState<BuilderStepId | null>(null);
  const [customDraft, setCustomDraft] = useState('');
  // Title ideas: null = not asked yet; [] = asked, nothing usable came back.
  const [titleIdeas, setTitleIdeas] = useState<string[] | null>(null);
  const [titleRoom, setTitleRoom] = useState<{ name: string; note: string } | null>(null);
  const [isTitleLoading, setIsTitleLoading] = useState(false);

  // Fetch the room catalog once. No auth; failure just means the room step never shows.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/api/ai');
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled && json && typeof json.rooms === 'object' && json.rooms) {
          setRoomPacks(json.rooms as RoomPacks);
        }
        if (!cancelled && json && typeof json.genreBuilder === 'object' && json.genreBuilder) {
          setGenreWorlds(json.genreBuilder as Record<string, GenreWorld>);
        }
        if (!cancelled && json && typeof json.genreBuilderByLang === 'object' && json.genreBuilderByLang) {
          setGenresByLang(json.genreBuilderByLang as Record<string, Record<string, GenreWorld>>);
        }
      } catch {
        // Silent: the builder works fine without sub-genre rooms.
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const genreRooms = roomsForGenre(roomPacks, genre);
  const selectedRoom = genreRooms.find((r) => r.name === subGenre) || null;
  // Question logic is genre-logical: each genre's world (from the curriculum) supplies its
  // own themes/purposes/instruments; a picked deep room narrows further. Custom picks
  // (typed answers) bypass the lists entirely.
  // The chosen language decides which genres appear and each genre's world.
  const langCatalog: Record<string, GenreWorld> | null =
    (genresByLang && (genresByLang[language] || genresByLang['English'])) || genreWorlds;
  const genreChips: string[] = langCatalog && Object.keys(langCatalog).length
    ? Object.keys(langCatalog)
    : ENGLISH_GENRES;
  const world: GenreWorld | null = (langCatalog && langCatalog[genre]) || (genreWorlds && genreWorlds[genre]) || null;
  const themeBase = world?.themes?.length ? world.themes : THEME_OPTIONS;
  const roomThemes = selectedRoom?.themes?.length
    ? themeBase.filter((t) => selectedRoom.themes!.includes(t))
    : themeBase;
  const themeOptions = roomThemes.length ? roomThemes : (selectedRoom?.themes || themeBase);
  const purposeBase = world?.purposes?.length ? world.purposes : PURPOSE_OPTIONS;
  const roomPurposes = selectedRoom?.purposes?.length
    ? purposeBase.filter((p) => selectedRoom.purposes!.includes(p))
    : purposeBase;
  const purposeOptions = roomPurposes.length ? roomPurposes : (selectedRoom?.purposes || purposeBase);
  const instrumentOptions = selectedRoom?.instruments?.length
    ? selectedRoom.instruments
    : (world?.instruments || []);
  const steps: BuilderStepId[] = [
    'language',
    'genre',
    ...(genreRooms.length ? (['room'] as BuilderStepId[]) : []),
    'theme', 'purpose', 'audience', 'voice',
    ...(instrumentOptions.length ? (['instruments'] as BuilderStepId[]) : []),
    'story',
  ];
  const stepIndex = Math.max(0, steps.indexOf(stepId));
  const isLastStep = stepId === 'story';

  const goNext = () => { hapticLight(); setCustomFor(null); setCustomDraft(''); setStepId(steps[Math.min(steps.length - 1, stepIndex + 1)]); };
  const goBack = () => { hapticLight(); setCustomFor(null); setCustomDraft(''); setStepId(steps[Math.max(0, stepIndex - 1)]); };

  const pickGenre = (g: string) => {
    setGenre(g);
    setSubGenre(''); // a different genre's room can't carry over
    setInstruments([]);
    // Compute the next step from the NEW genre — the steps array above still holds the old one.
    setStepId(roomsForGenre(roomPacks, g).length ? 'room' : 'theme');
  };

  const buildInputs = (): SongInputs => ({
    ...DEFAULT_INPUTS,
    language,
    genre,
    subGenre,
    theme,
    purpose,
    audience,
    title,
    vocals,
    instrumentation: instruments.join(', '),
    // Don't let the default mood fight the user's story — the story is the law.
    emotion: 'Match the creative direction',
    creativeDirection: story.trim(),
  });

  const handleTitleIdeas = async () => {
    if (isTitleLoading) return;
    setIsTitleLoading(true);
    try {
      const result = await suggestTitles(
        { genre, subGenre, theme, purpose, audience, vocals, creativeDirection: story.trim() },
        email
      );
      // Dedupe defensively (titles are React keys) and cap at 5.
      setTitleIdeas(Array.from(new Set(result.titles.filter((t) => typeof t === 'string' && t.trim()))).slice(0, 5));
      setTitleRoom(result.room || null);
      if (!result.titles.length) {
        toast('No title ideas this time — Song Ghost will pick one during creation.', 'info');
      }
    } catch (err: any) {
      // Never block creation on titles — surface it and move on.
      toast(`Couldn't get title ideas: ${err?.message || 'please try again.'} You can still create your song.`, 'error');
    } finally {
      setIsTitleLoading(false);
    }
  };

  const headers: Record<BuilderStepId, { title: string; caption: string }> = {
    language: { title: 'What language will it sing in?', caption: 'The lyrics follow your language' },
    genre: { title: "What's your sound?", caption: language === 'English' ? 'Pick a genre or type your own — every question below follows it' : `${language} genres — pick one or type your own` },
    room: { title: 'Pick your room', caption: `The corner of ${genre} this song lives in` },
    theme: { title: 'What is this song about?', caption: 'The heart of the song' },
    purpose: { title: 'What should this song DO?', caption: 'Its job in the room' },
    audience: { title: 'Who is this song speaking to?', caption: 'The point of view' },
    voice: { title: 'Whose voice sings it?', caption: 'Pick the lead vocal' },
    instruments: { title: 'What should we hear?', caption: `${subGenre || genre} instruments — pick up to 3, or skip` },
    story: { title: 'Tell us the real story', caption: 'Optional — but this is what makes it YOURS' },
  };
  const header = headers[stepId];

  // Shared chip styles — same visual language as the genre grid.
  const chipBase =
    'w-full p-4 sm:p-5 rounded-3xl border transition-all text-sm sm:text-base leading-tight font-black uppercase tracking-[0.08em] min-h-[56px] flex items-center justify-center text-center break-words';
  const chipIdle = 'bg-slate-700 border-slate-600 text-slate-200 active:bg-slate-600 active:border-orange-400 active:text-white';
  const chipPicked = 'bg-slate-600 border-orange-400 text-white';
  const decideIdle = 'bg-slate-800 border-slate-700 text-slate-400 active:border-cyan-400 active:text-cyan-200';
  const decidePicked = 'bg-cyan-500/15 border-cyan-400 text-cyan-200';

  /** "Write my own" — every question accepts a typed answer, and it flows into the song
   * exactly like a chip pick (same field, same weight in the brief). */
  const customAnswer = (step: BuilderStepId, apply: (v: string) => void, placeholder: string) => (
    <div className="mt-3">
      {customFor === step ? (
        <form
          onSubmit={(e) => { e.preventDefault(); const v = customDraft.trim(); if (v) { apply(v); goNext(); } }}
          className="flex gap-2"
        >
          <input
            autoFocus
            value={customDraft}
            onChange={(e) => setCustomDraft(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-slate-800 border border-cyan-400/60 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 outline-none"
          />
          <button type="submit" className="px-5 py-3 rounded-xl bg-cyan-500 text-white text-xs font-black uppercase tracking-widest active:bg-cyan-400 transition-all">
            Use it →
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => { setCustomFor(step); setCustomDraft(''); }}
          className="w-full p-3 rounded-xl border border-dashed border-slate-600 text-slate-400 text-xs font-black uppercase tracking-widest active:border-cyan-400 active:text-cyan-200 transition-all"
        >
          ✍️ Write my own
        </button>
      )}
    </div>
  );

  /** Chip list for the simple option steps: "Let Song Ghost decide" first, picks auto-advance. */
  const optionChips = (step: BuilderStepId, options: string[], value: string, pick: (v: string) => void, customPlaceholder: string) => (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => { pick(''); goNext(); }}
          className={`${chipBase} ${value === '' ? decidePicked : decideIdle}`}
        >
          {LET_GHOST_DECIDE}
        </button>
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => { pick(opt); goNext(); }}
            className={`${chipBase} ${value === opt ? chipPicked : chipIdle}`}
          >
            {opt}
          </button>
        ))}
      </div>
      {customAnswer(step, pick, customPlaceholder)}
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pt-10 md:pt-16 pb-24 animate-fade-in">
      {/* Back — progress dots — Skip. Back and Skip always reachable; chips auto-advance. */}
      <div className="flex items-center justify-between mb-8">
        {stepIndex > 0 ? (
          <button
            type="button"
            onClick={goBack}
            className="text-xs font-black uppercase tracking-widest text-slate-400 active:text-white transition-colors"
          >
            ← Back
          </button>
        ) : (
          <span className="w-14" aria-hidden="true" />
        )}
        <div className="flex items-center gap-2" aria-label={`Step ${stepIndex + 1} of ${steps.length}`}>
          {steps.map((s, i) => (
            <span
              key={s}
              className={`h-2 rounded-full transition-all ${
                i === stepIndex ? 'w-6 bg-cyan-400' : i < stepIndex ? 'w-2 bg-amber-400/80' : 'w-2 bg-slate-700'
              }`}
            />
          ))}
        </div>
        {!isLastStep ? (
          <button
            type="button"
            onClick={goNext}
            title={LET_GHOST_DECIDE}
            className="text-xs font-black uppercase tracking-widest text-slate-400 active:text-white transition-colors"
          >
            Skip →
          </button>
        ) : (
          <span className="w-14" aria-hidden="true" />
        )}
      </div>

      <div className="text-center mb-10">
        <h2 className="heading-display text-3xl md:text-5xl font-black text-white tracking-tighter mb-3">{header.title}</h2>
        <p className="text-slate-500 font-black uppercase tracking-[0.14em] md:tracking-[0.28em] text-[10px] md:text-xs">{header.caption}</p>
      </div>

      {stepId === 'language' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {LANGUAGE_OPTIONS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => {
                if (l !== language) { setGenre(''); setSubGenre(''); setInstruments([]); setTheme(''); setPurpose(''); }
                setLanguage(l); goNext();
              }}
              className={`${chipBase} ${language === l ? chipPicked : chipIdle}`}
            >
              {l}
            </button>
          ))}
        </div>
      )}

      {stepId === 'genre' && (
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {genreChips.map((g) => (
              <button
                key={g}
                onClick={() => pickGenre(g)}
                className={`${chipBase} ${genre === g ? chipPicked : chipIdle}`}
              >
                {g}
              </button>
            ))}
          </div>
          {customAnswer('genre', (v) => pickGenre(v), 'e.g. Bachata, Amapiano, Neo-grunge…')}
        </div>
      )}

      {stepId === 'room' && (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => { setSubGenre(''); setInstruments([]); goNext(); }}
            className={`w-full p-4 sm:p-5 rounded-3xl border text-left transition-all ${subGenre === '' ? decidePicked : decideIdle}`}
          >
            <span className="block font-black uppercase tracking-[0.08em] text-sm sm:text-base">{LET_GHOST_DECIDE}</span>
            <span className="mt-1 block text-xs text-slate-400 leading-relaxed">We read your story and pick the room that fits it best.</span>
          </button>
          {genreRooms.map((room) => (
            <button
              key={room.id || room.name}
              type="button"
              onClick={() => { setSubGenre(room.name); setInstruments([]); goNext(); }}
              className={`w-full p-4 sm:p-5 rounded-3xl border text-left transition-all ${
                subGenre === room.name ? chipPicked : chipIdle
              }`}
            >
              <span className="block font-black text-sm sm:text-base text-white">{room.name}</span>
              <span className="mt-1 block text-xs text-slate-400 leading-relaxed">{room.oneLine}</span>
            </button>
          ))}
          </div>
          {customAnswer('room', (v) => { setSubGenre(v); setInstruments([]); }, 'Name the style in your words…')}
        </div>
      )}

      {stepId === 'theme' && optionChips('theme', themeOptions, theme, setTheme, 'What is this song about, in your words…')}
      {stepId === 'purpose' && optionChips('purpose', purposeOptions, purpose, setPurpose, 'What should this song do…')}
      {stepId === 'audience' && optionChips('audience', AUDIENCE_OPTIONS, audience, setAudience, 'Who is it speaking to…')}

      {stepId === 'instruments' && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => { setInstruments([]); goNext(); }}
              className={`${chipBase} ${instruments.length === 0 ? decidePicked : decideIdle}`}
            >
              {LET_GHOST_DECIDE}
            </button>
            {instrumentOptions.map((inst) => {
              const picked = instruments.includes(inst);
              return (
                <button
                  key={inst}
                  type="button"
                  onClick={() =>
                    setInstruments((prev) =>
                      prev.includes(inst) ? prev.filter((x) => x !== inst) : prev.length >= 3 ? prev : [...prev, inst]
                    )
                  }
                  className={`${chipBase} ${picked ? chipPicked : chipIdle}`}
                >
                  {inst}
                </button>
              );
            })}
          </div>
          {customAnswer('instruments', (v) => setInstruments((prev) => (prev.includes(v) || prev.length >= 3 ? prev : [...prev, v])), 'e.g. steel pan, talkbox, 12-string…')}
          {instruments.length > 0 && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={goNext}
                className="px-8 py-3 rounded-xl bg-cyan-500 text-white text-xs font-black uppercase tracking-widest active:bg-cyan-400 transition-all"
              >
                Continue with {instruments.length} →
              </button>
            </div>
          )}
        </div>
      )}

      {stepId === 'voice' && (
        <div className="flex justify-center gap-2">
          {VOICE_OPTIONS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => { setVocals(v); goNext(); }}
              className={`px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                vocals === v ? 'bg-cyan-500 text-white shadow-lg' : 'bg-slate-800 text-slate-400 active:bg-slate-700 active:text-slate-200'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      )}

      {stepId === 'story' && (
        <div className="flex flex-col gap-6">
          <textarea
            autoFocus
            value={story}
            onChange={(e) => setStory(e.target.value)}
            rows={6}
            placeholder="Names, places, moments — the night you met, the song in the car, the thing they said. The more real, the better the song…"
            className="w-full bg-slate-800/90 border-2 border-cyan-400/60 rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 text-base md:text-lg leading-relaxed text-white placeholder:text-slate-500 focus:border-cyan-400 outline-none resize-none shadow-[0_0_40px_rgba(34,211,238,0.15)]"
          />

          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleTitleIdeas}
              disabled={isTitleLoading}
              className="px-5 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs font-black uppercase tracking-widest active:border-cyan-400 active:text-cyan-200 transition-all disabled:opacity-60 flex items-center gap-2"
            >
              {isTitleLoading && (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
              )}
              {isTitleLoading ? 'Thinking…' : 'Get title ideas'}
            </button>
          </div>

          {titleIdeas !== null && (
            <div className="flex flex-col gap-3">
              {titleRoom && (
                <p className="text-center text-sm text-slate-400">
                  Your song will live in: <span className="text-cyan-300 font-bold">{titleRoom.name}</span>
                  {titleRoom.note && <span className="block text-xs text-slate-500 mt-1">{titleRoom.note}</span>}
                </p>
              )}
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setTitle('')}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                    title === '' ? decidePicked : decideIdle
                  }`}
                >
                  Let Song Ghost pick
                </button>
                {titleIdeas.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTitle(t)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                      title === t ? chipPicked : chipIdle
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => onGenerate(buildInputs())}
            disabled={isGenerating}
            className="cta-primary w-full py-6 md:py-7 rounded-[2rem] text-base md:text-xl uppercase tracking-[0.12em] md:tracking-[0.2em] transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'GENERATING…' : `CREATE MY SONG (${COSTS.GENERATE_SONG} CREDITS)`}
          </button>
        </div>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  // Show the brand intro once per browser session — refreshes skip it, a fresh visit
  // still gets the moment. Previously it replayed on every page load.
  const [introComplete, setIntroComplete] = useState<boolean>(() => {
    try { return typeof window !== 'undefined' && window.sessionStorage.getItem('sg_intro_seen') === '1'; }
    catch { return false; }
  });
  const [session, setSession] = useState<any>(null);
  const [headerAvatarUrl, setHeaderAvatarUrl] = useState<string | null>(null);
  const [view, setView] = useState<AppView>(AppView.AUTH);
  const [step, setStep] = useState<AppStep>(AppStep.FAST_TRACK);
  const [inputs, setInputs] = useState<SongInputs>(DEFAULT_INPUTS);
  const [generatedSong, setGeneratedSong] = useState('');
  const [albumArt, setAlbumArt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const generationInFlightRef = useRef(false);
  // When the key modal is opened by the Generate gate, this resumes generation after save.
  const pendingGenerateAfterKeyRef = useRef(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [generationStageIndex, setGenerationStageIndex] = useState(0);
  const [generationLog, setGenerationLog] = useState<string[]>([]);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [communityCode, setCommunityCode] = useState('');
  const [showCommunityCode, setShowCommunityCode] = useState(false);
  const [communityCodeValidated, setCommunityCodeValidated] = useState(false);
  const [communityCodeError, setCommunityCodeError] = useState<string | null>(null);
  const [, setPendingTier] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [loadedSongId, setLoadedSongId] = useState<string | null>(null);
  const [credits, setCredits] = useState<number>(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [utilitySection, setUtilitySection] = useState<UtilitySection>('invite');
  const [utilityReturnView, setUtilityReturnView] = useState<AppView>(AppView.LANDING);
  const [termsReturnView, setTermsReturnView] = useState<AppView>(AppView.AUTH);

  // Paste / Import State
  const [isPasteMode, setIsPasteMode] = useState(false);
  const [pasteContent, setPasteContent] = useState('');
  // Catalog for the paste/import genre + room pickers (mirrors SongBuilder's /api/ai fetch,
  // so an import carries a real room/genre the curriculum engine can structure it into).
  const [importRoomPacks, setImportRoomPacks] = useState<RoomPacks | null>(null);
  const [importGenresByLang, setImportGenresByLang] = useState<Record<string, Record<string, GenreWorld>> | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/api/ai');
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled) return;
        if (json?.rooms && typeof json.rooms === 'object') setImportRoomPacks(json.rooms as RoomPacks);
        if (json?.genreBuilderByLang && typeof json.genreBuilderByLang === 'object') {
          setImportGenresByLang(json.genreBuilderByLang as Record<string, Record<string, GenreWorld>>);
        }
      } catch { /* pickers fall back to the English genre list */ }
    })();
    return () => { cancelled = true; };
  }, []);
  // Options for the paste-modal pickers, derived from the chosen language + genre.
  const importLang = inputs.language || 'English';
  const importGenreChips: string[] = (() => {
    const cat = importGenresByLang?.[importLang] || importGenresByLang?.['English'];
    const keys = cat ? Object.keys(cat) : [];
    return keys.length ? keys : ENGLISH_GENRES;
  })();
  const importRooms = roomsForGenre(importRoomPacks, inputs.genre || '');

  const resetGenerationTelemetry = (initialMessage: string) => {
    setLoadingMessage(initialMessage);
    setGenerationStageIndex(0);
    setGenerationLog([initialMessage]);
  };

  const updateGenerationTelemetry = (message: string) => {
    const clean = (message || '').trim();
    if (!clean) return;
    setLoadingMessage(clean);
    setGenerationLog(prev => {
      if (prev[prev.length - 1] === clean) return prev;
      const next = [...prev, clean];
      return next.slice(-7);
    });
    const lower = clean.toLowerCase();
    const idx = GENERATION_STAGES.findIndex(stage => stage.keywords.some(k => lower.includes(k)));
    if (idx >= 0) setGenerationStageIndex(prev => Math.max(prev, idx));
  };

  const handleOAuthProvider = (provider: string) => {
    if (isAuthLoading) return;
    setAuthError(null);
    startProviderSignIn(provider);
  };

  const loadCredits = async () => {
     if (session?.user?.email) {
         const c = await getUserCredits(session.user.email || '');
         setCredits(c);
     }
  };

  const loadHeaderAvatar = async (email?: string) => {
    if (!email) {
      setHeaderAvatarUrl(null);
      return;
    }
    try {
      const profile = await getUserProfile(email);
      setHeaderAvatarUrl(profile?.avatar_url || null);
    } catch {
      setHeaderAvatarUrl(null);
    }
  };

  const hasGeminiKey = () =>
    typeof window !== 'undefined' &&
    !!(window.localStorage.getItem('songghost_gemini_api_key') || '').trim();

  // Soft first-run nudge. Only skool-tier (community) members must bring their own
  // Gemini key — public users use the app's key, so we don't nag them.
  const promptForGeminiApiKeyIfMissing = useCallback(async (email?: string) => {
    if (typeof window === 'undefined') return;
    if (hasGeminiKey()) return;
    try {
      if (email) {
        const profile = await getUserProfile(email);
        if (String(profile?.tier || '').toLowerCase() !== 'skool') return;
      }
    } catch {
      // If we can't determine tier, fall through and nudge (safe default).
    }
    setIsApiKeyModalOpen(true);
  }, []);

  const handleManageGeminiApiKey = useCallback(() => {
    setIsApiKeyModalOpen(true);
  }, []);

  // Listen for service-layer requests to open the API key modal
  // (e.g. when a Gemini-backed call fails with an auth error mid-flight).
  useEffect(() => {
    const handler = () => setIsApiKeyModalOpen(true);
    window.addEventListener('songghost:openApiKeyModal', handler);
    return () => window.removeEventListener('songghost:openApiKeyModal', handler);
  }, []);

  // Session expiry: when apiFetch sees a 401 with X-Session-Invalid (missing or
  // expired session bearer — e.g. an existing web user who has no token yet), it
  // fires this event. Sign out cleanly and route to AUTH so re-login mints a new
  // token. Graceful: a clear "session expired, sign in again" — no white screen.
  useEffect(() => {
    const handler = () => {
      signOut().then(() => {
        setSession(null);
        setCredits(0);
        setHeaderAvatarUrl(null);
        setView(AppView.AUTH);
        toast('Your session expired. Please sign in again.', 'info');
      });
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, handler);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handler);
  }, []);



  useEffect(() => {
    const bootstrap = async () => {
      const search = new URLSearchParams(window.location.search);
      const oauthToken = search.get('oauth_token');
      const oauthError = search.get('oauth_error');

      if (oauthError) {
        setAuthError(`OAuth sign in failed: ${oauthError}`);
        search.delete('oauth_error');
        const q = search.toString();
        window.history.replaceState({}, '', q ? `/?${q}` : '/');
      }

      if (oauthToken) {
        setIsAuthLoading(true);
        try {
          const { data, error } = await signInWithOAuthToken(oauthToken);
          if (error) throw error;
          if (data?.session) {
            // Apply pending tier from community code if validated
            const savedTier = localStorage.getItem('sg_pending_tier');
            if (savedTier === 'skool') {
              try {
                await apiFetch('/api/db', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'db', dbAction: 'setProfileTier', payload: { email: data.session.user.email, tier: 'skool' } }),
                });
                localStorage.removeItem('sg_pending_tier');
              } catch (e) { console.error('Failed to set tier:', e); }
            }
            setSession(data.session);
            setView(AppView.LANDING);
            const c = await getUserCredits(data.session.user.email || '');
            setCredits(c);
            await loadHeaderAvatar(data.session.user.email || '');
            promptForGeminiApiKeyIfMissing(data.session.user.email || '');
          }
        } catch (e: any) {
          setAuthError(e?.message || 'OAuth sign in failed');
          setView(AppView.AUTH);
        } finally {
          setIsAuthLoading(false);
          search.delete('oauth_token');
          const q = search.toString();
          window.history.replaceState({}, '', q ? `/?${q}` : '/');
        }
        return;
      }

      const sess = await getSession();
      setSession(sess);
      if (sess) {
        setView(AppView.LANDING); // Default to Landing Dashboard
        getUserCredits(sess.user.email || '').then(c => setCredits(c));
        loadHeaderAvatar(sess.user.email || '');
        promptForGeminiApiKeyIfMissing(sess.user.email || '');

        const status = search.get('status');
        const sessionId = search.get('session_id');
        if (status === 'success') {
          try {
            if (sessionId) {
              await apiFetch('/api/checkout-complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId }),
              });
            }
            const c = await getUserCredits(sess.user.email || '');
            setCredits(c);
            toast('Payment successful — credits posted to your account.', 'success');
          } catch {
            const c = await getUserCredits(sess.user.email || '');
            setCredits(c);
            toast('Payment received. Credits are being finalized — refresh in a moment.', 'info');
          } finally {
            window.history.replaceState({}, '', '/');
          }
        }
      } else {
        setView(AppView.AUTH);
        setHeaderAvatarUrl(null);
      }
    };

    bootstrap();
  }, []);



  const handleGenerate = async (overrideInputs?: SongInputs) => {
      if (!session) return;
      if (generationInFlightRef.current) return;
      generationInFlightRef.current = true;
      // Guard: DOM event objects can arrive here via onClick={onGenerate}; only accept
      // a real SongInputs override (the Song Builder passes one explicitly).
      const overrides = overrideInputs && typeof overrideInputs === 'object' && 'genre' in overrideInputs ? overrideInputs : undefined;
      if (overrides) setInputs(overrides);
      const sourceInputs = overrides || inputs;
      // Where to land if generation fails — back to the lane the user came from.
      const returnStep = AppStep.FAST_TRACK;
      const cleanedInputs = sanitizeUnknown(sourceInputs);

      // Fetch the profile once, up front: it's the authoritative source for tier and is
      // reused by generateSong below (no extra fetch).
      let profile: UserProfile | null = null;
      try {
          profile = await getUserProfile(session.user.email || '');
      } catch {
          // Non-fatal — public users can still generate with the app's key.
      }

      // Gate: skool-tier (community) members must supply their own Gemini key or the
      // generation pipeline fails server-side. Block BEFORE spending any credits, prompt
      // for the key, and auto-resume generation once they save it.
      const isSkool = String(profile?.tier || '').toLowerCase() === 'skool';
      if (isSkool && !hasGeminiKey()) {
          generationInFlightRef.current = false;
          pendingGenerateAfterKeyRef.current = true;
          setIsApiKeyModalOpen(true);
          return;
      }

      const canAfford = await hasEnoughCredits(session.user.email || '', COSTS.GENERATE_SONG);
      if (!canAfford) {
          generationInFlightRef.current = false;
          toast('Even ghosts need fuel — top up to keep the hooks coming.', 'error');
          setView(AppView.PRICING);
          return;
      }

      // Immediate UI reduction for better UX
      setCredits(prev => Math.max(0, prev - COSTS.GENERATE_SONG));

      setIsLoading(true);
      resetGenerationTelemetry("Song Ghost is listening...");
      setStep(AppStep.GENERATING);
      setGeneratedSong(''); // clear stale lyrics so the live-draft panel starts empty
      setLoadedSongId(null);
      setAlbumArt(null);

      try {
          const generator = generateSong(cleanedInputs, session.user.email || '', profile);
          
          for await (const chunk of generator) {
              if (typeof chunk === 'string' && chunk.startsWith('__STATUS__:')) {
                  updateGenerationTelemetry(chunk.replace('__STATUS__:', '').trim() || 'Processing...');
                  continue;
              }
              setGeneratedSong(chunk);
          }
          await deductCredits(session.user.email || '', COSTS.GENERATE_SONG, "song_generation");
          setStep(AppStep.SONG_DISPLAYED);
          hapticSuccess();
      } catch (err: any) {
          console.error(err);
          toast(`Generation failed: ${err.message} You weren't charged.`, { kind: 'error', actionLabel: 'Retry', onAction: () => handleGenerate() });
          // Reload the true balance — the optimistic deduction above is reverted server-side
          loadCredits();
          setStep(returnStep);
      } finally {
          setIsLoading(false);
          generationInFlightRef.current = false;
      }
  };

  // Closing the key modal clears any pending auto-resume so a later unrelated save
  // can't spuriously kick off a generation.
  const closeApiKeyModal = () => {
      setIsApiKeyModalOpen(false);
      pendingGenerateAfterKeyRef.current = false;
  };
  // If the modal was opened by the Generate gate, resume generation once a key is saved.
  const onApiKeySaved = () => {
      if (pendingGenerateAfterKeyRef.current) {
          pendingGenerateAfterKeyRef.current = false;
          handleGenerate();
      }
  };

  const handleStartOver = () => {
      setInputs(DEFAULT_INPUTS);
      setGeneratedSong('');

      setAlbumArt(null);
      setLoadedSongId(null);
      setStep(AppStep.FAST_TRACK);
      setView(AppView.STUDIO);
  };

  const openUtility = (section: UtilitySection, from: AppView) => {
    setUtilitySection(section);
    setUtilityReturnView(from);
    setView(AppView.HELP);
    setIsMenuOpen(false);
  };

  const persistSong = async (
    title: string,
    prompt: string,
    lyrics: string,
    art?: string,
    social?: any
  ) => {
    if (!session) return null;
    const result: any = await saveSong(
      session.user.email || "",
      title,
      prompt,
      lyrics,
      art,
      social,
      loadedSongId || undefined
    );
    const persistedId =
      result?.data?.[0]?.id ||
      result?.data?.id ||
      result?.id ||
      null;
    if (persistedId) setLoadedSongId(String(persistedId));
    return persistedId;
  };

  const isStorageLimitError = (err: any) =>
      /STORAGE LIMIT REACHED/i.test(String(err?.message || ''));

  const handleSave = async (title: string, prompt: string, lyrics: string, art?: string, social?: any) => {
      if (!session) { toast('Please sign in to save your session.', 'error'); return; }
      try {
          await persistSong(title, prompt, lyrics, art, social);
          toast('Session saved to library!', 'success');
      } catch (err: any) {
          if (isStorageLimitError(err)) {
              // 25-song cap: tell them plainly with a direct path to free a slot.
              toast(err.message, { kind: 'error', actionLabel: 'Open library', onAction: () => setView(AppView.PROFILE) });
          } else {
              toast('Could not save your session: ' + String(err?.message || 'please try again.'), 'error');
          }
      }
  };

  const handleAutoSaveArt = async (title: string, prompt: string, lyrics: string, art?: string) => {
      if (!session) return;
      try {
          await persistSong(title, prompt, lyrics, art, undefined);
      } catch (err: any) {
          // Auto-save must never crash the art flow. Surface the cap (the user's work
          // isn't actually saved), but stay quiet on transient errors — the explicit
          // Save button will report those.
          if (isStorageLimitError(err)) {
              toast(`${err.message} Your artwork was generated but not saved yet.`, { kind: 'error', actionLabel: 'Open library', onAction: () => setView(AppView.PROFILE) });
          } else {
              console.error('Auto-save failed:', err?.message || err);
          }
      }
  };

  const handleAuth = async (e: React.FormEvent) => {
      e.preventDefault();
      const cleanEmail = sanitizeEmail(authEmail);
      const cleanPassword = sanitizeText(authPassword, 200);
      const cleanReferral = sanitizeText(referralCode, 64);
      if (!cleanEmail || !cleanPassword) return;
      setAuthError(null);
      setIsAuthLoading(true);
      try {
          const { data, error } = isSignUpMode
            ? await signUp(cleanEmail, cleanPassword, cleanReferral)
            : await signIn(cleanEmail, cleanPassword);
          if (error) throw error;
          if (data?.session) {
            // Apply pending tier from community code if validated
            const savedTier = localStorage.getItem('sg_pending_tier');
            if (savedTier === 'skool') {
              try {
                await apiFetch('/api/db', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'db', dbAction: 'setProfileTier', payload: { email: data.session.user.email, tier: 'skool' } }),
                });
                localStorage.removeItem('sg_pending_tier');
              } catch (e) { console.error('Failed to set tier:', e); }
            }
            setSession(data.session);
            setView(AppView.LANDING);
            const c = await getUserCredits(data.session.user.email || '');
            setCredits(c);
            promptForGeminiApiKeyIfMissing(data.session.user.email || '');
          }
      } catch (e: any) {
          setAuthError(e?.message || 'Authentication failed');
      } finally {
          setIsAuthLoading(false);
      }
  };

  // Handle manual paste import with intelligent structuring
  const handlePasteImport = async () => {
      const cleanPasteContent = sanitizeText(pasteContent, 12000);
      if (!cleanPasteContent.trim()) return;

      if (!session) return;
      if (generationInFlightRef.current) return;
      generationInFlightRef.current = true;
      const cleanedInputs = sanitizeUnknown(inputs);

      // Fetch profile up front (authoritative tier + reused below).
      let profile: UserProfile | null = null;
      try {
          profile = await getUserProfile(session.user.email || '');
      } catch {
          // Non-fatal for public users.
      }

      // Same key gate as Generate: skool members must supply their own Gemini key.
      const isSkool = String(profile?.tier || '').toLowerCase() === 'skool';
      if (isSkool && !hasGeminiKey()) {
          generationInFlightRef.current = false;
          setIsApiKeyModalOpen(true);
          return;
      }

      // Cost of "Structuring" is treated as a FULL GENERATION (5 credits) as it builds the song.
      const canAfford = await hasEnoughCredits(session.user.email || '', COSTS.GENERATE_SONG);
      if (!canAfford) {
          generationInFlightRef.current = false;
          toast('Even ghosts need fuel — top up to keep the hooks coming.', 'error');
          setView(AppView.PRICING);
          return;
      }

      setIsLoading(true);
      resetGenerationTelemetry("Analyzing Structure & Formatting...");
      setStep(AppStep.GENERATING);
      setIsPasteMode(false); // Close the modal
      setView(AppView.STUDIO); // Switch context to studio

      try {
          const generator = structureImportedSong(cleanPasteContent, session.user.email || '', cleanedInputs, profile);
          
          for await (const chunk of generator) {
              if (typeof chunk === 'string' && chunk.startsWith('__STATUS__:')) {
                  updateGenerationTelemetry(chunk.replace('__STATUS__:', '').trim() || 'Processing...');
                  continue;
              }
              setGeneratedSong(chunk);
          }
          // Deduct credits for the AI service
          await deductCredits(session.user.email || '', COSTS.GENERATE_SONG, "song_generation");
          setCredits(prev => Math.max(0, prev - COSTS.GENERATE_SONG));

          setInputs(DEFAULT_INPUTS);
          setAlbumArt(null);
          setLoadedSongId(null);
          setStep(AppStep.SONG_DISPLAYED);
      } catch (e: any) {
          console.error(e);
          toast('Import failed: ' + e.message, 'error');
          setStep(AppStep.FAST_TRACK); // Fallback
          setView(AppView.LANDING);
      } finally {
          setIsLoading(false);
          setPasteContent('');
          generationInFlightRef.current = false;
      }
  };

  if (!introComplete) {
    return <IntroAnimation onComplete={() => {
      try { window.sessionStorage.setItem('sg_intro_seen', '1'); } catch {}
      setIntroComplete(true);
    }} />;
  }

  if (!session || view === AppView.AUTH) {
    return (
      <>
        <div className="app-shell min-h-screen flex flex-col items-center justify-center p-3 sm:p-4 relative overflow-hidden safe-top safe-bottom safe-x">
          <div className="relative z-10 w-full max-w-xl rounded-[2rem] border border-slate-800/80 bg-[#141110]/95 shadow-[0_24px_90px_rgba(0,0,0,0.62)] overflow-hidden">
          <div className="p-6 sm:p-9">
            <div className="flex justify-center mb-4"><Logo size={68} /></div>
            <h1 className="heading-display text-3xl sm:text-4xl font-black text-center tracking-tight text-white mb-3">Write. Refine. Release.</h1>
            <p className="text-center text-slate-400 text-base sm:text-lg mb-2">Song Ghost helps you draft lyrics, polish structure, and generate cover art in a cohesive style.</p>
            <p className="text-center text-slate-500 text-xs font-black uppercase tracking-[0.18em] mb-8">{isSignUpMode ? 'Create your Song Ghost account' : 'Sign in to Song Ghost'}</p>

            <>
              {communityCodeValidated ? (
                <div className="mb-6 rounded-xl border border-emerald-400/70 bg-emerald-900/35 px-5 py-4 text-center animate-fade-in shadow-[0_0_0_1px_rgba(74,222,128,0.25)]">
                  <p className="text-emerald-200 font-black text-sm uppercase tracking-widest mb-1">Community Access Unlocked</p>
                  <p className="text-emerald-100 text-xs font-semibold">Community Discount Active — 100 monthly credits + 50% off all purchases</p>
                </div>
              ) : showCommunityCode ? (
                <div className="mb-6 animate-fade-in rounded-xl border border-cyan-400/45 bg-cyan-950/20 p-3">
                  <p className="text-cyan-100 text-xs font-black uppercase tracking-[0.18em] mb-2">Community Code</p>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Enter community code"
                      value={communityCode}
                      onChange={(e) => { setCommunityCode(e.target.value.toUpperCase()); setCommunityCodeError(null); }}
                      className="flex-1 bg-[#1d1815] border border-cyan-300/45 p-3 rounded-xl text-white outline-none focus:border-cyan-200 text-sm placeholder:text-slate-400 transition-all uppercase tracking-widest"
                    />
                    <button
                      type="button"
                      disabled={!communityCode.trim() || isAuthLoading}
                      onClick={async () => {
                        setIsAuthLoading(true);
                        setCommunityCodeError(null);
                        try {
                          const res = await apiFetch('/api/auth', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'validateCommunityCode', code: communityCode.trim() }),
                          });
                          const text = await res.text();
                          let json: any = {};
                          try {
                            json = text ? JSON.parse(text) : {};
                          } catch {
                            json = { error: text || 'Community code validation failed' };
                          }
                          if (!res.ok) {
                            setCommunityCodeError(json?.error || 'Validation failed');
                            return;
                          }
                          if (json.data?.valid) {
                            setCommunityCodeValidated(true);
                            setPendingTier(json.data.tier);
                            localStorage.setItem('sg_pending_tier', json.data.tier);
                          } else {
                            setCommunityCodeError('Invalid or expired code');
                          }
                        } catch (e) {
                          setCommunityCodeError('Validation failed');
                        } finally {
                          setIsAuthLoading(false);
                        }
                      }}
                      className="px-5 h-12 rounded-xl bg-cyan-300 text-slate-950 font-black text-sm active:bg-cyan-200 transition-all disabled:opacity-50"
                    >
                      Verify
                    </button>
                  </div>
                  {communityCodeError && <p className="text-rose-300 text-xs font-semibold mt-1">{communityCodeError}</p>}
                  <button type="button" onClick={() => setShowCommunityCode(false)} className="text-slate-300 text-xs font-semibold active:text-white mt-1">Cancel</button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCommunityCode(true)}
                  className="community-code-cta w-full mb-5 rounded-xl border border-cyan-400/55 bg-cyan-950/30 px-4 py-3 text-center text-cyan-100 text-sm font-black uppercase tracking-[0.12em] active:border-cyan-300 active:bg-cyan-900/35 transition-colors"
                >
                  Have a community code?
                </button>
              )}

              <div className="grid grid-cols-5 gap-2 sm:gap-3 mb-7">
                {[
                  { name: 'Apple', provider: 'apple', icon: <AuthAppleIcon /> },
                  { name: 'Discord', provider: 'discord', icon: <AuthDiscordIcon /> },
                  { name: 'Facebook', provider: 'facebook', icon: <AuthFacebookIcon /> },
                  { name: 'Google', provider: 'google', icon: <AuthGoogleIcon /> },
                  { name: 'Microsoft', provider: 'microsoft', icon: <AuthMicrosoftIcon /> },
                ].map((provider) => (
                  <button
                    key={provider.name}
                    type="button"
                    onClick={() => handleOAuthProvider(provider.provider)}
                    disabled={isAuthLoading}
                    className="h-12 rounded-xl border border-slate-700/90 bg-[#141028] text-slate-300 flex items-center justify-center active:border-slate-500 active:text-white transition-all"
                    aria-label={`${provider.name} sign in`}
                    title={`${provider.name} sign in`}
                  >
                    {provider.icon}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="h-px flex-1 bg-slate-800"></div>
                <span className="text-slate-500 text-base">or</span>
                <div className="h-px flex-1 bg-slate-800"></div>
              </div>

              <form onSubmit={handleAuth} className="space-y-5">
                {authError && (
                  <div className="rounded-xl border border-rose-500/40 bg-rose-900/20 px-4 py-3 text-sm text-rose-200">
                    {authError}
                  </div>
                )}
                <div>
                  <label className="block text-left text-white font-semibold mb-2.5 text-lg">Email</label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full bg-[#1d1815] border border-slate-700 p-4 rounded-xl text-white outline-none focus:border-orange-400 text-base placeholder:text-slate-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-left text-white font-semibold mb-2.5 text-lg">Password</label>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full bg-[#1d1815] border border-slate-700 p-4 rounded-xl text-white outline-none focus:border-orange-400 text-base placeholder:text-slate-500 transition-all"
                    required
                    minLength={8}
                  />
                </div>
                {isSignUpMode && (
                  <div>
                    <label className="block text-left text-white font-semibold mb-2.5 text-lg">Referral Code (optional)</label>
                    <input
                      type="text"
                      placeholder="Enter referral code"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      className="w-full bg-[#1d1815] border border-slate-700 p-4 rounded-xl text-white outline-none focus:border-orange-400 text-base placeholder:text-slate-500 transition-all"
                    />
                  </div>
                )}
                <button
                  disabled={isAuthLoading}
                  className="w-full h-14 rounded-xl bg-white text-black font-black text-xl active:bg-slate-200 transition-all disabled:opacity-70 flex items-center justify-center"
                >
                  {isAuthLoading ? <LoadingSpinner /> : (isSignUpMode ? 'Create Account' : 'Continue')}
                </button>
              </form>
            </>
          </div>

          <div className="border-t border-slate-800 p-5 sm:p-6 bg-[#0e0c20]">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <p className="text-slate-400 text-base sm:text-lg">{isSignUpMode ? 'Already have an account?' : "Don't have an account?"}</p>
              <button
                type="button"
                onClick={() => {
                  setIsSignUpMode((v) => !v);
                  setAuthError(null);
                }}
                className="w-full sm:w-auto px-10 h-12 rounded-xl bg-white text-black font-black text-xl"
              >
                {isSignUpMode ? 'Sign in' : 'Sign up'}
              </button>
            </div>
            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setTermsReturnView(AppView.AUTH);
                  setView(AppView.TERMS);
                }}
                className="text-sm text-slate-500 active:text-slate-300"
              >
                By continuing, you accept our Privacy Policy and Terms
              </button>
            </div>
          </div>
          </div>
        </div>
        <AskAndreWidget email={session?.user?.email || ''} />
    <ApiKeyModal isOpen={isApiKeyModalOpen} onClose={closeApiKeyModal} onSaved={onApiKeySaved} />
      </>
    );
  }

  if (view === AppView.TERMS) {
      return (
        <>
          <TermsAndPrivacy onBack={() => setView(termsReturnView)} />
          <AskAndreWidget email={session?.user?.email || ''} />
    <ApiKeyModal isOpen={isApiKeyModalOpen} onClose={closeApiKeyModal} onSaved={onApiKeySaved} />
        </>
      );
  }

  if (view === AppView.HELP && session) {
      return (
        <>
          <div className="app-shell min-h-screen text-slate-200 safe-top safe-bottom safe-x">
            <UtilityHub
              email={session.user.email}
              section={utilitySection}
              onBack={() => setView(utilityReturnView)}
              onOpenTerms={() => {
                setTermsReturnView(AppView.HELP);
                setView(AppView.TERMS);
              }}
            />
          </div>
          <AskAndreWidget email={session?.user?.email || ''} />
    <ApiKeyModal isOpen={isApiKeyModalOpen} onClose={closeApiKeyModal} onSaved={onApiKeySaved} />
        </>
      );
  }

  if (view === AppView.PRICING) {
      return (
        <>
          <PricingView
            email={session.user.email}
            onClose={() => setView(AppView.LANDING)}
            onPurchaseComplete={() => {}}
            onOpenTerms={() => { setTermsReturnView(AppView.PRICING); setView(AppView.TERMS); }}
          />
          <AskAndreWidget email={session?.user?.email || ''} />
    <ApiKeyModal isOpen={isApiKeyModalOpen} onClose={closeApiKeyModal} onSaved={onApiKeySaved} />
        </>
      );
  }

  if (view === AppView.PROFILE) {
      return (
        <>
          <ProfileView email={session.user.email} onLoadSong={(s) => {
            setInputs({ ...DEFAULT_INPUTS, genre: 'Loaded Song' }); 
            setGeneratedSong(`Title: ${s.title || 'Untitled'}\n\n### SUNO Prompt\n${s.suno_prompt || ''}\n\n### Lyrics\n${s.lyrics || ''}`);
      
            setAlbumArt(s.album_art || null);
            setLoadedSongId(s.id);
            setView(AppView.STUDIO);
            setStep(AppStep.SONG_DISPLAYED);
          }} onBack={() => setView(AppView.LANDING)} onSignOut={() => signOut().then(() => { setSession(null); setView(AppView.AUTH); setHeaderAvatarUrl(null); })} onProfileUpdate={(updated) => setHeaderAvatarUrl(updated?.avatar_url || null)} onBuyCredits={() => setView(AppView.PRICING)} onCreateNew={() => { setView(AppView.STUDIO); setStep(AppStep.FAST_TRACK); setInputs(DEFAULT_INPUTS); }} />
          <AskAndreWidget email={session?.user?.email || ''} />
    <ApiKeyModal isOpen={isApiKeyModalOpen} onClose={closeApiKeyModal} onSaved={onApiKeySaved} />
        </>
      );
  }

  if (view === AppView.LANDING) {
      return (
        <>
        <div className="app-shell min-h-screen text-slate-200 font-sans selection:bg-amber-500/30 relative overflow-hidden flex flex-col items-center justify-center p-4 md:p-6 safe-top safe-bottom safe-x">

             {isPasteMode ? (
                 <div className="glass-panel-strong relative z-10 w-full max-w-2xl p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] animate-fade-in shadow-emerald-900/20">
                     <h2 className="text-2xl font-black text-white tracking-tight mb-2">Import & Structure Session</h2>
                     <p className="text-slate-500 text-sm font-black uppercase tracking-widest mb-6">Paste lyrics, choruses, verses, or just an idea — pick a genre and room, and we structure it into that style while keeping your words.</p>

                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                         <label className="flex flex-col gap-1.5">
                             <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Language</span>
                             <select
                                 value={inputs.language || 'English'}
                                 onChange={(e) => setInputs(prev => ({ ...prev, language: e.target.value, genre: '', subGenre: '' }))}
                                 className="bg-[#1d1815] border border-slate-800 rounded-2xl px-4 py-3 text-slate-200 focus:border-emerald-500 outline-none text-sm"
                             >
                                 {LANGUAGE_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                             </select>
                         </label>
                         <label className="flex flex-col gap-1.5">
                             <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Genre</span>
                             <select
                                 value={inputs.genre || ''}
                                 onChange={(e) => setInputs(prev => ({ ...prev, genre: e.target.value, subGenre: '' }))}
                                 className="bg-[#1d1815] border border-slate-800 rounded-2xl px-4 py-3 text-slate-200 focus:border-emerald-500 outline-none text-sm"
                             >
                                 <option value="">Auto / no genre</option>
                                 {importGenreChips.map((g) => <option key={g} value={g}>{g}</option>)}
                             </select>
                         </label>
                         <label className="flex flex-col gap-1.5">
                             <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Room{importRooms.length ? '' : ' (pick a genre)'}</span>
                             <select
                                 value={inputs.subGenre || ''}
                                 disabled={!importRooms.length}
                                 onChange={(e) => setInputs(prev => ({ ...prev, subGenre: e.target.value }))}
                                 className="bg-[#1d1815] border border-slate-800 rounded-2xl px-4 py-3 text-slate-200 focus:border-emerald-500 outline-none text-sm disabled:opacity-40"
                             >
                                 <option value="">Auto (best room)</option>
                                 {importRooms.map((r) => <option key={r.name} value={r.name}>{r.name}</option>)}
                             </select>
                         </label>
                     </div>

                     <textarea
                        className="w-full h-64 bg-[#1d1815] border border-slate-800 rounded-3xl p-6 text-slate-300 focus:border-emerald-500 outline-none resize-none mb-6 font-mono text-sm shadow-inner"
                        placeholder="Paste your lyrics or raw ideas here..."
                        value={pasteContent}
                        onChange={(e) => setPasteContent(e.target.value)}
                        autoFocus
                     />
                     
                     <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                         <button onClick={handlePasteImport} disabled={isLoading} className="cta-primary flex-1 py-4 rounded-2xl font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                             {isLoading ? 'Structuring…' : `Structure Song (${COSTS.GENERATE_SONG} Credits)`}
                         </button>
                         <button onClick={() => { setIsPasteMode(false); setPasteContent(''); }} className="cta-secondary flex-1 py-4 rounded-2xl text-slate-300 font-black uppercase tracking-widest transition-all">
                             Cancel
                         </button>
                     </div>
                 </div>
             ) : (
                     <div className="relative z-10 w-full max-w-4xl animate-fade-in text-center">
                     <div className="mb-12 flex flex-col items-center relative">
                        <button
                          onClick={() => setIsMenuOpen((v) => !v)}
                          className="absolute -top-4 right-0 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 active:text-white"
                        >
                          Menu
                        </button>
                        {headerAvatarUrl ? (
                          <img
                            src={headerAvatarUrl}
                            alt="Your avatar"
                            className="mb-6 w-[100px] h-[100px] rounded-full object-cover border border-slate-600/70 shadow-[0_0_28px_rgba(56,189,248,0.2)]"
                          />
                        ) : (
                          <Logo size={100} className="mb-6" />
                        )}
                        <h1 className="heading-display text-4xl md:text-5xl font-bold text-slate-100 tracking-tight mb-2">Write. Refine. Release.</h1>
                        <p className="text-slate-500 text-sm mt-1">Song Ghost helps you draft lyrics, polish structure, and generate cover art in a cohesive style.</p>
                        <p className="mt-3 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-[11px] font-bold uppercase tracking-widest">Your first songs are on us — no setup, no API keys</p>
                     </div>

                     {/* New Song — the single dominant action. */}
                     <button
                        onClick={() => { hapticLight(); setView(AppView.STUDIO); setStep(AppStep.FAST_TRACK); setInputs(DEFAULT_INPUTS); }}
                        className="cta-primary group w-full p-8 md:p-10 rounded-[2rem] md:rounded-[2.5rem] flex flex-col items-center gap-3 transition-all active:scale-[0.99] relative overflow-hidden"
                     >
                         <GhostIcon className="h-10 w-10" />
                         <h3 className="heading-display text-2xl font-bold tracking-tight">New Song</h3>
                         <p className="text-xs font-bold uppercase tracking-widest opacity-70">Genre + your story. Done.</p>
                     </button>

                     {/* Secondary actions — hairline list rows, not competing cards. */}
                     <div className="mt-4 rounded-2xl border border-slate-800 divide-y divide-slate-800 overflow-hidden text-left">
                         <button
                            onClick={() => setIsPasteMode(true)}
                            className="w-full flex items-center gap-4 px-5 py-4 bg-slate-900/40 active:bg-slate-800/60 transition-colors"
                         >
                             <span className="w-10 h-10 rounded-full bg-slate-800 text-cyan-300 flex items-center justify-center shrink-0"><EditIcon /></span>
                             <span className="flex-1">
                                 <span className="block text-sm font-bold text-slate-100">Paste / Import</span>
                                 <span className="block text-xs text-slate-500">Structure lyrics &amp; ideas you already have</span>
                             </span>
                         </button>
                         <button
                            onClick={() => setView(AppView.PROFILE)}
                            className="w-full flex items-center gap-4 px-5 py-4 bg-slate-900/40 active:bg-slate-800/60 transition-colors"
                         >
                             <span className="w-10 h-10 rounded-full bg-slate-800 text-cyan-300 flex items-center justify-center shrink-0"><ClockIcon /></span>
                             <span className="flex-1">
                                 <span className="block text-sm font-bold text-slate-100">Discography</span>
                                 <span className="block text-xs text-slate-500">View past sessions</span>
                             </span>
                         </button>
                     </div>

                     <div className="mt-10 flex flex-wrap justify-center gap-4 md:gap-6">
                         <div className="flex items-center gap-2 px-5 py-2 bg-slate-900 rounded-full border border-slate-800">
                             <WalletIcon className="w-4 h-4 text-slate-500" />
                             <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Balance: {formatCredits(credits)}</span>
                         </div>
                         {!isNative() && (
                           <button onClick={handleManageGeminiApiKey} className="text-xs font-bold text-slate-400 uppercase tracking-widest active:text-white transition-colors">Set AI Key</button>
                         )}
                         <button onClick={() => signOut().then(() => { setSession(null); setView(AppView.AUTH); })} className="text-xs font-bold text-slate-600 uppercase tracking-widest active:text-white transition-colors">Sign Out</button>
                     </div>
                 </div>
             )}

             <MenuDrawer
               isOpen={isMenuOpen}
               onClose={() => setIsMenuOpen(false)}
               onSetAiKey={handleManageGeminiApiKey}
               onOpenUtility={(section) => openUtility(section, AppView.LANDING)}
             />
        </div>
        <AskAndreWidget email={session?.user?.email || ''} />
    <ApiKeyModal isOpen={isApiKeyModalOpen} onClose={closeApiKeyModal} onSaved={onApiKeySaved} />
        </>
      );
  }

  // STUDIO VIEW
  return (
    <>
    <div className="app-shell min-h-screen text-slate-200 font-sans selection:bg-amber-500/30 relative overflow-x-hidden safe-x">

      {/* Header */}
      <nav className="glass-panel relative z-50 p-4 md:p-6 mt-3 flex justify-between items-center max-w-7xl mx-auto rounded-2xl md:rounded-3xl gap-3 safe-top">
         <div onClick={() => setView(AppView.LANDING)} className="cursor-pointer active:opacity-80 transition-opacity">
            {headerAvatarUrl ? (
              <img
                src={headerAvatarUrl}
                alt="Your avatar"
                className="w-12 h-12 rounded-full object-cover border border-slate-600/70"
              />
            ) : (
              <Logo size={48} />
            )}
         </div>
         <div className="flex items-center gap-2 md:gap-4">
             <div className="md:hidden flex items-center gap-1 px-3 py-2 rounded-full bg-slate-900 border border-slate-800 text-cyan-400">
                <WalletIcon className="w-3.5 h-3.5" />
                <span className="text-[11px] font-black tracking-wider tabular-nums">{formatCredits(credits)}</span>
             </div>
             {/* Credit Monitor & Add Button */}
             <div className="hidden md:flex items-center bg-[#171310] border border-slate-800 rounded-full p-1 pl-1 pr-4 gap-3 shadow-inner">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 border border-slate-700 text-cyan-400">
                    <WalletIcon className="w-4 h-4" />
                    <span className="text-sm font-black tracking-widest tabular-nums">{formatCredits(credits)}</span>
                </div>
                <button onClick={() => setView(AppView.PRICING)} className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 active:text-white transition-colors">
                    Add Credits
                </button>
             </div>

             <button onClick={() => setView(AppView.PROFILE)} className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 active:bg-slate-700 active:text-white transition-all overflow-hidden border border-slate-700">
                 {headerAvatarUrl ? (
                   <img src={headerAvatarUrl} alt="Profile avatar" className="w-full h-full object-cover" />
                 ) : (
                   <ProfileIcon />
                 )}
             </button>
             <button
               onClick={() => setIsMenuOpen((v) => !v)}
               className="h-10 px-3 rounded-xl bg-slate-800 text-slate-300 active:bg-slate-700 active:text-white"
             >
               Menu
             </button>
         </div>
      </nav>

      <MenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onSetAiKey={handleManageGeminiApiKey}
        onOpenUtility={(section) => openUtility(section, AppView.STUDIO)}
      />

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
                onAutoSaveArt={handleAutoSaveArt}
                onResizePrompt={async () => {}}
                onGenerateArt={async (t, p, aspectRatio) => generateAlbumArt(
                  t,
                  p,
                  `${inputs.artStyle || 'Realism'}`,
                  aspectRatio,
                  `${session?.user?.email || ''}`,
                  headerAvatarUrl || undefined
                )}
                onGenerateSocial={async (t, l) => generateSocialPack(t, l, `${session?.user?.email || ''}`)}
                onTranslate={(txt, lang) => translateLyrics(txt, lang, `${session?.user?.email || ''}`)}
                refreshCredits={loadCredits}
                isResizing={false}
                email={session?.user?.email || ''}
                currentInputs={inputs}
              />
          ) : step === AppStep.GENERATING ? (
              <div className="relative w-full max-w-sm mx-auto flex flex-col items-center justify-center text-center min-h-[75vh] px-6">
                  <div
                    className="absolute top-[14%] left-1/2 -translate-x-1/2 w-72 h-72 rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(226,153,60,0.22) 0%, rgba(226,153,60,0.06) 45%, transparent 72%)' }}
                  />
                  <GhostIcon className="relative z-10 h-28 w-auto text-amber-400 ghost-glow-anim" />

                  <div className="relative z-10 flex items-end gap-1.5 mt-8 h-16">
                    {[16, 32, 52, 26, 44, 64, 36, 56, 22, 48, 20, 38, 14].map((h, i) => (
                      <div
                        key={i}
                        className={`vu-bar w-1.5 rounded-t-sm ${i % 3 === 1 ? 'bg-cyan-400' : i % 5 === 0 ? 'bg-amber-300' : 'bg-amber-500'}`}
                        style={{ height: `${h}px`, animationDelay: `${i * 90}ms` }}
                      />
                    ))}
                  </div>

                  <h2
                    className="relative z-10 heading-display mt-7 text-xl font-semibold text-amber-300"
                    style={{ textShadow: '0 0 22px rgba(226,153,60,0.5)' }}
                  >
                    {(GENERATION_STAGES[generationStageIndex] || GENERATION_STAGES[0]).label}…
                  </h2>

                  <div className="relative z-10 mt-6 w-full max-w-[260px] flex flex-col gap-1.5 text-left">
                    {GENERATION_STAGES.map((stage, idx) => {
                      const isDone = idx < generationStageIndex;
                      const isActive = idx === generationStageIndex;
                      return (
                        <div
                          key={stage.label}
                          className={`flex items-center gap-2.5 text-[13px] py-1 ${
                            isActive ? 'text-amber-300 font-bold' : isDone ? 'text-slate-400' : 'text-slate-600'
                          }`}
                        >
                          <span className={`w-4 text-center text-[13px] ${isDone ? 'text-cyan-400' : isActive ? 'text-amber-400' : ''}`}>
                            {isDone ? '✓' : isActive ? '▸' : '•'}
                          </span>
                          {stage.label}
                        </div>
                      );
                    })}
                  </div>

                  <p className="relative z-10 mt-7 text-xs text-slate-500">
                    Ghost is writing — this usually takes 20 seconds.
                  </p>
              </div>
          ) : step === AppStep.FAST_TRACK ? (
              <FastTrackCreate
                isGenerating={isLoading}
                credits={credits}
                onGenerate={(builtInputs) => handleGenerate(builtInputs)}
                onCustomize={() => { hapticLight(); setStep(AppStep.AWAITING_LANGUAGE); }}
              />
          ) : (
              <SongBuilder
                isGenerating={isLoading}
                email={session?.user?.email || ''}
                onGenerate={(builtInputs) => handleGenerate(builtInputs)}
              />
          )}
      </div>
    </div>
    <AskAndreWidget email={session?.user?.email || ''} />
    <ApiKeyModal isOpen={isApiKeyModalOpen} onClose={closeApiKeyModal} onSaved={onApiKeySaved} />
    </>
  );
};
