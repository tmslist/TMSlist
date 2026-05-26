import type { APIRoute } from 'astro';
import { desc, eq } from 'drizzle-orm';
import { db } from '../../../db';
import { automationWorkflows } from '../../../db/schema';
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
    const rows = await db.select().from(automationWorkflows).orderBy(desc(automationWorkflows.updatedAt));
    return json({ data: rows });
  } catch (err) { console.error('automation-workflows GET', err); return json({ error: 'Internal server error' }, 500); }
};

export const POST: APIRoute = async ({ request }) => {
  const denied = guard(request); if (denied) return denied;
  try {
    const body = await request.json();
    if (!body?.name || !body?.trigger || !Array.isArray(body?.steps)) {
      return json({ error: 'name, trigger, steps[] required' }, 400);
    }
    const [row] = await db.insert(automationWorkflows).values({
      name: body.name,
      description: body.description ?? null,
      trigger: body.trigger,
      triggerConfig: body.triggerConfig ?? null,
      steps: body.steps,
      enabled: body.enabled ?? true,
    }).returning();
    return json({ data: row }, 201);
  } catch (err) { console.error('automation-workflows POST', err); return json({ error: 'Internal server error' }, 500); }
};

export const PATCH: APIRoute = async ({ request, url }) => {
  const denied = guard(request); if (denied) return denied;
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'id required' }, 400);
  try {
    const body = await request.json();
    const [row] = await db.update(automationWorkflows).set(body).where(eq(automationWorkflows.id, id)).returning();
    return json({ data: row });
  } catch (err) { console.error('automation-workflows PATCH', err); return json({ error: 'Internal server error' }, 500); }
};

export const DELETE: APIRoute = async ({ request, url }) => {
  const denied = guard(request); if (denied) return denied;
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'id required' }, 400);
  try {
    await db.delete(automationWorkflows).where(eq(automationWorkflows.id, id));
    return json({ success: true });
  } catch (err) { console.error('automation-workflows DELETE', err); return json({ error: 'Internal server error' }, 500); }
};
