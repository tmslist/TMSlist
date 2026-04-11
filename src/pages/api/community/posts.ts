import type { APIRoute } from 'astro';
import { getForumPosts, createForumPost, getForumCategoryBySlug } from '../../../db/forumQueries';
import { forumPostsQuerySchema, forumPostSchema } from '../../../db/validation';
import { getSessionFromRequest } from '../../../utils/auth';
import { strictRateLimit, getClientIp } from '../../../utils/rateLimit';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);
    const parsed = forumPostsQuerySchema.safeParse(params);

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid query parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const posts = await getForumPosts(parsed.data);

    return new Response(JSON.stringify({ posts }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, s-maxage=60',
      },
    });
  } catch (err) {
    console.error('Forum posts GET error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Rate limit: 5 posts per hour per user
    const rateLimited = await strictRateLimit(session.userId, 5, '1 h', 'community:post');
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const parsed = forumPostSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid post data', details: parsed.error.flatten() }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const post = await createForumPost({
      categoryId: parsed.data.categoryId,
      authorId: session.userId,
      title: parsed.data.title,
      body: parsed.data.body,
    });

    return new Response(JSON.stringify({ post }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Forum posts POST error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
