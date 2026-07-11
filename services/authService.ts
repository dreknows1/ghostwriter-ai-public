
const SESSION_KEY = 'gwai_session';
const SESSION_TOKEN_KEY = 'gwai_session_token';

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

// --- Session bearer plumbing (SECURITY HOTFIX) -------------------------------
// The server mints a signed session token at every successful login. The client
// stores it and presents it as `Authorization: Bearer <token>` on every call to
// a gated endpoint (/api/db, /api/auth action:"db", /api/ai). The server derives
// the acting email FROM the token and ignores any email in the request body, so
// a caller can only ever act as themselves.

export const getSessionToken = (): string | null => {
  try {
    return localStorage.getItem(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
};

const persistSession = (session: AppSession, token?: string | null) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  if (token) localStorage.setItem(SESSION_TOKEN_KEY, token);
};

const clearStoredSession = () => {
  try {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_TOKEN_KEY);
  } catch {
    // ignore storage errors
  }
};

// Called when the server reports the session bearer is invalid/expired (a 401
// carrying `X-Session-Invalid`). Clears the local session and asks the app to
// route back to login. App.tsx listens for `songghost:sessionExpired`.
export const notifySessionExpired = () => {
  clearStoredSession();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('songghost:sessionExpired'));
  }
};

// fetch() wrapper that attaches the session bearer and fail-closes on an expired
// session. Every gated-endpoint call site MUST go through this.
export const authorizedFetch = async (
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> => {
  const token = getSessionToken();
  const headers = new Headers(init.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(input, { ...init, headers });
  if (res.status === 401 && res.headers.get('X-Session-Invalid') === '1') {
    notifySessionExpired();
  }
  return res;
};

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
    persistSession(session, json?.sessionToken);
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
    persistSession(session, json?.sessionToken);
    return { data: { session }, error: null };
  } catch (e: any) {
    return { data: null, error: e };
  }
};

// OAuth: the callback redirects back with a signed, single-use `oauth_token`
// (never a bare email). We redeem it here; the server verifies the token, derives
// the email FROM it, and returns a session plus the reusable session bearer.
export const signInWithOAuthToken = async (token: string) => {
  try {
    const resp = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'oauth', token }),
    });
    const json = await resp.json();
    if (!resp.ok) return { data: null, error: new Error(json?.error || 'OAuth sign in failed') };
    if (!json?.session) return { data: null, error: new Error('OAuth sign in failed') };
    persistSession(json.session, json?.sessionToken);
    return { data: { session: json.session }, error: null };
  } catch (e: any) {
    return { data: null, error: e };
  }
};

export const startProviderSignIn = (provider: string) => {
  const normalizedProvider = provider.toLowerCase().trim();
  window.location.href = `/api/oauth/start?provider=${encodeURIComponent(normalizedProvider)}`;
};

export const signOut = async () => {
  clearStoredSession();
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
