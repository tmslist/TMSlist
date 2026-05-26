import type { APIRoute } from 'astro';
import { eq, desc, sql, and } from 'drizzle-orm';
import { db } from '../../../db';
import { reviews, clinics, auditLog } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth.js';
import { updateClinicRating } from '../../../db/queries';

export const prerender = false;

// GET: List reviews with optional status filter
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!hasRole(session, 'admin', 'editor')) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const url = new URL(request.url);
    const statusParam = url.searchParams.get('status');
    const limit = Math.max(1, Math.min(parseInt(url.searchParams.get('limit') || '50'), 200));
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0'));

    // Validated where clause using Drizzle conditions — no string interpolation
    // into SQL. Previous version used `sql.raw(where)` with hardcoded fragments
    // which was injection-safe today but a copy-paste hazard for future code.
    const statusFilter =
      statusParam === 'pending' ? eq(reviews.approved, false) :
      statusParam === 'approved' ? eq(reviews.approved, true) :
      undefined;

    const rows = await db
      .select({
        id: reviews.id,
        clinicId: reviews.clinicId,
        userId: reviews.userId,
        userName: reviews.userName,
        userEmail: reviews.userEmail,
        rating: reviews.rating,
        title: reviews.title,
        body: reviews.body,
        source: reviews.source,
        verified: reviews.verified,
        approved: reviews.approved,
        helpfulCount: reviews.helpfulCount,
        unhelpfulCount: reviews.unhelpfulCount,
        createdAt: reviews.createdAt,
        ownerResponse: reviews.ownerResponse,
        ownerResponseAt: reviews.ownerResponseAt,
        clinicName: clinics.name,
        clinicSlug: clinics.slug,
      })
      .from(reviews)
      .leftJoin(clinics, eq(reviews.clinicId, clinics.id))
      .where(statusFilter)
      .orderBy(desc(reviews.createdAt))
      .limit(limit)
      .offset(offset);

    const [pendingRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(reviews)
      .where(eq(reviews.approved, false));
    const [totalRow] = await db.select({ count: sql<number>`count(*)` }).from(reviews);

    return new Response(JSON.stringify({
      data: rows,
      total: Number(totalRow?.count ?? 0),
      pendingCount: Number(pendingRow?.count ?? 0),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Admin reviews GET error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// Approve or reject a review
export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!hasRole(session, 'admin', 'editor')) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { id, approved } = body;

    if (!id || typeof approved !== 'boolean') {
      return new Response(JSON.stringify({ error: 'id and approved (boolean) required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await db.update(reviews)
      .set({ approved })
      .where(eq(reviews.id, id))
      .returning({ clinicId: reviews.clinicId });

    if (result[0]) {
      await updateClinicRating(result[0].clinicId);
    }

    await db.insert(auditLog).values({
      userId: session?.userId ?? null,
      action: approved ? 'approve_review' : 'reject_review',
      entityType: 'review',
      entityId: id,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Admin review error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
