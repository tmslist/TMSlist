import type { APIRoute } from 'astro';
import { loginSchema } from '../../../db/validation';
import {
  getUserByEmail,
  verifyPassword,
  createSession,
  getClientIpFromRequest,
  isAccountLocked,
  recordFailedLoginAttempt,
  clearFailedLoginAttempts,
  logLoginActivity,
} from '../../../utils/auth';
import { sendSuspiciousLoginAlert } from '../../../utils/email';
import { strictRateLimit } from '../../../utils/rateLimit';
import { db } from '../../../db';
import { users } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

const SITE_URL = import.meta.env.SITE_URL || process.env.SITE_URL || 'https://tmslist.com';

// Suspicious login alert — check if IP/device is new
async function checkAndAlertSuspiciousLogin(
  userId: string,
  email: string,
  ipAddress: string,
  userAgent: string
) {
  try {
    const results = await db
      .select({ knownDevices: users.knownDevices })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!results[0]?.knownDevices || results[0].knownDevices.length === 0) {
      return;
    }

    const { createHash } = await import('crypto');
    const deviceHash = createHash('sha256')
      .update(`${ipAddress}:${userAgent}`)
      .digest('hex');
    const knownDevices = results[0].knownDevices;
    const isKnown = knownDevices.some(
      (d: { deviceHash: string }) => d.deviceHash === deviceHash
    );

    if (!isKnown) {
      await sendSuspiciousLoginAlert({
        to: email,
        userAgent,
        ipAddress,
        loginUrl: `${SITE_URL}/portal/login`,
      });
    }
  } catch (err) {
    console.error('[auth] Failed to check suspicious login:', err);
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const ip = getClientIpFromRequest(request);
    const userAgent = request.headers.get('user-agent') || '';
    const rateLimited = await strictRateLimit(ip, 5, '15 m', 'auth:portal-password');
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid credentials format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { email, password } = parsed.data;
    const user = await getUserByEmail(email.toLowerCase());

    if (!user) {
      return new Response(JSON.stringify({ error: 'No account found. Please sign up first.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!user.passwordHash) {
      return new Response(
        JSON.stringify({
          error: 'This account uses magic link login. Please use "Send Login Link" instead.',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // CRITICAL: Check brute-force lockout BEFORE verifying password
    const lockStatus = await isAccountLocked(user.id);
    if (lockStatus.locked) {
      return new Response(
        JSON.stringify({
          error: `Account locked due to too many failed attempts. Try again in ${lockStatus.retryAfterSeconds} seconds.`,
          retryAfter: lockStatus.retryAfterSeconds,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(lockStatus.retryAfterSeconds),
          },
        }
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);

    if (!valid) {
      // Record failed attempt and check for lockout
      const attemptResult = await recordFailedLoginAttempt(user.id);

      // Log failed login to history
      await logLoginActivity({
        userId: user.id,
        email: user.email,
        success: false,
        ipAddress: ip,
        userAgent,
        failureReason: 'Invalid password',
      });

      if (attemptResult.locked) {
        return new Response(
          JSON.stringify({
            error: `Account locked due to too many failed attempts. Try again in ${attemptResult.retryAfterSeconds} seconds.`,
            retryAfter: attemptResult.retryAfterSeconds,
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': String(attemptResult.retryAfterSeconds),
            },
          }
        );
      }

      return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Password correct — clear failed attempts
    await clearFailedLoginAttempts(user.id);

    // Create session with tracking
    const { cookie } = await createSession(
      { userId: user.id, email: user.email, role: user.role },
      {
        userAgent,
        ipAddress: ip,
      }
    );

    // Log successful login to history
    await logLoginActivity({
      userId: user.id,
      email: user.email,
      success: true,
      ipAddress: ip,
      userAgent,
    });

    // Check for suspicious login (new device/IP) — async, non-blocking
    checkAndAlertSuspiciousLogin(user.id, user.email, ip, userAgent).catch((err) =>
      console.error('[auth] Suspicious login check failed:', err)
    );

    // Determine redirect based on whether user has a clinic
    const finalRedirect = user.clinicId ? '/portal/dashboard' : '/portal/claim';

    return new Response(null, {
      status: 302,
      headers: {
        Location: finalRedirect,
        'Set-Cookie': cookie,
      },
    });
  } catch (err) {
    console.error('Portal password login error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
