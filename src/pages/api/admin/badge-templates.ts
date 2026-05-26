import type { APIRoute } from 'astro';
import { desc, eq } from 'drizzle-orm';
import { db } from '../../../db';
import { badgeTemplates } from '../../../db/schema';
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
    const rows = await db.select().from(badgeTemplates).orderBy(desc(badgeTemplates.createdAt));
    return json({ data: rows });
  } catch (err) { console.error('badge-templates GET', err); return json({ error: 'Internal server error' }, 500); }
};

export const POST: APIRoute = async ({ request }) => {
  const denied = guard(request); if (denied) return denied;
  try {
    const body = await request.json();
    if (!body?.key || !body?.name) return json({ error: 'key and name required' }, 400);
    const [row] = await db.insert(badgeTemplates).values({
      key: body.key,
      name: body.name,
      description: body.description ?? null,
      icon: body.icon ?? null,
      color: body.color ?? null,
      tier: body.tier ?? 'bronze',
      criteria: body.criteria ?? null,
      active: body.active ?? true,
    }).returning();
    return json({ data: row }, 201);
  } catch (err) { console.error('badge-templates POST', err); return json({ error: 'Internal server error' }, 500); }
};

export const PATCH: APIRoute = async ({ request, url }) => {
  const denied = guard(request); if (denied) return denied;
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'id required' }, 400);
  try {
    const body = await request.json();
    const [row] = await db.update(badgeTemplates).set(body).where(eq(badgeTemplates.id, id)).returning();
    return json({ data: row });
  } catch (err) { console.error('badge-templates PATCH', err); return json({ error: 'Internal server error' }, 500); }
};

export const DELETE: APIRoute = async ({ request, url }) => {
  const denied = guard(request); if (denied) return denied;
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'id required' }, 400);
  try {
    await db.delete(badgeTemplates).where(eq(badgeTemplates.id, id));
    return json({ success: true });
  } catch (err) { console.error('badge-templates DELETE', err); return json({ error: 'Internal server error' }, 500); }
};
