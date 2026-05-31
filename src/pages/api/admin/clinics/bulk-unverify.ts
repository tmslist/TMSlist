import type { APIRoute } from 'astro';
import { db } from '../../../../db';
import { clinics, auditLog } from '../../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../../utils/auth';
import { eq, inArray } from 'drizzle-orm';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const PATCH: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin', 'editor')) return json({ error: 'Forbidden' }, 403);

  try {
    const body = await request.json() as { ids: string[] };
    if (!body.ids?.length) return json({ error: 'ids array required' }, 400);

    await db.update(clinics)
      .set({ verified: false, updatedAt: new Date() })
      .where(inArray(clinics.id, body.ids));

    await db.insert(auditLog).values({
      userId: session.userId ?? null,
      action: 'bulk_unverify_clinics',
      entityType: 'clinic',
      entityId: body.ids.join(','),
      details: { count: body.ids.length },
    });

    return json({ success: true, count: body.ids.length });
  } catch (err) {
    console.error('Bulk unverify error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};
