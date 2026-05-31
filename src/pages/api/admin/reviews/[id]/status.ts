import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '../../../../db';
import { reviews, auditLog } from '../../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../../utils/auth.js';
import { updateClinicRating } from '../../../../db/queries';

export const prerender = false;

// Approve or reject a single review
export const PATCH: APIRoute = async ({ request, params }) => {
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

  const id = params.id;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Review ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { approved } = body;

    if (typeof approved !== 'boolean') {
      return new Response(JSON.stringify({ error: 'approved (boolean) is required' }), {
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
    console.error('Admin review status error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};