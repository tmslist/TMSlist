import type { APIRoute } from 'astro';
import { eq, sql } from 'drizzle-orm';
import { db } from '../../../db';
import { featureFlags, auditLog } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// GET: List all feature flags OR check a specific key
export const GET: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'admin')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const key = url.searchParams.get('key');
    if (key) {
      const flag = await db.select().from(featureFlags).where(eq(featureFlags.key, key)).limit(1);
      if (!flag[0]) return json({ error: 'Feature flag not found' }, 404);
      return json({ data: flag[0] });
    }

    const flags = await db.select().from(featureFlags).orderBy(sql`${featureFlags.createdAt} ASC`);
    return json({ data: flags });
  } catch (err) {
    console.error('Feature flags error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// POST: Create flag OR toggle existing
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'admin')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await request.json();

    if (body.toggle && body.key) {
      const flag = await db.select().from(featureFlags).where(eq(featureFlags.key, body.key)).limit(1);
      if (flag[0]) {
        await db.update(featureFlags).set({ isEnabled: !flag[0].isEnabled })
          .where(eq(featureFlags.key, body.key));
        await db.insert(auditLog).values({
          userId: session.userId,
          action: 'toggle_feature_flag',
          entityType: 'feature_flag',
          entityId: flag[0].id,
          details: { key: body.key, newValue: !flag[0].isEnabled },
        });
        return json({ success: true, isEnabled: !flag[0].isEnabled });
      }
    }

    const { key, description, isEnabled, rolloutPercent, targetRoles } = body;
    if (!key) return json({ error: 'Key is required' }, 400);

    const [flag] = await db.insert(featureFlags).values({
      key,
      description: description || null,
      isEnabled: isEnabled ?? false,
      rolloutPercent: rolloutPercent ?? 0,
      targetRoles: targetRoles ?? null,
      createdBy: session.userId,
    }).returning();

    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'create_feature_flag',
      entityType: 'feature_flag',
      entityId: flag.id,
      details: { key },
    });

    return json({ success: true, flag }, 201);
  } catch (err) {
    console.error('Feature flag error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// PUT: Update flag
export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'admin')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return json({ error: 'Flag ID required' }, 400);

    const allowed = ['description', 'isEnabled', 'rolloutPercent', 'targetRoles'] as const;
    const safe: Record<string, unknown> = {};
    for (const k of allowed) {
      if (k in updates) safe[k] = updates[k];
    }

    await db.update(featureFlags).set(safe).where(eq(featureFlags.id, id));
    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'update_feature_flag',
      entityType: 'feature_flag',
      entityId: id,
      details: { fields: Object.keys(safe) },
    });

    return json({ success: true });
  } catch (err) {
    console.error('Update feature flag error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// DELETE: Remove flag
export const DELETE: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'admin')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const id = url.searchParams.get('id');
    if (!id) return json({ error: 'Flag ID required' }, 400);

    await db.delete(featureFlags).where(eq(featureFlags.id, id));
    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'delete_feature_flag',
      entityType: 'feature_flag',
      entityId: id,
    });

    return json({ success: true });
  } catch (err) {
    console.error('Delete feature flag error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};
