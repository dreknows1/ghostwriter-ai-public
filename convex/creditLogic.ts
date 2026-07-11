/**
 * Pure, runtime-free credit decision logic (docs/PLAN.md "Credits & payments").
 *
 * This module deliberately imports nothing from the Convex runtime so the
 * reset / spend math and the RevenueCat + Stripe event reducers can be unit
 * tested without a Convex context. The Convex mutations in `convex/app.ts` and
 * `convex/billing.ts` are thin wrappers that fetch a profile, call these
 * functions, and persist the returned patch/ledger.
 *
 * Two-bucket model:
 *  - `credits`      = monthly-allowance bucket (reset on calendar rollover).
 *  - `packCredits`  = non-expiring bucket funded by one-time credit packs
 *                     (NEVER touched by the monthly reset).
 * Spend draws from the monthly bucket first, then packs.
 */

export const CREDITS_PUBLIC = 25;
export const CREDITS_SKOOL = 100;
export const CREDITS_PRO = 500;

/** Credits granted per one-time pack, keyed by both RevenueCat and Stripe ids. */
export const PACK_CREDITS: Record<string, number> = {
  // RevenueCat / StoreKit product ids
  sg_pack_250: 250,
  sg_pack_100: 100,
  sg_pack_50: 50,
  // Stripe checkout pkgIds (aligned catalog)
  pack_250: 250,
  pack_100: 100,
  pack_50: 50,
};

/** The Stripe/RevenueCat subscription product ids that grant Pro. */
export const PRO_PRODUCT_IDS = new Set(["sg_pro_monthly", "pro_monthly"]);

/** UTC year-month bucket key used for the calendar reset comparison. */
export function monthKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`;
}

export interface ProfileCreditState {
  credits: number;
  packCredits?: number;
  plan?: string; // "free" | "pro"
  planExpiresAt?: number;
  planSource?: string; // "stripe" | "revenuecat"
  tier?: string; // "public" | "skool"
  lastResetDate?: string;
}

/** True when the profile holds an unexpired Pro subscription. */
export function isProActive(state: ProfileCreditState, now: number): boolean {
  return state.plan === "pro" && (state.planExpiresAt ?? 0) > now;
}

/** Monthly baseline for a profile: 500 active-Pro / 100 skool / 25 public. */
export function baselineCredits(state: ProfileCreditState, now: number): number {
  if (isProActive(state, now)) return CREDITS_PRO;
  return state.tier === "skool" ? CREDITS_SKOOL : CREDITS_PUBLIC;
}

/** Total spendable credits across both buckets. */
export function spendableTotal(state: ProfileCreditState): number {
  return Math.max(0, state.credits ?? 0) + Math.max(0, state.packCredits ?? 0);
}

// ---------------------------------------------------------------------------
// Monthly reset
// ---------------------------------------------------------------------------

export interface ResetDecision {
  /** Whether the monthly bucket should be overwritten. */
  reset: boolean;
  /** New value for the monthly `credits` bucket (unchanged if !reset). */
  credits: number;
  /** New lastResetDate (only present when reset === true). */
  lastResetDate?: string;
}

/**
 * Decide the monthly-allowance reset.
 *
 * - Same calendar month as last reset → no reset.
 * - New month + active Pro → SKIP (their refill comes from renewal events; the
 *   calendar reset must never clobber a subscriber down to 25/100).
 * - New month otherwise → reset monthly bucket to the tier baseline.
 *
 * `packCredits` is never referenced here — packs survive every rollover.
 */
export function computeMonthlyReset(state: ProfileCreditState, now: number): ResetDecision {
  const lastReset = state.lastResetDate ? new Date(state.lastResetDate).getTime() : 0;
  const sameMonth = monthKey(now) === monthKey(lastReset);
  if (sameMonth) return { reset: false, credits: state.credits };
  if (isProActive(state, now)) {
    return { reset: false, credits: state.credits };
  }
  const baseline = state.tier === "skool" ? CREDITS_SKOOL : CREDITS_PUBLIC;
  return { reset: true, credits: baseline, lastResetDate: new Date(now).toISOString() };
}

// ---------------------------------------------------------------------------
// Spend (monthly bucket first, then packs)
// ---------------------------------------------------------------------------

export interface SpendDecision {
  credits: number; // new monthly bucket
  packCredits: number; // new pack bucket
  total: number; // credits + packCredits after spend
  spent: number; // amount actually deducted (clamped to available)
}

/**
 * Draw `amount` credits: monthly bucket first, then packs. Never goes negative
 * — an over-spend clamps to the available total (mirrors the pre-existing
 * `Math.max(0, ...)` behavior).
 */
export function computeSpend(
  creditsIn: number,
  packCreditsIn: number,
  amount: number
): SpendDecision {
  const credits = Math.max(0, creditsIn);
  const packCredits = Math.max(0, packCreditsIn);
  const amt = Math.max(0, amount);

  const fromMonthly = Math.min(credits, amt);
  const newCredits = credits - fromMonthly;
  const remaining = amt - fromMonthly;
  const fromPack = Math.min(packCredits, remaining);
  const newPack = packCredits - fromPack;

  return {
    credits: newCredits,
    packCredits: newPack,
    total: newCredits + newPack,
    spent: fromMonthly + fromPack,
  };
}

// ---------------------------------------------------------------------------
// Purchase / entitlement grants (shared by Stripe + RevenueCat)
// ---------------------------------------------------------------------------

export interface CreditPatch {
  credits?: number;
  packCredits?: number;
  plan?: string;
  planExpiresAt?: number;
  planSource?: string;
  lastResetDate?: string;
}

export interface GrantDecision {
  action: "pro_grant" | "pack_grant" | "cancellation" | "expiration" | "refund" | "ignore";
  /** Whether any persisted profile field changes. */
  changed: boolean;
  /** Fields to patch onto the profile (empty when nothing changes). */
  patch: CreditPatch;
  /** Credit-ledger delta; 0 means write no ledger row. */
  ledgerDelta: number;
  ledgerReason: string;
  /** For consumable (pack) grants: credits added, for the transaction record. */
  packCreditsGranted?: number;
}

const NOOP_GRANT: GrantDecision = {
  action: "ignore",
  changed: false,
  patch: {},
  ledgerDelta: 0,
  ledgerReason: "",
};

/**
 * Pro subscription grant / renewal: SET the monthly bucket to 500 (never
 * additive), stamp plan=pro + expiry + source, and re-anchor the reset clock.
 */
export function applyProGrant(
  state: ProfileCreditState,
  expiresAt: number | undefined,
  now: number,
  source: string
): GrantDecision {
  const credits = Math.max(0, state.credits ?? 0);
  return {
    action: "pro_grant",
    changed: true,
    patch: {
      credits: CREDITS_PRO,
      plan: "pro",
      planExpiresAt: expiresAt ?? state.planExpiresAt,
      planSource: source,
      lastResetDate: new Date(now).toISOString(),
    },
    ledgerDelta: CREDITS_PRO - credits,
    ledgerReason: `${source}_pro`,
  };
}

/** One-time pack grant: add pack size to the non-expiring `packCredits` bucket. */
export function applyPackGrant(
  state: ProfileCreditState,
  productId: string,
  source: string
): GrantDecision {
  const packSize = PACK_CREDITS[productId] ?? 0;
  if (packSize <= 0) return NOOP_GRANT;
  const packCredits = Math.max(0, state.packCredits ?? 0);
  return {
    action: "pack_grant",
    changed: true,
    patch: { packCredits: packCredits + packSize },
    ledgerDelta: packSize,
    ledgerReason: `${source}_pack`,
    packCreditsGranted: packSize,
  };
}

export interface RcEvent {
  type: string;
  productId?: string;
  expirationAtMs?: number | null;
}

/**
 * RevenueCat webhook event map (docs/PLAN.md). Pure — idempotency (rcEvents /
 * rcTransactionId) is enforced by the calling Convex mutation, not here.
 *
 * - INITIAL_PURCHASE / RENEWAL / UNCANCELLATION → Pro grant (bucket set-to-500).
 * - NON_RENEWING_PURCHASE                       → pack grant (packCredits +=).
 * - CANCELLATION                                → no change (keep until expiry).
 * - EXPIRATION / BILLING_ISSUE                  → plan=free only past expiry;
 *                                                 credits are never zeroed.
 * - REFUND                                      → claw back, clamp ≥ 0.
 * - anything else                               → ignore.
 */
export function reduceRevenueCatEvent(
  state: ProfileCreditState,
  event: RcEvent,
  now: number
): GrantDecision {
  switch (event.type) {
    case "INITIAL_PURCHASE":
    case "RENEWAL":
    case "UNCANCELLATION":
      return applyProGrant(state, event.expirationAtMs ?? undefined, now, "revenuecat");

    case "NON_RENEWING_PURCHASE":
      return applyPackGrant(state, event.productId ?? "", "revenuecat");

    case "CANCELLATION":
      // Auto-renew turned off. Entitlement (and credits) persist until expiry.
      return { ...NOOP_GRANT, action: "cancellation" };

    case "EXPIRATION":
    case "BILLING_ISSUE": {
      const expiry = state.planExpiresAt ?? 0;
      // Still inside the paid period → keep Pro (grace / redelivery ordering).
      if (expiry > now) return { ...NOOP_GRANT, action: "expiration" };
      // Already free → nothing to do.
      if (state.plan !== "pro") return { ...NOOP_GRANT, action: "expiration" };
      // Downgrade to free. Credits are intentionally left untouched.
      return {
        action: "expiration",
        changed: true,
        patch: { plan: "free" },
        ledgerDelta: 0,
        ledgerReason: "",
      };
    }

    case "REFUND": {
      const packSize = PACK_CREDITS[event.productId ?? ""] ?? 0;
      if (packSize > 0) {
        // Pack refund: subtract the granted credits, clamp ≥ 0.
        const packCredits = Math.max(0, state.packCredits ?? 0);
        const newPack = Math.max(0, packCredits - packSize);
        return {
          action: "refund",
          changed: newPack !== packCredits,
          patch: { packCredits: newPack },
          ledgerDelta: newPack - packCredits,
          ledgerReason: "revenuecat_refund_pack",
        };
      }
      // Subscription refund: revoke Pro and claw back the monthly grant, clamp ≥ 0.
      const credits = Math.max(0, state.credits ?? 0);
      const newCredits = Math.max(0, credits - CREDITS_PRO);
      return {
        action: "refund",
        changed: true,
        patch: { credits: newCredits, plan: "free" },
        ledgerDelta: newCredits - credits,
        ledgerReason: "revenuecat_refund_sub",
      };
    }

    default:
      return NOOP_GRANT;
  }
}

// ---------------------------------------------------------------------------
// RevenueCat mutation orchestration (idempotency decision, pure)
// ---------------------------------------------------------------------------

export interface RcApplyContext {
  /** rcEvents.by_event index hit — this webhook event was already processed. */
  eventSeen: boolean;
  /** transactions.by_rc_transaction hit — this store transaction was applied. */
  transactionSeen: boolean;
  /** Owner (unlimited) account — never mutate credits. */
  isOwner: boolean;
}

export interface RcApplyPlan {
  skip: boolean;
  reason?: "duplicate_event" | "duplicate_transaction" | "owner_unlimited";
  /** Whether the caller should insert an rcEvents row for this eventId. */
  recordEvent: boolean;
  /** Present only when !skip. */
  decision?: GrantDecision;
}

/**
 * Pure orchestration for `billing:applyRevenueCatEvent`. Given the DB lookups
 * the mutation has already performed (event/transaction dedupe, owner check),
 * decides whether to skip and — if not — what grant to apply. Extracted so the
 * idempotency contract ("same eventId twice = one grant") is unit-testable
 * without a Convex runtime.
 */
export function planRevenueCatApply(
  state: ProfileCreditState,
  event: RcEvent,
  now: number,
  ctx: RcApplyContext
): RcApplyPlan {
  // Already-seen event: no-op, and do NOT re-insert (the row already exists).
  if (ctx.eventSeen) return { skip: true, reason: "duplicate_event", recordEvent: false };
  // Store transaction already applied under a different event id: record this
  // event so future redeliveries short-circuit, but grant nothing.
  if (ctx.transactionSeen) {
    return { skip: true, reason: "duplicate_transaction", recordEvent: true };
  }
  // Owner: record the event, never touch credits.
  if (ctx.isOwner) return { skip: true, reason: "owner_unlimited", recordEvent: true };

  return { skip: false, recordEvent: true, decision: reduceRevenueCatEvent(state, event, now) };
}
