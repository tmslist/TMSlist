import type { APIRoute } from 'astro';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';
import { db } from '../../../db';
import { doctors, users, clinics } from '../../../db/schema';
import { eq, desc } from 'drizzle-orm';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

async function getClinicId(userId: string): Promise<string | null> {
  const [u] = await db.select({ clinicId: users.clinicId }).from(users).where(eq(users.id, userId)).limit(1);
  return u?.clinicId ?? null;
}

// GET /api/portal/team — list doctors for the logged-in clinic
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'clinic_owner', 'admin', 'editor')) return json({ error: 'Forbidden' }, 403);

  try {
    const clinicId = session.clinicId ?? await getClinicId(session.userId);
    if (!clinicId) return json({ data: [] });

    const rows = await db
      .select({
        id: doctors.id,
        name: doctors.name,
        firstName: doctors.firstName,
        lastName: doctors.lastName,
        credential: doctors.credential,
        title: doctors.title,
        school: doctors.school,
        yearsExperience: doctors.yearsExperience,
        specialties: doctors.specialties,
        bio: doctors.bio,
        imageUrl: doctors.imageUrl,
        createdAt: doctors.createdAt,
      })
      .from(doctors)
      .where(eq(doctors.clinicId, clinicId))
      .orderBy(desc(doctors.createdAt));

    return json({ data: rows });
  } catch (err) {
    console.error('[GET /api/portal/team]', err);
    return json({ error: 'Failed to load team' }, 500);
  }
};

// POST /api/portal/team — create a new doctor/staff record
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'clinic_owner', 'admin', 'editor')) return json({ error: 'Forbidden' }, 403);

  try {
    const clinicId = session.clinicId ?? await getClinicId(session.userId);
    if (!clinicId) return json({ error: 'No clinic linked' }, 403);

    let body: unknown;
    try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

    const b = body as Record<string, unknown>;
    if (!b.name || typeof b.name !== 'string') {
      return json({ error: 'Name is required' }, 422);
    }

    const [created] = await db.insert(doctors).values({
      clinicId,
      name: String(b.name),
      firstName: b.firstName ? String(b.firstName) : null,
      lastName: b.lastName ? String(b.lastName) : null,
      credential: b.credential ? String(b.credential) : null,
      title: b.title ? String(b.title) : null,
      school: b.school ? String(b.school) : null,
      yearsExperience: b.yearsExperience ? Number(b.yearsExperience) : null,
      specialties: b.specialties && Array.isArray(b.specialties) ? b.specialties.map(String) : null,
      bio: b.bio ? String(b.bio) : null,
      imageUrl: b.imageUrl ? String(b.imageUrl) : null,
    }).returning({ id: doctors.id });

    return json({ success: true, id: created.id }, 201);
  } catch (err) {
    console.error('[POST /api/portal/team]', err);
    return json({ error: 'Failed to add team member' }, 500);
  }
};

// PUT /api/portal/team?id=xxx — update a doctor/staff record
export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'clinic_owner', 'admin', 'editor')) return json({ error: 'Forbidden' }, 403);

  try {
    const clinicId = session.clinicId ?? await getClinicId(session.userId);
    if (!clinicId) return json({ error: 'No clinic linked' }, 403);

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return json({ error: 'ID required' }, 400);

    const [existing] = await db.select({ id: doctors.id }).from(doctors).where(eq(doctors.id, id)).limit(1);
    if (!existing) return json({ error: 'Not found' }, 404);

    let body: unknown;
    try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

    const b = body as Record<string, unknown>;
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    for (const field of ['name', 'firstName', 'lastName', 'credential', 'title', 'school', 'bio', 'imageUrl'] as const) {
      if (field in b && b[field] != null) updateData[field] = b[field];
    }
    if ('yearsExperience' in b) updateData.yearsExperience = b.yearsExperience != null ? Number(b.yearsExperience) : null;
    if ('specialties' in b && Array.isArray(b.specialties)) updateData.specialties = b.specialties.map(String);

    await db.update(doctors).set(updateData).where(eq(doctors.id, id));
    return json({ success: true });
  } catch (err) {
    console.error('[PUT /api/portal/team]', err);
    return json({ error: 'Failed to update team member' }, 500);
  }
};

// DELETE /api/portal/team?id=xxx — remove a doctor
export const DELETE: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'clinic_owner', 'admin', 'editor')) return json({ error: 'Forbidden' }, 403);

  try {
    const clinicId = session.clinicId ?? await getClinicId(session.userId);
    if (!clinicId) return json({ error: 'No clinic linked' }, 403);

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return json({ error: 'ID required' }, 400);

    const [existing] = await db.select({ id: doctors.id }).from(doctors).where(eq(doctors.id, id)).limit(1);
    if (!existing) return json({ error: 'Not found' }, 404);

    await db.delete(doctors).where(eq(doctors.id, id));
    return json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/portal/team]', err);
    return json({ error: 'Failed to remove team member' }, 500);
  }
};