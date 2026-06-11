#!/usr/bin/env python3
"""
PomHub Dev - Playlist Sync Script
Uses yt-dlp Python API to fetch video metadata and upsert into SQLite.
"""

import json
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "pomhub.db"

# Map playlist name patterns to categories
CATEGORY_MAP = {
    "ccna": "Networking",
    "network": "Networking",
    "python": "Python",
    "linux": "Linux",
    "docker": "DevOps",
    "100 seconds": "General",
    "react": "JavaScript",
    "javascript": "JavaScript",
}


def infer_category(playlist_name: str) -> str | None:
    """Infer course category from playlist name."""
    lower = playlist_name.lower()
    for pattern, category in CATEGORY_MAP.items():
        if pattern in lower:
            return category
    return None


def format_duration(seconds: int) -> str:
    if seconds >= 3600:
        h = seconds // 3600
        m = (seconds % 3600) // 60
        s = seconds % 60
        return f"{h}:{m:02d}:{s:02d}"
    m = seconds // 60
    s = seconds % 60
    return f"{m}:{s:02d}"


def get_playlist_videos(playlist_id: str) -> list[dict]:
    """Fetch playlist video IDs and titles using yt-dlp flat-playlist."""
    import yt_dlp
    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "extract_flat": True,
        "playlistend": 8,
    }
    url = f"https://www.youtube.com/playlist?list={playlist_id}"
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
            return videos
    except Exception as e:
        print(f"  ⚠ Error fetching playlist: {e}")
        return []


def get_video_metadata(video_id: str) -> dict | None:
    """Fetch single video metadata using yt-dlp dump-json."""
    import yt_dlp
    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
    }
    url = f"https://youtube.com/watch?v={video_id}"
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
    except Exception:
        return None


def upsert_course(conn: sqlite3.Connection, video: dict, playlist_id: int, category: str | None = None):
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
            category = COALESCE(excluded.category, category)
    """, (
        video["id"], video["title"], video.get("channel", ""),
        video.get("thumbnail_url", ""), video.get("duration", ""),
        video.get("duration_seconds", 0), video.get("view_count", 0),
        playlist_id, category,
    ))


def sync_playlist(conn: sqlite3.Connection, pid: int, yt_id: str, name: str):
    print(f"\n📋 Syncing: {name}")
    category = infer_category(name)
    if category:
        print(f"  📂 Category: {category}")
    videos = get_playlist_videos(yt_id)
    if not videos:
        print(f"  ⚠ No videos found (private/deleted or bad ID)")
        return 0

    videos = videos[:8]
    print(f"  Found {len(videos)} videos, fetching metadata...")
    count = 0
    for i, v in enumerate(videos):
        meta = get_video_metadata(v["id"])
        if meta:
            upsert_course(conn, meta, pid, category)
            count += 1
            print(f"  [{i+1}/{len(videos)}] ✅ {meta['title'][:50]}")
        else:
            print(f"  [{i+1}/{len(videos)}] ❌ Failed: {v['id']}")

    conn.execute(
        "UPDATE playlists SET last_synced_at = ? WHERE id = ?",
        (datetime.now(timezone.utc).isoformat(), pid)
    )
    return count


def main():
    print("=" * 60)
    print("🔄 PomHub Dev — Playlist Sync")
    print("=" * 60)

    if not DB_PATH.exists():
        print(f"❌ Database not found at {DB_PATH}")
        sys.exit(1)

    conn = sqlite3.connect(str(DB_PATH))
    playlists = conn.execute(
        "SELECT id, youtube_playlist_id, name FROM playlists"
    ).fetchall()

    if not playlists:
        print("⚠ No playlists. Run `npm run db:seed` first.")
        conn.close()
        sys.exit(1)

    print(f"\n📡 Found {len(playlists)} playlists")
    total = 0
    for pid, yt_id, name in playlists:
        total += sync_playlist(conn, pid, yt_id, name)

    conn.commit()
    conn.close()
    print(f"\n{'=' * 60}")
    print(f"✅ Done! Added/updated {total} courses")
    print("=" * 60)


if __name__ == "__main__":
    main()
