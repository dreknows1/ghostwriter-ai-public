import { describe, it, expect } from "vitest";
import {
  CREDITS_PRO,
  CREDITS_PUBLIC,
  CREDITS_SKOOL,
  DAY_MS,
  PRO_GRACE_MS,
  monthKey,
  computeMonthlyReset,
  computeSpend,
  computeSpendChecked,
  reduceRevenueCatEvent,
  planRevenueCatApply,
  applyProGrant,
  applyPackGrant,
  isProActive,
  isRefundEvent,
  spendableTotal,
  type ProfileCreditState,
  type RcEvent,
  type GrantDecision,
} from "./creditLogic";

const JAN = Date.UTC(2026, 0, 15); // 2026-01-15
const FEB = Date.UTC(2026, 1, 15); // 2026-02-15
const iso = (ms: number) => new Date(ms).toISOString();

// ---------------------------------------------------------------------------
// Monthly reset
// ---------------------------------------------------------------------------
describe("computeMonthlyReset", () => {
  it("does not reset within the same calendar month", () => {
    const state: ProfileCreditState = { credits: 12, tier: "public", lastResetDate: iso(JAN) };
    const d = computeMonthlyReset(state, JAN + 1000 * 60 * 60);
    expect(d.reset).toBe(false);
    expect(d.credits).toBe(12);
  });

  it("resets a public user to 25 on month rollover", () => {
    const state: ProfileCreditState = { credits: 3, tier: "public", lastResetDate: iso(JAN) };
    const d = computeMonthlyReset(state, FEB);
    expect(d.reset).toBe(true);
    expect(d.credits).toBe(CREDITS_PUBLIC);
  });

  it("resets a skool user to 100 on month rollover", () => {
    const state: ProfileCreditState = { credits: 3, tier: "skool", lastResetDate: iso(JAN) };
    const d = computeMonthlyReset(state, FEB);
    expect(d.reset).toBe(true);
    expect(d.credits).toBe(CREDITS_SKOOL);
  });

  // Row 14: Pro crosses UTC month pre-renewal → NOT clobbered to 25/100.
  it("SKIPS the reset for an active Pro subscriber (never clobbers to 25)", () => {
    const state: ProfileCreditState = {
      credits: 480, // spent 20 this cycle
      tier: "public",
      plan: "pro",
      planExpiresAt: FEB + 1000 * 60 * 60 * 24 * 10, // still valid mid-Feb
      lastResetDate: iso(JAN),
    };
    const d = computeMonthlyReset(state, FEB);
    expect(d.reset).toBe(false);
    expect(d.credits).toBe(480);
  });

  it("resets a Pro whose plan has already expired (down to tier baseline)", () => {
    const state: ProfileCreditState = {
      credits: 500,
      tier: "public",
      plan: "pro",
      planExpiresAt: JAN + 1000, // expired long before FEB
      lastResetDate: iso(JAN),
    };
    const d = computeMonthlyReset(state, FEB);
    expect(d.reset).toBe(true);
    expect(d.credits).toBe(CREDITS_PUBLIC);
  });

  // Finding #5: expiry 1 day ago, month boundary crossed, still within grace →
  // a paying subscriber awaiting renewal is NOT reset to 25.
  it("does NOT reset a Pro within the billing-retry grace window", () => {
    const now = FEB;
    const state: ProfileCreditState = {
      credits: 500,
      tier: "public",
      plan: "pro",
      planExpiresAt: now - DAY_MS, // expired 1 day ago, inside PRO_GRACE_MS
      lastResetDate: iso(JAN),
    };
    expect(PRO_GRACE_MS).toBeGreaterThan(DAY_MS);
    const d = computeMonthlyReset(state, now);
    expect(d.reset).toBe(false);
    expect(d.credits).toBe(500);
  });

  it("DOES reset a Pro once past the grace window", () => {
    const now = FEB;
    const state: ProfileCreditState = {
      credits: 500,
      tier: "public",
      plan: "pro",
      planExpiresAt: now - PRO_GRACE_MS - DAY_MS, // grace fully elapsed
      lastResetDate: iso(JAN),
    };
    const d = computeMonthlyReset(state, now);
    expect(d.reset).toBe(true);
    expect(d.credits).toBe(CREDITS_PUBLIC);
  });

  // Row 15: pack credits survive a month rollover — reset never returns/touches packs.
  it("never references packCredits (packs survive rollover)", () => {
    const state: ProfileCreditState = {
      credits: 0,
      packCredits: 250,
      tier: "public",
      lastResetDate: iso(JAN),
    };
    const d = computeMonthlyReset(state, FEB);
    // Decision only carries the monthly bucket; packCredits is untouched by callers.
    expect(d).not.toHaveProperty("packCredits");
    expect(d.credits).toBe(CREDITS_PUBLIC);
  });
});

// ---------------------------------------------------------------------------
// Spend (monthly first, then packs)
// ---------------------------------------------------------------------------
describe("computeSpend", () => {
  it("draws from the monthly bucket first", () => {
    const d = computeSpend(25, 250, 10);
    expect(d.credits).toBe(15);
    expect(d.packCredits).toBe(250);
    expect(d.total).toBe(265);
    expect(d.spent).toBe(10);
  });

  // Row 16: monthly bucket empty, packs remain → spend draws from packCredits.
  it("draws from packs once the monthly bucket is empty", () => {
    const d = computeSpend(0, 250, 10);
    expect(d.credits).toBe(0);
    expect(d.packCredits).toBe(240);
    expect(d.total).toBe(240);
  });

  it("spans both buckets when the monthly bucket is partially short", () => {
    const d = computeSpend(4, 250, 10); // 4 from monthly, 6 from packs
    expect(d.credits).toBe(0);
    expect(d.packCredits).toBe(244);
    expect(d.spent).toBe(10);
  });

  it("clamps at zero on over-spend (never negative)", () => {
    const d = computeSpend(3, 2, 100);
    expect(d.credits).toBe(0);
    expect(d.packCredits).toBe(0);
    expect(d.total).toBe(0);
    expect(d.spent).toBe(5);
  });
});

// Finding #6: server-authoritative spend REJECTS instead of clamping.
describe("computeSpendChecked", () => {
  it("rejects an over-spend and deducts nothing", () => {
    const d = computeSpendChecked(9, 0, 10); // 9 available, costs 10
    expect(d.ok).toBe(false);
    expect(d.spent).toBe(0);
    expect(d.credits).toBe(9); // untouched
    expect(d.packCredits).toBe(0);
    expect(d.available).toBe(9);
  });

  it("succeeds and deducts monthly-first when covered", () => {
    const d = computeSpendChecked(4, 250, 10); // 4 monthly + 6 pack
    expect(d.ok).toBe(true);
    expect(d.credits).toBe(0);
    expect(d.packCredits).toBe(244);
    expect(d.spent).toBe(10);
    expect(d.total).toBe(244);
  });

  it("succeeds on an exact-balance spend", () => {
    const d = computeSpendChecked(6, 4, 10);
    expect(d.ok).toBe(true);
    expect(d.total).toBe(0);
    expect(d.spent).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// Grants (shared Stripe/RevenueCat building blocks)
// ---------------------------------------------------------------------------
describe("applyProGrant", () => {
  it("SETS the monthly bucket to 500 (not additive) and stamps plan", () => {
    const d = applyProGrant({ credits: 480, packCredits: 100 }, FEB + 1000, JAN, "stripe");
    expect(d.patch.credits).toBe(CREDITS_PRO);
    expect(d.patch.plan).toBe("pro");
    expect(d.patch.planExpiresAt).toBe(FEB + 1000);
    expect(d.patch.planSource).toBe("stripe");
    expect(d.patch.lastResetDate).toBe(iso(JAN));
    // packCredits is never referenced by a Pro grant.
    expect(d.patch.packCredits).toBeUndefined();
  });

  // Finding #2: planExpiresAt only ever moves forward.
  it("keeps the later expiry when an out-of-order earlier one arrives", () => {
    const MARCH = Date.UTC(2026, 2, 15);
    // Existing state already renewed through March; an out-of-order INITIAL
    // (expiry Feb) must NOT drag expiry backward.
    const state: ProfileCreditState = { credits: 500, plan: "pro", planExpiresAt: MARCH };
    const d = applyProGrant(state, FEB, JAN, "revenuecat");
    expect(d.patch.planExpiresAt).toBe(MARCH);
  });

  it("advances expiry when the incoming one is later", () => {
    const MARCH = Date.UTC(2026, 2, 15);
    const state: ProfileCreditState = { credits: 500, plan: "pro", planExpiresAt: FEB };
    const d = applyProGrant(state, MARCH, JAN, "revenuecat");
    expect(d.patch.planExpiresAt).toBe(MARCH);
  });

  // Finding #4: a grant with no usable future expiry derives a sane one so the
  // 500 isn't left instantly-expired for the next reset to wipe.
  it("derives a future expiry when none is provided (default ~1 month)", () => {
    const d = applyProGrant({ credits: 25 }, undefined, JAN, "revenuecat");
    expect(d.patch.planExpiresAt).toBe(JAN + 31 * DAY_MS);
    expect(d.patch.planExpiresAt!).toBeGreaterThan(JAN);
  });

  it("derives a 7-day expiry for a TRIAL period when none is provided", () => {
    const d = applyProGrant({ credits: 25 }, undefined, JAN, "revenuecat", "TRIAL");
    expect(d.patch.planExpiresAt).toBe(JAN + 7 * DAY_MS);
  });

  it("derives a future expiry when the provided/existing one is already in the past", () => {
    const state: ProfileCreditState = { credits: 25, plan: "pro", planExpiresAt: JAN - DAY_MS };
    const d = applyProGrant(state, JAN - 1000, JAN, "revenuecat");
    expect(d.patch.planExpiresAt!).toBeGreaterThan(JAN);
  });

  // Finding #4 DONE criterion: a renewal missing expiration_at_ms still keeps the
  // user Pro-active through the next calendar month boundary (reset is skipped).
  it("renewal without expiry keeps the user Pro-active past the month boundary", () => {
    // Grant at Jan 15 with no expiry → derived expiry Jan 15 + 31d = Feb 15.
    const grant = applyProGrant({ credits: 30, plan: "pro", tier: "public" }, undefined, JAN, "revenuecat");
    const granted: ProfileCreditState = {
      credits: grant.patch.credits!,
      plan: grant.patch.plan,
      planExpiresAt: grant.patch.planExpiresAt,
      planSource: grant.patch.planSource,
      tier: "public",
      lastResetDate: grant.patch.lastResetDate,
    };
    // Early February: a new calendar month vs the Jan grant, still before expiry.
    const FEB_EARLY = Date.UTC(2026, 1, 3);
    expect(monthKey(FEB_EARLY)).not.toBe(monthKey(JAN));
    expect(isProActive(granted, FEB_EARLY)).toBe(true);
    const reset = computeMonthlyReset(granted, FEB_EARLY);
    expect(reset.reset).toBe(false); // not wiped to 25 at the boundary
    expect(reset.credits).toBe(CREDITS_PRO);
  });
});

describe("applyPackGrant", () => {
  it("adds pack size to the packCredits bucket", () => {
    const d = applyPackGrant({ credits: 5, packCredits: 40 }, "sg_pack_250", "revenuecat");
    expect(d.patch.packCredits).toBe(290);
    expect(d.packCreditsGranted).toBe(250);
    expect(d.patch.credits).toBeUndefined();
  });

  it("ignores an unknown product id", () => {
    const d = applyPackGrant({ credits: 5, packCredits: 40 }, "sg_pack_999", "revenuecat");
    expect(d.action).toBe("ignore");
    expect(d.changed).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// RevenueCat event reducer
// ---------------------------------------------------------------------------
describe("reduceRevenueCatEvent", () => {
  const base: ProfileCreditState = { credits: 25, packCredits: 0, plan: "free", tier: "public" };

  // Row 12: Pro sub purchase → plan=pro, expiry set, bucket=500.
  it("INITIAL_PURCHASE → plan=pro, expiry, bucket=500", () => {
    const ev: RcEvent = { type: "INITIAL_PURCHASE", productId: "sg_pro_monthly", expirationAtMs: FEB };
    const d = reduceRevenueCatEvent(base, ev, JAN);
    expect(d.patch.credits).toBe(CREDITS_PRO);
    expect(d.patch.plan).toBe("pro");
    expect(d.patch.planExpiresAt).toBe(FEB);
    expect(d.patch.planSource).toBe("revenuecat");
  });

  // Row 13: RENEWAL → bucket set-to-500, not additive.
  it("RENEWAL sets the bucket to 500 (not additive)", () => {
    const spent: ProfileCreditState = { credits: 30, packCredits: 0, plan: "pro", planExpiresAt: FEB, tier: "public" };
    const ev: RcEvent = { type: "RENEWAL", productId: "sg_pro_monthly", expirationAtMs: FEB + 100000 };
    const d = reduceRevenueCatEvent(spent, ev, FEB);
    expect(d.patch.credits).toBe(CREDITS_PRO); // NOT 530
  });

  it("UNCANCELLATION re-grants Pro", () => {
    const ev: RcEvent = { type: "UNCANCELLATION", productId: "sg_pro_monthly", expirationAtMs: FEB };
    expect(reduceRevenueCatEvent(base, ev, JAN).patch.plan).toBe("pro");
  });

  it("NON_RENEWING_PURCHASE grants pack credits", () => {
    const ev: RcEvent = { type: "NON_RENEWING_PURCHASE", productId: "sg_pack_100" };
    const d = reduceRevenueCatEvent(base, ev, JAN);
    expect(d.patch.packCredits).toBe(100);
    expect(d.packCreditsGranted).toBe(100);
  });

  // Row 17: CANCELLATION (auto-renew off) → credits kept until expiry.
  it("CANCELLATION makes no changes", () => {
    const pro: ProfileCreditState = { credits: 500, packCredits: 0, plan: "pro", planExpiresAt: FEB, tier: "public" };
    const d = reduceRevenueCatEvent(pro, { type: "CANCELLATION" }, JAN);
    expect(d.action).toBe("cancellation");
    expect(d.changed).toBe(false);
    expect(d.patch).toEqual({});
  });

  // Row 18: EXPIRATION past period end → plan=free; credits not zeroed.
  it("EXPIRATION past expiry → plan=free, credits untouched", () => {
    const pro: ProfileCreditState = { credits: 120, packCredits: 40, plan: "pro", planExpiresAt: JAN, tier: "public" };
    const d = reduceRevenueCatEvent(pro, { type: "EXPIRATION" }, FEB);
    expect(d.changed).toBe(true);
    expect(d.patch.plan).toBe("free");
    expect(d.patch.credits).toBeUndefined(); // never zeroed
    expect(d.patch.packCredits).toBeUndefined();
  });

  it("EXPIRATION before expiry keeps Pro (grace / redelivery ordering)", () => {
    const pro: ProfileCreditState = { credits: 500, plan: "pro", planExpiresAt: FEB + 1000000, tier: "public" };
    const d = reduceRevenueCatEvent(pro, { type: "EXPIRATION" }, FEB);
    expect(d.changed).toBe(false);
    expect(d.patch.plan).toBeUndefined();
  });

  it("BILLING_ISSUE past expiry downgrades to free without zeroing credits", () => {
    const pro: ProfileCreditState = { credits: 77, plan: "pro", planExpiresAt: JAN, tier: "public" };
    const d = reduceRevenueCatEvent(pro, { type: "BILLING_ISSUE" }, FEB);
    expect(d.patch.plan).toBe("free");
    expect(d.patch.credits).toBeUndefined();
  });

  // Row 19: REFUND of a pack → clawed back, clamped ≥ 0.
  it("REFUND of a pack claws back the pack credits", () => {
    const withPack: ProfileCreditState = { credits: 10, packCredits: 250, plan: "free", tier: "public" };
    const d = reduceRevenueCatEvent(withPack, { type: "REFUND", productId: "sg_pack_250" }, JAN);
    expect(d.patch.packCredits).toBe(0);
    expect(d.ledgerDelta).toBe(-250);
  });

  it("REFUND of a pack clamps at zero when credits were already spent", () => {
    const withPack: ProfileCreditState = { credits: 10, packCredits: 100, plan: "free", tier: "public" };
    const d = reduceRevenueCatEvent(withPack, { type: "REFUND", productId: "sg_pack_250" }, JAN);
    expect(d.patch.packCredits).toBe(0); // 100 - 250 clamped to 0
  });

  it("REFUND of a subscription revokes Pro, claws back the grant, and clears expiry/source", () => {
    const pro: ProfileCreditState = { credits: 200, packCredits: 0, plan: "pro", planSource: "revenuecat", planExpiresAt: FEB, tier: "public" };
    const d = reduceRevenueCatEvent(pro, { type: "REFUND", productId: "sg_pro_monthly" }, JAN);
    expect(d.patch.plan).toBe("free");
    expect(d.patch.credits).toBe(0); // max(0, 200 - 500)
    expect(d.patch.planExpiresAt).toBeUndefined(); // cleared
    expect(d.patch.planSource).toBeUndefined(); // cleared
  });

  // Finding #1: refunds are delivered as CANCELLATION with a refund cancel_reason.
  it("CANCELLATION with cancel_reason=CUSTOMER_SUPPORT claws back a subscription", () => {
    const pro: ProfileCreditState = { credits: 500, plan: "pro", planSource: "revenuecat", planExpiresAt: FEB, tier: "public" };
    const d = reduceRevenueCatEvent(
      pro,
      { type: "CANCELLATION", cancelReason: "CUSTOMER_SUPPORT", productId: "sg_pro_monthly" },
      JAN
    );
    expect(d.action).toBe("refund");
    expect(d.patch.plan).toBe("free");
    expect(d.patch.credits).toBe(0);
  });

  it("CANCELLATION with cancel_reason=CUSTOMER_SUPPORT claws back a pack", () => {
    const withPack: ProfileCreditState = { credits: 25, packCredits: 250, plan: "free", tier: "public" };
    const d = reduceRevenueCatEvent(
      withPack,
      { type: "CANCELLATION", cancelReason: "CUSTOMER_SUPPORT", productId: "sg_pack_250" },
      JAN
    );
    expect(d.action).toBe("refund");
    expect(d.patch.packCredits).toBe(0);
    expect(d.patch.credits).toBeUndefined(); // monthly bucket untouched
  });

  it("CANCELLATION with cancel_reason=UNSUBSCRIBE is a no-op (keeps credits)", () => {
    const pro: ProfileCreditState = { credits: 500, plan: "pro", planExpiresAt: FEB, tier: "public" };
    const d = reduceRevenueCatEvent(pro, { type: "CANCELLATION", cancelReason: "UNSUBSCRIBE" }, JAN);
    expect(d.action).toBe("cancellation");
    expect(d.changed).toBe(false);
  });

  // Finding #8: a stray/unknown-product refund must NOT zero a pack-only user's
  // monthly allowance, and must not touch a plan they never held.
  it("unknown-product REFUND on a pack-only free user is a no-op (25 credits kept)", () => {
    const packOnly: ProfileCreditState = { credits: 25, packCredits: 100, plan: "free", tier: "public" };
    const d = reduceRevenueCatEvent(packOnly, { type: "REFUND", productId: "" }, JAN);
    expect(d.changed).toBe(false);
    expect(d.patch.credits).toBeUndefined();
    expect(d.patch.plan).toBeUndefined();
  });

  it("unknown-product CANCELLATION-refund still claws a genuine RC Pro holder", () => {
    // No productId, but the profile held Pro via RevenueCat → sub clawback fires.
    const pro: ProfileCreditState = { credits: 400, plan: "pro", planSource: "revenuecat", planExpiresAt: FEB, tier: "public" };
    const d = reduceRevenueCatEvent(pro, { type: "CANCELLATION", cancelReason: "CUSTOMER_SUPPORT", productId: "" }, JAN);
    expect(d.action).toBe("refund");
    expect(d.patch.plan).toBe("free");
    expect(d.patch.credits).toBe(0);
  });

  it("ignores an unrecognized event type", () => {
    const d = reduceRevenueCatEvent(base, { type: "TRANSFER" }, JAN);
    expect(d.action).toBe("ignore");
    expect(d.changed).toBe(false);
  });

  it("isRefundEvent classifies CANCELLATION cancel_reasons correctly", () => {
    expect(isRefundEvent({ type: "CANCELLATION", cancelReason: "CUSTOMER_SUPPORT" })).toBe(true);
    expect(isRefundEvent({ type: "CANCELLATION", cancelReason: "UNSUBSCRIBE" })).toBe(false);
    expect(isRefundEvent({ type: "CANCELLATION" })).toBe(false);
    expect(isRefundEvent({ type: "REFUND" })).toBe(true);
    expect(isRefundEvent({ type: "RENEWAL" })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Idempotency (planRevenueCatApply + a faithful in-memory mutation model)
// ---------------------------------------------------------------------------
describe("planRevenueCatApply idempotency", () => {
  it("skips a redelivered event id (recordEvent=false)", () => {
    const plan = planRevenueCatApply(
      { credits: 25, packCredits: 0, tier: "public" },
      { type: "INITIAL_PURCHASE", productId: "sg_pro_monthly", expirationAtMs: FEB },
      JAN,
      { eventSeen: true, transactionSeen: false, isOwner: false }
    );
    expect(plan.skip).toBe(true);
    expect(plan.reason).toBe("duplicate_event");
    expect(plan.recordEvent).toBe(false);
  });

  it("skips a replayed store transaction but records the event", () => {
    const plan = planRevenueCatApply(
      { credits: 25, packCredits: 0, tier: "public" },
      { type: "NON_RENEWING_PURCHASE", productId: "sg_pack_50" },
      JAN,
      { eventSeen: false, transactionSeen: true, isOwner: false }
    );
    expect(plan.skip).toBe(true);
    expect(plan.reason).toBe("duplicate_transaction");
    expect(plan.recordEvent).toBe(true);
  });

  it("skips owner accounts without granting", () => {
    const plan = planRevenueCatApply(
      { credits: 25, tier: "public" },
      { type: "INITIAL_PURCHASE", productId: "sg_pro_monthly", expirationAtMs: FEB },
      JAN,
      { eventSeen: false, transactionSeen: false, isOwner: true }
    );
    expect(plan.skip).toBe(true);
    expect(plan.reason).toBe("owner_unlimited");
  });

  // Row 11: RC webhook redelivered same event id → dedupe, no double grant.
  it("same eventId delivered twice grants exactly once (in-memory mutation model)", () => {
    // Faithful model of billing:applyRevenueCatEvent's control flow.
    const profile: ProfileCreditState = { credits: 25, packCredits: 0, plan: "free", tier: "public" };
    const seenEvents = new Set<string>();
    const seenTx = new Set<string>();
    let grantCount = 0;

    const deliver = (eventId: string, ev: RcEvent, txId?: string) => {
      const plan = planRevenueCatApply(profile, ev, JAN, {
        eventSeen: seenEvents.has(eventId),
        transactionSeen: txId ? seenTx.has(txId) : false,
        isOwner: false,
      });
      if (plan.skip) {
        if (plan.recordEvent) seenEvents.add(eventId);
        return;
      }
      const d = plan.decision as GrantDecision;
      if (d.patch.credits !== undefined) profile.credits = d.patch.credits;
      if (d.patch.packCredits !== undefined) profile.packCredits = d.patch.packCredits;
      if (d.patch.plan !== undefined) profile.plan = d.patch.plan;
      if (d.action === "pack_grant" && txId) seenTx.add(txId);
      seenEvents.add(eventId);
      grantCount += 1;
    };

    const ev: RcEvent = { type: "NON_RENEWING_PURCHASE", productId: "sg_pack_250" };
    deliver("evt_1", ev, "txn_abc");
    deliver("evt_1", ev, "txn_abc"); // exact redelivery
    deliver("evt_2", ev, "txn_abc"); // same transaction, different event id

    expect(grantCount).toBe(1);
    expect(profile.packCredits).toBe(250); // not 500 or 750
  });

  // Redelivery is also safe for a subscription grant because it SETS (not adds).
  it("renewal set-not-add is naturally idempotent under redelivery", () => {
    let profile: ProfileCreditState = { credits: 30, plan: "pro", planExpiresAt: FEB, tier: "public" };
    const ev: RcEvent = { type: "RENEWAL", productId: "sg_pro_monthly", expirationAtMs: FEB + 1000 };
    const first = reduceRevenueCatEvent(profile, ev, FEB);
    profile = { ...profile, credits: first.patch.credits!, planExpiresAt: first.patch.planExpiresAt };
    const second = reduceRevenueCatEvent(profile, ev, FEB);
    expect(second.patch.credits).toBe(CREDITS_PRO); // still 500, not 1000
  });

  // The refund-swallow bug lived exactly here: refund events routed through
  // planRevenueCatApply with transactionSeen=true. Prove they are NOT skipped.
  it("does NOT swallow a refund event even when its transaction id was seen", () => {
    const pro: ProfileCreditState = { credits: 500, plan: "pro", planSource: "revenuecat", planExpiresAt: FEB };
    const plan = planRevenueCatApply(
      pro,
      { type: "CANCELLATION", cancelReason: "CUSTOMER_SUPPORT", productId: "sg_pro_monthly" },
      JAN,
      { eventSeen: false, transactionSeen: true, isOwner: false } // original purchase tx already recorded
    );
    expect(plan.skip).toBe(false);
    expect(plan.decision!.action).toBe("refund");
    expect(plan.decision!.patch.plan).toBe("free");
  });
});

// ---------------------------------------------------------------------------
// Full lifecycle through planRevenueCatApply (the real mutation entry point).
// The in-memory store faithfully models billing:applyRevenueCatEvent: rcEvents
// by_event dedupe, consumable-only transaction dedupe, and pro/pack grants both
// recording a transactions row keyed by the store transaction id.
// ---------------------------------------------------------------------------
describe("lifecycle through planRevenueCatApply", () => {
  const NOW = Date.UTC(2026, 0, 20);

  function makeStore(initial: ProfileCreditState) {
    const profile: ProfileCreditState = { ...initial };
    const seenEvents = new Set<string>();
    const seenTx = new Set<string>();

    function deliver(eventId: string, event: RcEvent, transactionId?: string) {
      const consumable = event.type === "NON_RENEWING_PURCHASE";
      const eventSeen = seenEvents.has(eventId);
      const transactionSeen = consumable && transactionId ? seenTx.has(transactionId) : false;
      const plan = planRevenueCatApply(profile, event, NOW, { eventSeen, transactionSeen, isOwner: false });
      if (plan.skip) {
        if (plan.recordEvent) seenEvents.add(eventId);
        return plan;
      }
      const d = plan.decision as GrantDecision;
      if (d.changed) {
        if (d.patch.credits !== undefined) profile.credits = d.patch.credits;
        if (d.patch.packCredits !== undefined) profile.packCredits = d.patch.packCredits;
        if (d.patch.plan !== undefined) profile.plan = d.patch.plan;
        if ("planExpiresAt" in d.patch) profile.planExpiresAt = d.patch.planExpiresAt;
        if ("planSource" in d.patch) profile.planSource = d.patch.planSource;
      }
      // Both pro and pack grants write a transactions row with rcTransactionId.
      if ((d.action === "pro_grant" || d.action === "pack_grant") && transactionId) {
        seenTx.add(transactionId);
      }
      seenEvents.add(eventId);
      return plan;
    }

    return { profile, deliver };
  }

  // Finding #1: purchase → refund (refund reuses the purchase transaction id)
  // must end at free with credits clawed back — not swallowed as a duplicate.
  it("purchase → refund ends at free with the pro grant clawed back", () => {
    const store = makeStore({ credits: 25, plan: "free", tier: "public" });
    const TX = "txn_sub_1";

    store.deliver("evt_purchase", { type: "INITIAL_PURCHASE", productId: "sg_pro_monthly", expirationAtMs: NOW + 30 * DAY_MS, periodType: "NORMAL" }, TX);
    expect(store.profile.plan).toBe("pro");
    expect(store.profile.credits).toBe(CREDITS_PRO);

    // Refund arrives as a CANCELLATION reusing the same store transaction id.
    const plan = store.deliver("evt_refund", { type: "CANCELLATION", cancelReason: "CUSTOMER_SUPPORT", productId: "sg_pro_monthly" }, TX);
    expect(plan.skip).toBe(false); // NOT swallowed by tx-dedupe
    expect(store.profile.plan).toBe("free");
    expect(store.profile.credits).toBe(0);
    expect(store.profile.planExpiresAt).toBeUndefined();
    expect(store.profile.planSource).toBeUndefined();
  });

  it("a redelivered refund event does not double-apply (rcEvents dedupe)", () => {
    const store = makeStore({ credits: 25, plan: "free", tier: "public" });
    const TX = "txn_sub_2";
    store.deliver("evt_p", { type: "INITIAL_PURCHASE", productId: "sg_pro_monthly", expirationAtMs: NOW + 30 * DAY_MS }, TX);
    store.deliver("evt_r", { type: "CANCELLATION", cancelReason: "CUSTOMER_SUPPORT", productId: "sg_pro_monthly" }, TX);
    const replay = store.deliver("evt_r", { type: "CANCELLATION", cancelReason: "CUSTOMER_SUPPORT", productId: "sg_pro_monthly" }, TX);
    expect(replay.skip).toBe(true);
    expect(replay.reason).toBe("duplicate_event");
    expect(store.profile.plan).toBe("free");
  });

  // Finding #3: pack purchase delivered twice with NO store transaction id but
  // the same deterministic fallback key, under two different event ids → once.
  it("consumable with a fallback dedupe key grants once across two event ids", () => {
    const store = makeStore({ credits: 25, packCredits: 0, plan: "free", tier: "public" });
    // Webhook derives this deterministic key when transaction_id is absent.
    const FALLBACK = "rcfallback_user@x.com_sg_pack_250_1700000000000";
    const ev: RcEvent = { type: "NON_RENEWING_PURCHASE", productId: "sg_pack_250" };
    store.deliver("evt_a", ev, FALLBACK);
    const second = store.deliver("evt_b", ev, FALLBACK); // new event id, same fallback key
    expect(second.skip).toBe(true);
    expect(second.reason).toBe("duplicate_transaction");
    expect(store.profile.packCredits).toBe(250); // granted once, not 500
  });

  // Finding #8 end-to-end: stray refund on a pack-only user leaves them at 25.
  it("stray unknown-product refund leaves a pack-only user untouched", () => {
    const store = makeStore({ credits: 25, packCredits: 100, plan: "free", tier: "public" });
    const plan = store.deliver("evt_stray", { type: "REFUND", productId: "" }, "txn_x");
    expect(plan.skip).toBe(false);
    expect(store.profile.credits).toBe(25);
    expect(store.profile.packCredits).toBe(100);
    expect(store.profile.plan).toBe("free");
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
describe("helpers", () => {
  it("isProActive requires plan=pro and an unexpired planExpiresAt", () => {
    expect(isProActive({ credits: 0, plan: "pro", planExpiresAt: FEB }, JAN)).toBe(true);
    expect(isProActive({ credits: 0, plan: "pro", planExpiresAt: JAN }, FEB)).toBe(false);
    expect(isProActive({ credits: 0, plan: "free", planExpiresAt: FEB }, JAN)).toBe(false);
  });

  it("spendableTotal sums both buckets and clamps negatives", () => {
    expect(spendableTotal({ credits: 25, packCredits: 250 })).toBe(275);
    expect(spendableTotal({ credits: 0 })).toBe(0);
    expect(spendableTotal({ credits: -5, packCredits: -10 })).toBe(0);
  });
});
