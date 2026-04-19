import type { APIRoute } from 'astro';
import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../../../../db';
import { doctors, clinics, doctorProfileViews, leads, reviews } from '../../../../db/schema';
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
    const doctorStats = await db.execute(sql`
      SELECT
        d.id,
        d.name,
        c.name as clinic_name,
        COALESCE(pv.view_count, 0)::int as profile_views,
        COALESCE(l.lead_count, 0)::int as lead_count,
        COALESCE(r.review_count, 0)::int as review_count
      FROM doctors d
      INNER JOIN clinics c ON c.id = d.clinic_id
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int as view_count
        FROM doctor_profile_views dpv
        WHERE dpv.doctor_id = d.id
      ) pv ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int as lead_count
        FROM leads l
        WHERE l.doctor_name ILIKE '%' || d.name || '%'
      ) l ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int as review_count
        FROM reviews rv
        WHERE rv.clinic_id = d.clinic_id AND rv.verified = true
      ) r ON true
      ORDER BY pv.view_count DESC NULLS LAST
      LIMIT 50
    `);

    const rows = (doctorStats as unknown as {
      rows: {
        id: string;
        name: string;
        clinic_name: string;
        profile_views: number;
        lead_count: number;
        review_count: number;
      };
    })?.rows ?? [];

    const doctorsData = rows
      .map((r) => {
        const profileViews = Number(r.profile_views);
        const leadCount = Number(r.lead_count);
        const reviewCount = Number(r.review_count);

        // Composite score: views * 0.4 + leads * 0.35 + reviews * 0.25
        const compositeScore = Math.round((profileViews * 0.4 + leadCount * 0.35 + reviewCount * 0.25) * 10) / 10;

        return {
          id: String(r.id),
          name: String(r.name),
          clinicName: String(r.clinic_name),
          profileViews,
          leadCount,
          reviewCount,
          compositeScore,
        };
      })
      .sort((a, b) => b.compositeScore - a.compositeScore);

    return json({ doctors: doctorsData });
  } catch (err) {
    console.error('Doctor performance error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};
