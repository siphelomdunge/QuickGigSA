#!/usr/bin/env sh
# Concatenates every migration in date order into one file you can paste into the Supabase SQL editor.
# Usage: npm run bundle:sql   →  writes supabase/_bundle.sql (git-ignored)
set -e
cd "$(dirname "$0")/.."
out=supabase/_bundle.sql
: > "$out"
for f in $(ls supabase/migrations/*.sql | sort); do
  printf -- '-- ============ %s ============\n' "$(basename "$f")" >> "$out"
  cat "$f" >> "$out"
  printf '\n\n' >> "$out"
done
echo "Wrote $out ($(wc -l < "$out") lines). Paste it into the SQL editor and run it once."
