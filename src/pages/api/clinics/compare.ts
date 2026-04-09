import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { clinics } from '../../../db/schema';
import { sql } from 'drizzle-orm';
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
  const cached = await getCached<any>(cacheKey);
  if (cached) {
    return new Response(JSON.stringify(cached), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
    });
  }

  try {
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    const results = await db.execute(
      sql.raw(`SELECT * FROM clinics WHERE id IN (${ids.map(id => `'${id}'`).join(',')})`)
    );

    const data = (results as any).rows || results;

    // Generate comparison highlights
    const highlights: Record<string, string> = {};
    if (data.length >= 2) {
      // Best rating
      const bestRated = data.reduce((a: any, b: any) => Number(a.rating_avg || 0) > Number(b.rating_avg || 0) ? a : b);
      highlights.bestRating = bestRated.id;

      // Most reviews
      const mostReviews = data.reduce((a: any, b: any) => (a.review_count || 0) > (b.review_count || 0) ? a : b);
      highlights.mostReviews = mostReviews.id;

      // Most insurance
      const mostInsurance = data.reduce((a: any, b: any) => (a.insurances?.length || 0) > (b.insurances?.length || 0) ? a : b);
      highlights.mostInsurance = mostInsurance.id;

      // Most devices
      const mostDevices = data.reduce((a: any, b: any) => (a.machines?.length || 0) > (b.machines?.length || 0) ? a : b);
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
