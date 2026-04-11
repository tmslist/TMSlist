import type { APIRoute } from 'astro';
import { eq, desc, and, sql } from 'drizzle-orm';
import { db } from '../../../db';
import { seoOverrides, auditLog } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

// List or get single SEO override
export const GET: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin', 'editor')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Single override by path
    const path = url.searchParams.get('path');
    if (path) {
      const result = await db.select().from(seoOverrides).where(eq(seoOverrides.path, path)).limit(1);
      if (result.length === 0) {
        return new Response(JSON.stringify({ error: 'Override not found' }), {
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
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const conditions = [];
    if (search) {
      conditions.push(sql`${seoOverrides.path} ILIKE ${'%' + search + '%'}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db.select().from(seoOverrides)
      .where(whereClause)
      .orderBy(desc(seoOverrides.updatedAt))
      .limit(limit)
      .offset(offset);

    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(seoOverrides)
      .where(whereClause);
    const total = Number(countResult[0]?.count ?? 0);

    return new Response(JSON.stringify({ data, total }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Admin SEO list error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// Create or upsert SEO override
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin', 'editor')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { path, metaTitle, metaDescription, ogImage, canonicalUrl, noIndex, structuredData } = body;

    if (!path) {
      return new Response(JSON.stringify({ error: 'Path is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const now = new Date();
    const result = await db.insert(seoOverrides).values({
      path,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      ogImage: ogImage || null,
      canonicalUrl: canonicalUrl || null,
      noIndex: noIndex ?? false,
      structuredData: structuredData || null,
      updatedAt: now,
      updatedBy: session!.userId,
    }).onConflictDoUpdate({
      target: seoOverrides.path,
      set: {
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        ogImage: ogImage || null,
        canonicalUrl: canonicalUrl || null,
        noIndex: noIndex ?? false,
        structuredData: structuredData || null,
        updatedAt: now,
        updatedBy: session!.userId,
      },
    }).returning();

    await db.insert(auditLog).values({
      userId: session?.userId ?? null,
      action: 'upsert_seo_override',
      entityType: 'seo_override',
      entityId: result[0].id,
      details: { path },
    });

    return new Response(JSON.stringify({ data: result[0] }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Admin SEO create error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// Update SEO override by id
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
      return new Response(JSON.stringify({ error: 'Override ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const allowedFields = ['path', 'metaTitle', 'metaDescription', 'ogImage', 'canonicalUrl', 'noIndex', 'structuredData'];
    const safeUpdates: Record<string, unknown> = {
      updatedAt: new Date(),
      updatedBy: session!.userId,
    };

    for (const key of allowedFields) {
      if (key in updates) {
        safeUpdates[key] = updates[key];
      }
    }

    await db.update(seoOverrides).set(safeUpdates).where(eq(seoOverrides.id, id));

    await db.insert(auditLog).values({
      userId: session?.userId ?? null,
      action: 'update_seo_override',
      entityType: 'seo_override',
      entityId: id,
      details: { fields: Object.keys(safeUpdates).filter(k => k !== 'updatedAt' && k !== 'updatedBy') },
    });

    const updated = await db.select().from(seoOverrides).where(eq(seoOverrides.id, id)).limit(1);

    return new Response(JSON.stringify({ data: updated[0] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Admin SEO update error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// Delete SEO override
export const DELETE: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const id = url.searchParams.get('id');
    if (!id) {
      return new Response(JSON.stringify({ error: 'Override ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const override = await db.select({ path: seoOverrides.path }).from(seoOverrides).where(eq(seoOverrides.id, id)).limit(1);

    await db.delete(seoOverrides).where(eq(seoOverrides.id, id));

    await db.insert(auditLog).values({
      userId: session?.userId ?? null,
      action: 'delete_seo_override',
      entityType: 'seo_override',
      entityId: id,
      details: { path: override[0]?.path },
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Admin SEO delete error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
