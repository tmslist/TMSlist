import type { APIRoute } from 'astro';
import { getSessionFromRequest } from '../../../utils/auth';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ bookmarks: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Bookmarks table not yet implemented — return empty array
  return new Response(JSON.stringify({ bookmarks: [] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};