import type { APIRoute } from 'astro';
import { getNewsletterSubscribers, getNewsletterStats, unsubscribeNewsletter, resubscribeNewsletter, addNewsletterSubscriber } from '../../../db/queries';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin', 'editor')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const url = new URL(request.url);
  const opts = {
    status: url.searchParams.get('status') ?? undefined,
    limit: Math.min(parseInt(url.searchParams.get('limit') ?? '50'), 200),
    offset: parseInt(url.searchParams.get('offset') ?? '0'),
  };

  try {
    const [subscribers, stats] = await Promise.all([
      getNewsletterSubscribers(opts),
      getNewsletterStats(),
    ]);
    return new Response(JSON.stringify({ subscribers, stats }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
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

    if (body.action === 'unsubscribe') {
      await unsubscribeNewsletter(body.email);
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    if (body.action === 'resubscribe') {
      await resubscribeNewsletter(body.email);
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    if (body.email) {
      const subscriber = await addNewsletterSubscriber(body);
      return new Response(JSON.stringify({ subscriber }), { status: 201 });
    }

    return new Response(JSON.stringify({ error: 'email or action required' }), { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
