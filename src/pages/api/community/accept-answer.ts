import type { APIRoute } from 'astro';
import { toggleAcceptedAnswer } from '../../../db/forumQueries';
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

    const { commentId } = await request.json();
    if (!commentId) {
      return new Response(JSON.stringify({ error: 'commentId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const accepted = await toggleAcceptedAnswer(commentId, session.userId);

    return new Response(JSON.stringify({ accepted }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Accept answer error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
