import type { APIRoute } from 'astro';
import { searchClinicsNearby } from '../../../db/queries';
import { checkRateLimit } from '../../../utils/rateLimit';
import { z } from 'zod';

export const prerender = false;

const nearbySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(1).max(200).default(25),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const GET: APIRoute = async ({ request, url }) => {
  const blocked = await checkRateLimit(request, 'api');
  if (blocked) return blocked;

  try {
    const params = Object.fromEntries(url.searchParams);
    const parsed = nearbySchema.safeParse(params);

    if (!parsed.success) {
      return new Response(JSON.stringify({
        error: 'Invalid parameters. Provide lat, lng, and optional radius (miles).',
        details: parsed.error.flatten(),
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const results = await searchClinicsNearby({
      lat: parsed.data.lat,
      lng: parsed.data.lng,
      radiusMiles: parsed.data.radius,
      limit: parsed.data.limit,
      offset: parsed.data.offset,
      verified: true,
    });

    return new Response(JSON.stringify({ data: results, count: results.length }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=120, s-maxage=600',
      },
    });
  } catch (err) {
    console.error('Nearby search error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
