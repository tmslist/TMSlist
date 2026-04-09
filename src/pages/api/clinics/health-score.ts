import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { clinics } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { calculateHealthScore } from '../../../utils/healthScore';
import { getCached, setCache } from '../../../utils/redis';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const clinicId = url.searchParams.get('clinicId');
  if (!clinicId) {
    return new Response(JSON.stringify({ error: 'clinicId required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check cache
  const cacheKey = `health_score:${clinicId}`;
  const cached = await getCached<any>(cacheKey);
  if (cached) {
    return new Response(JSON.stringify(cached), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
    });
  }

  try {
    const result = await db.select().from(clinics).where(eq(clinics.id, clinicId)).limit(1);
    const clinic = result[0];

    if (!clinic) {
      return new Response(JSON.stringify({ error: 'Clinic not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const score = calculateHealthScore({
      ratingAvg: Number(clinic.ratingAvg || 0),
      reviewCount: clinic.reviewCount || 0,
      verified: clinic.verified,
      isFeatured: clinic.isFeatured,
      phone: clinic.phone,
      website: clinic.website,
      email: clinic.email,
      description: clinic.description,
      descriptionLong: clinic.descriptionLong,
      machines: clinic.machines,
      specialties: clinic.specialties,
      insurances: clinic.insurances,
      openingHours: clinic.openingHours,
      accessibility: clinic.accessibility as any,
      availability: clinic.availability as any,
      pricing: clinic.pricing as any,
      media: clinic.media as any,
      faqs: clinic.faqs as any,
    });

    // Cache for 1 hour
    await setCache(cacheKey, score, 3600);

    return new Response(JSON.stringify(score), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
    });
  } catch (err) {
    console.error('Health score error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
