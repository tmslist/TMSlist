import type { APIRoute } from 'astro';
import { eq, sql, and, desc } from 'drizzle-orm';
import { db } from '../../../db';
import { supportTickets, ticketMessages, users, auditLog } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// GET: List tickets (admin) or own tickets (clinic owner)
export const GET: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);

  try {
    const status_ = url.searchParams.get('status') || undefined;
    const priority = url.searchParams.get('priority') || undefined;
    const category = url.searchParams.get('category') || undefined;
    const limit = Math.max(1, Math.min(parseInt(url.searchParams.get('limit') || '20'), 100));
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0'));

    const isAdmin = hasRole(session, 'admin', 'editor');
    const conditions = [];

    if (!isAdmin) {
      conditions.push(eq(supportTickets.submitterId, session.userId));
    }
    if (status_) conditions.push(eq(supportTickets.status, status_));
    if (priority) conditions.push(eq(supportTickets.priority, priority));
    if (category) conditions.push(eq(supportTickets.category, category));

    const tickets = await db
      .select({
        id: supportTickets.id,
        subject: supportTickets.subject,
        category: supportTickets.category,
        priority: supportTickets.priority,
        status: supportTickets.status,
        submitterEmail: supportTickets.submitterEmail,
        assignedTo: supportTickets.assignedTo,
        createdAt: supportTickets.createdAt,
        updatedAt: supportTickets.updatedAt,
        messageCount: sql<number>`(SELECT count(*) FROM ticket_messages WHERE ticket_messages.ticket_id = support_tickets.id)`,
      })
      .from(supportTickets)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(supportTickets.createdAt))
      .limit(limit)
      .offset(offset);

    const total = tickets.length; // simplified
    return json({ data: tickets, total });
  } catch (err) {
    console.error('List tickets error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// POST: Create ticket OR add message to ticket
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);

  try {
    const body = await request.json();

    // Message mode
    if (body.ticketId) {
      const [msg] = await db.insert(ticketMessages).values({
        ticketId: body.ticketId,
        senderId: session.userId,
        body: body.body,
        isInternal: body.isInternal || false,
      }).returning();

      await db.update(supportTickets).set({ updatedAt: new Date() })
        .where(eq(supportTickets.id, body.ticketId));

      return json({ success: true, message: msg }, 201);
    }

    // Create ticket mode (clinic owners)
    const { subject, category, priority, message } = body;
    if (!subject || !category || !message) {
      return json({ error: 'subject, category, and message are required' }, 400);
    }

    const [ticket] = await db.insert(supportTickets).values({
      subject,
      category,
      priority: priority || 'medium',
      submitterId: session.userId,
      submitterEmail: session.email,
    }).returning();

    await db.insert(ticketMessages).values({
      ticketId: ticket.id,
      senderId: session.userId,
      body: message,
    });

    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'create_support_ticket',
      entityType: 'support_ticket',
      entityId: ticket.id,
      details: { subject, category },
    });

    return json({ success: true, ticket }, 201);
  } catch (err) {
    console.error('Create ticket error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// PUT: Update ticket (status, priority, assigned_to, resolve)
export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'admin', 'editor')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return json({ error: 'Ticket ID required' }, 400);

    const allowed = ['status', 'priority', 'assignedTo', 'category'] as const;
    const safe: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in updates) safe[key] = updates[key];
    }
    if (updates.status === 'resolved') safe.resolvedAt = new Date();
    if (updates.status === 'closed') safe.resolvedAt = new Date();

    await db.update(supportTickets).set({ ...safe, updatedAt: new Date() })
      .where(eq(supportTickets.id, id));

    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'update_support_ticket',
      entityType: 'support_ticket',
      entityId: id,
      details: { fields: Object.keys(safe) },
    });

    return json({ success: true });
  } catch (err) {
    console.error('Update ticket error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// GET messages for a ticket: /api/admin/support?ticketId=xxx
