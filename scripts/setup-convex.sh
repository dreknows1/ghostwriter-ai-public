#!/usr/bin/env bash
set -euo pipefail

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is not installed. Install pnpm, then re-run this script."
  exit 1
fi

if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo "Created .env.local from .env.example"
fi

echo "Running Convex codegen..."
pnpm convex dev --once

echo "Deploying Convex functions..."
pnpm convex deploy

echo "Done. Next: configure Stripe webhook URL to /api/stripe-webhook"
