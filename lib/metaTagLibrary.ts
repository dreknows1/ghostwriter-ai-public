export type TagCategoryMap = Record<string, string[]>;

export type MetaTagPlan = {
  structureTags: string[];
  vocalTypeTag: string;
  moodEnergyTags: string[];
  genreAccentTags: string[];
  adlibPolicy: string;
  minTagCount: number;
  minAdlibCount: number;
};

export const META_TAG_CATEGORIES: TagCategoryMap = {
  Structure: [
    "[Verse]", "[Chorus]", "[Post-Chorus]", "[Bridge]", "[Pre-Chorus]", "[Intro]", "[Outro]",
    "[Hook]", "[Interlude]", "[Break]", "[Breakdown]", "[Drop]", "[Pre-Drop]", "[Build]",
    "[Transition]", "[Ad-Lib Section]", "[Instrumental]", "[Refrain]", "[Skit]", "[End]",
  ],
  "Sections (Styled)": [
    "[Short Instrumental Intro]", "[Long Melancholy Intro]", "[Ensemble Chorus]",
    "[Powerful Outro]", "[Big Finish]", "[Fade to End]", "[Instrumental Bridge]",
    "[Short Accelerating Interlude]", "[Melodic Interlude]",
  ],
  "Vocals (Type)": [
    "[Male Vocal]", "[Female Vocal]", "[Duet]", "[Choir]", "[Gospel Choir]",
    "[Vocalist: Female]", "[Vocalist: Male]", "[Layered Vocals]", "[Female Narrator]",
    "[Announcer]",
  ],
  "Vocal Styles": [
    "[Whisper]", "[Scream]", "[Falsetto]", "[Growl]", "[Rasp]", "[Melisma]", "[Staccato]",
    "[Spoken Word]", "[Rap Verse]", "[Belting]", "[Crooning]", "[Vulnerable Vocals]",
    "[Opera Verse]", "(Backing Vocals)",
  ],
  Instruments: [
    "[Guitar Solo]", "[Piano Solo]", "[Drum Solo]", "[Violin Solo]", "[Bass Solo]",
    "[Saxophone Solo]", "[Synth Solo]", "[Acoustic Guitar]", "[Heavy 808s]",
    "[Drum Break]", "[Violin Break]", "[Percussion Break]",
  ],
  "Instrument FX": [
    "[Soaring Lead Guitar Solo]", "[Fast and Intense Drum Solo]", "[Soft Piano Solo]",
    "[Distorted Bass]", "[Dancing Fiddle Solo]", "[Finger Style Guitar]", "[Playful Flute Solo]",
  ],
  "Dynamics / FX": [
    "[Build Up]", "[Crescendo]", "[Fade-In]", "[Fade-Out]", "[Silence]", "[Pause]",
    "[Stop]", "[Texture: Lo-fi]", "[Texture: Gritty]", "[Texture: Tape-Saturated]", "[Warm Saturation]",
  ],
  "Mood & Energy": [
    "[Energy: High]", "[Energy: Low]", "[Tempo: Fast]", "[Tempo: Slow]",
    "[Mood: Intense]", "[Mood: Chill]", "[Mood: Sad]", "[Mood: Uplifting]",
    "[Mood: Joyful]", "[Mood: Melancholic]",
  ],
};

const ADLIB_POLICY_BY_GENRE: Record<string, string> = {
  "hip-hop":
    "Use concise adlibs in parentheses after punch lines and rhyme landings. Keep them sparse and rhythmic (about 1 adlib every 2-4 bars).",
  rap:
    "Use concise adlibs in parentheses after punch lines and rhyme landings. Keep them sparse and rhythmic (about 1 adlib every 2-4 bars).",
  trap:
    "Use short, percussive adlibs in parentheses to reinforce cadence pockets, mostly at line ends.",
  rnb:
    "Use melodic adlibs in parentheses around pre-chorus/chorus transitions. Prioritize tasteful runs and emotional lift.",
  soul:
    "Use call-and-response adlibs in parentheses, especially near hook repeats and emotional peaks.",
  gospel:
    "Use supportive adlibs and response phrases in parentheses, keeping reverent and uplifting tone.",
  pop:
    "Use minimal adlibs in parentheses for hook reinforcement and post-chorus lift.",
  afrobeats:
    "Use energetic response adlibs in parentheses with danceable phrasing and refrain emphasis.",
  reggae:
    "Use laid-back response adlibs in parentheses, leaving space for groove and off-beat phrasing.",
};

const DEFAULT_TAG_SET = [
  "[Intro]",
  "[Verse]",
  "[Pre-Chorus]",
  "[Chorus]",
  "[Verse]",
  "[Chorus]",
  "[Bridge]",
  "[Chorus]",
  "[Outro]",
];

const HIPHOP_TAG_SET = [
  "[Intro]",
  "[Verse]",
  "[Hook]",
  "[Verse]",
  "[Hook]",
  "[Bridge]",
  "[Hook]",
  "[Ad-Lib Section]",
  "[End]",
];

const RNB_SOUL_TAG_SET = [
  "[Short Instrumental Intro]",
  "[Verse]",
  "[Pre-Chorus]",
  "[Chorus]",
  "[Verse]",
  "[Pre-Chorus]",
  "[Chorus]",
  "[Bridge]",
  "[Ensemble Chorus]",
  "[Powerful Outro]",
];

function inferPrimaryStructureTags(genre?: string): string[] {
  const g = (genre || "").toLowerCase();
  if (g.includes("hip-hop") || g.includes("rap") || g.includes("trap")) return HIPHOP_TAG_SET;
  if (g.includes("r&b") || g.includes("soul") || g.includes("gospel")) return RNB_SOUL_TAG_SET;
  return DEFAULT_TAG_SET;
}

function inferVocalTypeTag(vocals?: string): string {
  const v = (vocals || "").toLowerCase();
  if (v.includes("duet") || v.includes("duo") || v.includes("group")) return "[Duet]";
  if (v.includes("male")) return "[Male Vocal]";
  if (v.includes("female")) return "[Female Vocal]";
  if (v.includes("choir")) return "[Choir]";
  return "[Vocalist: Male]";
}

function inferEnergyMoodTags(emotion?: string): string[] {
  const e = (emotion || "").toLowerCase();
  if (!e) return ["[Energy: High]", "[Mood: Intense]"];
  if (e.includes("chill")) return ["[Energy: Low]", "[Mood: Chill]"];
  if (e.includes("melanch") || e.includes("sad") || e.includes("heartbroken")) return ["[Energy: Low]", "[Mood: Sad]"];
  if (e.includes("nostalg")) return ["[Energy: Low]", "[Mood: Melancholic]"];
  if (e.includes("euphor") || e.includes("joy") || e.includes("happy")) return ["[Energy: High]", "[Mood: Joyful]"];
  if (e.includes("hope")) return ["[Energy: High]", "[Mood: Uplifting]"];
  if (e.includes("aggress") || e.includes("intense") || e.includes("empower")) return ["[Energy: High]", "[Mood: Intense]"];
  return ["[Energy: High]", "[Mood: Intense]"];
}

function inferGenreAccentTags(genre?: string, subGenre?: string): string[] {
  const g = `${genre || ""} ${subGenre || ""}`.toLowerCase();
  if (g.includes("hip-hop") || g.includes("rap")) return ["[Rap Verse]", "[Heavy 808s]", "[Build Up]"];
  if (g.includes("trap")) return ["[Rap Verse]", "[Heavy 808s]", "[Drop]"];
  if (g.includes("r&b")) return ["[Vulnerable Vocals]", "(Backing Vocals)", "[Instrumental Bridge]"];
  if (g.includes("soul")) return ["[Crooning]", "(Backing Vocals)", "[Ensemble Chorus]"];
  if (g.includes("gospel")) return ["[Gospel Choir]", "(Backing Vocals)", "[Ensemble Chorus]"];
  if (g.includes("rock")) return ["[Guitar Solo]", "[Build Up]", "[Big Finish]"];
  if (g.includes("metal")) return ["[Scream]", "[Breakdown]", "[Big Finish]"];
  if (g.includes("edm") || g.includes("electronic")) return ["[Build Up]", "[Drop]", "[Pre-Drop]"];
  return ["[Build Up]"];
}

function inferAdlibPolicy(genre?: string): string {
  const g = (genre || "").toLowerCase();
  for (const [key, policy] of Object.entries(ADLIB_POLICY_BY_GENRE)) {
    if (g.includes(key)) return policy;
  }
  return "Use tasteful adlibs in parentheses only where they add musicality, not in every line.";
}

export function buildMetaTagGuidance(inputs: {
  genre?: string;
  subGenre?: string;
  vocals?: string;
  emotion?: string;
}): string {
  const structure = inferPrimaryStructureTags(inputs.genre).join(" -> ");
  const vocalType = inferVocalTypeTag(inputs.vocals);
  const moodEnergy = inferEnergyMoodTags(inputs.emotion).join(", ");
  const genreTags = inferGenreAccentTags(inputs.genre, inputs.subGenre).join(", ");
  const adlibPolicy = inferAdlibPolicy(inputs.genre);

  return `
Meta Tag Library directives (use these tags exactly):
- Preferred section flow: ${structure}
- Required vocal type tag: ${vocalType}
- Mood/energy guidance tags: ${moodEnergy}
- Genre accent tags: ${genreTags}
- Include occasional adlibs in parentheses, example format: (yeah), (uh), (come on), (let it ride)
- Adlib policy: ${adlibPolicy}
- Keep tags musically meaningful; avoid tag spam.
- Keep tag syntax exact with brackets/parentheses.
`.trim();
}

export function buildMetaTagPlan(inputs: {
  genre?: string;
  subGenre?: string;
  vocals?: string;
  emotion?: string;
}): MetaTagPlan {
  const structureTags = inferPrimaryStructureTags(inputs.genre);
  const genre = (inputs.genre || "").toLowerCase();
  const adlibHeavy = genre.includes("hip-hop") || genre.includes("rap") || genre.includes("trap") || genre.includes("afrobeats");
  const adlibMedium = genre.includes("r&b") || genre.includes("soul") || genre.includes("gospel") || genre.includes("reggae");

  return {
    structureTags,
    vocalTypeTag: inferVocalTypeTag(inputs.vocals),
    moodEnergyTags: inferEnergyMoodTags(inputs.emotion),
    genreAccentTags: inferGenreAccentTags(inputs.genre, inputs.subGenre),
    adlibPolicy: inferAdlibPolicy(inputs.genre),
    minTagCount: Math.max(10, structureTags.length + 3),
    minAdlibCount: adlibHeavy ? 6 : adlibMedium ? 4 : 2,
  };
}

export function buildStrictMetaTagSpec(inputs: {
  genre?: string;
  subGenre?: string;
  vocals?: string;
  emotion?: string;
}): string {
  const plan = buildMetaTagPlan(inputs);
  return `
Strict meta-tag orchestration plan:
- Section order to follow: ${plan.structureTags.join(" -> ")}
- Required vocal identity tag: ${plan.vocalTypeTag}
- Mood/energy tags to include across song: ${plan.moodEnergyTags.join(", ")}
- Genre/subgenre accent tags to include naturally: ${plan.genreAccentTags.join(", ")}
- Minimum bracket tags in Lyrics body: ${plan.minTagCount}
- Minimum adlibs in parentheses: ${plan.minAdlibCount}
- Adlib policy: ${plan.adlibPolicy}
- Tag logic: opening sections establish mood + voice; mid-song sections escalate arrangement tags; final sections resolve with refrain/outro tags.
`.trim();
}
