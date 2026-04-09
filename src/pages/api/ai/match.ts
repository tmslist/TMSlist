import type { APIRoute } from 'astro';
import { searchClinics, searchClinicsNearby } from '../../../db/queries';
import { matchClinics } from '../../../utils/ai';
import { checkRateLimit } from '../../../utils/rateLimit';
import { z } from 'zod';

export const prerender = false;

const matchSchema = z.object({
  condition: z.string().min(2).max(200),
  location: z.string().min(2).max(200),
  insurance: z.string().max(200).optional(),
  preferences: z.string().max(500).optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
});

export const POST: APIRoute = async ({ request }) => {
  const blocked = await checkRateLimit(request, 'api');
  if (blocked) return blocked;

  try {
    const body = await request.json();
    const parsed = matchSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Validation failed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch nearby clinics or search by location
    let clinicResults;
    if (parsed.data.lat && parsed.data.lng) {
      clinicResults = await searchClinicsNearby({
        lat: parsed.data.lat,
        lng: parsed.data.lng,
        radiusMiles: 50,
        limit: 20,
        verified: true,
      });
    } else {
      clinicResults = await searchClinics({
        query: parsed.data.location,
        verified: true,
        limit: 20,
      });
    }

    if (clinicResults.length === 0) {
      return new Response(JSON.stringify({
        recommendation: `No TMS clinics found near ${parsed.data.location}. Try expanding your search area.`,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const summaries = clinicResults.map(c => ({
      name: c.name,
      city: c.city,
      state: c.state,
      machines: c.machines || [],
      specialties: c.specialties || [],
      insurances: c.insurances || [],
      rating: Number(c.ratingAvg) || 0,
    }));

    const recommendation = await matchClinics({
      condition: parsed.data.condition,
      location: parsed.data.location,
      insurance: parsed.data.insurance,
      preferences: parsed.data.preferences,
      clinicSummaries: summaries,
    });

    return new Response(JSON.stringify({ recommendation, clinicCount: clinicResults.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('AI match error:', err);
    return new Response(JSON.stringify({ error: 'AI matching failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
