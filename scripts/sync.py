#!/usr/bin/env python3
"""
PomHub Dev - Dynamic Channel Sync Script
Discovers playlists from configured YouTube channels, fetches video metadata,
and upserts into SQLite. Incremental: only fetches metadata for new videos.
"""

import json
import os
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / os.environ.get("DB_PATH", "pomhub.db")
CONFIG_PATH = Path(__file__).parent.parent / "channels.json"

# Map playlist/channel name patterns to categories
CATEGORY_MAP = {
    "ccna": "Networking",
    "network": "Networking",
    "python": "Python",
    "linux": "Linux",
    "docker": "DevOps",
    "kubernetes": "DevOps",
    "k8s": "DevOps",
    "100 seconds": "General",
    "react": "Web Dev",
    "javascript": "Web Dev",
    "css": "Web Dev",
    "html": "Web Dev",
    "node": "Web Dev",
    "vue": "Web Dev",
    "next": "Web Dev",
    "flask": "Web Dev",
    "django": "Web Dev",
    "system design": "General",
    "sql": "General",
    "git": "General",
    "hacking": "Networking",
    "security": "Networking",
    "machine learning": "General",
    "ai": "General",
    "rust": "General",
    "golang": "General",
    "go ": "General",
    "java": "General",
    "c++": "General",
    "flutter": "Web Dev",
}


def load_config() -> dict:
    """Load channels.json config."""
    if not CONFIG_PATH.exists():
        print(f"❌ Config not found at {CONFIG_PATH}")
        sys.exit(1)
    with open(CONFIG_PATH) as f:
        return json.load(f)


def infer_category(playlist_name: str, channel_default: str) -> str:
    """Infer category from playlist name, fall back to channel default."""
    lower = playlist_name.lower()
    for pattern, category in CATEGORY_MAP.items():
        if pattern in lower:
            return category
    return channel_default


def format_duration(seconds: int) -> str:
    """Format seconds to HH:MM:SS or MM:SS."""
    if not seconds:
        return "0:00"
    if seconds >= 3600:
        h = seconds // 3600
        m = (seconds % 3600) // 60
        s = seconds % 60
        return f"{h}:{m:02d}:{s:02d}"
    m = seconds // 60
    s = seconds % 60
    return f"{m}:{s:02d}"


def discover_playlists(handle: str) -> list[dict]:
    """Discover all public playlists from a YouTube channel."""
    import yt_dlp
    url = f"https://www.youtube.com/{handle}/playlists"
    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "extract_flat": True,
        "playlistend": 30,
        "socket_timeout": 15,
        "retries": 2,
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            if not info or "entries" not in info:
                return []
            playlists = []
            for entry in info["entries"]:
                if entry and entry.get("id") and entry.get("title"):
                    # entry id is the playlist ID (PL...)
                    playlists.append({
                        "id": entry["id"],
                        "title": entry.get("title", "Unknown"),
                    })
            return playlists
    except Exception as e:
        print(f"  ⚠ Error discovering playlists for {handle}: {e}")
        return []


def get_playlist_video_ids(playlist_id: str, limit: int = 5) -> list[dict]:
    """Flat-extract video IDs and titles from a playlist (fast)."""
    import yt_dlp
    url = f"https://www.youtube.com/playlist?list={playlist_id}"
    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "extract_flat": True,
        "playlistend": limit,
        "socket_timeout": 15,
        "retries": 2,
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            if not info or "entries" not in info:
                return []
            videos = []
            for entry in info["entries"]:
                if entry and entry.get("id"):
                    videos.append({
                        "id": entry["id"],
                        "title": entry.get("title", "Unknown"),
                    })
            return videos[:limit]
    except Exception as e:
        print(f"    ⚠ Error fetching playlist {playlist_id}: {e}")
        return []


def get_video_metadata(video_id: str) -> dict | None:
    """Fetch full metadata for a single video (slow, ~1-2s)."""
    import yt_dlp
    import io
    url = f"https://www.youtube.com/watch?v={video_id}"
    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "socket_timeout": 15,
        "retries": 2,
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            if not info:
                return None
            return {
                "id": video_id,
                "title": info.get("title", ""),
                "channel": info.get("channel", info.get("uploader", "")),
                "duration": format_duration(info.get("duration", 0)),
                "duration_seconds": info.get("duration", 0) or 0,
                "view_count": info.get("view_count", 0) or 0,
                "thumbnail_url": f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg",
            }
    except Exception as e:
        print(f"    ❌ Failed to fetch metadata for {video_id}: {e}")
        return None


def upsert_course(conn: sqlite3.Connection, video: dict, playlist_db_id: int, category: str):
    """Insert or update a course in the database."""
    conn.execute("""
        INSERT INTO courses (youtube_id, title, channel, thumbnail_url, duration,
                             duration_seconds, view_count, playlist_id, source, category)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'sync', ?)
        ON CONFLICT(youtube_id) DO UPDATE SET
            title = excluded.title,
            channel = excluded.channel,
            thumbnail_url = excluded.thumbnail_url,
            duration = excluded.duration,
            duration_seconds = excluded.duration_seconds,
            view_count = excluded.view_count,
            category = COALESCE(excluded.category, courses.category)
    """, (
        video["id"], video["title"], video.get("channel", ""),
        video.get("thumbnail_url", ""), video.get("duration", ""),
        video.get("duration_seconds", 0), video.get("view_count", 0),
        playlist_db_id, category,
    ))


def get_existing_video_ids(conn: sqlite3.Connection) -> set[str]:
    """Get all youtube_ids already in the database."""
    rows = conn.execute("SELECT youtube_id FROM courses").fetchall()
    return {row[0] for row in rows}


def sync_channel(conn: sqlite3.Connection, handle: str, default_category: str, videos_per_playlist: int, max_playlists: int, existing_ids: set[str]) -> int:
    """Sync playlists from a single channel. Returns count of new videos added."""
    print(f"\n📡 Channel: {handle}")
    all_playlists = discover_playlists(handle)
    if not all_playlists:
        print(f"  ⚠ No playlists found")
        return 0
    # Limit to top N playlists per channel
    playlists = all_playlists[:max_playlists]
    print(f"  Syncing {len(playlists)}/{len(all_playlists)} playlists")

    total_new = 0
    for pl in playlists:
        pl_title = pl["title"]
        pl_yt_id = pl["id"]
        category = infer_category(pl_title, default_category)

        # Check if playlist exists in DB
        row = conn.execute(
            "SELECT id FROM playlists WHERE youtube_playlist_id = ?",
            (pl_yt_id,)
        ).fetchone()

        if row:
            pl_db_id = row[0]
        else:
            # Insert new playlist
            conn.execute(
                "INSERT INTO playlists (youtube_playlist_id, name, channel, channel_handle) VALUES (?, ?, ?, ?)",
                (pl_yt_id, pl_title, handle, handle)
            )
            pl_db_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
            print(f"    📋 New playlist: {pl_title}")

        # Get video IDs from playlist (flat, fast)
        videos = get_playlist_video_ids(pl_yt_id, limit=videos_per_playlist)
        if not videos:
            continue

        # Filter to only new videos
        new_videos = [v for v in videos if v["id"] not in existing_ids]
        if not new_videos:
            continue

        print(f"    📋 {pl_title}: {len(new_videos)} new videos")
        for i, v in enumerate(new_videos):
            meta = get_video_metadata(v["id"])
            if meta:
                upsert_course(conn, meta, pl_db_id, category)
                existing_ids.add(v["id"])
                total_new += 1
                print(f"      [{i+1}/{len(new_videos)}] ✅ {meta['title'][:50]}")
            else:
                print(f"      [{i+1}/{len(new_videos)}] ❌ Failed: {v['id']}")

    conn.execute(
        "UPDATE playlists SET last_synced_at = ? WHERE channel_handle = ?",
        (datetime.now(timezone.utc).isoformat(), handle)
    )
    return total_new


def main():
    print("=" * 60)
    print("🔄 PomHub Dev — Dynamic Channel Sync")
    print("=" * 60)

    config = load_config()
    channels = config.get("channels", [])
    videos_per_playlist = config.get("videosPerPlaylist", 5)
    max_playlists = config.get("maxPlaylistsPerChannel", 5)

    if not channels:
        print("❌ No channels configured in channels.json")
        sys.exit(1)

    db_path = DB_PATH
    if not db_path.exists():
        print(f"❌ Database not found at {db_path}")
        print("   Run: npm run db:seed")
        sys.exit(1)

    conn = sqlite3.connect(str(db_path))
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA busy_timeout = 5000")
    existing_ids = get_existing_video_ids(conn)
    print(f"📊 Database has {len(existing_ids)} existing videos")

    total = 0
    for ch in channels:
        handle = ch["handle"]
        category = ch.get("category", "General")
        total += sync_channel(conn, handle, category, videos_per_playlist, max_playlists, existing_ids)

    conn.commit()
    conn.close()

    print(f"\n{'=' * 60}")
    print(f"✅ Done! Added {total} new courses")
    print(f"   Total videos in DB: {len(existing_ids) + total}")
    print("=" * 60)


if __name__ == "__main__":
    main()
