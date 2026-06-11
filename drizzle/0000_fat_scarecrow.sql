CREATE TABLE `courses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`youtube_id` text NOT NULL,
	`title` text NOT NULL,
	`channel` text,
	`thumbnail_url` text,
	`duration` text,
	`duration_seconds` integer,
	`view_count` integer,
	`category` text,
	`source` text DEFAULT 'manual',
	`playlist_id` text,
	`display_order` integer DEFAULT 0,
	`featured` integer DEFAULT false,
	`created_at` text DEFAULT '2026-06-11T01:54:34.126Z'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `courses_youtube_id_unique` ON `courses` (`youtube_id`);--> statement-breakpoint
CREATE TABLE `playlists` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`youtube_playlist_id` text NOT NULL,
	`name` text NOT NULL,
	`channel` text,
	`last_synced_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `playlists_youtube_playlist_id_unique` ON `playlists` (`youtube_playlist_id`);