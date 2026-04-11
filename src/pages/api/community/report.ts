import type { APIRoute } from 'astro';
import { createForumReport } from '../../../db/forumQueries';
import { forumReportSchema } from '../../../db/validation';
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

    // Rate limit: 10 reports per hour
    const rateLimited = await strictRateLimit(session.userId, 10, '1 h', 'community:report');
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const parsed = forumReportSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid report data', details: parsed.error.flatten() }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const report = await createForumReport({
      reporterId: session.userId,
      targetType: parsed.data.targetType,
      targetId: parsed.data.targetId,
      reason: parsed.data.reason,
    });

    return new Response(JSON.stringify({ success: true, report }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Forum report error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
