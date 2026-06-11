#!/bin/sh
# PomHub Dev — Container Entrypoint
# Creates tables, seeds channels, syncs YouTube data, starts server.
#
# Runs once per container lifetime (DB persists on volume mount).

set -e

echo "🔄 PomHub Dev — Starting up..."

# Step 1: Create tables + seed channels/playlists (only if tables don't exist)
if [ -f /app/src/db/seed.ts ]; then
  echo "📦 Checking database..."
  TABLE_EXISTS=$(node -e "
    try {
      const db = require('better-sqlite3')(process.env.DB_PATH || '/app/data/pomhub.db');
      const row = db.prepare(\"SELECT name FROM sqlite_master WHERE type='table' AND name='courses'\").get();
      process.exit(row ? 0 : 1);
    } catch(e) { process.exit(1); }
  " 2>/dev/null && echo "yes" || echo "no")

  if [ "$TABLE_EXISTS" = "no" ]; then
    echo "📦 Creating tables and seeding channels..."
    cd /app && npx tsx src/db/seed.ts || echo "⚠ Seed had issues, but continuing..."
  else
    # Check if comments table exists (might be missing on existing DBs)
    COMMENTS_EXISTS=$(node -e "
      try {
        const db = require('better-sqlite3')(process.env.DB_PATH || '/app/data/pomhub.db');
        const row = db.prepare(\"SELECT name FROM sqlite_master WHERE type='table' AND name='comments'\").get();
        process.exit(row ? 0 : 1);
      } catch(e) { process.exit(1); }
    " 2>/dev/null && echo "yes" || echo "no")

    if [ "$COMMENTS_EXISTS" = "no" ]; then
      echo "📦 Adding comments table and seeding comments..."
      cd /app && npx tsx src/db/seed.ts || echo "⚠ Comment seed had issues, but continuing..."
    else
      echo "✅ Database already initialized"
    fi
  fi
fi

# Step 2: Run incremental sync (fast if DB already populated)
if [ -f /app/scripts/sync.py ]; then
  echo "📡 Running sync..."
  cd /app
  python3 scripts/sync.py || echo "⚠ Sync failed, continuing anyway..."
fi

# Step 3: Start cron daemon in background
if [ -f /var/spool/cron/crontabs/root ]; then
  echo "⏰ Starting cron daemon..."
  crond -f -l 2 &
fi

# Step 4: Start Node.js server
echo "🚀 Starting PomHub Dev server..."
exec node dist/server/entry.mjs
