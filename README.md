<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Ghostwriter A.I.

Public-facing AI songwriting studio.

## Run Locally

Prerequisites: Node.js 20+

1. Install dependencies
   `npm install`
2. Configure environment variables in `.env.local`:
   - `API_KEY` (Gemini)
   - `CONVEX_URL` (for Convex client/server integration)
   - `CONVEX_ADMIN_KEY` (server-only, for webhook mutation calls)
   - `STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_SECRET_KEY` (server runtime)
   - `STRIPE_WEBHOOK_SECRET` (server runtime, Stripe webhook signing secret)
3. Run
   `npm run dev`

## Backend Direction

- Runtime services are now Supabase-free and prepared for Convex-backed persistence.
- Convex migration scaffold is in `convex/`.
- Stripe credits must be granted by server webhook only.

## Stripe Webhook (Required)

- Endpoint: `/api/stripe-webhook`
- Configure this endpoint in Stripe Dashboard for `checkout.session.completed`.
- Credits are applied via Convex mutation `billing:applyStripeCheckoutCreditsByEmail` with idempotency by event ID.

## Health + Webhook Validation

- Health endpoint: `/api/health`
- Health check command:
  - `HEALTH_URL=https://<your-domain>/api/health pnpm check:health`
- Webhook test command (synthetic signed event):
  - `WEBHOOK_URL=https://<your-domain>/api/stripe-webhook STRIPE_WEBHOOK_SECRET=<your_webhook_secret> TEST_USER_EMAIL=<your_email> pnpm test:webhook`
- Expected webhook test result: `Status: 200` and `{ "received": true }`

## Execute 1, 2, 3

1. Set local env vars
   - `.env.local` has been scaffolded from `.env.example`.
   - Fill every required value before deploy.
2. Generate + deploy Convex
   - Run: `pnpm setup:convex`
   - This runs Convex codegen and deploy (`pnpm convex dev --once`, `pnpm convex deploy`).
3. Register Stripe webhook
   - Stripe Dashboard -> Developers -> Webhooks -> Add endpoint
   - URL: `https://<your-domain>/api/stripe-webhook`
   - Events: `checkout.session.completed`
   - Copy signing secret to `STRIPE_WEBHOOK_SECRET`
