import type { APIRoute } from 'astro';
import { db } from '../../../../../db';
import { clinics } from '../../../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../../../utils/auth';
import { eq } from 'drizzle-orm';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const POST: APIRoute = async ({ params, request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  const { id } = params;
  if (!id) return json({ error: 'Missing clinic id' }, 400);

  try {
    const body = await request.json() as { reason: string };

    if (!body.reason?.trim()) return json({ error: 'reason is required' }, 400);

    const [clinic] = await db.select({ id: clinics.id })
      .from(clinics).where(eq(clinics.id, id)).limit(1);

    if (!clinic) return json({ error: 'Clinic not found' }, 404);

    await db.update(clinics)
      .set({ statusReason: body.reason.trim() })
      .where(eq(clinics.id, id));

    return json({ success: true });
  } catch (err) {
    console.error('Status reason update error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};