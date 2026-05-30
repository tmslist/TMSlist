import type { APIRoute } from 'astro';
import { getSessionFromRequest } from '../../../utils/auth';
import { db } from '../../../db';
import { clinicClaims, clinics, users } from '../../../db/schema';
import { eq, desc, count, and, or, inArray } from 'drizzle-orm';
import { randomBytes } from 'crypto';

export const prerender = false;

// GET /api/admin/clinic-claims - List all claims with clinic + user info
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  if (session.role !== 'admin' && session.role !== 'editor') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10) || 50));
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10) || 0);

    const conditions = [];
    if (status) conditions.push(eq(clinicClaims.status, status as any));

    const [rows, [{ total }]] = await Promise.all([
      db.select({
        id: clinicClaims.id,
        clinicId: clinicClaims.clinicId,
        email: clinicClaims.email,
        status: clinicClaims.status,
        verificationToken: clinicClaims.verificationToken,
        verifiedAt: clinicClaims.verifiedAt,
        createdAt: clinicClaims.createdAt,
        expiresAt: clinicClaims.expiresAt,
        clinicName: clinics.name,
        clinicSlug: clinics.slug,
        userId: clinicClaims.userId,
      })
        .from(clinicClaims)
        .leftJoin(clinics, eq(clinicClaims.clinicId, clinics.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(clinicClaims.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(clinicClaims),
    ]);

    return new Response(JSON.stringify({ claims: rows, total, limit, offset }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Clinic claims list error:', err);
    return new Response(JSON.stringify({ error: 'Failed to load claims' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

// POST /api/admin/clinic-claims - Create new claim (admin action for a user)
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  if (session.role !== 'admin' && session.role !== 'editor') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const body = await request.json();
    const { clinicId, userId, email } = body;

    if (!clinicId || !email) {
      return new Response(JSON.stringify({ error: 'clinicId and email are required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Check for existing pending claim
    const existing = await db.select({ id: clinicClaims.id })
      .from(clinicClaims)
      .where(and(
        eq(clinicClaims.clinicId, clinicId),
        eq(clinicClaims.status, 'pending')
      ))
      .limit(1);

    if (existing[0]) {
      return new Response(JSON.stringify({ error: 'A pending claim already exists for this clinic' }), { status: 409, headers: { 'Content-Type': 'application/json' } });
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const [claim] = await db.insert(clinicClaims).values({
      clinicId,
      userId: userId ?? null,
      email,
      verificationToken: token,
      status: 'pending',
      expiresAt,
    }).returning();

    return new Response(JSON.stringify({ claim }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Clinic claim create error:', err);
    return new Response(JSON.stringify({ error: 'Failed to create claim' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

// PUT /api/admin/clinic-claims/:id - Update claim status (approve/reject)
export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  if (session.role !== 'admin' && session.role !== 'editor') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const claimId = pathParts[pathParts.length - 1];

    if (!claimId || claimId === 'clinic-claims') {
      return new Response(JSON.stringify({ error: 'Invalid claim ID' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const body = await request.json();
    const { status, notes } = body;

    if (!status || !['pending', 'verified', 'rejected'].includes(status)) {
      return new Response(JSON.stringify({ error: 'Invalid status' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const updates: Record<string, unknown> = { status };
    if (status === 'verified') {
      updates.verifiedAt = new Date();
    }

    const [updated] = await db.update(clinicClaims)
      .set(updates)
      .where(eq(clinicClaims.id, claimId))
      .returning();

    if (!updated) {
      return new Response(JSON.stringify({ error: 'Claim not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ claim: updated }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Clinic claim update error:', err);
    return new Response(JSON.stringify({ error: 'Failed to update claim' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

// POST /api/admin/clinic-claims/:id/approve - Approve claim and transfer ownership
export const POST_APPROVE: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  if (session.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const claimId = pathParts[pathParts.length - 2]; // .../:id/approve

    if (!claimId) {
      return new Response(JSON.stringify({ error: 'Invalid claim ID' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Get the claim
    const [claim] = await db.select().from(clinicClaims).where(eq(clinicClaims.id, claimId)).limit(1);
    if (!claim) {
      return new Response(JSON.stringify({ error: 'Claim not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    // Transfer clinic ownership to claim user
    if (claim.userId) {
      await db.update(clinics)
        .set({ updatedAt: new Date() })
        .where(eq(clinics.id, claim.clinicId));

      await db.update(users)
        .set({ clinicId: claim.clinicId, role: 'clinic_owner' as any })
        .where(eq(users.id, claim.userId));
    }

    // Update claim to verified
    const [updated] = await db.update(clinicClaims)
      .set({ status: 'verified', verifiedAt: new Date() })
      .where(eq(clinicClaims.id, claimId))
      .returning();

    return new Response(JSON.stringify({ claim: updated }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Clinic claim approve error:', err);
    return new Response(JSON.stringify({ error: 'Failed to approve claim' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};