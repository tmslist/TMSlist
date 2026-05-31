import type { APIRoute } from 'astro';
import { eq, desc, count, sql, and } from 'drizzle-orm';
import { db } from '../../../db';
import { treatments } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth.js';

export const prerender = false;

// GET: List treatments
export const GET: APIRoute = async ({ request }) => {
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
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const limit = Math.max(1, Math.min(parseInt(url.searchParams.get('limit') || '50'), 200));
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0'));

    const whereClause = search
      ? sql`${treatments.name} ILIKE ${'%' + search + '%'} OR ${treatments.description} ILIKE ${'%' + search + '%'} OR ${treatments.slug} ILIKE ${'%' + search + '%'}`
      : undefined;

    const rows = await db.select().from(treatments)
      .where(whereClause)
      .orderBy(treatments.name)
      .limit(limit).offset(offset);

    const [total] = await db.select({ count: count() }).from(treatments).where(whereClause);

    return new Response(JSON.stringify({
      treatments: rows,
      total: Number(total?.count ?? 0),
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[/api/admin/treatments GET]', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST: Create treatment
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'admin', 'editor')) {
    const status = session ? 403 : 401;
    return new Response(JSON.stringify({ error: status === 403 ? 'Forbidden' : 'Unauthorized' }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { slug, name, fullName, description, fdaApproved, conditions, howItWorks, sessionDuration, treatmentCourse, insuranceCoverage } = body;

    if (!slug || !name) {
      return new Response(JSON.stringify({ error: 'slug and name are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const [row] = await db.insert(treatments).values({
      slug,
      name,
      fullName: fullName || null,
      description: description || null,
      fdaApproved: fdaApproved ?? false,
      conditions: conditions || null,
      howItWorks: howItWorks || null,
      sessionDuration: sessionDuration || null,
      treatmentCourse: treatmentCourse || null,
      insuranceCoverage: insuranceCoverage || null,
    }).returning();

    return new Response(JSON.stringify({ treatment: row }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[/api/admin/treatments POST]', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// PUT: Update treatment
export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'admin', 'editor')) {
    const status = session ? 403 : 401;
    return new Response(JSON.stringify({ error: status === 403 ? 'Forbidden' : 'Unauthorized' }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { id, slug, name, fullName, description, fdaApproved, conditions, howItWorks, sessionDuration, treatmentCourse, insuranceCoverage } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: 'id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const updates: Record<string, unknown> = {};
    if (slug !== undefined) updates.slug = slug;
    if (name !== undefined) updates.name = name;
    if (fullName !== undefined) updates.fullName = fullName;
    if (description !== undefined) updates.description = description;
    if (fdaApproved !== undefined) updates.fdaApproved = fdaApproved;
    if (conditions !== undefined) updates.conditions = conditions;
    if (howItWorks !== undefined) updates.howItWorks = howItWorks;
    if (sessionDuration !== undefined) updates.sessionDuration = sessionDuration;
    if (treatmentCourse !== undefined) updates.treatmentCourse = treatmentCourse;
    if (insuranceCoverage !== undefined) updates.insuranceCoverage = insuranceCoverage;

    const [row] = await db.update(treatments)
      .set(updates)
      .where(eq(treatments.id, id))
      .returning();

    if (!row) {
      return new Response(JSON.stringify({ error: 'Treatment not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ treatment: row }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[/api/admin/treatments PUT]', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// DELETE: Remove treatment
export const DELETE: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'admin')) {
    const status = session ? 403 : 401;
    return new Response(JSON.stringify({ error: status === 403 ? 'Forbidden' : 'Unauthorized' }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return new Response(JSON.stringify({ error: 'id query param required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await db.delete(treatments).where(eq(treatments.id, id));

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[/api/admin/treatments DELETE]', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};