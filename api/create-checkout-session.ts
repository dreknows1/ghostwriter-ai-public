
import Stripe from 'stripe';
import { ConvexHttpClient } from 'convex/browser';
import { makeFunctionReference } from 'convex/server';

const createStripeCheckoutPendingByEmailRef = makeFunctionReference<'mutation'>(
  'billing:createStripeCheckoutPendingByEmail'
);

export default async function handler(req: any, res: any) {
  const apiKey = process.env.STRIPE_SECRET_KEY;

  if (!apiKey) {
    console.error('[Stripe Error] Missing STRIPE_SECRET_KEY in environment variables.');
    return res.status(500).json({ error: 'Server configuration error: Missing Stripe API Key' });
  }

  // Initialize Stripe inside the handler to ensure env vars are ready
  const stripe = new Stripe(apiKey, {
    apiVersion: '2023-10-16' as any,
    typescript: true,
  });

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { priceId, email } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.toLowerCase().trim() : '';

    if (!normalizedEmail) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const products: Record<string, { name: string; amount: number; credits: number; mode: 'payment' | 'subscription' }> = {
      'pro_monthly': {
        name: 'Pro Monthly (2000 Credits)',
        amount: 2900, // $29.00 per month in cents
        credits: 2000,
        mode: 'subscription'
      },
      'starter': { 
        name: 'Starter Top-Up (250 Credits)', 
        amount: 1200, // $12.00 in cents
        credits: 250,
        mode: 'payment'
      },
      'pro': { 
        name: 'Pro Top-Up (1000 Credits)', 
        amount: 3900, // $39.00 in cents
        credits: 1000,
        mode: 'payment'
      },
    };

    const product = products[priceId];

    if (!product) {
      return res.status(400).json({ error: 'Invalid product selection' });
    }

    // Determine success/cancel URLs based on the request origin
    // Vercel functions populate the host header, or we default to the production URL
    const origin = req.headers.origin || 'https://ghostwriter-ai.vercel.app'; 

    const isSubscription = product.mode === 'subscription';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: product.name,
              description: `${product.credits} Song Ghost generation credits`,
            },
            ...(isSubscription ? { recurring: { interval: 'month' as const } } : {}),
            unit_amount: product.amount,
          },
          quantity: 1,
        },
      ],
      mode: product.mode,
      success_url: `${origin}/?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?status=cancel`,
      customer_email: normalizedEmail,
      client_reference_id: normalizedEmail,
      ...(isSubscription
        ? {
            subscription_data: {
              metadata: {
                userEmail: normalizedEmail,
                credits: product.credits.toString(),
                productName: product.name,
                pkgId: priceId
              }
            }
          }
        : {}),
      metadata: {
        userEmail: normalizedEmail,
        credits: product.credits.toString(),
        productName: product.name,
        pkgId: priceId
      },
    });

    // Track every checkout immediately in account history.
    // Best-effort: checkout can proceed even if tracking write fails.
    try {
      const convexUrl = process.env.CONVEX_URL;
      const convexAdminKey = process.env.CONVEX_ADMIN_KEY;
      if (convexUrl && convexAdminKey) {
        const client: any = new ConvexHttpClient(convexUrl);
        client.setAdminAuth(convexAdminKey);
        await client.mutation(createStripeCheckoutPendingByEmailRef as any, {
          sessionId: session.id,
          userEmail: normalizedEmail,
          credits: product.credits,
          item: product.name,
          amountCents: product.amount,
        });
      }
    } catch (trackingError) {
      console.error('[Checkout Tracking Error]:', trackingError);
    }

    return res.status(200).json({ url: session.url });

  } catch (err: any) {
    console.error('[Stripe API Error]:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
