import type { APIRoute } from 'astro';
import { verifyMagicToken, getOrCreateUserByEmail, createSession, getClientIpFromRequest } from '../../../utils/auth';
import { db } from '../../../db';
import { users } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const state = url.searchParams.get('state') || '/account';

  if (!token) {
    return new Response(null, { status: 302, headers: { Location: '/login?error=missing-token' } });
  }

  try {
    // Try patient-magic first, then portal-magic (backwards compat)
    let result = await verifyMagicToken(token, 'patient-magic');
    if (!result) {
      result = await verifyMagicToken(token, 'portal-magic');
    }

    if (!result) {
      return new Response(null, { status: 302, headers: { Location: '/login?error=invalid-or-expired' } });
    }

    const user = await getOrCreateUserByEmail(result.email);

    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

    const { cookie } = await createSession(
      { userId: user.id, email: user.email, role: user.role },
      {
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: getClientIpFromRequest(request),
      }
    );

    // Determine redirect based on token purpose
    let redirect = state;
    if (result.purpose === 'portal-magic' && !state.startsWith('/account')) {
      redirect = '/portal/dashboard';
    }

    return new Response(null, {
      status: 302,
      headers: {
        Location: redirect,
        'Set-Cookie': cookie,
      },
    });
  } catch (err) {
    console.error('[verify]', err);
    return new Response(null, { status: 302, headers: { Location: '/login?error=server-error' } });
  }
};