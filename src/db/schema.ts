import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const channels = sqliteTable('channels', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  handle: text('handle').unique().notNull(),
  name: text('name'),
  category: text('category').default('General'),
  lastSyncedAt: text('last_synced_at'),
});

export const playlists = sqliteTable('playlists', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  youtubePlaylistId: text('youtube_playlist_id').unique().notNull(),
  name: text('name').notNull(),
  channel: text('channel'),
  channelHandle: text('channel_handle'),
  lastSyncedAt: text('last_synced_at'),
});

export const courses = sqliteTable('courses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  youtubeId: text('youtube_id').unique().notNull(),
  title: text('title').notNull(),
  channel: text('channel'),
  thumbnailUrl: text('thumbnail_url'),
  duration: text('duration'),
  durationSeconds: integer('duration_seconds'),
  viewCount: integer('view_count'),
  category: text('category'),
  source: text('source').default('manual'),
  playlistId: text('playlist_id'),
  displayOrder: integer('display_order').default(0),
  featured: integer('featured', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default(new Date().toISOString()),
});

export type Channel = typeof channels.$inferSelect;
export type NewChannel = typeof channels.$inferInsert;
export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;
export type Playlist = typeof playlists.$inferSelect;
export type NewPlaylist = typeof playlists.$inferInsert;
