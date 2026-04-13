import type { APIRoute } from 'astro';
import { getSessionFromRequest } from '../../../utils/auth';
import { db } from '../../../db';
import { reviews, clinics } from '../../../db/schema';
import { eq, desc } from 'drizzle-orm';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const myReviews = await db
      .select({
        id: reviews.id,
        clinicId: reviews.clinicId,
        rating: reviews.rating,
        title: reviews.title,
        body: reviews.body,
        verified: reviews.verified,
        approved: reviews.approved,
        createdAt: reviews.createdAt,
        clinicName: clinics.name,
        clinicSlug: clinics.slug,
      })
      .from(reviews)
      .leftJoin(clinics, eq(reviews.clinicId, clinics.id))
      .where(eq(reviews.userId, session.userId))
      .orderBy(desc(reviews.createdAt));

    return new Response(JSON.stringify({ reviews: myReviews }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('My reviews error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
