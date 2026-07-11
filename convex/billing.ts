import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { isOwnerEmail } from "./constants";
import {
  applyPackGrant,
  applyProGrant,
  planRevenueCatApply,
  spendableTotal,
  PACK_CREDITS,
  PRO_PRODUCT_IDS,
  type GrantDecision,
} from "./creditLogic";

const CREDITS_PUBLIC = 25;
const CREDITS_SKOOL = 100;

function normalizeEmail(email: string) {
  return email.toLowerCase().trim();
}

async function findSkoolMemberByEmail(ctx: any, emailRaw: string) {
  const email = normalizeEmail(emailRaw);
  const exact = await ctx.db
    .query("skoolMembers")
    .withIndex("by_email", (q: any) => q.eq("email", email))
    .first();
  if (exact) return exact;

  const allMembers = await ctx.db.query("skoolMembers").collect();
  return allMembers.find((member: any) => normalizeEmail(member.email || "") === email) || null;
}

async function ensureUserAndProfile(ctx: any, email: string) {
  const normalizedEmail = normalizeEmail(email);
  let user = await ctx.db
    .query("users")
    .withIndex("by_email", (q: any) => q.eq("email", normalizedEmail))
    .first();

  if (!user) {
    const userId = await ctx.db.insert("users", {
      email: normalizedEmail,
      createdAt: Date.now(),
      isActive: true,
    });
    user = await ctx.db.get(userId);
  }

  if (!user) throw new Error("User creation failed");

  let profile = await ctx.db
    .query("profiles")
    .withIndex("by_user", (q: any) => q.eq("userId", user._id))
    .first();

  if (!profile) {
    const skoolMember = await findSkoolMemberByEmail(ctx, normalizedEmail);

    const isSkool = !!skoolMember;
    const tier = isSkool ? "skool" : "public";
    const credits = isSkool ? CREDITS_SKOOL : CREDITS_PUBLIC;

    const profileId = await ctx.db.insert("profiles", {
      userId: user._id,
      credits,
      lastResetDate: new Date().toISOString(),
      tier,
      updatedAt: Date.now(),
    });
    profile = await ctx.db.get(profileId);
  }
  if (profile) {
    const skoolMember = await findSkoolMemberByEmail(ctx, normalizedEmail);
    if (skoolMember && profile.tier !== "skool") {
      await ctx.db.patch(profile._id, {
        tier: "skool",
        credits: Math.max(profile.credits || 0, CREDITS_SKOOL),
        updatedAt: Date.now(),
      });
      profile = await ctx.db.get(profile._id);
    }
  }

  if (!profile) throw new Error("Profile creation failed");
  return { user, profile };
}

export const applyStripeCheckoutCredits = mutation({
  args: {
    eventId: v.string(),
    sessionId: v.string(),
    userId: v.id("users"),
    credits: v.number(),
    item: v.string(),
    amountCents: v.number(),
  },
  handler: async (ctx: any, args: any) => {
    const existingTx = await ctx.db
      .query("transactions")
      .withIndex("by_session", (q: any) => q.eq("stripeSessionId", args.sessionId))
      .first();
    if (existingTx?.status === "completed") return { applied: false, reason: "duplicate_session" };

    const seen = await ctx.db
      .query("stripeEvents")
      .withIndex("by_event", (q: any) => q.eq("eventId", args.eventId))
      .first();

    if (seen) return { applied: false, reason: "duplicate_event" };

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .first();

    if (!profile) throw new Error("Profile not found");

    const nextCredits = profile.credits + args.credits;

    await ctx.db.patch(profile._id, {
      credits: nextCredits,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("creditLedger", {
      userId: args.userId,
      delta: args.credits,
      reason: "stripe_checkout",
      metadata: { sessionId: args.sessionId, amountCents: args.amountCents },
      createdAt: Date.now(),
    });

    if (existingTx) {
      await ctx.db.patch(existingTx._id, {
        item: args.item,
        amountCents: args.amountCents,
        creditsGranted: args.credits,
        status: "completed",
      });
    } else {
      await ctx.db.insert("transactions", {
        userId: args.userId,
        stripeSessionId: args.sessionId,
        item: args.item,
        amountCents: args.amountCents,
        creditsGranted: args.credits,
        status: "completed",
        createdAt: Date.now(),
      });
    }

    await ctx.db.insert("stripeEvents", {
      eventId: args.eventId,
      type: "checkout.session.completed",
      createdAt: Date.now(),
    });

    return { applied: true, credits: nextCredits };
  },
});

/**
 * Applies a Stripe purchase to the two-bucket credit model (docs/PLAN.md).
 * Aligned with the RevenueCat path:
 *  - Pro subscription (pkgId `pro_monthly`, initial + renewal) → monthly bucket
 *    SET to 500, plan/planExpiresAt/planSource="stripe" stamped (never additive).
 *  - One-time packs (pkgId `pack_*`)                          → packCredits +=.
 *  - Unknown/legacy pkgId (e.g. old client reconcile calls)   → additive to the
 *    monthly bucket, preserving prior behavior.
 * Idempotent via `transactions.by_session` + `stripeEvents.by_event` (unchanged).
 */
export const applyStripeCheckoutCreditsByEmail = mutation({
  args: {
    eventId: v.string(),
    sessionId: v.string(),
    userEmail: v.string(),
    credits: v.number(),
    item: v.string(),
    amountCents: v.number(),
    pkgId: v.optional(v.string()),
    planExpiresAt: v.optional(v.number()),
  },
  handler: async (ctx: any, args: any) => {
    const existingTx = await ctx.db
      .query("transactions")
      .withIndex("by_session", (q: any) => q.eq("stripeSessionId", args.sessionId))
      .first();
    if (existingTx?.status === "completed") return { applied: false, reason: "duplicate_session" };

    const seen = await ctx.db
      .query("stripeEvents")
      .withIndex("by_event", (q: any) => q.eq("eventId", args.eventId))
      .first();

    if (seen) return { applied: false, reason: "duplicate_event" };

    const { user, profile } = await ensureUserAndProfile(ctx, args.userEmail);
    const now = Date.now();
    const isOwner = isOwnerEmail(args.userEmail);
    const pkgId: string = args.pkgId || "";

    const state = {
      credits: profile.credits || 0,
      packCredits: profile.packCredits || 0,
      plan: profile.plan,
      planExpiresAt: profile.planExpiresAt,
      planSource: profile.planSource,
      tier: profile.tier,
    };

    let decision: GrantDecision;
    if (PRO_PRODUCT_IDS.has(pkgId)) {
      decision = applyProGrant(state, args.planExpiresAt, now, "stripe");
    } else if (PACK_CREDITS[pkgId]) {
      decision = applyPackGrant(state, pkgId, "stripe");
    } else {
      // Legacy / unknown pkgId (e.g. api/checkout-complete fallback with no
      // pkgId): keep the historical additive-to-monthly-bucket behavior.
      decision = {
        action: "pack_grant",
        changed: true,
        patch: { credits: state.credits + args.credits },
        ledgerDelta: args.credits,
        ledgerReason: "stripe_checkout",
      };
    }

    if (!isOwner && decision.changed && Object.keys(decision.patch).length > 0) {
      await ctx.db.patch(profile._id, { ...decision.patch, updatedAt: now });
      if (decision.ledgerDelta !== 0) {
        await ctx.db.insert("creditLedger", {
          userId: user._id,
          delta: decision.ledgerDelta,
          reason: decision.ledgerReason || "stripe_checkout",
          metadata: { sessionId: args.sessionId, amountCents: args.amountCents, pkgId },
          createdAt: now,
        });
      }
    }

    if (existingTx) {
      await ctx.db.patch(existingTx._id, {
        item: args.item,
        amountCents: args.amountCents,
        creditsGranted: args.credits,
        status: "completed",
      });
    } else {
      await ctx.db.insert("transactions", {
        userId: user._id,
        stripeSessionId: args.sessionId,
        item: args.item,
        amountCents: args.amountCents,
        creditsGranted: args.credits,
        status: "completed",
        createdAt: now,
      });
    }

    await ctx.db.insert("stripeEvents", {
      eventId: args.eventId,
      type: "checkout.session.completed",
      createdAt: now,
    });

    const newCredits = decision.patch.credits ?? state.credits;
    const newPack = decision.patch.packCredits ?? state.packCredits;
    return { applied: true, credits: isOwner ? profile.credits : newCredits + newPack };
  },
});

/**
 * Applies a RevenueCat webhook event to the two-bucket model (docs/PLAN.md
 * event map). Pure decision logic lives in convex/creditLogic.ts; this wrapper
 * enforces idempotency and persistence.
 *
 * Idempotency:
 *  - `rcEvents.by_event`      dedupes redelivered webhook events (same eventId).
 *  - `transactions.by_rc_transaction` dedupes consumable (pack) grants when a
 *    store transaction is replayed under a different event id.
 */
export const applyRevenueCatEvent = mutation({
  args: {
    eventId: v.string(),
    type: v.string(),
    userEmail: v.string(),
    productId: v.optional(v.string()),
    expirationAtMs: v.optional(v.number()),
    transactionId: v.optional(v.string()),
    amountCents: v.optional(v.number()),
  },
  handler: async (ctx: any, args: any) => {
    const now = Date.now();

    // DB lookups the pure planner needs: event dedupe, transaction dedupe.
    const eventSeen = !!(await ctx.db
      .query("rcEvents")
      .withIndex("by_event", (q: any) => q.eq("eventId", args.eventId))
      .first());

    let transactionSeen = false;
    if (args.transactionId) {
      transactionSeen = !!(await ctx.db
        .query("transactions")
        .withIndex("by_rc_transaction", (q: any) => q.eq("rcTransactionId", args.transactionId))
        .first());
    }

    const { user, profile } = await ensureUserAndProfile(ctx, args.userEmail);

    const state = {
      credits: profile.credits || 0,
      packCredits: profile.packCredits || 0,
      plan: profile.plan,
      planExpiresAt: profile.planExpiresAt,
      planSource: profile.planSource,
      tier: profile.tier,
    };

    const plan = planRevenueCatApply(
      state,
      { type: args.type, productId: args.productId, expirationAtMs: args.expirationAtMs },
      now,
      { eventSeen, transactionSeen, isOwner: isOwnerEmail(args.userEmail) }
    );

    if (plan.skip) {
      if (plan.recordEvent) {
        await ctx.db.insert("rcEvents", { eventId: args.eventId, type: args.type, createdAt: now });
      }
      return { applied: false, reason: plan.reason };
    }

    const decision = plan.decision!;

    if (decision.changed && Object.keys(decision.patch).length > 0) {
      await ctx.db.patch(profile._id, { ...decision.patch, updatedAt: now });
    }
    if (decision.ledgerDelta !== 0) {
      await ctx.db.insert("creditLedger", {
        userId: user._id,
        delta: decision.ledgerDelta,
        reason: decision.ledgerReason || `revenuecat_${args.type}`,
        metadata: { eventId: args.eventId, type: args.type, productId: args.productId },
        createdAt: now,
      });
    }

    // Record a transaction row for grants (pack + pro) so account history and
    // the consumable-dedupe index stay populated.
    if (decision.action === "pack_grant" && decision.packCreditsGranted) {
      await ctx.db.insert("transactions", {
        userId: user._id,
        stripeSessionId: `rc_${args.transactionId || args.eventId}`,
        rcTransactionId: args.transactionId,
        item: args.productId || "Credit Pack",
        amountCents: args.amountCents || 0,
        creditsGranted: decision.packCreditsGranted,
        status: "completed",
        createdAt: now,
      });
    } else if (decision.action === "pro_grant") {
      await ctx.db.insert("transactions", {
        userId: user._id,
        stripeSessionId: `rc_sub_${args.eventId}`,
        rcTransactionId: args.transactionId,
        item: args.productId || "Pro Monthly",
        amountCents: args.amountCents || 0,
        creditsGranted: decision.patch.credits ?? 0,
        status: "completed",
        createdAt: now,
      });
    }

    await ctx.db.insert("rcEvents", { eventId: args.eventId, type: args.type, createdAt: now });

    return {
      applied: decision.changed,
      action: decision.action,
      credits: spendableTotal({ credits: decision.patch.credits ?? state.credits, packCredits: decision.patch.packCredits ?? state.packCredits }),
    };
  },
});

export const createStripeCheckoutPendingByEmail = mutation({
  args: {
    sessionId: v.string(),
    userEmail: v.string(),
    credits: v.number(),
    item: v.string(),
    amountCents: v.number(),
  },
  handler: async (ctx: any, args: any) => {
    const existing = await ctx.db
      .query("transactions")
      .withIndex("by_session", (q: any) => q.eq("stripeSessionId", args.sessionId))
      .first();
    if (existing) return { created: false, reason: "exists" };

    const { user } = await ensureUserAndProfile(ctx, args.userEmail);
    await ctx.db.insert("transactions", {
      userId: user._id,
      stripeSessionId: args.sessionId,
      item: args.item,
      amountCents: args.amountCents,
      creditsGranted: args.credits,
      status: "pending",
      createdAt: Date.now(),
    });
    return { created: true };
  },
});
