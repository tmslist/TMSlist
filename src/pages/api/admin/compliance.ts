import type { APIRoute } from 'astro';
import { eq, desc, sql, and } from 'drizzle-orm';
import { db } from '../../../db';
import { legalDocuments, retentionPolicies, cookieConsents, auditLog } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// GET: Get legal documents, retention policies, cookie consent config
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin', 'editor')) return json({ error: 'Forbidden' }, 403);

  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type'); // 'documents' | 'retention' | 'cookies'

    if (type === 'documents' || !type) {
      const docs = await db.select().from(legalDocuments).orderBy(desc(legalDocuments.createdAt));
      if (type === 'documents') return json({ data: docs });
    }

    if (type === 'retention' || !type) {
      const policies = await db.select().from(retentionPolicies).orderBy(desc(retentionPolicies.createdAt));
      if (type === 'retention') return json({ data: policies });
    }

    if (type === 'cookies' || !type) {
      // Return aggregate consent stats and latest consents
      const consents = await db
        .select()
        .from(cookieConsents)
        .orderBy(desc(cookieConsents.createdAt))
        .limit(100);
      const total = consents.length;
      const analytics = consents.filter(c => c.analytics).length;
      const marketing = consents.filter(c => c.marketing).length;
      if (type === 'cookies') return json({ data: { consents, total, analytics, marketing } });
    }

    const [documents, retention, consents] = await Promise.all([
      db.select().from(legalDocuments).orderBy(desc(legalDocuments.createdAt)),
      db.select().from(retentionPolicies).orderBy(desc(retentionPolicies.createdAt)),
      db.select().from(cookieConsents).orderBy(desc(cookieConsents.createdAt)).limit(100),
    ]);

    return json({ data: { documents, retention: retention, consents } });
  } catch (err) {
    console.error('Compliance GET error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// POST: Create/update legal document, retention policy, cookie consent settings
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const body = await request.json();

    // Legal document
    if (body.entityType === 'document') {
      const { name, type, version, content } = body;
      if (!name || !type || !version || !content) {
        return json({ error: 'name, type, version, and content are required' }, 400);
      }

      const [doc] = await db.insert(legalDocuments).values({
        type,
        version,
        content,
        isActive: false,
        createdBy: session.userId,
      }).returning();

      await db.insert(auditLog).values({
        userId: session.userId,
        action: 'create_legal_document',
        entityType: 'legal_document',
        entityId: doc.id,
        details: { type, version },
      });

      return json({ success: true, data: doc }, 201);
    }

    // Retention policy
    if (body.entityType === 'retention') {
      const { entityType, retentionDays, description } = body;
      if (!entityType || !retentionDays) {
        return json({ error: 'entityType and retentionDays are required' }, 400);
      }

      const [policy] = await db.insert(retentionPolicies).values({
        entityType,
        retentionDays: Number(retentionDays),
        description: description || null,
        createdBy: session.userId,
      }).returning();

      await db.insert(auditLog).values({
        userId: session.userId,
        action: 'create_retention_policy',
        entityType: 'retention_policy',
        entityId: policy.id,
        details: { entityType, retentionDays },
      });

      return json({ success: true, data: policy }, 201);
    }

    return json({ error: 'entityType must be document or retention' }, 400);
  } catch (err) {
    console.error('Compliance POST error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// PUT: Activate/publish legal document version
export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const body = await request.json;
    // Support both calling styles: body.id or body.entityType + body.id
    const id = body.id ?? body.documentId;
    const { type: entityType, isActive, content } = body;

    if (entityType === 'document' || entityType === 'retention') {
      if (!id) return json({ error: 'ID required' }, 400);

      if (entityType === 'document') {
        const updates: Record<string, unknown> = {};
        if (typeof isActive === 'boolean') updates.isActive = isActive;
        if (content !== undefined) updates.content = content;
        if (isActive) updates.publishedAt = new Date();

        if (Object.keys(updates).length === 0) return json({ error: 'No valid fields to update' }, 400);
        await db.update(legalDocuments).set(updates).where(eq(legalDocuments.id, id));
      } else {
        const allowed = ['retentionDays', 'description', 'isActive'] as const;
        const safe: Record<string, unknown> = {};
        for (const k of allowed) if (k in body) safe[k] = body[k];
        if (Object.keys(safe).length === 0) return json({ error: 'No valid fields to update' }, 400);
        await db.update(retentionPolicies).set(safe).where(eq(retentionPolicies.id, id));
      }

      await db.insert(auditLog).values({
        userId: session.userId,
        action: `update_${entityType}`,
        entityType,
        entityId: id,
        details: { fields: Object.keys(body).filter(k => !['id', 'entityType'].includes(k)) },
      });

      return json({ success: true });
    }

    return json({ error: 'entityType must be document or retention' }, 400);
  } catch (err) {
    console.error('Compliance PUT error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// DELETE: Remove retention policy
export const DELETE: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const id = url.searchParams.get('id');
    if (!id) return json({ error: 'Retention policy ID required' }, 400);

    await db.delete(retentionPolicies).where(eq(retentionPolicies.id, id));

    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'delete_retention_policy',
      entityType: 'retention_policy',
      entityId: id,
    });

    return json({ success: true });
  } catch (err) {
    console.error('Compliance DELETE error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};