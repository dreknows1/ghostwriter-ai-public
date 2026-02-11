# Convex Migration Scaffold

This folder contains a production-oriented backend scaffold for replacing Supabase.

## Included
- `schema.ts`: users, profiles, songs, billing ledger, transactions, Stripe idempotency table.
- `users.ts`: user lookup/create by email.
- `credits.ts`: server-side credit reads, monthly grant, and debit mutation.
- `songs.ts`: save/list/delete songs by user.
- `billing.ts`: Stripe checkout crediting with idempotency.

## Migration Plan
1. Add Convex to the app and generate `_generated` files.
2. Wire auth provider identity to `users` table (Clerk/Auth0/Convex Auth).
3. Replace `services/*Service.ts` Supabase calls with Convex queries/mutations.
4. Move Stripe fulfillment to webhook -> `billing.applyStripeCheckoutCredits`.
5. Remove localStorage as source of truth for profile, credits, and transactions.
