import type { APIRoute } from 'astro';
import { getSessionFromRequest } from '../../../utils/auth';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);

  if (!session) {
    return new Response(JSON.stringify({ user: null }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Only expose the minimum needed by the client — never expose the full JWT
  return new Response(JSON.stringify({
    user: {
      id: session.userId,
      email: session.email,
      role: session.role,
    },
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
