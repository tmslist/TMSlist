import type { APIRoute } from 'astro';
import { getEmailStats, getEmailLogsByCampaign, logEmailSent, updateEmailStatus } from '../../../db/queries';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin', 'editor')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const url = new URL(request.url);
  const campaignId = url.searchParams.get('campaignId') ?? undefined;

  try {
    if (campaignId) {
      const logs = await getEmailLogsByCampaign(campaignId);
      return new Response(JSON.stringify({ logs }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const stats = await getEmailStats();
    return new Response(JSON.stringify({ stats }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin', 'editor')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const body = await request.json();

    if (body.action === 'log_sent') {
      const log = await logEmailSent(body);
      return new Response(JSON.stringify({ log }), { status: 201 });
    }

    if (body.id && body.status) {
      const updated = await updateEmailStatus(body.id, body.status);
      return new Response(JSON.stringify({ log: updated[0] }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: 'action or id+status required' }), { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
