import type { APIRoute } from 'astro';
import { getSessionFromRequest, logAuthEvent, getClientIpFromRequest } from '../../../../utils/auth.js';
import { strictRateLimit, getClientIp } from '../../../../utils/rateLimit.js';
import { decryptSecret } from '../../../../utils/secretEncryption.js';
import { db } from '../../../../db';
import { users } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { authenticator } from 'otplib';

export const prerender = false;

const DISABLE_LOCK_THRESHOLD = 5;
const DISABLE_LOCK_DURATION_MS = 15 * 60 * 1000;

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

  // Rate-limit per IP to slow attackers using a stolen session cookie.
  const rateIp = getClientIp(request);
  const rateLimited = await strictRateLimit(rateIp, 10, '5 m', 'auth:2fa-disable');
  if (rateLimited) return rateLimited;

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
      lockedUntil: users.lockedUntil,
      failedLoginAttempts: users.failedLoginAttempts,
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

    // Honor lockout window — blocks brute-force of the 6-digit disable code.
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      const retry = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 1000);
      return new Response(JSON.stringify({
        error: `Too many failed attempts. Try again in ${retry} seconds.`,
        retryAfter: retry,
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retry),
        },
      });
    }

    // Decrypt at-rest secret before TOTP verify.
    let plainSecret: string;
    try {
      plainSecret = decryptSecret(user.totpSecret!);
    } catch (err) {
      console.error('[2fa/disable] secret decrypt failed:', err);
      return new Response(JSON.stringify({ error: 'Server misconfiguration' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const isValid = authenticator.verify({ token: body.code, secret: plainSecret });

    if (!isValid) {
      const newAttempts = (user.failedLoginAttempts ?? 0) + 1;
      const reachedThreshold = newAttempts >= DISABLE_LOCK_THRESHOLD;
      const newLockedUntil = reachedThreshold ? new Date(Date.now() + DISABLE_LOCK_DURATION_MS) : user.lockedUntil;

      await db.update(users).set({
        failedLoginAttempts: newAttempts,
        lockedUntil: newLockedUntil,
      }).where(eq(users.id, user.id));

      await logAuthEvent({
        userId: user.id,
        action: '2fa_disable_failed',
        ipAddress: getClientIpFromRequest(request),
        userAgent: request.headers.get('user-agent') || undefined,
        metadata: { attempts: newAttempts, locked: reachedThreshold },
      });

      if (reachedThreshold) {
        const retry = Math.ceil(DISABLE_LOCK_DURATION_MS / 1000);
        return new Response(JSON.stringify({
          error: `Too many failed attempts. Account locked for 15 minutes.`,
          retryAfter: retry,
        }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(retry),
          },
        });
      }

      return new Response(JSON.stringify({ error: 'Invalid code' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Disable 2FA, clear lockout state
    await db.update(users).set({
      totpEnabled: false,
      totpSecret: null,
      totpVerifiedAt: null,
      lockedUntil: null,
      failedLoginAttempts: 0,
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