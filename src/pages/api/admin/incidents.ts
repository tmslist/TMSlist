import type { APIRoute } from 'astro';
import { eq, desc, and, sql } from 'drizzle-orm';
import { db } from '../../../db';
import { incidents, incidentTimeline, auditLog } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// GET: List incidents with optional status filter
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin', 'editor')) return json({ error: 'Forbidden' }, 403);

  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const limit = Math.max(1, Math.min(parseInt(url.searchParams.get('limit') || '50'), 200));
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0'));

    const conditions = [];
    if (status) conditions.push(eq(incidents.status, status));

    const data = await db
      .select()
      .from(incidents)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(incidents.createdAt))
      .limit(limit)
      .offset(offset);

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(incidents)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return json({ data, total: Number(totalResult[0]?.count ?? 0) });
  } catch (err) {
    console.error('Incidents GET error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// POST: Create incident OR add timeline entry
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin', 'editor')) return json({ error: 'Forbidden' }, 403);

  try {
    const body = await request.json();

    // Add timeline entry to existing incident
    if (body.incidentId && body.message) {
      const [entry] = await db.insert(incidentTimeline).values({
        incidentId: body.incidentId,
        message: body.message,
        createdBy: session.userId,
      }).returning();

      await db.insert(auditLog).values({
        userId: session.userId,
        action: 'add_incident_timeline',
        entityType: 'incident_timeline',
        entityId: entry.id,
        details: { incidentId: body.incidentId },
      });

      return json({ success: true, data: entry }, 201);
    }

    // Create new incident
    const { title, status, severity, message } = body;
    if (!title || !message) return json({ error: 'title and message are required' }, 400);

    const [incident] = await db.insert(incidents).values({
      title,
      status: status || 'investigating',
      severity: severity || 'low',
      message,
      createdBy: session.userId,
    }).returning();

    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'create_incident',
      entityType: 'incident',
      entityId: incident.id,
      details: { title, status, severity },
    });

    return json({ success: true, data: incident }, 201);
  } catch (err) {
    console.error('Incidents POST error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// PUT: Update incident status, severity, or message
export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin', 'editor')) return json({ error: 'Forbidden' }, 403);

  try {
    const body = await request.json();
    const { id, status, severity, message } = body;
    if (!id) return json({ error: 'Incident ID required' }, 400);

    const updates: Record<string, unknown> = {};
    if (status !== undefined) updates.status = status;
    if (severity !== undefined) updates.severity = severity;
    if (message !== undefined) updates.message = message;
    if (status === 'resolved') updates.resolvedAt = new Date();

    if (Object.keys(updates).length === 0) return json({ error: 'No valid fields to update' }, 400);

    await db.update(incidents).set(updates).where(eq(incidents.id, id));

    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'update_incident',
      entityType: 'incident',
      entityId: id,
      details: { fields: Object.keys(updates) },
    });

    return json({ success: true });
  } catch (err) {
    console.error('Incidents PUT error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// DELETE: Remove incident
export const DELETE: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const id = url.searchParams.get('id');
    if (!id) return json({ error: 'Incident ID required' }, 400);

    await db.delete(incidents).where(eq(incidents.id, id));

    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'delete_incident',
      entityType: 'incident',
      entityId: id,
    });

    return json({ success: true });
  } catch (err) {
    console.error('Incidents DELETE error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};