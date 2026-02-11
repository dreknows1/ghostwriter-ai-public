import { ConvexHttpClient } from 'convex/browser';
import { makeFunctionReference } from 'convex/server';

const getUserByEmailRef = makeFunctionReference<'query'>(
  'users:getUserByEmail'
);

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const convexUrl = process.env.CONVEX_URL || '';
  const convexAdminKey = process.env.CONVEX_ADMIN_KEY || '';
  const stripeSecret = process.env.STRIPE_SECRET_KEY || '';
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  const checks: Record<string, any> = {
    env: {
      convexUrl: Boolean(convexUrl),
      convexAdminKey: Boolean(convexAdminKey),
      stripeSecret: Boolean(stripeSecret),
      stripeWebhookSecret: Boolean(stripeWebhookSecret),
    },
    convexReachable: false,
    convexError: null,
  };

  if (convexUrl && convexAdminKey) {
    try {
      const client: any = new ConvexHttpClient(convexUrl);
      client.setAdminAuth(convexAdminKey);
      await client.query(getUserByEmailRef as any, { email: 'healthcheck@example.com' });
      checks.convexReachable = true;
    } catch (e: any) {
      checks.convexError = e?.message || 'Unknown Convex error';
    }
  }

  const ok = checks.env.convexUrl && checks.env.convexAdminKey && checks.env.stripeSecret && checks.env.stripeWebhookSecret && checks.convexReachable;

  return res.status(ok ? 200 : 500).json({
    ok,
    service: 'ghostwriter-api',
    timestamp: new Date().toISOString(),
    checks,
  });
}
