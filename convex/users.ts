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

    // H1 (defense in depth): NEVER attach or overwrite a password on an existing
    // user here. A password may only be set at net-new creation (the branch
    // above). Attaching one to an existing (passwordless) account was an
    // account-takeover vector. Passwordless refresh (oauth/apple/skool sign-in)
    // still updates the activity timestamp.
    const patch: any = {
      updatedAt: Date.now(),
      isActive: true,
    };

    await ctx.db.patch(existing._id, patch);
    return await ctx.db.get(existing._id);
  },
});

/**
 * Resolve (or create) the account for a Sign in with Apple `sub` (H2).
 *  1. If a user already carries this `sub`, return it — identity is pinned to the
 *     stable Apple subject, so a repeat sign-in with NO email claim still works
 *     and a mismatched email claim cannot hijack it.
 *  2. Else, if Apple provided an email (first sign-in), link `sub` onto the
 *     existing email account or create a new one.
 *  3. Else (unknown sub, no email) return null — the caller rejects with a clear
 *     error. A client-supplied email is never consulted.
 */
export const upsertAppleUser = mutation({
  args: {
    sub: v.string(),
    email: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const sub = String(args.sub || "").trim();
    if (!sub) return null;

    const bySub = await ctx.db
      .query("users")
      .withIndex("by_apple_sub", (q: any) => q.eq("appleSub", sub))
      .first();
    if (bySub) {
      await ctx.db.patch(bySub._id, { updatedAt: Date.now(), isActive: true });
      return await ctx.db.get(bySub._id);
    }

    const email = String(args.email || "").toLowerCase().trim();
    if (!email) return null;

    const byEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", email))
      .first();
    if (byEmail) {
      await ctx.db.patch(byEmail._id, { appleSub: sub, updatedAt: Date.now(), isActive: true });
      return await ctx.db.get(byEmail._id);
    }

    const id = await ctx.db.insert("users", {
      email,
      appleSub: sub,
      createdAt: Date.now(),
      updatedAt: Date.now(),
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
