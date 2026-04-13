import type { APIRoute } from 'astro';
import { verifyMagicToken, getUserByEmail, createSessionCookie } from '../../../utils/auth';
import { db } from '../../../db';
import { users } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const redirectTo = url.searchParams.get('redirect') || '/community';

  if (!token) {
    return new Response(null, { status: 302, headers: { Location: '/community/login?error=missing-token' } });
  }

  try {
    const result = await verifyMagicToken(token);
    if (!result) {
      return new Response(null, { status: 302, headers: { Location: '/community/login?error=invalid-or-expired' } });
    }

    const normalizedEmail = result.email.toLowerCase();

    // Look up or create user with viewer role (community member)
    let user = await getUserByEmail(normalizedEmail);

    if (!user) {
      const created = await db.insert(users).values({
        email: normalizedEmail,
        name: normalizedEmail.split('@')[0],
        role: 'viewer' as const,
      }).returning();
      user = created[0];
    }

    // Update last login
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

    const cookie = createSessionCookie({
      userId: user.id,
      email: user.email,
      role: user.role,
      clinicId: user.clinicId ?? undefined,
    });

    // Sanitize redirect to prevent open redirect
    const safeRedirect = redirectTo.startsWith('/community') ? redirectTo : '/community';

    return new Response(null, {
      status: 302,
      headers: {
        Location: safeRedirect,
        'Set-Cookie': cookie,
      },
    });
  } catch (err) {
    console.error('Community verify error:', err);
    return new Response(null, { status: 302, headers: { Location: '/community/login?error=server-error' } });
  }
};
