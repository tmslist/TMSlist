import type { APIRoute } from 'astro';
import { getSessionFromRequest, createSession, getClientIpFromRequest, logAuthEvent } from '../../../utils/auth';
import { db } from '../../../db';
import { users } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { authenticator } from 'otplib';

export const prerender = false;

/**
 * POST /api/auth/2fa/verify
 * Verify a TOTP code and enable 2FA. Also completes the login session.
 * Body: { userId: string, code: string }
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    // Validate input
    if (!body.userId || !body.code) {
      return new Response(JSON.stringify({ error: 'userId and code are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(body.code)) {
      return new Response(JSON.stringify({ error: 'Code must be 6 digits' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch user with TOTP secret
    const results = await db.select({
      id: users.id,
      email: users.email,
      role: users.role,
      totpSecret: users.totpSecret,
      totpEnabled: users.totpEnabled,
    })
      .from(users)
      .where(eq(users.id, body.userId))
      .limit(1);

    const user = results[0];
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!user.totpSecret) {
      return new Response(JSON.stringify({ error: '2FA setup not initiated. Call POST /api/auth/2fa/setup first.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify TOTP code
    const isValid = authenticator.verify({
      token: body.code,
      secret: user.totpSecret,
    });

    if (!isValid) {
      // Log failed 2FA attempt
      await logAuthEvent({
        userId: user.id,
        action: '2fa_verification_failed',
        ipAddress: getClientIpFromRequest(request),
        userAgent: request.headers.get('user-agent') || undefined,
        metadata: {},
      });

      return new Response(JSON.stringify({ error: 'Invalid code' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Enable 2FA
    await db.update(users).set({
      totpEnabled: true,
      totpVerifiedAt: new Date(),
    }).where(eq(users.id, user.id));

    // Create session
    const ip = getClientIpFromRequest(request);
    const userAgent = request.headers.get('user-agent') || '';
    const { cookie } = await createSession(
      { userId: user.id, email: user.email, role: user.role },
      { userAgent, ipAddress: ip }
    );

    // Log 2FA enabled
    await logAuthEvent({
      userId: user.id,
      action: '2fa_enabled',
      ipAddress: ip,
      userAgent,
    });

    return new Response(JSON.stringify({
      success: true,
      totpEnabled: true,
      user: { id: user.id, email: user.email, role: user.role },
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookie,
      },
    });
  } catch (err) {
    console.error('[2fa/verify]', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};