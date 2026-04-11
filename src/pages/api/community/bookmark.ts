import type { APIRoute } from 'astro';
import { toggleSavedPost } from '../../../db/forumQueries';
import { getSessionFromRequest } from '../../../utils/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { postId } = await request.json();
    if (!postId) {
      return new Response(JSON.stringify({ error: 'postId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const saved = await toggleSavedPost(session.userId, postId);

    return new Response(JSON.stringify({ saved }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Bookmark error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
