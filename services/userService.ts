import { UserProfile, Transaction } from "../types";
import { apiFetch } from "../lib/api";

async function callDb(action: string, payload: any) {
  const res = await apiFetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "db", dbAction: action, payload }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "DB call failed");
  return json.data;
}

export const getUserProfile = async (email: string): Promise<UserProfile | null> => {
  const data = await callDb("getUserProfileByEmail", { email });
  return data || null;
};

export const upsertUserProfile = async (profile: UserProfile) => {
  // C2: credits / last_reset_date are server-owned and no longer accepted by the
  // mutation. Only presentational fields are sent (and `email` is overridden to
  // the session token's email by the API proxy).
  const data = await callDb("upsertUserProfileByEmail", {
    email: profile.user_email,
    display_name: profile.display_name,
    avatar_url: profile.avatar_url,
    bio: profile.bio,
    preferred_vibe: profile.preferred_vibe,
    preferred_art_style: profile.preferred_art_style,
  });
  return { data, error: null };
};

export const deleteUserProfile = async (email: string) => {
  await callDb("deleteAccountByEmail", { email });
};

export const getUserTransactions = async (email: string): Promise<Transaction[]> => {
  const rows = await callDb("getTransactionsByEmail", { email });
  return Array.isArray(rows) ? rows : [];
};

export const recordLocalTransaction = async () => {
  return;
};

export const getReferralSummary = async (email: string) => {
  return await callDb("getReferralSummaryByEmail", { email });
};

export const getOrCreateReferralCode = async (email: string) => {
  return await callDb("getOrCreateReferralCodeByEmail", { email });
};

export const claimReferralCode = async (email: string, code: string) => {
  return await callDb("claimReferralCodeByEmail", { email, code });
};
