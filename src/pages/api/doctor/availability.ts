import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '../../../db';
import { doctorAvailability } from '../../../db/schema';
import { getSessionFromRequest } from '../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

function doctorFromSession(session: { clinicId?: string | null }) {
  // We look up doctor via clinicId in the GET handler
  return null as { id: string } | null;
}

// GET: list availability slots
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!session.clinicId) return json({ error: 'No clinic linked' }, 403);

  try {
    const doctorRows = await db.select({ id: doctorAvailability.doctorId }).from(doctorAvailability)
      .where(eq(doctorAvailability.doctorId, session.clinicId as unknown as any)).limit(1);

    const slots = await db.select().from(doctorAvailability).where(eq(doctorAvailability.doctorId, doctorRows[0]?.doctorId as unknown as any));
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

    // Look up doctor by clinicId
    const { doctors } = await import('../../../db/schema');
    const docRows = await db.select({ id: doctors.id }).from(doctors).where(eq(doctors.clinicId, session.clinicId)).limit(1);
    if (!docRows[0]) return json({ error: 'No doctor record found' }, 404);

    const [slot] = await db.insert(doctorAvailability).values({
      doctorId: docRows[0].id,
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

  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'Slot ID required' }, 400);

  try {
    await db.delete(doctorAvailability).where(eq(doctorAvailability.id, id));
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

  try {
    const body = await request.json();
    const { id, startTime, endTime, isActive } = body;
    if (!id) return json({ error: 'ID required' }, 400);

    const updates: Record<string, unknown> = {};
    if (startTime !== undefined) updates.startTime = startTime;
    if (endTime !== undefined) updates.endTime = endTime;
    if (isActive !== undefined) updates.isActive = isActive;

    await db.update(doctorAvailability).set(updates).where(eq(doctorAvailability.id, id));
    return json({ success: true });
  } catch (err) {
    console.error('Availability PUT error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};
