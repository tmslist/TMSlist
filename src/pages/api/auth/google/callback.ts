import type { APIRoute } from 'astro';
import { getOrCreateUserByEmail, createSessionCookie, isAllowedEmail } from '../../../../utils/auth';
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

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state') || 'portal';
  const error = url.searchParams.get('error');

  const loginPath = state === 'admin' ? '/admin/login' : '/portal/login';

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

    // Create session
    const cookie = createSessionCookie({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Determine redirect
    let redirectTo: string;
    if (state === 'admin') {
      redirectTo = '/admin/dashboard/';
    } else if (user.clinicId) {
      redirectTo = '/portal/dashboard/';
    } else {
      redirectTo = '/portal/claim/';
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
