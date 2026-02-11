
import Stripe from 'stripe';

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

    const products: Record<string, { name: string; amount: number; credits: number }> = {
      'starter': { 
        name: 'Refill Pack (100 Credits)', 
        amount: 499, // $4.99 in cents
        credits: 100 
      },
      'studio': { 
        name: 'Studio Pack (500 Credits)', 
        amount: 1999, // $19.99 in cents
        credits: 500 
      },
      'label': { 
        name: 'Label Pack (2000 Credits)', 
        amount: 4999, // $49.99 in cents
        credits: 2000 
      },
    };

    const product = products[priceId];

    if (!product) {
      return res.status(400).json({ error: 'Invalid product selection' });
    }

    // Determine success/cancel URLs based on the request origin
    // Vercel functions populate the host header, or we default to the production URL
    const origin = req.headers.origin || 'https://ghostwriter-ai.vercel.app'; 

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: product.name,
              description: `${product.credits} Ghostwriter AI Generation Credits`,
            },
            unit_amount: product.amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?status=cancel`,
      customer_email: normalizedEmail,
      client_reference_id: normalizedEmail,
      metadata: {
        userEmail: normalizedEmail,
        credits: product.credits.toString(),
        productName: product.name,
        pkgId: priceId
      },
    });

    return res.status(200).json({ url: session.url });

  } catch (err: any) {
    console.error('[Stripe API Error]:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
