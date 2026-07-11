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
 */
import { isNative } from './platform';
import { getUserCredits } from '../services/creditService';

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
