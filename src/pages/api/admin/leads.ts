import type { APIRoute } from 'astro';
import { getLeads, getLeadStats } from '../../../db/queries';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

export const GET: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin', 'editor')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const type = url.searchParams.get('type') || undefined;
    const limit = Math.max(1, Math.min(parseInt(url.searchParams.get('limit') || '50'), 200));
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0'));

    const [leadsList, stats] = await Promise.all([
      getLeads({ type, limit, offset }),
      getLeadStats(),
    ]);

    return new Response(JSON.stringify({ data: leadsList, stats }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Admin leads error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
