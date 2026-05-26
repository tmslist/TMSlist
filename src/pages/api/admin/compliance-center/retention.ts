import type { APIRoute } from 'astro';
import { desc, eq } from 'drizzle-orm';
import { db } from '../../../../db';
import { retentionPolicies } from '../../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../../utils/auth.js';

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
    const rows = await db.select().from(retentionPolicies).orderBy(desc(retentionPolicies.createdAt));
    return json({ data: rows });
  } catch (err) { console.error('compliance-center/retention GET', err); return json({ error: 'Internal server error' }, 500); }
};

export const POST: APIRoute = async ({ request }) => {
  const denied = guard(request); if (denied) return denied;
  try {
    const body = await request.json();
    if (!body?.entityType || body.retentionDays == null) return json({ error: 'entityType and retentionDays required' }, 400);
    const [row] = await db.insert(retentionPolicies).values({
      entityType: body.entityType,
      retentionDays: body.retentionDays,
      description: body.description ?? null,
      active: body.active ?? true,
    }).returning();
    return json({ data: row }, 201);
  } catch (err) { console.error('compliance-center/retention POST', err); return json({ error: 'Internal server error' }, 500); }
};

export const PATCH: APIRoute = async ({ request, url }) => {
  const denied = guard(request); if (denied) return denied;
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'id required' }, 400);
  try {
    const body = await request.json();
    const [row] = await db.update(retentionPolicies).set(body).where(eq(retentionPolicies.id, id)).returning();
    return json({ data: row });
  } catch (err) { console.error('compliance-center/retention PATCH', err); return json({ error: 'Internal server error' }, 500); }
};
