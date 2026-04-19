import type { APIRoute } from 'astro';
import { eq, desc, sql, and } from 'drizzle-orm';
import { db } from '../../../db';
import { maintenanceWindows, auditLog } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// GET: List maintenance windows
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin', 'editor')) return json({ error: 'Forbidden' }, 403);

  try {
    const url = new URL(request.url);
    const active = url.searchParams.get('active');
    const limit = Math.max(1, Math.min(parseInt(url.searchParams.get('limit') || '50'), 200));
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0'));

    const conditions = [];
    if (active === 'true') conditions.push(eq(maintenanceWindows.isActive, true));

    const data = await db
      .select()
      .from(maintenanceWindows)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(maintenanceWindows.startAt))
      .limit(limit)
      .offset(offset);

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(maintenanceWindows)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return json({ data, total: Number(totalResult[0]?.count ?? 0) });
  } catch (err) {
    console.error('Maintenance GET error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// POST: Create maintenance window
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const body = await request.json();
    const { title, message, startAt, endAt } = body;

    if (!title || !message || !startAt || !endAt) {
      return json({ error: 'title, message, startAt, and endAt are required' }, 400);
    }

    const [window] = await db.insert(maintenanceWindows).values({
      title,
      message,
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      isActive: body.isActive ?? false,
      createdBy: session.userId,
    }).returning();

    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'create_maintenance_window',
      entityType: 'maintenance_window',
      entityId: window.id,
      details: { title },
    });

    return json({ success: true, data: window }, 201);
  } catch (err) {
    console.error('Maintenance POST error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// PUT: Toggle active status or update window
export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin', 'editor')) return json({ error: 'Forbidden' }, 403);

  try {
    const body = await request.json();
    const { id, isActive, title, message, startAt, endAt } = body;
    if (!id) return json({ error: 'Maintenance window ID required' }, 400);

    const updates: Record<string, unknown> = {};
    if (typeof isActive === 'boolean') updates.isActive = isActive;
    if (title !== undefined) updates.title = title;
    if (message !== undefined) updates.message = message;
    if (startAt !== undefined) updates.startAt = new Date(startAt);
    if (endAt !== undefined) updates.endAt = new Date(endAt);

    if (Object.keys(updates).length === 0) return json({ error: 'No valid fields to update' }, 400);

    await db.update(maintenanceWindows).set(updates).where(eq(maintenanceWindows.id, id));

    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'update_maintenance_window',
      entityType: 'maintenance_window',
      entityId: id,
      details: { fields: Object.keys(updates) },
    });

    return json({ success: true });
  } catch (err) {
    console.error('Maintenance PUT error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// DELETE: Remove maintenance window
export const DELETE: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const id = url.searchParams.get('id');
    if (!id) return json({ error: 'Maintenance window ID required' }, 400);

    await db.delete(maintenanceWindows).where(eq(maintenanceWindows.id, id));

    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'delete_maintenance_window',
      entityType: 'maintenance_window',
      entityId: id,
    });

    return json({ success: true });
  } catch (err) {
    console.error('Maintenance DELETE error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};