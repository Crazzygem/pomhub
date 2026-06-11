#!/bin/sh
# PomHub Dev — Container Entrypoint
# Runs sync on startup, then starts cron daemon + Node server.

set -e

echo "🔄 PomHub Dev — Starting up..."

# Run sync on startup (incremental — fast if DB exists)
if [ -f /app/scripts/sync.py ]; then
  echo "📡 Running initial sync..."
  cd /app
  python3 scripts/sync.py || echo "⚠ Sync failed, continuing anyway..."
fi

# Start cron daemon in background
if [ -f /var/spool/cron/crontabs/root ]; then
  echo "⏰ Starting cron daemon..."
  crond -f -l 2 &
fi

# Start Node.js server
echo "🚀 Starting PomHub Dev server..."
exec node dist/server/entry.mjs
