import type { APIRoute } from 'astro';
import { eq, desc, count, sql, and } from 'drizzle-orm';
import { db } from '../../../db';
import { questions } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth.js';

export const prerender = false;

// GET: List quiz questions with category filter
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!hasRole(session, 'admin', 'editor')) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category') || '';
    const search = url.searchParams.get('search') || '';
    const limit = Math.max(1, Math.min(parseInt(url.searchParams.get('limit') || '50'), 200));
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0'));

    const conditions = [];
    if (category) conditions.push(eq(questions.category, category));
    if (search) conditions.push(
      sql`${questions.question} ILIKE ${'%' + search + '%'} OR ${questions.answer} ILIKE ${'%' + search + '%'}`
    );

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db.select().from(questions)
      .where(whereClause)
      .orderBy(questions.sortOrder, desc(questions.createdAt))
      .limit(limit).offset(offset);

    const [total] = await db.select({ count: count() }).from(questions).where(whereClause);

    // Categories list
    const categories = await db
      .select({ category: questions.category, count: count() })
      .from(questions)
      .groupBy(questions.category);

    return new Response(JSON.stringify({
      questions: rows,
      categories,
      total: Number(total?.count ?? 0),
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[/api/admin/questions GET]', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST: Create new question
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'admin', 'editor')) {
    const status = session ? 403 : 401;
    return new Response(JSON.stringify({ error: status === 403 ? 'Forbidden' : 'Unauthorized' }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { slug, category, question, answer, relatedSlugs, sortOrder } = body;

    if (!slug || !category || !question || !answer) {
      return new Response(JSON.stringify({ error: 'slug, category, question, answer are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const [row] = await db.insert(questions).values({
      slug,
      category,
      question,
      answer,
      relatedSlugs: relatedSlugs || null,
      sortOrder: sortOrder ?? 0,
    }).returning();

    return new Response(JSON.stringify({ question: row }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[/api/admin/questions POST]', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// PUT: Update question
export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'admin', 'editor')) {
    const status = session ? 403 : 401;
    return new Response(JSON.stringify({ error: status === 403 ? 'Forbidden' : 'Unauthorized' }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { id, slug, category, question, answer, relatedSlugs, sortOrder } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: 'id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const updates: Record<string, unknown> = {};
    if (slug !== undefined) updates.slug = slug;
    if (category !== undefined) updates.category = category;
    if (question !== undefined) updates.question = question;
    if (answer !== undefined) updates.answer = answer;
    if (relatedSlugs !== undefined) updates.relatedSlugs = relatedSlugs;
    if (sortOrder !== undefined) updates.sortOrder = sortOrder;

    const [row] = await db.update(questions)
      .set(updates)
      .where(eq(questions.id, id))
      .returning();

    if (!row) {
      return new Response(JSON.stringify({ error: 'Question not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ question: row }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[/api/admin/questions PUT]', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// DELETE: Remove question
export const DELETE: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'admin')) {
    const status = session ? 403 : 401;
    return new Response(JSON.stringify({ error: status === 403 ? 'Forbidden' : 'Unauthorized' }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return new Response(JSON.stringify({ error: 'id query param required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await db.delete(questions).where(eq(questions.id, id));

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[/api/admin/questions DELETE]', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};