import type { APIRoute } from 'astro';
import { desc } from 'drizzle-orm';
import { db } from '../../../db';
import { leaderboards } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth.js';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

// Reuses the existing `leaderboards` table. If the admin needs distinct
// "custom" leaderboards, add a flag column or a new table.
export const GET: APIRoute = async ({ request }) => {
  const s = getSessionFromRequest(request);
  if (!s || !hasRole(s, 'admin')) return json({ error: 'Forbidden' }, 403);
  try {
    const rows = await db.select().from(leaderboards).orderBy(desc(leaderboards.updatedAt)).limit(100);
    return json({ data: rows });
  } catch (err) { console.error('custom-leaderboards GET', err); return json({ error: 'Internal server error' }, 500); }
};
