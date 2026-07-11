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
/**
 * Metered trial allowance (Andre: "meter the trial"). A 7-day free trial does
 * NOT front-load the full 500; it grants a smaller evaluation bucket (~5 songs
 * at 10 credits each). The full 500 lands only on the trial→paid conversion
 * (the first non-TRIAL RENEWAL, i.e. period_type flips to NORMAL).
 */
export const CREDITS_TRIAL = 50;

export const DAY_MS = 86_400_000;

/**
 * Reset-only grace window. A subscriber whose planExpiresAt has just passed but
 * whose RENEWAL webhook hasn't landed yet (or who is in RevenueCat's
 * billing-retry/grace period) is treated as still-active FOR THE CALENDAR RESET
 * ONLY, so a UTC month rollover in that gap doesn't wipe a paying user to 25.
 */
export const PRO_GRACE_MS = 3 * DAY_MS;

/**
 * A CANCELLATION event whose cancel_reason is in this set is an actual money
 * refund (clawback), per RevenueCat's webhook schema. Every other cancel_reason
 * (UNSUBSCRIBE, BILLING_ERROR, …) just means auto-renew was turned off — keep
 * the credits until expiry.
 */
export const REFUND_CANCEL_REASONS = new Set(["CUSTOMER_SUPPORT"]);

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

/**
 * True when the profile holds an unexpired Pro subscription. `graceMs` extends
 * the active window past planExpiresAt (used by the calendar reset only, to
 * avoid clobbering a subscriber mid billing-retry/grace).
 */
export function isProActive(state: ProfileCreditState, now: number, graceMs = 0): boolean {
  return state.plan === "pro" && (state.planExpiresAt ?? 0) + graceMs > now;
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

/**
 * A spend amount is only ever a POSITIVE INTEGER. Rejects <= 0, non-integer,
 * NaN, and Infinity. This closes the self-credit vector: a client that reaches a
 * spend mutation (e.g. `spendCreditsByEmail` via /api/db) cannot pass a negative
 * amount to inflate a balance, and a NaN/Infinity can't corrupt the bucket
 * arithmetic (`credits - NaN` ⇒ NaN). Owner-sentinel handling is separate and
 * unaffected — an owner is short-circuited before any amount is inspected.
 */
export function isValidSpendAmount(amount: number): boolean {
  return Number.isInteger(amount) && amount > 0;
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
  // Skip the reset for an active Pro — including a short grace window so a
  // subscriber awaiting renewal / in billing-retry isn't wiped at the boundary.
  if (isProActive(state, now, PRO_GRACE_MS)) {
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

export interface CheckedSpendDecision extends SpendDecision {
  /** false when the balance can't cover `amount` — NO deduction is applied. */
  ok: boolean;
  /** Spendable total before the attempt. */
  available: number;
}

/**
 * Server-authoritative spend: unlike `computeSpend` (which clamps), this REJECTS
 * an over-spend without deducting so the generation path can refuse and surface
 * the paywall CTA. On success it deducts monthly-bucket-first, then packs.
 */
export function computeSpendChecked(
  creditsIn: number,
  packCreditsIn: number,
  amount: number
): CheckedSpendDecision {
  const credits = Math.max(0, creditsIn);
  const packCredits = Math.max(0, packCreditsIn);
  const available = credits + packCredits;
  const amt = Math.max(0, amount);

  if (amt > available) {
    // Insufficient funds — leave both buckets untouched.
    return { ok: false, available, credits, packCredits, total: available, spent: 0 };
  }
  const spend = computeSpend(credits, packCredits, amt);
  return { ok: true, available, ...spend };
}

// ---------------------------------------------------------------------------
// Server-authoritative, idempotent generation spend (N1/B1 must-fix)
// ---------------------------------------------------------------------------

export interface KeyedSpendContext {
  /**
   * A spentKeys row with status "spent" already exists for this generation key
   * — the request was already charged (a retried/dropped SSE stream, the
   * stream→classic fallback that fires TWO POSTs for ONE generation, or a
   * network retry). Proceed with generation but charge nothing.
   */
  keySeen: boolean;
  /** Owner (unlimited) account — never deduct. */
  isOwner: boolean;
}

export interface KeyedSpendPlan {
  /** The caller may proceed with the paid operation (generation). */
  proceed: boolean;
  /**
   * A fresh deduction happens on this call — true ONLY for a first-time charge.
   * false for an owner or a deduped key. The server refunds on generation
   * failure only when `charged` is true, so a deduped sibling request never
   * refunds a charge it doesn't own.
   */
  charged: boolean;
  reason?: "duplicate_key" | "owner_unlimited" | "insufficient_credits" | "invalid_amount";
  /** The deduction to persist; present only when `charged`. */
  decision?: CheckedSpendDecision;
  /** Spendable total before the attempt (drives the 402 payload). */
  available: number;
}

/**
 * Pure decision for the server-authoritative generation spend. Given the DB
 * lookups the mutation performed (owner check + spentKeys dedupe), decides
 * whether to proceed, whether to charge, and the exact deduction. Extracted so
 * the idempotency contract ("same generation key ⇒ charged at most once") is
 * unit-testable without a Convex runtime — mirrors planRevenueCatApply.
 */
export function planKeyedSpend(
  state: ProfileCreditState,
  amount: number,
  ctx: KeyedSpendContext
): KeyedSpendPlan {
  const available = spendableTotal(state);
  // Owner: unlimited — always proceed, never deduct.
  if (ctx.isOwner) return { proceed: true, charged: false, reason: "owner_unlimited", available };
  // Already charged for this generation key — proceed, but do not double-charge.
  if (ctx.keySeen) return { proceed: true, charged: false, reason: "duplicate_key", available };
  // Reject a malformed amount (<= 0, non-integer, NaN, Infinity) BEFORE computing a
  // spend — a negative could otherwise attempt to inflate, and NaN would corrupt
  // the bucket math. Nothing is deducted.
  if (!isValidSpendAmount(amount)) {
    return { proceed: false, charged: false, reason: "invalid_amount", available };
  }

  const decision = computeSpendChecked(state.credits ?? 0, state.packCredits ?? 0, amount);
  if (!decision.ok) {
    // Insufficient balance — reject so the API returns 402 and the client routes
    // to the paywall. Nothing is deducted.
    return { proceed: false, charged: false, reason: "insufficient_credits", available };
  }
  return { proceed: true, charged: true, decision, available };
}

// ---------------------------------------------------------------------------
// Server-authoritative avatar-creation charge (client-trust removal follow-up)
// ---------------------------------------------------------------------------

export interface AvatarChargeContext {
  /** The profile already has a non-empty avatar on file. */
  hadAvatar: boolean;
  /** This request sets a non-empty avatar. */
  addingAvatar: boolean;
  /** Owner (unlimited) account — never charged. */
  isOwner: boolean;
  /** Skool member — avatars are free (matches the prior client rule). */
  isSkool: boolean;
}

export interface AvatarChargePlan {
  /** Deduct `cost` — a first-time avatar for a paying (non-member) user. */
  charge: boolean;
  /** Insufficient balance — the caller MUST NOT persist the avatar. */
  reject: boolean;
  /** The deduction to persist; present only when `charge`. */
  decision?: CheckedSpendDecision;
  /** Spendable total before the attempt. */
  available: number;
}

/**
 * Server-authoritative avatar-creation charge (pure). Unlike a generation, an
 * avatar has no per-request idempotency key — the DB STATE TRANSITION is the
 * idempotency guarantee: only the FIRST avatar a non-owner, non-member sets
 * (empty→present) costs `cost`; every later save with an avatar already on file
 * is free, so a re-save can never double-charge. Owner + skool members are always
 * free. Insufficient balance ⇒ `reject` so the caller leaves the avatar unset and
 * routes the user to the paywall (no partial charge). Extracted here so the charge
 * rule is unit-testable without a Convex runtime — mirrors planKeyedSpend.
 */
export function planAvatarCharge(
  state: ProfileCreditState,
  cost: number,
  ctx: AvatarChargeContext
): AvatarChargePlan {
  const available = spendableTotal(state);
  // Free: nothing added, avatar already on file, owner, or skool member.
  if (!ctx.addingAvatar || ctx.hadAvatar || ctx.isOwner || ctx.isSkool) {
    return { charge: false, reject: false, available };
  }
  const decision = computeSpendChecked(state.credits ?? 0, state.packCredits ?? 0, cost);
  if (!decision.ok) return { charge: false, reject: true, available };
  return { charge: true, reject: false, decision, available };
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
 * Derive a sane forward expiry when a Pro grant carries no usable future expiry
 * (missing/null expiration_at_ms). 7 days for a trial, ~1 month otherwise —
 * generous enough to survive one calendar-reset boundary until the store's real
 * expiry arrives on the next renewal event.
 */
export function fallbackExpiry(now: number, periodType?: string): number {
  const days = periodType === "TRIAL" ? 7 : 31;
  return now + days * DAY_MS;
}

/**
 * Pro subscription grant / renewal: SET the monthly bucket (never additive),
 * stamp plan=pro + expiry + source, and re-anchor the reset clock.
 *
 * Metered trial (Andre: "meter the trial"): a TRIAL period grants CREDITS_TRIAL
 * (50), NOT the full CREDITS_PRO (500). The 500 lands only when period_type is
 * anything other than TRIAL (the trial→paid conversion RENEWAL, an
 * already-paid INITIAL_PURCHASE, or a Stripe grant which never sets a
 * periodType). Because the grant SETS the bucket, the conversion RENEWAL simply
 * tops the trial 50 up to 500 — idempotent under redelivery.
 *
 * planExpiresAt only ever moves FORWARD (max of incoming vs existing) so an
 * out-of-order webhook — e.g. a RENEWAL processed before a reordered
 * INITIAL_PURCHASE — can't regress a later paid-through date. If neither yields
 * a future expiry, a sane one is derived so the grant isn't left
 * instantly-expired (which the next calendar reset would then wipe).
 */
export function applyProGrant(
  state: ProfileCreditState,
  expiresAt: number | undefined,
  now: number,
  source: string,
  periodType?: string
): GrantDecision {
  const credits = Math.max(0, state.credits ?? 0);
  let target = Math.max(expiresAt ?? 0, state.planExpiresAt ?? 0);
  if (target <= now) target = fallbackExpiry(now, periodType);
  const isTrial = periodType === "TRIAL";
  const grantCredits = isTrial ? CREDITS_TRIAL : CREDITS_PRO;
  return {
    action: "pro_grant",
    changed: true,
    patch: {
      credits: grantCredits,
      plan: "pro",
      planExpiresAt: target,
      planSource: source,
      lastResetDate: new Date(now).toISOString(),
    },
    ledgerDelta: grantCredits - credits,
    ledgerReason: `${source}_pro${isTrial ? "_trial" : ""}`,
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
  /** RevenueCat CANCELLATION cancel_reason (CUSTOMER_SUPPORT ⇒ refund). */
  cancelReason?: string;
  /** RevenueCat period_type (TRIAL | INTRO | NORMAL | PROMOTIONAL | PREPAID). */
  periodType?: string;
}

/** True when a webhook event represents an actual money refund (clawback). */
export function isRefundEvent(event: RcEvent): boolean {
  if (event.type === "REFUND") return true; // legacy/defensive; RC uses CANCELLATION
  return (
    event.type === "CANCELLATION" &&
    !!event.cancelReason &&
    REFUND_CANCEL_REASONS.has(event.cancelReason)
  );
}

/** True when an event is a one-time consumable (pack) purchase. */
export function isConsumableEvent(event: RcEvent): boolean {
  return event.type === "NON_RENEWING_PURCHASE";
}

/**
 * Refund clawback. Targets the entitlement actually held, NOT product-id
 * absence:
 *  - a known pack refund subtracts the pack size (clamp ≥ 0);
 *  - a subscription refund fires only when the profile genuinely held Pro via
 *    RevenueCat (known Pro product id, or planSource=revenuecat + plan=pro),
 *    clearing plan→free + planExpiresAt + planSource and clawing back the 500;
 *  - an unknown-product refund on a pack-only / never-Pro user is a no-op so a
 *    stray refund can't zero someone's monthly allowance.
 */
export function computeRefund(state: ProfileCreditState, productId: string): GrantDecision {
  const packSize = PACK_CREDITS[productId] ?? 0;
  if (packSize > 0) {
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

  const heldProViaRc =
    PRO_PRODUCT_IDS.has(productId) ||
    (state.planSource === "revenuecat" && state.plan === "pro");
  if (!heldProViaRc) {
    // Unknown product and no matching Pro entitlement → nothing to claw back.
    return { ...NOOP_GRANT, action: "refund" };
  }

  const credits = Math.max(0, state.credits ?? 0);
  const newCredits = Math.max(0, credits - CREDITS_PRO);
  return {
    action: "refund",
    changed: true,
    // undefined clears planExpiresAt/planSource (Convex db.patch removes them).
    patch: { credits: newCredits, plan: "free", planExpiresAt: undefined, planSource: undefined },
    ledgerDelta: newCredits - credits,
    ledgerReason: "revenuecat_refund_sub",
  };
}

/**
 * RevenueCat webhook event map (docs/PLAN.md). Pure — idempotency (rcEvents /
 * rcTransactionId) is enforced by the calling Convex mutation, not here.
 *
 * - INITIAL_PURCHASE / RENEWAL / UNCANCELLATION → Pro grant (bucket set-to-500).
 * - NON_RENEWING_PURCHASE                       → pack grant (packCredits +=).
 * - CANCELLATION (refund cancel_reason)         → refund clawback (see below).
 * - CANCELLATION (other cancel_reason)          → no change (keep until expiry).
 * - EXPIRATION / BILLING_ISSUE                  → plan=free only past expiry;
 *                                                 credits are never zeroed.
 * - REFUND (legacy/defensive)                   → refund clawback, clamp ≥ 0.
 * - anything else                               → ignore.
 */
export function reduceRevenueCatEvent(
  state: ProfileCreditState,
  event: RcEvent,
  now: number
): GrantDecision {
  // Refunds arrive as a CANCELLATION with cancel_reason=CUSTOMER_SUPPORT (or a
  // legacy REFUND type). Detect before the CANCELLATION no-op branch.
  if (isRefundEvent(event)) {
    return computeRefund(state, event.productId ?? "");
  }

  switch (event.type) {
    case "INITIAL_PURCHASE":
    case "RENEWAL":
    case "UNCANCELLATION":
      return applyProGrant(
        state,
        event.expirationAtMs ?? undefined,
        now,
        "revenuecat",
        event.periodType
      );

    case "NON_RENEWING_PURCHASE":
      return applyPackGrant(state, event.productId ?? "", "revenuecat");

    case "CANCELLATION":
      // Non-refund cancellation (auto-renew off). Credits persist until expiry.
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
  // Store-transaction dedupe guards ONLY consumable (pack) grants — a refund or
  // renewal reuses/omits the original purchase transaction id, so applying it
  // here would wrongly swallow a refund clawback (a purchase already wrote a row
  // under that transaction id). Consumable redelivery under a NEW event id still
  // can't double-grant thanks to this + the rcEvents by_event dedupe above.
  if (isConsumableEvent(event) && ctx.transactionSeen) {
    return { skip: true, reason: "duplicate_transaction", recordEvent: true };
  }
  // Owner: record the event, never touch credits.
  if (ctx.isOwner) return { skip: true, reason: "owner_unlimited", recordEvent: true };

  return { skip: false, recordEvent: true, decision: reduceRevenueCatEvent(state, event, now) };
}
