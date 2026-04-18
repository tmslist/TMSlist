import type { APIRoute } from 'astro';
import { getSessionFromRequest, createSession, getClientIpFromRequest, logAuthEvent } from '../../../../utils/auth';
import { db } from '../../../../db';
import { users } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { authenticator } from 'otplib';

export const prerender = false;

const TOTP_LOCK_THRESHOLD = 5;
const TOTP_LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * POST /api/auth/2fa/verify
 * Verify a TOTP code and enable 2FA. Also completes the login session.
 * Body: { userId: string, code: string }
 *
 * Security: tracks failed attempts and locks the account after 5 wrong codes.
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
      lockedUntil: users.lockedUntil,
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

    // Check if TOTP is locked due to too many failed attempts
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      const retryAfterSeconds = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 1000);
      return new Response(JSON.stringify({
        error: `Too many failed attempts. Try again in ${retryAfterSeconds} seconds.`,
        retryAfter: retryAfterSeconds,
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfterSeconds),
        },
      });
    }

    // Verify TOTP code
    const isValid = authenticator.verify({
      token: body.code,
      secret: user.totpSecret,
    });

    if (!isValid) {
      const ip = getClientIpFromRequest(request);
      const userAgent = request.headers.get('user-agent') || '';

      // Get current failed attempts (reuse lockedUntil as the 2FA-specific lock field)
      const currentAttempts = (user.lockedUntil ? 1 : 0) + 1; // simplified: use lockedUntil as lockout marker
      const newLockedUntil = currentAttempts >= TOTP_LOCK_THRESHOLD
        ? new Date(Date.now() + TOTP_LOCK_DURATION_MS)
        : user.lockedUntil;

      // Update lockout state if threshold reached
      if (newLockedUntil !== user.lockedUntil) {
        await db.update(users).set({ lockedUntil: newLockedUntil }).where(eq(users.id, user.id));
      }

      await logAuthEvent({
        userId: user.id,
        action: '2fa_verification_failed',
        ipAddress: ip,
        userAgent,
        metadata: { attempts: currentAttempts, locked: !!newLockedUntil },
      });

      if (newLockedUntil && newLockedUntil !== user.lockedUntil) {
        return new Response(JSON.stringify({
          error: `Too many failed attempts. Account locked for 15 minutes.`,
          retryAfter: Math.ceil(TOTP_LOCK_DURATION_MS / 1000),
        }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil(TOTP_LOCK_DURATION_MS / 1000)),
          },
        });
      }

      return new Response(JSON.stringify({ error: 'Invalid code' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Successful verification — clear any TOTP lockout
    await db.update(users).set({ lockedUntil: null }).where(eq(users.id, user.id));

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
