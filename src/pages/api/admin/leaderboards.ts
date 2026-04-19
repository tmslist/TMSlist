import type { APIRoute } from 'astro';
import { eq, desc, sql, and, gte } from 'drizzle-orm';
import { db } from '../../../db';
import { leaderboards, leads, reviews, auditLog } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// GET: List current leaderboards, or compute if none for current period
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin', 'editor')) return json({ error: 'Forbidden' }, 403);

  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type'); // 'leads' | 'rating' | 'fast_responder'
    const period = url.searchParams.get('period'); // 'weekly' | 'monthly'

    const conditions = [];
    if (type) conditions.push(eq(leaderboards.type, type));
    if (period) conditions.push(eq(leaderboards.period, period));

    const data = await db
      .select()
      .from(leaderboards)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(leaderboards.createdAt))
      .limit(10);

    return json({ data });
  } catch (err) {
    console.error('Leaderboards GET error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// POST: Compute leaderboard for a type and period
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const body = await request.json();
    const { type, period } = body;

    if (!type || !period) {
      return json({ error: 'type and period are required' }, 400);
    }

    if (!['leads', 'rating', 'fast_responder'].includes(type)) {
      return json({ error: 'type must be leads, rating, or fast_responder' }, 400);
    }
    if (!['weekly', 'monthly'].includes(period)) {
      return json({ error: 'period must be weekly or monthly' }, 400);
    }

    // Determine period boundaries
    const now = new Date();
    const periodEnd = now;
    const periodStart = new Date(now);
    if (period === 'weekly') {
      periodStart.setDate(periodStart.getDate() - 7);
    } else {
      periodStart.setMonth(periodStart.getMonth() - 1);
    }

    let entries: Array<{ entityId: string; entityType: string; score: number; rank: number }> = [];

    if (type === 'leads') {
      // Count leads per clinic in period
      const result = await db
        .select({
          entityId: leads.clinicId,
          score: sql<number>`count(*)`,
        })
        .from(leads)
        .where(gte(leads.createdAt, periodStart))
        .groupBy(leads.clinicId)
        .orderBy(desc(sql`count(*)`))
        .limit(100);

      entries = result.map((r, i) => ({
        entityId: r.entityId,
        entityType: 'clinic',
        score: Number(r.score),
        rank: i + 1,
      }));
    } else if (type === 'rating') {
      // Top rated clinics by average rating in period
      const result = await db
        .select({
          entityId: reviews.clinicId,
          score: sql<number>`round(avg(${reviews.rating})::numeric, 2)`,
        })
        .from(reviews)
        .where(and(gte(reviews.createdAt, periodStart), eq(reviews.approved, true)))
        .groupBy(reviews.clinicId)
        .orderBy(desc(sql`round(avg(${reviews.rating})::numeric, 2)`))
        .limit(100);

      entries = result.map((r, i) => ({
        entityId: r.entityId,
        entityType: 'clinic',
        score: Number(r.score),
        rank: i + 1,
      }));
    } else if (type === 'fast_responder') {
      // Clinics with most leads responded within 2 hours (estimated from leads with message)
      const result = await db
        .select({
          entityId: leads.clinicId,
          score: sql<number>`count(*)`,
        })
        .from(leads)
        .where(and(gte(leads.createdAt, periodStart), sql`${leads.clinicId} IS NOT NULL`))
        .groupBy(leads.clinicId)
        .orderBy(desc(sql`count(*)`))
        .limit(100);

      entries = result.map((r, i) => ({
        entityId: r.entityId,
        entityType: 'clinic',
        score: Number(r.score),
        rank: i + 1,
      }));
    }

    const [record] = await db.insert(leaderboards).values({
      type,
      period,
      periodStart,
      periodEnd,
      entries,
    }).returning();

    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'compute_leaderboard',
      entityType: 'leaderboard',
      entityId: record.id,
      details: { type, period, entries: entries.length },
    });

    return json({ success: true, data: record }, 201);
  } catch (err) {
    console.error('Leaderboards POST error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};