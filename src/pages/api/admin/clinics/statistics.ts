import type { APIRoute } from 'astro';
import { eq, count, and } from 'drizzle-orm';
import { db } from '../../../../db';
import { doctors, reviews, leads, savedClinics, locations } from '../../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../../utils/auth';
import { sql } from 'drizzle-orm';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin', 'editor')) return json({ error: 'Forbidden' }, 403);

  const url = new URL(request.url);
  const clinicId = url.searchParams.get('clinicId');
  if (!clinicId) return json({ error: 'clinicId required' }, 400);

  try {
    // Doctor count (clinicId is text on doctors table - use raw SQL for UUID clinics)
    const [doctorCount] = await db
      .select({ count: count() })
      .from(doctors)
      .where(sql`clinic_id = ${clinicId}`);

    // Review counts
    const [allReviews] = await db
      .select({ count: count() })
      .from(reviews)
      .where(eq(reviews.clinicId, clinicId));

    const [approvedReviews] = await db
      .select({ count: count() })
      .from(reviews)
      .where(and(eq(reviews.clinicId, clinicId), eq(reviews.approved, true)));

    // Lead count
    const [leadCount] = await db
      .select({ count: count() })
      .from(leads)
      .where(eq(leads.clinicId, clinicId));

    // Saved by users
    const [savedCount] = await db
      .select({ count: count() })
      .from(savedClinics)
      .where(eq(savedClinics.clinicId, clinicId));

    // Location count
    const [locationCount] = await db
      .select({ count: count() })
      .from(locations)
      .where(eq(locations.clinicId, clinicId));

    return json({
      data: {
        doctors: Number(doctorCount?.count ?? 0),
        reviews: Number(allReviews?.count ?? 0),
        approvedReviews: Number(approvedReviews?.count ?? 0),
        leads: Number(leadCount?.count ?? 0),
        savedByUsers: Number(savedCount?.count ?? 0),
        locations: Number(locationCount?.count ?? 0),
      },
    });
  } catch (err) {
    console.error('Clinic statistics error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};