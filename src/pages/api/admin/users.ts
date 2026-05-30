import type { APIRoute } from 'astro';
import { eq, desc, isNull } from 'drizzle-orm';
import { db } from '../../../db';
import { users, sessions } from '../../../db/schema';
import { getSessionFromRequest, hasRole, invalidateAllUserSessions } from '../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        emailVerified: users.emailVerified,
        onboardingCompletedAt: users.onboardingCompletedAt,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(isNull(users.deletedAt))
      .orderBy(desc(users.createdAt))
      .limit(100);

    return json({ users: allUsers, total: allUsers.length });
  } catch (err) {
    console.error('Admin users GET error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) return json({ error: 'userId required' }, 400);
    if (userId === session.userId) return json({ error: 'Cannot delete your own account' }, 400);

    // Soft-delete user
    await db.update(users).set({ deletedAt: new Date() }).where(eq(users.id, userId));

    // Revoke all sessions for this user
    await db.update(sessions)
      .set({ revokedAt: new Date(), revokedBy: session.userId })
      .where(eq(sessions.userId, userId));

    return json({ success: true });
  } catch (err) {
    console.error('Admin users DELETE error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};
