import type { APIRoute } from 'astro';
import { eq, desc, count, and, gte, lte, sql } from 'drizzle-orm';
import { db } from '../../../db';
import { authEvents, users } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth.js';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// GET /api/admin/auth-events — List auth events with filters
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const userId = url.searchParams.get('userId');
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10)));
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10));

    const conditions = [];
    if (action) conditions.push(eq(authEvents.action, action));
    if (userId) conditions.push(eq(authEvents.userId, userId));
    if (dateFrom) conditions.push(gte(authEvents.createdAt, new Date(dateFrom)));
    if (dateTo) conditions.push(lte(authEvents.createdAt, new Date(dateTo)));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, [{ total }]] = await Promise.all([
      db.select({
        id: authEvents.id,
        userId: authEvents.userId,
        action: authEvents.action,
        ipAddress: authEvents.ipAddress,
        userAgent: authEvents.userAgent,
        metadata: authEvents.metadata,
        createdAt: authEvents.createdAt,
 userEmail: users.email,
        userName: users.name,
      })
        .from(authEvents)
        .leftJoin(users, eq(authEvents.userId, users.id))
        .where(whereClause)
        .orderBy(desc(authEvents.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(authEvents).where(whereClause),
    ]);

    return json({ data: rows, total, limit, offset });
  } catch (err) {
    console.error('Auth events error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// POST /api/admin/auth-events — Log a new auth event (admin-triggered or manual)
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const body = await request.json();
    const { userId, action, ipAddress, userAgent, metadata } = body;

    if (!userId || !action) {
      return json({ error: 'userId and action are required' }, 400);
    }

    const validActions = [
      'login_success', 'login_failed', 'logout', 'password_reset_requested',
      'password_reset_completed', '2fa_enabled', '2fa_disabled', 'mfa_setup_completed',
      'magic_link_sent', 'magic_link_used', 'api_key_created', 'api_key_revoked',
      'account_locked', 'account_unlocked', 'email_changed', 'password_changed',
    ];
    if (!validActions.includes(action)) {
      return json({ error: `Invalid action. Must be one of: ${validActions.join(', ')}` }, 400);
    }

    const [event] = await db.insert(authEvents).values({
      userId,
      action,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      metadata: metadata || null,
    }).returning();

    return json({ success: true, event }, 201);
  } catch (err) {
    console.error('Auth events POST error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};
