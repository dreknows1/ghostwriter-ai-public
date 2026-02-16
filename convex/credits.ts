import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const CREDITS_PUBLIC = 25;
const CREDITS_SKOOL = 100;

export const getCredits = query({
  args: { userId: v.id("users") },
  handler: async (ctx: any, args: any) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .first();

    return profile?.credits ?? 0;
  },
});

export const spendCredits = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    reason: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx: any, args: any) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .first();

    if (!profile) throw new Error("Profile not found");
    if (args.amount <= 0) throw new Error("Invalid amount");
    if (profile.credits < args.amount) throw new Error("Insufficient credits");

    const next = profile.credits - args.amount;

    await ctx.db.patch(profile._id, {
      credits: next,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("creditLedger", {
      userId: args.userId,
      delta: -args.amount,
      reason: args.reason,
      metadata: args.metadata,
      createdAt: Date.now(),
    });

    return next;
  },
});

export const grantMonthlyCredits = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx: any, args: any) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .first();

    if (!profile) throw new Error("Profile not found");

    const now = new Date();
    const last = profile.lastResetDate ? new Date(profile.lastResetDate) : new Date(0);
    const shouldReset = now.getUTCFullYear() !== last.getUTCFullYear() || now.getUTCMonth() !== last.getUTCMonth();

    if (!shouldReset) return profile.credits;

    const isSkool = profile.tier === "skool";
    const monthlyCredits = isSkool ? CREDITS_SKOOL : CREDITS_PUBLIC;

    await ctx.db.patch(profile._id, {
      credits: monthlyCredits,
      lastResetDate: now.toISOString(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("creditLedger", {
      userId: args.userId,
      delta: monthlyCredits,
      reason: "monthly_reset",
      createdAt: Date.now(),
    });

    return monthlyCredits;
  },
});
