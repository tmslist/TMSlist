import type { APIRoute } from 'astro';
import { randomBytes } from 'crypto';

export const prerender = false;

const GOOGLE_CLIENT_ID = import.meta.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
const SITE_URL = import.meta.env.SITE_URL || process.env.SITE_URL || 'https://tmslist.com';
const STATE_COOKIE = 'google_oauth_state';

export const GET: APIRoute = async ({ request, url }) => {
  if (!GOOGLE_CLIENT_ID) {
    return new Response('Google OAuth not configured. Set GOOGLE_CLIENT_ID in .env', { status: 500 });
  }

  // Detect admin vs portal from explicit query param first, falling back to
  // referer for backwards compatibility. Referer alone is unreliable as an
  // authorization signal — never trust it for access decisions, only for UX.
  const flowParam = url.searchParams.get('flow');
  const referer = request.headers.get('referer') || '';
  const isAdmin = flowParam === 'admin' || (flowParam == null && referer.includes('/admin/'));
  const isPatient = flowParam === 'patient';
  const flow = isPatient ? 'patient' : isAdmin ? 'admin' : 'portal';

  // For patient flow, `state` carries the post-login redirect path
  // (the patient-callback reads it directly as the destination).
  // For admin/portal flow, state is a CSRF nonce verified against an HttpOnly cookie.
  let state: string;
  let redirectUri: string;
  let stateCookie: string | null = null;

  if (isPatient) {
    const redirectTo = url.searchParams.get('redirect') || '/account';
    state = redirectTo;
    redirectUri = `${SITE_URL}/api/auth/google/patient-callback`;
  } else {
    const nonce = randomBytes(32).toString('hex');
    state = `${flow}:${nonce}`;
    redirectUri = `${SITE_URL}/api/auth/google/callback`;
    const isProd = process.env.NODE_ENV === 'production';
    const secure = isProd ? '; Secure' : '';
    stateCookie = `${STATE_COOKIE}=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${secure}`;
  }

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
    state,
  });

  const headers: Record<string, string> = {
    Location: `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
  };
  if (stateCookie) headers['Set-Cookie'] = stateCookie;

  return new Response(null, { status: 302, headers });
};
