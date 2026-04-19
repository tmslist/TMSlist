import type { APIRoute } from 'astro';
import { eq, desc, sql, and } from 'drizzle-orm';
import { db } from '../../../db';
import { gdprRequests, users, auditLog } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// GET: List GDPR requests
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const type = url.searchParams.get('type');
    const limit = Math.max(1, Math.min(parseInt(url.searchParams.get('limit') || '50'), 200));
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0'));

    const conditions = [];
    if (status) conditions.push(eq(gdprRequests.status, status));
    if (type) conditions.push(eq(gdprRequests.type, type));

    const data = await db
      .select()
      .from(gdprRequests)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(gdprRequests.createdAt))
      .limit(limit)
      .offset(offset);

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(gdprRequests)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return json({ data, total: Number(totalResult[0]?.count ?? 0) });
  } catch (err) {
    console.error('GDPR GET error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// POST: Submit a new GDPR request (email, type: export/delete)
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);

  try {
    const body = await request.json();
    const { email, type } = body;

    if (!email || !type) {
      return json({ error: 'email and type are required' }, 400);
    }
    if (!['export', 'deletion'].includes(type)) {
      return json({ error: 'type must be export or deletion' }, 400);
    }

    // Check for existing pending/processing request for same email
    const existing = await db
      .select()
      .from(gdprRequests)
      .where(and(
        eq(gdprRequests.email, email.toLowerCase()),
        sql`${gdprRequests.status} IN ('pending', 'processing')`
      ))
      .limit(1);

    if (existing[0]) {
      return json({ error: 'An active GDPR request already exists for this email' }, 409);
    }

    const [record] = await db.insert(gdprRequests).values({
      email: email.toLowerCase(),
      type,
      status: 'pending',
    }).returning();

    await db.insert(auditLog).values({
      userId: session.userId ?? null,
      action: 'submit_gdpr_request',
      entityType: 'gdpr_request',
      entityId: record.id,
      details: { email, type },
    });

    return json({ success: true, data: record }, 201);
  } catch (err) {
    console.error('GDPR POST error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// PUT: Update request status (processing->completed/failed), add notes
export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const body = await request.json();
    const { id, status, notes, downloadUrl } = body;

    if (!id) return json({ error: 'GDPR request ID required' }, 400);

    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (notes !== undefined) updates.notes = notes;

    if (status === 'completed') {
      updates.completedAt = new Date();
      updates.completedBy = session.userId;
      // For export requests, include download URL in notes
      if (downloadUrl && notes) {
        updates.notes = `${notes}\n\nDownload URL: ${downloadUrl}`;
      }
    }

    await db.update(gdprRequests).set(updates).where(eq(gdprRequests.id, id));

    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'update_gdpr_request',
      entityType: 'gdpr_request',
      entityId: id,
      details: { status, notes },
    });

    return json({ success: true });
  } catch (err) {
    console.error('GDPR PUT error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};