import type { APIRoute } from 'astro';
import { eq, desc, and } from 'drizzle-orm';
import { db } from '../../../db';
import { legalDocuments, auditLog } from '../../../db/schema';
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
    const type = url.searchParams.get('type');
    const activeOnly = url.searchParams.get('active') === 'true';

    let docs;
    if (type) {
      const conditions = [eq(legalDocuments.type, type)];
      if (activeOnly) conditions.push(eq(legalDocuments.isActive, true));
      docs = await db
        .select()
        .from(legalDocuments)
        .where(and(...conditions))
        .orderBy(desc(legalDocuments.createdAt));
    } else {
      docs = await db
        .select()
        .from(legalDocuments)
        .orderBy(desc(legalDocuments.createdAt));
    }

    // Group by type for version history
    const grouped: Record<string, typeof docs> = {};
    for (const doc of docs) {
      if (!grouped[doc.type]) grouped[doc.type] = [];
      grouped[doc.type].push(doc);
    }

    return json({ data: { docs, grouped } });
  } catch (err) {
    console.error('Legal docs GET error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const body = await request.json();
    const { type, version, content } = body;
    if (!type || !version || !content) {
      return json({ error: 'type, version, and content are required' }, 400);
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
  } catch (err) {
    console.error('Legal docs POST error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const body = await request.json();
    const { id, isActive, content, publish } = body;
    if (!id) return json({ error: 'id is required' }, 400);

    const updates: Record<string, unknown> = {};
    if (typeof isActive === 'boolean') updates.isActive = isActive;
    if (content !== undefined) updates.content = content;
    if (publish === true) {
      updates.isActive = true;
      updates.publishedAt = new Date();
    }

    if (Object.keys(updates).length === 0) {
      return json({ error: 'No valid fields to update' }, 400);
    }

    await db.update(legalDocuments).set(updates).where(eq(legalDocuments.id, id));

    if (publish) {
      // Deactivate other versions of the same type
      const doc = await db.select().from(legalDocuments).where(eq(legalDocuments.id, id)).limit(1);
      if (doc[0]) {
        await db.update(legalDocuments)
          .set({ isActive: false })
          .where(and(eq(legalDocuments.type, doc[0].type), eq(legalDocuments.isActive, true)));
        // Reactivate the published version
        await db.update(legalDocuments)
          .set({ isActive: true, publishedAt: new Date() })
          .where(eq(legalDocuments.id, id));
      }
    }

    await db.insert(auditLog).values({
      userId: session.userId,
      action: publish ? 'publish_legal_document' : 'update_legal_document',
      entityType: 'legal_document',
      entityId: id,
      details: { fields: Object.keys(updates), publish },
    });

    return json({ success: true });
  } catch (err) {
    console.error('Legal docs PUT error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

export const DELETE: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const id = url.searchParams.get('id');
    if (!id) return json({ error: 'id is required' }, 400);

    await db.delete(legalDocuments).where(eq(legalDocuments.id, id));

    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'delete_legal_document',
      entityType: 'legal_document',
      entityId: id,
    });

    return json({ success: true });
  } catch (err) {
    console.error('Legal docs DELETE error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};
