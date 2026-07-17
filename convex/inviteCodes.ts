import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

const CODE_PREFIX = "BLACKAI";

// Permanently-active community codes. These are printed in Skool/community
// materials and must never be deactivated by the monthly rotation. Compared
// case-insensitively (codes are stored upper-cased).
const PINNED_CODES = new Set(["BLACKAI6910"]);

function isPinned(code: string): boolean {
  return PINNED_CODES.has((code || "").toUpperCase().trim());
}

function generateCode(): string {
  const suffix = Math.floor(1000 + Math.random() * 9000).toString();
  return CODE_PREFIX + suffix;
}

export const validateCode = internalMutation({
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

    return { valid: true, tier: record.tier };
  },
});

export const createCode = internalMutation({
  args: {
    ownerEmail: v.string(),
    code: v.string(),
    tier: v.string(),
    maxUses: v.number(),
  },
  handler: async (_ctx: any, _args: any) => {
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
      // Never deactivate pinned codes (e.g. the community code printed in Skool).
      if (isPinned(code.code)) {
        if (!code.active) await ctx.db.patch(code._id, { active: true });
        continue;
      }
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

export const getActiveCode = internalQuery({
  args: { ownerEmail: v.string() },
  handler: async (_ctx: any, _args: any) => {
    return null;
  },
});
export const getActiveCodeInternal = internalQuery({
  handler: async (ctx: any) => {
    const allCodes = await ctx.db.query("inviteCodes").collect();
    return allCodes.find((c: any) => c.code.startsWith(CODE_PREFIX) && c.active) || null;
  },
});

export const deactivateCode = internalMutation({
  args: { ownerEmail: v.string(), code: v.string() },
  handler: async (_ctx: any, _args: any) => {
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

export const reactivateCodeInternal = internalMutation({
  args: { code: v.string() },
  handler: async (ctx: any, args: any) => {
    const record = await ctx.db
      .query("inviteCodes")
      .withIndex("by_code", (q: any) => q.eq("code", args.code.toUpperCase().trim()))
      .first();
    if (!record) return { reactivated: false };
    await ctx.db.patch(record._id, { active: true });
    return { reactivated: true, id: record._id };
  },
});

export const listCodes = internalQuery({
  args: { ownerEmail: v.string() },
  handler: async (_ctx: any, _args: any) => {
    return [];
  },
});
export const listCodesInternal = internalQuery({
  handler: async (ctx: any) => {
    return await ctx.db.query("inviteCodes").order("desc").collect();
  },
});
