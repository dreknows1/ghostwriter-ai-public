import Stripe from 'stripe';

const webhookUrl = process.env.WEBHOOK_URL;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const userEmail = process.env.TEST_USER_EMAIL || 'test@example.com';

if (!webhookUrl) {
  console.error('Missing WEBHOOK_URL env var. Example: WEBHOOK_URL=https://your-app.vercel.app/api/stripe-webhook');
  process.exit(1);
}

if (!webhookSecret) {
  console.error('Missing STRIPE_WEBHOOK_SECRET env var.');
  process.exit(1);
}

const event = {
  id: `evt_test_${Date.now()}`,
  object: 'event',
  type: 'checkout.session.completed',
  data: {
    object: {
      id: `cs_test_${Date.now()}`,
      object: 'checkout.session',
      customer_email: userEmail,
      client_reference_id: userEmail,
      amount_total: 1200,
      metadata: {
        userEmail,
        credits: '250',
        productName: 'Starter Top-Up (250 Credits)',
        pkgId: 'starter',
      },
    },
  },
};

const payload = JSON.stringify(event);
const signature = Stripe.webhooks.generateTestHeaderString({
  payload,
  secret: webhookSecret,
});

const response = await fetch(webhookUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'stripe-signature': signature,
  },
  body: payload,
});

const bodyText = await response.text();
console.log(`Status: ${response.status}`);
console.log(bodyText);

if (!response.ok) process.exit(1);
