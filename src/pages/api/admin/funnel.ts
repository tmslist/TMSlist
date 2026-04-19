import type { APIRoute } from 'astro';
import { desc, sql, gte, count } from 'drizzle-orm';
import { db } from '../../../db';
import { funnelEvents, leads } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// GET: Conversion funnel stages from funnel_events table or estimated from leads/clinics
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin', 'editor')) return json({ error: 'Forbidden' }, 403);

  try {
    const url = new URL(request.url);
    const days = Math.max(1, Math.min(parseInt(url.searchParams.get('days') || '30'), 365));
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Try funnel_events table first
    const funnelData = await db
      .select({
        step: funnelEvents.step,
        count: sql<number>`count(DISTINCT ${funnelEvents.sessionId})`.as('count'),
      })
      .from(funnelEvents)
      .where(gte(funnelEvents.createdAt, since))
      .groupBy(funnelEvents.step)
      .orderBy(sql`CASE
        WHEN ${funnelEvents.step} = 'search' THEN 1
        WHEN ${funnelEvents.step} = 'clinic_view' THEN 2
        WHEN ${funnelEvents.step} = 'lead_submit' THEN 3
        WHEN ${funnelEvents.step} = 'appointment_request' THEN 4
        WHEN ${funnelEvents.step} = 'conversion' THEN 5
        ELSE 99
      END`);

    if (funnelData.length > 0) {
      const total = Math.max(...funnelData.map(r => Number(r.count)));
      const steps = funnelData.map((r, i) => {
        const count = Number(r.count);
        const prevCount = i > 0 ? Number(funnelData[i - 1].count) : count;
        const dropoffRate = prevCount > 0 ? Math.round(((prevCount - count) / prevCount) * 100) : 0;
        return {
          name: r.step,
          count,
          dropoffRate,
        };
      });

      return json({ steps, source: 'funnel_events', days });
    }

    // Fallback: estimate from leads and clinics
    const [leadCount, clinicViewCount, conversionCount] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(leads).where(gte(leads.createdAt, since)),
      db.select({ count: sql<number>`count(*)` }).from(leads)
        .where(sql`${leads.createdAt} >= ${since} AND ${leads.clinicId} IS NOT NULL`),
      db.select({ count: sql<number>`count(*)` }).from(leads)
        .where(sql`${leads.createdAt} >= ${since} AND ${leads.type} = 'appointment_request'`),
    ]);

    const lc = Number(leadCount[0]?.count ?? 0);
    const cv = Number(clinicViewCount[0]?.count ?? 0);
    const cc = Number(conversionCount[0]?.count ?? 0);

    const steps = [
      { name: 'search', count: lc + cv, dropoffRate: 0 },
      { name: 'clinic_view', count: cv || Math.round(lc * 0.4), dropoffRate: 0 },
      { name: 'lead_submit', count: lc, dropoffRate: 0 },
      { name: 'appointment_request', count: cc || Math.round(lc * 0.2), dropoffRate: 0 },
      { name: 'conversion', count: cc, dropoffRate: 0 },
    ];

    // Calculate dropoff rates
    for (let i = 1; i < steps.length; i++) {
      steps[i].dropoffRate = steps[i - 1].count > 0
        ? Math.round(((steps[i - 1].count - steps[i].count) / steps[i - 1].count) * 100)
        : 0;
    }

    return json({ steps, source: 'leads_estimate', days });
  } catch (err) {
    console.error('Funnel GET error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};