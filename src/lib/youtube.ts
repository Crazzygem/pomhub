import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface VideoEntry {
  id: string;
  title: string;
  channel: string;
}

export interface VideoMetadata {
  id: string;
  title: string;
  duration: string;
  durationSeconds: number;
  viewCount: number;
  thumbnail: string;
  channel: string;
  description?: string;
}

/**
 * Fetch metadata for all videos in a YouTube playlist
 * @param playlistUrl - Full YouTube playlist URL or playlist ID
 * @returns Array of video entries with id, title, and channel
 */
export async function fetchPlaylistMetadata(playlistUrl: string): Promise<VideoEntry[]> {
  try {
    const { stdout } = await execAsync(
      `yt-dlp --flat-playlist --dump-json "${playlistUrl}"`,
      { maxBuffer: 50 * 1024 * 1024 }
    );

    const videos: VideoEntry[] = [];
    const lines = stdout.trim().split('\n');

    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        videos.push({
          id: data.id,
          title: data.title,
          channel: data.uploader || data.channel || 'Unknown',
        });
      } catch {
        // Skip malformed JSON lines
      }
    }

    return videos;
  } catch (error) {
    throw new Error(`Failed to fetch playlist metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fetch full metadata for a single YouTube video
 * @param videoUrl - Full YouTube video URL or video ID
 * @returns Video metadata including title, duration, view count, thumbnail, channel
 */
export async function fetchVideoMetadata(videoUrl: string): Promise<VideoMetadata> {
  try {
    const { stdout } = await execAsync(
      `yt-dlp --dump-json "${videoUrl}"`,
      { maxBuffer: 10 * 1024 * 1024 }
    );

    const data = JSON.parse(stdout.trim());

    return {
      id: data.id,
      title: data.title,
      duration: formatDuration(data.duration),
      durationSeconds: data.duration || 0,
      viewCount: data.view_count || 0,
      thumbnail: data.thumbnail || getThumbnailUrl(data.id),
      channel: data.uploader || data.channel || 'Unknown',
      description: data.description,
    };
  } catch (error) {
    throw new Error(`Failed to fetch video metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get YouTube thumbnail URL for a video ID
 * @param videoId - YouTube video ID
 * @returns Medium quality thumbnail URL (mqdefault)
 */
export function getThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

/**
 * Format duration in seconds to MM:SS or HH:MM:SS format
 */
function formatDuration(seconds: number | undefined): string {
  if (!seconds) return '0:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}