import type { APIRoute } from 'astro';
import { desc, eq } from 'drizzle-orm';
import { db } from '../../../db';
import { backups } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth.js';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

const guard = (request: Request) => {
  const s = getSessionFromRequest(request);
  return !s || !hasRole(s, 'admin') ? json({ error: 'Forbidden' }, 403) : null;
};

export const GET: APIRoute = async ({ request }) => {
  const denied = guard(request); if (denied) return denied;
  try {
    const rows = await db.select().from(backups).orderBy(desc(backups.createdAt)).limit(100);
    return json({ data: rows });
  } catch (err) { console.error('backups GET', err); return json({ error: 'Internal server error' }, 500); }
};

export const POST: APIRoute = async ({ request }) => {
  const denied = guard(request); if (denied) return denied;
  try {
    const body = await request.json();
    if (!body?.name) return json({ error: 'name required' }, 400);
    const [row] = await db.insert(backups).values({
      name: body.name,
      type: body.type || 'full',
      status: body.status || 'pending',
      sizeBytes: body.sizeBytes ?? null,
      location: body.location ?? null,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      metadata: body.metadata ?? null,
    }).returning();
    return json({ data: row }, 201);
  } catch (err) { console.error('backups POST', err); return json({ error: 'Internal server error' }, 500); }
};

export const DELETE: APIRoute = async ({ request, url }) => {
  const denied = guard(request); if (denied) return denied;
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'id required' }, 400);
  try {
    await db.delete(backups).where(eq(backups.id, id));
    return json({ success: true });
  } catch (err) { console.error('backups DELETE', err); return json({ error: 'Internal server error' }, 500); }
};

export const PATCH: APIRoute = async ({ request, url }) => {
  const denied = guard(request); if (denied) return denied;
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'id required' }, 400);
  try {
    const body = await request.json();
    const [row] = await db.update(backups).set({
      ...(body.status != null && { status: body.status }),
      ...(body.name != null && { name: body.name }),
      ...(body.sizeBytes != null && { sizeBytes: body.sizeBytes }),
      ...(body.location != null && { location: body.location }),
    }).where(eq(backups.id, id)).returning();
    return json({ data: row });
  } catch (err) { console.error('backups PATCH', err); return json({ error: 'Internal server error' }, 500); }
};

export const POST_RESTORE: APIRoute = async ({ request, url }) => {
  const s = getSessionFromRequest(request);
  if (!s || !hasRole(s, 'admin')) return json({ error: 'Forbidden' }, 403);
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'id required' }, 400);
  try {
    const [row] = await db.update(backups).set({ status: 'restoring' }).where(eq(backups.id, id)).returning();
    return json({ data: row });
  } catch (err) { console.error('backups POST_RESTORE', err); return json({ error: 'Internal server error' }, 500); }
};
