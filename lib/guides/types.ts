/**
 * Genre Authenticity Fingerprint — The Full Fingerprint
 *
 * Each genre guide covers 22 dimensions that define what makes a genre
 * authentic. The first 12 describe what the music contains. The next 10
 * capture the relational and embodied layer: how the music moves, how it
 * speaks to itself, and what it refuses to do.
 */

export interface SonicPalette {
  overview: string;
  timbre: string[];
  texture: string;
  tonality: string;
  signatureSounds: string[];
}

export interface RhythmAndGroove {
  overview: string;
  bpmRange: { min: number; max: number; sweet: number };
  feel: string;
  swing: string;
  syncopation: string;
  grooveArchetype: string;
  rhythmicSignatures: string[];
}

export interface HarmonicLanguage {
  overview: string;
  scales: string[];
  chordProgressions: string[];
  harmonyNotes: string;
  modality: string;
}

export interface SongStructure {
  overview: string;
  form: string;
  sections: string[];
  arrangement: string;
  introOutro: string;
  barLengths: string;
  hookPlacement: string;
}

export interface VocalDelivery {
  overview: string;
  phrasing: string;
  affect: string;
  techniques: string[];
  adlibStyle: string;
  harmony: string;
  grit: string;
}

export interface LyricalConventions {
  overview: string;
  themes: string[];
  perspective: string;
  figurativeLanguage: string;
  vocabulary: string;
  storytellingApproach: string;
  cliches: string[];
}

export interface ProductionFingerprint {
  overview: string;
  mixAesthetic: string;
  era: string;
  signalChain: string;
  modernTrends: string;
}

export interface Instrumentation {
  coreInstruments: string[];
  signatureSounds: string[];
  layering: string;
  avoidInstruments: string[];
}

export interface CulturalContext {
  overview: string;
  origin: string;
  identity: string;
  community: string;
  socialFunction: string;
  authenticityMarkers: string[];
}

export interface HistoricalLineage {
  overview: string;
  roots: string[];
  evolution: string;
  keyEras: string[];
  influencedBy: string[];
  influenced: string[];
}

export interface SubGenreEmbodiedDelta {
  // Relational & embodied overrides
  microTimingAndFeel?: Partial<MicroTimingAndFeel>;
  silenceAndSpace?: Partial<SilenceAndSpace>;
  callAndResponse?: Partial<CallAndResponse>;
  regionalDialectSpecificity?: Partial<RegionalDialectSpecificity>;
  performancePractice?: Partial<PerformancePractice>;
  socioeconomicSubtext?: Partial<SocioeconomicSubtext>;
  intertextualityAndSampling?: Partial<IntertextualityAndSampling>;
  genderAndBodyConventions?: Partial<GenderAndBodyConventions>;
  tempoFeelVsNumber?: Partial<TempoFeelVsNumber>;
  mistakeConventions?: Partial<MistakeConventions>;
  // Descriptive overrides
  sonicPalette?: Partial<SonicPalette>;
  rhythmAndGroove?: Partial<RhythmAndGroove>;
  harmonicLanguage?: Partial<HarmonicLanguage>;
  songStructure?: Partial<SongStructure>;
  vocalDelivery?: Partial<VocalDelivery>;
  lyricalConventions?: Partial<LyricalConventions>;
  productionFingerprint?: Partial<ProductionFingerprint>;
  instrumentation?: Partial<Instrumentation>;
}

export interface SubGenreProfile {
  name: string;
  description: string;
  distinguishingFeatures: string[];
  bpmRange?: { min: number; max: number };
  keyArtists: string[];
  productionNotes: string;
  lyricNotes: string;
  sunoPromptKeywords: string[];
  embodiedDelta?: SubGenreEmbodiedDelta;
}

export interface SceneAndAudienceCodes {
  overview: string;
  fanExpectations: string[];
  gatekeeping: string;
  livePerformance: string;
  fashionAndAesthetic: string;
  crossoverPotential: string;
}

// ── Relational & Embodied Dimensions ──────────────────────────────

export interface MicroTimingAndFeel {
  overview: string;
  quantizationDeviation: string;
  aheadBehindBeat: string;
  humanizationMarkers: string[];
  genreSpecificFeel: string;
}

export interface SilenceAndSpace {
  overview: string;
  negativeSpaceRole: string;
  breathingPatterns: string;
  dynamicContrast: string;
  whatIsDeliberatelyAbsent: string[];
}

export interface CallAndResponse {
  overview: string;
  vocalInstrumentalDialogue: string;
  sectionInternal: string;
  audienceParticipation: string;
  patterns: string[];
}

export interface RegionalDialectSpecificity {
  overview: string;
  phoneticMarkers: string[];
  accentInfluence: string;
  dialectVocabulary: string[];
  regionWithinCulture: string;
}

export interface PerformancePractice {
  overview: string;
  improvisationConventions: string;
  crowdInteraction: string;
  stagePresence: string;
  livVsRecordedDifferences: string;
  whatMakesAGoodShow: string;
}

export interface SocioeconomicSubtext {
  overview: string;
  materialConditions: string;
  classIdentity: string;
  politicalUndercurrent: string;
  implicitReferences: string[];
}

export interface IntertextualityAndSampling {
  overview: string;
  canonKnowledge: string;
  samplingTradition: string;
  quotationPractice: string;
  expectedReferences: string[];
  lineageSignifiers: string[];
}

export interface GenderAndBodyConventions {
  overview: string;
  vocalGenderCodes: string;
  physicalityInPerformance: string;
  genderNarratives: string;
  subversionExamples: string[];
}

export interface TempoFeelVsNumber {
  overview: string;
  psychologicalTempo: string;
  weightAndMomentum: string;
  urgencyScale: string;
  comparisonToSameBPM: string;
}

export interface MistakeConventions {
  overview: string;
  toleratedImperfections: string[];
  celebratedFlaws: string[];
  overproductionRisks: string[];
  authenticRoughness: string;
}

// ── Main Guide Interface ──────────────────────────────────────────

export interface GenreGuide {
  id: string;
  name: string;
  language: string;

  // Descriptive dimensions (what the music contains)
  sonicPalette: SonicPalette;
  rhythmAndGroove: RhythmAndGroove;
  harmonicLanguage: HarmonicLanguage;
  songStructure: SongStructure;
  vocalDelivery: VocalDelivery;
  lyricalConventions: LyricalConventions;
  productionFingerprint: ProductionFingerprint;
  instrumentation: Instrumentation;
  culturalContext: CulturalContext;
  historicalLineage: HistoricalLineage;
  subGenres: SubGenreProfile[];
  sceneAndAudienceCodes: SceneAndAudienceCodes;

  // Relational & embodied dimensions (how the music lives)
  microTimingAndFeel: MicroTimingAndFeel;
  silenceAndSpace: SilenceAndSpace;
  callAndResponse: CallAndResponse;
  regionalDialectSpecificity: RegionalDialectSpecificity;
  performancePractice: PerformancePractice;
  socioeconomicSubtext: SocioeconomicSubtext;
  intertextualityAndSampling: IntertextualityAndSampling;
  genderAndBodyConventions: GenderAndBodyConventions;
  tempoFeelVsNumber: TempoFeelVsNumber;
  mistakeConventions: MistakeConventions;

  sunoPromptGuide: {
    essentialKeywords: string[];
    avoidKeywords: string[];
    promptTemplate: string;
    tips: string[];
  };
}
