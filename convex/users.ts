import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getOrCreateUser = mutation({
  args: { email: v.string() },
  handler: async (ctx: any, args: any) => {
    const email = args.email.toLowerCase().trim();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", email))
      .first();

    if (existing) return existing;

    const id = await ctx.db.insert("users", {
      email,
      createdAt: Date.now(),
      isActive: true,
    });

    return await ctx.db.get(id);
  },
});

export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx: any, args: any) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", args.email.toLowerCase().trim()))
      .first();
  },
});
