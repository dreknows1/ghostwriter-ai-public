import { UserProfile, Transaction } from '../types';

const LOCAL_STORAGE_KEY = 'baim_user_profiles';
const TX_STORAGE_KEY = 'baim_transactions';

const normalizeEmail = (email: string) => email.toLowerCase().trim();

export const getUserProfile = async (email: string): Promise<UserProfile | null> => {
  const normalizedEmail = normalizeEmail(email);

  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) return null;
    const profiles = JSON.parse(stored);
    return profiles[normalizedEmail] || null;
  } catch (e) {
    console.error('Error reading local profile:', e);
    return null;
  }
};

export const upsertUserProfile = async (profile: UserProfile) => {
  const profileToSave = {
    ...profile,
    user_email: normalizeEmail(profile.user_email)
  };

  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    const profiles = stored ? JSON.parse(stored) : {};

    profiles[profileToSave.user_email] = {
      ...profiles[profileToSave.user_email],
      ...profileToSave
    };

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profiles));
    return { data: profileToSave, error: null };
  } catch (e: any) {
    console.error('Error saving local profile:', e);
    return { data: null, error: e };
  }
};

export const deleteUserProfile = async (email: string) => {
  const normalizedEmail = normalizeEmail(email);

  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      const profiles = JSON.parse(stored);
      delete profiles[normalizedEmail];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profiles));
    }

    const storedTx = localStorage.getItem(TX_STORAGE_KEY);
    if (storedTx) {
      const allTx = JSON.parse(storedTx);
      const filteredTx = allTx.filter((t: any) => t.user_email !== normalizedEmail);
      localStorage.setItem(TX_STORAGE_KEY, JSON.stringify(filteredTx));
    }
  } catch {
    // no-op
  }
};

export const getUserTransactions = async (email: string): Promise<Transaction[]> => {
  const normalizedEmail = normalizeEmail(email);

  try {
    const stored = localStorage.getItem(TX_STORAGE_KEY);
    if (!stored) return [];
    const allTx = JSON.parse(stored);
    return allTx
      .filter((t: any) => t.user_email === normalizedEmail)
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const recordLocalTransaction = (email: string, item: string, amount: number, credits: number) => {
  const normalizedEmail = normalizeEmail(email);
  const newTx = {
    id: 'tx_' + Math.random().toString(36).slice(2, 11),
    user_email: normalizedEmail,
    date: new Date().toISOString(),
    item,
    amount,
    credits,
    status: 'completed'
  };

  try {
    const stored = localStorage.getItem(TX_STORAGE_KEY);
    const allTx = stored ? JSON.parse(stored) : [];
    allTx.push(newTx);
    localStorage.setItem(TX_STORAGE_KEY, JSON.stringify(allTx));
  } catch {
    // no-op
  }
};
