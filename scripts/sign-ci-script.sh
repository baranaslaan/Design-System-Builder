#!/usr/bin/env bash
# Regenerates public/scripts/ds-audit.mjs.sha256 so CI runs can verify the
# script they downloaded matches the version this repo published.
# Run after EVERY change to public/scripts/ds-audit.mjs, before deploying.
set -euo pipefail
cd "$(dirname "$0")/.."

SCRIPT="public/scripts/ds-audit.mjs"
SUMS="public/scripts/ds-audit.mjs.sha256"

if [ ! -f "$SCRIPT" ]; then echo "$SCRIPT not found"; exit 1; fi

# Use shasum (BSD) on macOS, sha256sum on Linux; emit GNU coreutils-compatible
# format that `sha256sum -c` understands.
( cd "$(dirname "$SCRIPT")" && \
  ( command -v sha256sum >/dev/null \
    && sha256sum  "$(basename "$SCRIPT")" \
    || shasum -a 256 "$(basename "$SCRIPT")" \
  ) ) > "$SUMS"

echo "✓ Wrote $SUMS"
cat "$SUMS"
