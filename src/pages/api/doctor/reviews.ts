import type { APIRoute } from 'astro';
import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../..//../db/index.js';
import { reviews } from '../../../db/schema';
import { getSessionFromRequest } from '../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// GET: list reviews for doctor's clinic
export const GET: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!session.clinicId) return json({ error: 'No clinic linked' }, 403);

  try {
    const reviews_data = await db.select().from(reviews)
      .where(eq(reviews.clinicId, session.clinicId))
      .orderBy(desc(reviews.createdAt));

    return json({ reviews: reviews_data });
  } catch (err) {
    console.error('Doctor reviews GET error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// POST: submit owner response
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!session.clinicId) return json({ error: 'No clinic linked' }, 403);

  try {
    const body = await request.json();
    const { reviewId, response } = body;
    if (!reviewId || !response) return json({ error: 'ReviewId and response required' }, 400);

    const result = await db.update(reviews).set({
      ownerResponse: response,
      ownerResponseAt: new Date(),
    }).where(and(eq(reviews.id, reviewId), eq(reviews.clinicId, session.clinicId))).returning({ id: reviews.id });

    if (result.length === 0) return json({ error: 'Review not found' }, 404);

    return json({ success: true });
  } catch (err) {
    console.error('Doctor reviews POST error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};
