import { mutation } from "./_generated/server";
import { v } from "convex/values";

async function ensureUserAndProfile(ctx: any, email: string) {
  const normalizedEmail = email.toLowerCase().trim();
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
    const profileId = await ctx.db.insert("profiles", {
      userId: user._id,
      credits: 100,
      lastResetDate: new Date().toISOString(),
      updatedAt: Date.now(),
    });
    profile = await ctx.db.get(profileId);
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

    await ctx.db.insert("transactions", {
      userId: args.userId,
      stripeSessionId: args.sessionId,
      item: args.item,
      amountCents: args.amountCents,
      creditsGranted: args.credits,
      status: "completed",
      createdAt: Date.now(),
    });

    await ctx.db.insert("stripeEvents", {
      eventId: args.eventId,
      type: "checkout.session.completed",
      createdAt: Date.now(),
    });

    return { applied: true, credits: nextCredits };
  },
});

export const applyStripeCheckoutCreditsByEmail = mutation({
  args: {
    eventId: v.string(),
    sessionId: v.string(),
    userEmail: v.string(),
    credits: v.number(),
    item: v.string(),
    amountCents: v.number(),
  },
  handler: async (ctx: any, args: any) => {
    const seen = await ctx.db
      .query("stripeEvents")
      .withIndex("by_event", (q: any) => q.eq("eventId", args.eventId))
      .first();

    if (seen) return { applied: false, reason: "duplicate_event" };

    const { user, profile } = await ensureUserAndProfile(ctx, args.userEmail);
    const nextCredits = profile.credits + args.credits;

    await ctx.db.patch(profile._id, {
      credits: nextCredits,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("creditLedger", {
      userId: user._id,
      delta: args.credits,
      reason: "stripe_checkout",
      metadata: { sessionId: args.sessionId, amountCents: args.amountCents },
      createdAt: Date.now(),
    });

    await ctx.db.insert("transactions", {
      userId: user._id,
      stripeSessionId: args.sessionId,
      item: args.item,
      amountCents: args.amountCents,
      creditsGranted: args.credits,
      status: "completed",
      createdAt: Date.now(),
    });

    await ctx.db.insert("stripeEvents", {
      eventId: args.eventId,
      type: "checkout.session.completed",
      createdAt: Date.now(),
    });

    return { applied: true, credits: nextCredits };
  },
});
