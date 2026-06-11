import type { APIRoute } from 'astro';
import { db } from '../../../db/client';
import { courses } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing video ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const result = db.select().from(courses).where(eq(courses.youtubeId, id)).get();
  
  if (!result) {
    return new Response(JSON.stringify({ error: 'Course not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' }
  });
};