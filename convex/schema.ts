import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    passwordHash: v.optional(v.string()),
    passwordSalt: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    isActive: v.boolean(),
  }).index("by_email", ["email"]),

  profiles: defineTable({
    userId: v.id("users"),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
    preferredVibe: v.optional(v.string()),
    preferredArtStyle: v.optional(v.string()),
    credits: v.number(),
    lastResetDate: v.optional(v.string()),
    tier: v.optional(v.string()), // "public" | "skool"
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  savedSongs: defineTable({
    userId: v.id("users"),
    title: v.string(),
    sunoPrompt: v.string(),
    lyrics: v.string(),
    albumArt: v.optional(v.string()),
    socialPack: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  creditLedger: defineTable({
    userId: v.id("users"),
    delta: v.number(),
    reason: v.string(),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  transactions: defineTable({
    userId: v.id("users"),
    stripeSessionId: v.string(),
    item: v.string(),
    amountCents: v.number(),
    creditsGranted: v.number(),
    status: v.string(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]).index("by_session", ["stripeSessionId"]),

  stripeEvents: defineTable({
    eventId: v.string(),
    type: v.string(),
    createdAt: v.number(),
  }).index("by_event", ["eventId"]),

  referralCodes: defineTable({
    userId: v.id("users"),
    code: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
  }).index("by_code", ["code"]).index("by_user", ["userId"]),

  referrals: defineTable({
    referrerUserId: v.id("users"),
    referredUserId: v.id("users"),
    code: v.string(),
    status: v.string(),
    qualifiedAt: v.optional(v.number()),
    rewardedAt: v.optional(v.number()),
    rejectionReason: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_referred", ["referredUserId"])
    .index("by_referrer", ["referrerUserId"])
    .index("by_referrer_referred", ["referrerUserId", "referredUserId"]),

  skoolMembers: defineTable({
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    joinedDate: v.optional(v.string()),
  }).index("by_email", ["email"]),

  inviteCodes: defineTable({
    code: v.string(),
    tier: v.string(),
    maxUses: v.number(),
    currentUses: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
  }).index("by_code", ["code"]),
});
