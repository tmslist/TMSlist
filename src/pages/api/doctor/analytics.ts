import type { APIRoute } from 'astro';
import { eq, sql, count, avg, desc } from 'drizzle-orm';
import { db } from '../../../db';
import { doctorProfileViews, reviews, leads } from '../../../db/schema';
import { getSessionFromRequest } from '../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// GET: return analytics data
export const GET: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!session.clinicId) return json({ error: 'No clinic linked' }, 403);

  try {
    const period = url.searchParams.get('period') || 'weekly';
    const clinicId = url.searchParams.get('clinicId') || session.clinicId;

    const { doctors } = await import('../../../db/schema');
    const docRows = await db.select({ id: doctors.id }).from(doctors).where(eq(doctors.clinicId, clinicId)).limit(1);
    const doctorId = docRows[0]?.id;

    const [viewsData, leadsCount, reviewsData] = await Promise.all([
      doctorId ? db.select({
        date: sql<string>`DATE(${doctorProfileViews.viewedAt})`,
        count: sql<number>`COUNT(*)`,
      }).from(doctorProfileViews)
        .where(eq(doctorProfileViews.doctorId, doctorId))
        .groupBy(sql`DATE(${doctorProfileViews.viewedAt})`)
        .orderBy(desc(sql`DATE(${doctorProfileViews.viewedAt})`))
        .limit(period === 'monthly' ? 30 : 12) : [],
      db.select({ count: count() }).from(leads).where(eq(leads.clinicId, clinicId)),
      db.select({ count: count(), avg: avg(reviews.rating) }).from(reviews).where(eq(reviews.clinicId, clinicId)),
    ]);

    return json({
      profileViews: viewsData,
      totalViews: viewsData.reduce((a, v) => a + Number(v.count), 0),
      leadsCount: Number(leadsCount[0]?.count ?? 0),
      reviewsCount: Number(reviewsData[0]?.count ?? 0),
      avgRating: reviewsData[0]?.avg ? parseFloat(String(reviewsData[0].avg)) : null,
    });
  } catch (err) {
    console.error('Doctor analytics GET error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};
