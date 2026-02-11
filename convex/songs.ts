import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx: any, args: any) => {
    return await ctx.db
      .query("savedSongs")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .collect();
  },
});

export const saveSong = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    sunoPrompt: v.string(),
    lyrics: v.string(),
    albumArt: v.optional(v.string()),
    socialPack: v.optional(v.any()),
    songId: v.optional(v.id("savedSongs")),
  },
  handler: async (ctx: any, args: any) => {
    const now = Date.now();

    if (args.songId) {
      await ctx.db.patch(args.songId, {
        title: args.title,
        sunoPrompt: args.sunoPrompt,
        lyrics: args.lyrics,
        albumArt: args.albumArt,
        socialPack: args.socialPack,
        updatedAt: now,
      });
      return args.songId;
    }

    return await ctx.db.insert("savedSongs", {
      userId: args.userId,
      title: args.title,
      sunoPrompt: args.sunoPrompt,
      lyrics: args.lyrics,
      albumArt: args.albumArt,
      socialPack: args.socialPack,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const deleteSong = mutation({
  args: { songId: v.id("savedSongs") },
  handler: async (ctx: any, args: any) => {
    await ctx.db.delete(args.songId);
    return { ok: true };
  },
});
