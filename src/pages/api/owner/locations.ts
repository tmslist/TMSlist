import type { APIRoute } from 'astro';
import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../../../db';
import { clinics, reviews, leads, users } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

/**
 * Multi-location management API.
 * Enterprise plan owners can manage multiple clinic locations.
 */
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'clinic_owner', 'admin')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const user = await db.select().from(users).where(eq(users.id, session!.userId)).limit(1);
    const primaryClinicId = user[0]?.clinicId;

    if (!primaryClinicId) {
      return new Response(JSON.stringify({ error: 'No clinic linked' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get the primary clinic's email to find all linked locations
    const primaryClinic = await db.select().from(clinics).where(eq(clinics.id, primaryClinicId)).limit(1);
    if (!primaryClinic[0]) {
      return new Response(JSON.stringify({ error: 'Clinic not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Find all clinics with matching email (multi-location orgs share email)
    const email = primaryClinic[0].email;
    let allLocations;

    if (session!.role === 'admin') {
      // Admin can specify a group
      allLocations = [primaryClinic[0]];
    } else if (email) {
      allLocations = await db.select().from(clinics)
        .where(eq(clinics.email, email))
        .orderBy(clinics.name);
    } else {
      allLocations = [primaryClinic[0]];
    }

    // Get aggregated stats for all locations
    const locationIds = allLocations.map(l => l.id);
    const statsPromises = locationIds.map(async (id) => {
      const [reviewStats, leadStats] = await Promise.all([
        db.select({
          count: sql<number>`count(*)`,
          avgRating: sql<number>`COALESCE(avg(rating), 0)`,
        }).from(reviews).where(and(eq(reviews.clinicId, id), eq(reviews.approved, true))),
        db.select({
          total: sql<number>`count(*)`,
          thisMonth: sql<number>`count(*) filter (where ${leads.createdAt} > now() - interval '30 days')`,
        }).from(leads).where(eq(leads.clinicId, id)),
      ]);

      return {
        clinicId: id,
        reviews: Number(reviewStats[0]?.count ?? 0),
        avgRating: Number(reviewStats[0]?.avgRating ?? 0),
        totalLeads: Number(leadStats[0]?.total ?? 0),
        monthlyLeads: Number(leadStats[0]?.thisMonth ?? 0),
      };
    });

    const stats = await Promise.all(statsPromises);
    const statsMap = Object.fromEntries(stats.map(s => [s.clinicId, s]));

    // Aggregate totals
    const totals = {
      locations: allLocations.length,
      totalReviews: stats.reduce((sum, s) => sum + s.reviews, 0),
      avgRating: stats.length > 0 ? stats.reduce((sum, s) => sum + s.avgRating, 0) / stats.length : 0,
      totalLeads: stats.reduce((sum, s) => sum + s.totalLeads, 0),
      monthlyLeads: stats.reduce((sum, s) => sum + s.monthlyLeads, 0),
    };

    return new Response(JSON.stringify({
      locations: allLocations.map(l => ({
        ...l,
        stats: statsMap[l.id] || null,
      })),
      totals,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Multi-location fetch error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
