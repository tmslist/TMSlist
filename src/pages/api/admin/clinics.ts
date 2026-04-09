import type { APIRoute } from 'astro';
import { eq, desc, ilike, and, sql } from 'drizzle-orm';
import { db } from '../../../db';
import { clinics, auditLog } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

// List clinics for admin
export const GET: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin', 'editor')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const search = url.searchParams.get('search') || '';
    const verified = url.searchParams.get('verified');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const conditions = [];
    if (search) {
      conditions.push(sql`(
        ${clinics.name} ILIKE ${'%' + search + '%'} OR
        ${clinics.city} ILIKE ${'%' + search + '%'} OR
        ${clinics.email} ILIKE ${'%' + search + '%'}
      )`);
    }
    if (verified === 'true') conditions.push(eq(clinics.verified, true));
    if (verified === 'false') conditions.push(eq(clinics.verified, false));

    const query = db.select().from(clinics);
    const filtered = conditions.length > 0 ? query.where(and(...conditions)) : query;
    const data = await filtered.orderBy(desc(clinics.createdAt)).limit(limit).offset(offset);

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
  if (!hasRole(session, 'admin', 'editor')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
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
