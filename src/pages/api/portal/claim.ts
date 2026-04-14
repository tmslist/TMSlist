import type { APIRoute } from 'astro';
import { getSessionFromRequest } from '../../../utils/auth';
import { db, sql } from '../../../db';
import { users, clinicClaims } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';

export const prerender = false;

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

    const safe = query.replace(/[%_]/g, '').slice(0, 100);
    const results = await sql`
      SELECT id, slug, name, city, state, address
      FROM clinics
      WHERE name ILIKE ${'%' + safe + '%'}
      LIMIT 20
    `;

    return new Response(JSON.stringify({ clinics: results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Portal claim search error:', err);
    return new Response(JSON.stringify({ error: 'Search failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const body = await request.json();
    const { clinicId, slug } = body;
    const lookupValue = clinicId || slug;

    if (!lookupValue) {
      return new Response(JSON.stringify({ error: 'Clinic ID or slug is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Get clinic using raw SQL (avoids Drizzle type coercion on UUID columns with slug values)
    const clinicRows = await sql`SELECT id, slug, name, email FROM clinics WHERE slug = ${lookupValue} LIMIT 1`;
    const clinic = clinicRows[0] as any;

    if (!clinic) {
      return new Response(JSON.stringify({ error: 'Clinic not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    // Check if user already has a clinic
    const userRows = await db.select({ clinicId: users.clinicId }).from(users).where(eq(users.id, session.userId)).limit(1);
    if (userRows[0]?.clinicId) {
      return new Response(JSON.stringify({ error: 'You already have a clinic linked to your account' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const userEmail = session.email.toLowerCase();
    const clinicEmail = clinic.email?.toLowerCase();

    if (clinicEmail && clinicEmail === userEmail) {
      // Direct assignment
      await db.update(users).set({
        clinicId: clinic.id,
        role: 'clinic_owner' as const,
      }).where(eq(users.id, session.userId));

      return new Response(JSON.stringify({ success: true, directClaim: true, clinicSlug: clinic.slug }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create a pending claim
    const verificationToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.insert(clinicClaims).values({
      clinicId: clinic.id,
      userId: session.userId,
      email: userEmail,
      verificationToken,
      status: 'pending',
      expiresAt,
    });

    return new Response(JSON.stringify({ success: true, directClaim: false, pendingVerification: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Portal claim error:', err);
    if (err instanceof Error) {
      return new Response(JSON.stringify({ error: 'Failed to claim clinic', detail: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ error: 'Failed to claim clinic' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};