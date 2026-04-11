import type { APIRoute } from 'astro';
import { eq, desc, sql, and } from 'drizzle-orm';
import { db } from '../../../db';
import { questions, treatments, auditLog } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// List questions or treatments with search and pagination
export const GET: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin', 'editor')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const type = url.searchParams.get('type');
    const search = url.searchParams.get('search') || '';
    const limit = Math.max(1, Math.min(parseInt(url.searchParams.get('limit') || '50'), 200));
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0'));

    if (type === 'questions') {
      const conditions = [];
      if (search) {
        conditions.push(sql`(
          ${questions.question} ILIKE ${'%' + search + '%'} OR
          ${questions.category} ILIKE ${'%' + search + '%'} OR
          ${questions.answer} ILIKE ${'%' + search + '%'}
        )`);
      }

      const data = await db.select().from(questions)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(questions.createdAt))
        .limit(limit)
        .offset(offset);

      const countResult = await db.select({ count: sql<number>`count(*)` }).from(questions)
        .where(conditions.length > 0 ? and(...conditions) : undefined);
      const total = Number(countResult[0]?.count ?? 0);

      return json({ data, total });
    }

    if (type === 'treatments') {
      const conditions = [];
      if (search) {
        conditions.push(sql`(
          ${treatments.name} ILIKE ${'%' + search + '%'} OR
          ${treatments.fullName} ILIKE ${'%' + search + '%'} OR
          ${treatments.description} ILIKE ${'%' + search + '%'}
        )`);
      }

      const data = await db.select().from(treatments)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(treatments.name)
        .limit(limit)
        .offset(offset);

      const countResult = await db.select({ count: sql<number>`count(*)` }).from(treatments)
        .where(conditions.length > 0 ? and(...conditions) : undefined);
      const total = Number(countResult[0]?.count ?? 0);

      return json({ data, total });
    }

    return json({ error: 'Invalid type. Use ?type=questions or ?type=treatments' }, 400);
  } catch (err) {
    console.error('Admin content list error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// Create a question or treatment
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin', 'editor')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await request.json();
    const { type, ...fields } = body;

    if (type === 'question') {
      const { slug, category, question, answer, relatedSlugs, sortOrder } = fields;
      if (!slug || !category || !question || !answer) {
        return json({ error: 'slug, category, question, and answer are required' }, 400);
      }

      const result = await db.insert(questions).values({
        slug,
        category,
        question,
        answer,
        relatedSlugs: relatedSlugs || null,
        sortOrder: sortOrder != null ? Number(sortOrder) : 0,
      }).returning();

      await db.insert(auditLog).values({
        userId: session?.userId ?? null,
        action: 'create_question',
        entityType: 'question',
        entityId: result[0].id,
        details: { slug },
      });

      return json({ success: true, data: result[0] }, 201);
    }

    if (type === 'treatment') {
      const { slug, name, fullName, description, fdaApproved, conditions, howItWorks, sessionDuration, treatmentCourse, insuranceCoverage } = fields;
      if (!slug || !name) {
        return json({ error: 'slug and name are required' }, 400);
      }

      const result = await db.insert(treatments).values({
        slug,
        name,
        fullName: fullName || null,
        description: description || null,
        fdaApproved: fdaApproved ?? false,
        conditions: conditions || null,
        howItWorks: howItWorks || null,
        sessionDuration: sessionDuration || null,
        treatmentCourse: treatmentCourse || null,
        insuranceCoverage: insuranceCoverage || null,
      }).returning();

      await db.insert(auditLog).values({
        userId: session?.userId ?? null,
        action: 'create_treatment',
        entityType: 'treatment',
        entityId: result[0].id,
        details: { slug, name },
      });

      return json({ success: true, data: result[0] }, 201);
    }

    return json({ error: 'Invalid type. Use type: "question" or "treatment"' }, 400);
  } catch (err) {
    console.error('Admin content create error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// Update a question or treatment
export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin', 'editor')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await request.json();
    const { type, id, ...updates } = body;

    if (!id) {
      return json({ error: 'ID required' }, 400);
    }

    if (type === 'question') {
      const allowedFields = ['slug', 'category', 'question', 'answer', 'relatedSlugs', 'sortOrder'] as const;
      const safeUpdates: Record<string, unknown> = {};
      for (const key of allowedFields) {
        if (key in updates) {
          safeUpdates[key] = updates[key];
        }
      }

      if (Object.keys(safeUpdates).length === 0) {
        return json({ error: 'No valid fields to update' }, 400);
      }

      await db.update(questions).set(safeUpdates).where(eq(questions.id, id));

      await db.insert(auditLog).values({
        userId: session?.userId ?? null,
        action: 'update_question',
        entityType: 'question',
        entityId: id,
        details: { fields: Object.keys(safeUpdates) },
      });

      return json({ success: true });
    }

    if (type === 'treatment') {
      const allowedFields = ['slug', 'name', 'fullName', 'description', 'fdaApproved', 'conditions', 'howItWorks', 'sessionDuration', 'treatmentCourse', 'insuranceCoverage'] as const;
      const safeUpdates: Record<string, unknown> = {};
      for (const key of allowedFields) {
        if (key in updates) {
          safeUpdates[key] = updates[key];
        }
      }

      if (Object.keys(safeUpdates).length === 0) {
        return json({ error: 'No valid fields to update' }, 400);
      }

      await db.update(treatments).set(safeUpdates).where(eq(treatments.id, id));

      await db.insert(auditLog).values({
        userId: session?.userId ?? null,
        action: 'update_treatment',
        entityType: 'treatment',
        entityId: id,
        details: { fields: Object.keys(safeUpdates) },
      });

      return json({ success: true });
    }

    return json({ error: 'Invalid type. Use type: "question" or "treatment"' }, 400);
  } catch (err) {
    console.error('Admin content update error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// Delete a question or treatment
export const DELETE: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const type = url.searchParams.get('type');
    const id = url.searchParams.get('id');

    if (!id) {
      return json({ error: 'ID required' }, 400);
    }

    if (type === 'question') {
      await db.delete(questions).where(eq(questions.id, id));

      await db.insert(auditLog).values({
        userId: session?.userId ?? null,
        action: 'delete_question',
        entityType: 'question',
        entityId: id,
      });

      return json({ success: true });
    }

    if (type === 'treatment') {
      await db.delete(treatments).where(eq(treatments.id, id));

      await db.insert(auditLog).values({
        userId: session?.userId ?? null,
        action: 'delete_treatment',
        entityType: 'treatment',
        entityId: id,
      });

      return json({ success: true });
    }

    return json({ error: 'Invalid type. Use ?type=question or ?type=treatment' }, 400);
  } catch (err) {
    console.error('Admin content delete error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};
