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

export const upsertUserCredentials = mutation({
  args: {
    email: v.string(),
    passwordHash: v.optional(v.string()),
    passwordSalt: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const email = args.email.toLowerCase().trim();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", email))
      .first();

    if (!existing) {
      const nextDoc: any = {
        email,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isActive: true,
      };
      if (args.passwordHash && args.passwordSalt) {
        nextDoc.passwordHash = args.passwordHash;
        nextDoc.passwordSalt = args.passwordSalt;
      }

      const id = await ctx.db.insert("users", {
        ...nextDoc,
      });
      return await ctx.db.get(id);
    }

    const patch: any = {
      updatedAt: Date.now(),
      isActive: true,
    };
    if (args.passwordHash && args.passwordSalt) {
      patch.passwordHash = args.passwordHash;
      patch.passwordSalt = args.passwordSalt;
    }

    await ctx.db.patch(existing._id, patch);
    return await ctx.db.get(existing._id);
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
