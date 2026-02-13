export type CultureRegion =
  | 'Global'
  | 'US/Canada'
  | 'UK/Ireland'
  | 'Caribbean'
  | 'Mexico'
  | 'Brazil'
  | 'Portugal'
  | 'France'
  | 'Germany'
  | 'Italy'
  | 'Japan'
  | 'Korea'
  | 'China'
  | 'Hong Kong'
  | 'MENA'
  | 'India'
  | 'East Africa'
  | 'West Africa';

export type BaseCulture = 'Latin' | 'Asian' | 'African' | 'European' | 'General';
export type BaseEnv = 'Urban' | 'Traditional' | 'Pop' | 'General';

export type RegisterLevel = 'clean' | 'radio' | 'explicit';
export type SlangLevel = 'none' | 'light' | 'medium' | 'heavy';

export type GenreProfile = {
  genre: string;
  tags: string[];
  defaultStructure: string;
  prosody: string;
  rhymeGuidance: string;
  hookGuidance: string;
  lexiconPolicy: string;
};

export type SubgenreSonicProfile = {
  subGenre: string;
  bpmRange: string;
  groove: string;
  instrumentation: string;
  productionStyle: string;
  arrangement: string;
};

export type LanguageProfile = {
  language: string;
  scriptHint?: string;
  defaultRegion: CultureRegion;
  baseCulture: BaseCulture;
  notes: string;
};

export type InferredWritingProfile = {
  language: string;
  languageVariant: string;
  cultureRegion: CultureRegion;
  register: RegisterLevel;
  slang: SlangLevel;
  codeSwitchPolicy: string;
  authenticityGuardrails: string;
};

export const LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Japanese',
  'Korean',
  'Chinese',
  'Portuguese',
  'Italian',
  'Arabic',
  'Hindi',
  'Swahili'
] as const;

export const GENRES_BY_LANG: Record<(typeof LANGUAGES)[number], string[]> = {
  English: ['Pop', 'Hip-Hop', 'Rock', 'R&B', 'Country', 'Electronic/EDM', 'Metal', 'Soul', 'Folk', 'Afrobeats', 'Reggae', 'Gospel', 'Blues', 'Jazz'],
  Spanish: ['Reggaeton', 'Bachata', 'Salsa', 'Merengue', 'Latin Trap', 'Flamenco', 'Latin Pop', 'Cumbia', 'Regional Mexican'],
  French: ['Chanson', 'French Touch', 'Afro-Trap', 'Indie Rock', 'Electro-Pop', 'Rap Français', 'Zouk', 'Variety'],
  German: ['Schlager', 'Neue Deutsche Härte', 'Techno', 'Hip-Hop', 'Indie', 'Krautrock', 'Deutschrock', 'Volksmusik'],
  Japanese: ['J-Pop', 'City Pop', 'Enka', 'Visual Kei', 'J-Rock', 'Idol Music', 'Anime OST', 'Kawaii Future Bass'],
  Korean: ['K-Pop', 'K-HipHop', 'Trot', 'K-Ballad', 'K-Indie', 'K-Rock', 'Trap', 'K-R&B'],
  Chinese: ['Mandopop', 'Cantopop', 'Guofeng (Fusion)', 'C-Pop', 'C-HipHop', 'Chinese Rock'],
  Portuguese: ['Samba', 'Bossa Nova', 'Fado', 'Funk Carioca', 'Sertanejo', 'MPB', 'Forró', 'Piseiro'],
  Italian: ['Italo-Disco', 'Opera Pop', 'Canzone Napoletana', 'Italian Trap', 'Sanremo Pop', 'Rock Italiano'],
  Arabic: ['Arabic Pop', 'Raï', 'Khaliji', 'Maqam Fusion', 'Mahraganat', 'Dabke', 'Classical Arabic', 'Shaabi'],
  Hindi: ['Bollywood', 'Indi-Pop', 'Ghazal', 'Bhangra', 'Classical Fusion', 'Sufi', 'Desi Hip-Hop', 'Qawwali'],
  Swahili: ['Bongo Flava', 'Taarab', 'Gengetone', 'Swahili Gospel', 'Singeli']
};

export const SUBGENRES: Record<string, string[]> = {
  'Regional Mexican': ['Banda', 'Mariachi', 'Norteño', 'Duranguense', 'Corridos Tumbados', 'Sierreño', 'Ranchera'],
  Reggaeton: ['Old School Dembow', 'Modern Romantic', 'Latin Trap Fusion', 'Perreo', 'Moombahton'],
  Mandopop: ['Mandarin Ballad', 'Dance-Mandopop', 'Guofeng-Pop', 'Taiwanese Indie', 'City Mando'],
  Cantopop: ['Classic HK Ballad', '80s Retro Canto', 'Cantorock', 'HK Hip-Hop', 'TVB OST Style'],
  'Guofeng (Fusion)': ['Classical Poetic', 'Traditional Instrument Trap', 'Orchestral Guofeng', 'Silk Road Fusion'],
  'C-Pop': ['Mainstream Idol Pop', 'Mandarin R&B', 'Electronic C-Pop'],
  'Bongo Flava': ['Afro-Bongo', 'Bongo-Trap', 'Baibuda', 'Zouk-Flava', 'Coastal Chill'],
  Taarab: ['Modern Taarab', 'Traditional Coastal', 'Zanzibar Orchestra', 'Mduara Fusion'],
  Gengetone: ['Nairobi Club', 'Sheng Rap', 'Ghetto Anthem', 'Urban Slum Vibe'],
  Enka: ['Traditional Showa', 'Modern Enka', 'Shinto Folk', 'Nostalgic Enka'],
  Fado: ['Fado de Lisboa', 'Fado de Coimbra', 'Fado Novo', 'Saudade Acoustic'],
  Zouk: ['Zouk-Love', 'Kizomba', 'Kompa', 'Antilles Party', 'Tropical Urban'],
  'Afro-Trap': ['Ivorian Coupe-Decale', 'Parisian Street', 'Afro-Drill', 'Abidjan Vibz', 'Congo Fusion'],
  Pop: ['Synth-Pop', 'Hyper-Pop', 'Bedroom Pop', 'Dance-Pop', 'Indie Pop', 'Bubblegum Pop', 'Electropop', 'Soft Pop', 'Dream Pop', 'Teen Pop'],
  'Hip-Hop': ['Boom Bap', 'Trap', 'Drill', 'Conscious Hip-Hop', 'G-Funk', 'Emo Rap', 'Jazz Rap', 'Gangsta Rap'],
  'R&B': ['Contemporary R&B', 'Neo-Soul', 'Alternative R&B', 'New Jack Swing', 'Bedroom R&B', 'Soul', 'Funk'],
  Rock: ['Alternative Rock', 'Punk Rock', 'Grunge', 'Indie Rock', 'Classic Rock', 'Hard Rock', 'Psychedelic Rock'],
  'Electronic/EDM': ['House', 'Techno', 'Trance', 'Drum & Bass', 'Dubstep', 'Trap EDM', 'Future Bass', 'Electro', 'Ambient', 'Breakbeat', 'Synthwave', 'UK Garage', 'Experimental'],
  Country: ['Traditional Country', 'Honky-Tonk', 'Outlaw Country', 'Country Pop', 'Contemporary Nashville', 'Americana', 'Bluegrass', 'Alt-Country', 'Country Rock', 'Neo-Traditional', 'Singer-Songwriter Country', 'Western Swing'],
  Metal: ['Heavy Metal', 'Thrash', 'Death Metal', 'Black Metal', 'Doom', 'Power Metal', 'Progressive', 'Metalcore', 'Deathcore', 'Nu Metal', 'Symphonic', 'Gothic'],
  Soul: ['Motown', 'Southern Soul', 'Neo-Soul', 'Philly Soul', 'Northern Soul', 'Blue-Eyed Soul', 'Psychedelic Soul', 'Contemporary Soul'],
  Blues: ['Delta Blues', 'Chicago Blues', 'Texas Blues', 'Piedmont Blues', 'Jump Blues', 'Blues Rock', 'British Blues', 'Soul Blues', 'Modern Blues'],
  Jazz: ['Swing', 'Bebop', 'Hard Bop', 'Cool Jazz', 'Modal Jazz', 'Free Jazz', 'Latin Jazz', 'Fusion', 'Smooth Jazz', 'Vocal Jazz'],
  Folk: ['Traditional Folk', 'Contemporary Folk', 'Folk Rock', 'Indie Folk', 'Americana', 'Celtic Folk', 'Bluegrass', 'Folk Pop'],
  Gospel: ['Traditional Gospel', 'Contemporary Gospel', 'Gospel Blues', 'Southern Gospel', 'Pentecostal Gospel', 'Gospel Choir', 'Gospel Soul', 'Gospel-Jazz', 'Praise & Worship'],
  Afrobeats: ['Afro Pop', 'Afro-Fusion', 'Amapiano', 'Afro-House', 'Alté', 'Afro-R&B', 'Afro-Swing'],
  Reggae: ['Ska', 'Rocksteady', 'Roots Reggae', 'Dub', 'Dancehall', 'Lovers Rock', 'Reggae Fusion']
};

export const LANGUAGE_PROFILES: Record<string, LanguageProfile> = {
  English: { language: 'English', defaultRegion: 'US/Canada', baseCulture: 'General', notes: 'Prefer contemporary natural phrasing; avoid archaic idioms unless requested.' },
  Spanish: { language: 'Spanish', defaultRegion: 'Caribbean', baseCulture: 'Latin', notes: 'Keep idioms region-coherent; avoid overusing exclamations or caricature spellings.' },
  French: { language: 'French', defaultRegion: 'France', baseCulture: 'European', notes: 'Favor modern spoken lyricism; keep slang light unless explicitly requested.' },
  German: { language: 'German', defaultRegion: 'Germany', baseCulture: 'European', notes: 'Use natural contemporary German cadence; avoid forced anglicisms unless genre calls for it.' },
  Japanese: { language: 'Japanese', defaultRegion: 'Japan', baseCulture: 'Asian', scriptHint: 'Japanese (mix of kana/kanji)', notes: 'Use singable mora-timing; avoid overusing honorifics unless persona calls for it.' },
  Korean: { language: 'Korean', defaultRegion: 'Korea', baseCulture: 'Asian', scriptHint: 'Hangul', notes: 'Use modern colloquial phrasing; code-switch to English only when stylistically justified.' },
  Chinese: { language: 'Chinese', defaultRegion: 'China', baseCulture: 'Asian', scriptHint: 'Simplified Chinese', notes: 'Keep imagery concise and tonal-friendly; avoid awkward literal translations.' },
  Portuguese: { language: 'Portuguese', defaultRegion: 'Brazil', baseCulture: 'Latin', notes: 'Choose pt-BR vs pt-PT based on genre/subgenre; keep contractions natural.' },
  Italian: { language: 'Italian', defaultRegion: 'Italy', baseCulture: 'European', notes: 'Favor vivid concrete imagery; keep rhyme musical without sounding like a textbook.' },
  Arabic: { language: 'Arabic', defaultRegion: 'MENA', baseCulture: 'General', notes: 'Prefer a consistent register (MSA vs dialect). Default to accessible Modern Standard unless specified.' },
  Hindi: { language: 'Hindi', defaultRegion: 'India', baseCulture: 'Asian', notes: 'Bollywood-leaning metaphors are fine when genre suggests; keep Hinglish limited unless requested.' },
  Swahili: { language: 'Swahili', defaultRegion: 'East Africa', baseCulture: 'African', notes: 'Keep phrasing natural and singable; avoid mixing unrelated slangs unless specified.' }
};

const g = (genre: GenreProfile) => genre;

export const GENRE_PROFILES: Record<string, GenreProfile> = {
  // English core
  Pop: g({
    genre: 'Pop',
    tags: ['pop', 'hooky', 'radio', 'melodic'],
    defaultStructure: 'Intro → Verse → Pre → Chorus → Verse → Chorus → Bridge → Final Chorus → Outro',
    prosody: 'Balanced line lengths, clear stresses, easy-to-sing vowels, strong end-of-line cadence.',
    rhymeGuidance: 'Simple but satisfying end rhymes; occasional internal rhyme for lift.',
    hookGuidance: 'Short, repeatable chorus with a title phrase; aim for 2–3 melodic-sounding keywords.',
    lexiconPolicy: 'Contemporary, clear, minimal niche slang unless requested.'
  }),
  'Hip-Hop': g({
    genre: 'Hip-Hop',
    tags: ['urban', 'rhythmic', 'bars', 'punchy'],
    defaultStructure: 'Hook → Verse 1 (16) → Hook → Verse 2 (16) → Hook → Outro',
    prosody: 'Dense rhythmic syllables, varied cadence, space for ad-libs; avoid awkward multisyllable stretches.',
    rhymeGuidance: 'Internal rhyme + multisyllabic chains; end rhymes can be imperfect but intentional.',
    hookGuidance: 'Hook should be chantable; contrast verse density with simpler hook.',
    lexiconPolicy: 'Use natural contemporary slang at the chosen register; avoid stereotypes and overuse of catchphrases.'
  }),
  Rock: g({
    genre: 'Rock',
    tags: ['guitar', 'anthemic', 'live', 'edge'],
    defaultStructure: 'Verse → Chorus → Verse → Chorus → Bridge → Chorus (big) → Outro',
    prosody: 'Strong stressed downbeats; punchy phrases; leave room for instrumental breaks.',
    rhymeGuidance: 'End rhymes + occasional near rhyme; prioritize impact over perfect rhyme.',
    hookGuidance: 'Anthemic chorus with open vowels and a clear singalong line.',
    lexiconPolicy: 'Concrete imagery; avoid overly ornate poetry unless subgenre calls for it.'
  }),
  'R&B': g({
    genre: 'R&B',
    tags: ['soulful', 'melismatic', 'intimate', 'groove'],
    defaultStructure: 'Verse → Pre → Chorus → Verse → Chorus → Bridge → Chorus → Outro',
    prosody: 'Long vowels, smooth enjambment, conversational intimacy; space for runs.',
    rhymeGuidance: 'Soft rhymes, assonance, and internal echoes; don’t force hard end rhymes.',
    hookGuidance: 'Hook should feel like a confession; repeat a key emotional phrase.',
    lexiconPolicy: 'Modern romantic language; keep intimacy specific, not generic.'
  }),
  Country: g({
    genre: 'Country',
    tags: ['story', 'narrative', 'americana', 'plainspoken'],
    defaultStructure: 'Verse (story) → Chorus (thesis) → Verse → Chorus → Bridge (twist) → Final Chorus',
    prosody: 'Clear storytelling lines, natural speech rhythm, strong end stops.',
    rhymeGuidance: 'AABB / ABAB with clean end rhymes; keep phrasing natural.',
    hookGuidance: 'Chorus states the core message; memorable title line.',
    lexiconPolicy: 'Specific details, places, objects; avoid clichés unless subverted.'
  }),
  'Electronic/EDM': g({
    genre: 'Electronic/EDM',
    tags: ['dance', 'club', 'repeat', 'energy'],
    defaultStructure: 'Verse → Build → Drop/Hook → Verse → Build → Drop/Hook → Breakdown → Final Drop',
    prosody: 'Short phrases, rhythmic repetition, vowel-forward words that sit well on a four-on-the-floor.',
    rhymeGuidance: 'Simple rhymes; prioritize chantability.',
    hookGuidance: 'Mantra-like hook designed for repetition over narrative.',
    lexiconPolicy: 'High-energy, sensory, minimal story; avoid overlong lines.'
  }),
  Metal: g({
    genre: 'Metal',
    tags: ['aggressive', 'dark', 'power', 'theatrical'],
    defaultStructure: 'Verse → Chorus → Verse → Chorus → Breakdown → Chorus → Outro',
    prosody: 'Hard consonants, emphatic stresses, strong rhythmic chugs; allow screamed delivery.',
    rhymeGuidance: 'Near rhymes acceptable; prioritize imagery and impact.',
    hookGuidance: 'Chorus should be anthemic or ominous; keep key words punchy.',
    lexiconPolicy: 'Darker imagery; avoid shock-for-shock—make themes coherent.'
  }),
  Soul: g({
    genre: 'Soul',
    tags: ['warm', 'groove', 'classic', 'emotion'],
    defaultStructure: 'Verse → Chorus → Verse → Chorus → Bridge → Chorus → Outro',
    prosody: 'Strong melodic phrasing, call-and-response potential, big emotional arcs.',
    rhymeGuidance: 'Classic end rhymes; tasteful internal echoes.',
    hookGuidance: 'Hook carries the emotional thesis; repetition with variation.',
    lexiconPolicy: 'Warm, human, grounded; avoid overly abstract lines.'
  }),
  Folk: g({
    genre: 'Folk',
    tags: ['acoustic', 'poetic', 'story', 'intimate'],
    defaultStructure: 'Verse → Verse → Chorus → Verse → Chorus → Outro',
    prosody: 'Natural speech rhythm; lyrical detail; space for imagery.',
    rhymeGuidance: 'Light rhyme or none; prioritize narrative clarity.',
    hookGuidance: 'Soft, memorable refrain; less bombastic repetition.',
    lexiconPolicy: 'Specific sensory details; avoid pop tropes unless intentional.'
  }),
  Afrobeats: g({
    genre: 'Afrobeats',
    tags: ['dance', 'groove', 'call-response', 'sweet'],
    defaultStructure: 'Hook → Verse → Hook → Verse → Hook → Outro',
    prosody: 'Syncopated, bounce-forward phrasing; short melodic lines; playful repetition.',
    rhymeGuidance: 'Simple rhymes; rhythmic consonance; keep it fluid.',
    hookGuidance: 'Call-and-response hook; easy phrases suited for crowd singback.',
    lexiconPolicy: 'Joyful, vibey, confident; don’t force pidgin/dialect unless chosen.'
  }),
  Reggae: g({
    genre: 'Reggae',
    tags: ['one-drop', 'message', 'ease', 'community'],
    defaultStructure: 'Verse → Chorus → Verse → Chorus → Toast/Bridge → Chorus',
    prosody: 'Laid-back pacing; offbeat-friendly phrasing; room for chants.',
    rhymeGuidance: 'Simple end rhymes; repetition is fine.',
    hookGuidance: 'Chantable chorus; message-forward line.',
    lexiconPolicy: 'Keep language respectful and coherent; avoid caricature dialecting unless requested.'
  }),
  Gospel: g({
    genre: 'Gospel',
    tags: ['choir', 'uplift', 'testimony', 'call-response'],
    defaultStructure: 'Verse → Chorus → Verse → Chorus → Vamp (repeat/raise) → Outro',
    prosody: 'Big vowels; strong declarative lines; space for choir responses.',
    rhymeGuidance: 'Clear end rhymes; repetition for uplift.',
    hookGuidance: 'Anthemic chorus; call-and-response phrasing.',
    lexiconPolicy: 'Spiritual imagery; keep references tasteful and sincere.'
  }),
  Blues: g({
    genre: 'Blues',
    tags: ['12-bar', 'lament', 'plainspoken', 'grit'],
    defaultStructure: 'Verse (AAB) → Verse (AAB) → Turnaround → Outro',
    prosody: 'Short, direct lines; strong downbeats; room for instrumental replies.',
    rhymeGuidance: 'AAB patterns; repetition is core.',
    hookGuidance: 'Hook can be the repeated A line.',
    lexiconPolicy: 'Honest, grounded; avoid melodrama.'
  }),
  Jazz: g({
    genre: 'Jazz',
    tags: ['swing', 'noir', 'sophisticated', 'improv'],
    defaultStructure: 'Verse → Chorus → Verse → Chorus → Bridge → Chorus',
    prosody: 'Flexible phrasing; conversational elegance; room for scat/wordplay.',
    rhymeGuidance: 'Near rhyme and internal rhyme; don’t over-tighten.',
    hookGuidance: 'Hook can be a clever phrase or melodic refrain.',
    lexiconPolicy: 'Sophisticated imagery; avoid jargon overload.'
  }),

  // Spanish
  Reggaeton: g({
    genre: 'Reggaeton',
    tags: ['latin', 'dembow', 'club', 'swagger'],
    defaultStructure: 'Coro → Verso → Coro → Verso → Puente → Coro',
    prosody: 'Staccato phrasing that locks to dembow; short lines with punchy endings.',
    rhymeGuidance: 'Simple end rhymes; rhythmic consonance; avoid awkward literal rhymes.',
    hookGuidance: 'Coro should be repetitive and chantable; one signature line.',
    lexiconPolicy: 'Keep Spanish region-coherent; avoid cartoonish spellings; code-switch only if requested.'
  }),
  Bachata: g({
    genre: 'Bachata',
    tags: ['latin', 'romantic', 'guitar', 'heartbreak'],
    defaultStructure: 'Verso → Coro → Verso → Coro → Puente → Coro',
    prosody: 'Smooth romantic lines; longer vowels; emotional clarity.',
    rhymeGuidance: 'Clean end rhymes; avoid forcing slang.',
    hookGuidance: 'Coro is a confession; repeat a key heartbreak phrase.',
    lexiconPolicy: 'Romantic Spanish; keep it sincere, not generic.'
  }),
  Salsa: g({
    genre: 'Salsa',
    tags: ['latin', 'call-response', 'dance', 'brass'],
    defaultStructure: 'Verso → Coro → Soneo (improv) → Coro → Outro',
    prosody: 'Call-and-response lines; rhythmic clarity for fast percussion.',
    rhymeGuidance: 'Simple rhymes; repetition and response are primary.',
    hookGuidance: 'Coro is a chant; short repeated phrase.',
    lexiconPolicy: 'Keep idioms region-coherent; avoid forced “party” clichés.'
  }),
  Merengue: g({
    genre: 'Merengue',
    tags: ['latin', 'fast', 'party', 'accordion/brass'],
    defaultStructure: 'Verso → Coro → Verso → Coro → Puente → Coro',
    prosody: 'Very short lines; energetic repetition; clear stresses.',
    rhymeGuidance: 'Simple end rhymes; keep it bouncy.',
    hookGuidance: 'Coro is a shout-along; keep it minimal.',
    lexiconPolicy: 'Playful and clean by default; slang only if requested.'
  }),
  'Latin Trap': g({
    genre: 'Latin Trap',
    tags: ['latin', 'trap', 'urban', 'dark'],
    defaultStructure: 'Hook → Verse → Hook → Verse → Hook',
    prosody: 'Trap cadence; syncopation; space for ad-libs.',
    rhymeGuidance: 'Internal rhyme and assonance; allow near rhymes.',
    hookGuidance: 'Hook is minimal and moody; repeated motif.',
    lexiconPolicy: 'Spanish with optional code-switch only if requested; avoid caricature dialecting.'
  }),
  Flamenco: g({
    genre: 'Flamenco',
    tags: ['traditional', 'poetic', 'andalusian', 'lament'],
    defaultStructure: 'Copla → Estribillo → Copla → Estribillo → Remate',
    prosody: 'Poetic imagery; strong phrasing; room for melisma.',
    rhymeGuidance: 'Assonant rhyme acceptable; keep poetic cadence.',
    hookGuidance: 'Estribillo is a haunting refrain.',
    lexiconPolicy: 'Elevated poetic Spanish; avoid modern slang unless fusion is requested.'
  }),
  'Latin Pop': g({
    genre: 'Latin Pop',
    tags: ['latin', 'pop', 'radio', 'hooky'],
    defaultStructure: 'Verso → Pre → Coro → Verso → Coro → Puente → Coro',
    prosody: 'Pop-like clarity with Latin rhythmic bounce.',
    rhymeGuidance: 'Clean end rhymes; don’t force overly complex patterns.',
    hookGuidance: 'Coro centers the title; big melodic phrase.',
    lexiconPolicy: 'Modern Spanish; region-neutral by default.'
  }),
  Cumbia: g({
    genre: 'Cumbia',
    tags: ['latin', 'dance', 'story', 'groove'],
    defaultStructure: 'Verso → Coro → Verso → Coro → Puente → Coro',
    prosody: 'Mid-tempo bounce; short lines; playful storytelling.',
    rhymeGuidance: 'Simple rhymes; repetition encouraged.',
    hookGuidance: 'Coro is a dance instruction or romantic refrain.',
    lexiconPolicy: 'Plainspoken Spanish; avoid heavy slang by default.'
  }),
  'Regional Mexican': g({
    genre: 'Regional Mexican',
    tags: ['mexico', 'story', 'tradition', 'pride'],
    defaultStructure: 'Verso → Coro → Verso → Coro → Puente → Coro',
    prosody: 'Strong downbeat phrasing; narrative clarity; room for gritos/ad-libs optionally.',
    rhymeGuidance: 'Clear end rhymes; couplets common; keep it singable.',
    hookGuidance: 'Coro states pride/heartbreak thesis; memorable title line.',
    lexiconPolicy: 'Mexican Spanish by default; authentic everyday idioms; avoid parody.'
  }),

  // French
  Chanson: g({
    genre: 'Chanson',
    tags: ['french', 'lyrical', 'poetic', 'story'],
    defaultStructure: 'Couplet → Refrain → Couplet → Refrain → Pont → Refrain',
    prosody: 'Natural French cadence; lyrical phrasing with clear imagery.',
    rhymeGuidance: 'Light rhyme; avoid forcing perfect rhymes that sound unnatural.',
    hookGuidance: 'Refrain is a memorable phrase; often bittersweet.',
    lexiconPolicy: 'Modern but literary; slang light unless requested.'
  }),
  'French Touch': g({
    genre: 'French Touch',
    tags: ['electronic', 'funk', 'loop', 'cool'],
    defaultStructure: 'Verse → Hook → Verse → Hook → Break → Hook',
    prosody: 'Minimal, stylish phrases; repetition fits loops.',
    rhymeGuidance: 'Simple near-rhymes; keep it smooth.',
    hookGuidance: 'Hook is a short mantra.',
    lexiconPolicy: 'French with tasteful English lines only if it feels natural.'
  }),
  'Afro-Trap': g({
    genre: 'Afro-Trap',
    tags: ['french', 'urban', 'afro', 'trap'],
    defaultStructure: 'Hook → Verse → Hook → Verse → Hook',
    prosody: 'Trap cadence with Afro bounce; short punchy bars.',
    rhymeGuidance: 'Internal rhyme; end rhymes optional.',
    hookGuidance: 'Hook is chantable; rhythmic repetition.',
    lexiconPolicy: 'Modern French rap phrasing; avoid forced stereotypes or token words.'
  }),
  'Indie Rock': g({
    genre: 'Indie Rock',
    tags: ['indie', 'rock', 'alt', 'intimate'],
    defaultStructure: 'Verse → Chorus → Verse → Chorus → Bridge → Chorus',
    prosody: 'Conversational, slightly off-kilter phrasing; imagery-forward.',
    rhymeGuidance: 'Loose rhymes or none; keep it natural.',
    hookGuidance: 'Chorus is emotional pivot; less slogan, more feeling.',
    lexiconPolicy: 'Specific scenes and details; avoid generic “indie” clichés.'
  }),
  'Electro-Pop': g({
    genre: 'Electro-Pop',
    tags: ['electronic', 'pop', 'hooky', 'shiny'],
    defaultStructure: 'Verse → Pre → Chorus → Verse → Chorus → Bridge → Chorus',
    prosody: 'Short, bright phrases; clean cadence.',
    rhymeGuidance: 'Simple rhymes; keep it catchy.',
    hookGuidance: 'Big hook line; repeat the title.',
    lexiconPolicy: 'Modern pop language; avoid overcomplication.'
  }),
  'Rap Français': g({
    genre: 'Rap Français',
    tags: ['french', 'rap', 'bars', 'wordplay'],
    defaultStructure: 'Hook → Verse → Hook → Verse → Hook',
    prosody: 'Dense phrasing, clear articulation; punchlines and imagery.',
    rhymeGuidance: 'Internal rhyme and assonance; keep flow natural.',
    hookGuidance: 'Hook contrasts verse density; chantable line.',
    lexiconPolicy: 'Modern French; slang only when coherent; avoid caricature.'
  }),
  Variety: g({
    genre: 'Variety',
    tags: ['variety', 'melodic', 'broad'],
    defaultStructure: 'Verse → Chorus → Verse → Chorus → Bridge → Chorus',
    prosody: 'Balanced and accessible; prioritize singability.',
    rhymeGuidance: 'Clean rhymes; avoid forcing.',
    hookGuidance: 'Clear, memorable refrain.',
    lexiconPolicy: 'Broad, accessible language.'
  }),

  // German
  Schlager: g({
    genre: 'Schlager',
    tags: ['german', 'pop', 'singalong', 'uplift'],
    defaultStructure: 'Verse → Chorus → Verse → Chorus → Bridge → Chorus',
    prosody: 'Simple, upbeat phrasing; clear stresses for singalong.',
    rhymeGuidance: 'Straightforward end rhymes.',
    hookGuidance: 'Big singalong chorus; title line repeats.',
    lexiconPolicy: 'Clean and accessible; avoid irony unless requested.'
  }),
  'Neue Deutsche Härte': g({
    genre: 'Neue Deutsche Härte',
    tags: ['german', 'industrial', 'metal', 'dark'],
    defaultStructure: 'Verse → Chorus → Verse → Chorus → Breakdown → Chorus',
    prosody: 'Hard consonants; rhythmic chant; blunt phrasing.',
    rhymeGuidance: 'Near rhymes ok; prioritize impact.',
    hookGuidance: 'Chorus is commanding and percussive.',
    lexiconPolicy: 'Dark, direct; keep themes coherent.'
  }),
  Techno: g({
    genre: 'Techno',
    tags: ['electronic', 'club', 'minimal', 'repeat'],
    defaultStructure: 'Hook/Mantra → Build → Drop → Breakdown → Drop',
    prosody: 'Very short phrases; repetition; percussive syllables.',
    rhymeGuidance: 'Not required; sound matters more.',
    hookGuidance: 'Mantra-like hook.',
    lexiconPolicy: 'Minimal; avoid long narrative lines.'
  }),
  Indie: g({
    genre: 'Indie',
    tags: ['indie', 'alt', 'introspective'],
    defaultStructure: 'Verse → Chorus → Verse → Chorus → Bridge → Chorus',
    prosody: 'Conversational; image-driven; slightly irregular allowed.',
    rhymeGuidance: 'Loose rhymes; focus on voice.',
    hookGuidance: 'Emotion-forward chorus; less slogan.',
    lexiconPolicy: 'Specific details; avoid generic angst lines.'
  }),
  Krautrock: g({
    genre: 'Krautrock',
    tags: ['motorik', 'experimental', 'hypnotic'],
    defaultStructure: 'Theme → Variation → Theme → Outro',
    prosody: 'Hypnotic repetition; short phrases; surreal imagery.',
    rhymeGuidance: 'Optional; repetition is key.',
    hookGuidance: 'Motif repeats with small shifts.',
    lexiconPolicy: 'Abstract but controlled; avoid random nonsense.'
  }),
  Deutschrock: g({
    genre: 'Deutschrock',
    tags: ['rock', 'anthemic', 'german'],
    defaultStructure: 'Verse → Chorus → Verse → Chorus → Bridge → Chorus',
    prosody: 'Strong stresses; shoutable lines.',
    rhymeGuidance: 'End rhyme preferred; keep it punchy.',
    hookGuidance: 'Singalong hook.',
    lexiconPolicy: 'Direct language; avoid melodrama.'
  }),
  Volksmusik: g({
    genre: 'Volksmusik',
    tags: ['traditional', 'folk', 'community'],
    defaultStructure: 'Verse → Refrain → Verse → Refrain → Outro',
    prosody: 'Simple and communal; repetitive.',
    rhymeGuidance: 'Clean end rhymes.',
    hookGuidance: 'Refrain is communal singback.',
    lexiconPolicy: 'Traditional imagery; keep it warm.'
  }),

  // Japanese
  'J-Pop': g({
    genre: 'J-Pop',
    tags: ['jpop', 'hooky', 'bright', 'melodic'],
    defaultStructure: 'Aメロ → Bメロ → サビ → Aメロ → Bメロ → サビ → Cメロ → サビ',
    prosody: 'Mora-timed phrasing; clean vowel flow; clear melodic lift into サビ.',
    rhymeGuidance: 'Rhyme not required; focus on sound echoes and repeated key phrases.',
    hookGuidance: 'サビ repeats a key phrase; strong emotional hook.',
    lexiconPolicy: 'Modern natural Japanese; avoid forced honorifics.'
  }),
  'City Pop': g({
    genre: 'City Pop',
    tags: ['retro', 'smooth', 'night', 'urban'],
    defaultStructure: 'Verse → Chorus → Verse → Chorus → Bridge → Chorus',
    prosody: 'Smooth phrasing; romantic night-city imagery.',
    rhymeGuidance: 'Sound-based echoes; light repetition.',
    hookGuidance: 'Chorus is stylish and nostalgic.',
    lexiconPolicy: 'Urban imagery; avoid overdoing 80s clichés.'
  }),
  Enka: g({
    genre: 'Enka',
    tags: ['traditional', 'lament', 'melisma'],
    defaultStructure: 'Verse → Chorus → Verse → Chorus → Climax → Outro',
    prosody: 'Long sustained vowels; strong emotional phrasing; classic imagery.',
    rhymeGuidance: 'Not required; focus on emotional cadence.',
    hookGuidance: 'Chorus is a lamenting refrain.',
    lexiconPolicy: 'Traditional-leaning vocabulary; keep it sincere.'
  }),
  'Visual Kei': g({
    genre: 'Visual Kei',
    tags: ['rock', 'theatrical', 'dramatic'],
    defaultStructure: 'Verse → Chorus → Verse → Chorus → Bridge → Chorus',
    prosody: 'Dramatic contrasts; sharp phrases; emotive cries.',
    rhymeGuidance: 'Optional; impact first.',
    hookGuidance: 'Big dramatic chorus.',
    lexiconPolicy: 'Theatrical imagery; avoid incoherent melodrama.'
  }),
  'J-Rock': g({
    genre: 'J-Rock',
    tags: ['rock', 'anthemic', 'energetic'],
    defaultStructure: 'Verse → Chorus → Verse → Chorus → Bridge → Chorus',
    prosody: 'Punchy syllables; energetic pacing.',
    rhymeGuidance: 'Optional; repeated motifs.',
    hookGuidance: 'Singalong chorus.',
    lexiconPolicy: 'Direct emotional language; avoid random English inserts.'
  }),
  'Idol Music': g({
    genre: 'Idol Music',
    tags: ['cute', 'bright', 'choreo', 'hook'],
    defaultStructure: 'Verse → Chorus → Verse → Chorus → Bridge → Final Chorus',
    prosody: 'Simple bright phrasing; catchy repetition.',
    rhymeGuidance: 'Not required; repetition and sound echoes.',
    hookGuidance: 'Chantable chorus with a signature phrase.',
    lexiconPolicy: 'Positive, cute; avoid sarcasm.'
  }),
  'Anime OST': g({
    genre: 'Anime OST',
    tags: ['cinematic', 'emotional', 'anthemic'],
    defaultStructure: 'Verse → Chorus → Verse → Chorus → Bridge → Final Chorus',
    prosody: 'Cinematic phrasing; big emotional lift.',
    rhymeGuidance: 'Not required; focus on motifs.',
    hookGuidance: 'Chorus feels like a theme song line.',
    lexiconPolicy: 'Vivid imagery; avoid generic “destiny” spam.'
  }),
  'Kawaii Future Bass': g({
    genre: 'Kawaii Future Bass',
    tags: ['electronic', 'cute', 'choppy', 'hook'],
    defaultStructure: 'Verse → Build → Drop/Hook → Verse → Drop/Hook → Outro',
    prosody: 'Short cute phrases; onomatopoeia sparingly; repetition.',
    rhymeGuidance: 'Not required.',
    hookGuidance: 'Drop hook is a mantra.',
    lexiconPolicy: 'Cute + minimal; avoid clutter.'
  }),

  // Korean
  'K-Pop': g({
    genre: 'K-Pop',
    tags: ['kpop', 'hook', 'switchups', 'choreo'],
    defaultStructure: 'Verse → Pre → Chorus → Verse → Chorus → Bridge → Final Chorus',
    prosody: 'Clean rhythmic phrasing; clear pre-chorus lift; space for rap or chant parts.',
    rhymeGuidance: 'Rhyme optional; focus on repeated hook phrases and rhythmic consonance.',
    hookGuidance: 'Signature chorus phrase designed for choreography.',
    lexiconPolicy: 'Modern Korean; English lines only if they sound natural and minimal.'
  }),
  'K-HipHop': g({
    genre: 'K-HipHop',
    tags: ['krap', 'bars', 'rhythmic'],
    defaultStructure: 'Hook → Verse → Hook → Verse → Hook',
    prosody: 'Tight cadence; clear articulation; avoid unnatural English slang spam.',
    rhymeGuidance: 'Internal rhyme/assonance; coherent flow.',
    hookGuidance: 'Hook contrasts dense verse.',
    lexiconPolicy: 'Modern Korean; slang only if natural.'
  }),
  Trot: g({
    genre: 'Trot',
    tags: ['traditional', 'melodic', 'sentimental'],
    defaultStructure: 'Verse → Chorus → Verse → Chorus → Outro',
    prosody: 'Strong melodic phrasing; sentimental cadence.',
    rhymeGuidance: 'Not required.',
    hookGuidance: 'Refrain is sentimental and memorable.',
    lexiconPolicy: 'Traditional-leaning but accessible.'
  }),
  'K-Ballad': g({
    genre: 'K-Ballad',
    tags: ['ballad', 'emotional', 'vocal'],
    defaultStructure: 'Verse → Chorus → Verse → Chorus → Bridge → Final Chorus',
    prosody: 'Long vowels; emotional build; clear imagery.',
    rhymeGuidance: 'Optional.',
    hookGuidance: 'Chorus is emotional peak.',
    lexiconPolicy: 'Sincere, specific; avoid generic heartbreak lines.'
  }),
  'K-Indie': g({
    genre: 'K-Indie',
    tags: ['indie', 'introspective', 'scene'],
    defaultStructure: 'Verse → Chorus → Verse → Chorus → Bridge → Chorus',
    prosody: 'Conversational; image-driven.',
    rhymeGuidance: 'Loose.',
    hookGuidance: 'Less slogan, more feeling.',
    lexiconPolicy: 'Specific scenes; minimal trend-chasing.'
  }),
  'K-Rock': g({
    genre: 'K-Rock',
    tags: ['rock', 'anthemic', 'live'],
    defaultStructure: 'Verse → Chorus → Verse → Chorus → Bridge → Chorus',
    prosody: 'Punchy, stressed lines.',
    rhymeGuidance: 'Optional.',
    hookGuidance: 'Singalong chorus.',
    lexiconPolicy: 'Direct emotional language.'
  }),
  Trap: g({
    genre: 'Trap',
    tags: ['trap', 'urban', 'cadence'],
    defaultStructure: 'Hook → Verse → Hook → Verse → Hook',
    prosody: 'Triplets and syncopation; short punchy bars; space for ad-libs.',
    rhymeGuidance: 'Internal rhyme; near-rhyme ok.',
    hookGuidance: 'Minimal hook; repeated motif.',
    lexiconPolicy: 'Keep slang controlled by register; avoid stereotypes.'
  }),
  'K-R&B': g({
    genre: 'K-R&B',
    tags: ['rnb', 'smooth', 'intimate'],
    defaultStructure: 'Verse → Pre → Chorus → Verse → Chorus → Bridge → Chorus',
    prosody: 'Smooth lines; space for runs; intimate voice.',
    rhymeGuidance: 'Optional.',
    hookGuidance: 'Chorus is a confession line.',
    lexiconPolicy: 'Modern Korean; minimal English.'
  }),

  // Chinese
  Mandopop: g({
    genre: 'Mandopop',
    tags: ['ballad', 'poetic', 'melodic'],
    defaultStructure: 'Verse → Chorus → Verse → Chorus → Bridge → Final Chorus',
    prosody: 'Smooth legato phrasing; concise imagery; tone-friendly word choice.',
    rhymeGuidance: 'Sound echoes rather than strict rhyme; keep it singable.',
    hookGuidance: 'Chorus repeats a key image phrase.',
    lexiconPolicy: 'Modern standard Mandarin; avoid stiff literal lines.'
  }),
  Cantopop: g({
    genre: 'Cantopop',
    tags: ['hk', 'ballad', 'urban'],
    defaultStructure: 'Verse → Chorus → Verse → Chorus → Bridge → Chorus',
    prosody: 'Respect tonal melody constraints; short clean phrases.',
    rhymeGuidance: 'Optional; focus on tonal-friendly repetition.',
    hookGuidance: 'Chorus is a nostalgic phrase.',
    lexiconPolicy: 'Cantonese if chosen explicitly; otherwise keep Mandarin defaults.'
  }),
  'Guofeng (Fusion)': g({
    genre: 'Guofeng (Fusion)',
    tags: ['traditional', 'fusion', 'poetic'],
    defaultStructure: 'Verse → Chorus → Verse → Chorus → Bridge → Chorus',
    prosody: 'Poetic imagery; rhythmic clarity; room for traditional motifs.',
    rhymeGuidance: 'Assonance and repetition.',
    hookGuidance: 'Hook repeats a key traditional image.',
    lexiconPolicy: 'Elevated but accessible; avoid random archaic spam.'
  }),
  'C-Pop': g({
    genre: 'C-Pop',
    tags: ['idol', 'pop', 'hooky'],
    defaultStructure: 'Verse → Pre → Chorus → Verse → Chorus → Bridge → Final Chorus',
    prosody: 'Clean catchy phrasing.',
    rhymeGuidance: 'Optional.',
    hookGuidance: 'Big chorus phrase; repeats title.',
    lexiconPolicy: 'Modern Mandarin; minimal awkward English.'
  }),
  'C-HipHop': g({
    genre: 'C-HipHop',
    tags: ['rap', 'bars', 'rhythmic'],
    defaultStructure: 'Hook → Verse → Hook → Verse → Hook',
    prosody: 'Tight cadence; natural phrasing.',
    rhymeGuidance: 'Internal rhyme/assonance; coherent flow.',
    hookGuidance: 'Hook is chantable.',
    lexiconPolicy: 'Modern Mandarin; avoid forced slang.'
  }),
  'Chinese Rock': g({
    genre: 'Chinese Rock',
    tags: ['rock', 'anthemic', 'live'],
    defaultStructure: 'Verse → Chorus → Verse → Chorus → Bridge → Chorus',
    prosody: 'Strong stressed lines; clear chorus.',
    rhymeGuidance: 'Optional.',
    hookGuidance: 'Singalong chorus.',
    lexiconPolicy: 'Direct and vivid imagery.'
  }),

  // Portuguese
  Samba: g({
    genre: 'Samba',
    tags: ['brazil', 'groove', 'community'],
    defaultStructure: 'Verse → Refrão → Verse → Refrão → Partido Alto/Bridge → Refrão',
    prosody: 'Bouncy phrasing; short lines; communal feel.',
    rhymeGuidance: 'Simple rhymes; repetition fits.',
    hookGuidance: 'Refrão is chantable.',
    lexiconPolicy: 'pt-BR by default; avoid forced regional slang.'
  }),
  'Bossa Nova': g({
    genre: 'Bossa Nova',
    tags: ['brazil', 'soft', 'jazzy', 'romantic'],
    defaultStructure: 'Verse → Chorus → Verse → Chorus → Bridge → Chorus',
    prosody: 'Soft, understated phrasing; conversational intimacy.',
    rhymeGuidance: 'Light rhyme/assonance.',
    hookGuidance: 'Subtle refrain; not shouty.',
    lexiconPolicy: 'pt-BR; poetic but simple.'
  }),
  Fado: g({
    genre: 'Fado',
    tags: ['portugal', 'saudade', 'traditional'],
    defaultStructure: 'Verse → Refrão → Verse → Refrão → Climax → Outro',
    prosody: 'Long emotional phrases; dramatic pauses.',
    rhymeGuidance: 'Classic end rhymes; keep it natural.',
    hookGuidance: 'Refrão is a lamenting refrain.',
    lexiconPolicy: 'pt-PT by default; sincere, not ornate.'
  }),
  'Funk Carioca': g({
    genre: 'Funk Carioca',
    tags: ['brazil', 'club', 'percussive', 'call-response'],
    defaultStructure: 'Hook → Verse → Hook → Verse → Hook',
    prosody: 'Short percussive lines; repetition; crowd-response phrases.',
    rhymeGuidance: 'Simple rhymes; rhythm-first.',
    hookGuidance: 'Hook is a chant.',
    lexiconPolicy: 'pt-BR; keep slang controlled by register.'
  }),
  Sertanejo: g({
    genre: 'Sertanejo',
    tags: ['brazil', 'story', 'romantic'],
    defaultStructure: 'Verse → Chorus → Verse → Chorus → Bridge → Chorus',
    prosody: 'Storytelling lines; emotional clarity.',
    rhymeGuidance: 'Clean end rhymes.',
    hookGuidance: 'Chorus states thesis; title line repeats.',
    lexiconPolicy: 'pt-BR; keep it sincere.'
  }),
  MPB: g({
    genre: 'MPB',
    tags: ['brazil', 'poetic', 'groove'],
    defaultStructure: 'Verse → Chorus → Verse → Chorus → Bridge → Chorus',
    prosody: 'Poetic imagery with conversational flow.',
    rhymeGuidance: 'Loose; focus on musicality.',
    hookGuidance: 'Hook is a memorable phrase, not necessarily repetitive.',
    lexiconPolicy: 'pt-BR; literary but accessible.'
  }),
  Forró: g({
    genre: 'Forró',
    tags: ['brazil', 'dance', 'accordion'],
    defaultStructure: 'Verse → Chorus → Verse → Chorus → Bridge → Chorus',
    prosody: 'Bouncy, short lines; playful repetition.',
    rhymeGuidance: 'Simple end rhymes.',
    hookGuidance: 'Chorus is danceable call line.',
    lexiconPolicy: 'pt-BR; keep slang light.'
  }),
  Piseiro: g({
    genre: 'Piseiro',
    tags: ['brazil', 'dance', 'minimal', 'hooky'],
    defaultStructure: 'Hook → Verse → Hook → Verse → Hook',
    prosody: 'Short hooky lines; repetition; percussive cadence.',
    rhymeGuidance: 'Simple rhymes.',
    hookGuidance: 'Hook repeats one signature phrase.',
    lexiconPolicy: 'pt-BR; casual and clean by default.'
  }),

  // Italian
  'Italo-Disco': g({
    genre: 'Italo-Disco',
    tags: ['retro', 'dance', 'synth', 'hook'],
    defaultStructure: 'Verse → Chorus → Verse → Chorus → Bridge → Chorus',
    prosody: 'Short catchy lines; rhythmic repetition.',
    rhymeGuidance: 'Simple rhymes.',
    hookGuidance: 'Chorus is a catchy title phrase.',
    lexiconPolicy: 'Italian with occasional English only if requested.'
  }),
  'Opera Pop': g({
    genre: 'Opera Pop',
    tags: ['theatrical', 'vocal', 'dramatic'],
    defaultStructure: 'Verse → Chorus → Verse → Chorus → Bridge → Final Chorus',
    prosody: 'Big vowels; dramatic phrasing; elevated imagery.',
    rhymeGuidance: 'End rhymes optional; keep it musical.',
    hookGuidance: 'Chorus is grand and emotional.',
    lexiconPolicy: 'Elevated Italian; avoid awkward archaic clutter.'
  }),
  'Canzone Napoletana': g({
    genre: 'Canzone Napoletana',
    tags: ['traditional', 'romantic', 'folk'],
    defaultStructure: 'Verse → Refrain → Verse → Refrain → Outro',
    prosody: 'Singing-friendly lines; romantic imagery.',
    rhymeGuidance: 'Classic end rhymes.',
    hookGuidance: 'Refrain is a romantic phrase.',
    lexiconPolicy: 'Italian by default; dialect only if explicitly requested.'
  }),
  'Italian Trap': g({
    genre: 'Italian Trap',
    tags: ['trap', 'urban', 'dark'],
    defaultStructure: 'Hook → Verse → Hook → Verse → Hook',
    prosody: 'Trap cadence; short punchy lines.',
    rhymeGuidance: 'Internal rhyme; near rhymes ok.',
    hookGuidance: 'Minimal hook; repeated motif.',
    lexiconPolicy: 'Modern Italian; slang controlled by register.'
  }),
  'Sanremo Pop': g({
    genre: 'Sanremo Pop',
    tags: ['pop', 'ballad', 'festival'],
    defaultStructure: 'Verse → Chorus → Verse → Chorus → Bridge → Final Chorus',
    prosody: 'Clear melodic phrasing; emotional build.',
    rhymeGuidance: 'Clean rhymes; tasteful.',
    hookGuidance: 'Big chorus line.',
    lexiconPolicy: 'Sincere Italian; avoid cliché overload.'
  }),
  'Rock Italiano': g({
    genre: 'Rock Italiano',
    tags: ['rock', 'anthemic', 'italian'],
    defaultStructure: 'Verse → Chorus → Verse → Chorus → Bridge → Chorus',
    prosody: 'Punchy stressed lines.',
    rhymeGuidance: 'Optional.',
    hookGuidance: 'Singalong chorus.',
    lexiconPolicy: 'Direct, vivid imagery.'
  }),

  // Arabic
  'Arabic Pop': g({
    genre: 'Arabic Pop',
    tags: ['pop', 'melodic', 'regional'],
    defaultStructure: 'Verse → Chorus → Verse → Chorus → Bridge → Chorus',
    prosody: 'Melodic phrasing; repeated refrain.',
    rhymeGuidance: 'Light rhyme; repetition ok.',
    hookGuidance: 'Chorus repeats a key emotional line.',
    lexiconPolicy: 'Consistent register; default to accessible Modern Standard Arabic unless dialect specified.'
  }),
  'Raï': g({
    genre: 'Raï',
    tags: ['north-africa', 'dance', 'emotion'],
    defaultStructure: 'Verse → Chorus → Verse → Chorus → Outro',
    prosody: 'Emotive phrasing; rhythmic bounce.',
    rhymeGuidance: 'Simple rhymes.',
    hookGuidance: 'Chorus is a repeated plea or celebration.',
    lexiconPolicy: 'Arabic register consistent; dialect only if requested.'
  }),
  Khaliji: g({
    genre: 'Khaliji',
    tags: ['gulf', 'rhythmic', 'celebratory'],
    defaultStructure: 'Verse → Chorus → Verse → Chorus → Outro',
    prosody: 'Rhythmic phrasing; celebratory tone.',
    rhymeGuidance: 'Simple.',
    hookGuidance: 'Chorus is a chant.',
    lexiconPolicy: 'Consistent register; keep cultural references tasteful.'
  }),
  'Maqam Fusion': g({
    genre: 'Maqam Fusion',
    tags: ['fusion', 'modal', 'traditional'],
    defaultStructure: 'Verse → Chorus → Verse → Chorus → Bridge → Chorus',
    prosody: 'Poetic phrasing; room for melisma.',
    rhymeGuidance: 'Assonance ok.',
    hookGuidance: 'Refrain repeats a key image.',
    lexiconPolicy: 'Elevated but accessible MSA; avoid random archaic phrases.'
  }),
  Mahraganat: g({
    genre: 'Mahraganat',
    tags: ['club', 'street', 'chant', 'fast'],
    defaultStructure: 'Hook → Verse → Hook → Verse → Hook',
    prosody: 'Short percussive lines; chantable repetition.',
    rhymeGuidance: 'Simple.',
    hookGuidance: 'Hook is a mantra.',
    lexiconPolicy: 'Keep register coherent; dialect only if requested.'
  }),
  Dabke: g({
    genre: 'Dabke',
    tags: ['levante', 'dance', 'community'],
    defaultStructure: 'Verse → Chorus → Verse → Chorus → Outro',
    prosody: 'Call-and-response; strong stresses.',
    rhymeGuidance: 'Simple.',
    hookGuidance: 'Chorus is a communal chant.',
    lexiconPolicy: 'Consistent register; accessible by default.'
  }),
  'Classical Arabic': g({
    genre: 'Classical Arabic',
    tags: ['classical', 'poetic', 'ornate'],
    defaultStructure: 'Qasida-like stanzas → refrain optional',
    prosody: 'Elevated poetic phrasing; longer lines.',
    rhymeGuidance: 'More formal rhyme patterns.',
    hookGuidance: 'Refrain optional; focus on poetic progression.',
    lexiconPolicy: 'Formal register; avoid modern slang.'
  }),
  Shaabi: g({
    genre: 'Shaabi',
    tags: ['street', 'dance', 'chant'],
    defaultStructure: 'Hook → Verse → Hook → Verse → Hook',
    prosody: 'Short chantable lines; rhythmic bounce.',
    rhymeGuidance: 'Simple.',
    hookGuidance: 'Mantra hook.',
    lexiconPolicy: 'Consistent register; dialect only if requested.'
  }),

  // Hindi
  Bollywood: g({
    genre: 'Bollywood',
    tags: ['cinematic', 'hook', 'dance', 'drama'],
    defaultStructure: 'Verse → Chorus → Verse → Chorus → Bridge → Chorus',
    prosody: 'Cinematic phrasing; clear hook; room for melodic lifts.',
    rhymeGuidance: 'Light rhyme; internal echoes.',
    hookGuidance: 'Signature chorus phrase; repeat title.',
    lexiconPolicy: 'Hindi by default; Hinglish only if requested.'
  }),
  'Indi-Pop': g({
    genre: 'Indi-Pop',
    tags: ['pop', 'indian', 'hooky'],
    defaultStructure: 'Verse → Pre → Chorus → Verse → Chorus → Bridge → Chorus',
    prosody: 'Clean melodic phrasing.',
    rhymeGuidance: 'Light.',
    hookGuidance: 'Catchy chorus phrase.',
    lexiconPolicy: 'Hindi; Hinglish minimal unless requested.'
  }),
  Ghazal: g({
    genre: 'Ghazal',
    tags: ['poetic', 'classical', 'romantic'],
    defaultStructure: 'Couplets with a recurring refrain (radif) and rhyme (qaafiya)',
    prosody: 'Poetic couplets; balanced lines; emotional restraint.',
    rhymeGuidance: 'Couplet-based rhyme/refrain patterns.',
    hookGuidance: 'Refrain repeats across couplets.',
    lexiconPolicy: 'Elevated Hindi/Urdu-leaning vocabulary; avoid modern slang.'
  }),
  Bhangra: g({
    genre: 'Bhangra',
    tags: ['dance', 'high-energy', 'folk'],
    defaultStructure: 'Verse → Chorus → Verse → Chorus → Breakdown → Chorus',
    prosody: 'Short energetic lines; callouts; repetition.',
    rhymeGuidance: 'Simple.',
    hookGuidance: 'Chantable chorus.',
    lexiconPolicy: 'Hindi by default; Punjabi elements only if requested.'
  }),
  'Classical Fusion': g({
    genre: 'Classical Fusion',
    tags: ['fusion', 'raga', 'poetic'],
    defaultStructure: 'Verse → Chorus → Verse → Chorus → Bridge → Chorus',
    prosody: 'Poetic phrasing; room for melisma and rhythmic cycles.',
    rhymeGuidance: 'Light.',
    hookGuidance: 'Refrain repeats a key image.',
    lexiconPolicy: 'Elevated but accessible.'
  }),
  Sufi: g({
    genre: 'Sufi',
    tags: ['spiritual', 'devotional', 'poetic'],
    defaultStructure: 'Verse → Refrain → Verse → Refrain → Outro',
    prosody: 'Devotional phrasing; repetitive refrains.',
    rhymeGuidance: 'Light.',
    hookGuidance: 'Refrain is a devotional line.',
    lexiconPolicy: 'Spiritual imagery; avoid shallow mysticism clichés.'
  }),
  'Desi Hip-Hop': g({
    genre: 'Desi Hip-Hop',
    tags: ['rap', 'desi', 'bars'],
    defaultStructure: 'Hook → Verse → Hook → Verse → Hook',
    prosody: 'Tight cadence; clear phrasing.',
    rhymeGuidance: 'Internal rhyme; coherent flow.',
    hookGuidance: 'Hook contrasts verse density.',
    lexiconPolicy: 'Hindi by default; Hinglish only if requested.'
  }),
  Qawwali: g({
    genre: 'Qawwali',
    tags: ['devotional', 'call-response', 'build'],
    defaultStructure: 'Verse → Refrain → Verse → Refrain → Climax/Vamp → Outro',
    prosody: 'Repetitive build; call-and-response; long vowels.',
    rhymeGuidance: 'Refrain-centric repetition.',
    hookGuidance: 'Refrain intensifies over time.',
    lexiconPolicy: 'Devotional imagery; keep it respectful.'
  }),

  // Swahili
  'Bongo Flava': g({
    genre: 'Bongo Flava',
    tags: ['east-africa', 'pop', 'rnb', 'street'],
    defaultStructure: 'Hook → Verse → Hook → Verse → Hook',
    prosody: 'Smooth melodic phrasing; rhythmic bounce; short hook lines.',
    rhymeGuidance: 'Simple; repetition ok.',
    hookGuidance: 'Hook is catchy and melodic.',
    lexiconPolicy: 'Swahili by default; Sheng only if explicitly requested.'
  }),
  Taarab: g({
    genre: 'Taarab',
    tags: ['coastal', 'traditional', 'poetic'],
    defaultStructure: 'Verse → Refrain → Verse → Refrain → Outro',
    prosody: 'Poetic phrasing; long melodic lines.',
    rhymeGuidance: 'Light.',
    hookGuidance: 'Refrain repeats a key image.',
    lexiconPolicy: 'Swahili; elevated but accessible.'
  }),
  Gengetone: g({
    genre: 'Gengetone',
    tags: ['kenya', 'club', 'chant', 'fast'],
    defaultStructure: 'Hook → Verse → Hook → Verse → Hook',
    prosody: 'Short percussive lines; chantable repetition.',
    rhymeGuidance: 'Simple.',
    hookGuidance: 'Mantra hook.',
    lexiconPolicy: 'Swahili by default; Sheng only if explicitly requested.'
  }),
  'Swahili Gospel': g({
    genre: 'Swahili Gospel',
    tags: ['gospel', 'uplift', 'choir'],
    defaultStructure: 'Verse → Chorus → Verse → Chorus → Vamp → Outro',
    prosody: 'Big vowels; call-and-response.',
    rhymeGuidance: 'Simple.',
    hookGuidance: 'Chorus repeats a devotional line.',
    lexiconPolicy: 'Swahili, clear and respectful.'
  }),
  Singeli: g({
    genre: 'Singeli',
    tags: ['tanzania', 'fast', 'percussive', 'chant'],
    defaultStructure: 'Hook → Verse → Hook → Verse → Hook',
    prosody: 'Very short percussive lines; rapid repetition.',
    rhymeGuidance: 'Not required; rhythm-first.',
    hookGuidance: 'Hook is a repeated shout.',
    lexiconPolicy: 'Swahili; keep it coherent; slang only if requested.'
  })
};

export const SUBGENRE_SONIC_PROFILES: Record<string, SubgenreSonicProfile> = Object.fromEntries(
  Object.values(SUBGENRES)
    .flat()
    .map((subGenre) => [
      subGenre,
      inferSubgenreSonicProfile(subGenre)
    ])
);

export function getBaseCulture(language: string): BaseCulture {
  const profile = LANGUAGE_PROFILES[language];
  return profile?.baseCulture || 'General';
}

export function getBaseEnv(genre: string): BaseEnv {
  const tags = GENRE_PROFILES[genre]?.tags || [];
  if (tags.includes('urban') || tags.includes('trap') || tags.includes('club') || tags.includes('rap')) return 'Urban';
  if (tags.includes('traditional') || tags.includes('folk') || tags.includes('classical')) return 'Traditional';
  if (tags.includes('pop') || tags.includes('dance') || tags.includes('hooky')) return 'Pop';
  return 'General';
}

export function inferWritingProfile(inputs: {
  language?: string;
  genre?: string;
  subGenre?: string;
  allowCodeSwitch?: boolean;
  register?: RegisterLevel;
}): InferredWritingProfile {
  const language = inputs.language || 'English';
  const base = LANGUAGE_PROFILES[language] || LANGUAGE_PROFILES.English;
  const genre = inputs.genre || 'Pop';
  const subGenre = inputs.subGenre || '';

  const inferred = inferCultureRegion(language, genre, subGenre) || base.defaultRegion;
  const languageVariant = inferLanguageVariant(language, genre, subGenre, inferred);
  const register = inputs.register || 'radio';
  const slang = inferSlangLevel(genre, register);
  const allowCodeSwitch = Boolean(inputs.allowCodeSwitch);

  return {
    language,
    cultureRegion: inferred,
    languageVariant,
    register,
    slang,
    codeSwitchPolicy: allowCodeSwitch
      ? 'Code-switching is allowed, but keep it natural and minimal (no random English filler).'
      : 'Do not code-switch unless explicitly requested; stay in the chosen language variant.',
    authenticityGuardrails:
      'Prioritize natural native phrasing over “accented” spellings. Avoid stereotypes, slurs, and tokenized catchphrases. If unsure, use a neutral, widely understood register for the selected region.'
  };
}

export function validateTaxonomyCoverage(): string[] {
  const problems: string[] = [];
  const allGenres = new Set(Object.values(GENRES_BY_LANG).flat());
  for (const genre of allGenres) {
    if (!GENRE_PROFILES[genre]) problems.push(`Missing GENRE_PROFILES entry: ${genre}`);
  }
  return problems;
}

export function getGenreProfile(genre?: string): GenreProfile {
  if (genre && GENRE_PROFILES[genre]) return GENRE_PROFILES[genre];
  return GENRE_PROFILES.Pop;
}

export function getSubgenreSonicProfile(subGenre?: string): SubgenreSonicProfile | null {
  if (!subGenre) return null;
  return SUBGENRE_SONIC_PROFILES[subGenre] || inferSubgenreSonicProfile(subGenre);
}

function inferCultureRegion(language: string, genre: string, subGenre: string): CultureRegion | null {
  const g = genre.toLowerCase();
  const s = subGenre.toLowerCase();

  if (language === 'Spanish') {
    if (g.includes('regional mexican') || s.includes('corrid') || s.includes('norte') || s.includes('banda') || s.includes('mariachi')) return 'Mexico';
    if (g.includes('reggaeton') || g.includes('latin trap') || s.includes('dembow') || s.includes('perreo')) return 'Caribbean';
    return 'Global';
  }

  if (language === 'Portuguese') {
    if (g.includes('fado') || s.includes('lisboa') || s.includes('coimbra')) return 'Portugal';
    return 'Brazil';
  }

  if (language === 'French') return 'France';
  if (language === 'German') return 'Germany';
  if (language === 'Japanese') return 'Japan';
  if (language === 'Korean') return 'Korea';
  if (language === 'Chinese') {
    if (g.includes('cantopop') || s.includes('hk')) return 'Hong Kong';
    return 'China';
  }
  if (language === 'Arabic') return 'MENA';
  if (language === 'Hindi') return 'India';
  if (language === 'Swahili') return 'East Africa';
  if (language === 'English') {
    if (g.includes('reggae')) return 'Caribbean';
    if (g.includes('afrobeats')) return 'West Africa';
    return 'US/Canada';
  }
  return null;
}

function inferLanguageVariant(language: string, genre: string, subGenre: string, region: CultureRegion): string {
  if (language === 'Spanish') {
    if (region === 'Mexico') return 'Spanish (Mexico; modern, natural; region-coherent idioms)';
    if (region === 'Caribbean') return 'Spanish (Caribbean; modern, natural; avoid caricature)';
    return 'Spanish (neutral Latin American; modern, natural)';
  }
  if (language === 'Portuguese') {
    if (region === 'Portugal') return 'Portuguese (Portugal; natural; not Brazilian slang)';
    return 'Portuguese (Brazil; modern, natural)';
  }
  if (language === 'Chinese') {
    if (region === 'Hong Kong') return 'Cantonese (Hong Kong; tone-friendly phrasing)';
    return 'Mandarin Chinese (Modern Standard; concise, singable)';
  }
  if (language === 'Arabic') return 'Arabic (consistent register; default accessible Modern Standard unless dialect specified)';
  if (language === 'English') {
    if (genre === 'Reggae') return 'English (Caribbean-influenced tone; avoid forced dialect spellings)';
    return 'English (contemporary, natural, region-neutral)';
  }
  return `${language} (native, contemporary, singable)`;
}

function inferSlangLevel(genre: string, register: RegisterLevel): SlangLevel {
  const tags = GENRE_PROFILES[genre]?.tags || [];
  if (register === 'clean') return 'light';
  if (tags.includes('bars') || tags.includes('urban') || tags.includes('club') || tags.includes('rap') || tags.includes('trap')) return 'medium';
  return 'light';
}

function inferSubgenreSonicProfile(subGenre: string): SubgenreSonicProfile {
  const s = subGenre.toLowerCase();

  const base: SubgenreSonicProfile = {
    subGenre,
    bpmRange: '90–130',
    groove: 'steady, mid-tempo bounce',
    instrumentation: 'genre-typical instruments; keep choices coherent with the selected genre',
    productionStyle: 'modern, clean mix with genre-appropriate punch',
    arrangement: 'clear verse/chorus contrast; leave space for hook'
  };

  if (s.includes('trap') || s.includes('drill')) {
    return { ...base, bpmRange: '130–160 (half-time feel)', groove: 'syncopated hi-hats, heavy 808, spacious pocket', productionStyle: 'dark, punchy, modern trap mix', arrangement: 'short hook, two verses, optional bridge/breakdown' };
  }
  if (s.includes('boom bap') || s.includes('boom')) {
    return { ...base, bpmRange: '85–100', groove: 'head-nod swing, snappy drums', productionStyle: 'warm, sample-forward, crisp drums', arrangement: '16-bar verses with a simple hook' };
  }
  if (s.includes('house')) {
    return { ...base, bpmRange: '120–128', groove: 'four-on-the-floor, rolling bass', productionStyle: 'clean club mix, sidechain pump', arrangement: 'build/drop dynamics; mantra hook' };
  }
  if (s.includes('techno')) {
    return { ...base, bpmRange: '125–140', groove: 'driving, hypnotic pulse', productionStyle: 'minimal, industrial textures', arrangement: 'loop-based build with breakdown' };
  }
  if (s.includes('drum') || s.includes('d&b') || s.includes('drum & bass')) {
    return { ...base, bpmRange: '170–180', groove: 'fast breakbeats, rolling sub', productionStyle: 'bright, punchy, wide', arrangement: 'drop-focused; short vocal hook' };
  }
  if (s.includes('bachata')) {
    return { ...base, bpmRange: '120–140', groove: 'syncopated guitar arpeggios, soft percussion', productionStyle: 'warm, intimate, guitar-forward', arrangement: 'romantic verse/coro; bridge for emotional lift' };
  }
  if (s.includes('dembow') || s.includes('perreo') || s.includes('moombahton')) {
    return { ...base, bpmRange: '90–110', groove: 'dembow rhythm, heavy kick/snare', productionStyle: 'club-ready low end, bright percussion', arrangement: 'coro-forward; repeated hook' };
  }
  if (s.includes('bossa')) {
    return { ...base, bpmRange: '90–120', groove: 'soft syncopation, brushed feel', productionStyle: 'warm, airy, intimate', arrangement: 'subtle dynamic build; refrain not shouty' };
  }
  if (s.includes('fado') || s.includes('saudade')) {
    return { ...base, bpmRange: '60–90', groove: 'rubato-feel ballad phrasing', productionStyle: 'acoustic, intimate, room tone', arrangement: 'verse/refrain with emotional climax' };
  }

  return base;
}
