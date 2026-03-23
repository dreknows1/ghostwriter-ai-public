import { internalQuery } from "./_generated/server";

/**
 * Aggregates KPIs from Convex tables for the live metrics dashboard.
 * Called by the /metrics HTTP route.
 *
 * Tables used: users, profiles, savedSongs, creditLedger, transactions
 */
export const getKpis = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    // ── Fetch all data ──────────────────────────────────────────
    const allUsers = await ctx.db.query("users").collect();
    const allProfiles = await ctx.db.query("profiles").collect();
    const allSongs = await ctx.db.query("savedSongs").collect();
    const allLedger = await ctx.db.query("creditLedger").collect();
    const allTransactions = await ctx.db.query("transactions").collect();

    // ── 1. DAU: distinct users who saved songs in last 24h ──
    // Plus users who spent credits (generated content) in last 24h
    const recentSongUsers = new Set(
      allSongs.filter((s) => s.createdAt > oneDayAgo).map((s) => String(s.userId))
    );
    const recentSpendUsers = new Set(
      allLedger
        .filter((l) => l.createdAt > oneDayAgo && l.delta < 0)
        .map((l) => String(l.userId))
    );
    const dauUsers = new Set([...recentSongUsers, ...recentSpendUsers]);
    const dau = dauUsers.size;

    // ── 2. Signups: users created in last 24h ──
    const signups = allUsers.filter((u) => u.createdAt > oneDayAgo).length;

    // ── 3. Conversion rate: users with completed transactions / total users ──
    const completedTxns = allTransactions.filter(
      (t) => t.status === "completed"
    );
    const payingUsers = new Set(completedTxns.map((t) => String(t.userId)));
    const conversionRate =
      allUsers.length > 0
        ? Math.round((payingUsers.size / allUsers.length) * 10000) / 100
        : 0;

    // ── 4. MRR: sum of transaction amounts in last 30 days ──
    const recentRevenue = allTransactions
      .filter((t) => t.createdAt > thirtyDaysAgo && t.status === "completed")
      .reduce((sum, t) => sum + t.amountCents, 0);
    const mrrUsd = Math.round(recentRevenue) / 100; // cents → dollars

    // ── 5. Retention 7d: overlap of active users between current and prior week ──
    const currentWeekActivity = allLedger.filter(
      (l) => l.createdAt > sevenDaysAgo && l.delta < 0
    );
    const priorWeekActivity = allLedger.filter(
      (l) => l.createdAt > fourteenDaysAgo && l.createdAt <= sevenDaysAgo && l.delta < 0
    );
    const currentWeekUsers = new Set(currentWeekActivity.map((l) => String(l.userId)));
    const priorWeekUsers = new Set(priorWeekActivity.map((l) => String(l.userId)));
    const retainedUsers = [...priorWeekUsers].filter((u) =>
      currentWeekUsers.has(u)
    );
    const retention7dPct =
      priorWeekUsers.size > 0
        ? Math.round((retainedUsers.length / priorWeekUsers.size) * 10000) / 100
        : 0;

    // ── 6 & 7. Uptime / Crash-free: default until error tracking added ──
    const uptimePct = 99.9;
    const crashFreePct = 99.9;

    // ── 8. P95 Latency: not tracked yet ──
    const p95LatencyMs = 0;

    // ── 9. Error rate: not tracked yet ──
    const errorRatePct = 0;

    // ── 10. AI Tokens: credits spent in last 24h (proxy for AI usage) ──
    const recentSpends = allLedger.filter(
      (l) => l.createdAt > oneDayAgo && l.delta < 0
    );
    const aiTokens = recentSpends.reduce((sum, l) => sum + Math.abs(l.delta), 0);

    // ── 11. AI Cost: estimate based on Gemini pricing ──
    // ~$0.05 per credit as rough Gemini cost estimate
    const aiCostUsd = Math.round(aiTokens * 0.05 * 100) / 100;

    return {
      dau,
      signups,
      conversionRate,
      mrrUsd,
      retention7dPct,
      uptimePct,
      crashFreePct,
      p95LatencyMs,
      errorRatePct,
      aiTokens,
      aiCostUsd,
    };
  },
});
