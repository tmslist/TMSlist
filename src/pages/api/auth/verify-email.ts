import type { APIRoute } from 'astro';
import { verifyMagicToken } from '../../../utils/auth';
import { db } from '../../../db';
import { users } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return new Response(null, { status: 302, headers: { Location: '/portal/login?error=missing-token' } });
  }

  try {
    // Verify email verification token
    const result = await verifyMagicToken(token, 'email-verification');
    if (!result) {
      return new Response(null, {
        status: 302,
        headers: { Location: '/portal/login?error=invalid-or-expired' },
      });
    }

    const normalizedEmail = result.email.toLowerCase();

    // Mark email as verified
    await db.update(users)
      .set({ emailVerified: true, emailVerifiedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.email, normalizedEmail));

    return new Response(null, {
      status: 302,
      headers: { Location: '/portal/login?verified=true' },
    });
  } catch (err) {
    console.error('Email verification error:', err);
    return new Response(null, {
      status: 302,
      headers: { Location: '/portal/login?error=server-error' },
    });
  }
};
