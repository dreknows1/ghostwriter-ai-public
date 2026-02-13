export type GenreAgentBaseline = {
  style: string;
  moodEnergy: string;
  vocalApproach: string;
  arrangementDynamics: string;
  instrumentFocus: string;
  lyricRules: string[];
  sunoRules: string[];
};

export type SubgenreDelta = {
  style?: string;
  moodEnergy?: string;
  vocalApproach?: string;
  arrangementDynamics?: string;
  instrumentFocus?: string;
  lyricRules?: string[];
  sunoRules?: string[];
};

export type GenreAgent = {
  id: string;
  genre: string;
  model: string;
  version: string;
  baseline: GenreAgentBaseline;
  subgenres: Record<string, SubgenreDelta>;
};

export type GenreAgentDirectives = {
  hasAgent: boolean;
  agentId?: string;
  subgenreMatched?: string;
  sunoPromptDirectives: string;
  lyricDirectives: string;
};

function normalizeKey(value?: string): string {
  return (value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const POP_AGENT: GenreAgent = {
  id: "pop-agent",
  genre: "Pop",
  model: "song-first pop architecture",
  version: "2026-02-13",
  baseline: {
    style:
      "song-first English-language pop: hook-led, concise, verse/pre-chorus/chorus teleology, high replay value",
    moodEnergy:
      "clear arc from intimate setup to bigger chorus energy; favor emotional directness over abstract writing",
    vocalApproach:
      "lead-vocal primacy with intelligible phrasing; layered harmonies/adlibs used for lift, not clutter",
    arrangementDynamics:
      "tight section pacing; chorus and optional post-chorus carry payoff; final chorus should feel earned and larger",
    instrumentFocus:
      "contemporary pop center of gravity: drums+bass groove bed, melody-forward top line, selective textural color",
    lyricRules: [
      "Use concrete scene details and direct emotional POV.",
      "Keep chorus kernel stable across repeats; evolve with controlled line updates.",
      "Avoid generic hallmark language and filler metaphors.",
      "Maintain strong line-to-line narrative continuity in verses.",
    ],
    sunoRules: [
      "Describe style/genre in production terms, not questionnaire restatement.",
      "Specify mood/energy arc and section dynamics.",
      "Specify vocal texture and delivery behavior.",
      "Specify instrument role hierarchy and any solo/break behavior.",
    ],
  },
  subgenres: {
    "dance pop": {
      style: "dance-pop with club-weighted pulse and bright hook architecture",
      moodEnergy: "high entrainment with chorus/post-chorus lift",
      arrangementDynamics:
        "build-drop-release motion; maintain momentum between chorus and post-chorus",
      instrumentFocus:
        "four-on-the-floor kick anchor, locked bass, synth hooks, transition risers/impacts",
    },
    "electropop": {
      style: "electropop with synthetic timbral center and clean hook-forward writing",
      vocalApproach: "processed but intelligible lead; doubles reinforce hook contour",
      instrumentFocus: "synth lead motifs + programmed drums + synth bass as core palette",
    },
    "synth pop": {
      style: "synth-pop with electronic-first arrangement and melodic nostalgia",
      arrangementDynamics: "sequenced groove consistency with selective chorus widening",
      instrumentFocus: "synth layers and drum-machine groove replacing guitar-centric roles",
    },
    "indie pop": {
      style: "indie pop with songcraft-first hooks and softer alt textures",
      moodEnergy: "measured, emotionally intimate, less maximal than top-40 pop",
      instrumentFocus: "guitar/keys interplay, restrained drums, harmony-rich lift",
    },
    "dream pop": {
      style: "dream pop with atmospheric haze and melody-in-texture presentation",
      moodEnergy: "floating, immersive, low-to-mid energy with emotional undercurrent",
      vocalApproach: "airy/breathy lead integrated into reverb-rich field",
      instrumentFocus: "echoed guitars/synth pads, softened drums, sustained harmonic bed",
    },
    "power pop": {
      style: "power pop: guitar-forward hook craft with anthemic chorus focus",
      moodEnergy: "driving and bright with steady backbeat propulsion",
      instrumentFocus: "electric guitar riffs + tight drums + stacked chorus harmonies",
    },
    "pop punk": {
      style: "pop punk with high-energy band propulsion and chantable choruses",
      moodEnergy: "fast and urgent with strong section contrast",
      vocalApproach: "punchy, shout-friendly hook delivery",
      instrumentFocus: "distorted guitars, fast backbeat drums, locked bass-guitar momentum",
    },
    "bedroom pop": {
      style: "bedroom pop with intimate DIY polish and close-mic vocal storytelling",
      moodEnergy: "low-to-mid energy, introspective, emotionally present",
      vocalApproach: "soft mixed voice, conversational phrasing, subtle harmonies",
      instrumentFocus: "minimal warm instrumentation, understated drums, motif-driven color",
    },
    "hyperpop": {
      style: "hyperpop maximalism with exaggerated pop motifs and internet-era color",
      moodEnergy: "volatile dynamics with rapid high-energy pivots",
      vocalApproach: "heavily transformed vocal textures used as hook devices",
      arrangementDynamics: "abrupt contrast sections and overclocked payoff moments",
      instrumentFocus: "aggressive synths/basses, hybrid drum language, FX punctuation",
    },
    "bubblegum pop": {
      style: "bubblegum/teen pop with ultra-catchy simple melodic slogans",
      moodEnergy: "bright, bouncy, immediate",
      vocalApproach: "clean lead + group-like hook support",
      instrumentFocus: "simple chord bed, sparkle accents, rhythm built for chantability",
    },
  },
};

const HIPHOP_AGENT: GenreAgent = {
  id: "hiphop-agent",
  genre: "Hip-Hop",
  model: "verse-and-flow first hip-hop architecture",
  version: "2026-02-13",
  baseline: {
    style:
      "verse-and-flow first hip-hop with loop-centric structure, rhythmic voice leadership, and hook contrast",
    moodEnergy:
      "rhythmic authority and pocket clarity; escalate section intensity through cadence, ad-libs, and drum energy",
    vocalApproach:
      "stress-to-beat aligned flow, internal rhyme texture, cadence variation between verse and hook",
    arrangementDynamics:
      "verse/hook alternation with clear role split; hooks land earlier for mainstream versions; preserve beat-space for bars",
    instrumentFocus:
      "drum+bass dominance, motif-based loop bed, rhythmic transitions over harmonic complexity",
    lyricRules: [
      "Prioritize cadence architecture, punchlines, and coherent bar-to-bar progression.",
      "Use internal rhyme and multisyllabic chaining where natural.",
      "Match lexical register to subgenre scene and avoid forced stereotype language.",
      "Keep hooks simpler than verses while preserving memorability.",
    ],
    sunoRules: [
      "Specify flow feel (straight vs triplet tendency) and pocket behavior.",
      "Specify drum+bass hierarchy and motif role in the loop bed.",
      "Specify hook strategy (chant, sung hook, or rap-hook hybrid).",
      "Specify section contrast using cadence and texture shifts.",
    ],
  },
  subgenres: {
    "boom bap": {
      style: "boom bap with head-nod swing, sample-led grit, and technical verse density",
      moodEnergy: "confident, grounded, bar-forward intensity",
      arrangementDynamics: "verse-heavy structure with hard snare statements and minimal ornamental excess",
      instrumentFocus: "dusty sample loop, hard kick/snare, restrained bass, optional scratch punctuation",
    },
    trap: {
      style: "modern trap with sparse harmonic bed and texture-first low-end pressure",
      moodEnergy: "dark, hypnotic, high-impact in bursts",
      vocalApproach: "triplet-capable flow, cadence pockets, high ad-lib utility",
      arrangementDynamics: "hook/verse tension with drop-like transitions and stark space control",
      instrumentFocus: "808 sub lead, stuttering hats/rolls, sparse snare/clap anchors, minimal motif bells/pads",
    },
    drill: {
      style: "drill with dark cinematic motifs and direct street-reporting cadence",
      moodEnergy: "ominous and confrontational with controlled menace",
      vocalApproach: "clipped, blunt delivery; less metaphor fog, more direct impact",
      arrangementDynamics: "stark section contrasts, percussive pressure, functional chant hooks",
      instrumentFocus: "sliding low bass, rapid drum details, bell/siren tension accents",
    },
    "conscious hip hop": {
      style: "conscious hip-hop with thesis-driven lyric argument and rhetorical clarity",
      moodEnergy: "focused, purposeful, intellectually sharp",
      vocalApproach: "clear diction, idea-first cadence, less ad-lib clutter",
      arrangementDynamics: "longer argumentative verses with hooks summarizing thesis",
      instrumentFocus: "supportive beat bed, symbolic sample color, low ornament density",
    },
    "g funk": {
      style: "g-funk with laid-back west-coast glide and synth-funk melodic signatures",
      moodEnergy: "cool, smooth, cruising confidence",
      vocalApproach: "relaxed pocket and melodic phrase turns over groove",
      arrangementDynamics: "easy-rolling verse/hook cycle with broad choruses",
      instrumentFocus: "whiny synth lead, deep bass floor, relaxed drum pocket, supportive vocal textures",
    },
    "emo rap": {
      style: "emo rap with confessional vulnerability and melodic trap-informed phrasing",
      moodEnergy: "wounded then volatile; emotionally exposed",
      vocalApproach: "melodic rap inflections, cracked tone options, intimate lead focus",
      arrangementDynamics: "short direct sections with emotional peaks at hooks/bridges",
      instrumentFocus: "minimal trap bed plus melancholic motif layer",
    },
    "jazz rap": {
      style: "jazz rap with heady lyricism and groove-aware harmonic warmth",
      moodEnergy: "thoughtful, smooth, articulate",
      vocalApproach: "measured flow with elegant internal rhyme and narrative continuity",
      arrangementDynamics: "balanced verse/hook movement with conversational flow control",
      instrumentFocus: "jazz-leaning chords/samples, pocket drums, melodic bass interplay",
    },
    "gangsta rap": {
      style: "gangsta rap with gritty reportage and persona-forward assertion",
      moodEnergy: "hard-edged, confrontational, high pressure",
      vocalApproach: "direct impact lines with weighted cadence endings",
      arrangementDynamics: "anthemic hooks around tough detailed verses",
      instrumentFocus: "heavy groove bed, aggressive rhythmic anchors, dark motif support",
    },
  },
};

const ROCK_AGENT: GenreAgent = {
  id: "rock-agent",
  genre: "Rock",
  model: "backbeat+riffs rock architecture",
  version: "2026-02-13",
  baseline: {
    style:
      "strong-beat rock with electric-band center, backbeat authority, and riff/chorus dual hook logic",
    moodEnergy:
      "sectional dynamic contrast: restrained setup, chorus impact, bridge expansion, final lift",
    vocalApproach:
      "front-line lead with stress-aligned phrasing; intensity varies by subgenre from intimate to anthemic",
    arrangementDynamics:
      "function-first sections (setup/payoff/contrast), strong verse-chorus identity, optional bridge/solo peak",
    instrumentFocus:
      "drums+bass groove foundation, guitar riff/chord leadership, selective solo moments as climactic punctuation",
    lyricRules: [
      "Align lyrical stress with backbeat-driven phrasing and natural sung emphasis.",
      "Use concrete imagery and avoid abstract filler unless subgenre explicitly calls for texture-first writing.",
      "Decide hook leadership per song: riff-led or chorus-led, and stay consistent.",
      "Keep section-to-section narrative and energy logic coherent.",
    ],
    sunoRules: [
      "Specify backbeat feel and groove aggressiveness.",
      "Specify riff role versus chorus role.",
      "Specify vocal frontness and distortion/space relationship.",
      "Specify instrument break/solo function in arrangement arc.",
    ],
  },
  subgenres: {
    "alternative rock": {
      style: "alternative rock with expressive guitar character and emotional section contrast",
      moodEnergy: "moody-to-anthemic arc with textural variance",
      instrumentFocus: "guitar color shifts, supportive bass counterlines, dynamic drum framing",
    },
    "punk rock": {
      style: "punk rock with fast direct propulsion and anti-polish urgency",
      moodEnergy: "immediate, aggressive, high-drive",
      vocalApproach: "direct shouted/sneered phrasing with minimal ornament",
      arrangementDynamics: "compact sections, rapid payoffs, short high-impact form",
      instrumentFocus: "power-chord engine, relentless drums, low-friction bass lock",
    },
    grunge: {
      style: "grunge with fuzzy guitar mass and quiet-loud dynamic switches",
      moodEnergy: "brooding pressure with explosive releases",
      vocalApproach: "raw, strained, emotionally unfiltered lead",
      instrumentFocus: "distorted guitar bed, thick bass support, stop-start drum emphasis",
    },
    "indie rock": {
      style: "indie rock with songcraft-first identity and idiosyncratic timbral choices",
      moodEnergy: "human-scale intensity with nuanced lift",
      instrumentFocus: "clean/crunch guitar interplay and melodic bass detail",
    },
    "classic rock": {
      style: "classic rock with riff-forward hooks, blues-pop harmonic pull, and live-band feel",
      moodEnergy: "steady groove to anthemic chorus expansion",
      arrangementDynamics: "verse/chorus with bridge/solo payoff",
      instrumentFocus: "guitar riff lead, drums with strong backbeat, bass root-drive, optional keys/organ color",
    },
    "hard rock": {
      style: "hard rock with thick riff attack and stadium-ready chorus authority",
      moodEnergy: "high-impact and swagger-heavy",
      vocalApproach: "belt/rasp capable lead",
      instrumentFocus: "heavy guitar stacks, punchy drums, locked low-end, expressive lead breaks",
    },
    "psychedelic rock": {
      style: "psychedelic rock with exploratory textures and fluid section transitions",
      moodEnergy: "trance-like build and release over strict punch architecture",
      arrangementDynamics: "allow freer expansion and jam-like passages",
      instrumentFocus: "effects-rich guitars/keys, droning support, atmospheric motion",
    },
  },
};

const RNB_AGENT: GenreAgent = {
  id: "rnb-agent",
  genre: "R&B",
  model: "pocket+harmony+vocal-arrangement architecture",
  version: "2026-02-13",
  baseline: {
    style:
      "english-language R&B built on pocket, extended-harmony color, intimate lead vocal identity, and groove-first momentum",
    moodEnergy:
      "controlled emotional arc with intimate verses and bigger harmonic/vocal lift in chorus and ending passages",
    vocalApproach:
      "frontline lead with soulful control, melisma where earned, harmony stacks and ad-libs as arrangement devices",
    arrangementDynamics:
      "verse/pre/chorus family with optional vamp runway; section growth through voicing, stacks, and groove density",
    instrumentFocus:
      "drum+bass pocket lock, chord-color keys/guitar comping, selective motif riffs, supportive background vocal layers",
    lyricRules: [
      "Prioritize intimate relational clarity and subtext over generic declarations.",
      "Write singable lines with vowel openness and stress-aware phrasing.",
      "Use ad-libs and harmony cues intentionally, not as random fillers.",
      "Preserve pocket-friendly line lengths and avoid consonant-heavy clutter.",
    ],
    sunoRules: [
      "Specify pocket feel and microtiming character (tight, laid-back, loose).",
      "Specify harmonic color level (7ths/9ths/11ths/13ths style).",
      "Specify vocal texture plan (lead, doubles, stacks, ad-lib runway).",
      "Specify arrangement lift mechanics (pre-chorus build, vamp/bridge runway, final chorus expansion).",
    ],
  },
  subgenres: {
    "contemporary r&b": {
      style: "contemporary R&B with polished modern sheen and groove-centered intimacy",
      moodEnergy: "intimate restraint to confident chorus release",
      instrumentFocus: "programmed drums, synth bass support, harmonic keys with controlled detail",
    },
    "neo-soul": {
      style: "neo-soul with organic pocket looseness and lineage-rich harmonic color",
      moodEnergy: "warm, reflective, emotionally weighty",
      vocalApproach: "conversational intimacy plus expressive soulful runs",
      arrangementDynamics: "groove-first development with richer vamp potential",
      instrumentFocus: "live-feel drums, expressive bass phrasing, Rhodes/piano color movement",
    },
    "alternative r&b": {
      style: "alternative R&B with left-field texture and mood-led architecture",
      moodEnergy: "moody, ambiguous, often low-glow intensity",
      vocalApproach: "restrained/airy lead integrated into sonic texture",
      arrangementDynamics: "less obvious chorus punch; atmosphere can carry transitions",
      instrumentFocus: "sparse programmed bed, atmospheric synth layers, selective rhythmic accents",
    },
    "new jack swing": {
      style: "new jack swing fusion: R&B melody with hip-hop informed rhythmic bite",
      moodEnergy: "confident, kinetic, dance-ready",
      vocalApproach: "clean sung hooks with rhythmic verse attitude",
      arrangementDynamics: "strong sectional contrast around punchy groove shifts",
      instrumentFocus: "drum-machine swing, sample/synth stabs, tight low-end punch",
    },
    soul: {
      style: "classic soul-rooted R&B with powerful emotional vocal center",
      moodEnergy: "deep-feeling, dramatic, release-oriented",
      vocalApproach: "high-intensity lead with call-response readiness and melismatic lift",
      arrangementDynamics: "chorus/refrain emphasis with strong endgame payoff",
      instrumentFocus: "live groove rhythm section, supporting harmonic color, vocal-stack emphasis",
    },
    funk: {
      style: "funk-R&B where groove is the primary compositional event",
      moodEnergy: "kinetic and swagger-forward",
      vocalApproach: "rhythmic vocal phrasing; hooks can be percussive/chant-like",
      arrangementDynamics: "vamp-friendly repetition and groove escalation",
      instrumentFocus: "bass-riff leadership, rhythmic guitar stabs, tight drum interlock, horn-like punctuations",
    },
    "bedroom r&b": {
      style: "bedroom R&B with close-mic intimacy and minimalist emotional focus",
      moodEnergy: "subdued, vulnerable, late-night private tone",
      vocalApproach: "soft, breath-forward lead with subtle harmony support",
      arrangementDynamics: "small-scale dynamic changes, understated chorus arrival",
      instrumentFocus: "minimal warm keys/pads, low-transient drums, focused low-end",
    },
    "new jack": {
      style: "new jack swing fusion: R&B melody with hip-hop informed rhythmic bite",
      moodEnergy: "confident, kinetic, dance-ready",
      vocalApproach: "clean sung hooks with rhythmic verse attitude",
      arrangementDynamics: "strong sectional contrast around punchy groove shifts",
      instrumentFocus: "drum-machine swing, sample/synth stabs, tight low-end punch",
    },
  },
};

const JAZZ_AGENT: GenreAgent = {
  id: "jazz-agent",
  genre: "Jazz",
  model: "head-solo-head jazz architecture",
  version: "2026-02-13",
  baseline: {
    style: "improvisation-led jazz with rich harmony, head/solo dynamics, and ensemble interplay",
    moodEnergy: "dynamic contour from restrained statement to expressive improvisational lift",
    vocalApproach: "instrumental-first; if vocal, use phrasing-aware croon/scat with rhythmic nuance",
    arrangementDynamics: "clear head statement, solo space, and return/reprise logic",
    instrumentFocus: "piano/bass/drums + horn dialogue; harmonic extensions and comping clarity",
    lyricRules: [
      "Keep lyrics sparse, elegant, and image-rich when vocals are present.",
      "Use prosody aligned to swing feel and phrase accents.",
      "Avoid pop-cliche hooks that ignore jazz phrasing.",
    ],
    sunoRules: [
      "Specify swing vs straight feel and tempo class.",
      "Specify harmonic density (ii-V-I, modal, altered tensions) by subgenre.",
      "Specify solo responsibility and section handoffs.",
    ],
  },
  subgenres: {
    "swing": { style: "swing/big-band dance jazz with arranged ensemble hits", instrumentFocus: "horn sections + walking bass + ride-led drums" },
    "bebop": { style: "bebop with rapid changes and virtuosic melodic lines", moodEnergy: "high velocity and intellectual tension", instrumentFocus: "small-combo horns, fast ride cymbal, walking bass" },
    "hard bop": { style: "hard bop blending jazz complexity with blues/gospel soul", instrumentFocus: "quintet feel, punchy backbeat accents, soulful comping" },
    "cool jazz": { style: "cool jazz with relaxed phrasing and airy textures", moodEnergy: "subdued, introspective", instrumentFocus: "brushes, mellow horns, spacious comping" },
    "modal jazz": { style: "modal jazz centered on scalar exploration over static harmony", arrangementDynamics: "long-form improvisational expansion", instrumentFocus: "pedal points, sparse harmonic movement" },
    "free jazz": { style: "free jazz with atonal/open-form collective improvisation", arrangementDynamics: "unfixed form and meter with intentional volatility" },
    "latin jazz": { style: "latin jazz with clave-driven rhythmic framework", instrumentFocus: "congas/timbales + montuno + brass/horn solos" },
    "fusion": { style: "jazz fusion with rock/funk-electric language", instrumentFocus: "electric bass/guitar/synth and hybrid drum articulation" },
    "smooth jazz": { style: "smooth jazz with melody-first polish and soft groove", moodEnergy: "warm and relaxed", instrumentFocus: "lead sax/guitar, glossy rhythm bed" },
    "vocal jazz": { style: "vocal jazz/standards interpretation with lyrical clarity", vocalApproach: "fronted vocalist with expressive phrasing and tasteful scat" },
  },
};

const BLUES_AGENT: GenreAgent = {
  id: "blues-agent",
  genre: "Blues",
  model: "12-bar-and-call-response blues architecture",
  version: "2026-02-13",
  baseline: {
    style: "blues rooted in 12-bar cyclic gravity, call-response, and emotional directness",
    moodEnergy: "grounded groove with expressive vocal ache and controlled intensity",
    vocalApproach: "speech-like phrasing, grit, and emotive bends over melisma-heavy delivery",
    arrangementDynamics: "cyclic verse development with riff callbacks and turnaround logic",
    instrumentFocus: "guitar-led motifs, I-IV-V7 gravity, bass/drums pocket, harmonica/piano support",
    lyricRules: [
      "Use concrete first-person or direct address with emotional honesty.",
      "Favor memorable refrain lines and AAB-like rhetorical recurrence where natural.",
      "Leave phrase space for instrumental responses.",
    ],
    sunoRules: [
      "Specify shuffle/swing vs straight blues-rock feel.",
      "Specify guitar/harp/piano role and turnaround behavior.",
      "Specify vocal roughness and live-room intimacy.",
    ],
  },
  subgenres: {
    "delta blues": { style: "delta/acoustic blues with raw rural intimacy", instrumentFocus: "slide/fingerpicked acoustic guitar with sparse percussion" },
    "chicago blues": { style: "chicago electric blues with amplified urban grit", instrumentFocus: "electric guitar + harp + rhythm section shuffle" },
    "texas blues": { style: "texas blues with swing and melodic guitar authority", instrumentFocus: "lead guitar phrasing + boogie piano option" },
    "piedmont blues": { style: "piedmont fingerstyle blues with ragtime syncopation", instrumentFocus: "thumb-bass fingerpicking and clear vocal narration" },
    "jump blues": { style: "jump blues with uptempo swing and party-band drive", moodEnergy: "high and celebratory", instrumentFocus: "horn section + boogie piano + brisk rhythm" },
    "blues rock": { style: "blues-rock with distorted riff energy and extended solos", moodEnergy: "aggressive and anthemic", instrumentFocus: "overdriven guitars and hard backbeat drums" },
    "soul blues": { style: "soul blues with R&B warmth and gospel-tinted vocals", instrumentFocus: "horn/keys support with smooth groove pocket" },
    "british blues": { style: "british blues revival tone with rock-weighted attack" },
    "modern blues": { style: "contemporary blues blending tradition and modern polish" },
  },
};

const GOSPEL_AGENT: GenreAgent = {
  id: "gospel-agent",
  genre: "Gospel",
  model: "testimony-and-chorus gospel architecture",
  version: "2026-02-13",
  baseline: {
    style: "gospel rooted in testimony language, call-response, and spiritually driven chorus lift",
    moodEnergy: "from intimate testimony to communal exultation",
    vocalApproach: "lead-choir interplay with strong dynamic expression and intentional runs",
    arrangementDynamics: "verse testimony to repetitive anthem/tag sections with possible modulation",
    instrumentFocus: "piano/organ core, rhythm section groove, choir stack support",
    lyricRules: [
      "Use respectful faith-centered language and communal resonance.",
      "Allow repetitive refrain logic for congregational singability.",
      "Preserve emotional sincerity over ornamental phrasing.",
    ],
    sunoRules: [
      "Specify call-response behavior and choir prominence.",
      "Specify groove type (shuffle, pop-gospel, worship steady) and build path.",
      "Specify modulation/tag behavior when needed.",
    ],
  },
  subgenres: {
    "traditional gospel": { style: "traditional choir gospel with church-live intensity", instrumentFocus: "piano/organ + handclaps + full choir" },
    "contemporary gospel": { style: "contemporary/urban gospel with polished modern rhythm bed", instrumentFocus: "modern drums/keys with layered vocals" },
    "gospel blues": { style: "gospel blues with raw spiritual ache", instrumentFocus: "acoustic/piano-led sparse support" },
    "southern gospel": { style: "southern gospel quartet style with country tint", vocalApproach: "tight multi-part harmony-led delivery" },
    "pentecostal gospel": { moodEnergy: "high-energy, spontaneous praise momentum", arrangementDynamics: "flexible vamp/tag with rising intensity" },
    "gospel soul": { style: "gospel soul blend with secular-adjacent soul groove", instrumentFocus: "soul rhythm section + gospel vocal intensity" },
    "gospel jazz": { style: "gospel-jazz fusion with extended harmony and improv pockets", instrumentFocus: "jazz piano/horns + gospel lead phrasing" },
    "praise and worship": { style: "modern praise/worship with simple progression and anthem repetition", moodEnergy: "uplifting and reverent" },
  },
};

const REGGAE_AGENT: GenreAgent = {
  id: "reggae-agent",
  genre: "Reggae",
  model: "bass-and-skank reggae architecture",
  version: "2026-02-13",
  baseline: {
    style: "reggae grounded in one-drop gravity, offbeat skank, and bass-led melodic groove",
    moodEnergy: "laid-back but purposeful, with chant-ready chorus lift",
    vocalApproach: "conversational melodic delivery with room for patois/rhythmic phrasing",
    arrangementDynamics: "groove continuity with selective dub-style dropouts and chorus reinforcement",
    instrumentFocus: "bassline leadership, guitar/keys skank, drum one-drop, optional horn punctuations",
    lyricRules: [
      "Maintain clear socio-personal voice without caricatured dialect forcing.",
      "Use chant/refrain repetition for hooks.",
      "Keep lines breathable and groove-synchronous.",
    ],
    sunoRules: [
      "Specify one-drop/steppers/dancehall pulse behavior.",
      "Specify bass prominence and skank placement.",
      "Specify dub FX usage (delay/reverb) if requested.",
    ],
  },
  subgenres: {
    ska: { style: "ska with fast dance pulse and horn-led brightness", moodEnergy: "jubilant, high tempo", instrumentFocus: "walking bass, offbeat piano/guitar, horn riffs" },
    rocksteady: { style: "rocksteady with slower romantic sway and bass focus", instrumentFocus: "smooth vocals, bass-forward pocket, reduced horn density" },
    "roots reggae": { style: "roots reggae with conscious themes and meditative groove", instrumentFocus: "deep bass, organ bubble, sparse militant drums" },
    dub: { style: "dub with space-focused mix performance and FX-driven variation", arrangementDynamics: "dropouts, echoes, and instrumental focus" },
    dancehall: { style: "dancehall with digital riddim pulse and deejay-friendly energy", moodEnergy: "club-forward kinetic pressure" },
    "lovers rock": { style: "lovers rock with soft romantic tone and smooth vocal center", moodEnergy: "warm and intimate" },
    "reggae fusion": { style: "reggae fusion with pop/hip-hop crossover edges" },
  },
};

const AFROBEATS_AGENT: GenreAgent = {
  id: "afrobeats-agent",
  genre: "Afrobeats",
  model: "polyrhythmic groove-and-melody afrobeats architecture",
  version: "2026-02-13",
  baseline: {
    style: "afrobeats with syncopated polyrhythm, melodic hook economy, and dance-forward bounce",
    moodEnergy: "buoyant mid/high energy with groove-first emotional delivery",
    vocalApproach: "melodic lead with rhythmic phrasing, chant support, and multilingual agility",
    arrangementDynamics: "loop-groove continuity with incremental texture lifts and hook reinforcement",
    instrumentFocus: "interlocked percussion, sub-bass pulse, guitar/keys motifs, vocal hook stacks",
    lyricRules: [
      "Use culturally respectful phrasing and avoid generic pan-African flattening.",
      "Prioritize rhythmic singability and concise hook language.",
      "Keep verses groove-compatible; avoid dense over-writing.",
    ],
    sunoRules: [
      "Specify percussion lattice and bounce character.",
      "Specify vocal language blend and chant/harmony behavior.",
      "Specify groove evolution rather than dramatic structural drops.",
    ],
  },
  subgenres: {
    "afro pop": { style: "afropop with bright chorus-first accessibility", moodEnergy: "uplifting and radio-forward" },
    "afro-fusion": { style: "afro-fusion blending afrobeats with alt/global textures" },
    amapiano: { style: "amapiano-influenced afrobeats with log-drum bass signature", instrumentFocus: "log-drum low end + airy keys + shaker grid" },
    "afro-house": { style: "afro-house leaning afrobeats with four-on-floor momentum", instrumentFocus: "house kick grid + African percussion + chant hooks" },
    alté: { style: "alté with left-field cool, airy textures, and understated swagger", moodEnergy: "moody but dance-capable" },
    "afro-r&b": { style: "afro-r&b with smoother harmony and intimate vocal color" },
    "afro-swing": { style: "afro-swing with UK urban crossover cadence and bounce" },
  },
};

const FOLK_AGENT: GenreAgent = {
  id: "folk-agent",
  genre: "Folk",
  model: "story-and-acoustic folk architecture",
  version: "2026-02-13",
  baseline: {
    style: "folk songwriting driven by narrative clarity, acoustic intimacy, and melodic humility",
    moodEnergy: "human-scale emotional arc with subtle sectional growth",
    vocalApproach: "natural diction and conversational singing over virtuosic display",
    arrangementDynamics: "verse-led storytelling, restrained chorus lift, optional instrumental turn",
    instrumentFocus: "acoustic guitar/strings core, light percussion, organic room realism",
    lyricRules: [
      "Prioritize story coherence and meaningful image progression.",
      "Use concrete place/character details over abstract slogans.",
      "Keep rhyme/prosody natural; avoid forced cleverness.",
    ],
    sunoRules: [
      "Specify acoustic texture and room realism.",
      "Specify narrative pacing and chorus intensity ceiling.",
      "Specify folk-region flavor only when requested and respectful.",
    ],
  },
  subgenres: {
    "traditional folk": { style: "traditional folk with oral-tradition simplicity and communal cadence" },
    "contemporary folk": { style: "contemporary folk with modern clarity and singer-songwriter focus" },
    "folk rock": { style: "folk-rock with acoustic narrative plus rock rhythm support", moodEnergy: "moderate drive with lyrical frontness" },
    "indie folk": { style: "indie folk with intimate textures and modern restraint" },
    "americana": { style: "americana with roots blend and road-worn narrative realism" },
    "celtic folk": { style: "celtic-inflected folk with modal melody and traditional lilt" },
    bluegrass: { style: "bluegrass with fast acoustic virtuosity and high-tenor harmony", instrumentFocus: "banjo/fiddle/mandolin + upright bass drive" },
    "folk pop": { style: "folk-pop with cleaner hooks and gentle contemporary polish" },
  },
};

const SOUL_AGENT: GenreAgent = {
  id: "soul-agent",
  genre: "Soul",
  model: "gospel-rnb-pop soul architecture",
  version: "2026-02-13",
  baseline: {
    style: "soul rooted in gospel emotion, r&b groove, and hook-driven melodic sincerity",
    moodEnergy: "intimate ache to cathartic vocal release",
    vocalApproach: "expressive lead with tasteful melisma, call-response, and dynamic grit control",
    arrangementDynamics: "verse-to-chorus emotional climb with bridge/reprise payoff",
    instrumentFocus: "piano/keys, bass-drums pocket, horns/strings as emotional punctuation",
    lyricRules: [
      "Write emotionally specific lines with lived detail, not slogans.",
      "Build chorus as emotional thesis with repeated anchor phrase.",
      "Use ad-libs and response tags as expressive intent, not filler.",
    ],
    sunoRules: [
      "Specify vocal timbre arc and arrangement lift mechanics.",
      "Specify rhythm pocket and harmonic extension density.",
      "Specify whether horns/strings are foreground accents or bed layers.",
    ],
  },
  subgenres: {
    motown: { style: "motown soul with polished pop-soul bounce and tight hooks", instrumentFocus: "driving bass line, tambourine/snare snap, vocal harmony stack" },
    "southern soul": { style: "southern/deep soul with raw gospel grit and slower burn", vocalApproach: "earthy, impassioned, chest-forward delivery" },
    "neo soul": { style: "neo-soul with rich jazz harmony and pocket looseness", instrumentFocus: "rhodes/piano color, live-feel drums, expressive bass movement" },
    "philly soul": { style: "philly soul with lush orchestration and elegant groove polish", instrumentFocus: "strings/horns + smooth rhythm bed" },
    "northern soul": { style: "northern soul with uptempo dance pulse and classic vocal drive", moodEnergy: "bright, urgent, dancefloor-ready" },
    "blue eyed soul": { style: "blue-eyed soul with pop-accessible phrasing and soul arrangement grammar" },
    "psychedelic soul": { style: "psychedelic soul with experimental textures over groove core" },
    "contemporary soul": { style: "contemporary soul blending classic emotionality with modern production detail" },
  },
};

const METAL_AGENT: GenreAgent = {
  id: "metal-agent",
  genre: "Metal",
  model: "riff-and-impact metal architecture",
  version: "2026-02-13",
  baseline: {
    style: "metal built on riff primacy, rhythm precision, and high-contrast section impact",
    moodEnergy: "controlled aggression with structural peaks (breakdowns, solos, climactic choruses)",
    vocalApproach: "subgenre-specific harsh/clean strategy with articulation matching intensity",
    arrangementDynamics: "riff motif development, pre-drop tension, and decisive impact sections",
    instrumentFocus: "distorted guitar stacks, locked bass, assertive drums, targeted lead work",
    lyricRules: [
      "Keep imagery specific and emotionally committed, not cartoon-generic.",
      "Match diction density to tempo and vocal technique.",
      "Use recurring motif phrases for identity under heavy arrangements.",
    ],
    sunoRules: [
      "Specify rhythm engine (gallop, blast, breakdown, chug) by subgenre.",
      "Specify vocal split (clean/harsh) and mix-frontness.",
      "Specify guitar tuning density and solo/breakdown placement.",
    ],
  },
  subgenres: {
    "heavy metal": { style: "classic heavy metal with galloping riffs and anthemic hooks" },
    thrash: { style: "thrash metal with high-speed palm-muted aggression", moodEnergy: "frenetic and confrontational" },
    "death metal": { style: "death metal with brutal precision and guttural intensity", instrumentFocus: "blast-capable drums, tremolo riffs, growl-forward mix" },
    "black metal": { style: "black metal with icy tremolo and raw atmospheric hostility", arrangementDynamics: "hypnotic repetition and bleak build-outs" },
    doom: { style: "doom metal with slow crushing weight and dark sustain", moodEnergy: "oppressive, mournful" },
    "power metal": { style: "power metal with heroic melodic charge and high-register clean vocals" },
    progressive: { style: "progressive metal with meter/harmony complexity and technical shifts" },
    metalcore: { style: "metalcore with breakdown architecture and clean/harsh contrast", instrumentFocus: "syncopated chugs + breakdown drops + chorus lift" },
    deathcore: { style: "deathcore with extreme breakdown brutality and low-register vocal violence" },
    "nu metal": { style: "nu-metal with groove/hip-hop-influenced rhythm and angst-forward hooks" },
    symphonic: { style: "symphonic metal with orchestral layers and cinematic scale", instrumentFocus: "strings/choir + heavy rhythm bed" },
    gothic: { style: "gothic metal with dark romantic atmosphere and dramatic vocal contrast" },
  },
};

const EDM_AGENT: GenreAgent = {
  id: "edm-agent",
  genre: "EDM",
  model: "drop-and-groove edm architecture",
  version: "2026-02-13",
  baseline: {
    style: "electronic dance music centered on groove grid, repeated hook motif, and energy architecture",
    moodEnergy: "build-release cycles with high dancefloor continuity",
    vocalApproach: "minimal-to-hook-centric vocals, often processed and rhythm-locked",
    arrangementDynamics: "intro/build/drop/release logic with motif recurrence",
    instrumentFocus: "kick-bass engine, synth motif hierarchy, FX transitions, stereo energy design",
    lyricRules: [
      "Keep lyrics concise and hook-compatible; avoid dense narrative overload.",
      "Use repeatable phrases that survive looping.",
      "Match vowel rhythm to beat grid and drop timing.",
    ],
    sunoRules: [
      "Specify BPM range and primary beat grid behavior.",
      "Specify drop identity (bass, lead, chord-stab, breakbeat, etc.).",
      "Specify build devices and post-drop variation plan.",
    ],
  },
  subgenres: {
    house: { style: "house/deep/progressive house with four-on-floor groove", instrumentFocus: "steady kick, groove bassline, chord stabs/pads" },
    techno: { style: "techno with mechanical pulse and percussive hypnotic loops", moodEnergy: "driving and relentless" },
    trance: { style: "trance with soaring melodies and long euphoric builds", arrangementDynamics: "extended breakdown + melodic supersaw payoff" },
    "drum and bass": { style: "drum & bass with high-BPM breakbeat propulsion", instrumentFocus: "breakbeat kit + reese/sub bass + rapid rhythmic edits" },
    dubstep: { style: "dubstep with half-time drop and bass modulation focus", instrumentFocus: "wobble/growl bass + sparse heavy drum pattern" },
    "trap edm": { style: "trap EDM with 808-centric half-time bounce and hat-roll articulation" },
    "future bass": { style: "future bass with lush detuned chord hits and emotional vocal chops" },
    electro: { style: "electro with staccato synth stabs and robotic vocal texture" },
    ambient: { style: "ambient/chillout with texture-first pacing and minimal drop logic", moodEnergy: "calm, immersive" },
    breakbeat: { style: "breakbeat/big beat with syncopated drum-loop dominance and sampled grit" },
    synthwave: { style: "synthwave/retrowave with nostalgic 80s analog timbre and midtempo drive" },
    "uk garage": { style: "uk garage/2-step with shuffled syncopation and chopped soulful hooks" },
    experimental: { style: "experimental EDM with boundary-pushing form and sound-design-first identity" },
  },
};

const COUNTRY_AGENT: GenreAgent = {
  id: "country-agent",
  genre: "Country",
  model: "story-first country architecture",
  version: "2026-02-13",
  baseline: {
    style: "country songwriting anchored in narrative clarity, melodic honesty, and roots-informed groove",
    moodEnergy: "steady emotional arc with singalong chorus payoff",
    vocalApproach: "clear storytelling diction with natural twang inflection by substyle",
    arrangementDynamics: "verse narrative build, hooky chorus, optional bridge or instrumental turn",
    instrumentFocus: "acoustic/electric guitar core with bass-drums support, steel/fiddle color",
    lyricRules: [
      "Prioritize story specificity (place, object, relationship stakes).",
      "Keep hooks memorable and conversational.",
      "Avoid caricature checklists; write culturally grounded detail with restraint.",
    ],
    sunoRules: [
      "Specify rhythm feel (shuffle, straight, two-step, train beat).",
      "Specify country color instruments and their functional role.",
      "Specify vocal tone target (raw, polished, intimate, anthemic).",
    ],
  },
  subgenres: {
    "traditional country": { style: "traditional/honky-tonk country with barroom swing and heartbreak realism", instrumentFocus: "honky-tonk piano + steel/fiddle + two-step rhythm" },
    "honky tonk": { style: "honky-tonk country with swung two-beat and colloquial emotional directness" },
    outlaw: { style: "outlaw country with gritty rebel edge and rock-weighted rhythm" },
    "country pop": { style: "country pop with polished mainstream structure and melodic accessibility" },
    "contemporary nashville": { style: "mainstream nashville country with modern pop/hip-hop production cross-currents" },
    americana: { style: "americana/folk-country with rootsy instrumentation and reflective narrative tone" },
    bluegrass: { style: "bluegrass with fast acoustic virtuosity and high-tenor harmony stacks", instrumentFocus: "banjo/fiddle/mandolin + upright bass, no heavy kit" },
    "alt country": { style: "alt-country/indie country with raw electric textures and moodier lyric posture" },
    "country rock": { style: "country-rock with strong backbeat and guitar-forward anthem dynamics" },
    "bro country": { style: "bro-country with party-hook repetition and hybrid trap-pop rhythm" },
    "neo traditional": { style: "neo-traditional country with classic steel/fiddle grammar and warm analog tone" },
    "singer songwriter country": { style: "singer-songwriter country with minimal arrangement and confessional detail" },
    "western swing": { style: "western swing with dance-band shuffle and jazz-leaning harmonic turns" },
  },
};

const AGENTS: GenreAgent[] = [
  POP_AGENT,
  HIPHOP_AGENT,
  ROCK_AGENT,
  RNB_AGENT,
  JAZZ_AGENT,
  BLUES_AGENT,
  GOSPEL_AGENT,
  REGGAE_AGENT,
  AFROBEATS_AGENT,
  FOLK_AGENT,
  SOUL_AGENT,
  METAL_AGENT,
  EDM_AGENT,
  COUNTRY_AGENT,
];

function getAgentByGenre(genre?: string): GenreAgent | null {
  const key = normalizeKey(genre);
  if (!key) return null;
  const aliases: Record<string, string> = {
    "electronic": "edm",
    "electronic edm": "edm",
    "electronic dance music": "edm",
    "rnb": "r&b",
    "rhythm and blues": "r&b",
    "afrobeat": "afrobeats",
  };
  const resolved = aliases[key] ? normalizeKey(aliases[key]) : key;
  for (const agent of AGENTS) {
    if (normalizeKey(agent.genre) === resolved) return agent;
  }
  return null;
}

function getSubgenreDelta(agent: GenreAgent, subGenre?: string): { key: string; delta: SubgenreDelta } | null {
  const target = normalizeKey(subGenre);
  if (!target) return null;

  for (const [key, delta] of Object.entries(agent.subgenres)) {
    if (target === normalizeKey(key)) return { key, delta };
  }
  for (const [key, delta] of Object.entries(agent.subgenres)) {
    const normalized = normalizeKey(key);
    if (target.includes(normalized) || normalized.includes(target)) return { key, delta };
  }
  return null;
}

function mergeRules(baseline: string[], delta?: string[]): string[] {
  const merged = [...baseline, ...(delta || [])];
  return Array.from(new Set(merged));
}

export function buildGenreAgentDirectives(params: {
  genre?: string;
  subGenre?: string;
  language?: string;
  vocals?: string;
  instrumentation?: string;
  emotion?: string;
  scene?: string;
  audioEnv?: string;
}): GenreAgentDirectives {
  const agent = getAgentByGenre(params.genre);
  if (!agent) {
    return {
      hasAgent: false,
      sunoPromptDirectives: "",
      lyricDirectives: "",
    };
  }

  const match = getSubgenreDelta(agent, params.subGenre);
  const delta = match?.delta || {};

  const style = delta.style || agent.baseline.style;
  const moodEnergy = delta.moodEnergy || agent.baseline.moodEnergy;
  const vocalApproach = delta.vocalApproach || agent.baseline.vocalApproach;
  const arrangementDynamics = delta.arrangementDynamics || agent.baseline.arrangementDynamics;
  const instrumentFocus = delta.instrumentFocus || agent.baseline.instrumentFocus;

  const lyricRules = mergeRules(agent.baseline.lyricRules, delta.lyricRules)
    .map((rule) => `- ${rule}`)
    .join("\n");

  const sunoRules = mergeRules(agent.baseline.sunoRules, delta.sunoRules)
    .map((rule) => `- ${rule}`)
    .join("\n");

  const sunoPromptDirectives = `
Agent: ${agent.id} (${agent.version})
Style: ${style}
Mood/Energy: ${moodEnergy}
Vocal approach: ${vocalApproach}
Arrangement/Dynamics: ${arrangementDynamics}
Instrument focus: ${instrumentFocus}
Context fit: ${params.language || "English"}, ${params.vocals || "lead vocal"}, ${params.emotion || "emotional"}, ${params.scene || "song scene"}, ${params.audioEnv || "studio"}
Rules:
${sunoRules}
  `.trim();

  const lyricDirectives = `
Genre agent directives (${agent.id}):
- Genre: ${params.genre || "Pop"}
- Subgenre: ${params.subGenre || "Modern Pop"}${match?.key ? ` (matched profile: ${match.key})` : ""}
- Keep lyrics faithful to this style profile while preserving narrative coherence.
${lyricRules}
  `.trim();

  return {
    hasAgent: true,
    agentId: agent.id,
    subgenreMatched: match?.key,
    sunoPromptDirectives,
    lyricDirectives,
  };
}
