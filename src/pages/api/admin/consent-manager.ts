import type { APIRoute } from 'astro';
import { eq, desc, and, sql } from 'drizzle-orm';
import { db } from '../../../db';
import { cookieConsents, consentRecords, auditLog } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin', 'editor')) return json({ error: 'Forbidden' }, 403);

  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'consents';
    const limit = Math.max(1, Math.min(parseInt(url.searchParams.get('limit') || '100'), 500));
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0'));
    const userId = url.searchParams.get('userId');
    const consentType = url.searchParams.get('consentType');

    if (type === 'consents') {
      const conditions: any[] = [];
      if (userId) conditions.push(eq(cookieConsents.userId, userId));
      if (consentType) conditions.push(eq(cookieConsents.consentType, consentType));

      const [records, countResult] = await Promise.all([
        db.select().from(cookieConsents)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(cookieConsents.createdAt))
          .limit(limit)
          .offset(offset),
        db.select({ count: sql<number>`count(*)` }).from(cookieConsents)
          .where(conditions.length > 0 ? and(...conditions) : undefined),
      ]);

      // GDPR/CCPA compliance stats
      const gdprCount = records.filter(r => r.consentType === 'gdpr').length;
      const ccpCount = records.filter(r => r.consentType === 'ccpa').length;
      const withdrawnCount = records.filter(r => r.granted === false).length;

      return json({
        data: {
          records,
          total: Number(countResult[0]?.count ?? 0),
          stats: { gdprCount, ccpCount, withdrawnCount, total: records.length },
        },
        limit,
        offset,
      });
    }

    if (type === 'records') {
      const conditions: any[] = [];
      if (userId) conditions.push(eq(consentRecords.userId, userId));
      if (consentType) conditions.push(eq(consentRecords.consentType, consentType));

      const [records, countResult] = await Promise.all([
        db.select().from(consentRecords)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(consentRecords.createdAt))
          .limit(limit)
          .offset(offset),
        db.select({ count: sql<number>`count(*)` }).from(consentRecords)
          .where(conditions.length > 0 ? and(...conditions) : undefined),
      ]);

      return json({
        data: { records, total: Number(countResult[0]?.count ?? 0) },
        limit,
        offset,
      });
    }

    return json({ error: 'Invalid type. Use "consents" or "records"' }, 400);
  } catch (err) {
    console.error('Consent manager GET error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const body = await request.json();
    const { userId, consentType, granted, ipAddress } = body;
    if (!consentType || typeof granted !== 'boolean') {
      return json({ error: 'consentType and granted are required' }, 400);
    }

    const [record] = await db.insert(cookieConsents).values({
      userId: userId || null,
      consentType,
      granted,
      ipAddress: ipAddress || null,
    }).returning();

    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'record_consent',
      entityType: 'consent',
      entityId: record.id,
      details: { consentType, granted, userId },
    });

    return json({ success: true, data: record }, 201);
  } catch (err) {
    console.error('Consent manager POST error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const body = await request.json();
    const { id, withdraw } = body;
    if (!id) return json({ error: 'id is required' }, 400);

    const updates: Record<string, unknown> = {};
    if (typeof withdraw === 'boolean') {
      updates.granted = !withdraw;
    }

    await db.update(cookieConsents).set(updates).where(eq(cookieConsents.id, id));

    await db.insert(auditLog).values({
      userId: session.userId,
      action: withdraw ? 'withdraw_consent' : 'update_consent',
      entityType: 'consent',
      entityId: id,
      details: { withdraw },
    });

    return json({ success: true });
  } catch (err) {
    console.error('Consent manager PUT error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};
