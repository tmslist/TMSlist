import type { APIRoute } from 'astro';
import { sql, eq, and, gte, lte, desc } from 'drizzle-orm';
import { db } from '../../../db';
import { auditLog, users } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const action = url.searchParams.get('action');
    const entityType = url.searchParams.get('entityType');
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const limit = Math.max(1, Math.min(parseInt(url.searchParams.get('limit') || '50'), 200));
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0'));

    const conditions: any[] = [];

    if (userId) {
      conditions.push(eq(auditLog.userId, userId));
    }
    if (action) {
      conditions.push(eq(auditLog.action, action));
    }
    if (entityType) {
      conditions.push(eq(auditLog.entityType, entityType));
    }
    if (from) {
      conditions.push(gte(auditLog.createdAt, new Date(from)));
    }
    if (to) {
      conditions.push(lte(auditLog.createdAt, new Date(to)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [entries, countResult] = await Promise.all([
      db
        .select({
          id: auditLog.id,
          userId: auditLog.userId,
          action: auditLog.action,
          entityType: auditLog.entityType,
          entityId: auditLog.entityId,
          details: auditLog.details,
          createdAt: auditLog.createdAt,
          userEmail: users.email,
          userName: users.name,
        })
        .from(auditLog)
        .leftJoin(users, eq(auditLog.userId, users.id))
        .where(whereClause)
        .orderBy(desc(auditLog.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(auditLog)
        .where(whereClause),
    ]);

    // Get distinct actions, entity types, and users for filter dropdowns
    const [actions, entityTypes, distinctUsers] = await Promise.all([
      db.selectDistinct({ action: auditLog.action }).from(auditLog),
      db.selectDistinct({ entityType: auditLog.entityType }).from(auditLog),
      db
        .selectDistinct({
          userId: auditLog.userId,
          userEmail: users.email,
          userName: users.name,
        })
        .from(auditLog)
        .leftJoin(users, eq(auditLog.userId, users.id))
        .where(sql`${auditLog.userId} IS NOT NULL`),
    ]);

    return json({
      entries,
      total: Number(countResult[0]?.count ?? 0),
      limit,
      offset,
      filters: {
        actions: actions.map((a) => a.action).sort(),
        entityTypes: entityTypes.map((e) => e.entityType).sort(),
        users: distinctUsers
          .filter((u) => u.userEmail)
          .map((u) => ({ userId: u.userId, email: u.userEmail!, name: u.userName ?? null }))
          .sort((a, b) => a.email.localeCompare(b.email)),
      },
    });
  } catch (err) {
    console.error('Audit log error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};
