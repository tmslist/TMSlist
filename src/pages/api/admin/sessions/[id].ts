import type { APIRoute } from 'astro';
import { db } from '../../../../db';
import { sessions } from '../../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../../utils/auth';
import { eq } from 'drizzle-orm';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export const DELETE: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  const id = url.searchParams.get('id');
  const userId = url.searchParams.get('userId');
  const all = url.searchParams.get('all') === 'true';

  try {
    if (userId && all) {
      // Revoke ALL sessions for this user
      await db.update(sessions)
        .set({ revokedAt: new Date(), revokedBy: session.userId })
        .where(eq(sessions.userId, userId));
      return json({ success: true, revoked: 'all' });
    }

    if (!id) return json({ error: 'id or userId+all query param required' }, 400);

    await db.update(sessions)
      .set({ revokedAt: new Date(), revokedBy: session.userId })
      .where(eq(sessions.id, id));

    return json({ success: true });
  } catch (err) {
    console.error('Session delete error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};