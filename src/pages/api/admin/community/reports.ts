import type { APIRoute } from 'astro';
import { getUnresolvedReports, resolveForumReport, updateForumPost } from '../../../../db/forumQueries';
import { getSessionFromRequest, hasRole } from '../../../../utils/auth';
import { db } from '../../../../db';
import { forumComments } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

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
    const reports = await getUnresolvedReports(100);
    return new Response(JSON.stringify({ reports }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Admin reports GET error:', err);
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
    const { reportId, action } = body; // action: 'resolve' | 'remove_content'

    if (!reportId) {
      return new Response(JSON.stringify({ error: 'reportId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Resolve the report
    await resolveForumReport(reportId, session.userId);

    // Optionally remove the reported content
    if (action === 'remove_content' && body.targetType && body.targetId) {
      if (body.targetType === 'post') {
        await updateForumPost(body.targetId, { status: 'removed' });
      } else if (body.targetType === 'comment') {
        await db.update(forumComments)
          .set({ status: 'removed' })
          .where(eq(forumComments.id, body.targetId));
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Admin reports PATCH error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
