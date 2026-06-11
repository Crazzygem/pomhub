import type { APIRoute } from 'astro';
import { db } from '../../db/client';
import { courses } from '../../db/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const category = url.searchParams.get('category');
  
  let result;
  if (category) {
    result = db.select().from(courses).where(eq(courses.category, category)).all();
  } else {
    result = db.select().from(courses).all();
  }
  
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' }
  });
};