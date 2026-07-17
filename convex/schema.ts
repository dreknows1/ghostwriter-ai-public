import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    passwordHash: v.optional(v.string()),
    passwordSalt: v.optional(v.string()),
    // Sign in with Apple stable subject. Set on the first Apple sign-in and used
    // to resolve the account on repeats when Apple omits the email claim.
    appleSub: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    isActive: v.boolean(),
  })
    .index("by_email", ["email"])
    .index("by_apple_sub", ["appleSub"]),

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

  // RevenueCat webhook event ledger — mirrors stripeEvents for idempotency.
  rcEvents: defineTable({
    eventId: v.string(),
    type: v.string(),
    createdAt: v.number(),
  }).index("by_event", ["eventId"]),

  // Server-authoritative generation spend ledger (N1/B1). Each generation
  // carries a client-minted idempotency key; the /api/ai spend records it here
  // so a retried/dropped SSE stream or the stream→classic fallback (two POSTs,
  // one generation) charges exactly once. `status` flips to "refunded" when a
  // charged generation fails, releasing the key for a clean retry.
  spentKeys: defineTable({
    key: v.string(),
    userId: v.id("users"),
    amount: v.number(),
    status: v.string(), // "spent" | "refunded"
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }).index("by_key", ["key"]),

  // Single-use guard for OAuth/Apple session-mint tokens (docs/PLAN.md "Auth on
  // iOS", SECURITY FIX). Each signed token carries a random nonce; api/auth.ts
  // records it here on first use, so a replayed token is rejected even across
  // cold serverless instances (an in-process Map cannot). `exp` mirrors the
  // token's own expiry so rows can be swept after they can no longer be replayed.
  authNonces: defineTable({
    nonce: v.string(),
    exp: v.number(),
    createdAt: v.number(),
  }).index("by_nonce", ["nonce"]),

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

  blogAuthors: defineTable({
    email: v.string(),
    name: v.string(),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    twitter: v.optional(v.string()),
    website: v.optional(v.string()),
    canPublish: v.boolean(),
    isOwner: v.optional(v.boolean()),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  blogPosts: defineTable({
    slug: v.string(),
    title: v.string(),
    description: v.string(),
    bodyMarkdown: v.string(),
    headerImageUrl: v.string(),
    headerImageAlt: v.optional(v.string()),
    headerImagePhotographer: v.optional(v.string()),
    headerImagePhotographerUrl: v.optional(v.string()),
    tags: v.array(v.string()),
    authorEmail: v.string(),
    status: v.string(), // "draft" | "scheduled" | "published"
    publishedAt: v.optional(v.number()),
    scheduledFor: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_status_publishedAt", ["status", "publishedAt"])
    .index("by_author", ["authorEmail"]),
});
