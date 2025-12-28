#!/usr/bin/env bash
set -euo pipefail

# Prompt for Notion API key at runtime so it is not stored on disk.
if [ -z "${NOTION_API_KEY:-}" ]; then
  read -s -p "Enter Notion API key (input hidden): " NOTION_API_KEY
  echo
fi

# Prompt for Notion Database ID at runtime so it is not stored on disk.
if [ -z "${NOTION_DATABASE_ID:-}" ]; then
  read -p "Enter Notion Database ID: " NOTION_DATABASE_ID
fi

if [ -z "${NOTION_API_KEY:-}" ] || [ -z "${NOTION_DATABASE_ID:-}" ]; then
  echo "Notion API key and Notion Database ID are required to run." >&2
  exit 1
fi

# Warn if other envs are missing but keep running (mock mode will handle).
for var in NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY FIRECRAWL_API_KEY; do
  if [ -z "${!var:-}" ]; then
    echo "Warning: $var is not set. Mock/demo mode will be used where applicable."
  fi
done

# Run Next.js dev server with the provided key/DB; no files are written.
export NOTION_API_KEY NOTION_DATABASE_ID
exec next dev "$@"
