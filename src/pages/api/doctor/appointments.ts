import type { APIRoute } from 'astro';
import { eq, desc } from 'drizzle-orm';
import { db } from '../../../db';
import { doctorAppointments, doctorWaitlist } from '../../../db/schema';
import { getSessionFromRequest } from '../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// GET: list appointments
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!session.clinicId) return json({ error: 'No clinic linked' }, 403);

  try {
    const { doctors } = await import('../../../db/schema');
    const docRows = await db.select({ id: doctors.id }).from(doctors).where(eq(doctors.clinicId, session.clinicId)).limit(1);
    const doctorId = docRows[0]?.id;
    if (!doctorId) return json({ appointments: [], waitlist: [] });

    const [appointments, waitlist] = await Promise.all([
      db.select().from(doctorAppointments).where(eq(doctorAppointments.doctorId, doctorId)).orderBy(desc(doctorAppointments.scheduledAt)),
      db.select().from(doctorWaitlist).where(eq(doctorWaitlist.doctorId, doctorId)).orderBy(desc(doctorWaitlist.createdAt)),
    ]);

    return json({ appointments, waitlist });
  } catch (err) {
    console.error('Appointments GET error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// PUT: update appointment status
export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);

  try {
    const body = await request.json();
    const { id, status } = body;
    if (!id || !status) return json({ error: 'ID and status required' }, 400);

    const valid = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'];
    if (!valid.includes(status)) return json({ error: 'Invalid status' }, 400);

    await db.update(doctorAppointments).set({ status }).where(eq(doctorAppointments.id, id));
    return json({ success: true });
  } catch (err) {
    console.error('Appointments PUT error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// POST: create waitlist entry
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);

  try {
    const body = await request.json();
    const { patientName, patientEmail, patientPhone } = body;
    if (!patientName) return json({ error: 'Patient name required' }, 400);

    const { doctors } = await import('../../../db/schema');
    const docRows = await db.select({ id: doctors.id }).from(doctors).where(eq(doctors.clinicId, session.clinicId)).limit(1);
    if (!docRows[0]) return json({ error: 'No doctor record' }, 404);

    const [entry] = await db.insert(doctorWaitlist).values({
      doctorId: docRows[0].id,
      patientName,
      patientEmail: patientEmail || null,
      patientPhone: patientPhone || null,
    }).returning();

    return json({ id: entry.id }, 201);
  } catch (err) {
    console.error('Waitlist POST error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};
