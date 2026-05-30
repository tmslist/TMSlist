import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { sessions, users } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';
import { eq, desc, isNull } from 'drizzle-orm';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const activeSessions = await db
      .select({
        id: sessions.id,
        userId: sessions.userId,
        userEmail: users.email,
        userName: users.name,
        userRole: users.role,
        createdAt: sessions.createdAt,
        expiresAt: sessions.expiresAt,
        lastUsedAt: sessions.lastUsedAt,
        ipAddress: sessions.ipAddress,
        userAgent: sessions.userAgent,
      })
      .from(sessions)
      .leftJoin(users, eq(sessions.userId, users.id))
      .where(isNull(sessions.revokedAt))
      .orderBy(desc(sessions.createdAt))
      .limit(100);

    return json({ sessions: activeSessions, total: activeSessions.length });
  } catch (err) {
    console.error('Sessions GET error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};