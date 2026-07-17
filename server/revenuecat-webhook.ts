import crypto from 'crypto';
import { ConvexHttpClient } from 'convex/browser';
import { makeFunctionReference } from 'convex/server';

/**
 * RevenueCat webhook → Convex grant path (docs/PLAN.md "Credits & payments").
 *
 * Auth: RevenueCat sends the exact string configured as the dashboard
 * "Authorization" header on every request. We compare it (timing-safe) to
 * REVENUECAT_WEBHOOK_SECRET. `app_user_id` is the login email (RevenueCat is
 * configured with appUserID = email; see services/entitlementService.ts).
 *
 * Server-to-server only — no CORS. Unknown event types return 200 + log with no
 * side effects; the handler never 500s on an unknown type.
 */

const applyRevenueCatEventRef = makeFunctionReference<'mutation'>(
  'billing:applyRevenueCatEvent'
);

// Event types that map to a credit/plan change. Anything else is a no-op.
const HANDLED_EVENT_TYPES = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'UNCANCELLATION',
  'NON_RENEWING_PURCHASE',
  'CANCELLATION',
  'EXPIRATION',
  'BILLING_ISSUE',
  'REFUND',
]);

/** Constant-time string comparison that tolerates unequal lengths. */
function timingSafeEqualStr(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) {
    // Keep timing roughly constant even on a length mismatch.
    crypto.timingSafeEqual(ab, ab);
    return false;
  }
  return crypto.timingSafeEqual(ab, bb);
}

function parseBody(req: any): any {
  if (req.body && typeof req.body === 'object') return req.body;
  try {
    if (typeof req.body === 'string') return JSON.parse(req.body);
    if (req.rawBody && typeof req.rawBody === 'string') return JSON.parse(req.rawBody);
    if (req.rawBody && Buffer.isBuffer(req.rawBody)) return JSON.parse(req.rawBody.toString('utf8'));
  } catch {
    return null;
  }
  return null;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const webhookSecret = process.env.REVENUECAT_WEBHOOK_SECRET;
  const convexUrl = process.env.CONVEX_URL;
  const convexAdminKey = process.env.CONVEX_ADMIN_KEY;

  if (!webhookSecret || !convexUrl || !convexAdminKey) {
    return res.status(500).json({
      error: 'Missing REVENUECAT_WEBHOOK_SECRET, CONVEX_URL, or CONVEX_ADMIN_KEY',
    });
  }

  // Authorization: exact, timing-safe match against the shared secret.
  const authHeader = req.headers['authorization'];
  const auth = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  if (!auth || !timingSafeEqualStr(auth, webhookSecret)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const body = parseBody(req);
  const event = body?.event;
  if (!event || typeof event !== 'object') {
    // Malformed but authenticated — ack so RevenueCat stops retrying.
    console.warn('[RevenueCat Webhook] missing event body');
    return res.status(200).json({ received: true, ignored: 'no_event' });
  }

  const type: string = String(event.type || '');
  const eventId: string = String(event.id || '');
  const appUserId: string = String(event.app_user_id || '');

  // Unknown / non-credit event types: log + no-op (never 500).
  if (!HANDLED_EVENT_TYPES.has(type)) {
    console.log('[RevenueCat Webhook] ignoring event type:', type);
    return res.status(200).json({ received: true, ignored: type || 'unknown' });
  }

  if (!eventId || !appUserId) {
    console.warn('[RevenueCat Webhook] missing id/app_user_id for type', type);
    return res.status(200).json({ received: true, ignored: 'missing_identity' });
  }

  try {
    const client: any = new ConvexHttpClient(convexUrl);
    client.setAdminAuth(convexAdminKey);

    const price = Number(event.price_in_purchased_currency || 0);
    const productId = event.product_id ? String(event.product_id) : undefined;

    // Consumable dedupe key. Prefer the store transaction id; if absent, derive
    // a deterministic key from stable fields so a redelivery under a NEW event
    // id still can't double-grant a pack (rcEvents by_event covers same-id
    // redelivery). Subscriptions/refunds don't dedupe on transaction id.
    let transactionId = event.transaction_id
      ? String(event.transaction_id)
      : event.original_transaction_id
        ? String(event.original_transaction_id)
        : undefined;
    if (type === 'NON_RENEWING_PURCHASE' && !transactionId) {
      const stamp = event.purchased_at_ms ?? event.event_timestamp_ms ?? '';
      transactionId = `rcfallback_${appUserId}_${productId ?? 'unknown'}_${stamp}`;
    }

    const args: Record<string, any> = {
      eventId,
      type,
      userEmail: appUserId,
      productId,
      transactionId,
      amountCents: Number.isFinite(price) ? Math.round(price * 100) : 0,
    };
    if (typeof event.expiration_at_ms === 'number') args.expirationAtMs = event.expiration_at_ms;
    if (event.cancel_reason) args.cancelReason = String(event.cancel_reason);
    if (event.period_type) args.periodType = String(event.period_type);

    const result = await client.mutation(applyRevenueCatEventRef as any, args);
    return res.status(200).json({ received: true, result });
  } catch (err: any) {
    // Genuine processing error (e.g. Convex unreachable). Surface 500 so
    // RevenueCat retries; the mutation is idempotent, so retries are safe.
    console.error('[RevenueCat Webhook Error]', err);
    return res.status(500).json({ error: err?.message || 'Webhook processing failed' });
  }
}
