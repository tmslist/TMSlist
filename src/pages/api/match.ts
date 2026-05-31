import type { APIRoute } from 'astro';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../../db';
import { clinics } from '../../db/schema';
import { z } from 'zod';
import { rankClinics, getCachedMatches, setCachedMatches, type MatchInput } from '../../utils/rateLimit';

export const prerender = false;

const matchSchema = z.object({
  symptoms: z.array(z.string()).min(1).max(10),
  severity: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  treatmentHistory: z.array(z.string()),
  insurance: z.string().optional(),
  location: z.object({ city: z.string().min(1), state: z.string().min(2).max(2) }),
  preference: z.enum(['in-person', 'telehealth', 'no-preference']),
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const parsed = matchSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Validation failed: ' + parsed.error.issues.map(i => i.message).join(', ') }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const input: MatchInput = parsed.data;

    // Check cache first
    const cached = getCachedMatches(input);
    if (cached) {
      return new Response(JSON.stringify({ matches: cached, totalMatched: cached.length }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
      });
    }

    // Fetch all verified clinics with availability
    const clinicRows = await db
      .select({
        id: clinics.id,
        name: clinics.name,
        slug: clinics.slug,
        specialty: clinics.specialties,
        machines: clinics.machines,
        insurances: clinics.insurances,
        city: clinics.city,
        state: clinics.state,
        description: clinics.description,
        verified: clinics.verified,
        ratingAvg: clinics.ratingAvg,
        availability: clinics.availability,
      })
      .from(clinics)
      .where(and(eq(clinics.verified, true), isNull(clinics.deletedAt)))
      .limit(200);

    // Map to ClinicProfile
    const clinicProfiles = clinicRows.map(row => ({
      clinicId: row.id,
      name: row.name,
      slug: row.slug,
      specialty: row.specialty || [],
      machines: row.machines || [],
      insurances: row.insurances || [],
      location: { city: row.city, state: row.state },
      hasTelehealth: row.availability?.telehealth_consults ?? false,
      avgRating: parseFloat(row.ratingAvg || '0'),
      hasAvailability: row.availability?.accepting_new_patients ?? true,
      healthScore: 70,
      isVerified: row.verified,
      description: row.description || '',
    }));

    // Rank and get top matches
    const matches = rankClinics(input, clinicProfiles, 10);

    // Cache results
    setCachedMatches(input, matches);

    return new Response(JSON.stringify({ matches, totalMatched: matches.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
    });
  } catch (err) {
    console.error('Match API error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};