#!/bin/sh
# PomHub Dev — Container Entrypoint
# Creates tables, seeds channels, syncs YouTube data, starts server.
#
# Runs once per container lifetime (DB persists on volume mount).

set -e

echo "🔄 PomHub — Starting up..."

# Step 1: Create tables + seed channels/playlists (always runs, seed.ts is idempotent)
if [ -f /app/src/db/seed.ts ]; then
  echo "📦 Running database seed..."
  cd /app && /app/node_modules/.bin/tsx src/db/seed.ts || echo "⚠ Seed had issues, but continuing..."
fi

# Step 2: Run sync in background (doesn't block server startup)
if [ -f /app/scripts/sync.py ]; then
  echo "📡 Starting background sync..."
  nohup python3 /app/scripts/sync.py >> /var/log/sync.log 2>&1 &
  echo "   Sync PID: $!"

  # Once sync finishes, seed comments automatically
  # The wait/seed runs in a subprocess so it doesn't delay startup
  (
    # Wait for sync to finish
    wait
    echo "📝 Sync complete. Seeding comments..."
    cd /app && /app/node_modules/.bin/tsx scripts/seed-comments.ts >> /var/log/sync.log 2>&1 || echo "⚠ Comment seed had issues"
  ) &
fi

# Step 3: Start cron daemon in background
if [ -f /var/spool/cron/crontabs/root ]; then
  echo "⏰ Starting cron daemon..."
  crond -f -l 2 &
fi

# Step 4: Start Node.js server
echo "🚀 Starting PomHub production server..."
exec node dist/server/entry.mjs
