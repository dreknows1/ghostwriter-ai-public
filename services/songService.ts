import { SavedSong, SocialPack } from "../types";

const STORAGE_LIMIT = 25;

async function callDb(action: string, payload: any) {
  const res = await fetch("/api/db", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "DB call failed");
  return json.data;
}

export const getSongCount = async (email: string): Promise<number> => {
  const count = await callDb("getSongCountByEmail", { email });
  return Number(count || 0);
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
  if (!existingId) {
    const currentCount = await getSongCount(email);
    if (currentCount >= STORAGE_LIMIT) {
      throw new Error(
        `STORAGE LIMIT REACHED: Your studio discography is full (Max ${STORAGE_LIMIT} records). Please delete an old session to save this one.`
      );
    }
  }

  const row = await callDb("saveSongByEmail", {
    email,
    title,
    sunoPrompt,
    lyrics,
    albumArt,
    socialPack: social_pack,
    existingId,
  });

  return { data: [row], error: null };
};

export const getSavedSongs = async (email: string): Promise<SavedSong[]> => {
  const rows = await callDb("getSongsByEmail", { email });
  return Array.isArray(rows) ? rows : [];
};

export const deleteSong = async (songId: string, _email: string) => {
  await callDb("deleteSongById", { songId });
  return { error: null };
};

export const deleteAllUserSongs = async (email: string) => {
  await callDb("deleteAllSongsByEmail", { email });
};
