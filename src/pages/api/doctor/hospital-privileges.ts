import type { APIRoute } from 'astro';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';
import { db } from '../../../db';
import { doctors, hospitalPrivileges, users, auditLog } from '../../../db/schema';
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
    const privileges = await db.select().from(hospitalPrivileges)
      .where(eq(hospitalPrivileges.doctorId, doctorId))
      .orderBy(desc(hospitalPrivileges.createdAt));
    return json({ privileges });
  } catch (err) { console.error(err); return json({ error: 'Failed to load hospital privileges' }, 500); }
};

export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  const doctorCtx = await verifyDoctorAccess(session);
  if (!doctorCtx) return json({ error: 'Unauthorized' }, 401);
  try {
    const body = await request.json();
    const { hospitalName, department, privilegeType } = body;
    if (!hospitalName) return json({ error: 'hospitalName is required' }, 400);
    let doctorId: string;
    if ('doctorId' in doctorCtx) doctorId = doctorCtx.doctorId;
    else return json({ error: 'Doctor not found' }, 404);
    const result = await db.insert(hospitalPrivileges).values({
      doctorId,
      hospitalName,
      department: department ?? null,
      privilegeType: privilegeType ?? null,
    }).returning();
    await logAudit(doctorCtx.userId, 'create', 'hospital_privilege', result[0].id);
    return json(result[0], 201);
  } catch (err) { console.error(err); return json({ error: 'Failed to add hospital privilege' }, 500); }
};

export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  const doctorCtx = await verifyDoctorAccess(session);
  if (!doctorCtx) return json({ error: 'Unauthorized' }, 401);
  try {
    const body = await request.json();
    const { id, verified } = body;
    if (!id) return json({ error: 'id is required' }, 400);
    let doctorId: string;
    if ('doctorId' in doctorCtx) doctorId = doctorCtx.doctorId;
    else return json({ error: 'Doctor not found' }, 404);
    const updateData: Record<string, unknown> = {};
    if (body.hospitalName !== undefined) updateData.hospitalName = body.hospitalName;
    if (body.department !== undefined) updateData.department = body.department;
    if (body.privilegeType !== undefined) updateData.privilegeType = body.privilegeType;
    if (verified) updateData.verifiedAt = new Date();
    await db.update(hospitalPrivileges)
      .set(updateData)
      .where(and(eq(hospitalPrivileges.id, id), eq(hospitalPrivileges.doctorId, doctorId)));
    await logAudit(doctorCtx.userId, 'update', 'hospital_privilege', id);
    return json({ success: true });
  } catch (err) { console.error(err); return json({ error: 'Failed to update hospital privilege' }, 500); }
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
    await db.delete(hospitalPrivileges)
      .where(and(eq(hospitalPrivileges.id, id), eq(hospitalPrivileges.doctorId, doctorId)));
    await logAudit(doctorCtx.userId, 'delete', 'hospital_privilege', id);
    return json({ success: true });
  } catch (err) { console.error(err); return json({ error: 'Failed to delete hospital privilege' }, 500); }
};
