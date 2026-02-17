import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

const CREDITS_PUBLIC = 25;
const CREDITS_SKOOL = 100;
const REFERRAL_INVITER_CREDITS = 40;
const REFERRAL_INVITEE_CREDITS = 20;

function normalizeEmail(email: string) {
  return email.toLowerCase().trim();
}

async function findSkoolMemberByEmail(ctx: any, emailRaw: string) {
  const email = normalizeEmail(emailRaw);
  const exact = await ctx.db
    .query("skoolMembers")
    .withIndex("by_email", (q: any) => q.eq("email", email))
    .first();
  if (exact) return exact;

  const allMembers = await ctx.db.query("skoolMembers").collect();
  return allMembers.find((member: any) => normalizeEmail(member.email || "") === email) || null;
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
    // Check if user is a Skool member by email whitelist
    const skoolMember = await findSkoolMemberByEmail(ctx, email);

    const isSkool = !!skoolMember;
    const tier = isSkool ? "skool" : "public";
    const credits = isSkool ? CREDITS_SKOOL : CREDITS_PUBLIC;

    const now = new Date().toISOString();
    const profileId = await ctx.db.insert("profiles", {
      userId: user._id,
      credits,
      lastResetDate: now,
      tier,
      updatedAt: Date.now(),
    });
    profile = await ctx.db.get(profileId);
  }
  if (profile) {
    const skoolMember = await findSkoolMemberByEmail(ctx, email);
    if (skoolMember && profile.tier !== "skool") {
      const upgradedCredits = Math.max(profile.credits || 0, CREDITS_SKOOL);
      await ctx.db.patch(profile._id, {
        tier: "skool",
        credits: upgradedCredits,
        updatedAt: Date.now(),
      });
      profile = await ctx.db.get(profile._id);
    }
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
      tier: profile.tier || "public",
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

export const setProfileTier = mutation({
  args: { email: v.string(), tier: v.string() },
  handler: async (ctx: any, args: any) => {
    const { profile } = await ensureUserAndProfile(ctx, args.email);
    const isSkool = args.tier === "skool";
    const credits = isSkool ? CREDITS_SKOOL : CREDITS_PUBLIC;

    await ctx.db.patch(profile._id, {
      tier: args.tier,
      credits: Math.max(profile.credits, credits),
      updatedAt: Date.now(),
    });

    return { tier: args.tier, credits: Math.max(profile.credits, credits) };
  },
});

export const isSkoolMemberByEmail = query({
  args: { email: v.string() },
  handler: async (ctx: any, args: any) => {
    const email = normalizeEmail(args.email);
    const skoolMember = await findSkoolMemberByEmail(ctx, email);
    return Boolean(skoolMember);
  },
});

export const enforceSkoolTiersFromMembers = internalMutation({
  args: {
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx: any, args: any) => {
    const dryRun = args.dryRun !== false;
    const summary = {
      dryRun,
      membersSeen: 0,
      usersMatched: 0,
      profilesUpgraded: 0,
      creditsRaised: 0,
      missingUsers: 0,
    };

    const members = await ctx.db.query("skoolMembers").collect();
    summary.membersSeen = members.length;

    for (const member of members) {
      const email = normalizeEmail(member.email || "");
      if (!email) continue;

      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q: any) => q.eq("email", email))
        .first();
      if (!user) {
        summary.missingUsers += 1;
        continue;
      }
      summary.usersMatched += 1;

      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_user", (q: any) => q.eq("userId", user._id))
        .first();
      if (!profile) continue;

      const targetCredits = Math.max(profile.credits || 0, CREDITS_SKOOL);
      const needsTier = profile.tier !== "skool";
      const needsCredits = targetCredits !== profile.credits;
      if (!needsTier && !needsCredits) continue;

      if (!dryRun) {
        await ctx.db.patch(profile._id, {
          tier: "skool",
          credits: targetCredits,
          updatedAt: Date.now(),
        });
      }

      summary.profilesUpgraded += 1;
      summary.creditsRaised += Math.max(0, targetCredits - (profile.credits || 0));
    }

    return summary;
  },
});

export const upsertSkoolMembers = internalMutation({
  args: {
    dryRun: v.optional(v.boolean()),
    rows: v.array(
      v.object({
        email: v.string(),
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        joinedDate: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx: any, args: any) => {
    const dryRun = args.dryRun !== false;
    const summary = {
      dryRun,
      rowsSeen: 0,
      inserted: 0,
      updated: 0,
      skippedNoEmail: 0,
    };

    for (const row of args.rows || []) {
      summary.rowsSeen += 1;
      const email = normalizeEmail(row.email || "");
      if (!email) {
        summary.skippedNoEmail += 1;
        continue;
      }

      const existing = await findSkoolMemberByEmail(ctx, email);
      if (existing) {
        if (!dryRun) {
          await ctx.db.patch(existing._id, {
            email,
            firstName: row.firstName || existing.firstName,
            lastName: row.lastName || existing.lastName,
            joinedDate: row.joinedDate || existing.joinedDate,
          });
        }
        summary.updated += 1;
      } else {
        if (!dryRun) {
          await ctx.db.insert("skoolMembers", {
            email,
            firstName: row.firstName,
            lastName: row.lastName,
            joinedDate: row.joinedDate,
          });
        }
        summary.inserted += 1;
      }
    }

    return summary;
  },
});

export const getCreditsByEmail = mutation({
  args: { email: v.string() },
  handler: async (ctx: any, args: any) => {
    const { profile } = await ensureUserAndProfile(ctx, args.email);
    const now = Date.now();
    const lastReset = profile.lastResetDate ? new Date(profile.lastResetDate).getTime() : 0;
    if (monthKey(now) !== monthKey(lastReset)) {
      const isSkool = profile.tier === "skool";
      const monthlyCredits = isSkool ? CREDITS_SKOOL : CREDITS_PUBLIC;

      await ctx.db.patch(profile._id, {
        credits: monthlyCredits,
        lastResetDate: new Date(now).toISOString(),
        updatedAt: now,
      });
      await ctx.db.insert("creditLedger", {
        userId: profile.userId,
        delta: monthlyCredits,
        reason: "monthly_reset",
        createdAt: now,
      });
      return monthlyCredits;
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

export const relinkSongsByEmailAliases = internalMutation({
  args: {
    dryRun: v.optional(v.boolean()),
    mappings: v.array(
      v.object({
        primaryEmail: v.string(),
        aliasEmails: v.array(v.string()),
      })
    ),
  },
  handler: async (ctx: any, args: any) => {
    const dryRun = args.dryRun !== false;
    const summary = {
      dryRun,
      mappingsProcessed: 0,
      primaryUsersResolved: 0,
      aliasUsersResolved: 0,
      songsRelinked: 0,
      aliasesNotFound: 0,
      details: [] as Array<{
        primaryEmail: string;
        movedSongs: number;
        aliasesFound: number;
        aliasesNotFound: string[];
      }>,
    };

    for (const item of args.mappings || []) {
      const primaryEmail = normalizeEmail(item.primaryEmail || "");
      if (!primaryEmail) continue;
      summary.mappingsProcessed += 1;

      const { user: primaryUser } = await ensureUserAndProfile(ctx, primaryEmail);
      summary.primaryUsersResolved += 1;

      const aliasSet = new Set<string>();
      for (const raw of item.aliasEmails || []) {
        const email = normalizeEmail(raw || "");
        if (email) aliasSet.add(email);
      }
      aliasSet.delete(primaryEmail);

      let movedForPrimary = 0;
      let aliasesFound = 0;
      const aliasesNotFound: string[] = [];

      for (const aliasEmail of aliasSet) {
        const aliasUser = await ctx.db
          .query("users")
          .withIndex("by_email", (q: any) => q.eq("email", aliasEmail))
          .first();

        if (!aliasUser) {
          summary.aliasesNotFound += 1;
          aliasesNotFound.push(aliasEmail);
          continue;
        }

        aliasesFound += 1;
        summary.aliasUsersResolved += 1;
        if (String(aliasUser._id) === String(primaryUser._id)) continue;

        const songs = await ctx.db
          .query("savedSongs")
          .withIndex("by_user", (q: any) => q.eq("userId", aliasUser._id))
          .collect();

        if (!dryRun) {
          const now = Date.now();
          for (const song of songs) {
            await ctx.db.patch(song._id, {
              userId: primaryUser._id,
              updatedAt: now,
            });
          }
        }

        movedForPrimary += songs.length;
        summary.songsRelinked += songs.length;
      }

      summary.details.push({
        primaryEmail,
        movedSongs: movedForPrimary,
        aliasesFound,
        aliasesNotFound,
      });
    }

    return summary;
  },
});

export const backfillSupabaseData = internalMutation({
  args: {
    dryRun: v.optional(v.boolean()),
    songs: v.optional(
      v.array(
        v.object({
          email: v.string(),
          title: v.string(),
          sunoPrompt: v.string(),
          lyrics: v.string(),
          albumArt: v.optional(v.string()),
          socialPack: v.optional(v.any()),
          createdAt: v.optional(v.number()),
          updatedAt: v.optional(v.number()),
        })
      )
    ),
    transactions: v.optional(
      v.array(
        v.object({
          email: v.string(),
          stripeSessionId: v.string(),
          item: v.string(),
          amountCents: v.number(),
          creditsGranted: v.number(),
          status: v.optional(v.string()),
          createdAt: v.optional(v.number()),
        })
      )
    ),
    applyCreditAdjustments: v.optional(v.boolean()),
  },
  handler: async (ctx: any, args: any) => {
    const dryRun = args.dryRun !== false;
    const applyCreditAdjustments = args.applyCreditAdjustments !== false;
    const songs = Array.isArray(args.songs) ? args.songs : [];
    const transactions = Array.isArray(args.transactions) ? args.transactions : [];

    const summary = {
      dryRun,
      songsSeen: songs.length,
      songsInserted: 0,
      songsSkippedDuplicate: 0,
      songsMissingEmail: 0,
      transactionsSeen: transactions.length,
      transactionsInserted: 0,
      transactionsSkippedDuplicate: 0,
      creditsAdjustedUsers: 0,
      creditsTotalDelta: 0,
      usersTouched: 0,
      warnings: [] as string[],
    };

    const touchedUsers = new Set<string>();
    const creditDeltaByEmail = new Map<string, number>();

    for (const row of songs) {
      const email = normalizeEmail(row.email || "");
      if (!email) {
        summary.songsMissingEmail += 1;
        continue;
      }

      const { user } = await ensureUserAndProfile(ctx, email);
      touchedUsers.add(String(user._id));
      const createdAt = row.createdAt || Date.now();
      const updatedAt = row.updatedAt || createdAt;

      const existingSongs = await ctx.db
        .query("savedSongs")
        .withIndex("by_user", (q: any) => q.eq("userId", user._id))
        .collect();

      const duplicate = existingSongs.find((s: any) => {
        if (s.title !== row.title) return false;
        if (s.sunoPrompt !== row.sunoPrompt) return false;
        if (s.lyrics !== row.lyrics) return false;
        return true;
      });

      if (duplicate) {
        summary.songsSkippedDuplicate += 1;
        continue;
      }

      if (!dryRun) {
        await ctx.db.insert("savedSongs", {
          userId: user._id,
          title: row.title,
          sunoPrompt: row.sunoPrompt,
          lyrics: row.lyrics,
          albumArt: row.albumArt,
          socialPack: row.socialPack,
          createdAt,
          updatedAt,
        });
      }
      summary.songsInserted += 1;
    }

    for (const tx of transactions) {
      const email = normalizeEmail(tx.email || "");
      if (!email) {
        summary.warnings.push(`Transaction missing email for session ${tx.stripeSessionId}`);
        continue;
      }
      if (!tx.stripeSessionId) {
        summary.warnings.push(`Transaction missing stripeSessionId for ${email}`);
        continue;
      }

      const { user } = await ensureUserAndProfile(ctx, email);
      touchedUsers.add(String(user._id));

      const existing = await ctx.db
        .query("transactions")
        .withIndex("by_session", (q: any) => q.eq("stripeSessionId", tx.stripeSessionId))
        .first();

      if (existing) {
        summary.transactionsSkippedDuplicate += 1;
        continue;
      }

      if (!dryRun) {
        await ctx.db.insert("transactions", {
          userId: user._id,
          stripeSessionId: tx.stripeSessionId,
          item: tx.item || "Legacy Purchase",
          amountCents: tx.amountCents || 0,
          creditsGranted: tx.creditsGranted || 0,
          status: tx.status || "completed",
          createdAt: tx.createdAt || Date.now(),
        });
      }
      summary.transactionsInserted += 1;

      const shouldAdjust = (tx.status || "completed") === "completed" && applyCreditAdjustments && (tx.creditsGranted || 0) > 0;
      if (shouldAdjust) {
        creditDeltaByEmail.set(email, (creditDeltaByEmail.get(email) || 0) + (tx.creditsGranted || 0));
      }
    }

    for (const [email, delta] of creditDeltaByEmail.entries()) {
      if (delta <= 0) continue;
      const { profile } = await ensureUserAndProfile(ctx, email);
      if (!profile) {
        summary.warnings.push(`Missing profile for ${email} while applying credit delta ${delta}`);
        continue;
      }

      if (!dryRun) {
        await ctx.db.patch(profile._id, {
          credits: profile.credits + delta,
          updatedAt: Date.now(),
        });
        await ctx.db.insert("creditLedger", {
          userId: profile.userId,
          delta,
          reason: "legacy_migration_backfill",
          metadata: { source: "supabase", type: "transactions_backfill" },
          createdAt: Date.now(),
        });
      }
      summary.creditsAdjustedUsers += 1;
      summary.creditsTotalDelta += delta;
    }

    summary.usersTouched = touchedUsers.size;
    return summary;
  },
});
