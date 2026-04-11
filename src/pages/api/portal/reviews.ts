import type { APIRoute } from 'astro';
import { getSessionFromRequest } from '../../../utils/auth';
import { db } from '../../../db';
import { reviews, users } from '../../../db/schema';
import { eq, desc } from 'drizzle-orm';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const userRows = await db.select({ clinicId: users.clinicId }).from(users).where(eq(users.id, session.userId)).limit(1);
    const clinicId = userRows[0]?.clinicId;

    if (!clinicId) {
      return new Response(JSON.stringify({ error: 'No clinic linked' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    const clinicReviews = await db.select({
      id: reviews.id,
      userName: reviews.userName,
      rating: reviews.rating,
      title: reviews.title,
      body: reviews.body,
      approved: reviews.approved,
      verified: reviews.verified,
      createdAt: reviews.createdAt,
    })
      .from(reviews)
      .where(eq(reviews.clinicId, clinicId))
      .orderBy(desc(reviews.createdAt));

    return new Response(JSON.stringify({ reviews: clinicReviews }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Portal reviews error:', err);
    return new Response(JSON.stringify({ error: 'Failed to load reviews' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
