import type { APIRoute } from 'astro';
import { clearSessionCookie, invalidateSession, getSessionFromRequest } from '../../../utils/auth';

export const prerender = false;

const clearAndRedirect = (redirectTo?: string) =>
  new Response(null, {
    status: 302,
    headers: {
      Location: redirectTo || '/',
      'Set-Cookie': clearSessionCookie(),
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
    },
  });

export const GET: APIRoute = ({ request, url }) => {
  const redirectTo = url.searchParams.get('redirect') || '/';
  // Invalidate the session from DB on logout
  const session = getSessionFromRequest(request);
  if (session) {
    // Fire-and-forget: don't block the redirect on DB delete
    invalidateSession(session.userId).catch(() => {});
  }
  return clearAndRedirect(redirectTo);
};

export const POST: APIRoute = async ({ request }) => {
  // Invalidate the session from DB on logout
  const session = getSessionFromRequest(request);
  if (session) {
    await invalidateSession(session.userId).catch(() => {});
  }
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': clearSessionCookie(),
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
    },
  });
};
