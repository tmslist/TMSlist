import type { APIRoute } from 'astro';
import { asc, desc } from 'drizzle-orm';
import { db } from '../../../db';
import { helpArticles, helpCategories } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth.js';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export const GET: APIRoute = async ({ request }) => {
  const s = getSessionFromRequest(request);
  if (!s || !hasRole(s, 'admin')) return json({ error: 'Forbidden' }, 403);
  try {
    const [articles, categories] = await Promise.all([
      db.select().from(helpArticles).orderBy(desc(helpArticles.updatedAt)).limit(500),
      db.select().from(helpCategories).orderBy(asc(helpCategories.sortOrder), asc(helpCategories.name)),
    ]);
    return json({ data: { articles, categories } });
  } catch (err) { console.error('help-center GET', err); return json({ error: 'Internal server error' }, 500); }
};
