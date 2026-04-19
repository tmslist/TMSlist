import type { APIRoute } from 'astro';
import { eq, desc, and, sql } from 'drizzle-orm';
import { db } from '../../../db';
import { claims, auditLog } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin', 'editor')) return json({ error: 'Forbidden' }, 403);

  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const limit = Math.max(1, Math.min(parseInt(url.searchParams.get('limit') || '50'), 200));
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0'));

    const conditions: any[] = [];
    if (status) conditions.push(eq(claims.status, status));

    const [records, countResult] = await Promise.all([
      db.select().from(claims)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(claims.submittedAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(claims)
        .where(conditions.length > 0 ? and(...conditions) : undefined),
    ]);

    // Status breakdown stats
    const statusCounts: Record<string, number> = {};
    const all = await db.select({ status: claims.status }).from(claims);
    for (const r of all) {
      statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
    }

    return json({
      data: { records, statusCounts },
      total: Number(countResult[0]?.count ?? 0),
      limit,
      offset,
    });
  } catch (err) {
    console.error('Claims GET error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin', 'editor')) return json({ error: 'Forbidden' }, 403);

  try {
    const body = await request.json();
    const { clinicId, insurerId, planId, memberId, claimAmount } = body;

    const [record] = await db.insert(claims).values({
      clinicId: clinicId || null,
      insurerId: insurerId || null,
      planId: planId || null,
      memberId: memberId || null,
      claimAmount: claimAmount ? String(claimAmount) : null,
      status: 'submitted',
      timeline: [{ status: 'submitted', timestamp: new Date().toISOString() }],
    }).returning();

    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'create_claim',
      entityType: 'claim',
      entityId: record.id,
      details: { clinicId, insurerId },
    });

    return json({ success: true, data: record }, 201);
  } catch (err) {
    console.error('Claims POST error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin', 'editor')) return json({ error: 'Forbidden' }, 403);

  try {
    const body = await request.json();
    const { id, status, approvedAmount, denialReason, appealReason, notes } = body;
    if (!id) return json({ error: 'id is required' }, 400);

    const updates: Record<string, unknown> = {};
    if (status) {
      updates.status = status;
      if (status === 'pending') updates.processedAt = new Date();
      if (status === 'approved') {
        updates.approvedAt = new Date();
        updates.approvedAmount = approvedAmount ? String(approvedAmount) : null;
      }
      if (status === 'paid') updates.paidAt = new Date();
      if (status === 'rejected') {
        updates.processedAt = new Date();
        updates.denialReason = denialReason || null;
      }
    }
    if (notes !== undefined) updates.notes = notes;

    // Get existing timeline
    const existing = await db.select().from(claims).where(eq(claims.id, id)).limit(1);
    const existingTimeline = (existing[0]?.timeline as { status: string; timestamp: string; note?: string }[] | null) || [];
    if (status) {
      updates.timeline = [...existingTimeline, { status, timestamp: new Date().toISOString(), note: notes }];
    }

    await db.update(claims).set(updates).where(eq(claims.id, id));

    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'update_claim',
      entityType: 'claim',
      entityId: id,
      details: { status, approvedAmount, denialReason },
    });

    return json({ success: true });
  } catch (err) {
    console.error('Claims PUT error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

export const DELETE: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const id = url.searchParams.get('id');
    if (!id) return json({ error: 'id is required' }, 400);

    await db.delete(claims).where(eq(claims.id, id));

    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'delete_claim',
      entityType: 'claim',
      entityId: id,
    });

    return json({ success: true });
  } catch (err) {
    console.error('Claims DELETE error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};
