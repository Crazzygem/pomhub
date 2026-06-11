import Database from 'better-sqlite3';

const sqlite = new Database(process.env.DB_PATH || './pomhub.db');

// Create tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS playlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    youtube_playlist_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    channel TEXT,
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
`);

// Seed playlists only (courses come from sync script with real YouTube data)
const playlists = [
  { youtubePlaylistId: 'PLIhvC56v63IJVXv0GJcl9vO5Z6znCVb1P', name: 'FREE CCNA 200-301', channel: 'NetworkChuck' },
  { youtubePlaylistId: 'PLIhvC56v63ILPDA2DQBv0IKzqsWTZxCkp', name: 'Python RIGHT NOW!!', channel: 'NetworkChuck' },
  { youtubePlaylistId: 'PLIhvC56v63IL2OjFvv_PI0B2yAXGfJLMI', name: 'Linux for Hackers', channel: 'NetworkChuck' },
  { youtubePlaylistId: 'PLIhvC56v63IJlnU4k60d0oFIrsbXEivQo', name: 'Docker Tutorials', channel: 'NetworkChuck' },
  { youtubePlaylistId: 'PL0vfts4VzfNiI1BsIK5u7LpPaIDKMJIDN', name: '100 Seconds of Code', channel: 'Fireship' },
];

const insertPlaylist = sqlite.prepare(
  'INSERT OR IGNORE INTO playlists (youtube_playlist_id, name, channel) VALUES (?, ?, ?)'
);

for (const playlist of playlists) {
  insertPlaylist.run(playlist.youtubePlaylistId, playlist.name, playlist.channel);
}

console.log(`Seeded ${playlists.length} playlists`);
console.log('Courses will be populated by sync script (scripts/sync.py)');

sqlite.close();
console.log('Database seeded successfully!');