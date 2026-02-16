# Supabase -> Convex Backfill Runbook

One-time script to backfill missing songs and purchase transactions into Convex.

## Inputs
- `songs.json` (array)
- `transactions.json` (array)
- `users.json` (optional, required if transactions only have Supabase `user_id`)

Accepted key aliases:
- Songs: `email|user_email`, `title`, `lyrics`, `sunoPrompt|suno_prompt`, optional `albumArt|album_art`, `socialPack|social_pack`, `createdAt|created_at`
- Songs also support nested Supabase payloads in `data` (`data.title`, `data.sunoPrompt`, `data.lyrics`, etc.)
- Transactions: `email|user_email` OR (`user_id` + `--users` mapping), `stripeSessionId|stripe_session_id|sessionId`, `item|description|type`, `amountCents|amount_cents|amount`, `creditsGranted|credits_granted|credits`, optional `status`, `createdAt|created_at`
- Users mapping: `id|user_id` + `email|user_email`

## Environment
- `CONVEX_URL`
- `CONVEX_ADMIN_KEY`

## 1) Dry run first (no writes)
```bash
node scripts/backfill-supabase-to-convex.mjs \
  --songs ./songs.json \
  --transactions ./transactions.json \
  --users ./users.json
```

## 2) Apply migration
```bash
node scripts/backfill-supabase-to-convex.mjs \
  --songs ./songs.json \
  --transactions ./transactions.json \
  --users ./users.json \
  --apply
```

## Optional flags
- `--batch-songs 100`
- `--batch-transactions 100`
- `--no-credit-adjustments` (imports transactions without adding credits to profiles)

## Safety behavior
- Idempotent inserts:
  - Songs are skipped if same user + same title + same prompt + same lyrics + same createdAt already exists.
  - Transactions are skipped if `stripeSessionId` already exists.
- Default mode is dry-run.

## Verification targets
- Users: unchanged
- Songs: should increase from `5` to `554`
- Transactions: should increase from `0` to `5`
