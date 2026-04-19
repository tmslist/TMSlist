import type { APIRoute } from 'astro';
import { eq, desc, sql, and } from 'drizzle-orm';
import { db } from '../../../db';
import { rewards, clinicPoints, auditLog } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// GET: List reward items and clinic point transactions
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin', 'editor')) return json({ error: 'Forbidden' }, 403);

  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type'); // 'rewards' | 'points'
    const clinicId = url.searchParams.get('clinicId');

    if (type === 'rewards' || !type) {
      const rewardsData = await db
        .select()
        .from(rewards)
        .orderBy(desc(rewards.createdAt));
      if (type === 'rewards') return json({ data: rewardsData });
    }

    if (type === 'points' || !type) {
      const pointsData = await db
        .select()
        .from(clinicPoints)
        .where(clinicId ? eq(clinicPoints.clinicId, clinicId) : undefined)
        .orderBy(desc(clinicPoints.createdAt))
        .limit(200);
      if (type === 'points') return json({ data: pointsData });
    }

    const [rewardsData, pointsData] = await Promise.all([
      db.select().from(rewards).orderBy(desc(rewards.createdAt)),
      db.select().from(clinicPoints).orderBy(desc(clinicPoints.createdAt)).limit(200),
    ]);

    return json({ data: { rewards: rewardsData, points: pointsData } });
  } catch (err) {
    console.error('Rewards GET error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// POST: Create reward OR record points for a clinic
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin', 'editor')) return json({ error: 'Forbidden' }, 403);

  try {
    const body = await request.json();

    // Record points for a clinic
    if (body.clinicId && body.action !== undefined) {
      const { clinicId, action, points, note } = body;
      if (!clinicId || !action || points === undefined) {
        return json({ error: 'clinicId, action, and points are required' }, 400);
      }

      const [record] = await db.insert(clinicPoints).values({
        clinicId,
        action,
        points: Number(points),
        note: note || null,
      }).returning();

      await db.insert(auditLog).values({
        userId: session.userId,
        action: 'record_clinic_points',
        entityType: 'clinic_point',
        entityId: record.id,
        details: { clinicId, action, points },
      });

      return json({ success: true, data: record }, 201);
    }

    // Create reward item
    const { name, description, pointsCost, type } = body;
    if (!name || pointsCost === undefined || !type) {
      return json({ error: 'name, pointsCost, and type are required for rewards' }, 400);
    }

    const [reward] = await db.insert(rewards).values({
      name,
      description: description || null,
      pointsCost: Number(pointsCost),
      type,
      isActive: body.isActive ?? true,
    }).returning();

    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'create_reward',
      entityType: 'reward',
      entityId: reward.id,
      details: { name, type, pointsCost },
    });

    return json({ success: true, data: reward }, 201);
  } catch (err) {
    console.error('Rewards POST error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// DELETE: Remove reward
export const DELETE: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const id = url.searchParams.get('id');
    if (!id) return json({ error: 'Reward ID required' }, 400);

    await db.delete(rewards).where(eq(rewards.id, id));

    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'delete_reward',
      entityType: 'reward',
      entityId: id,
    });

    return json({ success: true });
  } catch (err) {
    console.error('Rewards DELETE error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};