import type { APIRoute } from 'astro';
import { getForumPostById, updateForumPost } from '../../../../db/forumQueries';
import { getSessionFromRequest, hasRole } from '../../../../utils/auth';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  try {
    const { postId } = params;
    if (!postId) {
      return new Response(JSON.stringify({ error: 'Post ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const post = await getForumPostById(postId);
    if (!post || post.status !== 'published') {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ post }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30, s-maxage=30',
      },
    });
  } catch (err) {
    console.error('Forum post GET error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PATCH: APIRoute = async ({ request, params }) => {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { postId } = params;
    if (!postId) {
      return new Response(JSON.stringify({ error: 'Post ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const post = await getForumPostById(postId);
    if (!post) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Only the author or admin can edit
    const isAuthor = post.authorId === session.userId;
    const isAdmin = hasRole(session, 'admin', 'editor');
    if (!isAuthor && !isAdmin) {
      return new Response(JSON.stringify({ error: 'Not authorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    // Authors can edit title and body
    if (isAuthor) {
      if (body.title) updates.title = String(body.title).slice(0, 200);
      if (body.body) updates.body = String(body.body).slice(0, 10000);
    }

    // Admins can also pin, lock, change status
    if (isAdmin) {
      if (body.title) updates.title = String(body.title).slice(0, 200);
      if (body.body) updates.body = String(body.body).slice(0, 10000);
      if (typeof body.isPinned === 'boolean') updates.isPinned = body.isPinned;
      if (typeof body.isLocked === 'boolean') updates.isLocked = body.isLocked;
      if (body.status && ['published', 'pending', 'removed'].includes(body.status)) {
        updates.status = body.status;
      }
    }

    const updated = await updateForumPost(postId, updates as any);

    return new Response(JSON.stringify({ post: updated }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Forum post PATCH error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ request, params }) => {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { postId } = params;
    if (!postId) {
      return new Response(JSON.stringify({ error: 'Post ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const post = await getForumPostById(postId);
    if (!post) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const isAuthor = post.authorId === session.userId;
    const isAdmin = hasRole(session, 'admin', 'editor');
    if (!isAuthor && !isAdmin) {
      return new Response(JSON.stringify({ error: 'Not authorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await updateForumPost(postId, { status: 'removed' });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Forum post DELETE error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
