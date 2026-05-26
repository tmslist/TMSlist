import type { APIRoute } from 'astro';
import { desc, gte, sql } from 'drizzle-orm';
import { db } from '../../../db';
import { aiUsageLogs } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth.js';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export const GET: APIRoute = async ({ request, url }) => {
  const s = getSessionFromRequest(request);
  if (!s || !hasRole(s, 'admin')) return json({ error: 'Forbidden' }, 403);
  try {
    const days = Math.min(Math.max(parseInt(url.searchParams.get('days') || '30') || 30, 1), 365);
    const since = new Date(); since.setDate(since.getDate() - days);
    const [rows, totals] = await Promise.all([
      db.select().from(aiUsageLogs).where(gte(aiUsageLogs.createdAt, since)).orderBy(desc(aiUsageLogs.createdAt)).limit(500),
      db.select({
        calls: sql<number>`count(*)`,
        promptTokens: sql<number>`coalesce(sum(${aiUsageLogs.promptTokens}), 0)`,
        completionTokens: sql<number>`coalesce(sum(${aiUsageLogs.completionTokens}), 0)`,
        totalCostCents: sql<number>`coalesce(sum(${aiUsageLogs.costCents}), 0)`,
      }).from(aiUsageLogs).where(gte(aiUsageLogs.createdAt, since)),
    ]);
    return json({
      data: rows,
      totals: {
        calls: Number(totals[0]?.calls ?? 0),
        promptTokens: Number(totals[0]?.promptTokens ?? 0),
        completionTokens: Number(totals[0]?.completionTokens ?? 0),
        totalCostCents: Number(totals[0]?.totalCostCents ?? 0),
      },
    });
  } catch (err) { console.error('ai-usage-logs GET', err); return json({ error: 'Internal server error' }, 500); }
};
