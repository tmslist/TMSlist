import type { APIRoute } from 'astro';
import { getSessionFromRequest } from '../../../utils/auth';
import { db } from '../../../db';
import { clinics, users, clinicClaims } from '../../../db/schema';
import { eq, ilike } from 'drizzle-orm';
import { randomBytes } from 'crypto';

export const prerender = false;

// GET: Search clinics by name
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('q')?.trim();

    if (!query || query.length < 2) {
      return new Response(JSON.stringify({ clinics: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const results = await db.select({
      id: clinics.id,
      name: clinics.name,
      city: clinics.city,
      state: clinics.state,
      address: clinics.address,
    })
      .from(clinics)
      .where(ilike(clinics.name, `%${query}%`))
      .limit(20);

    return new Response(JSON.stringify({ clinics: results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Portal claim search error:', err);
    return new Response(JSON.stringify({ error: 'Search failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

// POST: Claim a clinic
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const body = await request.json();
    const { clinicId } = body;

    if (!clinicId) {
      return new Response(JSON.stringify({ error: 'Clinic ID is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Check clinic exists
    const clinicRows = await db.select({
      id: clinics.id,
      name: clinics.name,
      email: clinics.email,
    }).from(clinics).where(eq(clinics.id, clinicId)).limit(1);

    const clinic = clinicRows[0];
    if (!clinic) {
      return new Response(JSON.stringify({ error: 'Clinic not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    // Check if user already has a clinic
    const userRows = await db.select({ clinicId: users.clinicId }).from(users).where(eq(users.id, session.userId)).limit(1);
    if (userRows[0]?.clinicId) {
      return new Response(JSON.stringify({ error: 'You already have a clinic linked to your account' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Direct claim if email matches clinic email
    const userEmail = session.email.toLowerCase();
    const clinicEmail = clinic.email?.toLowerCase();

    if (clinicEmail && clinicEmail === userEmail) {
      // Direct assignment
      await db.update(users).set({
        clinicId: clinic.id,
        role: 'clinic_owner' as const,
      }).where(eq(users.id, session.userId));

      return new Response(JSON.stringify({ success: true, directClaim: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Otherwise create a pending claim
    const verificationToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db.insert(clinicClaims).values({
      clinicId: clinic.id,
      userId: session.userId,
      email: userEmail,
      verificationToken,
      status: 'pending',
      expiresAt,
    });

    return new Response(JSON.stringify({ success: true, directClaim: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Portal claim error:', err);
    return new Response(JSON.stringify({ error: 'Failed to claim clinic' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
