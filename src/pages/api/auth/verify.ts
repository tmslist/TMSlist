import type { APIRoute } from 'astro';
import { verifyMagicToken, getOrCreateUserByEmail, createSessionCookie } from '../../../utils/auth';
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
    const result = await verifyMagicToken(token);
    if (!result) {
      return new Response(null, { status: 302, headers: { Location: '/admin/login?error=invalid-or-expired' } });
    }

    const user = await getOrCreateUserByEmail(result.email);

    // Update last login
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

    const cookie = createSessionCookie({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

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
