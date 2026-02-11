#!/usr/bin/env bash
set -euo pipefail

HEALTH_URL="${HEALTH_URL:-http://localhost:3000/api/health}"

echo "Checking ${HEALTH_URL}"
curl -sS "$HEALTH_URL" | tee /tmp/ghostwriter-health.json

echo
echo "Done"
