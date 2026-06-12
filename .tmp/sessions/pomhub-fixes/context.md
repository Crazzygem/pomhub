# PomHub Dev — Fix Plan Context Bundle

## Project Root
`/home/seth/School/2.Setec_Semester/7.Seven_Semester/Linux/pomhub.site/pomhub-dev/`

## Objective
Fix all 3 problem areas: (1) deployment always breaks/hangs, (2) fragile database, (3) frontend cosmetic issues. 17 tasks across 3 phases.

## Architecture Summary
- **Astro 5** SSR (`output: "static"` with `@astrojs/node` standalone adapter)
- **Tailwind CSS v4** via `@tailwindcss/vite`
- **SQLite** via better-sqlite3 + Drizzle ORM
- **yt-dlp** Python API for YouTube metadata sync
- **Docker** multi-stage `node:22-alpine`, `network_mode: host` (Proxmox workaround)

## Design Tokens
```
Background: #000 | #1b1b1b / #212121 surfaces
Accent: #ff9900 (orange) | #ff9000 (hover) | #ffa31a (CTA)
Text: #fff primary | #c6c6c6 secondary | #969696 muted | #666 dim
```

## Key Commands
```bash
npm run dev           # Dev server (port 4321)
npm run build         # Prod build
npm run typecheck     # Add this: astro check
python3 scripts/sync.py  # YouTube metadata sync
docker compose up -d --build  # Docker deploy
```

## Database Schema (src/db/schema.ts)
- `channels`: id, handle (unique), name, category, last_synced_at
- `playlists`: id, youtube_playlist_id (unique), name, channel, channel_handle, last_synced_at
- `courses`: id, youtube_id (unique), title, channel, thumbnail_url, duration, duration_seconds, view_count, category, source, playlist_id, display_order, featured, created_at
- `comments`: id, youtube_id, author, avatar_letter, text, likes, replies, created_at

## File Structure
```
src/
├── components/     # 18 Astro components
│   ├── Header.astro        # Logo, nav, search (cosmetic), Login/Signup (dead)
│   ├── Pagination.astro    # Page numbers (doesn't preserve ?category= param)
│   ├── SortTabs.astro      # Passes ?sort= param but index.astro ignores it
│   ├── Categories.astro    # Category filter links
│   ├── AgeVerification.astro
│   ├── VideoPlayer.astro
│   ├── VideoInfo.astro
│   ├── Comments.astro
│   ├── RelatedVideos.astro
│   ├── CourseCard.astro
│   ├── CourseGrid.astro
│   ├── Footer.astro
│   ├── BottomCta.astro
│   ├── Testimonials.astro
│   ├── TestimonialCard.astro
│   ├── VideoDescription.astro
│   ├── FilterChips.astro   ← DEAD CODE (never imported)
│   └── Hero.astro          ← DEAD CODE (never imported)
├── db/
│   ├── client.ts    # SQLite connection (no WAL mode)
│   ├── schema.ts    # Table definitions
│   └── seed.ts      # CREATE TABLE IF NOT EXISTS + channels + playlists
├── layouts/
│   └── Layout.astro # Base layout with OG tags
├── lib/
│   ├── comments.ts  # 500 generated comments
│   └── youtube.ts   ← DEAD CODE (never imported; sync uses Python)
├── pages/
│   ├── index.astro  # SSR homepage (Fisher-Yates shuffle, doesn't respect ?sort=)
│   ├── video/[id].astro  # SSR video page (redirects to / on 404)
│   └── api/
│       ├── courses.ts
│       ├── courses/[id].ts
│       └── sync.ts
└── styles/
    └── global.css   # Tailwind v4 theme
scripts/
├── sync.py          # yt-dlp sync (no socket timeout)
└── seed-comments.ts # Comment seeding
entrypoint.sh        # Seed → sync → cron → node (sync blocks server start)
Dockerfile           # Multi-stage alpine build
docker-compose.yml   # network_mode: host, healthcheck uses wget
```

## Current Issues (All 17)

### Phase 1 — Infrastructure
1. **No WAL mode** — db/client.ts creates SQLite connection without WAL journal_mode. Corrupts on unclean Docker shutdown.
2. **No socket timeout in sync.py** — yt-dlp calls in discover_playlists(), get_playlist_video_ids(), get_video_metadata() have no timeout. Hangs 30-60s per dead/private video.
3. **Sync blocks server startup** — entrypoint.sh runs sync.py before starting Node. If sync hangs, site is down.
4. **Comments never seeded on first deploy** — entrypoint.sh runs seed.ts (no courses yet → comments skipped), then sync.py, but never runs seed-comments.ts after sync.
5. **Fragile table-existence checks** — entrypoint.sh uses `node -e require('better-sqlite3')` to check tables. seed.ts is already idempotent with CREATE TABLE IF NOT EXISTS.
6. **Healthcheck uses wget** — wget may not be in Alpine image. Should use node-based check.
7. **db:push still referenced** — package.json and README mention `drizzle-kit push` which breaks on existing indexes.

### Phase 2 — Frontend
8. **Search bar cosmetic** — Header.astro has search input but submits nowhere. No `?q=` handling in index.astro.
9. **Sort tabs cosmetic** — index.astro always Fisher-Yates shuffles regardless of `?sort=` param.
10. **Pagination doesn't preserve params** — Pagination.astro hrefs only include `?page=N`, drop `?category=` and `?sort=`.
11. **No 404 page** — Missing src/pages/404.astro.
12. **No Categories page** — Nav link points to `/#categories` (anchor on homepage).
13. **No Channels page** — Nav link points to `#`.
14. **No Community page** — Nav link points to `#`.
15. **Log In / Sign Up dead** — Both link to `href="#"`.

### Phase 3 — Cleanup
16. **Dead code** — FilterChips.astro, Hero.astro, src/lib/youtube.ts are never imported.
17. **No typecheck script** — Should add `"typecheck": "astro check"` to package.json.

## Dependencies Between Tasks

### Phase 1 Dependency Graph
- No strict dependencies — all 7 tasks are independent
- Task 3 (background sync) affects how Task 4 (seed comments after sync) is implemented
- Task 1 (WAL mode) is needed by Task 5 (simplify entrypoint) conceptually

### Phase 2 Dependency Graph
- Task 8 (search) and Task 9 (sort) and Task 10 (pagination) all modify index.astro → conflict risk
- Task 11-15 (new pages) can be done in parallel, no conflicts

### Cross-Phase Dependencies
- Phase 1 and Phase 2 are independent — no shared files
- Phase 3 cleanup can be done anytime

## Subtask Grouping for Parallel Execution

### Group A (Phase 1 — independent, all parallel)
- 01: WAL mode (db/client.ts, seed.ts, sync.py)
- 02: yt-dlp timeout (sync.py)
- 03: Background sync (entrypoint.sh)
- 04: Seed comments after sync (entrypoint.sh)
- 05: Simplify entrypoint (entrypoint.sh)
- 06: Fix healthcheck (docker-compose.yml)
- 07: Remove db:push refs (package.json, README.md)

### Group B (Phase 2 — index.astro edits conflict, serial within group)
- 08: Wire search (Header.astro + index.astro)
- 09: Fix sort tabs (index.astro)
- 10: Fix pagination params (Pagination.astro)
- 11: 404 page (new file: src/pages/404.astro)
- 12: Categories page (new file: src/pages/categories.astro)
- 13: Channels page (new file: src/pages/channels.astro)
- 14: Community page (new file: src/pages/community.astro)
- 15: Fix auth links (Header.astro)

### Group C (Phase 3 — independent)
- 16: Delete dead code (3 files)
- 17: Add typecheck script (package.json)

## Constraints
- Do NOT use `drizzle-kit push` — schema changes go in seed.ts with CREATE TABLE IF NOT EXISTS
- `network_mode: host` must stay (Proxmox workaround)
- All SSR pages keep `export const prerender = false`
- Comments are 500 generated funny/parody texts from src/lib/comments.ts
- Design follows PH-inspired dark theme with orange accent
