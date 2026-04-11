import type { APIRoute } from 'astro';
import { eq, desc, and, sql } from 'drizzle-orm';
import { db } from '../../../db';
import { blogPosts, auditLog } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// List or get single blog post
export const GET: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin', 'editor')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Single post by ID
    const singleId = url.searchParams.get('id');
    if (singleId) {
      const result = await db.select().from(blogPosts).where(eq(blogPosts.id, singleId)).limit(1);
      if (result.length === 0) {
        return new Response(JSON.stringify({ error: 'Post not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ data: result[0] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || '';
    const category = url.searchParams.get('category') || '';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '25'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const conditions = [];
    if (search) {
      conditions.push(sql`(
        ${blogPosts.title} ILIKE ${'%' + search + '%'} OR
        ${blogPosts.excerpt} ILIKE ${'%' + search + '%'} OR
        ${blogPosts.author} ILIKE ${'%' + search + '%'}
      )`);
    }
    if (status && ['draft', 'published', 'scheduled'].includes(status)) {
      conditions.push(eq(blogPosts.status, status));
    }
    if (category) {
      conditions.push(eq(blogPosts.category, category));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db.select().from(blogPosts)
      .where(whereClause)
      .orderBy(desc(blogPosts.updatedAt))
      .limit(limit)
      .offset(offset);

    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(blogPosts)
      .where(whereClause);
    const total = Number(countResult[0]?.count ?? 0);

    // Get distinct categories for filter
    const categoriesResult = await db.selectDistinct({ category: blogPosts.category })
      .from(blogPosts)
      .where(sql`${blogPosts.category} IS NOT NULL`);
    const categories = categoriesResult.map(r => r.category).filter(Boolean);

    return new Response(JSON.stringify({ data, total, categories }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Admin blog list error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// Create blog post
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin', 'editor')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { title, slug, excerpt, content, coverImage, author, category, tags, status, scheduledAt, metaTitle, metaDescription, ogImage } = body;

    if (!title) {
      return new Response(JSON.stringify({ error: 'Title is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const finalSlug = slug ? slugify(slug) : slugify(title);

    // Check slug uniqueness
    const existing = await db.select({ id: blogPosts.id }).from(blogPosts).where(eq(blogPosts.slug, finalSlug)).limit(1);
    if (existing.length > 0) {
      return new Response(JSON.stringify({ error: 'A post with this slug already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const now = new Date();
    const result = await db.insert(blogPosts).values({
      title,
      slug: finalSlug,
      excerpt: excerpt || null,
      content: content || '',
      coverImage: coverImage || null,
      author: author || session!.email,
      category: category || null,
      tags: tags || [],
      status: status || 'draft',
      publishedAt: status === 'published' ? now : null,
      scheduledAt: status === 'scheduled' && scheduledAt ? new Date(scheduledAt) : null,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      ogImage: ogImage || null,
      createdBy: session!.userId,
      createdAt: now,
      updatedAt: now,
    }).returning();

    await db.insert(auditLog).values({
      userId: session?.userId ?? null,
      action: 'create_blog_post',
      entityType: 'blog_post',
      entityId: result[0].id,
      details: { title, slug: finalSlug, status: status || 'draft' },
    });

    return new Response(JSON.stringify({ data: result[0] }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Admin blog create error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// Update blog post
export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin', 'editor')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Post ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get the current post to check status transitions
    const current = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
    if (current.length === 0) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const safeUpdates: Record<string, unknown> = { updatedAt: new Date() };

    const allowedFields = [
      'title', 'slug', 'excerpt', 'content', 'coverImage', 'author',
      'category', 'tags', 'status', 'scheduledAt',
      'metaTitle', 'metaDescription', 'ogImage',
    ];

    for (const key of allowedFields) {
      if (key in updates) {
        safeUpdates[key] = updates[key];
      }
    }

    // If slug is updated, slugify it
    if (safeUpdates.slug) {
      safeUpdates.slug = slugify(safeUpdates.slug as string);
    }

    // Handle status transitions
    if (safeUpdates.status === 'published' && current[0].publishedAt === null) {
      safeUpdates.publishedAt = new Date();
    }
    if (safeUpdates.status === 'scheduled' && safeUpdates.scheduledAt) {
      safeUpdates.scheduledAt = new Date(safeUpdates.scheduledAt as string);
    }
    if (safeUpdates.status === 'draft') {
      // Clear scheduling if reverting to draft
      safeUpdates.scheduledAt = null;
    }

    await db.update(blogPosts).set(safeUpdates).where(eq(blogPosts.id, id));

    await db.insert(auditLog).values({
      userId: session?.userId ?? null,
      action: 'update_blog_post',
      entityType: 'blog_post',
      entityId: id,
      details: { fields: Object.keys(safeUpdates).filter(k => k !== 'updatedAt') },
    });

    // Fetch and return the updated post
    const updated = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);

    return new Response(JSON.stringify({ data: updated[0] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Admin blog update error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// Delete blog post
export const DELETE: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const id = url.searchParams.get('id');
    if (!id) {
      return new Response(JSON.stringify({ error: 'Post ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get post info for audit
    const post = await db.select({ title: blogPosts.title }).from(blogPosts).where(eq(blogPosts.id, id)).limit(1);

    await db.delete(blogPosts).where(eq(blogPosts.id, id));

    await db.insert(auditLog).values({
      userId: session?.userId ?? null,
      action: 'delete_blog_post',
      entityType: 'blog_post',
      entityId: id,
      details: { title: post[0]?.title },
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Admin blog delete error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
