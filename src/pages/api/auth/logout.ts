import type { APIRoute } from 'astro';
import { clearSessionCookie } from '../../../utils/auth';

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

export const GET: APIRoute = ({ url }) => {
  const redirectTo = url.searchParams.get('redirect') || '/';
  return clearAndRedirect(redirectTo);
};

export const POST: APIRoute = () => {
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
