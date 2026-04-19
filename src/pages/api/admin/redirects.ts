import type { APIRoute } from 'astro';
import { eq, sql } from 'drizzle-orm';
import { db } from '../../../db';
import { redirects, auditLog } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// GET: List all redirects
export const GET: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'admin', 'editor')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const rules = await db.select().from(redirects).orderBy(sql`${redirects.createdAt} DESC`);
    return json({ data: rules });
  } catch (err) {
    console.error('List redirects error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// POST: Create redirect
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'admin')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await request.json();
    const { sourcePath, targetPath, type } = body;
    if (!sourcePath || !targetPath) {
      return json({ error: 'sourcePath and targetPath are required' }, 400);
    }

    // Check for path conflicts
    const existing = await db.execute(sql`
      SELECT id, target_path FROM redirects
      WHERE source_path = ${sourcePath}
      UNION ALL
      SELECT 'page' as id, path FROM seo_overrides WHERE path = ${sourcePath}
      LIMIT 1
    `);
    if ((existing.rows || []).length > 0) {
      return json({ error: 'Source path conflicts with an existing page or redirect' }, 409);
    }

    const [rule] = await db.insert(redirects).values({
      sourcePath,
      targetPath,
      type: type || '301',
      createdBy: session.userId,
    }).returning();

    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'create_redirect',
      entityType: 'redirect',
      entityId: rule.id,
      details: { sourcePath, targetPath, type },
    });

    return json({ success: true, rule }, 201);
  } catch (err) {
    console.error('Create redirect error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// PUT: Update redirect
export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'admin')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return json({ error: 'Redirect ID required' }, 400);

    const allowed = ['sourcePath', 'targetPath', 'type', 'isActive'] as const;
    const safe: Record<string, unknown> = {};
    for (const k of allowed) {
      if (k in updates) safe[k] = updates[k];
    }

    await db.update(redirects).set(safe).where(eq(redirects.id, id));
    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'update_redirect',
      entityType: 'redirect',
      entityId: id,
      details: { fields: Object.keys(safe) },
    });

    return json({ success: true });
  } catch (err) {
    console.error('Update redirect error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// DELETE: Remove redirect
export const DELETE: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'admin')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const id = url.searchParams.get('id');
    if (!id) return json({ error: 'Redirect ID required' }, 400);

    await db.delete(redirects).where(eq(redirects.id, id));
    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'delete_redirect',
      entityType: 'redirect',
      entityId: id,
    });

    return json({ success: true });
  } catch (err) {
    console.error('Delete redirect error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};
