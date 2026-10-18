#!/usr/bin/env bash
# Puts the Euro Rounds review queue back into the demo starting state, so every take starts the same:
#   pending  → Medcotec (12), Round Group (11)   (both have a source link and an article photo)
#   approved → Unravel Health (10)
#   rejected → the early test posts without source links (1–9)
# Talks to the n8n API workflow directly, so the app doesn't need to be running.
# The key is read from .env.local and never printed.
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ ! -f .env.local ]]; then
  echo "Missing .env.local (copy .env.local.example and fill it in)." >&2
  exit 1
fi

N8N_WEBHOOK_BASE="$(grep -E '^N8N_WEBHOOK_BASE=' .env.local | cut -d= -f2-)"
EURO_ROUNDS_KEY="$(grep -E '^EURO_ROUNDS_KEY=' .env.local | cut -d= -f2-)"
if [[ -z "$N8N_WEBHOOK_BASE" || -z "$EURO_ROUNDS_KEY" ]]; then
  echo "N8N_WEBHOOK_BASE or EURO_ROUNDS_KEY is empty in .env.local." >&2
  exit 1
fi

set_status() {
  local id="$1" status="$2"
  local result
  result="$(curl -sS -m 20 -X POST "$N8N_WEBHOOK_BASE/euro-rounds/status" \
    -H "x-euro-rounds-key: $EURO_ROUNDS_KEY" \
    -H 'content-type: application/json' \
    -d "{\"id\":$id,\"status\":\"$status\"}")"
  if [[ "$result" == *'"ok":true'* ]]; then
    printf '  post %-2s → %s\n' "$id" "$status"
  else
    printf '  post %-2s → FAILED: %s\n' "$id" "$result" >&2
    return 1
  fi
}

echo "Resetting Euro Rounds demo state…"
for id in 12 11; do set_status "$id" pending; done
set_status 10 approved
for id in 1 2 3 4 5 6 7 8 9; do set_status "$id" rejected; done
echo "Done. Reload the app (Cmd+R): Pending shows 2 posts, Approved 1, Rejected 9."
