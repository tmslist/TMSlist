import type { APIRoute } from 'astro';
import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../../../db';
import { reviews, auditLog } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';
import { updateClinicRating } from '../../../db/queries';

export const prerender = false;

// GET: List reviews with optional status filter
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin', 'editor')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const limit = Math.max(1, Math.min(parseInt(url.searchParams.get('limit') || '50'), 200));
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0'));

    const whereMap: Record<string, string> = {
      pending: 'WHERE approved = false',
      approved: 'WHERE approved = true',
      all: '',
    };
    const where = whereMap[status || 'all'] || whereMap.all;
    const orderBy = 'ORDER BY created_at DESC';
    const limitOffset = `LIMIT ${limit} OFFSET ${offset}`;

    const rowsResult = await db.execute(sql`
      SELECT id, clinic_id, user_id, user_name, user_email, rating, title, body,
             source, verified, approved, helpful_count, unhelpful_count, created_at, clinic_name, clinic_slug
      FROM reviews ${sql.raw(where)} ${sql.raw(orderBy)} ${sql.raw(limitOffset)}
    `);

    const results = (rowsResult as any).rows?.map((r: any) => ({
      id: r.id,
      clinicId: r.clinic_id,
      userId: r.user_id,
      userName: r.user_name,
      userEmail: r.user_email,
      rating: r.rating,
      title: r.title,
      body: r.body,
      source: r.source,
      verified: r.verified,
      approved: r.approved,
      helpfulCount: r.helpful_count ?? 0,
      unhelpfulCount: r.unhelpful_count ?? 0,
      createdAt: r.created_at,
      clinicName: r.clinic_name,
      clinicSlug: r.clinic_slug,
    })) ?? [];

    const pendingRows = await db.execute(sql`SELECT count(*) as count FROM reviews WHERE approved = false`);
    const totalRows = await db.execute(sql`SELECT count(*) as count FROM reviews`);
    const pendingCount = Number((pendingRows as any).rows?.[0]?.count ?? 0);
    const total = Number((totalRows as any).rows?.[0]?.count ?? 0);

    return new Response(JSON.stringify({
      data: results,
      total,
      pendingCount,
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
  if (!hasRole(session, 'admin', 'editor')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
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
