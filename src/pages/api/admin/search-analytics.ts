import type { APIRoute } from 'astro';
import { desc, sql, gte } from 'drizzle-orm';
import { db } from '../../../db';
import { searchQueries, leads } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// GET: Top search queries from search_queries table (or estimate from leads with no clinicId)
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin', 'editor')) return json({ error: 'Forbidden' }, 403);

  try {
    const url = new URL(request.url);
    const days = Math.max(1, Math.min(parseInt(url.searchParams.get('days') || '30'), 365));
    const limit = Math.max(1, Math.min(parseInt(url.searchParams.get('limit') || '50'), 200));
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Try search_queries table first
    const searchData = await db
      .select({
        query: searchQueries.query,
        count: sql<number>`count(*)`.as('count'),
        avgResults: sql<number>`round(avg(${searchQueries.resultCount})::numeric, 1)`.as('avg_results'),
        zeroResultCount: sql<number>`count(*) FILTER (WHERE ${searchQueries.resultCount} = 0)`.as('zero_result_count'),
      })
      .from(searchQueries)
      .where(gte(searchQueries.createdAt, since))
      .groupBy(searchQueries.query)
      .orderBy(desc(sql`count(*)`))
      .limit(limit);

    if (searchData.length > 0) {
      return json({
        queries: searchData.map(r => ({
          query: r.query,
          count: Number(r.count),
          avgResults: Number(r.avgResults),
          zeroResultCount: Number(r.zeroResultCount),
        })),
        source: 'search_queries',
        days,
      });
    }

    // Fallback: estimate from leads with no clinicId (unmatched searches)
    const leadsData = await db
      .select({
        query: sql<string>`COALESCE(${leads.clinicName}, ${leads.doctorName}, 'unknown')`.as('query'),
        count: sql<number>`count(*)`.as('count'),
        avgResults: sql<number>`round(avg(0)::numeric, 1)`.as('avg_results'),
        zeroResultCount: sql<number>`count(*) FILTER (WHERE ${leads.clinicId} IS NULL)`.as('zero_result_count'),
      })
      .from(leads)
      .where(gte(leads.createdAt, since))
      .groupBy(sql`COALESCE(${leads.clinicName}, ${leads.doctorName}, 'unknown')`)
      .orderBy(desc(sql`count(*)`))
      .limit(limit);

    return json({
      queries: leadsData.map(r => ({
        query: r.query,
        count: Number(r.count),
        avgResults: Number(r.avgResults),
        zeroResultCount: Number(r.zeroResultCount),
      })),
      source: 'leads_estimate',
      days,
    });
  } catch (err) {
    console.error('Search analytics GET error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};