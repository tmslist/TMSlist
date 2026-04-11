import type { APIRoute } from 'astro';

export const prerender = false;

const GOOGLE_CLIENT_ID = import.meta.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
const SITE_URL = import.meta.env.SITE_URL || process.env.SITE_URL || 'https://tmslist.com';

export const GET: APIRoute = async ({ request }) => {
  if (!GOOGLE_CLIENT_ID) {
    return new Response('Google OAuth not configured. Set GOOGLE_CLIENT_ID in .env', { status: 500 });
  }

  // Detect if this is admin or portal login from referer
  const referer = request.headers.get('referer') || '';
  const isAdmin = referer.includes('/admin/');
  const state = isAdmin ? 'admin' : 'portal';

  const redirectUri = `${SITE_URL}/api/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
    state,
  });

  return new Response(null, {
    status: 302,
    headers: { Location: `https://accounts.google.com/o/oauth2/v2/auth?${params}` },
  });
};
