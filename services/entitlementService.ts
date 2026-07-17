/**
 * Payments/entitlement seam (docs/PLAN.md "Architecture" seam #3, and
 * "Credits & payments"). Interface-only scaffold for now: web is backed by
 * the existing Stripe Checkout flow, native is a stub the RevenueCat/IAP
 * payments task will fill in.
 */
import { apiUrl } from '../lib/api';
import { isNative } from '../lib/platform';

export interface EntitlementProduct {
  id: string;
  name: string;
  credits: number;
  /** Numeric price: USD on web, StoreKit-sourced localized amount on native. */
  price: number;
  /** Localized display string (StoreKit-sourced on native; e.g. "$4.99"). */
  priceString?: string;
}

export interface Offering {
  subscription: EntitlementProduct;
  packs: EntitlementProduct[];
}

export interface EntitlementService {
  /** Returns the current subscription + credit-pack offering. */
  getOffering(): Promise<Offering>;
  /**
   * Purchases a product by id (Stripe price id on web, RevenueCat/StoreKit
   * product id on native). `onStep` (native only) reports live progress of
   * each purchase stage so hangs surface as named, visible failures.
   */
  purchase(productId: string, onStep?: (status: string) => void): Promise<void>;
  /** Restores previously granted entitlements (native restore / web re-sync). */
  restore(): Promise<void>;
}

// Mirrors components/PricingView.tsx's SUBSCRIPTION/CREDIT_PACKS catalog.
// PricingView is left untouched by this task — keep this in sync manually if
// pricing changes there until PricingView is migrated onto this service.
const SUBSCRIPTION: EntitlementProduct = {
  id: 'pro_monthly',
  name: 'Pro Monthly',
  credits: 500,
  price: 24.99,
  priceString: '$24.99',
};

const CREDIT_PACKS: EntitlementProduct[] = [
  { id: 'pack_250', name: '250 Credits', credits: 250, price: 14.99, priceString: '$14.99' },
  { id: 'pack_100', name: '100 Credits', credits: 100, price: 7.99, priceString: '$7.99' },
  { id: 'pack_50', name: '50 Credits', credits: 50, price: 4.99, priceString: '$4.99' },
];

/**
 * StoreKit / RevenueCat product catalog (docs/PLAN.md). iOS uses the `sg_*`
 * product ids; credits/names are app-defined (store products carry no credit
 * count). Prices come from StoreKit at runtime.
 */
const RC_SUBSCRIPTION_ID = 'sg_pro_monthly';
const RC_PACK_IDS = ['sg_pack_250', 'sg_pack_100', 'sg_pack_50'];
const RC_PRODUCT_CREDITS: Record<string, number> = {
  sg_pro_monthly: 500,
  sg_pack_250: 250,
  sg_pack_100: 100,
  sg_pack_50: 50,
};
const RC_PRODUCT_NAMES: Record<string, string> = {
  sg_pro_monthly: 'Pro Monthly',
  sg_pack_250: '250 Credits',
  sg_pack_100: '100 Credits',
  sg_pack_50: '50 Credits',
};
/** Accept web-style ids from callers and map to StoreKit product ids. */
const WEB_TO_STOREKIT: Record<string, string> = {
  pro_monthly: 'sg_pro_monthly',
  pack_250: 'sg_pack_250',
  pack_100: 'sg_pack_100',
  pack_50: 'sg_pack_50',
};

/**
 * Web implementation: delegates to the same Stripe Checkout flow used by
 * PricingView.tsx (`POST /api/create-checkout-session` → full-page redirect
 * to the returned Stripe URL). PricingView keeps its own inline fetch calls
 * unchanged; this class exists so callers behind the `createEntitlementService`
 * factory get equivalent behavior without importing UI code.
 */
export class WebStripeEntitlements implements EntitlementService {
  constructor(private readonly email: string) {}

  async getOffering(): Promise<Offering> {
    return { subscription: SUBSCRIPTION, packs: CREDIT_PACKS };
  }

  async purchase(productId: string): Promise<void> {
    const response = await fetch(apiUrl('/api/create-checkout-session'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId: productId, email: this.email }),
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Server responded with ${response.status}: ${errText}`);
    }
    const data = await response.json();
    if (!data.url) throw new Error('Payment system error — no redirect URL. Please try again.');
    window.location.href = data.url;
  }

  async restore(): Promise<void> {
    // Web has no "restore" concept — Stripe entitlements are looked up by
    // email server-side on every credits fetch. No-op.
    return;
  }
}

/**
 * Native implementation backed by `@revenuecat/purchases-capacitor`.
 *
 * TWO HARD-WON RULES (the cause of the builds-17..23 purchase hang):
 * 1. The plugin is imported STATICALLY — dynamic import() of split chunks can
 *    hang forever in WKWebView. The registerPlugin shim costs a few KB on web;
 *    its heavy web-implementation chunk still never loads on native.
 * 2. Every method configures INLINE, unconditionally — awaits that hop through
 *    helper async fns or stored/shared promises have been observed to never
 *    resume in this WKWebView, while flat, freshly-created bridge-call awaits
 *    resume reliably. Re-configure is tolerated by the SDK (logs a warning).
 *
 * Credit grants stay authoritative server-side via the RevenueCat webhook →
 * `applyRevenueCatEvent`; these methods only drive the StoreKit UI.
 */
import { Purchases as RCPurchases } from '@revenuecat/purchases-capacitor';

/** Rejects (never hangs) if `p` hasn't settled within `ms`. */
const withTimeout = <T,>(p: Promise<T>, ms: number, label: string): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`TIMEOUT at "${label}" after ${Math.round(ms / 1000)}s`)), ms);
  });
  return Promise.race([p, timeout]).finally(() => clearTimeout(timer)) as Promise<T>;
};

const RC_API_KEY = () => {
  const apiKey = import.meta.env.VITE_REVENUECAT_IOS_KEY;
  if (!apiKey) throw new Error('Missing VITE_REVENUECAT_IOS_KEY');
  return apiKey;
};

export class NativeEntitlements implements EntitlementService {
  constructor(private readonly email: string) {}

  async getOffering(): Promise<Offering> {
    await withTimeout(RCPurchases.configure({ apiKey: RC_API_KEY(), appUserID: this.email || null }), 8000, 'connect billing');
    const Purchases = RCPurchases;

    // Prefer the configured Offering; fall back to fetching products by id.
    let storeProducts: any[] = [];
    try {
      const offerings = await Purchases.getOfferings();
      const pkgs = offerings.current?.availablePackages ?? [];
      storeProducts = pkgs.map((p: any) => p.product);
    } catch {
      /* fall through to getProducts */
    }
    if (storeProducts.length === 0) {
      const res = await Purchases.getProducts({
        productIdentifiers: [RC_SUBSCRIPTION_ID, ...RC_PACK_IDS],
      });
      storeProducts = res.products ?? [];
    }

    const byId = new Map<string, any>(storeProducts.map((p: any) => [p.identifier, p]));
    const toProduct = (id: string): EntitlementProduct => {
      const sp = byId.get(id);
      return {
        id,
        name: sp?.title || RC_PRODUCT_NAMES[id] || id,
        credits: RC_PRODUCT_CREDITS[id] ?? 0,
        price: typeof sp?.price === 'number' ? sp.price : 0,
        priceString: sp?.priceString,
      };
    };

    return {
      subscription: toProduct(RC_SUBSCRIPTION_ID),
      packs: RC_PACK_IDS.map(toProduct),
    };
  }

  async purchase(productId: string, onStep?: (status: string) => void): Promise<void> {
    // Each stage is labeled and time-boxed: a hang anywhere (SDK init, a
    // wedged StoreKit daemon, a sheet that never appears) surfaces as a named
    // TIMEOUT error instead of an eternal spinner — the diagnostic we've been
    // missing on-device.
    const step = async <T,>(label: string, run: () => Promise<T>, ms: number): Promise<T> => {
      onStep?.(`${label}…`);
      let timer: ReturnType<typeof setTimeout> | undefined;
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`TIMEOUT at "${label}" after ${Math.round(ms / 1000)}s`)), ms);
      });
      try {
        const result = (await Promise.race([run(), timeout])) as T;
        onStep?.(`${label} ✓`);
        return result;
      } finally {
        clearTimeout(timer);
      }
    };

    const storeKitId = WEB_TO_STOREKIT[productId] || productId;
    await step('connect billing', () => RCPurchases.configure({ apiKey: RC_API_KEY(), appUserID: this.email || null }), 8000);
    const Purchases = RCPurchases;
    const pay = await step('check purchases allowed', () => Purchases.canMakePayments(), 10000);
    if (!pay.canMakePayments) {
      throw new Error('This device blocks in-app purchases (Screen Time → Content & Privacy → iTunes & App Store Purchases).');
    }
    const res = await step('fetch product', () => Purchases.getProducts({ productIdentifiers: [storeKitId] }), 15000);
    const product = res.products?.[0];
    if (!product) throw new Error(`Product ${storeKitId} not returned by the App Store`);
    // Grant is applied server-side by the RevenueCat webhook; the UI refreshes
    // via lib/nativeBridge.onPurchaseCompleted / refreshEntitlements.
    // 3-minute box: the sheet legitimately waits on the user, but "forever" = wedged.
    await step('purchase', () => Purchases.purchaseStoreProduct({ product }), 180000);
  }

  async restore(): Promise<void> {
    await withTimeout(RCPurchases.configure({ apiKey: RC_API_KEY(), appUserID: this.email || null }), 8000, 'connect billing');
    await RCPurchases.restorePurchases();
  }

  /**
   * Pushes any finished-but-unrecorded StoreKit transactions to RevenueCat.
   * With StoreKit 2 a purchase can complete on-device yet fail to post to RC
   * (network blip, app killed mid-post) — RC then has no transaction, fires no
   * webhook, and the user never gets credits. syncPurchases is RC's recovery
   * path for exactly that.
   */
  async syncPurchases(): Promise<void> {
    await withTimeout(RCPurchases.configure({ apiKey: RC_API_KEY(), appUserID: this.email || null }), 8000, 'connect billing');
    await RCPurchases.syncPurchases();
  }

  /** Start (configure) the SDK without performing any operation. */
  async warmup(): Promise<void> {
    await withTimeout(RCPurchases.configure({ apiKey: RC_API_KEY(), appUserID: this.email || null }), 8000, 'connect billing');
  }
}

/**
 * Warm up the RevenueCat SDK at sign-in (native only). Without this, RC is
 * only configured lazily when the paywall first opens — so on a normal app
 * launch the SDK isn't running and can never re-sync a purchase that failed
 * to record. Configures RC under the signed-in email and syncs any stuck
 * transactions. Best-effort: failures are logged, never thrown.
 */
export async function warmupNativePurchases(email: string): Promise<void> {
  if (!isNative() || !email) return;
  try {
    // Configure ONLY — no syncPurchases here. An explicit background sync
    // retrying a wedged transaction is exactly what deadlocked the paywall's
    // configure on-device (builds 18-20). After configure, the SDK's own
    // transaction listener processes unfinished transactions safely on its
    // own schedule; manual sync stays available behind Restore Purchases.
    await new NativeEntitlements(email).warmup();
  } catch (e) {
    console.error('[entitlements] purchase warmup failed', e);
  }
}

/** Factory: chooses the platform-appropriate entitlement implementation. */
export function createEntitlementService(email: string): EntitlementService {
  return isNative() ? new NativeEntitlements(email) : new WebStripeEntitlements(email);
}
