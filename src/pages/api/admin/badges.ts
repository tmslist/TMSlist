import type { APIRoute } from 'astro';
import { eq, desc, sql, and } from 'drizzle-orm';
import { db } from '../../../db';
import { clinicBadges, doctorBadges, auditLog } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// GET: List clinic badges and doctor badges
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin', 'editor')) return json({ error: 'Forbidden' }, 403);

  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type'); // 'clinic' | 'doctor' | 'all'
    const entityId = url.searchParams.get('entityId');

    if (type === 'clinic' || !type) {
      const clinicBadgesData = await db
        .select()
        .from(clinicBadges)
        .where(entityId ? eq(clinicBadges.clinicId, entityId) : undefined)
        .orderBy(desc(clinicBadges.earnedAt));
      if (type === 'clinic') return json({ data: clinicBadgesData });
    }

    if (type === 'doctor' || !type) {
      const doctorBadgesData = await db
        .select()
        .from(doctorBadges)
        .where(entityId ? eq(doctorBadges.doctorId, entityId) : undefined)
        .orderBy(desc(doctorBadges.earnedAt));
      if (type === 'doctor') return json({ data: doctorBadgesData });
    }

    const [clinics, doctors] = await Promise.all([
      db.select().from(clinicBadges).orderBy(desc(clinicBadges.earnedAt)).limit(200),
      db.select().from(doctorBadges).orderBy(desc(doctorBadges.earnedAt)).limit(200),
    ]);

    return json({ data: { clinicBadges: clinics, doctorBadges: doctors } });
  } catch (err) {
    console.error('Badges GET error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// POST: Award badge to clinic or doctor
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin', 'editor')) return json({ error: 'Forbidden' }, 403);

  try {
    const body = await request.json();
    const { clinicId, doctorId, badge } = body;

    if (!badge) return json({ error: 'badge is required' }, 400);

    if (clinicId) {
      // Check for duplicate
      const existing = await db
        .select()
        .from(clinicBadges)
        .where(and(eq(clinicBadges.clinicId, clinicId), eq(clinicBadges.badge, badge)))
        .limit(1);

      if (existing[0]) return json({ error: 'Badge already awarded to this clinic' }, 409);

      const [record] = await db.insert(clinicBadges).values({ clinicId, badge }).returning();

      await db.insert(auditLog).values({
        userId: session.userId,
        action: 'award_clinic_badge',
        entityType: 'clinic_badge',
        entityId: record.id,
        details: { clinicId, badge },
      });

      return json({ success: true, data: record }, 201);
    }

    if (doctorId) {
      const existing = await db
        .select()
        .from(doctorBadges)
        .where(and(eq(doctorBadges.doctorId, doctorId), eq(doctorBadges.badge, badge)))
        .limit(1);

      if (existing[0]) return json({ error: 'Badge already awarded to this doctor' }, 409);

      const [record] = await db.insert(doctorBadges).values({ doctorId, badge }).returning();

      await db.insert(auditLog).values({
        userId: session.userId,
        action: 'award_doctor_badge',
        entityType: 'doctor_badge',
        entityId: record.id,
        details: { doctorId, badge },
      });

      return json({ success: true, data: record }, 201);
    }

    return json({ error: 'clinicId or doctorId is required' }, 400);
  } catch (err) {
    console.error('Badges POST error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// DELETE: Remove badge
export const DELETE: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const id = url.searchParams.get('id');
    const type = url.searchParams.get('type'); // 'clinic' | 'doctor'
    if (!id || !type) return json({ error: 'id and type are required' }, 400);

    if (type === 'clinic') {
      await db.delete(clinicBadges).where(eq(clinicBadges.id, id));
    } else if (type === 'doctor') {
      await db.delete(doctorBadges).where(eq(doctorBadges.id, id));
    }

    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'remove_badge',
      entityType: `${type}_badge`,
      entityId: id,
    });

    return json({ success: true });
  } catch (err) {
    console.error('Badges DELETE error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};