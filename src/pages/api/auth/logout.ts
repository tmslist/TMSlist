import type { APIRoute } from 'astro';
import { clearSessionCookie, invalidateSession } from '../../../utils/auth';

const COOKIE_NAME = 'tms_session';

function getCookies(request: Request): Record<string, string> {
  const cookieHeader = request.headers.get('cookie') || '';
  return Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [key, ...val] = c.trim().split('=');
      return [key, val.join('=')];
    })
  );
}

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
  const cookies = getCookies(request);
  const token = cookies[COOKIE_NAME];
  if (token) {
    invalidateSession(token).catch(() => {});
  }
  return clearAndRedirect(redirectTo);
};

export const POST: APIRoute = async ({ request }) => {
  const cookies = getCookies(request);
  const token = cookies[COOKIE_NAME];
  if (token) {
    await invalidateSession(token).catch(() => {});
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
