import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { doctors, users } from '../../../db/schema';
import { getSessionFromRequest } from '../../../utils/auth.js';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);

  try {
    const [user] = await db
      .select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    let doctor: typeof doctors.$inferSelect | null = null;
    if (session.clinicId) {
      const rows = await db.select().from(doctors).where(eq(doctors.clinicId, session.clinicId)).limit(1);
      doctor = rows[0] ?? null;
    }

    return json({
      doctorName: doctor?.name || user?.name || user?.email || '',
      photoUrl: doctor?.imageUrl || null,
      clinicId: session.clinicId || null,
      doctorId: doctor?.id || null,
    });
  } catch (err) {
    console.error('Doctor dashboard GET error:', err);
    return json({ error: 'Failed to load dashboard' }, 500);
  }
};
