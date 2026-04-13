import type { APIRoute } from 'astro';
import { verifyMagicToken, getOrCreateUserByEmail, createSession, getClientIpFromRequest } from '../../../utils/auth';
import { db } from '../../../db';
import { users } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

const SITE_URL = import.meta.env.SITE_URL || process.env.SITE_URL || 'https://tmslist.com';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return new Response(null, { status: 302, headers: { Location: '/admin/login?error=missing-token' } });
  }

  try {
    // Accept portal-magic tokens for admin login too (shared token type)
    const result = await verifyMagicToken(token, 'portal-magic');
    if (!result) {
      return new Response(null, { status: 302, headers: { Location: '/admin/login?error=invalid-or-expired' } });
    }

    const user = await getOrCreateUserByEmail(result.email);

    // Update last login
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

    // Create session with tracking
    const { cookie } = await createSession(
      { userId: user.id, email: user.email, role: user.role },
      {
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: getClientIpFromRequest(request),
      }
    );

    return new Response(null, {
      status: 302,
      headers: {
        Location: '/admin/dashboard',
        'Set-Cookie': cookie,
      },
    });
  } catch (err) {
    console.error('Verify error:', err);
    return new Response(null, { status: 302, headers: { Location: '/admin/login?error=server-error' } });
  }
};
