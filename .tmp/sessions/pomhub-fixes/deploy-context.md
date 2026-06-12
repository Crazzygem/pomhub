# PomHub Deployment Context

## Project
**Path:** /home/seth/School/2.Setec_Semester/7.Seven_Semester/Linux/pomhub.site/pomhub-dev
**Git:** On main branch, local repo with remote origin set up

## Deployment Target
**VPS:** 10.10.10.240 (internal Proxmox IP)
**Docker:** network_mode: host (Proxmox workaround — bridge port forwarding broken)
**Port:** 4321
**Domain:** pomhub.site (Cloudflare proxied → VPS)

## SSH Access
VPS is at 10.10.10.240. The user has SSH access configured.

## Deployment Steps
1. `git add -A && git commit -m "..."` — commit all changes
2. `git push` — push to GitHub
3. SSH into VPS: `ssh root@10.10.10.240`
4. On VPS:
   ```bash
   cd /path/to/pomhub-dev  # Find the project directory
   git pull                # Pull latest changes
   docker compose up -d --build  # Rebuild and restart
   ```
5. Monitor logs:
   ```bash
   docker compose logs -f --tail=50
   ```

## Key Changes in this Release
- SQLite WAL mode + busy timeout (prevents DB corruption)
- yt-dlp socket timeout + retries (prevents sync hangs)
- Sync runs in background (server starts immediately)
- Comments auto-seeded after sync
- Working search bar (?q= param)
- Working sort tabs (Most Viewed, Newest, Hot/Random)
- Pagination preserves category/sort/search params
- 404 page, Categories page, Channels page, Community page
- Login/Signup "coming soon" tooltips
- Dead code removed (FilterChips, Hero, youtube.ts)
- Fixed Docker healthcheck (node-based, no wget)
- Cleaned up README and AGENTS.md
