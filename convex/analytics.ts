import { internalQuery } from "./_generated/server";

export const getAnalytics = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const allUsers = await ctx.db.query("users").collect();
    const allProfiles = await ctx.db.query("profiles").collect();
    const allLedger = await ctx.db.query("creditLedger").collect();
    const allTransactions = await ctx.db.query("transactions").collect();

    // Build lookup maps
    const userEmailMap = new Map<string, string>();
    for (const u of allUsers) {
      userEmailMap.set(u._id as string, u.email);
    }
    const profileByUserId = new Map<string, { tier: string }>();
    for (const p of allProfiles) {
      profileByUserId.set(p.userId as string, { tier: p.tier || "public" });
    }

    // ── Recent Signups (7d) ──
    const recentSignups = allUsers
      .filter((u) => u.createdAt > sevenDaysAgo)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 50)
      .map((u) => ({
        email: u.email,
        tier: profileByUserId.get(u._id as string)?.tier || "public",
        timestamp: new Date(u.createdAt).toISOString(),
      }));

    // ── Recent Activity (24h) — credit spends ──
    const recentActivity = allLedger
      .filter((l) => l.createdAt > oneDayAgo && l.delta < 0)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 100)
      .map((l) => ({
        email: userEmailMap.get(l.userId as string) || "unknown",
        action: l.reason,
        detail: l.metadata ? JSON.stringify(l.metadata) : "",
        credits: Math.abs(l.delta),
        status: "completed",
        timestamp: new Date(l.createdAt).toISOString(),
      }));

    // ── Token Purchases (30d) ──
    const tokenPurchases = allTransactions
      .filter((t) => t.status === "completed" && t.createdAt > thirtyDaysAgo)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 50)
      .map((t) => ({
        email: userEmailMap.get(t.userId as string) || "unknown",
        amount: t.amountCents / 100,
        credits: t.creditsGranted,
        item: t.item,
        timestamp: new Date(t.createdAt).toISOString(),
      }));

    // ── Feature Usage (7d) — from creditLedger reasons ──
    const recentSpends = allLedger.filter(
      (l) => l.createdAt > sevenDaysAgo && l.delta < 0
    );
    const featureUsage: Record<string, number> = {};
    for (const l of recentSpends) {
      const action = l.reason || "unknown";
      featureUsage[action] = (featureUsage[action] || 0) + 1;
    }

    // ── Top Users (30d) ──
    const thirtyDaySpends = allLedger.filter(
      (l) => l.createdAt > thirtyDaysAgo && l.delta < 0
    );
    const userStats = new Map<string, { credits: number; actions: number }>();
    for (const l of thirtyDaySpends) {
      const key = l.userId as string;
      const stats = userStats.get(key) || { credits: 0, actions: 0 };
      stats.credits += Math.abs(l.delta);
      stats.actions += 1;
      userStats.set(key, stats);
    }
    const topUsers = [...userStats.entries()]
      .sort((a, b) => b[1].credits - a[1].credits)
      .slice(0, 20)
      .map(([userId, stats]) => ({
        email: userEmailMap.get(userId) || "unknown",
        totalCreditsUsed: stats.credits,
        actions: stats.actions,
      }));

    return {
      recentSignups,
      recentActivity,
      tokenPurchases,
      featureUsage,
      providerUsage: {},
      topUsers,
    };
  },
});
