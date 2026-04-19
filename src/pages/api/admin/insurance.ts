import type { APIRoute } from 'astro';
import { eq, desc, sql, and } from 'drizzle-orm';
import { db } from '../../../db';
import { insuranceInsurers, insurancePlans, auditLog } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// GET: List insurers and plans with optional insurer filter
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin', 'editor')) return json({ error: 'Forbidden' }, 403);

  try {
    const url = new URL(request.url);
    const insurerId = url.searchParams.get('insurerId');

    const insurers = await db.select().from(insuranceInsurers).orderBy(sql`${insuranceInsurers.name} ASC`);

    const plans = await db
      .select()
      .from(insurancePlans)
      .where(insurerId ? eq(insurancePlans.insurerId, insurerId) : undefined)
      .orderBy(desc(insurancePlans.createdAt));

    // Attach insurer names to plans
    const insurerMap = Object.fromEntries(insurers.map(i => [i.id, i.name]));
    const plansWithInsurer = plans.map(p => ({
      ...p,
      insurerName: insurerMap[p.insurerId] ?? null,
    }));

    return json({ data: { insurers, plans: plansWithInsurer } });
  } catch (err) {
    console.error('Insurance GET error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// POST: Create insurer OR create plan
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin', 'editor')) return json({ error: 'Forbidden' }, 403);

  try {
    const body = await request.json();

    // Create plan
    if (body.insurerId && body.name && body.state) {
      const { insurerId, name, type, metalLevel, state, coversTms, priorAuthRequired, typicalCopay } = body;

      const [plan] = await db.insert(insurancePlans).values({
        insurerId,
        name,
        type: type || 'PPO',
        metalLevel: metalLevel || null,
        state,
        coversTms: coversTms ?? false,
        priorAuthRequired: priorAuthRequired ?? false,
        typicalCopay: typicalCopay ? Number(typicalCopay) : null,
      }).returning();

      await db.insert(auditLog).values({
        userId: session.userId,
        action: 'create_insurance_plan',
        entityType: 'insurance_plan',
        entityId: plan.id,
        details: { name, insurerId },
      });

      return json({ success: true, data: plan }, 201);
    }

    // Create insurer
    const { name, slug, logoUrl, website } = body;
    if (!name || !slug) return json({ error: 'name and slug are required for insurers' }, 400);

    const [insurer] = await db.insert(insuranceInsurers).values({
      name,
      slug,
      logoUrl: logoUrl || null,
      website: website || null,
    }).returning();

    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'create_insurance_insurer',
      entityType: 'insurance_insurer',
      entityId: insurer.id,
      details: { name, slug },
    });

    return json({ success: true, data: insurer }, 201);
  } catch (err) {
    console.error('Insurance POST error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// PUT: Update insurer or plan
export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin', 'editor')) return json({ error: 'Forbidden' }, 403);

  try {
    const body = await request.json();
    const { id, type: entityType, ...updates } = body;

    if (!id || !entityType) return json({ error: 'id and type are required' }, 400);

    if (entityType === 'insurer') {
      const allowed = ['name', 'logoUrl', 'website'] as const;
      const safe: Record<string, unknown> = {};
      for (const k of allowed) if (k in updates) safe[k] = updates[k];
      if (Object.keys(safe).length === 0) return json({ error: 'No valid fields to update' }, 400);
      await db.update(insuranceInsurers).set(safe).where(eq(insuranceInsurers.id, id));
    } else if (entityType === 'plan') {
      const allowed = ['name', 'type', 'metalLevel', 'state', 'coversTms', 'priorAuthRequired', 'typicalCopay'] as const;
      const safe: Record<string, unknown> = {};
      for (const k of allowed) if (k in updates) safe[k] = updates[k];
      if (Object.keys(safe).length === 0) return json({ error: 'No valid fields to update' }, 400);
      if ('typicalCopay' in safe) safe.typicalCopay = safe.typicalCopay ? Number(safe.typicalCopay) : null;
      await db.update(insurancePlans).set(safe).where(eq(insurancePlans.id, id));
    } else {
      return json({ error: 'type must be insurer or plan' }, 400);
    }

    await db.insert(auditLog).values({
      userId: session.userId,
      action: `update_insurance_${entityType}`,
      entityType: `insurance_${entityType}`,
      entityId: id,
      details: { fields: Object.keys(updates) },
    });

    return json({ success: true });
  } catch (err) {
    console.error('Insurance PUT error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// DELETE: Remove insurer or plan
export const DELETE: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const id = url.searchParams.get('id');
    const type = url.searchParams.get('type'); // 'insurer' | 'plan'
    if (!id || !type) return json({ error: 'id and type are required' }, 400);

    if (type === 'insurer') {
      await db.delete(insuranceInsurers).where(eq(insuranceInsurers.id, id));
    } else if (type === 'plan') {
      await db.delete(insurancePlans).where(eq(insurancePlans.id, id));
    }

    await db.insert(auditLog).values({
      userId: session.userId,
      action: `delete_insurance_${type}`,
      entityType: `insurance_${type}`,
      entityId: id,
    });

    return json({ success: true });
  } catch (err) {
    console.error('Insurance DELETE error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};