import type { APIRoute } from 'astro';
import { getSessionFromRequest } from '../../utils/auth';
import { db } from '../../db';
import { reviews } from '../../db/schema';
import { eq, desc, and, isNull } from 'drizzle-orm';
import { getPostHogServer } from '../../lib/posthog-server';

export const prerender = false;

// GET: Public — fetch approved reviews for a clinic
export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const clinicId = url.searchParams.get('clinicId');

  try {
    let query = db
      .select({
        id: reviews.id,
        userName: reviews.userName,
        userEmail: reviews.userEmail,
        rating: reviews.rating,
        title: reviews.title,
        body: reviews.body,
        verified: reviews.verified,
        approved: reviews.approved,
        helpfulCount: reviews.helpfulCount,
        unhelpfulCount: reviews.unhelpfulCount,
        createdAt: reviews.createdAt,
        clinicId: reviews.clinicId,
      })
      .from(reviews)
      .where(eq(reviews.approved, true))
      .orderBy(desc(reviews.createdAt));

    if (clinicId) {
      query = db
        .select({
          id: reviews.id,
          userName: reviews.userName,
          userEmail: reviews.userEmail,
          rating: reviews.rating,
          title: reviews.title,
          body: reviews.body,
          verified: reviews.verified,
          approved: reviews.approved,
          helpfulCount: reviews.helpfulCount,
          unhelpfulCount: reviews.unhelpfulCount,
          createdAt: reviews.createdAt,
          clinicId: reviews.clinicId,
        })
        .from(reviews)
        .where(and(eq(reviews.clinicId, clinicId), eq(reviews.approved, true)))
        .orderBy(desc(reviews.createdAt));
    }

    const results = await query;
    return new Response(JSON.stringify({ data: results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Reviews GET error:', err);
    return new Response(JSON.stringify({ error: 'Failed to load reviews' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST: Submit a new review (requires patient auth)
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Authentication required', success: false }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { clinicId, rating, body: reviewBody, title } = body;

    if (!clinicId || !rating || !reviewBody) {
      return new Response(JSON.stringify({ error: 'clinicId, rating, and body are required', success: false }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (rating < 1 || rating > 5) {
      return new Response(JSON.stringify({ error: 'Rating must be between 1 and 5', success: false }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const newReview = await db.insert(reviews).values({
      clinicId,
      userId: session.userId,
      userName: session.email.split('@')[0],
      userEmail: session.email,
      rating: parseInt(rating),
      title: title || null,
      body: reviewBody,
      verified: false,
      approved: false,
      source: 'tmslist',
    }).returning({ id: reviews.id });

    const sessionId = request.headers.get('X-PostHog-Session-Id');
    getPostHogServer().capture({
      distinctId: session.userId,
      event: 'review_submitted',
      properties: {
        $session_id: sessionId || undefined,
        clinic_id: clinicId,
        rating: parseInt(rating),
        review_id: newReview[0]?.id,
      },
    });

    return new Response(JSON.stringify({
      success: true,
      status: 'pending',
      reviewId: newReview[0]?.id,
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Reviews POST error:', err);
    return new Response(JSON.stringify({ error: 'Failed to submit review', success: false }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
