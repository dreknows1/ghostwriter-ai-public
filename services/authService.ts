import { apiFetch, apiUrl } from '../lib/api';
import { isNative } from '../lib/platform';
import { legacyLocalStorageGet, SESSION_TOKEN_KEY, storageGet, storageRemove, storageSet } from '../lib/storage';

const SESSION_KEY = 'gwai_session';

/**
 * Persist the server-verified session bearer minted by the login endpoints.
 * apiFetch reads it from storage (same SESSION_TOKEN_KEY) to authenticate every
 * subsequent request. Silently ignores an absent token (older server build).
 */
async function storeSessionToken(token: unknown): Promise<void> {
  if (typeof token === 'string' && token) {
    await storageSet(SESSION_TOKEN_KEY, token);
  }
}

/** Read the stored session bearer, or null if the user has none. */
export const getSessionToken = async (): Promise<string | null> => {
  return storageGet(SESSION_TOKEN_KEY);
};

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

/** Cryptographically-random hex nonce for the Sign-in-with-Apple handshake. */
const generateNonce = (): string => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
};

export const signUp = async (email: string, pass: string, referralCode?: string) => {
  try {
    const resp = await apiFetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'signup', email, password: pass, referralCode }),
    });
    const json = await resp.json();
    if (!resp.ok) return { data: null, error: new Error(json?.error || 'Sign up failed') };
    const session = json?.session || createSession(email);
    await storageSet(SESSION_KEY, JSON.stringify(session));
    await storeSessionToken(json?.sessionToken);
    return { data: { session }, error: null };
  } catch (e: any) {
    return { data: null, error: e };
  }
};

export const signIn = async (email: string, pass: string) => {
  try {
    const resp = await apiFetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'signin', email, password: pass }),
    });
    const json = await resp.json();
    if (!resp.ok) return { data: null, error: new Error(json?.error || 'Sign in failed') };
    const session = json?.session || createSession(email);
    await storageSet(SESSION_KEY, JSON.stringify(session));
    await storeSessionToken(json?.sessionToken);
    return { data: { session }, error: null };
  } catch (e: any) {
    return { data: null, error: e };
  }
};

/**
 * Redeem a signed single-use OAuth token (minted by api/oauth/callback.ts after
 * a real provider exchange) for a session. The email is derived server-side from
 * the verified token — we never post a bare email here.
 */
export const signInWithOAuthToken = async (token: string) => {
  try {
    const resp = await apiFetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'oauth', token }),
    });
    const json = await resp.json();
    if (!resp.ok) return { data: null, error: new Error(json?.error || 'OAuth sign in failed') };
    const session = json?.session as AppSession | undefined;
    if (!session?.user?.email) return { data: null, error: new Error('OAuth sign in returned no session') };
    await storageSet(SESSION_KEY, JSON.stringify(session));
    await storeSessionToken(json?.sessionToken);
    return { data: { session }, error: null };
  } catch (e: any) {
    return { data: null, error: e };
  }
};

/**
 * Native Sign in with Apple. Presents the native sheet, then POSTs the identity
 * token to /api/auth-apple which verifies it against Apple's JWKS. Web callers
 * continue to use the redirect OAuth flow (startProviderSignIn). The button UI
 * is owned by the UI task; this exports the function it calls.
 */
export const signInWithApple = async () => {
  if (!isNative()) {
    return { data: null, error: new Error('Apple sign-in is only available in the app') };
  }
  try {
    const { SignInWithApple } = await import('@capacitor-community/apple-sign-in');
    const nonce = generateNonce();
    const result = await SignInWithApple.authorize({
      clientId: 'com.songghost.app',
      redirectURI: 'https://www.songghost.com/api/oauth/callback',
      scopes: 'name email',
      nonce,
    });
    const response = result?.response;
    const identityToken = response?.identityToken;
    if (!identityToken) {
      return { data: null, error: new Error('Apple did not return an identity token') };
    }
    const givenName = response?.givenName || '';
    const familyName = response?.familyName || '';
    const fullName = `${givenName} ${familyName}`.trim() || undefined;

    const resp = await apiFetch('/api/auth-apple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identityToken, nonce, email: response?.email || undefined, fullName }),
    });
    const json = await resp.json();
    if (!resp.ok) return { data: null, error: new Error(json?.error || 'Apple sign in failed') };
    const session = json?.session as AppSession | undefined;
    if (!session?.user?.email) return { data: null, error: new Error('Apple sign in returned no session') };
    await storageSet(SESSION_KEY, JSON.stringify(session));
    await storeSessionToken(json?.sessionToken);
    return { data: { session }, error: null };
  } catch (e: any) {
    return { data: null, error: e };
  }
};

/**
 * Spec/PLAN alias for {@link signInWithApple}. Exported under both names so the
 * UI-layer Apple button can import whichever it references. Guarded by isNative()
 * inside signInWithApple.
 */
export const startAppleSignIn = signInWithApple;

export const startProviderSignIn = (provider: string) => {
  const normalizedProvider = provider.toLowerCase().trim();
  window.location.href = apiUrl(`/api/oauth/start?provider=${encodeURIComponent(normalizedProvider)}`);
};

export const signOut = async () => {
  await storageRemove(SESSION_KEY);
  await storageRemove(SESSION_TOKEN_KEY);
  // Also clear any legacy web copies so a native migration can't resurrect them.
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(SESSION_TOKEN_KEY);
    }
  } catch {
    /* non-fatal */
  }
  return { error: null };
};

export const getSession = async (): Promise<AppSession | null> => {
  try {
    let raw = await storageGet(SESSION_KEY);
    if (!raw) {
      // One-time migration: on native, Preferences is empty on first launch —
      // adopt an existing web/localStorage session if one is present.
      const legacy = legacyLocalStorageGet(SESSION_KEY);
      if (legacy) {
        await storageSet(SESSION_KEY, legacy);
        raw = legacy;
      }
    }
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppSession;
    if (!parsed?.user?.email) return null;
    return parsed;
  } catch {
    return null;
  }
};
