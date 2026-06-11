# ── Stage 1: Build ──
FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# ── Stage 2: Production ──
FROM node:22-alpine AS prod
WORKDIR /app

# Install Python 3 + yt-dlp for sync script
RUN apk add --no-cache python3 py3-pip && \
    python3 -m pip install --break-system-packages --no-cache-dir yt-dlp

# Install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy built output from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/drizzle ./drizzle

# Copy scripts (for sync)
COPY scripts/ ./scripts/

# Copy seed file (for initial setup)
COPY src/db/seed.ts ./src/db/seed.ts

# Create data directory for SQLite
RUN mkdir -p /app/data

# Set default DB path to mounted volume
ENV DB_PATH=/app/data/pomhub.db

EXPOSE 4321

CMD ["node", "dist/server/entry.mjs"]
