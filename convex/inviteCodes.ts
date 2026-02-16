import { query, mutation, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

const CODE_PREFIX = "BLACKAI";
const OWNER_EMAIL = "andre7171973@gmail.com";

function generateCode(): string {
  const suffix = Math.floor(1000 + Math.random() * 9000).toString();
  return CODE_PREFIX + suffix;
}

export const validateCode = mutation({
  args: { code: v.string() },
  handler: async (ctx: any, { code }: any) => {
    const record = await ctx.db
      .query("inviteCodes")
      .withIndex("by_code", (q: any) => q.eq("code", code.toUpperCase().trim()))
      .first();

    if (!record) return { valid: false, tier: null };
    if (!record.active) return { valid: false, tier: null };
    if (record.maxUses > 0 && record.currentUses >= record.maxUses) {
      return { valid: false, tier: null };
    }

    await ctx.db.patch(record._id, { currentUses: record.currentUses + 1 });

    return { valid: true, tier: record.tier };
  },
});

export const createCode = mutation({
  args: {
    ownerEmail: v.string(),
    code: v.string(),
    tier: v.string(),
    maxUses: v.number(),
  },
  handler: async (ctx: any, args: any) => {
    throw new Error("Unauthorized. Use internal mutation inviteCodes:createCodeInternal.");
  },
});
export const createCodeInternal = internalMutation({
  args: {
    code: v.string(),
    tier: v.string(),
    maxUses: v.number(),
  },
  handler: async (ctx: any, args: any) => {
    return await ctx.db.insert("inviteCodes", {
      code: args.code.toUpperCase().trim(),
      tier: args.tier,
      maxUses: args.maxUses,
      currentUses: 0,
      active: true,
      createdAt: Date.now(),
    });
  },
});

export const rotateSkoolCode = internalMutation({
  handler: async (ctx: any) => {
    const allCodes = await ctx.db.query("inviteCodes").collect();
    for (const code of allCodes) {
      if (code.code.startsWith(CODE_PREFIX) && code.active) {
        await ctx.db.patch(code._id, { active: false });
      }
    }

    const newCode = generateCode();
    await ctx.db.insert("inviteCodes", {
      code: newCode,
      tier: "skool",
      maxUses: 0,
      currentUses: 0,
      active: true,
      createdAt: Date.now(),
    });

    return { newCode };
  },
});

export const getActiveCode = query({
  args: { ownerEmail: v.string() },
  handler: async (ctx: any, args: any) => {
    return null;
  },
});
export const getActiveCodeInternal = internalQuery({
  handler: async (ctx: any) => {
    const allCodes = await ctx.db.query("inviteCodes").collect();
    return allCodes.find((c: any) => c.code.startsWith(CODE_PREFIX) && c.active) || null;
  },
});

export const deactivateCode = mutation({
  args: { ownerEmail: v.string(), code: v.string() },
  handler: async (ctx: any, args: any) => {
    throw new Error("Unauthorized. Use internal mutation inviteCodes:deactivateCodeInternal.");
  },
});
export const deactivateCodeInternal = internalMutation({
  args: { code: v.string() },
  handler: async (ctx: any, args: any) => {
    const record = await ctx.db
      .query("inviteCodes")
      .withIndex("by_code", (q: any) => q.eq("code", args.code.toUpperCase().trim()))
      .first();
    if (record) {
      await ctx.db.patch(record._id, { active: false });
    }
  },
});

export const listCodes = query({
  args: { ownerEmail: v.string() },
  handler: async (ctx: any, args: any) => {
    return [];
  },
});
export const listCodesInternal = internalQuery({
  handler: async (ctx: any) => {
    return await ctx.db.query("inviteCodes").order("desc").collect();
  },
});
