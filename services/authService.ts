
const SESSION_KEY = 'gwai_session';

type AppSession = {
  user: {
    id: string;
    email: string;
  };
};

const createSession = (email: string): AppSession => ({
  user: {
    id: `user_${email.toLowerCase().trim()}`,
    email: email.toLowerCase().trim(),
  }
});

export const signUp = async (email: string, _pass: string) => {
  const session = createSession(email);
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { data: { session }, error: null };
};

export const signIn = async (email: string, _pass: string) => {
  const session = createSession(email);
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { data: { session }, error: null };
};

export const signInWithOtp = async (email: string) => {
  const session = createSession(email);
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { data: { session }, error: null };
};

export const signOut = async () => {
  localStorage.removeItem(SESSION_KEY);
  return { error: null };
};

export const getSession = async () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppSession;
    if (!parsed?.user?.email) return null;
    return parsed;
  } catch {
    return null;
  }
};
