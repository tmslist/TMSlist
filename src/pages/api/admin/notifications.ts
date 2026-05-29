import type { APIRoute } from 'astro';
import { getAdminNotifications, getUnreadNotificationCount, markNotificationRead, markAllNotificationsRead, createNotification } from '../../../db/queries';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin', 'editor')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20'), 100);

  try {
    const [notifications, unreadCount] = await Promise.all([
      getAdminNotifications(limit),
      getUnreadNotificationCount(),
    ]);
    return new Response(JSON.stringify({ notifications, unreadCount }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};

export const PATCH: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const body = await request.json();

    if (body.markAllRead) {
      await markAllNotificationsRead();
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    if (body.id) {
      const updated = await markNotificationRead(body.id);
      return new Response(JSON.stringify({ notification: updated[0] }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: 'id or markAllRead required' }), { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const body = await request.json();
    const notification = await createNotification(body);
    return new Response(JSON.stringify({ notification }), { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};