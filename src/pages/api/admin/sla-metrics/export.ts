import type { APIRoute } from 'astro';
import { desc } from 'drizzle-orm';
import { db } from '../../../../db';
import { slaMetrics } from '../../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../../utils/auth.js';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const s = getSessionFromRequest(request);
  if (!s || !hasRole(s, 'admin')) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }
  try {
    const rows = await db.select().from(slaMetrics).orderBy(desc(slaMetrics.period));
    const header = 'period,uptime_percent,incident_count,total_downtime_minutes,affected_users,resolved_within_rto,compliance_status';
    const csv = [header, ...rows.map(r => [
      r.period,
      r.uptimePercent,
      r.incidentCount,
      r.totalDowntimeMinutes,
      r.affectedUsers,
      r.resolvedWithinRto,
      r.complianceStatus,
    ].join(','))].join('\n');
    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="sla-metrics-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err) {
    console.error('sla-metrics/export GET', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
