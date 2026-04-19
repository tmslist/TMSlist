import type { APIRoute } from 'astro';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';
import { db } from '../../../db';
import { doctors, doctorOutcomes, users, auditLog } from '../../../db/schema';
import { eq, desc } from 'drizzle-orm';

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
    const outcomes = await db.select().from(doctorOutcomes)
      .where(eq(doctorOutcomes.doctorId, doctorId))
      .orderBy(desc(doctorOutcomes.recordedAt));
    return json({ outcomes });
  } catch (err) { console.error(err); return json({ error: 'Failed to load outcomes' }, 500); }
};

export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  const doctorCtx = await verifyDoctorAccess(session);
  if (!doctorCtx) return json({ error: 'Unauthorized' }, 401);
  try {
    const body = await request.json();
    const { metric, value, sampleSize, methodology } = body;
    if (!metric || value === undefined) return json({ error: 'metric and value are required' }, 400);
    let doctorId: string;
    if ('doctorId' in doctorCtx) doctorId = doctorCtx.doctorId;
    else return json({ error: 'Doctor not found' }, 404);
    const result = await db.insert(doctorOutcomes).values({
      doctorId,
      metric,
      value: String(value),
      sampleSize: sampleSize ?? 0,
      methodology: methodology ?? null,
    }).returning();
    await logAudit(doctorCtx.userId, 'create', 'doctor_outcome', result[0].id);
    return json(result[0], 201);
  } catch (err) { console.error(err); return json({ error: 'Failed to add outcome' }, 500); }
};
