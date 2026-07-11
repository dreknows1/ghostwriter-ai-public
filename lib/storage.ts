/**
 * Platform-safe key/value storage (docs/PLAN.md "Auth on iOS" — session storage
 * → Capacitor Preferences behind the authService interface).
 *
 * On native (iOS Capacitor shell) `localStorage` inside a WKWebView is not a
 * durable place for the session — it can be evicted under storage pressure and
 * behaves oddly across the app lifecycle. Capacitor Preferences persists to the
 * native key/value store instead. On web we keep `localStorage`.
 *
 * The API is async everywhere so callers don't fork on platform. `@capacitor/
 * preferences` is loaded via dynamic import so the web bundle never pulls it in
 * (isNative() is false there and the import is never reached).
 *
 * Two naming conventions are exported for historical reasons — `storageGet/Set/
 * Remove` (auth layer) and `getItem/setItem/removeItem` (UI layer) — both bound
 * to the same implementation.
 */
import { isNative } from "./platform";

export async function storageGet(key: string): Promise<string | null> {
  if (isNative()) {
    const { Preferences } = await import("@capacitor/preferences");
    const { value } = await Preferences.get({ key });
    return value ?? null;
  }
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function storageSet(key: string, value: string): Promise<void> {
  if (isNative()) {
    const { Preferences } = await import("@capacitor/preferences");
    await Preferences.set({ key, value });
    return;
  }
  try {
    localStorage.setItem(key, value);
  } catch {
    /* quota / privacy mode — non-fatal */
  }
}

export async function storageRemove(key: string): Promise<void> {
  if (isNative()) {
    const { Preferences } = await import("@capacitor/preferences");
    await Preferences.remove({ key });
    return;
  }
  try {
    localStorage.removeItem(key);
  } catch {
    /* non-fatal */
  }
}

/**
 * Best-effort read of the pre-migration web value directly from localStorage,
 * used once to adopt an existing session into native Preferences. Safe to call
 * on any platform (returns null if localStorage is unavailable).
 */
export function legacyLocalStorageGet(key: string): string | null {
  try {
    return typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

// Aliases for the UI layer's call sites (intro-seen flag, etc.).
export const getItem = storageGet;
export const setItem = storageSet;
export const removeItem = storageRemove;
