#!/usr/bin/env bash
# Helper to push all migrations to your Supabase project in one go.
# Run from the repo root: ./scripts/setup-supabase.sh
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v supabase >/dev/null 2>&1; then
  echo "Supabase CLI not found. Install with:"
  echo "  brew install supabase/tap/supabase"
  exit 1
fi

if [ ! -f .env.local ]; then
  echo ".env.local not found. Copy .env.local.example and fill in your keys first."
  exit 1
fi

# Extract project ref from NEXT_PUBLIC_SUPABASE_URL (https://<ref>.supabase.co)
PROJECT_URL=$(grep -E '^NEXT_PUBLIC_SUPABASE_URL=' .env.local | cut -d= -f2- | tr -d '"' | tr -d "'")
PROJECT_REF=$(echo "$PROJECT_URL" | sed -E 's#https?://([^.]+)\.supabase\.co.*#\1#')

if [ -z "${PROJECT_REF}" ] || [ "${PROJECT_REF}" = "${PROJECT_URL}" ]; then
  echo "Could not extract project ref from NEXT_PUBLIC_SUPABASE_URL."
  echo "  URL read: $PROJECT_URL"
  exit 1
fi

echo "Project ref: $PROJECT_REF"

# Login (no-op if already authed)
if ! supabase projects list >/dev/null 2>&1; then
  echo "→ supabase login (browser will open)…"
  supabase login
fi

# Link
echo "→ supabase link --project-ref $PROJECT_REF"
supabase link --project-ref "$PROJECT_REF" || true

# Push
echo "→ supabase db push"
supabase db push

echo ""
echo "✓ Migrations pushed. Verify in Studio → Table Editor that 16 new tables exist."
echo "  Next steps:"
echo "   1. npm run dev"
echo "   2. Sign in via the app"
echo "   3. (optional) Studio SQL editor → run supabase/seeds/component_registry.sql"
echo "   4. Hit http://localhost:3000/api/health to verify"
