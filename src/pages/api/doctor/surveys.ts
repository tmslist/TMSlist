import type { APIRoute } from 'astro';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';
import { db } from '../../../db';
import { doctors, patientSurveys, surveyResponses, users, auditLog } from '../../../db/schema';
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
    const url = new URL(request.url);
    const surveyId = url.searchParams.get('surveyId');
    let doctorId: string;
    if ('doctorId' in doctorCtx) doctorId = doctorCtx.doctorId;
    else return json({ error: 'Doctor not found' }, 404);
    if (surveyId) {
      const responses = await db.select().from(surveyResponses)
        .where(eq(surveyResponses.surveyId, surveyId))
        .orderBy(desc(surveyResponses.completedAt));
      return json({ responses });
    }
    const surveys = await db.select().from(patientSurveys)
      .where(eq(patientSurveys.doctorId, doctorId))
      .orderBy(desc(patientSurveys.createdAt));
    return json({ surveys });
  } catch (err) { console.error(err); return json({ error: 'Failed to load surveys' }, 500); }
};

export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  const doctorCtx = await verifyDoctorAccess(session);
  if (!doctorCtx) return json({ error: 'Unauthorized' }, 401);
  try {
    const body = await request.json();
    const { type, name, questions } = body;
    if (!type || !name) return json({ error: 'type and name are required' }, 400);
    const validTypes = ['phq9', 'gad7', 'custom'];
    if (!validTypes.includes(type)) return json({ error: `type must be one of: ${validTypes.join(', ')}` }, 400);
    let doctorId: string;
    if ('doctorId' in doctorCtx) doctorId = doctorCtx.doctorId;
    else return json({ error: 'Doctor not found' }, 404);
    const result = await db.insert(patientSurveys).values({
      doctorId,
      type,
      name,
      questions: questions ?? null,
      isActive: true,
    }).returning();
    await logAudit(doctorCtx.userId, 'create', 'patient_survey', result[0].id);
    return json(result[0], 201);
  } catch (err) { console.error(err); return json({ error: 'Failed to create survey' }, 500); }
};
