import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { users } from '../../../db/schema';
import { eq, sql } from 'drizzle-orm';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';
import { getCached } from '../../../utils/redis';

export const prerender = false;

/**
 * Get analytics stats for clinic owner's clinic.
 * Returns daily, weekly, and monthly stats.
 */
export const GET: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'clinic_owner', 'admin')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const user = await db.select().from(users).where(eq(users.id, session!.userId)).limit(1);
    const clinicId = url.searchParams.get('clinicId') || user[0]?.clinicId;

    if (!clinicId) {
      return new Response(JSON.stringify({ error: 'No clinic found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Try to get stats from DB
    const events = ['profile_view', 'phone_click', 'website_click', 'search_impression', 'lead_submit'];
    const stats: Record<string, { today: number; week: number; month: number; total: number }> = {};

    for (const event of events) {
      // Try DB first
      try {
        const result = await db.execute(sql`
          SELECT
            COALESCE(SUM(CASE WHEN event_date = CURRENT_DATE THEN count ELSE 0 END), 0) as today,
            COALESCE(SUM(CASE WHEN event_date >= CURRENT_DATE - INTERVAL '7 days' THEN count ELSE 0 END), 0) as week,
            COALESCE(SUM(CASE WHEN event_date >= CURRENT_DATE - INTERVAL '30 days' THEN count ELSE 0 END), 0) as month,
            COALESCE(SUM(count), 0) as total
          FROM clinic_analytics
          WHERE clinic_id = ${clinicId} AND event_type = ${event}
        `);
        const row = (result as any).rows?.[0] || (result as any)[0];
        stats[event] = {
          today: Number(row?.today ?? 0),
          week: Number(row?.week ?? 0),
          month: Number(row?.month ?? 0),
          total: Number(row?.total ?? 0),
        };
      } catch {
        // Fallback to Redis counts
        const today = new Date().toISOString().split('T')[0];
        const todayCount = await getCached<number>(`analytics:${clinicId}:${event}:${today}`) || 0;
        stats[event] = { today: todayCount, week: todayCount, month: todayCount, total: todayCount };
      }
    }

    return new Response(JSON.stringify({ clinicId, stats }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Analytics stats error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
