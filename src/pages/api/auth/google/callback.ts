import type { APIRoute } from 'astro';
import { getOrCreateUserByEmail, createSession, isAllowedEmail, getClientIpFromRequest } from '../../../../utils/auth.js';
import { db } from '../../../../db';
import { users } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

const GOOGLE_CLIENT_ID = import.meta.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = import.meta.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
const SITE_URL = import.meta.env.SITE_URL || process.env.SITE_URL || 'https://tmslist.com';

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
}

interface GoogleUserInfo {
  email: string;
  name: string;
  picture: string;
  email_verified: boolean;
}

const STATE_COOKIE = 'google_oauth_state';

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get('cookie') || '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return null;
}

// Constant-time string comparison to avoid timing attacks on the nonce.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const stateParam = url.searchParams.get('state') || '';
  const error = url.searchParams.get('error');

  // Parse `flow:nonce`; reject any state that doesn't match the cookie.
  const cookieState = readCookie(request, STATE_COOKIE);
  const stateValid = !!cookieState && stateParam.length > 0 && safeEqual(cookieState, stateParam);
  const flow = stateValid ? (stateParam.split(':')[0] === 'admin' ? 'admin' : 'portal') : 'portal';
  const state = flow; // existing downstream code uses `state` as the flow tag
  const loginPath = state === 'admin' ? '/admin/login' : '/portal/login';

  // Always clear the state cookie after consumption (single-use).
  const isProd = process.env.NODE_ENV === 'production';
  const secure = isProd ? '; Secure' : '';
  const clearStateCookie = `${STATE_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;

  if (!stateValid) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${loginPath}?error=invalid-state`,
        'Set-Cookie': clearStateCookie,
      },
    });
  }

  if (error || !code) {
    return new Response(null, {
      status: 302,
      headers: { Location: `${loginPath}?error=google-auth-failed` },
    });
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return new Response(null, {
      status: 302,
      headers: { Location: `${loginPath}?error=google-not-configured` },
    });
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: `${SITE_URL}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      console.error('[google-auth] Token exchange failed:', await tokenRes.text());
      return new Response(null, {
        status: 302,
        headers: { Location: `${loginPath}?error=google-token-failed` },
      });
    }

    const tokenData: GoogleTokenResponse = await tokenRes.json();

    // Get user info from Google
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userInfoRes.ok) {
      console.error('[google-auth] User info failed:', await userInfoRes.text());
      return new Response(null, {
        status: 302,
        headers: { Location: `${loginPath}?error=google-userinfo-failed` },
      });
    }

    const googleUser: GoogleUserInfo = await userInfoRes.json();

    if (!googleUser.email || !googleUser.email_verified) {
      return new Response(null, {
        status: 302,
        headers: { Location: `${loginPath}?error=email-not-verified` },
      });
    }

    const normalizedEmail = googleUser.email.toLowerCase();

    // For admin login, check ADMIN_EMAILS allowlist
    if (state === 'admin' && !isAllowedEmail(normalizedEmail)) {
      return new Response(null, {
        status: 302,
        headers: { Location: `${loginPath}?error=not-authorized` },
      });
    }

    // Get or create user
    let user = await getOrCreateUserByEmail(normalizedEmail);

    // Update user name and last login
    await db.update(users).set({
      name: googleUser.name || user.name,
      lastLoginAt: new Date(),
    }).where(eq(users.id, user.id));

    // For portal login, set role to clinic_owner if not already set
    if (state === 'portal' && user.role === 'viewer') {
      await db.update(users).set({ role: 'clinic_owner' }).where(eq(users.id, user.id));
      user = { ...user, role: 'clinic_owner' };
    }

    // Create session — writes to sessions table so logout can revoke.
    const { cookie } = await createSession(
      { userId: user.id, email: user.email, role: user.role },
      {
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: getClientIpFromRequest(request),
      },
    );

    // Determine redirect
    let redirectTo: string;
    if (state === 'admin') {
      redirectTo = '/admin/dashboard';
    } else if (user.clinicId) {
      redirectTo = '/portal/dashboard';
    } else {
      redirectTo = '/portal/claim';
    }

    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectTo,
        'Set-Cookie': cookie,
      },
    });
  } catch (err) {
    console.error('[google-auth] Error:', err);
    return new Response(null, {
      status: 302,
      headers: { Location: `${loginPath}?error=server-error` },
    });
  }
};
