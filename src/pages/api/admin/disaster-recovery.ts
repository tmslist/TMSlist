import type { APIRoute } from 'astro';
import { desc, eq } from 'drizzle-orm';
import { db } from '../../../db';
import { disasterRecoveryConfigs } from '../../../db/schema';
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
    const rows = await db.select().from(disasterRecoveryConfigs).orderBy(desc(disasterRecoveryConfigs.createdAt));
    return json({ data: rows });
  } catch (err) { console.error('disaster-recovery GET', err); return json({ error: 'Internal server error' }, 500); }
};

export const POST: APIRoute = async ({ request }) => {
  const denied = guard(request); if (denied) return denied;
  try {
    const body = await request.json();
    if (!body?.name) return json({ error: 'name required' }, 400);
    const [row] = await db.insert(disasterRecoveryConfigs).values({
      name: body.name,
      rpoMinutes: body.rpoMinutes ?? 60,
      rtoMinutes: body.rtoMinutes ?? 240,
      failoverEnabled: body.failoverEnabled ?? false,
    }).returning();
    return json({ data: row }, 201);
  } catch (err) { console.error('disaster-recovery POST', err); return json({ error: 'Internal server error' }, 500); }
};

export const PATCH: APIRoute = async ({ request, url }) => {
  const denied = guard(request); if (denied) return denied;
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'id required' }, 400);
  try {
    const body = await request.json();
    const [row] = await db.update(disasterRecoveryConfigs).set(body).where(eq(disasterRecoveryConfigs.id, id)).returning();
    return json({ data: row });
  } catch (err) { console.error('disaster-recovery PATCH', err); return json({ error: 'Internal server error' }, 500); }
};
