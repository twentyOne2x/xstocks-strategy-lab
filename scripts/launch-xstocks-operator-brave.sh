#!/usr/bin/env bash
set -euo pipefail

BRAVE_BIN="${XSTOCKS_BRAVE_BINARY:-/Applications/Brave Browser.app/Contents/MacOS/Brave Browser}"
CDP_PORT="${XSTOCKS_BRAVE_CDP_PORT:-9225}"
USER_DATA_DIR="${XSTOCKS_BRAVE_USER_DATA_DIR:-$HOME/Library/Application Support/xstocks-operator-brave}"
START_URL="${1:-${XSTOCKS_BRAVE_START_URL:-https://24-7.markets/onboarding}}"

if [[ ! -x "$BRAVE_BIN" ]]; then
  echo "Brave binary not found at $BRAVE_BIN" >&2
  exit 1
fi

mkdir -p "$USER_DATA_DIR"

nohup "$BRAVE_BIN" \
  --remote-debugging-port="$CDP_PORT" \
  --user-data-dir="$USER_DATA_DIR" \
  --no-first-run \
  --no-default-browser-check \
  --new-window \
  "$START_URL" \
  >/tmp/xstocks-operator-brave.log 2>&1 &

echo "Launched Brave operator profile on http://127.0.0.1:${CDP_PORT}"
echo "User data dir: ${USER_DATA_DIR}"
echo "Start URL: ${START_URL}"
