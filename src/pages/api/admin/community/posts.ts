import type { APIRoute } from 'astro';
import { getForumPosts, updateForumPost } from '../../../../db/forumQueries';
import { getSessionFromRequest, hasRole } from '../../../../utils/auth';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'admin', 'editor')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0);

    const posts = await getForumPosts({ sort: 'new', limit, offset });

    return new Response(JSON.stringify({ posts }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Admin community posts GET error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PATCH: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'admin', 'editor')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { postId, ...updates } = body;

    if (!postId) {
      return new Response(JSON.stringify({ error: 'postId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const allowed: Record<string, unknown> = {};
    if (typeof updates.isPinned === 'boolean') allowed.isPinned = updates.isPinned;
    if (typeof updates.isLocked === 'boolean') allowed.isLocked = updates.isLocked;
    if (updates.status && ['published', 'pending', 'removed'].includes(updates.status)) {
      allowed.status = updates.status;
    }

    const post = await updateForumPost(postId, allowed as any);

    return new Response(JSON.stringify({ post }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Admin community posts PATCH error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
