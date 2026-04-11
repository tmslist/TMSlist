import type { APIRoute } from 'astro';
import { getSessionFromRequest } from '../../../utils/auth';
import { db } from '../../../db';
import { clinics, users } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

async function getUserClinicId(userId: string): Promise<string | null> {
  const userRows = await db.select({ clinicId: users.clinicId }).from(users).where(eq(users.id, userId)).limit(1);
  return userRows[0]?.clinicId || null;
}

export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const clinicId = await getUserClinicId(session.userId);
    if (!clinicId) {
      return new Response(JSON.stringify({ error: 'No clinic linked' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const rows = await db.select({
      id: clinics.id,
      name: clinics.name,
      description: clinics.description,
      descriptionLong: clinics.descriptionLong,
      phone: clinics.phone,
      website: clinics.website,
      email: clinics.email,
      machines: clinics.machines,
      specialties: clinics.specialties,
      insurances: clinics.insurances,
      openingHours: clinics.openingHours,
      availability: clinics.availability,
      pricing: clinics.pricing,
      media: clinics.media,
    }).from(clinics).where(eq(clinics.id, clinicId)).limit(1);

    if (!rows[0]) {
      return new Response(JSON.stringify({ error: 'Clinic not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify(rows[0]), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Portal clinic GET error:', err);
    return new Response(JSON.stringify({ error: 'Failed to load clinic' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

// Allowed fields for clinic owner updates (excludes admin-only fields)
const ALLOWED_FIELDS = [
  'name', 'description', 'descriptionLong',
  'phone', 'website', 'email',
  'machines', 'specialties', 'insurances', 'openingHours',
  'availability', 'pricing', 'media',
] as const;

export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const clinicId = await getUserClinicId(session.userId);
    if (!clinicId) {
      return new Response(JSON.stringify({ error: 'No clinic linked' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    const body = await request.json();

    // Only allow whitelisted fields
    const updateData: Record<string, unknown> = {};
    for (const field of ALLOWED_FIELDS) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    updateData.updatedAt = new Date();

    await db.update(clinics).set(updateData).where(eq(clinics.id, clinicId));

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Portal clinic PUT error:', err);
    return new Response(JSON.stringify({ error: 'Failed to update clinic' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
