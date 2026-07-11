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
 */
import { isNative } from './platform';

const DEFAULT_API_BASE = 'https://www.songghost.com';

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

/** fetch() wrapper that routes the request through apiUrl() first. */
export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), init);
}
