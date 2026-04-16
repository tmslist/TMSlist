import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../../db';
import { users, auditLog } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const SESSION_EXPIRY_VALUES = ['1h', '8h', '24h', '30d'] as const;

/**
 * PUT /api/admin/user-session-expiry?id=<userId>
 * Update session expiry setting for a user.
 * Requires: admin role.
 */
export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return json({ error: 'Unauthorized' }, 401);
  }
  if (!hasRole(session, 'admin')) {
    return json({ error: 'Forbidden' }, 403);
  }

  const url = new URL(request.url);
  const targetUserId = url.searchParams.get('id');
  if (!targetUserId) {
    return json({ error: 'User ID required' }, 400);
  }

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUserId)) {
    return json({ error: 'Invalid user ID format' }, 400);
  }

  const body = await request.json();
  const parsed = z.object({
    sessionExpiry: z.enum(SESSION_EXPIRY_VALUES),
  }).safeParse(body);

  if (!parsed.success) {
    return json({ error: 'sessionExpiry must be one of: 1h, 8h, 24h, 30d' }, 400);
  }

  await db.update(users).set({ sessionExpiry: parsed.data.sessionExpiry, updatedAt: new Date() }).where(eq(users.id, targetUserId));

  // Audit log
  await db.insert(auditLog).values({
    userId: session.userId,
    action: 'session_expiry_changed',
    entityType: 'user',
    entityId: targetUserId,
    details: { sessionExpiry: parsed.data.sessionExpiry },
  });

  return json({ success: true, sessionExpiry: parsed.data.sessionExpiry });
};

/**
 * GET /api/admin/user-session-expiry?id=<userId>
 * Get session expiry setting for a user (admin role required).
 */
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return json({ error: 'Unauthorized' }, 401);
  }
  if (!hasRole(session, 'admin')) {
    return json({ error: 'Forbidden' }, 403);
  }

  const url = new URL(request.url);
  const targetUserId = url.searchParams.get('id');
  if (!targetUserId) {
    return json({ error: 'User ID required' }, 400);
  }

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUserId)) {
    return json({ error: 'Invalid user ID format' }, 400);
  }

  const result = await db
    .select({ sessionExpiry: users.sessionExpiry, email: users.email, name: users.name })
    .from(users)
    .where(eq(users.id, targetUserId))
    .limit(1);

  if (!result[0]) {
    return json({ error: 'User not found' }, 404);
  }

  return json({
    userId: targetUserId,
    email: result[0].email,
    name: result[0].name,
    sessionExpiry: result[0].sessionExpiry ?? '8h',
  });
};
