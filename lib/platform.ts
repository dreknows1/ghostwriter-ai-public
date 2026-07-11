/**
 * Thin wrapper around @capacitor/core's Capacitor object. This is one of the
 * two seams (the other is lib/api.ts) where web and native code paths are
 * allowed to fork — see docs/PLAN.md "Architecture" section.
 */
import { Capacitor } from '@capacitor/core';

/** True when running inside a native Capacitor shell (iOS/Android), false on web. */
export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

/** True when running inside the native iOS shell specifically. */
export function isIOS(): boolean {
  return Capacitor.getPlatform() === 'ios';
}

/** Returns Capacitor's raw platform string: 'ios' | 'android' | 'web'. */
export function getPlatform(): string {
  return Capacitor.getPlatform();
}
