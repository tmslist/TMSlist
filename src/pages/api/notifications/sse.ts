import type { APIRoute } from 'astro';
import { validateSessionStrict } from '../../../utils/auth';
import { db } from '../../../db';
import { notifications } from '../../../db/schema';
import { eq, and, inArray } from 'drizzle-orm';

interface PendingNotification {
  type: string;
  title: string;
  message?: string;
}

const connections = new Map<string, Set<ReadableStreamDefaultController>>();

function broadcastToUser(userId: string, notification: PendingNotification) {
  const userConnections = connections.get(userId);
  if (!userConnections) return;

  const data = JSON.stringify({
    type: notification.type,
    title: notification.title,
    message: notification.message || null,
    createdAt: new Date().toISOString(),
  });
  const encoder = new TextEncoder();
  const chunk = `data: ${data}\n\n`;

  // Collect dead controllers first, then delete after iteration (S-3)
  const dead: ReadableStreamDefaultController[] = [];
  for (const controller of userConnections) {
    try {
      controller.enqueue(encoder.encode(chunk));
    } catch {
      dead.push(controller);
    }
  }
  for (const controller of dead) {
    userConnections.delete(controller);
  }

  if (userConnections.size === 0) {
    connections.delete(userId);
  }
}

export function broadcastNotification(userId: string, notification: PendingNotification) {
  broadcastToUser(userId, notification);
}

export const GET: APIRoute = async ({ request }) => {
  const session = await validateSessionStrict(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const userId = session.userId;

  // Check connection limit (S-5)
  const existing = connections.get(userId);
  const MAX_CONNECTIONS_PER_USER = 3;
  if (existing && existing.size >= MAX_CONNECTIONS_PER_USER) {
    return new Response(JSON.stringify({ error: 'Too many connections' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      if (!connections.has(userId)) {
        connections.set(userId, new Set());
      }
      connections.get(userId)!.add(controller);

      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(`event: connected\ndata: ${JSON.stringify({ createdAt: new Date().toISOString() })}\n\n`));

      // Start heartbeat (S-2: starts in start, not in .then())
      heartbeatInterval = setInterval(() => {
        const userConnections = connections.get(userId);
        if (!userConnections || userConnections.size === 0) {
          if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
          }
          return;
        }
        const encoder = new TextEncoder();
        const heartbeat = `: heartbeat ${Date.now()}\n\n`;
        const dead: ReadableStreamDefaultController[] = [];
        for (const ctrl of userConnections) {
          try {
            ctrl.enqueue(encoder.encode(heartbeat));
          } catch {
            dead.push(ctrl);
          }
        }
        for (const ctrl of dead) {
          userConnections.delete(ctrl);
        }
      }, 30000);
    },
    cancel() {
      // S-2: Clear interval directly in cancel() callback
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }
      // S-1: Actually remove controller from Map
      const userConnections = connections.get(userId);
      if (userConnections) {
        for (const controller of userConnections) {
          userConnections.delete(controller);
        }
        if (userConnections.size === 0) {
          connections.delete(userId);
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const session = await validateSessionStrict(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { action, notificationId } = body;

    if (action === 'markRead' && notificationId) {
      // S-6: Actually implement markRead
      const ids = Array.isArray(notificationId) ? notificationId : [notificationId];
      await db.update(notifications)
        .set({ read: true, updatedAt: new Date() })
        .where(and(
          inArray(notifications.id, ids),
          eq(notifications.userId, session.userId)
        ));
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};