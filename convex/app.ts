import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const FREE_MONTHLY_CREDITS = 30;
const REFERRAL_INVITER_CREDITS = 40;
const REFERRAL_INVITEE_CREDITS = 20;

function normalizeEmail(email: string) {
  return email.toLowerCase().trim();
}

async function ensureUserAndProfile(ctx: any, emailRaw: string) {
  const email = normalizeEmail(emailRaw);
  let user = await ctx.db
    .query("users")
    .withIndex("by_email", (q: any) => q.eq("email", email))
    .first();

  if (!user) {
    const userId = await ctx.db.insert("users", {
      email,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isActive: true,
    });
    user = await ctx.db.get(userId);
  }
  if (!user) throw new Error("User not found");

  let profile = await ctx.db
    .query("profiles")
    .withIndex("by_user", (q: any) => q.eq("userId", user._id))
    .first();

  if (!profile) {
    const now = new Date().toISOString();
    const profileId = await ctx.db.insert("profiles", {
      userId: user._id,
      credits: FREE_MONTHLY_CREDITS,
      lastResetDate: now,
      updatedAt: Date.now(),
    });
    profile = await ctx.db.get(profileId);
  }
  if (!profile) throw new Error("Profile not found");

  return { user, profile, email };
}

function monthKey(ts: number) {
  const d = new Date(ts);
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`;
}

async function qualifyAndRewardReferral(ctx: any, referredUserId: any) {
  const referral = await ctx.db
    .query("referrals")
    .withIndex("by_referred", (q: any) => q.eq("referredUserId", referredUserId))
    .first();
  if (!referral || referral.status === "rewarded") return;

  const referrerProfile = await ctx.db
    .query("profiles")
    .withIndex("by_user", (q: any) => q.eq("userId", referral.referrerUserId))
    .first();
  const referredProfile = await ctx.db
    .query("profiles")
    .withIndex("by_user", (q: any) => q.eq("userId", referredUserId))
    .first();
  if (!referrerProfile || !referredProfile) return;

  await ctx.db.patch(referrerProfile._id, {
    credits: referrerProfile.credits + REFERRAL_INVITER_CREDITS,
    updatedAt: Date.now(),
  });
  await ctx.db.patch(referredProfile._id, {
    credits: referredProfile.credits + REFERRAL_INVITEE_CREDITS,
    updatedAt: Date.now(),
  });

  await ctx.db.insert("creditLedger", {
    userId: referral.referrerUserId,
    delta: REFERRAL_INVITER_CREDITS,
    reason: "referral_inviter_reward",
    metadata: { referralId: referral._id },
    createdAt: Date.now(),
  });
  await ctx.db.insert("creditLedger", {
    userId: referredUserId,
    delta: REFERRAL_INVITEE_CREDITS,
    reason: "referral_invitee_reward",
    metadata: { referralId: referral._id },
    createdAt: Date.now(),
  });

  await ctx.db.patch(referral._id, {
    status: "rewarded",
    qualifiedAt: Date.now(),
    rewardedAt: Date.now(),
  });
}

export const getUserProfileByEmail = query({
  args: { email: v.string() },
  handler: async (ctx: any, args: any) => {
    const { user, profile, email } = await ensureUserAndProfile(ctx, args.email);
    return {
      id: user._id,
      user_email: email,
      credits: profile.credits,
      display_name: profile.displayName,
      avatar_url: profile.avatarUrl,
      bio: profile.bio,
      preferred_vibe: profile.preferredVibe,
      preferred_art_style: profile.preferredArtStyle,
      last_reset_date: profile.lastResetDate,
    };
  },
});

export const upsertUserProfileByEmail = mutation({
  args: {
    email: v.string(),
    display_name: v.optional(v.string()),
    avatar_url: v.optional(v.string()),
    bio: v.optional(v.string()),
    preferred_vibe: v.optional(v.string()),
    preferred_art_style: v.optional(v.string()),
    credits: v.optional(v.number()),
    last_reset_date: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const { user, profile, email } = await ensureUserAndProfile(ctx, args.email);
    await ctx.db.patch(profile._id, {
      displayName: args.display_name ?? profile.displayName,
      avatarUrl: args.avatar_url ?? profile.avatarUrl,
      bio: args.bio ?? profile.bio,
      preferredVibe: args.preferred_vibe ?? profile.preferredVibe,
      preferredArtStyle: args.preferred_art_style ?? profile.preferredArtStyle,
      credits: args.credits ?? profile.credits,
      lastResetDate: args.last_reset_date ?? profile.lastResetDate,
      updatedAt: Date.now(),
    });
    return {
      id: user._id,
      email,
      credits: args.credits ?? profile.credits,
    };
  },
});

export const getCreditsByEmail = mutation({
  args: { email: v.string() },
  handler: async (ctx: any, args: any) => {
    const { profile } = await ensureUserAndProfile(ctx, args.email);
    const now = Date.now();
    const lastReset = profile.lastResetDate ? new Date(profile.lastResetDate).getTime() : 0;
    if (monthKey(now) !== monthKey(lastReset)) {
      await ctx.db.patch(profile._id, {
        credits: FREE_MONTHLY_CREDITS,
        lastResetDate: new Date(now).toISOString(),
        updatedAt: now,
      });
      await ctx.db.insert("creditLedger", {
        userId: profile.userId,
        delta: FREE_MONTHLY_CREDITS,
        reason: "monthly_reset",
        createdAt: now,
      });
      return FREE_MONTHLY_CREDITS;
    }
    return profile.credits;
  },
});

export const spendCreditsByEmail = mutation({
  args: { email: v.string(), amount: v.number(), reason: v.string() },
  handler: async (ctx: any, args: any) => {
    const { profile } = await ensureUserAndProfile(ctx, args.email);
    const next = Math.max(0, profile.credits - args.amount);
    await ctx.db.patch(profile._id, { credits: next, updatedAt: Date.now() });
    await ctx.db.insert("creditLedger", {
      userId: profile.userId,
      delta: -args.amount,
      reason: args.reason,
      createdAt: Date.now(),
    });
    return next;
  },
});

export const getSongsByEmail = query({
  args: { email: v.string() },
  handler: async (ctx: any, args: any) => {
    const { user, email } = await ensureUserAndProfile(ctx, args.email);
    const rows = await ctx.db
      .query("savedSongs")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();
    return rows
      .sort((a: any, b: any) => b.createdAt - a.createdAt)
      .map((s: any) => ({
        id: s._id,
        user_email: email,
        title: s.title,
        suno_prompt: s.sunoPrompt,
        lyrics: s.lyrics,
        album_art: s.albumArt,
        social_pack: s.socialPack,
        created_at: new Date(s.createdAt).toISOString(),
      }));
  },
});

export const getSongCountByEmail = query({
  args: { email: v.string() },
  handler: async (ctx: any, args: any) => {
    const { user } = await ensureUserAndProfile(ctx, args.email);
    const rows = await ctx.db
      .query("savedSongs")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();
    return rows.length;
  },
});

export const saveSongByEmail = mutation({
  args: {
    email: v.string(),
    title: v.string(),
    sunoPrompt: v.string(),
    lyrics: v.string(),
    albumArt: v.optional(v.string()),
    socialPack: v.optional(v.any()),
    existingId: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const { user, email } = await ensureUserAndProfile(ctx, args.email);
    const now = Date.now();

    if (args.existingId) {
      await ctx.db.patch(args.existingId as any, {
        title: args.title,
        sunoPrompt: args.sunoPrompt,
        lyrics: args.lyrics,
        albumArt: args.albumArt,
        socialPack: args.socialPack,
        updatedAt: now,
      });
      await qualifyAndRewardReferral(ctx, user._id);
      return { id: args.existingId, user_email: email };
    }

    const id = await ctx.db.insert("savedSongs", {
      userId: user._id,
      title: args.title,
      sunoPrompt: args.sunoPrompt,
      lyrics: args.lyrics,
      albumArt: args.albumArt,
      socialPack: args.socialPack,
      createdAt: now,
      updatedAt: now,
    });
    await qualifyAndRewardReferral(ctx, user._id);
    return { id, user_email: email };
  },
});

export const deleteSongById = mutation({
  args: { songId: v.string() },
  handler: async (ctx: any, args: any) => {
    await ctx.db.delete(args.songId as any);
    return { ok: true };
  },
});

export const deleteAllSongsByEmail = mutation({
  args: { email: v.string() },
  handler: async (ctx: any, args: any) => {
    const { user } = await ensureUserAndProfile(ctx, args.email);
    const rows = await ctx.db
      .query("savedSongs")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();
    for (const row of rows) await ctx.db.delete(row._id);
    return { ok: true };
  },
});

export const getTransactionsByEmail = query({
  args: { email: v.string() },
  handler: async (ctx: any, args: any) => {
    const { user } = await ensureUserAndProfile(ctx, args.email);
    const rows = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();
    return rows
      .sort((a: any, b: any) => b.createdAt - a.createdAt)
      .map((t: any) => ({
        id: t._id,
        date: new Date(t.createdAt).toISOString(),
        item: t.item,
        amount: t.amountCents / 100,
        credits: t.creditsGranted,
        status: t.status,
      }));
  },
});

export const deleteAccountByEmail = mutation({
  args: { email: v.string() },
  handler: async (ctx: any, args: any) => {
    const email = normalizeEmail(args.email);
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", email))
      .first();
    if (!user) return { ok: true };

    const songs = await ctx.db.query("savedSongs").withIndex("by_user", (q: any) => q.eq("userId", user._id)).collect();
    for (const s of songs) await ctx.db.delete(s._id);
    const profile = await ctx.db.query("profiles").withIndex("by_user", (q: any) => q.eq("userId", user._id)).first();
    if (profile) await ctx.db.delete(profile._id);
    const txs = await ctx.db.query("transactions").withIndex("by_user", (q: any) => q.eq("userId", user._id)).collect();
    for (const t of txs) await ctx.db.delete(t._id);
    const ledger = await ctx.db.query("creditLedger").withIndex("by_user", (q: any) => q.eq("userId", user._id)).collect();
    for (const l of ledger) await ctx.db.delete(l._id);
    const code = await ctx.db.query("referralCodes").withIndex("by_user", (q: any) => q.eq("userId", user._id)).first();
    if (code) await ctx.db.delete(code._id);
    await ctx.db.delete(user._id);
    return { ok: true };
  },
});

export const getOrCreateReferralCodeByEmail = mutation({
  args: { email: v.string() },
  handler: async (ctx: any, args: any) => {
    const { user } = await ensureUserAndProfile(ctx, args.email);
    const existing = await ctx.db
      .query("referralCodes")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .first();
    if (existing) return { code: existing.code };

    const code = user._id.slice(-6).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
    await ctx.db.insert("referralCodes", {
      userId: user._id,
      code,
      isActive: true,
      createdAt: Date.now(),
    });
    return { code };
  },
});

export const claimReferralCodeByEmail = mutation({
  args: { email: v.string(), code: v.string() },
  handler: async (ctx: any, args: any) => {
    const { user } = await ensureUserAndProfile(ctx, args.email);
    const found = await ctx.db
      .query("referralCodes")
      .withIndex("by_code", (q: any) => q.eq("code", args.code.trim().toUpperCase()))
      .first();
    if (!found) throw new Error("Invalid referral code");
    if (String(found.userId) === String(user._id)) throw new Error("Cannot use your own code");

    const existing = await ctx.db
      .query("referrals")
      .withIndex("by_referred", (q: any) => q.eq("referredUserId", user._id))
      .first();
    if (existing) return { status: existing.status };

    await ctx.db.insert("referrals", {
      referrerUserId: found.userId,
      referredUserId: user._id,
      code: args.code.trim().toUpperCase(),
      status: "pending",
      createdAt: Date.now(),
    });
    return { status: "pending" };
  },
});

export const getReferralSummaryByEmail = query({
  args: { email: v.string() },
  handler: async (ctx: any, args: any) => {
    const { user } = await ensureUserAndProfile(ctx, args.email);
    const code = await ctx.db.query("referralCodes").withIndex("by_user", (q: any) => q.eq("userId", user._id)).first();
    const invited = await ctx.db.query("referrals").withIndex("by_referrer", (q: any) => q.eq("referrerUserId", user._id)).collect();
    const earned = invited.filter((r: any) => r.status === "rewarded").length * REFERRAL_INVITER_CREDITS;
    return {
      code: code?.code || null,
      invitedCount: invited.length,
      rewardedCount: invited.filter((r: any) => r.status === "rewarded").length,
      earnedCredits: earned,
    };
  },
});
