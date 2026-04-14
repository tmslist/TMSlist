import type { APIRoute } from 'astro';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

// Read blog posts from Astro content collection (static, no DB needed)
async function getBlogPostsFromContent() {
  try {
    const { getCollection } = await import('astro:content');
    const entries = await getCollection('blog');
    return entries.map((entry) => ({
      id: entry.id,
      slug: entry.slug,
      title: entry.data.title,
      excerpt: entry.data.description || null,
      author: entry.data.author || 'TMS List Editorial Team',
      category: entry.data.category || null,
      tags: entry.data.tags || [],
      status: entry.data.publishDate && entry.data.publishDate <= new Date() ? 'published' : 'draft',
      publishedAt: entry.data.publishDate ? entry.data.publishDate.toISOString() : null,
      updatedAt: entry.data.publishDate ? entry.data.publishDate.toISOString() : new Date().toISOString(),
    }));
  } catch (err) {
    console.error('Failed to load blog posts from content collection:', err);
    return [];
  }
}

export const GET: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin', 'editor')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const singleId = url.searchParams.get('id');
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || '';
    const limit = Math.max(1, Math.min(parseInt(url.searchParams.get('limit') || '25'), 100));
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0'));

    let posts = await getBlogPostsFromContent();
    const total = posts.length;

    // Filter by search
    if (search) {
      const q = search.toLowerCase();
      posts = posts.filter(p =>
        p.title.toLowerCase().includes(q) ||
        (p.excerpt && p.excerpt.toLowerCase().includes(q)) ||
        p.author.toLowerCase().includes(q)
      );
    }

    // Filter by status
    if (status && ['draft', 'published', 'scheduled'].includes(status)) {
      posts = posts.filter(p => p.status === status);
    }

    const filteredTotal = posts.length;

    // Pagination
    posts = posts.slice(offset, offset + limit);

    return new Response(JSON.stringify({ data: posts, total: filteredTotal, categories: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Admin blog list error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin', 'editor')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const body = await request.json();
    return new Response(JSON.stringify({
      error: 'Blog posts are managed via markdown files in src/content/blog/. Please create posts there and restart the dev server.',
    }), { status: 501, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Admin blog create error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    return new Response(JSON.stringify({
      error: 'Blog posts are managed via markdown files in src/content/blog/. Please edit posts there.',
    }), { status: 501, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Admin blog update error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const DELETE: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    return new Response(JSON.stringify({
      error: 'Blog posts are managed via markdown files in src/content/blog/. Please delete posts there.',
    }), { status: 501, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Admin blog delete error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
