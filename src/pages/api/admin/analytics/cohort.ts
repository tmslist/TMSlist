import type { APIRoute } from 'astro';
import { eq, desc, sql, gte, and } from 'drizzle-orm';
import { db } from '../../../../db';
import { users, leads } from '../../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// Generate cohort month label from date
function cohortMonthLabel(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin', 'editor')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    // Get the last 12 months of cohort data
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 12);

    // Get monthly signup counts
    const signupCounts = await db.execute(sql`
      SELECT
        date_trunc('month', created_at)::date as cohort_month,
        COUNT(*)::int as cohort_size
      FROM users
      WHERE created_at >= ${cutoff}
      GROUP BY date_trunc('month', created_at)::date
      ORDER BY cohort_month
    `);

    const rows = (signupCounts as unknown as { rows: { cohort_month: string; cohort_size: number }[] })?.rows ?? [];

    if (rows.length === 0) {
      return json({ cohorts: [] });
    }

    const cohortMonths = rows.map((r) => ({
      month: cohortMonthLabel(new Date(r.cohort_month)),
      size: Number(r.cohort_size),
      date: new Date(r.cohort_month),
    }));

    // For each cohort, calculate retention at months 1-6
    const now = new Date();
    const cohorts = await Promise.all(
      cohortMonths.map(async (cohort) => {
        const retentionByMonth: (number | null)[] = [];

        for (let m = 1; m <= 6; m++) {
          const targetMonth = new Date(cohort.date);
          targetMonth.setMonth(targetMonth.getMonth() + m);

          // Don't calculate future retention
          if (targetMonth > now) {
            retentionByMonth.push(null);
            continue;
          }

          try {
            // Count users from this cohort who were active in this month
            // "Active" = had a lead submitted or login in that month
            const activeInMonth = await db.execute(sql`
              SELECT COUNT(DISTINCT user_id)::int as count
              FROM (
                SELECT user_id, created_at FROM auth_events WHERE created_at >= ${cohort.date} AND created_at < ${now}
                UNION ALL
                SELECT user_id::uuid, created_at FROM leads WHERE created_at >= ${cohort.date} AND created_at < ${now}
              ) combined
              WHERE created_at >= ${targetMonth}
                AND created_at < ${new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 1)}
                AND user_id IS NOT NULL
            `);

            const activeCount = Number((activeInMonth as unknown as { rows: { count: number }[] })?.rows?.[0]?.count ?? 0);
            const retention = cohort.size > 0 ? Math.round((activeCount / cohort.size) * 100) : 0;
            retentionByMonth.push(Math.min(retention, 100));
          } catch {
            retentionByMonth.push(null);
          }
        }

        // Churn rate = drop from month 1 to month 6
        const m1 = retentionByMonth[0];
        const m6 = retentionByMonth[5];
        const churnRate = m1 !== null && m6 !== null ? m1 - (m6 ?? m1) : null;

        return {
          cohortMonth: cohort.month,
          cohortSize: cohort.size,
          retentionByMonth,
          churnRate,
        };
      })
    );

    return json({ cohorts });
  } catch (err) {
    console.error('Cohort analytics error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};
