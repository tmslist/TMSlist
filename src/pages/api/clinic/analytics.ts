import type { APIRoute } from 'astro';
import { sql, gte, eq, and, desc } from 'drizzle-orm';
import { db } from '../../../db';
import { leads, reviews, clinics } from '../../../db/schema';
import { getSessionFromRequest } from '../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

/**
 * GET /api/clinic/analytics?clinicId=xxx&days=30
 *
 * Returns clinic-level analytics: leads, reviews, page views, and trends.
 * Accessible by: admin (any clinic), or clinic_owner (own clinic only).
 */
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session || !['admin', 'clinic_owner'].includes(session.role)) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const url = new URL(request.url);
  const clinicId = url.searchParams.get('clinicId');
  const daysParam = url.searchParams.get('days');
  const days = daysParam ? parseInt(daysParam) : 30;

  if (!clinicId) {
    return json({ error: 'clinicId is required' }, 400);
  }

  // Clinic owners can only view their own clinic
  if (session.role === 'clinic_owner' && session.clinicId !== clinicId) {
    return json({ error: 'Forbidden' }, 403);
  }

  try {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const prevSince = new Date();
    prevSince.setDate(prevSince.getDate() - days * 2);

    // Fetch clinic info
    const [clinicInfo] = await db
      .select({ name: clinics.name, isFeatured: clinics.isFeatured, subscriptionTier: clinics.subscriptionTier })
      .from(clinics)
      .where(eq(clinics.id, clinicId))
      .limit(1);

    if (!clinicInfo) {
      return json({ error: 'Clinic not found' }, 404);
    }

    // Run all analytics queries in parallel
    const [
      leadsByDay,
      leadsByType,
      reviewsByDay,
      totalLeads,
      prevPeriodLeads,
      totalReviews,
      prevPeriodReviews,
      recentLeads,
      recentReviews,
    ] = await Promise.all([
      // Leads by day for current period
      db
        .select({
          day: sql<string>`date_trunc('day', ${leads.createdAt})::date`.as('day'),
          count: sql<number>`count(*)`.as('count'),
        })
        .from(leads)
        .where(and(
          eq(leads.clinicId, clinicId),
          gte(leads.createdAt, since),
        ))
        .groupBy(sql`date_trunc('day', ${leads.createdAt})::date`)
        .orderBy(sql`day`),

      // Leads by type for current period
      db
        .select({
          type: leads.type,
          count: sql<number>`count(*)`.as('count'),
        })
        .from(leads)
        .where(and(
          eq(leads.clinicId, clinicId),
          gte(leads.createdAt, since),
        ))
        .groupBy(leads.type),

      // Reviews by day
      db
        .select({
          day: sql<string>`date_trunc('day', ${reviews.createdAt})::date`.as('day'),
          count: sql<number>`count(*)`.as('count'),
        })
        .from(reviews)
        .where(and(
          eq(reviews.clinicId, clinicId),
          gte(reviews.createdAt, since),
        ))
        .groupBy(sql`date_trunc('day', ${reviews.createdAt})::date`)
        .orderBy(sql`day`),

      // Total leads current period
      db
        .select({ count: sql<number>`count(*)` })
        .from(leads)
        .where(and(
          eq(leads.clinicId, clinicId),
          gte(leads.createdAt, since),
        )),

      // Total leads previous period
      db
        .select({ count: sql<number>`count(*)` })
        .from(leads)
        .where(and(
          eq(leads.clinicId, clinicId),
          gte(leads.createdAt, prevSince),
          sql`${leads.createdAt} < ${since}`,
        )),

      // Total reviews current period
      db
        .select({ count: sql<number>`count(*)` })
        .from(reviews)
        .where(and(
          eq(reviews.clinicId, clinicId),
          gte(reviews.createdAt, since),
        )),

      // Total reviews previous period
      db
        .select({ count: sql<number>`count(*)` })
        .from(reviews)
        .where(and(
          eq(reviews.clinicId, clinicId),
          gte(reviews.createdAt, prevSince),
          sql`${reviews.createdAt} < ${since}`,
        )),

      // Recent leads (last 10)
      db
        .select({
          id: leads.id,
          type: leads.type,
          name: leads.name,
          email: leads.email,
          message: leads.message,
          createdAt: leads.createdAt,
        })
        .from(leads)
        .where(eq(leads.clinicId, clinicId))
        .orderBy(desc(leads.createdAt))
        .limit(10),

      // Recent reviews (last 10)
      db
        .select({
          id: reviews.id,
          rating: reviews.rating,
          comment: reviews.comment,
          reviewerName: reviews.reviewerName,
          approved: reviews.approved,
          createdAt: reviews.createdAt,
        })
        .from(reviews)
        .where(eq(reviews.clinicId, clinicId))
        .orderBy(desc(reviews.createdAt))
        .limit(10),
    ]);

    const currentLeads = Number(totalLeads[0]?.count ?? 0);
    const prevLeads = Number(prevPeriodLeads[0]?.count ?? 0);
    const currentReviews = Number(totalReviews[0]?.count ?? 0);
    const prevReviews = Number(prevPeriodReviews[0]?.count ?? 0);

    const leadsChange = prevLeads > 0
      ? Math.round(((currentLeads - prevLeads) / prevLeads) * 100)
      : currentLeads > 0 ? 100 : 0;

    const reviewsChange = prevReviews > 0
      ? Math.round(((currentReviews - prevReviews) / prevReviews) * 100)
      : currentReviews > 0 ? 100 : 0;

    return json({
      clinic: {
        id: clinicId,
        name: clinicInfo.name,
        isFeatured: clinicInfo.isFeatured,
        subscriptionTier: clinicInfo.subscriptionTier,
      },
      overview: {
        leads: { count: currentLeads, change: leadsChange },
        reviews: { count: currentReviews, change: reviewsChange },
      },
      leadsByDay,
      leadsByType,
      reviewsByDay,
      recentLeads,
      recentReviews,
      days,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[clinic/analytics]', err);
    return json({ error: 'Internal server error' }, 500);
  }
};
