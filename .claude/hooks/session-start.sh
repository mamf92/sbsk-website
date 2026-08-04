#!/usr/bin/env bash
# Ensures a session can immediately run lint/test/build.
# Remote sessions start from a fresh clone with no node_modules; installing here
# means no turn is wasted discovering that the toolchain is missing.
set -uo pipefail

cd "$(dirname "$0")/../.." || exit 0

if [ -d node_modules ] && [ -x node_modules/.bin/vite ]; then
  exit 0
fi

echo "[session-start] installing dependencies..." >&2
if ! npm ci --no-audit --no-fund >/dev/null 2>&1; then
  echo "[session-start] npm ci failed; run 'npm install' manually before building." >&2
  exit 0
fi
echo "[session-start] dependencies ready." >&2
