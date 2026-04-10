import type { APIRoute } from 'astro';
import { searchClinics } from '../../../db/queries';
import { clinicSearchSchema } from '../../../db/validation';
import { strictRateLimit, getClientIp } from '../../../utils/rateLimit';

export const prerender = false;

export const GET: APIRoute = async ({ request, url }) => {
  try {
    const ip = getClientIp(request);
    const rateLimited = await strictRateLimit(ip, 30, '1 m', 'clinics:search');
    if (rateLimited) return rateLimited;
    const params = Object.fromEntries(url.searchParams);

    // Parse array params
    if (params.machines) params.machines = params.machines.split(',') as any;
    if (params.insurances) params.insurances = params.insurances.split(',') as any;
    if (params.specialties) params.specialties = params.specialties.split(',') as any;
    if (params.country) params.country = params.country.toUpperCase() as any;

    const parsed = clinicSearchSchema.safeParse(params);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid search parameters', details: parsed.error.flatten() }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const results = await searchClinics(parsed.data);

    return new Response(JSON.stringify({ data: results, count: results.length }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=600',
      },
    });
  } catch (err) {
    console.error('Search error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
