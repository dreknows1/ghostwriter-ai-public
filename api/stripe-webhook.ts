import Stripe from 'stripe';
import { ConvexHttpClient } from 'convex/browser';
import { makeFunctionReference } from 'convex/server';

const applyStripeCheckoutCreditsByEmailRef = makeFunctionReference<'mutation'>(
  'billing:applyStripeCheckoutCreditsByEmail'
);

function getRawBody(req: any): string {
  if (typeof req.body === 'string') return req.body;
  if (Buffer.isBuffer(req.body)) return req.body.toString('utf8');
  if (req.rawBody && typeof req.rawBody === 'string') return req.rawBody;
  if (req.rawBody && Buffer.isBuffer(req.rawBody)) return req.rawBody.toString('utf8');
  return JSON.stringify(req.body || {});
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const convexUrl = process.env.CONVEX_URL;
  const convexAdminKey = process.env.CONVEX_ADMIN_KEY;

  if (!stripeSecretKey || !stripeWebhookSecret || !convexUrl || !convexAdminKey) {
    return res.status(500).json({
      error: 'Missing STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, CONVEX_URL, or CONVEX_ADMIN_KEY',
    });
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16' as any,
    typescript: true,
  });

  const signature = req.headers['stripe-signature'];
  if (!signature) {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  let event: Stripe.Event;
  try {
    const payload = getRawBody(req);
    event = stripe.webhooks.constructEvent(payload, signature, stripeWebhookSecret);
  } catch (err: any) {
    return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata || {};
      const userEmail = metadata.userEmail || session.customer_email || session.client_reference_id;

      if (!userEmail) {
        return res.status(400).json({ error: 'Missing userEmail/customer_email in checkout session' });
      }

      const credits = Number(metadata.credits || 0);
      if (!credits || credits <= 0) {
        return res.status(400).json({ error: 'Invalid credits metadata in checkout session' });
      }

      const amountCents = session.amount_total || 0;
      const item = metadata.productName || 'Credit Package';

      const client: any = new ConvexHttpClient(convexUrl);
      client.setAdminAuth(convexAdminKey);

      await client.mutation(applyStripeCheckoutCreditsByEmailRef as any, {
        eventId: event.id,
        sessionId: session.id,
        userEmail,
        credits,
        item,
        amountCents,
      });
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error('[Stripe Webhook Error]', err);
    return res.status(500).json({ error: err.message || 'Webhook processing failed' });
  }
}
