import type { APIRoute } from 'astro';
import { getSessionFromRequest } from '../../../utils/auth';
import { db } from '../../../db';
import { notifications } from '../../../db/schema';
import { eq, desc, inArray, and, count } from 'drizzle-orm';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    const [items, unreadCount, totalCount] = await Promise.all([
      db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, session.userId))
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(notifications)
        .where(and(eq(notifications.userId, session.userId), eq(notifications.read, false))),
      db
        .select({ count: count() })
        .from(notifications)
        .where(eq(notifications.userId, session.userId)),
    ]);

    return new Response(
      JSON.stringify({
        notifications: items,
        unreadCount: unreadCount[0]?.count || 0,
        total: totalCount[0]?.count || 0,
        page,
        limit,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Portal notifications list error:', err);
    return new Response(JSON.stringify({ error: 'Failed to load notifications' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const ids: string[] = body.ids;

    if (!Array.isArray(ids) || ids.length === 0) {
      return new Response(JSON.stringify({ error: 'ids array required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Only mark notifications belonging to this user
    await db
      .update(notifications)
      .set({ read: true })
      .where(and(inArray(notifications.id, ids), eq(notifications.userId, session.userId)));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Portal notifications mark-read error:', err);
    return new Response(JSON.stringify({ error: 'Failed to mark notifications' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
