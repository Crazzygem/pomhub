# PomHub Dev

A Pornhub-inspired coding bootcamp video platform. Aggregates free coding tutorials from 10+ YouTube channels into a unified browsing experience.

## Tech Stack

- **Frontend**: Astro 5 + Tailwind CSS v4
- **Database**: SQLite + Drizzle ORM
- **Video Metadata**: yt-dlp Python API
- **Deployment**: Docker + Node.js 22

## Features

- **192+ courses** from 10 YouTube channels (NetworkChuck, Fireship, freeCodeCamp, TechWorld with Nana, etc.)
- **Dark theme** with orange accent (#ff9900)
- **Video player** with click-to-play YouTube embeds
- **Related videos** sidebar with category-based recommendations
- **Mock comments** section
- **Random content mix** — homepage shuffles courses from all channels
- **Daily sync** — automatically fetches new videos via cron
- **Incremental sync** — only downloads metadata for new videos

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Set up database
npm run db:push
npm run db:seed

# Sync YouTube content
source .venv/bin/activate
python3 scripts/sync.py

# Start dev server
npm run dev
```

Visit [http://localhost:4321](http://localhost:4321)

### Docker

```bash
# Build and run
docker compose up -d --build

# App runs at http://localhost:4321
```

Data persists in `./data/pomhub.db` (Docker volume).

## Adding Channels

Edit `channels.json`:

```json
{
  "channels": [
    { "handle": "@NetworkChuck", "category": "Networking" },
    { "handle": "@Fireship", "category": "General" }
  ],
  "videosPerPlaylist": 5,
  "maxPlaylistsPerChannel": 5
}
```

Then run sync:

```bash
python3 scripts/sync.py
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed channels + discover playlists |
| `python3 scripts/sync.py` | Sync YouTube metadata |
| `docker compose up -d` | Run in Docker |

## Project Structure

```
pomhub-dev/
├── channels.json          # Channel configuration
├── Dockerfile             # Multi-stage Docker build
├── docker-compose.yml     # Docker Compose config
├── entrypoint.sh          # Container entrypoint (sync + cron + node)
├── scripts/
│   └── sync.py            # YouTube sync script
├── src/
│   ├── components/        # Astro components
│   ├── db/                # Database schema + client
│   ├── layouts/           # Page layouts
│   ├── pages/             # Route pages
│   └── styles/            # Global CSS
└── data/
    └── pomhub.db          # SQLite database (gitignored)
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_PATH` | `./pomhub.db` | Path to SQLite database |

## License

Educational project.
