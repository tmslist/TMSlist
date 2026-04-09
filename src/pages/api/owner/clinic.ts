import type { APIRoute } from 'astro';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../../../db';
import { clinics, reviews, leads, users, auditLog } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';
import { invalidateCache } from '../../../utils/redis';
import { sql } from 'drizzle-orm';

export const prerender = false;

/** Get clinic owner's clinic data + stats */
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'clinic_owner', 'admin')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Get the user's linked clinic
    const user = await db.select().from(users).where(eq(users.id, session!.userId)).limit(1);
    const clinicId = user[0]?.clinicId;

    if (!clinicId) {
      return new Response(JSON.stringify({ error: 'No clinic linked to your account' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch clinic, reviews, and lead stats in parallel
    const [clinicData, clinicReviews, leadStats] = await Promise.all([
      db.select().from(clinics).where(eq(clinics.id, clinicId)).limit(1),
      db.select().from(reviews)
        .where(and(eq(reviews.clinicId, clinicId), eq(reviews.approved, true)))
        .orderBy(desc(reviews.createdAt))
        .limit(20),
      db.select({
        total: sql<number>`count(*)`,
        thisMonth: sql<number>`count(*) filter (where ${leads.createdAt} > now() - interval '30 days')`,
        thisWeek: sql<number>`count(*) filter (where ${leads.createdAt} > now() - interval '7 days')`,
      }).from(leads).where(eq(leads.clinicId, clinicId)),
    ]);

    if (!clinicData[0]) {
      return new Response(JSON.stringify({ error: 'Clinic not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      clinic: clinicData[0],
      reviews: clinicReviews,
      leadStats: {
        total: Number(leadStats[0]?.total ?? 0),
        thisMonth: Number(leadStats[0]?.thisMonth ?? 0),
        thisWeek: Number(leadStats[0]?.thisWeek ?? 0),
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Owner clinic fetch error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/** Update clinic owner's own clinic */
export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'clinic_owner', 'admin')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const user = await db.select().from(users).where(eq(users.id, session!.userId)).limit(1);
    const clinicId = user[0]?.clinicId;

    if (!clinicId) {
      return new Response(JSON.stringify({ error: 'No clinic linked to your account' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();

    // Clinic owners can only edit certain fields (not verified, isFeatured, etc.)
    const ownerEditableFields = [
      'phone', 'website', 'email', 'description', 'descriptionLong',
      'machines', 'specialties', 'insurances', 'openingHours',
      'accessibility', 'availability', 'pricing',
    ] as const;

    const safeUpdates: Record<string, unknown> = { updatedAt: new Date() };
    for (const key of ownerEditableFields) {
      if (key in body) {
        safeUpdates[key] = body[key];
      }
    }

    if (Object.keys(safeUpdates).length <= 1) {
      return new Response(JSON.stringify({ error: 'No valid fields to update' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await db.update(clinics).set(safeUpdates).where(eq(clinics.id, clinicId));

    // Audit log
    await db.insert(auditLog).values({
      userId: session!.userId,
      action: 'owner_update_clinic',
      entityType: 'clinic',
      entityId: clinicId,
      details: { fields: Object.keys(safeUpdates).filter(k => k !== 'updatedAt') },
    });

    // Invalidate cached data for this clinic
    await invalidateCache('search:*');
    await invalidateCache(`nearby:*`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Owner clinic update error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
