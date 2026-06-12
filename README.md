# PomHub Dev

A Pornhub-inspired coding bootcamp video platform. Aggregates free coding tutorials from 10+ YouTube channels into a unified browsing experience.

## Tech Stack

- **Frontend**: Astro 5 + Tailwind CSS v4
- **Database**: SQLite (WAL mode) + Drizzle ORM
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

# Set up database (creates tables + seeds channels)
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

## Deployment

### VPS Deployment (Recommended)

The easiest way to deploy is Docker on a VPS (DigitalOcean, Hetzner, Vultr, etc.).

**Prerequisites:**
- A VPS with Docker and Docker Compose installed
- Git access to this repository

**Steps:**

```bash
# 1. SSH into your VPS
ssh root@your-vps-ip

# 2. Clone the repository
git clone <your-repo-url>
cd pomhub-dev

# 3. Build and start
docker compose up -d --build

# 4. Check status
docker compose logs -f app
```

The app will:
- Build the Docker image (first time only, ~2 min)
- Run initial YouTube sync (~5 min)
- Start the web server on port 4321
- Set up daily cron at 3 AM for content updates

**Access the site:** `http://your-vps-ip:4321`

### Docker Install (if not installed)

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com | sh
usermod -aG docker $USER
# Log out and back in, then:
docker compose up -d --build
```

### Keeping It Updated

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker compose up -d --build
```

### Checking Sync Status

```bash
# View sync logs
docker compose exec app cat /var/log/sync.log

# Run manual sync
docker compose exec app python3 scripts/sync.py

# Check database stats
docker compose exec app python3 -c "
import sqlite3
conn = sqlite3.connect('/app/data/pomhub.db')
print(f'Courses: {conn.execute(\"SELECT COUNT(*) FROM courses\").fetchone()[0]}')
print(f'Channels: {conn.execute(\"SELECT COUNT(*) FROM channels\").fetchone()[0]}')
conn.close()
"
```

### Data Persistence

The SQLite database lives in `./data/pomhub.db` on the host (mounted as a Docker volume).

| Action | Database |
|--------|----------|
| Container restart | Survives |
| `docker compose down` + `up` | Survives |
| Server reboot | Survives |
| `docker compose down -v` | **Wiped** (only if you use `-v` flag) |

### Adding New Channels (Production)

```bash
# Edit channels.json on the VPS
nano channels.json

# Run sync to fetch new content
docker compose exec app python3 scripts/sync.py
```

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
| `npm run db:seed` | Create tables + seed channels + discover playlists |
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
