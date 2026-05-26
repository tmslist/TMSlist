import type { APIRoute } from 'astro';
import { db } from '../../../../db';
import { clinicClaims, clinics } from '../../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../../utils/auth';
import { eq, and, sql } from 'drizzle-orm';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin', 'editor')) return json({ error: 'Forbidden' }, 403);

  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') ?? 'pending';
    const page = parseInt(url.searchParams.get('page') ?? '1');
    const pageSize = 50;
    const offset = (page - 1) * pageSize;

    const claims = await db.execute(sql`
      SELECT
        cc.id, cc.email, cc.status, cc.created_at, cc.verified_at,
        c.id AS clinic_id, c.name AS clinic_name, c.slug AS clinic_slug
      FROM clinic_claims cc
      JOIN clinics c ON c.id = cc.clinic_id
      WHERE cc.status = ${status}
        AND c.deleted_at IS NULL
      ORDER BY cc.created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `);

    const [{ count: total }] = await db.execute(sql`
      SELECT count(*) FROM clinic_claims cc
      JOIN clinics c ON c.id = cc.clinic_id
      WHERE cc.status = ${status} AND c.deleted_at IS NULL
    `);

    return json({
      claims: claims.rows,
      total: Number(total),
      page,
      pageSize,
    });
  } catch (err) {
    console.error('Claims list error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const body = await request.json() as {
      claimId: string;
      action: 'approve' | 'reject';
      reason?: string;
    };

    if (!body.claimId || !body.action) {
      return json({ error: 'claimId and action required' }, 400);
    }

    if (!['approve', 'reject'].includes(body.action)) {
      return json({ error: 'action must be approve or reject' }, 400);
    }

    const [claim] = await db.select({
      id: clinicClaims.id,
      clinicId: clinicClaims.clinicId,
      email: clinicClaims.email,
      status: clinicClaims.status,
    }).from(clinicClaims).where(eq(clinicClaims.id, body.claimId)).limit(1);

    if (!claim) return json({ error: 'Claim not found' }, 404);
    if (claim.status !== 'pending') return json({ error: 'Claim is not pending' }, 409);

    const newStatus = body.action === 'approve' ? 'verified' : 'rejected';

    await db.update(clinicClaims)
      .set({
        status: newStatus,
        verifiedAt: newStatus === 'verified' ? new Date() : null,
      })
      .where(eq(clinicClaims.id, body.claimId));

    // If approved, give the user editor role and link them to the clinic
    if (newStatus === 'verified') {
      const [clinic] = await db.select({ id: clinics.id }).from(clinics)
        .where(eq(clinics.id, claim.clinicId)).limit(1);
      if (clinic) {
        await db.execute(sql`
          UPDATE users
          SET role = 'editor', clinic_id = ${clinic.id}
          WHERE email = ${claim.email}
        `);
      }
    }

    return json({ success: true, status: newStatus });
  } catch (err) {
    console.error('Claim action error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};