import type { APIRoute } from 'astro';
import { eq, sql, and } from 'drizzle-orm';
import { db } from '../../../db';
import { pageContent, auditLog } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// GET /api/admin/page-content?page=homepage
// GET /api/admin/page-content?page=all
export const GET: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin', 'editor')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const pageParam = url.searchParams.get('page');

    if (pageParam && pageParam !== 'all') {
      const data = await db
        .select()
        .from(pageContent)
        .where(eq(pageContent.page, pageParam))
        .orderBy(pageContent.order);
      return json({ data });
    }

    // Return all content grouped by page
    const data = await db
      .select()
      .from(pageContent)
      .orderBy(pageContent.page, pageContent.order);

    // Get distinct pages
    const pagesResult = await db
      .selectDistinct({ page: pageContent.page })
      .from(pageContent);
    const pages = pagesResult.map((r) => r.page);

    return json({ data, pages });
  } catch (err) {
    console.error('Page content GET error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// PUT /api/admin/page-content — upsert a section
export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin', 'editor')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await request.json();
    const { page, section, title, content, imageUrl, order } = body;

    if (!page || !section) {
      return json({ error: 'page and section are required' }, 400);
    }

    const safeValues: Record<string, unknown> = {
      page,
      section,
      title: title ?? null,
      content: content ?? null,
      imageUrl: imageUrl ?? null,
      order: order != null ? Number(order) : 0,
    };

    const result = await db
      .insert(pageContent)
      .values(safeValues)
      .onConflictDoUpdate({
        target: [pageContent.page, pageContent.section],
        set: {
          title: safeValues.title,
          content: safeValues.content,
          imageUrl: safeValues.imageUrl,
          order: safeValues.order,
          updatedAt: new Date(),
        },
      })
      .returning();

    await db.insert(auditLog).values({
      userId: session?.userId ?? null,
      action: 'upsert_page_content',
      entityType: 'page_content',
      entityId: result[0].id,
      details: { page, section },
    });

    return json({ success: true, data: result[0] });
  } catch (err) {
    console.error('Page content PUT error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// DELETE /api/admin/page-content — delete a section
export const DELETE: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await request.json();
    const { page, section } = body;

    if (!page || !section) {
      return json({ error: 'page and section are required' }, 400);
    }

    await db
      .delete(pageContent)
      .where(and(eq(pageContent.page, page), eq(pageContent.section, section)));

    await db.insert(auditLog).values({
      userId: session?.userId ?? null,
      action: 'delete_page_content',
      entityType: 'page_content',
      entityId: null,
      details: { page, section },
    });

    return json({ success: true });
  } catch (err) {
    console.error('Page content DELETE error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};
