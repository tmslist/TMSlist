import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { reviews } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { summarizeReviews } from '../../../utils/ai';
import { getCached, setCache } from '../../../utils/redis';

export const prerender = false;

/**
 * Get AI-generated review summary for a clinic.
 * Cached for 24 hours.
 */
export const GET: APIRoute = async ({ url }) => {
  const clinicId = url.searchParams.get('clinicId');
  if (!clinicId) {
    return new Response(JSON.stringify({ error: 'clinicId required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check cache
  const cacheKey = `review_summary:${clinicId}`;
  const cached = await getCached<string>(cacheKey);
  if (cached) {
    return new Response(JSON.stringify({ summary: cached }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
    });
  }

  try {
    const clinicReviews = await db.select({
      rating: reviews.rating,
      body: reviews.body,
    }).from(reviews).where(
      and(eq(reviews.clinicId, clinicId), eq(reviews.approved, true))
    ).limit(30);

    if (clinicReviews.length < 3) {
      return new Response(JSON.stringify({ summary: null, reason: 'Not enough reviews for summary' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const summary = await summarizeReviews(clinicReviews);

    if (summary) {
      await setCache(cacheKey, summary, 86400); // 24h cache
    }

    return new Response(JSON.stringify({ summary: summary || null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
    });
  } catch (err) {
    console.error('Review summary error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
