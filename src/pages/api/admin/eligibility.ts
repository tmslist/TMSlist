import type { APIRoute } from 'astro';
import { eq, desc, and, sql } from 'drizzle-orm';
import { db } from '../../../db';
import { insuranceEligibilityChecks, auditLog } from '../../../db/schema';
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
    if (status) conditions.push(eq(insuranceEligibilityChecks.status, status));

    const [records, countResult] = await Promise.all([
      db.select().from(insuranceEligibilityChecks)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(insuranceEligibilityChecks.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(insuranceEligibilityChecks)
        .where(conditions.length > 0 ? and(...conditions) : undefined),
    ]);

    // Status breakdown
    const statusCounts: Record<string, number> = {};
    const all = await db.select({ status: insuranceEligibilityChecks.status }).from(insuranceEligibilityChecks);
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
    console.error('Eligibility GET error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin', 'editor')) return json({ error: 'Forbidden' }, 403);

  try {
    const body = await request.json();
    const { clinicId, insurerId, planId, memberId, groupNumber } = body;

    // Simulate eligibility verification (in production, this would call an insurance API)
    const [record] = await db.insert(insuranceEligibilityChecks).values({
      clinicId: clinicId || null,
      insurerId: insurerId || null,
      planId: planId || null,
      memberId: memberId || null,
      groupNumber: groupNumber || null,
      status: 'pending',
    }).returning();

    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'check_eligibility',
      entityType: 'eligibility_check',
      entityId: record.id,
      details: { insurerId, planId, memberId },
    });

    return json({ success: true, data: record }, 201);
  } catch (err) {
    console.error('Eligibility POST error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin', 'editor')) return json({ error: 'Forbidden' }, 403);

  try {
    const body = await request.json();
    const { id, status, coverageDetails, errorMessage } = body;
    if (!id) return json({ error: 'id is required' }, 400);

    const updates: Record<string, unknown> = {};
    if (status) {
      updates.status = status;
      if (status === 'verified' || status === 'eligible' || status === 'not_eligible') {
        updates.verifiedAt = new Date();
      }
    }
    if (coverageDetails) updates.coverageDetails = coverageDetails;
    if (errorMessage !== undefined) updates.errorMessage = errorMessage;

    await db.update(insuranceEligibilityChecks).set(updates).where(eq(insuranceEligibilityChecks.id, id));

    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'update_eligibility',
      entityType: 'eligibility_check',
      entityId: id,
      details: { status, coverageDetails },
    });

    return json({ success: true });
  } catch (err) {
    console.error('Eligibility PUT error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};
