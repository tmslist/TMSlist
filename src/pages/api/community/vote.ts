import type { APIRoute } from 'astro';
import { upsertForumVote } from '../../../db/forumQueries';
import { forumVoteSchema } from '../../../db/validation';
import { getSessionFromRequest } from '../../../utils/auth';
import { strictRateLimit } from '../../../utils/rateLimit';

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

    // Rate limit: 60 votes per minute
    const rateLimited = await strictRateLimit(session.userId, 60, '1 m', 'community:vote');
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const parsed = forumVoteSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid vote data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await upsertForumVote(
      session.userId,
      parsed.data.targetType,
      parsed.data.targetId,
      parsed.data.value as 1 | -1,
    );

    return new Response(JSON.stringify({ success: true, ...result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Forum vote error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
