import type { APIRoute } from 'astro';
import { eq, desc, sql, and } from 'drizzle-orm';
import { db } from '../../../db';
import { doctors, clinics, auditLog } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// List doctors with clinic name, search, pagination, optional clinicId filter
export const GET: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin', 'editor')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const search = url.searchParams.get('search') || '';
    const clinicId = url.searchParams.get('clinicId');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const conditions = [];
    if (search) {
      conditions.push(sql`(
        ${doctors.name} ILIKE ${'%' + search + '%'} OR
        ${doctors.credential} ILIKE ${'%' + search + '%'} OR
        ${doctors.bio} ILIKE ${'%' + search + '%'}
      )`);
    }
    if (clinicId) {
      conditions.push(eq(doctors.clinicId, clinicId));
    }

    const data = await db
      .select({
        id: doctors.id,
        clinicId: doctors.clinicId,
        slug: doctors.slug,
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
        clinicName: clinics.name,
      })
      .from(doctors)
      .leftJoin(clinics, eq(doctors.clinicId, clinics.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(doctors.createdAt))
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(doctors)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    const total = Number(countResult[0]?.count ?? 0);

    return json({ data, total });
  } catch (err) {
    console.error('Admin doctors list error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// Create a doctor
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin', 'editor')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await request.json();
    const { name, firstName, lastName, credential, title, school, yearsExperience, specialties, bio, imageUrl, clinicId, slug } = body;

    if (!name || !clinicId) {
      return json({ error: 'Name and clinicId are required' }, 400);
    }

    const result = await db.insert(doctors).values({
      name,
      firstName: firstName || null,
      lastName: lastName || null,
      credential: credential || null,
      title: title || null,
      school: school || null,
      yearsExperience: yearsExperience != null ? Number(yearsExperience) : null,
      specialties: specialties || null,
      bio: bio || null,
      imageUrl: imageUrl || null,
      clinicId,
      slug: slug || null,
    }).returning();

    await db.insert(auditLog).values({
      userId: session?.userId ?? null,
      action: 'create_doctor',
      entityType: 'doctor',
      entityId: result[0].id,
      details: { name },
    });

    return json({ success: true, data: result[0] }, 201);
  } catch (err) {
    console.error('Admin doctor create error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// Update a doctor
export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin', 'editor')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return json({ error: 'Doctor ID required' }, 400);
    }

    const allowedFields = [
      'name', 'firstName', 'lastName', 'credential', 'title', 'school',
      'yearsExperience', 'specialties', 'bio', 'imageUrl', 'clinicId', 'slug',
    ] as const;

    const safeUpdates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in updates) {
        safeUpdates[key] = updates[key];
      }
    }

    if (Object.keys(safeUpdates).length === 0) {
      return json({ error: 'No valid fields to update' }, 400);
    }

    await db.update(doctors).set(safeUpdates).where(eq(doctors.id, id));

    await db.insert(auditLog).values({
      userId: session?.userId ?? null,
      action: 'update_doctor',
      entityType: 'doctor',
      entityId: id,
      details: { fields: Object.keys(safeUpdates) },
    });

    return json({ success: true });
  } catch (err) {
    console.error('Admin doctor update error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// Delete a doctor
export const DELETE: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const id = url.searchParams.get('id');
    if (!id) {
      return json({ error: 'Doctor ID required' }, 400);
    }

    await db.delete(doctors).where(eq(doctors.id, id));

    await db.insert(auditLog).values({
      userId: session?.userId ?? null,
      action: 'delete_doctor',
      entityType: 'doctor',
      entityId: id,
    });

    return json({ success: true });
  } catch (err) {
    console.error('Admin doctor delete error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};
