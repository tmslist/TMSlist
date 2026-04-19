import type { APIRoute } from 'astro';
import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../../../db';
import { experimentVariants, experiments, auditLog } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// GET: List variants for an experiment
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const url = new URL(request.url);
    const experimentId = url.searchParams.get('experimentId');

    if (!experimentId) return json({ error: 'experimentId is required' }, 400);

    const variants = await db
      .select()
      .from(experimentVariants)
      .where(eq(experimentVariants.experimentId, experimentId))
      .orderBy(sql`${experimentVariants.createdAt} ASC`);

    return json({ data: variants });
  } catch (err) {
    console.error('Experiment variants GET error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// POST: Add variant to experiment
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const body = await request.json();
    const { experimentId, name, changes } = body;

    if (!experimentId || !name) {
      return json({ error: 'experimentId and name are required' }, 400);
    }

    // Verify experiment exists
    const exp = await db.select().from(experiments).where(eq(experiments.id, experimentId)).limit(1);
    if (!exp[0]) return json({ error: 'Experiment not found' }, 404);

    const [variant] = await db.insert(experimentVariants).values({
      experimentId,
      name,
      changes: changes || null,
      impressions: 0,
      conversions: 0,
    }).returning();

    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'add_experiment_variant',
      entityType: 'experiment_variant',
      entityId: variant.id,
      details: { experimentId, name },
    });

    return json({ success: true, data: variant }, 201);
  } catch (err) {
    console.error('Experiment variants POST error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// PUT: Update variant (changes JSON, or update impressions/conversions from events)
export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const body = await request.json();
    const { id, changes, impressions, conversions, incrementImpressions, incrementConversions } = body;
    if (!id) return json({ error: 'Variant ID required' }, 400);

    const updates: Record<string, unknown> = {};
    if (changes !== undefined) updates.changes = changes;
    if (typeof impressions === 'number') updates.impressions = impressions;
    if (typeof conversions === 'number') updates.conversions = conversions;
    if (typeof incrementImpressions === 'number' && incrementImpressions > 0) {
      updates.impressions = sql`${experimentVariants.impressions} + ${incrementImpressions}`;
    }
    if (typeof incrementConversions === 'number' && incrementConversions > 0) {
      updates.conversions = sql`${experimentVariants.conversions} + ${incrementConversions}`;
    }

    if (Object.keys(updates).length === 0) return json({ error: 'No valid fields to update' }, 400);

    await db.update(experimentVariants).set(updates).where(eq(experimentVariants.id, id));

    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'update_experiment_variant',
      entityType: 'experiment_variant',
      entityId: id,
      details: { fields: Object.keys(body).filter(k => !['id'].includes(k)) },
    });

    return json({ success: true });
  } catch (err) {
    console.error('Experiment variants PUT error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// DELETE: Remove variant
export const DELETE: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const id = url.searchParams.get('id');
    if (!id) return json({ error: 'Variant ID required' }, 400);

    await db.delete(experimentVariants).where(eq(experimentVariants.id, id));

    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'delete_experiment_variant',
      entityType: 'experiment_variant',
      entityId: id,
    });

    return json({ success: true });
  } catch (err) {
    console.error('Experiment variants DELETE error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};