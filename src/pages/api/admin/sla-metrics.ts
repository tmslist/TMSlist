import type { APIRoute } from 'astro';
import { desc } from 'drizzle-orm';
import { db } from '../../../db';
import { slaMetrics } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth.js';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

const guard = (request: Request) => {
  const s = getSessionFromRequest(request);
  return !s || !hasRole(s, 'admin') ? json({ error: 'Forbidden' }, 403) : null;
};

export const GET: APIRoute = async ({ request }) => {
  const denied = guard(request); if (denied) return denied;
  try {
    const rows = await db.select().from(slaMetrics).orderBy(desc(slaMetrics.period)).limit(36);
    return json({ data: rows });
  } catch (err) { console.error('sla-metrics GET', err); return json({ error: 'Internal server error' }, 500); }
};

export const POST: APIRoute = async ({ request }) => {
  const denied = guard(request); if (denied) return denied;
  try {
    const body = await request.json();
    if (!body?.period) return json({ error: 'period required' }, 400);
    const [row] = await db.insert(slaMetrics).values({
      period: body.period,
      uptimePercent: String(body.uptimePercent ?? '100'),
      incidentCount: body.incidentCount ?? 0,
      totalDowntimeMinutes: body.totalDowntimeMinutes ?? 0,
      affectedUsers: body.affectedUsers ?? 0,
      resolvedWithinRto: body.resolvedWithinRto ?? true,
      complianceStatus: body.complianceStatus || 'met',
    }).returning();
    return json({ data: row }, 201);
  } catch (err) { console.error('sla-metrics POST', err); return json({ error: 'Internal server error' }, 500); }
};
