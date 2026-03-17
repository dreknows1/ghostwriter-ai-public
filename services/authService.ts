
const SESSION_KEY = 'gwai_session';
const SERVER_TOKEN_KEY = 'gwai_server_session_token';

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

async function parseJsonSafe(resp: Response): Promise<any> {
  const text = await resp.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { error: text || "Invalid server response" };
  }
}

export const signUp = async (email: string, pass: string, referralCode?: string) => {
  try {
    const resp = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'signup', email, password: pass, referralCode }),
    });
    const json = await parseJsonSafe(resp);
    if (!resp.ok) return { data: null, error: new Error(json?.error || 'Sign up failed') };
    const session = json?.session || createSession(email);
    if (json?.sessionToken) localStorage.setItem(SERVER_TOKEN_KEY, String(json.sessionToken));
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
    const json = await parseJsonSafe(resp);
    if (!resp.ok) return { data: null, error: new Error(json?.error || 'Sign in failed') };
    const session = json?.session || createSession(email);
    if (json?.sessionToken) localStorage.setItem(SERVER_TOKEN_KEY, String(json.sessionToken));
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
    const json = await parseJsonSafe(resp);
    if (!resp.ok) return { data: null, error: new Error(json?.error || 'OAuth sign in failed') };
    const session = json?.session || createSession(email);
    if (json?.sessionToken) localStorage.setItem(SERVER_TOKEN_KEY, String(json.sessionToken));
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
  try {
    await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'signout' }),
    });
  } catch {
    // Ignore network errors; local session is still cleared.
  }
  localStorage.removeItem(SERVER_TOKEN_KEY);
  localStorage.removeItem(SESSION_KEY);
  return { error: null };
};

export const getServerSessionToken = (): string => {
  try {
    return localStorage.getItem(SERVER_TOKEN_KEY) || "";
  } catch {
    return "";
  }
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
