import type { APIRoute } from 'astro';
import { eq, desc, ilike, and, or, sql } from 'drizzle-orm';
import { db } from '../../../db';
import { clinics, doctors, auditLog, users } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

// List clinics for admin
export const GET: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!hasRole(session, 'admin', 'editor')) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Single clinic by ID
    const singleId = url.searchParams.get('id');
    if (singleId) {
      const result = await db.select().from(clinics).where(eq(clinics.id, singleId)).limit(1);
      if (result.length === 0) {
        return new Response(JSON.stringify({ error: 'Clinic not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ data: result[0] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const search = url.searchParams.get('search') || '';
    const verified = url.searchParams.get('verified');
    const filter = url.searchParams.get('filter');
    const limit = Math.max(1, Math.min(parseInt(url.searchParams.get('limit') || '50'), 200));
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0'));

    const conditions = [];
    if (search) {
      const searchPattern = `%${search}%`;
      conditions.push(
        or(
          ilike(clinics.name, searchPattern),
          ilike(clinics.city, searchPattern),
          ilike(clinics.email, searchPattern)
        )
      );
    }
    if (verified === 'true') conditions.push(eq(clinics.verified, true));
    if (verified === 'false') conditions.push(eq(clinics.verified, false));

    // Data quality filter shortcuts
    if (filter === 'no-phone') conditions.push(sql`${clinics.phone} IS NULL`);
    if (filter === 'no-email') conditions.push(sql`${clinics.email} IS NULL`);
    if (filter === 'no-description') conditions.push(sql`${clinics.description} IS NULL`);
    if (filter === 'no-hours') conditions.push(sql`${clinics.openingHours} IS NULL OR array_length(${clinics.openingHours}, 1) IS NULL`);
    if (filter === 'no-machines') conditions.push(sql`${clinics.machines} IS NULL OR array_length(${clinics.machines}, 1) IS NULL`);
    if (filter === 'stale') conditions.push(sql`${clinics.updatedAt} < NOW() - INTERVAL '6 months'`);
    if (filter === 'unverified') conditions.push(eq(clinics.verified, false));

    const query = db.select().from(clinics);
    const filtered = conditions.length > 0 ? query.where(and(...conditions)) : query;
    const rows = await filtered.orderBy(desc(clinics.createdAt)).limit(limit).offset(offset);

    // Get doctor counts for all returned clinics in one query
    const clinicIds = rows.map(r => r.id);
    const doctorCountsResult = clinicIds.length > 0
      ? await db
          .select({ clinicId: doctors.clinicId, count: sql<number>`count(*)` })
          .from(doctors)
          .where(sql`${doctors.clinicId} IN (${sql.join(clinicIds.map(id => sql`${id}`), sql`, `)})`)
          .groupBy(doctors.clinicId)
      : [];
    // Get owner user info for all returned clinics in one query
    const ownerIds = [...new Set(rows.map(r => r.ownerUserId).filter(Boolean))] as string[];
    const ownerResults = ownerIds.length > 0
      ? await db.select({ id: users.id, email: users.email, name: users.name, role: users.role })
          .from(users)
          .where(sql`${users.id} IN (${sql.join(ownerIds.map(id => sql`${id}`), sql`, `)})`)
      : [];
    const ownerMap = new Map(ownerResults.map(o => [o.id, o]));
    const doctorCountMap = new Map(doctorCountsResult.map(r => [r.clinicId as string, Number(r.count)]));

    // Map DB snake_case fields → camelCase so AdminClinics client receives expected shape
    const data = rows.map(r => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      city: r.city,
      state: r.state,
      phone: r.phone ?? null,
      email: r.email ?? null,
      website: r.website ?? null,
      verified: r.verified,
      isFeatured: r.isFeatured,
      ratingAvg: r.ratingAvg ?? null,
      reviewCount: r.reviewCount ?? 0,
      machines: r.machines ?? [],
      createdAt: r.createdAt,
      // Include fields previously stripped
      description: r.description ?? null,
      faqs: r.faqs ?? null,
      doctorCount: doctorCountMap.get(r.id) ?? 0,
      // Owner info for Login As
      ownerUserId: r.ownerUserId ?? null,
      ownerEmail: ownerMap.get(r.ownerUserId)?.email ?? null,
      ownerName: ownerMap.get(r.ownerUserId)?.name ?? null,
    }));

    const countResult = await db.select({ count: sql<number>`count(*)` }).from(clinics)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    const total = Number(countResult[0]?.count ?? 0);

    return new Response(JSON.stringify({ data, total }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Admin clinics list error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// Verify or update a clinic
export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!hasRole(session, 'admin', 'editor')) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Clinic ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const allowedFields = [
      'verified', 'isFeatured', 'name', 'phone', 'website', 'email',
      'description', 'descriptionLong', 'machines', 'specialties', 'insurances',
      'accessibility', 'availability', 'pricing', 'openingHours',
      'address', 'city', 'state', 'zip', 'country', 'lat', 'lng',
      'providerType', 'media', 'googleProfile', 'faqs', 'slug',
    ] as const;

    const safeUpdates: Record<string, unknown> = { updatedAt: new Date() };
    for (const key of allowedFields) {
      if (key in updates) {
        safeUpdates[key] = updates[key];
      }
    }

    await db.update(clinics).set(safeUpdates).where(eq(clinics.id, id));

    // Audit log
    await db.insert(auditLog).values({
      userId: session?.userId ?? null,
      action: 'update_clinic',
      entityType: 'clinic',
      entityId: id,
      details: { fields: Object.keys(safeUpdates).filter(k => k !== 'updatedAt') },
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Admin clinic update error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// Delete a clinic
export const DELETE: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!hasRole(session, 'admin')) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const id = url.searchParams.get('id');
    if (!id) {
      return new Response(JSON.stringify({ error: 'Clinic ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await db.delete(clinics).where(eq(clinics.id, id));

    await db.insert(auditLog).values({
      userId: session?.userId ?? null,
      action: 'delete_clinic',
      entityType: 'clinic',
      entityId: id,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Admin clinic delete error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
