import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import { sanitizeText } from "../lib/sanitizeInput";

const validateInviteCodeRef = makeFunctionReference<"mutation">("inviteCodes:validateCode");

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
    const code = sanitizeText(String((req.body as any)?.code || ""), 64).toUpperCase();
    if (!code) return res.status(400).json({ error: "Missing code" });
    const client = getClient();
    const data = await client.mutation(validateInviteCodeRef as any, { code });
    return res.status(200).json({ data });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Community code validation failed" });
  }
}
