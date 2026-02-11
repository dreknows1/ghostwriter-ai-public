import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    createdAt: v.number(),
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
});
