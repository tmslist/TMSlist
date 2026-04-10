import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { clinics } from '../../../db/schema';
import { inArray } from 'drizzle-orm';
import { getCached, setCache } from '../../../utils/redis';

export const prerender = false;

/**
 * Get multiple clinics by IDs for comparison.
 * Also returns an AI recommendation if 2+ clinics.
 */
export const GET: APIRoute = async ({ url }) => {
  const ids = url.searchParams.get('ids')?.split(',').filter(Boolean) || [];

  if (ids.length === 0 || ids.length > 4) {
    return new Response(JSON.stringify({ error: 'Provide 1-4 clinic IDs' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const cacheKey = `compare:${ids.sort().join(',')}`;
  const cached = await getCached<{ clinics: typeof clinics.$inferSelect[]; highlights: Record<string, string> }>(cacheKey);
  if (cached) {
    return new Response(JSON.stringify(cached), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
    });
  }

  try {
    const results = await db.select().from(clinics).where(inArray(clinics.id, ids));

    const data = results;

    // Generate comparison highlights
    const highlights: Record<string, string> = {};
    if (data.length >= 2) {
      const bestRated = data.reduce((a, b) => Number(a.ratingAvg || 0) > Number(b.ratingAvg || 0) ? a : b);
      highlights.bestRating = bestRated.id;

      const mostReviews = data.reduce((a, b) => (a.reviewCount || 0) > (b.reviewCount || 0) ? a : b);
      highlights.mostReviews = mostReviews.id;

      const mostInsurance = data.reduce((a, b) => (a.insurances?.length || 0) > (b.insurances?.length || 0) ? a : b);
      highlights.mostInsurance = mostInsurance.id;

      const mostDevices = data.reduce((a, b) => (a.machines?.length || 0) > (b.machines?.length || 0) ? a : b);
      highlights.mostDevices = mostDevices.id;
    }

    const response = { clinics: data, highlights };
    await setCache(cacheKey, response, 600); // 10 min cache

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
    });
  } catch (err) {
    console.error('Compare error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
