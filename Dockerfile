# ── Stage 1: Build ──
FROM node:22-alpine AS build
WORKDIR /app

# Install build tools for native modules (better-sqlite3)
RUN apk add --no-cache build-base python3

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci && npm prune --omit=dev

# Copy source and build
COPY . .
RUN npm run build

# ── Stage 2: Production ──
FROM node:22-alpine AS prod
WORKDIR /app

# Install Python 3 + yt-dlp + cron
RUN apk add --no-cache python3 py3-pip dcron && \
    python3 -m pip install --break-system-packages --no-cache-dir yt-dlp

# Copy node_modules from build stage (already compiled for this architecture)
COPY --from=build /app/node_modules ./node_modules

# Copy built output from build stage
COPY --from=build /app/dist ./dist

# Copy scripts, config, seed file, and comment generation source
COPY scripts/ ./scripts/
COPY channels.json ./
COPY src/db/ ./src/db/
COPY src/lib/ ./src/lib/

# Copy entrypoint
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Set up cron (daily at 3 AM)
RUN echo "0 3 * * * cd /app && /usr/bin/python3 scripts/sync.py >> /var/log/sync.log 2>&1" > /var/spool/cron/crontabs/root

# Create data directory for SQLite
RUN mkdir -p /app/data

# Default DB path (overridden by docker-compose)
ENV DB_PATH=/app/data/pomhub.db

EXPOSE 4321

ENTRYPOINT ["/app/entrypoint.sh"]
