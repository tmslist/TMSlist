import type { APIRoute } from 'astro';
import { desc, eq, and } from 'drizzle-orm';
import { db } from '../../../db';
import { badgeAwards } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth.js';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

const guard = (request: Request) => {
  const s = getSessionFromRequest(request);
  return !s || !hasRole(s, 'admin') ? json({ error: 'Forbidden' }, 403) : null;
};

export const GET: APIRoute = async ({ request, url }) => {
  const denied = guard(request); if (denied) return denied;
  try {
    const recipientType = url.searchParams.get('recipientType');
    const recipientId = url.searchParams.get('recipientId');
    const where = recipientType && recipientId
      ? and(eq(badgeAwards.recipientType, recipientType), eq(badgeAwards.recipientId, recipientId))
      : undefined;
    const rows = await db.select().from(badgeAwards).where(where).orderBy(desc(badgeAwards.awardedAt)).limit(500);
    return json({ data: rows });
  } catch (err) { console.error('badge-awards GET', err); return json({ error: 'Internal server error' }, 500); }
};

export const POST: APIRoute = async ({ request }) => {
  const denied = guard(request); if (denied) return denied;
  try {
    const body = await request.json();
    if (!body?.templateId || !body?.recipientType || !body?.recipientId) {
      return json({ error: 'templateId, recipientType, recipientId required' }, 400);
    }
    const session = getSessionFromRequest(request);
    const [row] = await db.insert(badgeAwards).values({
      templateId: body.templateId,
      recipientType: body.recipientType,
      recipientId: body.recipientId,
      awardedBy: session?.userId ?? null,
      note: body.note ?? null,
    }).returning();
    return json({ data: row }, 201);
  } catch (err) { console.error('badge-awards POST', err); return json({ error: 'Internal server error' }, 500); }
};

export const DELETE: APIRoute = async ({ request, url }) => {
  const denied = guard(request); if (denied) return denied;
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'id required' }, 400);
  try {
    await db.delete(badgeAwards).where(eq(badgeAwards.id, id));
    return json({ success: true });
  } catch (err) { console.error('badge-awards DELETE', err); return json({ error: 'Internal server error' }, 500); }
};
