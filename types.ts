
export enum AppStep {
  AWAITING_LANGUAGE,
  AWAITING_GENRE,
  AWAITING_SUBGENRE,
  AWAITING_INSTRUMENTATION,
  AWAITING_AUDIO_ENV,
  AWAITING_SCENE,
  AWAITING_EMOTION,
  AWAITING_VOCALS,
  AWAITING_DUET_CONFIG,
  AWAITING_PERFORMER,
  AWAITING_SPECIFICS,
  AWAITING_ADDITIONAL_INFO,
  GENERATING,
  SONG_DISPLAYED,
  EDITING_SONG,
  RESIZING_PROMPT,
  PROFILE,
  ERROR,
}

export enum AppView {
  LANDING,
  STUDIO,
  PRICING,
  HELP,
  PROFILE,
  AUTH,
  TERMS
}

export interface SongInputs {
  language?: string;
  genre?: string;
  artStyle?: string;
  subGenre?: string;
  instrumentation?: string;
  audioEnv?: string;
  scene?: string;
  emotion?: string;
  vocals?: string;
  duetType?: string;
  performerType?: string;
  referenceArtist?: string;
  additionalInfo?: string;
  mundaneObjects?: string;
  awkwardMoment?: string;
}

export interface UserProfile {
  id?: string; // Unique DB identifier
  user_email: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  preferred_vibe?: string;
  preferred_art_style?: string; // New field for art style preference
  credits: number;
  last_reset_date?: string; // ISO String for monthly reset tracking
}

export interface Transaction {
  id: string;
  date: string;
  item: string;
  amount: number;
  credits: number;
  status: 'completed' | 'pending' | 'failed';
}

export interface SocialPack {
  shortDescription: string;
  instagramCaption: string;
  tiktokCaption: string;
  youtubeShortsCaption: string;
  hashtags: string[];
  cta: string;
}

export interface CulturalAuditItem {
  dimension: string;
  score: number;
  notes: string;
}

export interface CulturalAudit {
  overallScore: number;
  summary: string;
  checklist: CulturalAuditItem[];
}

export interface QualityGatePass {
  pass: number;
  score: number;
  action: 'accepted' | 'rewrite';
}

export interface QualityGateReport {
  minScore: number;
  finalScore: number;
  rewritesTriggered: number;
  passes: QualityGatePass[];
}

export interface SavedSong {
  id: string;
  user_email: string;
  title: string;
  suno_prompt: string;
  lyrics: string;
  album_art?: string;
  social_pack?: SocialPack;
  created_at: string;
}
