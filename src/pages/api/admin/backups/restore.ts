import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '../../../../db';
import { backups } from '../../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../../utils/auth.js';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

// Marks a backup as restoring. Actual restore execution must run out-of-band
// (replay SQL dump, swap S3 prefix, etc.); this only records the intent.
export const POST: APIRoute = async ({ request }) => {
  const s = getSessionFromRequest(request);
  if (!s || !hasRole(s, 'admin')) return json({ error: 'Forbidden' }, 403);
  try {
    const body = await request.json().catch(() => ({}));
    const id = body.id;
    if (!id) return json({ error: 'id required' }, 400);
    const [row] = await db.update(backups).set({ status: 'restoring' }).where(eq(backups.id, id)).returning();
    return json({ data: row });
  } catch (err) { console.error('backups/restore POST', err); return json({ error: 'Internal server error' }, 500); }
};
