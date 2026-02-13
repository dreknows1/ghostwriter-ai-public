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

const AGENTS: GenreAgent[] = [POP_AGENT];

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
