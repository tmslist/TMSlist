import type { APIRoute } from 'astro';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';
import { db } from '../../../db';
import { doctors, cityWaitlists, users, auditLog } from '../../../db/schema';
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
    const waitlists = await db.select().from(cityWaitlists)
      .where(eq(cityWaitlists.doctorId, doctorId))
      .orderBy(desc(cityWaitlists.joinedAt));
    return json({ waitlists });
  } catch (err) { console.error(err); return json({ error: 'Failed to load city waitlists' }, 500); }
};

export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  const doctorCtx = await verifyDoctorAccess(session);
  if (!doctorCtx) return json({ error: 'Unauthorized' }, 401);
  try {
    const body = await request.json();
    const { city, state, country } = body;
    if (!city || !state) return json({ error: 'city and state are required' }, 400);
    let doctorId: string;
    if ('doctorId' in doctorCtx) doctorId = doctorCtx.doctorId;
    else return json({ error: 'Doctor not found' }, 404);
    // Check if already registered for this city
    const existing = await db.select().from(cityWaitlists)
      .where(and(
        eq(cityWaitlists.doctorId, doctorId),
        eq(cityWaitlists.city, city),
        eq(cityWaitlists.state, state)
      ))
      .limit(1);
    if (existing[0]) return json({ error: 'Already registered for this city' }, 400);
    const result = await db.insert(cityWaitlists).values({
      doctorId,
      city,
      state,
      country: country ?? 'US',
    }).returning();
    await logAudit(doctorCtx.userId, 'create', 'city_waitlist', result[0].id);
    return json(result[0], 201);
  } catch (err) { console.error(err); return json({ error: 'Failed to join waitlist' }, 500); }
};

export const DELETE: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  const doctorCtx = await verifyDoctorAccess(session);
  if (!doctorCtx) return json({ error: 'Unauthorized' }, 401);
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return json({ error: 'id is required' }, 400);
    let doctorId: string;
    if ('doctorId' in doctorCtx) doctorId = doctorCtx.doctorId;
    else return json({ error: 'Doctor not found' }, 404);
    await db.delete(cityWaitlists)
      .where(and(eq(cityWaitlists.id, id), eq(cityWaitlists.doctorId, doctorId)));
    await logAudit(doctorCtx.userId, 'delete', 'city_waitlist', id);
    return json({ success: true });
  } catch (err) { console.error(err); return json({ error: 'Failed to leave waitlist' }, 500); }
};
