import type { APIRoute } from 'astro';
import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../../../db';
import { apiErrors, auditLog } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// GET: API error rates grouped by route/method/status
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const url = new URL(request.url);
    const days = Math.max(1, Math.min(parseInt(url.searchParams.get('days') || '7'), 90));
    const since = new Date();
    since.setDate(since.getDate() - days);

    const errors = await db
      .select({
        route: apiErrors.route,
        method: apiErrors.method,
        errorType: apiErrors.errorType,
        statusCode: apiErrors.statusCode,
        count: apiErrors.count,
        firstSeenAt: apiErrors.firstSeenAt,
        lastSeenAt: apiErrors.lastSeenAt,
      })
      .from(apiErrors)
      .where(sql`${apiErrors.lastSeenAt} >= ${since}`)
      .orderBy(desc(apiErrors.count));

    const total = errors.reduce((acc, e) => acc + Number(e.count), 0);

    return json({ data: errors, total, days });
  } catch (err) {
    console.error('Error rates GET error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// PUT: Record a new error (batch upsert by route+method+status to increment count)
export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const body = await request.json();
    const { route, method, errorType, statusCode } = body;

    if (!route || !method || !errorType) {
      return json({ error: 'route, method, and errorType are required' }, 400);
    }

    const existing = await db
      .select()
      .from(apiErrors)
      .where(sql`${apiErrors.route} = ${route} AND ${apiErrors.method} = ${method} AND ${apiErrors.errorType} = ${errorType}`)
      .limit(1);

    let record;
    if (existing[0]) {
      [record] = await db
        .update(apiErrors)
        .set({
          count: existing[0].count + 1,
          statusCode: statusCode ?? existing[0].statusCode,
          lastSeenAt: new Date(),
        })
        .where(sql`${apiErrors.route} = ${route} AND ${apiErrors.method} = ${method} AND ${apiErrors.errorType} = ${errorType}`)
        .returning();
    } else {
      [record] = await db
        .insert(apiErrors)
        .values({
          route,
          method,
          errorType,
          statusCode: statusCode ?? null,
          count: 1,
          firstSeenAt: new Date(),
          lastSeenAt: new Date(),
        })
        .returning();
    }

    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'record_api_error',
      entityType: 'api_error',
      entityId: record.id,
      details: { route, method, errorType },
    });

    return json({ success: true, data: record });
  } catch (err) {
    console.error('Error rates PUT error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};