import type { APIRoute } from 'astro';
import { getSessionFromRequest } from '../../../utils/auth';
import { db } from '../../../db';
import { clinics, reviews, leads, users } from '../../../db/schema';
import { eq, desc, avg, count } from 'drizzle-orm';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Look up user to get clinicId
    const userRows = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
    const user = userRows[0];

    if (!user || !user.clinicId) {
      return new Response(JSON.stringify({ needsClaim: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const clinicId = user.clinicId;

    // Fetch clinic info, reviews, leads, and stats in parallel
    const [clinicRows, recentReviews, recentLeads, reviewStats, leadStats] = await Promise.all([
      db.select({
        id: clinics.id,
        name: clinics.name,
        city: clinics.city,
        state: clinics.state,
        verified: clinics.verified,
      }).from(clinics).where(eq(clinics.id, clinicId)).limit(1),

      db.select().from(reviews)
        .where(eq(reviews.clinicId, clinicId))
        .orderBy(desc(reviews.createdAt))
        .limit(5),

      db.select().from(leads)
        .where(eq(leads.clinicId, clinicId))
        .orderBy(desc(leads.createdAt))
        .limit(5),

      db.select({
        avgRating: avg(reviews.rating),
        reviewCount: count(reviews.id),
      }).from(reviews).where(eq(reviews.clinicId, clinicId)),

      db.select({
        leadCount: count(leads.id),
      }).from(leads).where(eq(leads.clinicId, clinicId)),
    ]);

    const clinic = clinicRows[0];
    if (!clinic) {
      return new Response(JSON.stringify({ needsClaim: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      clinic,
      recentReviews,
      recentLeads,
      stats: {
        reviewCount: reviewStats[0]?.reviewCount || 0,
        avgRating: reviewStats[0]?.avgRating ? parseFloat(String(reviewStats[0].avgRating)) : 0,
        leadCount: leadStats[0]?.leadCount || 0,
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Portal dashboard error:', err);
    return new Response(JSON.stringify({ error: 'Failed to load dashboard' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
