import type { APIRoute } from 'astro';
import { verifyMagicToken, getUserByEmail, createSessionCookie } from '../../../utils/auth';
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
    const result = await verifyMagicToken(token);
    if (!result) {
      return new Response(null, { status: 302, headers: { Location: '/portal/login?error=invalid-or-expired' } });
    }

    const normalizedEmail = result.email.toLowerCase();

    // Look up or create user with clinic_owner role
    let user = await getUserByEmail(normalizedEmail);

    if (!user) {
      const created = await db.insert(users).values({
        email: normalizedEmail,
        name: normalizedEmail.split('@')[0],
        role: 'clinic_owner' as const,
      }).returning();
      user = created[0];
    }

    // Update last login
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

    const cookie = createSessionCookie({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // If user doesn't have a clinicId, redirect to claim flow
    if (!user.clinicId) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: '/portal/claim',
          'Set-Cookie': cookie,
        },
      });
    }

    // User has a clinic, go to dashboard
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/portal/dashboard',
        'Set-Cookie': cookie,
      },
    });
  } catch (err) {
    console.error('Portal verify error:', err);
    return new Response(null, { status: 302, headers: { Location: '/portal/login?error=server-error' } });
  }
};
