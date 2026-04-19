import type { APIRoute } from 'astro';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';
import { db } from '../../../db';
import { doctors, secondOpinions, users, auditLog } from '../../../db/schema';
import { eq, and, desc } from 'drizzle-orm';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

async function verifyDoctorAccess(session: Awaited<ReturnType<typeof getSessionFromRequest>>) {
  if (!session) return null;
  if (hasRole(session, 'admin')) return { isAdmin: true, userId: session.userId };
  const userRows = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  const user = userRows[0];
  if (!user || !user.clinicId) return null;
  const doctorRows = await db.select().from(doctors).where(eq(doctors.clinicId, user.clinicId)).limit(1);
  if (doctorRows[0]) return { isAdmin: false, userId: session.userId, doctorId: doctorRows[0].id };
  return null;
}

async function logAudit(userId: string, action: string, entityType: string, entityId?: string) {
  try { await db.insert(auditLog).values({ userId, action, entityType, entityId }); } catch {}
}

export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  const doctorCtx = await verifyDoctorAccess(session);
  if (!doctorCtx) return json({ error: 'Unauthorized' }, 401);
  try {
    let doctorId: string;
    if ('doctorId' in doctorCtx) doctorId = doctorCtx.doctorId;
    else return json({ error: 'Doctor not found' }, 404);
    const opinions = await db.select().from(secondOpinions)
      .where(eq(secondOpinions.doctorId, doctorId))
      .orderBy(desc(secondOpinions.createdAt));
    return json({ opinions });
  } catch (err) { console.error(err); return json({ error: 'Failed to load second opinions' }, 500); }
};

export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  const doctorCtx = await verifyDoctorAccess(session);
  if (!doctorCtx) return json({ error: 'Unauthorized' }, 401);
  try {
    const body = await request.json();
    const { id, action } = body;
    if (!id) return json({ error: 'id is required' }, 400);
    let doctorId: string;
    if ('doctorId' in doctorCtx) doctorId = doctorCtx.doctorId;
    else return json({ error: 'Doctor not found' }, 404);
    const validActions = ['accept', 'complete', 'reject'];
    if (!validActions.includes(action)) return json({ error: `action must be one of: ${validActions.join(', ')}` }, 400);
    const updateData: Record<string, unknown> = {};
    if (action === 'accept') updateData.status = 'accepted';
    else if (action === 'complete') {
      updateData.status = 'completed';
      updateData.completedAt = new Date();
    } else if (action === 'reject') updateData.status = 'rejected';
    await db.update(secondOpinions)
      .set(updateData)
      .where(and(eq(secondOpinions.id, id), eq(secondOpinions.doctorId, doctorId)));
    await logAudit(doctorCtx.userId, action, 'second_opinion', id);
    return json({ success: true });
  } catch (err) { console.error(err); return json({ error: 'Failed to update second opinion' }, 500); }
};

export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  const doctorCtx = await verifyDoctorAccess(session);
  if (!doctorCtx) return json({ error: 'Unauthorized' }, 401);
  try {
    const body = await request.json();
    const { id, response } = body;
    if (!id || !response) return json({ error: 'id and response are required' }, 400);
    let doctorId: string;
    if ('doctorId' in doctorCtx) doctorId = doctorCtx.doctorId;
    else return json({ error: 'Doctor not found' }, 404);
    await db.update(secondOpinions)
      .set({ response, completedAt: new Date(), status: 'completed' })
      .where(and(eq(secondOpinions.id, id), eq(secondOpinions.doctorId, doctorId)));
    await logAudit(doctorCtx.userId, 'add_response', 'second_opinion', id);
    return json({ success: true });
  } catch (err) { console.error(err); return json({ error: 'Failed to add response' }, 500); }
};
