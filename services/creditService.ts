import { getUserProfile, upsertUserProfile } from './userService';

const FREE_MONTHLY_CREDITS = 30;

export const COSTS = {
  GENERATE_SONG: 4,
  EDIT_SONG: 1,
  GENERATE_ART: 8,
  SOCIAL_PACK: 1
};

const normalizeEmail = (email: string) => email.toLowerCase().trim();

async function ensureProfile(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const existing = await getUserProfile(normalizedEmail);

  if (existing) return existing;

  const now = new Date().toISOString();
  const created = {
    user_email: normalizedEmail,
    credits: FREE_MONTHLY_CREDITS,
    last_reset_date: now,
  };

  await upsertUserProfile(created);
  return created;
}

export const getUserCredits = async (email: string): Promise<number> => {
  try {
    const profile = await ensureProfile(email);

    const now = new Date();
    const lastReset = profile.last_reset_date ? new Date(profile.last_reset_date) : new Date(0);
    const shouldReset =
      now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear();

    if (!shouldReset) return profile.credits;

    const updated = {
      ...profile,
      credits: FREE_MONTHLY_CREDITS,
      last_reset_date: now.toISOString()
    };

    await upsertUserProfile(updated);
    return updated.credits;
  } catch (e) {
    console.error('Failed to fetch credits:', e);
    return 0;
  }
};

export const hasEnoughCredits = async (email: string, cost: number = 1): Promise<boolean> => {
  const credits = await getUserCredits(email);
  return credits >= cost;
};

export const deductCredits = async (email: string, amount: number = 1): Promise<number> => {
  try {
    const profile = await ensureProfile(email);
    const newBalance = Math.max(0, profile.credits - amount);

    await upsertUserProfile({
      ...profile,
      credits: newBalance,
    });

    return newBalance;
  } catch (e) {
    console.error('Credit deduction failed:', e);
    return await getUserCredits(email);
  }
};
