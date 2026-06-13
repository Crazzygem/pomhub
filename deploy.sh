#!/bin/bash
# PomHub Deploy — Build on host, deploy via Docker
set -e

echo "=== PomHub Deploy ==="

echo "[1/5] Stopping existing container..."
docker compose down 2>/dev/null || true

echo "[2/5] Checking for rogue processes on port 4321..."
ROGUE_PID=$(lsof -ti :4321 2>/dev/null || true)
if [ -n "$ROGUE_PID" ]; then
  echo "   Killing process $ROGUE_PID on port 4321..."
  kill "$ROGUE_PID" 2>/dev/null || true
  sleep 2
  # Force kill if still running
  if lsof -ti :4321 >/dev/null 2>&1; then
    kill -9 "$ROGUE_PID" 2>/dev/null || true
    sleep 1
  fi
fi

echo "[3/5] Building on host..."
npm run build

echo "[4/5] Pruning Docker cache..."
docker system prune -f

echo "[5/5] Starting container..."
docker compose up -d

echo "Waiting for healthcheck..."
sleep 10
docker compose ps

echo ""
echo "=== Deploy complete ==="
echo "Direct:  http://localhost:4321"
echo "Via nginx: http://localhost:80"
