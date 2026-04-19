import type { APIRoute } from 'astro';
import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../../../db';
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
    const clinicId = url.searchParams.get('clinicId') || session.clinicId;
    const reviews_data = await db.select().from(reviews)
      .where(eq(reviews.clinicId, clinicId))
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

  try {
    const body = await request.json();
    const { reviewId, response } = body;
    if (!reviewId || !response) return json({ error: 'ReviewId and response required' }, 400);

    await db.update(reviews).set({
      ownerResponse: response,
      ownerResponseAt: new Date(),
    }).where(eq(reviews.id, reviewId));

    return json({ success: true });
  } catch (err) {
    console.error('Doctor reviews POST error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};
