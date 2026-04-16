import type { APIRoute } from 'astro';
import { getSessionFromRequest, logAuthEvent, getClientIpFromRequest } from '../../../utils/auth';
import { db } from '../../../db';
import { users } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { authenticator } from 'otplib';

export const prerender = false;

/**
 * POST /api/auth/2fa/disable
 * Disable 2FA. Requires current TOTP code as verification.
 * Body: { code: string }
 */
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();

    if (!body.code || !/^\d{6}$/.test(body.code)) {
      return new Response(JSON.stringify({ error: 'A valid 6-digit code is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch user
    const results = await db.select({
      id: users.id,
      email: users.email,
      totpSecret: users.totpSecret,
      totpEnabled: users.totpEnabled,
    })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    const user = results[0];
    if (!user || !user.totpEnabled) {
      return new Response(JSON.stringify({ error: '2FA is not enabled' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify current TOTP code
    const isValid = authenticator.verify({
      token: body.code,
      secret: user.totpSecret!,
    });

    if (!isValid) {
      await logAuthEvent({
        userId: user.id,
        action: '2fa_disable_failed',
        ipAddress: getClientIpFromRequest(request),
        userAgent: request.headers.get('user-agent') || undefined,
      });

      return new Response(JSON.stringify({ error: 'Invalid code' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Disable 2FA
    await db.update(users).set({
      totpEnabled: false,
      totpSecret: null,
      totpVerifiedAt: null,
    }).where(eq(users.id, user.id));

    await logAuthEvent({
      userId: user.id,
      action: '2fa_disabled',
      ipAddress: getClientIpFromRequest(request),
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return new Response(JSON.stringify({
      success: true,
      totpEnabled: false,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[2fa/disable]', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};