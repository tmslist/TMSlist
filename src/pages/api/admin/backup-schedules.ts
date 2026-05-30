import type { APIRoute } from 'astro';
import { desc, eq } from 'drizzle-orm';
import { db } from '../../../db';
import { backupSchedules } from '../../../db/schema';
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
    const rows = await db.select().from(backupSchedules).orderBy(desc(backupSchedules.createdAt));
    return json({ data: rows });
  } catch (err) { console.error('backup-schedules GET', err); return json({ error: 'Internal server error' }, 500); }
};

export const POST: APIRoute = async ({ request }) => {
  const denied = guard(request); if (denied) return denied;
  try {
    const body = await request.json();
    if (!body?.name) return json({ error: 'name required' }, 400);
    const [row] = await db.insert(backupSchedules).values({
      name: body.name,
      type: body.type || 'full',
      frequency: body.frequency || 'daily',
      retentionCount: body.retentionCount ?? 7,
      enabled: body.enabled ?? true,
    }).returning();
    return json({ data: row }, 201);
  } catch (err) { console.error('backup-schedules POST', err); return json({ error: 'Internal server error' }, 500); }
};

export const PATCH: APIRoute = async ({ request, url }) => {
  const denied = guard(request); if (denied) return denied;
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'id required' }, 400);
  try {
    const body = await request.json();
    const [row] = await db.update(backupSchedules).set({
      ...(body.enabled != null && { enabled: body.enabled }),
      ...(body.frequency && { frequency: body.frequency }),
      ...(body.retentionCount != null && { retentionCount: body.retentionCount }),
    }).where(eq(backupSchedules.id, id)).returning();
    return json({ data: row });
  } catch (err) { console.error('backup-schedules PATCH', err); return json({ error: 'Internal server error' }, 500); }
};

export const PUT: APIRoute = async ({ request, url }) => {
  const denied = guard(request); if (denied) return denied;
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'id required' }, 400);
  try {
    const body = await request.json();
    const [row] = await db.update(backupSchedules).set({
      ...(body.name != null && { name: body.name }),
      ...(body.type != null && { type: body.type }),
      ...(body.frequency != null && { frequency: body.frequency }),
      ...(body.retentionCount != null && { retentionCount: body.retentionCount }),
      ...(body.enabled != null && { enabled: body.enabled }),
    }).where(eq(backupSchedules.id, id)).returning();
    return json({ data: row });
  } catch (err) { console.error('backup-schedules PUT', err); return json({ error: 'Internal server error' }, 500); }
};

export const DELETE: APIRoute = async ({ request, url }) => {
  const denied = guard(request); if (denied) return denied;
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'id required' }, 400);
  try {
    await db.delete(backupSchedules).where(eq(backupSchedules.id, id));
    return json({ success: true });
  } catch (err) { console.error('backup-schedules DELETE', err); return json({ error: 'Internal server error' }, 500); }
};
