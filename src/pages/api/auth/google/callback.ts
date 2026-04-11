import type { APIRoute } from 'astro';
import { getUserByEmail, createSessionCookie } from '../../../../utils/auth';
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
  expires_in: number;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (error) {
    console.error('Google OAuth error:', error);
    return new Response(null, {
      status: 302,
      headers: { Location: '/portal/login?error=google-denied' },
    });
  }

  if (!code || !state) {
    return new Response(null, {
      status: 302,
      headers: { Location: '/portal/login?error=missing-token' },
    });
  }

  // Verify CSRF state
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [key, ...val] = c.trim().split('=');
      return [key, val.join('=')];
    })
  );
  const savedState = cookies['oauth_state'];

  if (!savedState || savedState !== state) {
    return new Response(null, {
      status: 302,
      headers: { Location: '/portal/login?error=invalid-or-expired' },
    });
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.error('[google/callback] Google OAuth credentials not configured');
    return new Response(null, {
      status: 302,
      headers: { Location: '/portal/login?error=server-error' },
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
        redirect_uri: `${import.meta.env.DEV ? new URL(request.url).origin : SITE_URL}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error('Google token exchange failed:', errBody);
      return new Response(null, {
        status: 302,
        headers: { Location: '/portal/login?error=server-error' },
      });
    }

    const tokens: GoogleTokenResponse = await tokenRes.json();

    // Get user info
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoRes.ok) {
      console.error('Google userinfo fetch failed:', await userInfoRes.text());
      return new Response(null, {
        status: 302,
        headers: { Location: '/portal/login?error=server-error' },
      });
    }

    const googleUser: GoogleUserInfo = await userInfoRes.json();

    if (!googleUser.email) {
      return new Response(null, {
        status: 302,
        headers: { Location: '/portal/login?error=server-error' },
      });
    }

    const normalizedEmail = googleUser.email.toLowerCase();

    // Get or create user with clinic_owner role
    let user = await getUserByEmail(normalizedEmail);

    if (!user) {
      const result = await db.insert(users).values({
        email: normalizedEmail,
        name: googleUser.name || normalizedEmail.split('@')[0],
        role: 'clinic_owner' as const,
      }).returning();
      user = result[0];
    }

    // Update last login
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

    const cookie = createSessionCookie({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Clear the oauth_state cookie
    const clearState = 'oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';

    // Redirect based on whether user has a clinic
    const redirectTo = user.clinicId ? '/portal/dashboard' : '/portal/claim';

    const headers = new Headers();
    headers.set('Location', redirectTo);
    headers.append('Set-Cookie', cookie);
    headers.append('Set-Cookie', clearState);

    return new Response(null, {
      status: 302,
      headers,
    });
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    return new Response(null, {
      status: 302,
      headers: { Location: '/portal/login?error=server-error' },
    });
  }
};
