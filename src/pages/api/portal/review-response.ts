import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { reviews, users } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';
import { escapeHtml } from '../../../utils/sanitize';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'clinic_owner', 'admin')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { reviewId, response } = await request.json();

    if (!reviewId || !response || typeof response !== 'string' || response.length > 2000) {
      return new Response(JSON.stringify({ error: 'reviewId and response (max 2000 chars) required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get user's clinic
    const userRows = await db.select({ clinicId: users.clinicId }).from(users).where(eq(users.id, session!.userId)).limit(1);
    const clinicId = userRows[0]?.clinicId;

    if (!clinicId && session!.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'No clinic linked to your account' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check review exists and belongs to this clinic
    const review = await db.select().from(reviews).where(eq(reviews.id, reviewId)).limit(1);
    if (!review[0]) {
      return new Response(JSON.stringify({ error: 'Review not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (session!.role !== 'admin' && review[0].clinicId !== clinicId) {
      return new Response(JSON.stringify({ error: 'You can only respond to reviews on your own clinic' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const sanitized = escapeHtml(response);
    await db.update(reviews)
      .set({ ownerResponse: sanitized, ownerResponseAt: new Date() })
      .where(eq(reviews.id, reviewId));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Portal review response error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
