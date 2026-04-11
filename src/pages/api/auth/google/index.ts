import type { APIRoute } from 'astro';
import { randomBytes } from 'crypto';

export const prerender = false;

const GOOGLE_CLIENT_ID = import.meta.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
const SITE_URL = import.meta.env.SITE_URL || process.env.SITE_URL || 'https://tmslist.com';

export const GET: APIRoute = async ({ request }) => {
  if (!GOOGLE_CLIENT_ID) {
    return new Response(JSON.stringify({ error: 'Google OAuth not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Generate CSRF state token
  const state = randomBytes(32).toString('hex');

  // Store state in a short-lived cookie for verification in callback
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  const stateCookie = `oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${secure}`;

  // Use request origin for dev, SITE_URL for production
  const origin = import.meta.env.DEV ? new URL(request.url).origin : SITE_URL;
  const redirectUri = `${origin}/api/auth/google/callback`;

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'offline',
    prompt: 'select_account',
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  return new Response(null, {
    status: 302,
    headers: {
      Location: googleAuthUrl,
      'Set-Cookie': stateCookie,
    },
  });
};
