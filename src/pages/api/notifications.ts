import type { APIRoute } from 'astro';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { notifications } from '../../db/schema';
import { getSessionFromRequest } from '../../utils/auth.js';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const GET: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);

  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10) || 20, 100);
  const unreadOnly = url.searchParams.get('unread') === 'true';

  try {
    const where = unreadOnly
      ? and(eq(notifications.userId, session.userId), eq(notifications.read, false))
      : eq(notifications.userId, session.userId);

    const rows = await db.select().from(notifications)
      .where(where)
      .orderBy(desc(notifications.createdAt))
      .limit(limit);

    return json({ notifications: rows });
  } catch (err) {
    console.error('Notifications GET error:', err);
    return json({ error: 'Failed to load notifications' }, 500);
  }
};

export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);

  let body: { id?: string; markAllRead?: boolean };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  try {
    if (body.markAllRead) {
      await db.update(notifications)
        .set({ read: true })
        .where(and(eq(notifications.userId, session.userId), eq(notifications.read, false)));
      return json({ success: true });
    }

    if (!body.id) return json({ error: 'id required' }, 400);

    await db.update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.id, body.id), eq(notifications.userId, session.userId)));

    return json({ success: true });
  } catch (err) {
    console.error('Notifications PUT error:', err);
    return json({ error: 'Failed to update notification' }, 500);
  }
};
