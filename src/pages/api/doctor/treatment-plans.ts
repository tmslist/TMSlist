import type { APIRoute } from 'astro';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';
import { db } from '../../../db';
import { doctors, treatmentPlans, users, auditLog } from '../../../db/schema';
import { eq, desc, and } from 'drizzle-orm';

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
    const plans = await db.select().from(treatmentPlans)
      .where(eq(treatmentPlans.doctorId, doctorId))
      .orderBy(desc(treatmentPlans.createdAt));
    return json({ plans });
  } catch (err) { console.error(err); return json({ error: 'Failed to load treatment plans' }, 500); }
};

export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  const doctorCtx = await verifyDoctorAccess(session);
  if (!doctorCtx) return json({ error: 'Unauthorized' }, 401);
  try {
    const body = await request.json();
    const { patientEmail, protocol, sessionCount, frequencyHz, intensityPercent, milestones } = body;
    if (!patientEmail || !protocol || !sessionCount) {
      return json({ error: 'patientEmail, protocol, and sessionCount are required' }, 400);
    }
    let doctorId: string;
    if ('doctorId' in doctorCtx) doctorId = doctorCtx.doctorId;
    else return json({ error: 'Doctor not found' }, 404);
    const result = await db.insert(treatmentPlans).values({
      doctorId,
      patientEmail,
      protocol,
      sessionCount,
      frequencyHz: frequencyHz ?? null,
      intensityPercent: intensityPercent ?? null,
      milestones: milestones ?? null,
      status: 'active',
    }).returning();
    await logAudit(doctorCtx.userId, 'create', 'treatment_plan', result[0].id);
    return json(result[0], 201);
  } catch (err) { console.error(err); return json({ error: 'Failed to create treatment plan' }, 500); }
};

export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  const doctorCtx = await verifyDoctorAccess(session);
  if (!doctorCtx) return json({ error: 'Unauthorized' }, 401);
  try {
    const body = await request.json();
    const { id, status } = body;
    if (!id) return json({ error: 'id is required' }, 400);
    const validStatuses = ['active', 'completed', 'paused'];
    if (status && !validStatuses.includes(status)) {
      return json({ error: `status must be one of: ${validStatuses.join(', ')}` }, 400);
    }
    let doctorId: string;
    if ('doctorId' in doctorCtx) doctorId = doctorCtx.doctorId;
    else return json({ error: 'Doctor not found' }, 404);
    await db.update(treatmentPlans)
      .set({ status: status ?? 'active' })
      .where(and(eq(treatmentPlans.id, id), eq(treatmentPlans.doctorId, doctorId)));
    await logAudit(doctorCtx.userId, 'update', 'treatment_plan', id, { status });
    return json({ success: true });
  } catch (err) { console.error(err); return json({ error: 'Failed to update treatment plan' }, 500); }
};
