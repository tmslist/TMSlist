import type { APIRoute } from 'astro';
import { eq, desc, sql, and, gte } from 'drizzle-orm';
import { db } from '../../../db';
import { webVitals, auditLog } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// GET: Web vitals from web_vitals table, filterable by page/metric
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin', 'editor')) return json({ error: 'Forbidden' }, 403);

  try {
    const url = new URL(request.url);
    const page = url.searchParams.get('page');
    const metric = url.searchParams.get('metric');
    const days = Math.max(1, Math.min(parseInt(url.searchParams.get('days') || '30'), 90));
    const limit = Math.max(1, Math.min(parseInt(url.searchParams.get('limit') || '100'), 500));
    const since = new Date();
    since.setDate(since.getDate() - days);

    const conditions = [gte(webVitals.recordedAt, since)];
    if (page) conditions.push(eq(webVitals.page, page) as any);
    if (metric) conditions.push(eq(webVitals.metric, metric) as any);

    const vitals = await db
      .select({
        id: webVitals.id,
        page: webVitals.page,
        metric: webVitals.metric,
        p75: webVitals.p75,
        p95: webVitals.p95,
        sampleSize: webVitals.sampleSize,
        recordedAt: webVitals.recordedAt,
      })
      .from(webVitals)
      .where(and(...conditions))
      .orderBy(desc(webVitals.recordedAt))
      .limit(limit);

    // Aggregate by page + metric for summary view
    const summary = await db
      .select({
        page: webVitals.page,
        metric: webVitals.metric,
        p75: sql`round(avg(${webVitals.p75})::numeric, 3)`.as('p75'),
        p95: sql`round(avg(${webVitals.p95})::numeric, 3)`.as('p95'),
        sampleSize: sql`sum(${webVitals.sampleSize})`.as('sample_size'),
        recordedAt: sql`max(${webVitals.recordedAt})`.as('recorded_at'),
      })
      .from(webVitals)
      .where(and(...conditions))
      .groupBy(webVitals.page, webVitals.metric)
      .orderBy(webVitals.page);

    return json({
      vitals: vitals.map(v => ({
        page: v.page,
        metric: v.metric,
        p75: Number(v.p75),
        p95: Number(v.p95),
        sampleSize: Number(v.sampleSize),
        recordedAt: v.recordedAt,
      })),
      summary: summary.map(s => ({
        page: s.page,
        metric: s.metric,
        p75: Number(s.p75),
        p95: Number(s.p95),
        sampleSize: Number(s.sampleSize),
        recordedAt: s.recordedAt,
      })),
      days,
    });
  } catch (err) {
    console.error('Web vitals GET error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};