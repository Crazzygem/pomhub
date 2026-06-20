# ── Stage 1: Build ──
FROM node:22-slim AS build
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential python3 \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: Production ──
FROM node:22-slim
WORKDIR /app

# Install Python + yt-dlp for sync
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip cron \
    && rm -rf /var/lib/apt/lists/* \
    && python3 -m pip install --break-system-packages --no-cache-dir yt-dlp

# Production deps only (tsx is now a production dep for seeding)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy built output (572KB)
COPY --from=build /app/dist ./dist

# Copy files needed for seeding
COPY scripts/ ./scripts/
COPY src/db/ ./src/db/
COPY src/lib/ ./src/lib/
COPY channels.json ./
COPY entrypoint.sh /app/entrypoint.sh

RUN chmod +x /app/entrypoint.sh && mkdir -p /app/data

ENV DB_PATH=/app/data/pomhub.db
EXPOSE 4321
CMD ["/app/entrypoint.sh"]
