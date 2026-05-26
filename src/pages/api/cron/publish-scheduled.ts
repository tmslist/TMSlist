import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { blogPosts } from '../../../db/schema';
import { and, eq, lte } from 'drizzle-orm';
import { requireCronAuth } from '../../../utils/cronAuth';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const authFail = requireCronAuth(request);
  if (authFail) return authFail;
  try {
    const now = new Date();
    const published = await db.update(blogPosts)
      .set({ status: 'published', publishedAt: now, updatedAt: now })
      .where(and(eq(blogPosts.status, 'scheduled'), lte(blogPosts.scheduledAt, now)))
      .returning({ id: blogPosts.id, title: blogPosts.title });
    return new Response(JSON.stringify({ published: published.length, posts: published }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
