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

const AGENTS: GenreAgent[] = [POP_AGENT, HIPHOP_AGENT, ROCK_AGENT, RNB_AGENT];

function getAgentByGenre(genre?: string): GenreAgent | null {
  const key = normalizeKey(genre);
  if (!key) return null;
  for (const agent of AGENTS) {
    if (normalizeKey(agent.genre) === key) return agent;
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
