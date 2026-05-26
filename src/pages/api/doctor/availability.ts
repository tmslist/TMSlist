import type { APIRoute } from 'astro';
import { eq, and } from 'drizzle-orm';
import { db } from '../..//../db/index.js';
import { doctorAvailability, doctors } from '../../../db/schema';
import { getSessionFromRequest } from '../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

async function getDoctorIdForSession(clinicId: string): Promise<string | null> {
  const rows = await db.select({ id: doctors.id }).from(doctors).where(eq(doctors.clinicId, clinicId)).limit(1);
  return rows[0]?.id ?? null;
}

// GET: list availability slots
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!session.clinicId) return json({ error: 'No clinic linked' }, 403);

  try {
    const doctorId = await getDoctorIdForSession(session.clinicId);
    if (!doctorId) return json({ slots: [] });

    const slots = await db.select().from(doctorAvailability).where(eq(doctorAvailability.doctorId, doctorId));
    return json({ slots });
  } catch (err) {
    console.error('Availability GET error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// POST: create availability slot
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!session.clinicId) return json({ error: 'No clinic linked' }, 403);

  try {
    const body = await request.json();
    const { dayOfWeek, startTime, endTime } = body;
    if (dayOfWeek == null || !startTime || !endTime) return json({ error: 'Missing fields' }, 400);

    const doctorId = await getDoctorIdForSession(session.clinicId);
    if (!doctorId) return json({ error: 'No doctor record found' }, 404);

    const [slot] = await db.insert(doctorAvailability).values({
      doctorId,
      dayOfWeek: Number(dayOfWeek),
      startTime,
      endTime,
      isActive: true,
    }).returning();

    return json({ id: slot.id }, 201);
  } catch (err) {
    console.error('Availability POST error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// DELETE: remove availability slot
export const DELETE: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!session.clinicId) return json({ error: 'No clinic linked' }, 403);

  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'Slot ID required' }, 400);

  try {
    const doctorId = await getDoctorIdForSession(session.clinicId);
    if (!doctorId) return json({ error: 'No doctor record found' }, 404);

    const result = await db.delete(doctorAvailability)
      .where(and(eq(doctorAvailability.id, id), eq(doctorAvailability.doctorId, doctorId)))
      .returning({ id: doctorAvailability.id });
    if (result.length === 0) return json({ error: 'Slot not found' }, 404);
    return json({ success: true });
  } catch (err) {
    console.error('Availability DELETE error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// PUT: update a slot
export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!session.clinicId) return json({ error: 'No clinic linked' }, 403);

  try {
    const body = await request.json();
    const { id, startTime, endTime, isActive } = body;
    if (!id) return json({ error: 'ID required' }, 400);

    const doctorId = await getDoctorIdForSession(session.clinicId);
    if (!doctorId) return json({ error: 'No doctor record found' }, 404);

    const updates: Record<string, unknown> = {};
    if (startTime !== undefined) updates.startTime = startTime;
    if (endTime !== undefined) updates.endTime = endTime;
    if (isActive !== undefined) updates.isActive = isActive;

    const result = await db.update(doctorAvailability).set(updates)
      .where(and(eq(doctorAvailability.id, id), eq(doctorAvailability.doctorId, doctorId)))
      .returning({ id: doctorAvailability.id });
    if (result.length === 0) return json({ error: 'Slot not found' }, 404);
    return json({ success: true });
  } catch (err) {
    console.error('Availability PUT error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};
