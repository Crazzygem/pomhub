#!/usr/bin/env tsx
/**
 * PomHub Dev — Seed Script
 * Reads channels.json, discovers playlists via yt-dlp, seeds the database.
 */

import Database from "better-sqlite3";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || join(__dirname, "..", "..", "pomhub.db");
const configPath = join(__dirname, "..", "..", "channels.json");

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('busy_timeout = 5000');

// WAL mode prevents corruption on unclean shutdown
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('busy_timeout = 5000');

// Create tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS channels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    handle TEXT UNIQUE NOT NULL,
    name TEXT,
    category TEXT DEFAULT 'General',
    last_synced_at TEXT
  );

  CREATE TABLE IF NOT EXISTS playlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    youtube_playlist_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    channel TEXT,
    channel_handle TEXT,
    last_synced_at TEXT
  );

  CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    youtube_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    channel TEXT,
    thumbnail_url TEXT,
    duration TEXT,
    duration_seconds INTEGER,
    view_count INTEGER,
    category TEXT,
    source TEXT DEFAULT 'manual',
    playlist_id TEXT,
    display_order INTEGER DEFAULT 0,
    featured INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    youtube_id TEXT NOT NULL,
    author TEXT NOT NULL,
    avatar_letter TEXT NOT NULL,
    text TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    replies INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

async function main() {
  const config = JSON.parse(readFileSync(configPath, "utf-8"));
  const channels = config.channels || [];

  console.log(`\n📡 Seeding ${channels.length} channels...`);

  const insertChannel = sqlite.prepare(
    "INSERT OR IGNORE INTO channels (handle, name, category) VALUES (?, ?, ?)"
  );

  for (const ch of channels) {
    insertChannel.run(ch.handle, ch.handle.replace("@", ""), ch.category);
    console.log(`  ✅ ${ch.handle} (${ch.category})`);
  }

  console.log(`\n📋 Discovering playlists (this may take a minute)...\n`);

  function discoverPlaylists(handle: string): Array<{ id: string; title: string }> {
    try {
      const url = `https://www.youtube.com/${handle}/playlists`;
      const pyScript = `
import yt_dlp, json
opts = {'quiet': True, 'no_warnings': True, 'extract_flat': True, 'playlistend': 30}
with yt_dlp.YoutubeDL(opts) as ydl:
    info = ydl.extract_info('${url}', download=False)
    if info and 'entries' in info:
        entries = [{'id': e['id'], 'title': e.get('title', '')} for e in info['entries'] if e and e.get('id')]
        print(json.dumps(entries))
    else:
        print('[]')
`;
      const output = execSync(`python3 -c "${pyScript.replace(/"/g, '\\"')}"`, {
        encoding: "utf-8",
        timeout: 60000,
      });
      return JSON.parse(output.trim());
    } catch (e) {
      console.log(`  ⚠ Failed to discover playlists for ${handle}`);
      return [];
    }
  }

  const insertPlaylist = sqlite.prepare(
    "INSERT OR IGNORE INTO playlists (youtube_playlist_id, name, channel, channel_handle) VALUES (?, ?, ?, ?)"
  );

  let totalPlaylists = 0;

  for (const ch of channels) {
    const handle = ch.handle;
    const playlists = discoverPlaylists(handle);
    if (playlists.length === 0) {
      console.log(`  ⚠ ${handle}: no playlists found`);
      continue;
    }
    console.log(`  ${handle}: ${playlists.length} playlists`);
    for (const pl of playlists) {
      insertPlaylist.run(pl.id, pl.title, handle, handle);
      totalPlaylists++;
    }
  }

  const courseCount = sqlite.prepare("SELECT COUNT(*) as c FROM courses").get() as { c: number };
  if (courseCount.c > 0) {
    const { ALL_COMMENTS } = await import("../lib/comments.js");
    const courseRows = sqlite.prepare("SELECT youtube_id FROM courses").all() as { youtube_id: string }[];
    const insertComment = sqlite.prepare(
      "INSERT INTO comments (youtube_id, author, avatar_letter, text, likes, replies, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    );

    let commentCount = 0;
    const insertMany = sqlite.transaction(() => {
      for (const comment of ALL_COMMENTS) {
        const course = courseRows[Math.floor(Math.random() * courseRows.length)];
        insertComment.run(course.youtube_id, comment.author, comment.avatarLetter, comment.text, comment.likes, comment.replies, comment.createdAt);
        commentCount++;
      }
    });
    insertMany();
    console.log(`  💬 Seeded ${commentCount} comments`);
  }

  const finalCourseCount = (sqlite.prepare("SELECT COUNT(*) as c FROM courses").get() as { c: number }).c;
  sqlite.close();

  console.log(`\n${"=".repeat(60)}`);
  console.log(`✅ Seeded ${channels.length} channels, ${totalPlaylists} playlists, ${finalCourseCount} courses`);
  if (finalCourseCount === 0) {
    console.log(`   💬 Run \`npm run sync\` first, then run this script again to seed comments`);
  } else {
    console.log(`   💬 Comments seeded`);
  }
  console.log(`   Then run \`npm run sync\` to fetch/update video metadata`);
  console.log(`${"=".repeat(60)}\n`);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
