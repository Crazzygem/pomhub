#!/usr/bin/env tsx
/**
 * PomHub Dev — Seed Comments Script
 * Generates 500 unique comments and randomly assigns them to courses in the DB.
 * Run AFTER `python3 scripts/sync.py` has populated the courses table.
 */

import Database from "better-sqlite3";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || join(__dirname, "..", "pomhub.db");
const sqlite = new Database(dbPath);

// Check comments table exists
try {
  sqlite.prepare("SELECT COUNT(*) FROM comments").get();
} catch {
  console.log("❌ 'comments' table not found. Run `npm run db:seed` first.");
  sqlite.close();
  process.exit(1);
}

// Check courses exist
const courseCount = (sqlite.prepare("SELECT COUNT(*) as c FROM courses").get() as { c: number }).c;
if (courseCount === 0) {
  console.log("❌ No courses found. Run `python3 scripts/sync.py` first.");
  sqlite.close();
  process.exit(1);
}

// Import generated comments
const { ALL_COMMENTS } = await import("../src/lib/comments.js");
const courseRows = sqlite.prepare("SELECT youtube_id FROM courses").all() as { youtube_id: string }[];

// Check existing comment count
const existingCount = (sqlite.prepare("SELECT COUNT(*) as c FROM comments").get() as { c: number }).c;
if (existingCount > 0) {
  console.log(`⚠ ${existingCount} comments already exist. Emptying table...`);
  sqlite.prepare("DELETE FROM comments").run();
}

// Seed comments — randomly assign each to a course
const insertComment = sqlite.prepare(
  "INSERT INTO comments (youtube_id, author, avatar_letter, text, likes, replies, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
);

let count = 0;
const insertMany = sqlite.transaction(() => {
  for (const comment of ALL_COMMENTS) {
    const course = courseRows[Math.floor(Math.random() * courseRows.length)];
    insertComment.run(course.youtube_id, comment.author, comment.avatarLetter, comment.text, comment.likes, comment.replies, comment.createdAt);
    count++;
  }
});

insertMany();
sqlite.close();

console.log(`✅ Seeded ${count} comments across ${courseCount} courses`);
console.log(`   (avg ${(count / courseCount).toFixed(1)} comments per course)`);
