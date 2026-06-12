# AGENTS.md — PomHub Dev

## Architecture

- **Astro 5** `output: "static"` with `@astrojs/node` adapter (standalone mode)
- Pages with `export const prerender = false` are SSR (`video/[id].astro`, `index.astro`)
- **Tailwind CSS v4** via `@tailwindcss/vite`
- **SQLite** (WAL mode) via better-sqlite3 + Drizzle ORM. Schema managed via `seed.ts` with `CREATE TABLE IF NOT EXISTS`. No `drizzle-kit push`.
- **Python 3** + **yt-dlp** for YouTube metadata (separate venv or system pip)

## Database

- 4 tables: `channels`, `playlists`, `courses`, `comments`
- Path: `DB_PATH` env var, default `./pomhub.db` (local) or `/app/data/pomhub.db` (Docker)
- `seed.ts` (tsx) creates tables + seeds channels + discovers playlists
- `seed-comments.ts` seeds 500 funny comments (run after sync)
- `sync.py` (Python) fetches video metadata — incremental, upserts by `youtube_id`

## Key Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server (port 4321) |
| `npm run build` | Prod build |

| `npm run db:seed` | Tables + channels + playlists |
| `npm run seed-comments` | 500 funny comments |
| `python3 scripts/sync.py` | YouTube sync |
| `docker compose up -d --build` | Docker deploy |

## Docker

- Multi-stage build (alpine). Copies `node_modules` from build stage — no `npm ci` in prod.
- `network_mode: host` (Proxmox workaround — Docker bridge port forwarding broken)
- `HOST=0.0.0.0 PORT=4321` env vars (node binds to IPv6 only without this)
- Entrypoint: checks `courses` table → seeds if missing → checks `comments` table → seeds if missing → syncs → cron → starts server
- Cron: daily 3 AM `python3 scripts/sync.py`
- DB persists in `./data/pomhub.db` bind mount

## Pages

- **`/`** (SSR) — courses, paginated 40/page via `?page=N`, filterable via `?category=X`, searchable via `?q=`, sortable via `?sort=` (hot|most-viewed|top-rated|newest)
- **`/video/[id]`** (SSR) — YouTube embed player, breadcrumb, category pills, expandable description, comments, sidebar, continue learning grid
- **`/categories`** (SSR) — Category listing with course counts, links to filtered `/`
- **`/channels`** (SSR) — Channel listing with course counts
- **`/community`** (SSR) — Community placeholder page
- **`/api/courses`** — JSON endpoint | **`/api/sync`** — POST trigger sync

## Design

- Dark: `#000` bg, `#1b1b1b` / `#212121` surfaces, `#ff9900` accent
- Logo: "Pom"(white) + "hub"(black on orange pill) + "Dev"(gray tag)
- PH-style: orange play overlays, hover dimming, dense grids

## OG Tags

- `astro.config.mjs` sets `site: "https://pomhub.site"`
- Layout accepts `ogImage` prop — homepage uses `/og-image.png`, video pages use YouTube thumbnail
- OG image generated via browser screenshot of logo HTML at 1200×630

## Components (key ones)

- `Header.astro` — logo, nav (Home/Videos/Categories/Channels/Community), search, auth
- `AgeVerification.astro` — parody popup, localStorage, 4 random messages
- `VideoPlayer.astro` — click-to-play YouTube embed, HD badge
- `VideoInfo.astro` — title, category pills, action buttons, channel, expandable description
- `Comments.astro` — real DB comments, shows 5 initially + "Show more"
- `RelatedVideos.astro` — single sidebar list, 160×90 thumbnails, "Show more"

## Gotchas

- Database uses WAL mode — prevents corruption on unclean Docker shutdown
- `python3 scripts/sync.py` uses Python yt-dlp API (not CLI) — needs `pip install yt-dlp`
- Comments are generated from templates — run `npm run seed-comments` after sync to distribute 500 comments randomly across courses
- `entrypoint.sh` checks table existence before seeding — adding a new table requires updating the checks
- `npm run dev` may use a different port if 4321 is occupied; check the output
- Site runs `HOST=0.0.0.0` — change or remove `HOST` to restrict binding
