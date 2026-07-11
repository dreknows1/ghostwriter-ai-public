/**
 * Native purchase/entitlement bridge (docs/PLAN.md "Architecture" seam #4).
 *
 * Stub for now — the payments task (RevenueCat integration, see PLAN.md
 * "Credits & payments") will fill these in with real
 * `@revenuecat/purchases-capacitor` listeners. Deliberately dependency-free
 * so this file can be imported (and safely no-op) before that package is
 * added, and so it never pulls native-only code into the web bundle.
 *
 * Intended eventual behavior:
 *  - `onPurchaseCompleted` registers a callback fired when RevenueCat reports
 *    a completed purchase/restore (INITIAL_PURCHASE, RENEWAL, RESTORE, etc.),
 *    so callers can refresh the credit balance shown in the UI.
 *  - `refreshEntitlements` force-fetches the latest CustomerInfo from
 *    RevenueCat and reconciles it server-side, mirroring what the web
 *    `?status=success` redirect reconcile does today (App.tsx:767-846).
 */

export type PurchaseCompletedPayload = {
  productId: string;
};

export type PurchaseCompletedCallback = (payload: PurchaseCompletedPayload) => void;

/**
 * Registers a callback for native purchase-completed events. No-op stub —
 * always returns an unsubscribe function that does nothing. Never fires on
 * web or before the RevenueCat listener is wired up.
 */
export function onPurchaseCompleted(cb: PurchaseCompletedCallback): () => void {
  void cb;
  return () => {};
}

/**
 * Refreshes native entitlements from RevenueCat and reconciles server-side
 * credit state. No-op stub that resolves immediately until the payments task
 * lands.
 */
export async function refreshEntitlements(): Promise<void> {
  return;
}
