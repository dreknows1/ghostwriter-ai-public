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
  price: number;
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
};

const CREDIT_PACKS: EntitlementProduct[] = [
  { id: 'pack_250', name: '250 Credits', credits: 250, price: 14.99 },
  { id: 'pack_100', name: '100 Credits', credits: 100, price: 7.99 },
  { id: 'pack_50', name: '50 Credits', credits: 50, price: 4.99 },
];

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

/** Native implementation stub — filled in by the RevenueCat/IAP payments task. */
export class NativeEntitlements implements EntitlementService {
  async getOffering(): Promise<Offering> {
    throw new Error('not yet implemented');
  }

  async purchase(_productId: string): Promise<void> {
    throw new Error('not yet implemented');
  }

  async restore(): Promise<void> {
    throw new Error('not yet implemented');
  }
}

/** Factory: chooses the platform-appropriate entitlement implementation. */
export function createEntitlementService(email: string): EntitlementService {
  return isNative() ? new NativeEntitlements() : new WebStripeEntitlements(email);
}
