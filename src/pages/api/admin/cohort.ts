import type { APIRoute } from 'astro';
import { sql } from 'drizzle-orm';
import { db } from '../../../db';
import { users } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// GET: Cohort analysis from users table (signup month groups, retention at months 1-6)
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const url = new URL(request.url);
    const maxMonths = Math.max(1, Math.min(parseInt(url.searchParams.get('maxMonths') || '6'), 12));

    // Group users by signup month
    const cohorts = await db.execute(sql`
      WITH monthly_signups AS (
        SELECT
          date_trunc('month', created_at)::date AS cohort_month,
          id,
          created_at
        FROM users
        WHERE deleted_at IS NULL
      ),
      cohort_counts AS (
        SELECT
          cohort_month,
          count(*) AS cohort_size
        FROM monthly_signups
        GROUP BY cohort_month
        ORDER BY cohort_month DESC
        LIMIT 18
      ),
      retention_data AS (
        SELECT
          s.cohort_month,
          u.created_at AS activity_month,
          count(DISTINCT u.id) AS retained_users
        FROM monthly_signups s
        JOIN users u ON u.id = s.id
          AND u.created_at >= s.cohort_month
          AND u.created_at < s.cohort_month + (${maxMonths} || ' months')::interval
        GROUP BY s.cohort_month, date_trunc('month', u.created_at)
      ),
      retention_rates AS (
        SELECT
          r.cohort_month,
          r.activity_month,
          c.cohort_size,
          r.retained_users,
          round((r.retained_users::numeric / c.cohort_size) * 100, 1) AS retention_rate
        FROM retention_data r
        JOIN cohort_counts c ON c.cohort_month = r.cohort_month
      )
      SELECT
        cohort_month,
        cohort_size,
        json_object_agg(
          'm' || extract(month FROM activity_month - cohort_month)::int,
          retention_rate
        ) FILTER (WHERE extract(month FROM activity_month - cohort_month) <= ${maxMonths}) AS retention
      FROM retention_rates
      GROUP BY cohort_month, cohort_size
      ORDER BY cohort_month DESC
    `);

    const rows = (cohorts as any).rows?.map((r: any) => ({
      month: r.cohort_month,
      size: Number(r.cohort_size),
      retention: r.retention ?? {},
    })) ?? [];

    return json({ cohorts: rows, maxMonths });
  } catch (err) {
    console.error('Cohort GET error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};