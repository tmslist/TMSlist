import type { APIRoute } from 'astro';
import { asc, eq } from 'drizzle-orm';
import { db } from '../../../db';
import { pointsRules } from '../../../db/schema';
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
    const rows = await db.select().from(pointsRules).orderBy(asc(pointsRules.event));
    return json({ data: rows });
  } catch (err) { console.error('points-rules GET', err); return json({ error: 'Internal server error' }, 500); }
};

export const POST: APIRoute = async ({ request }) => {
  const denied = guard(request); if (denied) return denied;
  try {
    const body = await request.json();
    if (!body?.event || body?.points == null) return json({ error: 'event and points required' }, 400);
    const [row] = await db.insert(pointsRules).values({
      event: body.event,
      description: body.description ?? null,
      points: body.points,
      dailyCap: body.dailyCap ?? null,
      active: body.active ?? true,
    }).returning();
    return json({ data: row }, 201);
  } catch (err) { console.error('points-rules POST', err); return json({ error: 'Internal server error' }, 500); }
};

export const PATCH: APIRoute = async ({ request, url }) => {
  const denied = guard(request); if (denied) return denied;
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'id required' }, 400);
  try {
    const body = await request.json();
    const [row] = await db.update(pointsRules).set(body).where(eq(pointsRules.id, id)).returning();
    return json({ data: row });
  } catch (err) { console.error('points-rules PATCH', err); return json({ error: 'Internal server error' }, 500); }
};

export const DELETE: APIRoute = async ({ request, url }) => {
  const denied = guard(request); if (denied) return denied;
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'id required' }, 400);
  try {
    await db.delete(pointsRules).where(eq(pointsRules.id, id));
    return json({ success: true });
  } catch (err) { console.error('points-rules DELETE', err); return json({ error: 'Internal server error' }, 500); }
};
