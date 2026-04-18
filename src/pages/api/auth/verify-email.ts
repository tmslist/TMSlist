import type { APIRoute } from 'astro';
import { verifyMagicToken, invalidateAllUserSessions } from '../../../utils/auth';
import { db } from '../../../db';
import { users, auditLog } from '../../../db/schema';
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

    // Look up user to get their ID before updating
    const [userRecord] = await db.select({ id: users.id }).from(users).where(eq(users.email, normalizedEmail)).limit(1);
    if (!userRecord) {
      return new Response(null, {
        status: 302,
        headers: { Location: '/portal/login?error=server-error' },
      });
    }

    // Mark email as verified
    await db.update(users)
      .set({ emailVerified: true, emailVerifiedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.email, normalizedEmail));

    // Invalidate all existing sessions — forces re-login with verified email
    await invalidateAllUserSessions(userRecord.id);

    // Audit log
    await db.insert(auditLog).values({
      userId: userRecord.id,
      action: 'email_verified',
      entityType: 'user',
      entityId: userRecord.id,
      metadata: { email: normalizedEmail },
    });

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
