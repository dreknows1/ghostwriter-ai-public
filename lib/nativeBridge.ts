/**
 * Native purchase/entitlement bridge (docs/PLAN.md "Architecture" seam #4).
 *
 * Backed by `@revenuecat/purchases-capacitor`, loaded via dynamic `import()`
 * and only ever reached behind `isNative()` so the web bundle tree-shakes it
 * into an unloaded-on-web chunk. On web every export is an inert no-op.
 *
 *  - `onPurchaseCompleted` registers a RevenueCat CustomerInfo listener that
 *    fires after a completed purchase/restore/renewal so callers can refresh
 *    the credit balance shown in the UI. Replaces the web `?status=success`
 *    reconcile (App.tsx:767-846), which stays web-only.
 *  - `refreshEntitlements` re-fetches the latest credit balance via the
 *    existing creditService path (authoritative grants land server-side through
 *    the RevenueCat webhook → billing:applyRevenueCatEvent).
 *
 * This file also carries the small, real (non-stub) native-feel helpers used
 * across the app: opening links in the system browser, and the "Open in
 * Suno" deep-link handoff from the result screen.
 */
import { Browser } from '@capacitor/browser';
import { Clipboard } from '@capacitor/clipboard';
import { isNative } from './platform';
import { getUserCredits } from '../services/creditService';

/**
 * Opens an external URL. On native, uses the in-app system browser
 * (@capacitor/browser) instead of window.open, which does not behave
 * predictably inside a WKWebView. On web this is a plain new-tab open.
 */
export async function openExternal(url: string): Promise<void> {
  if (isNative()) {
    await Browser.open({ url });
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

/** Clipboard write that works under WKWebView (native) and the DOM API (web). */
export async function copyText(text: string): Promise<void> {
  if (isNative()) {
    await Clipboard.write({ string: text });
    return;
  }
  await navigator.clipboard.writeText(text);
}

const SUNO_APP_SCHEME = 'suno://create';
const SUNO_WEB_URL = 'https://suno.com/create';
const UDIO_WEB_URL = 'https://www.udio.com/create';

/**
 * "Open in Suno" — the result screen's hero action. Copies `text` to the
 * clipboard first (so it's one paste away regardless of whether the deep link
 * lands), then attempts the native Suno app via its URL scheme, falling back to
 * the Suno website. On web this is just copy + open a tab.
 *
 * Neither Suno nor Udio publishes a documented URL that pre-fills their create
 * form, so this is a copy-then-open handoff: we put the lyrics (which already
 * carry [Verse]/[Chorus] structure tags Suno understands) on the clipboard so
 * the user pastes straight into the lyrics box; the style prompt is copied
 * separately from the result screen.
 */
export async function openInSuno(text: string): Promise<void> {
  await copyText(text);
  if (isNative()) {
    // Best-effort deep link into the Suno app; the OS silently no-ops if it
    // isn't installed, so we still want the web fallback under it.
    window.location.href = SUNO_APP_SCHEME;
    await Browser.open({ url: SUNO_WEB_URL });
    return;
  }
  window.open(SUNO_WEB_URL, '_blank', 'noopener,noreferrer');
}

/** "Open in Udio" — same copy-then-open handoff, for Udio's web create page. */
export async function openInUdio(text: string): Promise<void> {
  await copyText(text);
  if (isNative()) {
    await Browser.open({ url: UDIO_WEB_URL });
    return;
  }
  window.open(UDIO_WEB_URL, '_blank', 'noopener,noreferrer');
}

export type PurchaseCompletedPayload = {
  productId: string;
};

export type PurchaseCompletedCallback = (payload: PurchaseCompletedPayload) => void;

/** Best-effort: the most relevant product id from a RevenueCat CustomerInfo. */
function latestProductId(customerInfo: any): string {
  const active: string[] = customerInfo?.activeSubscriptions ?? [];
  if (active.length > 0) return active[0];
  const all: string[] = customerInfo?.allPurchasedProductIdentifiers ?? [];
  if (all.length > 0) return all[all.length - 1];
  return '';
}

/**
 * Registers a callback for native purchase-completed events. On web this is an
 * inert no-op returning an unsubscribe function that does nothing.
 */
export function onPurchaseCompleted(cb: PurchaseCompletedCallback): () => void {
  if (!isNative()) {
    void cb;
    return () => {};
  }

  let callbackId: string | null = null;
  let cancelled = false;

  (async () => {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    if (cancelled) return;
    callbackId = await Purchases.addCustomerInfoUpdateListener((customerInfo: any) => {
      cb({ productId: latestProductId(customerInfo) });
    });
  })().catch((e) => console.error('[nativeBridge] listener setup failed', e));

  return () => {
    cancelled = true;
    if (!callbackId) return;
    const toRemove = callbackId;
    import('@revenuecat/purchases-capacitor')
      .then(({ Purchases }) =>
        Purchases.removeCustomerInfoUpdateListener({ listenerToRemove: toRemove })
      )
      .catch(() => {});
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Resolves with `fallback` if the promise hasn't settled within `ms`. RevenueCat
 * SDK calls can hang for a long time when api.revenuecat.com is unreachable
 * (DNS blockers, VPNs) — nothing in the purchase/refresh path may block on them.
 */
function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([p, sleep(ms).then(() => fallback)]);
}

/** Best-effort nudge so RevenueCat re-syncs CustomerInfo to its backend. */
async function nudgeCustomerInfo(): Promise<void> {
  if (!isNative()) return;
  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    await withTimeout(Purchases.getCustomerInfo().then(() => undefined), 3000, undefined);
  } catch (e) {
    console.error('[nativeBridge] getCustomerInfo failed', e);
  }
}

export interface RefreshEntitlementsOptions {
  /**
   * Balance before the purchase. When provided, refreshEntitlements bounded-polls
   * the credit endpoint until the balance rises above this (the RevenueCat
   * webhook → billing grant can lag the purchase by a second or two), so the UI
   * updates without a manual refresh. Omit for a single-shot fetch.
   */
  previousBalance?: number;
  /** Max fetch attempts (default 5 when polling). */
  tries?: number;
  /** Delay between attempts in ms (default 2000). */
  intervalMs?: number;
}

/**
 * Refreshes the credit balance after a native purchase/restore. Nudges the
 * RevenueCat SDK to sync CustomerInfo (best-effort), then re-fetches credits
 * through the existing creditService path.
 *
 * With `previousBalance` it bounded-polls (default 5 tries, 2s apart), stopping
 * early as soon as the balance increases — so a lagging webhook grant doesn't
 * leave the user staring at a stale total. Returns the latest total, or null if
 * no email is available.
 */
export async function refreshEntitlements(
  email?: string,
  opts?: RefreshEntitlementsOptions
): Promise<number | null> {
  if (!email) return null;

  await nudgeCustomerInfo();
  let latest = await getUserCredits(email);

  const baseline = opts?.previousBalance;
  if (baseline === undefined) return latest;

  const tries = Math.max(1, opts?.tries ?? 5);
  const intervalMs = Math.max(250, opts?.intervalMs ?? 2000);
  let attempt = 1;
  while (attempt < tries && latest <= baseline) {
    await sleep(intervalMs);
    await nudgeCustomerInfo();
    latest = await getUserCredits(email);
    attempt += 1;
  }
  return latest;
}

/**
 * Keep-awake seam (docs/PLAN.md "Generation resilience"). During the GENERATING
 * state the app holds a wake lock so iOS doesn't suspend the WKWebView and kill
 * the in-flight SSE generation. No-op on web; failures are swallowed so a device
 * without the capability never breaks generation.
 */
export async function keepAwake(): Promise<void> {
  if (!isNative()) return;
  try {
    const { KeepAwake } = await import('@capacitor-community/keep-awake');
    await KeepAwake.keepAwake();
  } catch (e) {
    console.error('[nativeBridge] keepAwake failed', e);
  }
}

/** Releases the wake lock taken by {@link keepAwake}. Safe to call unconditionally. */
export async function allowSleep(): Promise<void> {
  if (!isNative()) return;
  try {
    const { KeepAwake } = await import('@capacitor-community/keep-awake');
    await KeepAwake.allowSleep();
  } catch (e) {
    console.error('[nativeBridge] allowSleep failed', e);
  }
}
