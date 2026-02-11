import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";

const refs = {
  getUserProfileByEmail: { mode: "query", ref: makeFunctionReference<"query">("app:getUserProfileByEmail") },
  upsertUserProfileByEmail: { mode: "mutation", ref: makeFunctionReference<"mutation">("app:upsertUserProfileByEmail") },
  getCreditsByEmail: { mode: "mutation", ref: makeFunctionReference<"mutation">("app:getCreditsByEmail") },
  spendCreditsByEmail: { mode: "mutation", ref: makeFunctionReference<"mutation">("app:spendCreditsByEmail") },
  getSongsByEmail: { mode: "query", ref: makeFunctionReference<"query">("app:getSongsByEmail") },
  getSongCountByEmail: { mode: "query", ref: makeFunctionReference<"query">("app:getSongCountByEmail") },
  saveSongByEmail: { mode: "mutation", ref: makeFunctionReference<"mutation">("app:saveSongByEmail") },
  deleteSongById: { mode: "mutation", ref: makeFunctionReference<"mutation">("app:deleteSongById") },
  deleteAllSongsByEmail: { mode: "mutation", ref: makeFunctionReference<"mutation">("app:deleteAllSongsByEmail") },
  getTransactionsByEmail: { mode: "query", ref: makeFunctionReference<"query">("app:getTransactionsByEmail") },
  deleteAccountByEmail: { mode: "mutation", ref: makeFunctionReference<"mutation">("app:deleteAccountByEmail") },
  getOrCreateReferralCodeByEmail: { mode: "mutation", ref: makeFunctionReference<"mutation">("app:getOrCreateReferralCodeByEmail") },
  claimReferralCodeByEmail: { mode: "mutation", ref: makeFunctionReference<"mutation">("app:claimReferralCodeByEmail") },
  getReferralSummaryByEmail: { mode: "query", ref: makeFunctionReference<"query">("app:getReferralSummaryByEmail") },
};

function getClient() {
  const url = process.env.CONVEX_URL;
  const key = process.env.CONVEX_ADMIN_KEY;
  if (!url || !key) throw new Error("Missing CONVEX_URL or CONVEX_ADMIN_KEY");
  const client: any = new ConvexHttpClient(url);
  client.setAdminAuth(key);
  return client;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  try {
    const { action, payload } = (req.body || {}) as { action?: keyof typeof refs; payload?: any };
    if (!action || !refs[action]) return res.status(400).json({ error: "Invalid action" });
    const client = getClient();
    const selected: any = (refs as any)[action];
    const data =
      selected.mode === "query"
        ? await client.query(selected.ref, payload || {})
        : await client.mutation(selected.ref, payload || {});
    return res.status(200).json({ data });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "DB API failed" });
  }
}
