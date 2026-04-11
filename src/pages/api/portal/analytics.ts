import type { APIRoute } from 'astro';
import { getSessionFromRequest } from '../../../utils/auth';
import { db } from '../../../db';
import { leads, reviews, users } from '../../../db/schema';
import { eq, avg, count, sql, and, gte } from 'drizzle-orm';

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
    const userRows = await db
      .select({ clinicId: users.clinicId })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);
    const clinicId = userRows[0]?.clinicId;

    if (!clinicId) {
      return new Response(JSON.stringify({ error: 'No clinic linked' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [leadsByMonth, reviewsByMonth, avgRating] = await Promise.all([
      // Leads grouped by month
      db
        .select({
          month: sql<string>`to_char(${leads.createdAt}, 'YYYY-MM')`,
          count: count(),
        })
        .from(leads)
        .where(and(eq(leads.clinicId, clinicId), gte(leads.createdAt, sixMonthsAgo)))
        .groupBy(sql`to_char(${leads.createdAt}, 'YYYY-MM')`)
        .orderBy(sql`to_char(${leads.createdAt}, 'YYYY-MM')`),

      // Reviews grouped by month
      db
        .select({
          month: sql<string>`to_char(${reviews.createdAt}, 'YYYY-MM')`,
          count: count(),
          avgRating: avg(reviews.rating),
        })
        .from(reviews)
        .where(and(eq(reviews.clinicId, clinicId), gte(reviews.createdAt, sixMonthsAgo)))
        .groupBy(sql`to_char(${reviews.createdAt}, 'YYYY-MM')`)
        .orderBy(sql`to_char(${reviews.createdAt}, 'YYYY-MM')`),

      // Overall average rating
      db
        .select({ avg: avg(reviews.rating) })
        .from(reviews)
        .where(eq(reviews.clinicId, clinicId)),
    ]);

    // Build the last 6 months array for consistent display
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push(d.toISOString().slice(0, 7)); // YYYY-MM
    }

    const leadsMap = Object.fromEntries(leadsByMonth.map((r) => [r.month, Number(r.count)]));
    const reviewsMap = Object.fromEntries(reviewsByMonth.map((r) => [r.month, { count: Number(r.count), avgRating: r.avgRating ? parseFloat(String(r.avgRating)) : null }]));

    const leadCounts = months.map((m) => ({ month: m, count: leadsMap[m] || 0 }));
    const reviewCounts = months.map((m) => ({
      month: m,
      count: reviewsMap[m]?.count || 0,
      avgRating: reviewsMap[m]?.avgRating || null,
    }));

    return new Response(
      JSON.stringify({
        months,
        leadCounts,
        reviewCounts,
        overallAvgRating: avgRating[0]?.avg ? parseFloat(String(avgRating[0].avg)) : 0,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Portal analytics error:', err);
    return new Response(JSON.stringify({ error: 'Failed to load analytics' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
