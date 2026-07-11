import { describe, it, expect } from "vitest";
import {
  CREDITS_PRO,
  CREDITS_PUBLIC,
  CREDITS_SKOOL,
  computeMonthlyReset,
  computeSpend,
  reduceRevenueCatEvent,
  planRevenueCatApply,
  applyProGrant,
  applyPackGrant,
  isProActive,
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

  it("REFUND of a subscription revokes Pro and claws back the monthly grant (clamp ≥ 0)", () => {
    const pro: ProfileCreditState = { credits: 200, packCredits: 0, plan: "pro", planExpiresAt: FEB, tier: "public" };
    const d = reduceRevenueCatEvent(pro, { type: "REFUND", productId: "sg_pro_monthly" }, JAN);
    expect(d.patch.plan).toBe("free");
    expect(d.patch.credits).toBe(0); // max(0, 200 - 500)
  });

  it("ignores an unrecognized event type", () => {
    const d = reduceRevenueCatEvent(base, { type: "TRANSFER" }, JAN);
    expect(d.action).toBe("ignore");
    expect(d.changed).toBe(false);
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
