import type { APIRoute } from 'astro';
import { sql, desc } from 'drizzle-orm';
import { db } from '../../../db';
import { clinics, leads, reviews } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// GET: Per-clinic performance metrics (views from PostHog or estimated, leads, reviews, rating)
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin', 'editor')) return json({ error: 'Forbidden' }, 403);

  try {
    const url = new URL(request.url);
    const days = Math.max(1, Math.min(parseInt(url.searchParams.get('days') || '30'), 365));
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString();

    const result = await db.execute(sql`
      WITH clinic_stats AS (
        SELECT
          c.id,
          c.name,
          c.city,
          c.state,
          COALESCE(c.rating_avg::numeric, 0) AS rating,
          COALESCE(c.review_count, 0) AS review_count,
          (
            SELECT count(*)
            FROM leads l
            WHERE l.clinic_id = c.id
              AND l.created_at >= ${sinceStr}::timestamptz
          ) AS lead_count,
          (
            SELECT count(*)
            FROM reviews r
            WHERE r.clinic_id = c.id
              AND r.created_at >= ${sinceStr}::timestamptz
              AND r.approved = true
          ) AS new_reviews
      )
      SELECT
        id,
        name,
        city,
        state,
        rating,
        review_count,
        lead_count,
        new_reviews,
        -- Estimate profile views: leads * 10 + reviews * 20 (conservative PostHog estimate)
        (lead_count * 10 + new_reviews * 20) AS profile_views,
        -- Tier: gold (>50 leads, >4.5 rating), silver (>20 leads), bronze (rest)
        CASE
          WHEN lead_count > 50 AND rating >= 4.5 THEN 'gold'
          WHEN lead_count > 20 THEN 'silver'
          WHEN review_count > 10 THEN 'silver'
          ELSE 'bronze'
        END AS tier
      FROM clinic_stats
      ORDER BY lead_count DESC, rating DESC
      LIMIT 100
    `);

    const clinics_data = (result as any).rows?.map((r: any) => ({
      id: r.id,
      name: r.name,
      location: `${r.city}, ${r.state}`,
      profileViews: Number(r.profile_views),
      leads: Number(r.lead_count),
      reviews: Number(r.new_reviews),
      rating: Number(r.rating),
      tier: r.tier,
    })) ?? [];

    return json({ clinics: clinics_data, days });
  } catch (err) {
    console.error('Clinic performance GET error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};