import type { APIRoute } from 'astro';
import { eq, desc, sql, and } from 'drizzle-orm';
import { db } from '../../../db';
import { experiments, experimentVariants, auditLog } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// GET: List experiments with variants
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const url = new URL(request.url);
    const statusFilter = url.searchParams.get('status');

    const conditions = [];
    if (statusFilter) conditions.push(eq(experiments.status, statusFilter));

    const experimentsData = await db
      .select()
      .from(experiments)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(experiments.createdAt));

    // Fetch variants for each experiment
    const experimentIds = experimentsData.map(e => e.id);
    const variantsData = experimentIds.length > 0
      ? await db
          .select()
          .from(experimentVariants)
          .where(sql`${experimentVariants.experimentId} IN ${experimentIds}`)
          .orderBy(sql`${experimentVariants.createdAt} ASC`)
      : [];

    const variantsMap: Record<string, typeof variantsData> = {};
    for (const v of variantsData) {
      if (!variantsMap[v.experimentId]) variantsMap[v.experimentId] = [];
      variantsMap[v.experimentId].push(v);
    }

    const data = experimentsData.map(e => ({
      ...e,
      variants: variantsMap[e.id] ?? [],
    }));

    return json({ data });
  } catch (err) {
    console.error('Experiments GET error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// POST: Create experiment with initial variants (control + variant_a)
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const body = await request.json();
    const { name, hypothesis, trafficPercent, holdoutPercent, primaryMetric, variants } = body;

    if (!name || !primaryMetric) {
      return json({ error: 'name and primaryMetric are required' }, 400);
    }

    const [experiment] = await db.insert(experiments).values({
      name,
      hypothesis: hypothesis || null,
      status: 'draft',
      trafficPercent: trafficPercent ?? 10,
      holdoutPercent: holdoutPercent ?? 0,
      primaryMetric,
      createdBy: session.userId,
    }).returning();

    // Create initial variants: control + variant_a (and any extras provided)
    const variantNames = variants?.length ? variants : ['control', 'variant_a'];
    const variantRecords = await db.insert(experimentVariants).values(
      variantNames.map((name: string) => ({
        experimentId: experiment.id,
        name,
        changes: null,
        impressions: 0,
        conversions: 0,
      }))
    ).returning();

    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'create_experiment',
      entityType: 'experiment',
      entityId: experiment.id,
      details: { name, variants: variantNames },
    });

    return json({ success: true, data: { ...experiment, variants: variantRecords } }, 201);
  } catch (err) {
    console.error('Experiments POST error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// PUT: Update experiment (status changes: draft->running->paused->concluded)
export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return json({ error: 'Experiment ID required' }, 400);

    const allowed = ['name', 'hypothesis', 'status', 'trafficPercent', 'holdoutPercent', 'primaryMetric', 'winnerVariant'] as const;
    const safe: Record<string, unknown> = {};
    for (const k of allowed) if (k in updates) safe[k] = updates[k];

    // Handle status transitions
    if (safe.status === 'running') safe.startedAt = new Date();
    if (safe.status === 'concluded') safe.concludedAt = new Date();

    if (Object.keys(safe).length === 0) return json({ error: 'No valid fields to update' }, 400);

    await db.update(experiments).set(safe).where(eq(experiments.id, id));

    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'update_experiment',
      entityType: 'experiment',
      entityId: id,
      details: { fields: Object.keys(safe) },
    });

    return json({ success: true });
  } catch (err) {
    console.error('Experiments PUT error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// DELETE: Remove experiment
export const DELETE: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const id = url.searchParams.get('id');
    if (!id) return json({ error: 'Experiment ID required' }, 400);

    await db.delete(experiments).where(eq(experiments.id, id));

    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'delete_experiment',
      entityType: 'experiment',
      entityId: id,
    });

    return json({ success: true });
  } catch (err) {
    console.error('Experiments DELETE error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};