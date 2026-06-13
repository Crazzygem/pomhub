# ── Stage 1: Build ──
FROM node:22-bookworm AS build
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends build-essential python3 \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: Production ──
FROM node:22-bookworm
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    cron \
    && rm -rf /var/lib/apt/lists/* \
    && python3 -m pip install --break-system-packages --no-cache-dir yt-dlp

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY scripts/ ./scripts/
COPY src/db/ ./src/db/
COPY src/lib/ ./src/lib/
COPY channels.json ./
COPY entrypoint.sh /app/entrypoint.sh

RUN chmod +x /app/entrypoint.sh \
    && mkdir -p /app/data

ENV DB_PATH=/app/data/pomhub.db
EXPOSE 4321

CMD ["/app/entrypoint.sh"]
