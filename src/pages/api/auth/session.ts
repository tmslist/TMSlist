import type { APIRoute } from 'astro';
import { getSessionFromRequest } from '../../../utils/auth';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);

  if (!session) {
    return new Response(JSON.stringify({ user: null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ user: session }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
