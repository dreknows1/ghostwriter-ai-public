
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

export const signUp = async (email: string, pass: string, referralCode?: string) => {
  try {
    const resp = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'signup', email, password: pass, referralCode }),
    });
    const json = await resp.json();
    if (!resp.ok) return { data: null, error: new Error(json?.error || 'Sign up failed') };
    const session = json?.session || createSession(email);
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { data: { session }, error: null };
  } catch (e: any) {
    return { data: null, error: e };
  }
};

export const signIn = async (email: string, pass: string) => {
  try {
    const resp = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'signin', email, password: pass }),
    });
    const json = await resp.json();
    if (!resp.ok) return { data: null, error: new Error(json?.error || 'Sign in failed') };
    const session = json?.session || createSession(email);
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { data: { session }, error: null };
  } catch (e: any) {
    return { data: null, error: e };
  }
};

export const signInWithOAuthEmail = async (email: string) => {
  try {
    const resp = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'oauth', email }),
    });
    const json = await resp.json();
    if (!resp.ok) return { data: null, error: new Error(json?.error || 'OAuth sign in failed') };
    const session = json?.session || createSession(email);
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { data: { session }, error: null };
  } catch (e: any) {
    return { data: null, error: e };
  }
};

export const startProviderSignIn = (provider: string) => {
  const normalizedProvider = provider.toLowerCase().trim();
  window.location.href = `/api/oauth/start?provider=${encodeURIComponent(normalizedProvider)}`;
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
