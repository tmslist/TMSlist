import type { APIRoute } from 'astro';
import { getOrCreateUserByEmail, createSessionCookie } from '../../../../utils/auth';
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
  const redirectTo = url.searchParams.get('state') || '/community';
  const error = url.searchParams.get('error');

  if (error || !code) {
    return new Response(null, {
      status: 302,
      headers: { Location: `/login?error=google-auth-failed&redirect=${encodeURIComponent(redirectTo)}` },
    });
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return new Response(null, {
      status: 302,
      headers: { Location: `/login?error=google-not-configured&redirect=${encodeURIComponent(redirectTo)}` },
    });
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: `${SITE_URL}/api/auth/google/patient-callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      console.error('[patient-auth] Token exchange failed:', await tokenRes.text());
      return new Response(null, {
        status: 302,
        headers: { Location: `/login?error=google-token-failed&redirect=${encodeURIComponent(redirectTo)}` },
      });
    }

    const tokenData: GoogleTokenResponse = await tokenRes.json();

    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userInfoRes.ok) {
      console.error('[patient-auth] User info failed:', await userInfoRes.text());
      return new Response(null, {
        status: 302,
        headers: { Location: `/login?error=google-userinfo-failed&redirect=${encodeURIComponent(redirectTo)}` },
      });
    }

    const googleUser: GoogleUserInfo = await userInfoRes.json();

    if (!googleUser.email || !googleUser.email_verified) {
      return new Response(null, {
        status: 302,
        headers: { Location: `/login?error=email-not-verified&redirect=${encodeURIComponent(redirectTo)}` },
      });
    }

    const normalizedEmail = googleUser.email.toLowerCase();

    // Get or create user as patient role
    let user = await getOrCreateUserByEmail(normalizedEmail);

    // Promote to patient role if currently viewer/unset
    if (user.role === 'viewer') {
      await db.update(users).set({ role: 'patient' }).where(eq(users.id, user.id));
      user = { ...user, role: 'patient' };
    }

    // Always update name, picture, and last login
    await db.update(users).set({
      name: googleUser.name || user.name,
      lastLoginAt: new Date(),
    }).where(eq(users.id, user.id));

    const cookie = createSessionCookie({
      userId: user.id,
      email: user.email,
      role: user.role,
      clinicId: user.clinicId ?? undefined,
    });

    // Sanitize redirect to prevent open redirect
    const safeRedirect = redirectTo.startsWith('/') ? redirectTo : '/community';

    return new Response(null, {
      status: 302,
      headers: {
        Location: safeRedirect,
        'Set-Cookie': cookie,
      },
    });
  } catch (err) {
    console.error('[patient-auth] Error:', err);
    return new Response(null, {
      status: 302,
      headers: { Location: `/login?error=server-error` },
    });
  }
};
