#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<EOF
Usage: $0 [options]
Options:
  --secret VALUE           NOTIFY_SECRET (defaults to env)
  --telegram-token VALUE   TELEGRAM_BOT_TOKEN
  --whatsapp-from VALUE    WHATSAPP_FROM
  --whatsapp-to VALUE      WHATSAPP_TO
  --backend VALUE          NOTIFY_BACKEND (file|redis|sqlite|mysql|postgres)
  --help                   Show this help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --secret) NOTIFY_SECRET="$2"; shift 2;;
    --telegram-token) TELEGRAM_BOT_TOKEN="$2"; shift 2;;
    --whatsapp-from) WHATSAPP_FROM="$2"; shift 2;;
    --whatsapp-to) WHATSAPP_TO="$2"; shift 2;;
    --backend) NOTIFY_BACKEND="$2"; shift 2;;
    --help) usage; exit 0;;
    *) echo "Unknown option: $1"; usage; exit 1;;
  esac
done

export NOTIFY_SECRET="${NOTIFY_SECRET:-${SECRET:-}}"
export TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-${TELEGRAM_TOKEN:-}}"
export WHATSAPP_FROM="${WHATSAPP_FROM:-${WAPP_FROM:-}}"
export WHATSAPP_TO="${WHATSAPP_TO:-${WAPP_TO:-}}"
export NOTIFY_BACKEND="${NOTIFY_BACKEND:-${BACKEND:-file}}"

echo "Starting notify-worker:"
echo "  backend=${NOTIFY_BACKEND}"
cat <<EOF
  channels: $(jq -r '.channels | keys[]' ~/.ai-doc/notifications/channels.json 2>/dev/null || echo "not configured")
EOF

npm --workspace packages/cli run notify-worker
