import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { subscriptions } from '../../../db/schema';
import { sql, eq, desc } from 'drizzle-orm';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

const PLAN_PRICES: Record<string, number> = { verified: 49, featured: 149, premium: 299 };

export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin')) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

  try {
    const [byPlan, byStatus, recent] = await Promise.all([
      db.select({ plan: subscriptions.plan, count: sql<number>`count(*)` }).from(subscriptions).where(eq(subscriptions.status, 'active')).groupBy(subscriptions.plan),
      db.select({ status: subscriptions.status, count: sql<number>`count(*)` }).from(subscriptions).groupBy(subscriptions.status),
      db.select().from(subscriptions).orderBy(desc(subscriptions.createdAt)).limit(10),
    ]);

    let mrr = 0;
    for (const p of byPlan) { mrr += Number(p.count) * (PLAN_PRICES[p.plan] || 0); }

    return new Response(JSON.stringify({ mrr, byPlan, byStatus, recent }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Admin revenue error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
