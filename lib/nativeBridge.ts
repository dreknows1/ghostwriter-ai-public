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

/**
 * "Open in Suno" — the result screen's hero action. Copies the style prompt
 * to the clipboard first (so it's one paste away regardless of whether the
 * deep link lands), then attempts the native Suno app via its URL scheme,
 * falling back to the Suno website. On web this is just copy + open a tab.
 */
export async function openInSuno(prompt: string): Promise<void> {
  await copyText(prompt);
  if (isNative()) {
    // Best-effort deep link into the Suno app; the OS silently no-ops if it
    // isn't installed, so we still want the web fallback under it.
    window.location.href = SUNO_APP_SCHEME;
    await Browser.open({ url: SUNO_WEB_URL });
    return;
  }
  window.open(SUNO_WEB_URL, '_blank', 'noopener,noreferrer');
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

/**
 * Refreshes the credit balance after a native purchase/restore. Nudges the
 * RevenueCat SDK to sync CustomerInfo (best-effort), then re-fetches credits
 * through the existing creditService path. Returns the new total, or null if
 * no email is available.
 */
export async function refreshEntitlements(email?: string): Promise<number | null> {
  if (!email) return null;

  if (isNative()) {
    try {
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      // Force a CustomerInfo fetch so RevenueCat reports the latest state to
      // its backend (which drives the webhook grant). Non-fatal on failure.
      await Purchases.getCustomerInfo();
    } catch (e) {
      console.error('[nativeBridge] getCustomerInfo failed', e);
    }
  }

  return getUserCredits(email);
}
