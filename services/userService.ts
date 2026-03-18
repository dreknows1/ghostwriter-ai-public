import { UserProfile, Transaction } from "../types";

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

export const getUserProfile = async (email: string): Promise<UserProfile | null> => {
  const data = await callDb("getUserProfileByEmail", { email });
  return data || null;
};

export const upsertUserProfile = async (profile: UserProfile) => {
  const data = await callDb("upsertUserProfileByEmail", {
    email: profile.user_email,
    display_name: profile.display_name,
    avatar_url: profile.avatar_url,
    bio: profile.bio,
    preferred_vibe: profile.preferred_vibe,
    preferred_art_style: profile.preferred_art_style,
    credits: profile.credits,
    last_reset_date: profile.last_reset_date,
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
