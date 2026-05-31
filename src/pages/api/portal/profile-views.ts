import type { APIRoute } from 'astro';
import { validateSessionStrict } from '../../../utils/auth';
import { db } from '../../../db';
import { users, doctors, doctorProfileViews } from '../../../db/schema';
import { eq, sql, desc } from 'drizzle-orm';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

// GET /api/portal/profile-views — returns profile view data for the authenticated clinic owner.
export const GET: APIRoute = async ({ request }) => {
  const session = validateSessionStrict(request);

  try {
    const userRows = await db.select({ clinicId: users.clinicId })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);
    const clinicId = userRows[0]?.clinicId;

    if (!clinicId) {
      return json({ totalViews: 0, monthlyTrend: [] });
    }

    // Get all doctors for this clinic
    const clinicDoctors = await db.select({ id: doctors.id })
      .from(doctors)
      .where(eq(doctors.clinicId, clinicId));

    const doctorIds = clinicDoctors.map(d => d.id);

    if (doctorIds.length === 0) {
      return json({ totalViews: 0, monthlyTrend: [] });
    }

    // Get total views for all clinic doctors
    const totalResult = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(doctorProfileViews)
      .where(sql`${doctorProfileViews.doctorId} = ANY(${doctorIds})`);

    const totalViews = totalResult[0]?.total ?? 0;

    // Get monthly trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyViews = await db
      .select({
        month: sql<string>`to_char(${doctorProfileViews.createdAt}, 'YYYY-MM')`,
        count: sql<number>`count(*)::int`,
      })
      .from(doctorProfileViews)
      .where(sql`${doctorProfileViews.doctorId} = ANY(${doctorIds}) AND ${doctorProfileViews.createdAt} >= ${sixMonthsAgo.toISOString()}`)
      .groupBy(sql`to_char(${doctorProfileViews.createdAt}, 'YYYY-MM')`)
      .orderBy(desc(sql`to_char(${doctorProfileViews.createdAt}, 'YYYY-MM')`));

    // Fill in missing months with 0
    const monthlyTrend = getFilledMonthlyTrend(monthlyViews, 6);

    return json({ totalViews, monthlyTrend });
  } catch (err) {
    console.error('[GET /api/portal/profile-views]', err);
    return json({ error: 'Failed to load profile views' }, 500);
  }
};

function getFilledMonthlyTrend(data: { month: string; count: number }[], months: number) {
  const result = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const found = data.find(r => r.month === monthKey);
    result.push({
      month: monthKey,
      count: found?.count ?? 0,
    });
  }

  return result;
}