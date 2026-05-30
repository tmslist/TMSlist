import type { APIRoute } from 'astro';
import { getSessionFromRequest } from '../../../utils/auth';
import { db } from '../../../db';
import { supportTickets, ticketMessages, users, clinics } from '../../../db/schema';
import { eq, desc, count, and, or, like } from 'drizzle-orm';

export const prerender = false;

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';
type TicketCategory = 'general' | 'technical' | 'billing' | 'feedback' | 'abuse';

// GET /api/admin/support-tickets - List all tickets
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  if (session.role !== 'admin' && session.role !== 'editor') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') as TicketStatus | null;
    const priority = url.searchParams.get('priority') as TicketPriority | null;
    const category = url.searchParams.get('category') as TicketCategory | null;
    const assignedTo = url.searchParams.get('assignedTo');
    const search = url.searchParams.get('search');
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10) || 50));
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10) || 0);

    const conditions = [];
    if (status) conditions.push(eq(supportTickets.status, status as any));
    if (priority) conditions.push(eq(supportTickets.priority, priority as any));
    if (category) conditions.push(eq(supportTickets.category, category as any));
    if (assignedTo) conditions.push(eq(supportTickets.assignedTo, assignedTo as any));
    if (search) {
      conditions.push(or(
        like(supportTickets.subject, `%${search}%`),
        like(supportTickets.body, `%${search}%`),
      ) as any);
    }

    const [rows, [{ total }]] = await Promise.all([
      db.select({
        id: supportTickets.id,
        subject: supportTickets.subject,
        body: supportTickets.body,
        category: supportTickets.category,
        status: supportTickets.status,
        priority: supportTickets.priority,
        assignedTo: supportTickets.assignedTo,
        submitterEmail: supportTickets.submitterEmail,
        createdAt: supportTickets.createdAt,
        updatedAt: supportTickets.updatedAt,
        userId: supportTickets.userId,
      })
        .from(supportTickets)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(supportTickets.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(supportTickets),
    ]);

    // Fetch assignee names
    const assigneeIds = [...new Set(rows.map(r => r.assignedTo).filter(Boolean))];
    const assignees = assigneeIds.length > 0
      ? await db.select({ id: users.id, name: users.name }).from(users).where(or(...assigneeIds.map(id => eq(users.id, id as any))) as any)
      : [];

    const assigneeMap: Record<string, string> = {};
    for (const a of assignees) {
      if (a.id && a.name) assigneeMap[a.id] = a.name;
    }

    const tickets = rows.map(r => ({
      ...r,
      assigneeName: r.assignedTo ? assigneeMap[r.assignedTo] : null,
    }));

    return new Response(JSON.stringify({ tickets, total, limit, offset }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Support tickets list error:', err);
    return new Response(JSON.stringify({ error: 'Failed to load tickets' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

// POST /api/admin/support-tickets - Create a new ticket
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  if (session.role !== 'admin' && session.role !== 'editor') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const body = await request.json();
    const { userId, submitterEmail, subject, body: ticketBody, category, priority } = body;

    if (!subject || !ticketBody) {
      return new Response(JSON.stringify({ error: 'subject and body are required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const [ticket] = await db.insert(supportTickets).values({
      userId: userId ?? null,
      submitterEmail: submitterEmail ?? null,
      subject,
      body: ticketBody,
      category: category ?? 'general',
      priority: priority ?? 'normal',
      status: 'open',
    }).returning();

    return new Response(JSON.stringify({ ticket }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Support ticket create error:', err);
    return new Response(JSON.stringify({ error: 'Failed to create ticket' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

// GET /api/admin/support-tickets/:id - Get single ticket with messages
export const GET_TICKET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  if (session.role !== 'admin' && session.role !== 'editor') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const ticketId = pathParts[pathParts.length - 1];

    const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.id, ticketId)).limit(1);
    if (!ticket) {
      return new Response(JSON.stringify({ error: 'Ticket not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const messages = await db.select({
      id: ticketMessages.id,
      body: ticketMessages.body,
      isStaffReply: ticketMessages.isStaffReply,
      userId: ticketMessages.userId,
      createdAt: ticketMessages.createdAt,
    })
      .from(ticketMessages)
      .where(eq(ticketMessages.ticketId, ticketId))
      .orderBy(desc(ticketMessages.createdAt));

    return new Response(JSON.stringify({ ticket, messages }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Support ticket get error:', err);
    return new Response(JSON.stringify({ error: 'Failed to load ticket' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

// PUT /api/admin/support-tickets/:id - Update ticket status, priority, or assign
export const PUT_TICKET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  if (session.role !== 'admin' && session.role !== 'editor') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const ticketId = pathParts[pathParts.length - 1];

    const body = await request.json();
    const { status, priority, assignedTo, response } = body;

    const validStatuses: TicketStatus[] = ['open', 'in_progress', 'resolved', 'closed'];
    const validPriorities: TicketPriority[] = ['low', 'normal', 'high', 'urgent'];

    if (status && !validStatuses.includes(status)) {
      return new Response(JSON.stringify({ error: 'Invalid status' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    if (priority && !validPriorities.includes(priority)) {
      return new Response(JSON.stringify({ error: 'Invalid priority' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (priority) updates.priority = priority;
    if (assignedTo !== undefined) updates.assignedTo = assignedTo || null;
    updates.updatedAt = new Date();

    const [updated] = await db.update(supportTickets)
      .set(updates as any)
      .where(eq(supportTickets.id, ticketId))
      .returning();

    if (!updated) {
      return new Response(JSON.stringify({ error: 'Ticket not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    // If a staff response is provided, add a message
    if (response) {
      await db.insert(ticketMessages).values({
        ticketId,
        userId: session.userId,
        body: response,
        isStaffReply: true,
      });
    }

    return new Response(JSON.stringify({ ticket: updated }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Support ticket update error:', err);
    return new Response(JSON.stringify({ error: 'Failed to update ticket' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

// POST /api/admin/support-tickets/:id/reply - Add reply message to ticket
export const POST_REPLY: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  if (session.role !== 'admin' && session.role !== 'editor') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const ticketId = pathParts[pathParts.length - 2];

    const body = await request.json();
    const { message } = body;

    if (!message || message.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'message is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const [ticket] = await db.select({ id: supportTickets.id }).from(supportTickets).where(eq(supportTickets.id, ticketId)).limit(1);
    if (!ticket) {
      return new Response(JSON.stringify({ error: 'Ticket not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const [msg] = await db.insert(ticketMessages).values({
      ticketId,
      userId: session.userId,
      body: message.trim(),
      isStaffReply: true,
    }).returning();

    // Update ticket status to in_progress if currently open
    await db.update(supportTickets)
      .set({ status: 'in_progress' as any, updatedAt: new Date() })
      .where(and(
        eq(supportTickets.id, ticketId),
        eq(supportTickets.status, 'open' as any)
      ));

    return new Response(JSON.stringify({ message: msg }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Support ticket reply error:', err);
    return new Response(JSON.stringify({ error: 'Failed to reply to ticket' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};