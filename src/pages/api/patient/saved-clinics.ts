import type { APIRoute } from 'astro';
import { eq, and } from 'drizzle-orm';
import { db } from '../../../db';
import { savedClinics, clinics } from '../../../db/schema';
import { getSessionFromRequest } from '../../../utils/auth';

export const prerender = false;

/** Get user's saved clinics */
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const saved = await db
      .select({
        savedId: savedClinics.id,
        savedAt: savedClinics.createdAt,
        clinic: clinics,
      })
      .from(savedClinics)
      .innerJoin(clinics, eq(savedClinics.clinicId, clinics.id))
      .where(eq(savedClinics.userId, session.userId))
      .orderBy(savedClinics.createdAt);

    return new Response(JSON.stringify({ data: saved }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Saved clinics fetch error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/** Save or unsave a clinic */
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { clinicId, action } = await request.json();

    if (!clinicId) {
      return new Response(JSON.stringify({ error: 'clinicId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (action === 'unsave') {
      await db.delete(savedClinics).where(
        and(eq(savedClinics.userId, session.userId), eq(savedClinics.clinicId, clinicId))
      );
      return new Response(JSON.stringify({ success: true, action: 'unsaved' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if already saved
    const existing = await db.select().from(savedClinics).where(
      and(eq(savedClinics.userId, session.userId), eq(savedClinics.clinicId, clinicId))
    ).limit(1);

    if (existing.length > 0) {
      return new Response(JSON.stringify({ success: true, action: 'already_saved' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await db.insert(savedClinics).values({
      userId: session.userId,
      clinicId,
    });

    return new Response(JSON.stringify({ success: true, action: 'saved' }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Save clinic error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
