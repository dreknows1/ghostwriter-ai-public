import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const CREDITS_PUBLIC = 25;
const CREDITS_SKOOL = 100;

export const getByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx: any, args: any) => {
    return await ctx.db
      .query("profiles")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .first();
  },
});

export const upsertByUser = mutation({
  args: {
    userId: v.id("users"),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
    preferredVibe: v.optional(v.string()),
    preferredArtStyle: v.optional(v.string()),
    credits: v.optional(v.number()),
    lastResetDate: v.optional(v.string()),
    tier: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .first();

    const payload = {
      userId: args.userId,
      displayName: args.displayName,
      avatarUrl: args.avatarUrl,
      bio: args.bio,
      preferredVibe: args.preferredVibe,
      preferredArtStyle: args.preferredArtStyle,
      credits: args.credits ?? existing?.credits ?? CREDITS_PUBLIC,
      lastResetDate: args.lastResetDate ?? existing?.lastResetDate ?? new Date().toISOString(),
      tier: args.tier ?? existing?.tier ?? "public",
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return await ctx.db.get(existing._id);
    }

    const id = await ctx.db.insert("profiles", payload);
    return await ctx.db.get(id);
  },
});
