import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { reviews, users } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';
import { escapeHtml } from '../../../utils/sanitize';
import { sql } from 'drizzle-orm';

export const prerender = false;

/**
 * Allow clinic owners to respond to reviews on their clinic.
 */
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

    if (!reviewId || !response || response.length > 2000) {
      return new Response(JSON.stringify({ error: 'reviewId and response (max 2000 chars) required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify ownership: get user's clinic, then check review belongs to it
    const user = await db.select().from(users).where(eq(users.id, session!.userId)).limit(1);
    const clinicId = user[0]?.clinicId;

    if (!clinicId && session!.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'No clinic linked to your account' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check review belongs to this clinic (or admin can respond to any)
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

    // Save response (using raw SQL since column may need adding)
    const sanitized = escapeHtml(response);
    try {
      await db.execute(sql`
        UPDATE reviews
        SET owner_response = ${sanitized}, owner_response_at = now()
        WHERE id = ${reviewId}::uuid
      `);
    } catch {
      // Column may not exist — graceful failure
      return new Response(JSON.stringify({ error: 'Response feature not yet enabled. Please contact support.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Review response error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
