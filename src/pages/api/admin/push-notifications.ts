import type { APIRoute } from 'astro';
import { desc, eq } from 'drizzle-orm';
import { db } from '../../../db';
import { pushCampaigns } from '../../../db/schema';
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
    const rows = await db.select().from(pushCampaigns).orderBy(desc(pushCampaigns.createdAt)).limit(200);
    return json({ data: rows });
  } catch (err) { console.error('push-notifications GET', err); return json({ error: 'Internal server error' }, 500); }
};

export const POST: APIRoute = async ({ request }) => {
  const denied = guard(request); if (denied) return denied;
  try {
    const body = await request.json();
    if (!body?.name || !body?.title || !body?.body) {
      return json({ error: 'name, title, body required' }, 400);
    }
    const [row] = await db.insert(pushCampaigns).values({
      name: body.name,
      title: body.title,
      body: body.body,
      audience: body.audience ?? null,
      payload: body.payload ?? null,
      status: body.status ?? 'draft',
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
    }).returning();
    return json({ data: row }, 201);
  } catch (err) { console.error('push-notifications POST', err); return json({ error: 'Internal server error' }, 500); }
};

export const PATCH: APIRoute = async ({ request, url }) => {
  const denied = guard(request); if (denied) return denied;
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'id required' }, 400);
  try {
    const body = await request.json();
    if (body.scheduledAt) body.scheduledAt = new Date(body.scheduledAt);
    if (body.sentAt) body.sentAt = new Date(body.sentAt);
    const [row] = await db.update(pushCampaigns).set(body).where(eq(pushCampaigns.id, id)).returning();
    return json({ data: row });
  } catch (err) { console.error('push-notifications PATCH', err); return json({ error: 'Internal server error' }, 500); }
};

export const DELETE: APIRoute = async ({ request, url }) => {
  const denied = guard(request); if (denied) return denied;
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'id required' }, 400);
  try {
    await db.delete(pushCampaigns).where(eq(pushCampaigns.id, id));
    return json({ success: true });
  } catch (err) { console.error('push-notifications DELETE', err); return json({ error: 'Internal server error' }, 500); }
};
