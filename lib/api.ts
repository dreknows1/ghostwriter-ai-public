/**
 * API base-URL seam (docs/PLAN.md "Architecture" section, seam #2).
 *
 * On web, relative `/api/...` fetches work because the app is served from the
 * same origin as the Vercel functions. Inside the Capacitor shell the app is
 * served from `capacitor://localhost` (iOS), so relative paths would resolve
 * against the wrong origin. `apiUrl` rewrites relative API paths to an
 * absolute URL only when running natively; on web it is a no-op.
 *
 * Every fetch call to a relative `/api/...` endpoint in this codebase MUST go
 * through `apiUrl`/`apiFetch` instead of calling `fetch()` directly.
 *
 * SECURITY HOTFIX: `apiFetch` also attaches the server-verified session bearer
 * (`Authorization: Bearer <token>`) read from storage, so every authenticated
 * endpoint can derive identity from the token instead of a caller-supplied
 * email. When a request comes back 401 with `X-Session-Invalid`, it clears the
 * stored token and broadcasts `sg:session-expired` so the app can route to a
 * clean re-login (no white screen, no infinite spinner).
 */
import { isNative } from './platform';
import { SESSION_TOKEN_KEY, storageGet, storageRemove } from './storage';

const DEFAULT_API_BASE = 'https://www.songghost.com';

/** Broadcast name the app listens for to route an expired session to re-login. */
export const SESSION_EXPIRED_EVENT = 'sg:session-expired';

/**
 * Resolves a relative API path to the correct absolute URL for the current
 * platform. On web this is a pure passthrough: `apiUrl(path) === path`.
 * On native, it prefixes `import.meta.env.VITE_API_BASE` (falling back to
 * the production SongGhost origin) onto the path.
 */
export function apiUrl(path: string): string {
  if (!isNative()) return path;
  const base = (import.meta.env.VITE_API_BASE || DEFAULT_API_BASE).replace(/\/+$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
}

/** Merge an Authorization bearer into whatever headers shape the caller passed. */
function withAuthHeader(init: RequestInit | undefined, token: string): RequestInit {
  const headers = new Headers(init?.headers as HeadersInit | undefined);
  if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
  return { ...(init || {}), headers };
}

/**
 * fetch() wrapper that (1) routes the request through apiUrl(), (2) attaches the
 * stored session bearer, and (3) detects a server-signalled expired session and
 * fires {@link SESSION_EXPIRED_EVENT}. The body is never consumed here — callers
 * still read the Response as usual.
 */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = await storageGet(SESSION_TOKEN_KEY);
  const finalInit = token ? withAuthHeader(init, token) : init;
  const res = await fetch(apiUrl(path), finalInit);

  // A 401 carrying X-Session-Invalid means the bearer was missing/expired/bad
  // (NOT a bad-password rejection, which omits the header). Clear the dead token
  // and let the app route to re-login. Reading a header does not consume the body.
  if (res.status === 401 && res.headers.get('X-Session-Invalid')) {
    try {
      await storageRemove(SESSION_TOKEN_KEY);
    } catch {
      /* non-fatal */
    }
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
  }

  return res;
}
