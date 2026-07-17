import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Single-use guard for the OAuth session-mint token (SECURITY FIX). The signed
 * token minted by api/oauth/callback.ts carries a random nonce; api/auth.ts calls
 * `consume` before minting a session.
 *
 * Convex mutations are transactional, so the read-then-insert below is atomic:
 * the FIRST presentation of a nonce inserts a row and returns `firstUse: true`;
 * any later presentation finds the row and returns `firstUse: false` (a replay).
 * This is authoritative across cold serverless instances, which an in-process
 * Map cannot be — that is the whole point of backing it in Convex.
 */
export const consume = internalMutation({
  args: { nonce: v.string(), exp: v.number() },
  handler: async (ctx: any, args: any) => {
    const existing = await ctx.db
      .query("authNonces")
      .withIndex("by_nonce", (q: any) => q.eq("nonce", args.nonce))
      .first();

    if (existing) return { firstUse: false };

    await ctx.db.insert("authNonces", {
      nonce: args.nonce,
      exp: args.exp,
      createdAt: Date.now(),
    });
    return { firstUse: true };
  },
});

/**
 * Housekeeping: delete nonce rows whose token has already expired (and therefore
 * can no longer be replayed). Safe to call from a cron or manually; not required
 * for correctness. Deletes in bounded batches to stay within mutation limits.
 */
export const cleanupExpired = internalMutation({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx: any, args: any) => {
    const now = Date.now();
    const limit = Math.min(args.limit ?? 200, 500);
    const rows = await ctx.db.query("authNonces").take(limit);
    let deleted = 0;
    for (const row of rows) {
      if (row.exp <= now) {
        await ctx.db.delete(row._id);
        deleted += 1;
      }
    }
    return { deleted };
  },
});
