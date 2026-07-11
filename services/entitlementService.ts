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
  /** Purchases a product by id (Stripe price id on web, RevenueCat/StoreKit product id on native). */
  purchase(productId: string): Promise<void>;
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
 * The RevenueCat SDK is loaded via dynamic `import()` and only ever reached
 * behind `isNative()`, so the web bundle tree-shakes it into an unloaded-on-web
 * chunk (verified in QA: no RevenueCat code executes on web). Credit grants are
 * authoritative server-side via the RevenueCat webhook → `applyRevenueCatEvent`;
 * these methods only drive the StoreKit UI and let the UI refresh afterward.
 */
export class NativeEntitlements implements EntitlementService {
  private configured = false;

  constructor(private readonly email: string) {}

  /** Lazily import + configure the RevenueCat SDK (native only). */
  private async purchases() {
    const mod = await import('@revenuecat/purchases-capacitor');
    if (!this.configured) {
      const apiKey = import.meta.env.VITE_REVENUECAT_IOS_KEY;
      if (!apiKey) throw new Error('Missing VITE_REVENUECAT_IOS_KEY');
      await mod.Purchases.configure({ apiKey, appUserID: this.email || null });
      this.configured = true;
    }
    return mod.Purchases;
  }

  async getOffering(): Promise<Offering> {
    const Purchases = await this.purchases();

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

  async purchase(productId: string): Promise<void> {
    const Purchases = await this.purchases();
    const storeKitId = WEB_TO_STOREKIT[productId] || productId;
    const res = await Purchases.getProducts({ productIdentifiers: [storeKitId] });
    const product = res.products?.[0];
    if (!product) throw new Error(`Product ${storeKitId} is not available`);
    // Grant is applied server-side by the RevenueCat webhook; the UI refreshes
    // via lib/nativeBridge.onPurchaseCompleted / refreshEntitlements.
    await Purchases.purchaseStoreProduct({ product });
  }

  async restore(): Promise<void> {
    const Purchases = await this.purchases();
    await Purchases.restorePurchases();
  }
}

/** Factory: chooses the platform-appropriate entitlement implementation. */
export function createEntitlementService(email: string): EntitlementService {
  return isNative() ? new NativeEntitlements(email) : new WebStripeEntitlements(email);
}
