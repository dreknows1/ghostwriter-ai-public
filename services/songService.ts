import { SavedSong, SocialPack } from '../types';

const LOCAL_STORAGE_KEY = 'baim_saved_songs';
const STORAGE_LIMIT = 25;

const normalizeEmail = (email: string) => email.toLowerCase().trim();

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const getAllSongs = (): SavedSong[] => {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const setAllSongs = (songs: SavedSong[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(songs));
  } catch (e: any) {
    if (e.name === 'QuotaExceededError' || e.code === 22) {
      const lightweightSongs = songs.map(s => ({ ...s, album_art: undefined }));
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(lightweightSongs));
      return;
    }
    throw e;
  }
};

export const getSongCount = async (email: string): Promise<number> => {
  const normalizedEmail = normalizeEmail(email);
  const songs = getAllSongs();
  return songs.filter((s) => s.user_email.toLowerCase().trim() === normalizedEmail).length;
};

export const saveSong = async (
  email: string,
  title: string,
  sunoPrompt: string,
  lyrics: string,
  albumArt?: string,
  social_pack?: SocialPack,
  existingId?: string
) => {
  const normalizedEmail = normalizeEmail(email);

  if (!existingId) {
    const currentCount = await getSongCount(email);
    if (currentCount >= STORAGE_LIMIT) {
      throw new Error(`STORAGE LIMIT REACHED: Your studio discography is full (Max ${STORAGE_LIMIT} records). Please delete an old session to save this one.`);
    }
  }

  const songId = existingId || generateId();
  const timestamp = new Date().toISOString();

  const newSong: SavedSong = {
    id: songId,
    user_email: normalizedEmail,
    title,
    suno_prompt: sunoPrompt,
    lyrics,
    album_art: albumArt,
    social_pack,
    created_at: timestamp,
  };

  const songs = getAllSongs();
  const index = songs.findIndex((s) => s.id === songId);

  if (index !== -1) {
    songs[index] = { ...newSong, created_at: songs[index].created_at || timestamp };
  } else {
    songs.push(newSong);
  }

  setAllSongs(songs);

  return { data: [newSong], error: null };
};

export const getSavedSongs = async (email: string) => {
  const normalizedEmail = normalizeEmail(email);
  const songs = getAllSongs().filter((s) => s.user_email.toLowerCase().trim() === normalizedEmail);

  return songs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

export const deleteSong = async (songId: string, _email: string) => {
  const songs = getAllSongs();
  const filtered = songs.filter((s) => s.id !== songId);
  setAllSongs(filtered);
  return { error: null };
};

export const deleteAllUserSongs = async (email: string) => {
  const normalizedEmail = normalizeEmail(email);
  const songs = getAllSongs();
  const filtered = songs.filter((s) => s.user_email.toLowerCase().trim() !== normalizedEmail);
  setAllSongs(filtered);
};
