import type { APIRoute } from 'astro';
import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../../../../db';
import { clinics, leads, reviews, subscriptions } from '../../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin', 'editor')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    // Get all clinics with their profile views, leads, reviews
    const clinicStats = await db.execute(sql`
      SELECT
        c.id,
        c.name,
        c.city,
        c.state,
        COALESCE(pv.view_count, 0)::int as profile_views,
        COALESCE(l.lead_count, 0)::int as lead_count,
        COALESCE(r.review_count, 0)::int as review_count,
        c.rating_avg,
        c.review_count as actual_review_count,
        sub.plan as subscription_tier
      FROM clinics c
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int as view_count
        FROM doctor_profile_views dpv
        WHERE dpv.doctor_id IN (
          SELECT id FROM doctors d WHERE d.clinic_id = c.id
        )
      ) pv ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int as lead_count
        FROM leads l
        WHERE l.clinic_id = c.id
      ) l ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int as review_count
        FROM reviews r
        WHERE r.clinic_id = c.id AND r.verified = true
      ) r ON true
      LEFT JOIN LATERAL (
        SELECT s.plan
        FROM subscriptions s
        WHERE s.clinic_id = c.id AND s.status = 'active'
        ORDER BY s.created_at DESC
        LIMIT 1
      ) sub ON true
      WHERE c.deleted_at IS NULL
      ORDER BY c.created_at DESC
      LIMIT 50
    `);

    const rows = (clinicStats as unknown as {
      rows: {
        id: string;
        name: string;
        city: string;
        state: string;
        profile_views: number;
        lead_count: number;
        review_count: number;
        rating_avg: string | null;
        actual_review_count: number;
        subscription_tier: string | null;
      };
    })?.rows ?? [];

    const metrics = rows
      .map((r) => {
        const profileViews = Number(r.profile_views);
        const leadCount = Number(r.lead_count);
        const reviewCount = Number(r.review_count);
        const avgRating = r.rating_avg ? parseFloat(String(r.rating_avg)) : null;

        // Composite score: weighted sum of normalized metrics
        const maxViews = 1000, maxLeads = 100, maxReviews = 50;
        const viewScore = Math.min(profileViews / maxViews, 1) * 40;
        const leadScore = Math.min(leadCount / maxLeads, 1) * 35;
        const reviewScore = Math.min(reviewCount / maxReviews, 1) * 15;
        const ratingScore = avgRating ? Math.min((avgRating - 3) / 2, 1) * 10 : 0;
        const compositeScore = Math.round((viewScore + leadScore + reviewScore + ratingScore) * 10) / 10;

        return {
          id: String(r.id),
          name: String(r.name),
          city: String(r.city),
          state: String(r.state),
          profileViews,
          leadCount,
          reviewCount: Number(r.review_count ?? r.actual_review_count ?? 0),
          avgRating,
          subscriptionTier: r.subscription_tier ? String(r.subscription_tier) : null,
          compositeScore,
        };
      })
      .sort((a, b) => b.compositeScore - a.compositeScore);

    return json({ metrics });
  } catch (err) {
    console.error('Clinic performance error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};
