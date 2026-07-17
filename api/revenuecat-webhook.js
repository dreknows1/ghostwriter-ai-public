// server/revenuecat-webhook.ts
import crypto from "crypto";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
var applyRevenueCatEventRef = makeFunctionReference(
  "billing:applyRevenueCatEvent"
);
var HANDLED_EVENT_TYPES = /* @__PURE__ */ new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "UNCANCELLATION",
  "NON_RENEWING_PURCHASE",
  "CANCELLATION",
  "EXPIRATION",
  "BILLING_ISSUE",
  "REFUND"
]);
function timingSafeEqualStr(a, b) {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) {
    crypto.timingSafeEqual(ab, ab);
    return false;
  }
  return crypto.timingSafeEqual(ab, bb);
}
function parseBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  try {
    if (typeof req.body === "string") return JSON.parse(req.body);
    if (req.rawBody && typeof req.rawBody === "string") return JSON.parse(req.rawBody);
    if (req.rawBody && Buffer.isBuffer(req.rawBody)) return JSON.parse(req.rawBody.toString("utf8"));
  } catch {
    return null;
  }
  return null;
}
async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  const webhookSecret = process.env.REVENUECAT_WEBHOOK_SECRET;
  const convexUrl = process.env.CONVEX_URL;
  const convexAdminKey = process.env.CONVEX_ADMIN_KEY;
  if (!webhookSecret || !convexUrl || !convexAdminKey) {
    return res.status(500).json({
      error: "Missing REVENUECAT_WEBHOOK_SECRET, CONVEX_URL, or CONVEX_ADMIN_KEY"
    });
  }
  const authHeader = req.headers["authorization"];
  const auth = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  if (!auth || !timingSafeEqualStr(auth, webhookSecret)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const body = parseBody(req);
  const event = body?.event;
  if (!event || typeof event !== "object") {
    console.warn("[RevenueCat Webhook] missing event body");
    return res.status(200).json({ received: true, ignored: "no_event" });
  }
  const type = String(event.type || "");
  const eventId = String(event.id || "");
  const appUserId = String(event.app_user_id || "");
  if (!HANDLED_EVENT_TYPES.has(type)) {
    console.log("[RevenueCat Webhook] ignoring event type:", type);
    return res.status(200).json({ received: true, ignored: type || "unknown" });
  }
  if (!eventId || !appUserId) {
    console.warn("[RevenueCat Webhook] missing id/app_user_id for type", type);
    return res.status(200).json({ received: true, ignored: "missing_identity" });
  }
  try {
    const client = new ConvexHttpClient(convexUrl);
    client.setAdminAuth(convexAdminKey);
    const price = Number(event.price_in_purchased_currency || 0);
    const productId = event.product_id ? String(event.product_id) : void 0;
    let transactionId = event.transaction_id ? String(event.transaction_id) : event.original_transaction_id ? String(event.original_transaction_id) : void 0;
    if (type === "NON_RENEWING_PURCHASE" && !transactionId) {
      const stamp = event.purchased_at_ms ?? event.event_timestamp_ms ?? "";
      transactionId = `rcfallback_${appUserId}_${productId ?? "unknown"}_${stamp}`;
    }
    const args = {
      eventId,
      type,
      userEmail: appUserId,
      productId,
      transactionId,
      amountCents: Number.isFinite(price) ? Math.round(price * 100) : 0
    };
    if (typeof event.expiration_at_ms === "number") args.expirationAtMs = event.expiration_at_ms;
    if (event.cancel_reason) args.cancelReason = String(event.cancel_reason);
    if (event.period_type) args.periodType = String(event.period_type);
    const result = await client.mutation(applyRevenueCatEventRef, args);
    return res.status(200).json({ received: true, result });
  } catch (err) {
    console.error("[RevenueCat Webhook Error]", err);
    return res.status(500).json({ error: err?.message || "Webhook processing failed" });
  }
}
export {
  handler as default
};
