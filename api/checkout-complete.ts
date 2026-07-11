import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import { applyCors, handlePreflight } from "../lib/cors";

const applyStripeCheckoutCreditsByEmailRef = makeFunctionReference<"mutation">(
  "billing:applyStripeCheckoutCreditsByEmail"
);

export default async function handler(req: any, res: any) {
  if (handlePreflight(req, res)) return;
  applyCors(req, res);

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const convexUrl = process.env.CONVEX_URL;
  const convexAdminKey = process.env.CONVEX_ADMIN_KEY;
  if (!stripeSecretKey || !convexUrl || !convexAdminKey) {
    return res.status(500).json({ error: "Missing STRIPE_SECRET_KEY, CONVEX_URL, or CONVEX_ADMIN_KEY" });
  }

  const sessionId = typeof req.body?.sessionId === "string" ? req.body.sessionId.trim() : "";
  if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });

  try {
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16" as any,
      typescript: true,
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session || session.status !== "complete" || session.payment_status !== "paid") {
      return res.status(409).json({ error: "Checkout not fully paid yet" });
    }

    const metadata = session.metadata || {};
    const userEmail = metadata.userEmail || session.customer_email || session.client_reference_id;
    const credits = Number(metadata.credits || 0);
    if (!userEmail) return res.status(400).json({ error: "Missing userEmail/customer_email in checkout session" });
    if (!credits || credits <= 0) return res.status(400).json({ error: "Invalid credits metadata in checkout session" });

    const pkgId = metadata.pkgId || "";
    let planExpiresAt: number | undefined;
    if (session.mode === "subscription" && session.subscription) {
      try {
        const subId = typeof session.subscription === "string"
          ? session.subscription
          : session.subscription.id;
        const sub = await stripe.subscriptions.retrieve(subId);
        if (sub.current_period_end) planExpiresAt = sub.current_period_end * 1000;
      } catch (e) {
        console.error("[Checkout Complete] subscription lookup failed", e);
      }
    }

    const client: any = new ConvexHttpClient(convexUrl);
    client.setAdminAuth(convexAdminKey);
    const result = await client.mutation(applyStripeCheckoutCreditsByEmailRef as any, {
      eventId: `checkout_sync_${session.id}`,
      sessionId: session.id,
      userEmail,
      credits,
      item: metadata.productName || "Credit Package",
      amountCents: session.amount_total || 0,
      pkgId,
      ...(planExpiresAt ? { planExpiresAt } : {}),
    });

    return res.status(200).json({ ok: true, result });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Checkout confirmation failed" });
  }
}
