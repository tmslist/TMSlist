import type { APIRoute } from 'astro';
import { loginSchema } from '../../../db/validation';
import {
  getUserByEmail,
  verifyPassword,
  createSession,
  isAccountLocked,
  recordFailedLoginAttempt,
  clearFailedLoginAttempts,
  logLoginActivity,
} from '../../../utils/auth';
import { sendSuspiciousLoginAlert } from '../../../utils/email';
import { strictRateLimit, getClientIp } from '../../../utils/rateLimit';
import { db } from '../../../db';
import { users } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { createHash } from 'crypto';

export const prerender = false;

const SITE_URL = import.meta.env.SITE_URL || process.env.SITE_URL || 'https://tmslist.com';

// Suspicious login alert — check if IP/device is new
async function checkAndAlertSuspiciousLogin(userId: string, email: string, ipAddress: string, userAgent: string) {
  try {
    const results = await db.select({ knownDevices: users.knownDevices })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!results[0]?.knownDevices || results[0].knownDevices.length === 0) {
      // First login ever — not suspicious
      return;
    }

    const deviceHash = createHash('sha256').update(`${ipAddress}:${userAgent}`).digest('hex');
    const knownDevices = results[0].knownDevices;
    const isKnown = knownDevices.some((d: { deviceHash: string }) => d.deviceHash === deviceHash);

    if (!isKnown) {
      // New device or IP — send alert
      await sendSuspiciousLoginAlert({
        to: email,
        userAgent,
        ipAddress,
        loginUrl: `${SITE_URL}/admin`,
      });
    }
  } catch (err) {
    console.error('[auth] Failed to check suspicious login:', err);
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // Rate limit: 5 requests per IP per 15 minutes
    const ip = getClientIp(request);
    const rateLimited = await strictRateLimit(ip, 5, '15 m', 'auth:login');
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
    const userAgent = request.headers.get('user-agent') || '';

    const user = await getUserByEmail(email);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // CRITICAL: Check brute-force lockout BEFORE verifying password
    const lockStatus = await isAccountLocked(user.id);
    if (lockStatus.locked) {
      return new Response(JSON.stringify({
        error: `Account locked due to too many failed attempts. Try again in ${lockStatus.retryAfterSeconds} seconds.`,
        retryAfter: lockStatus.retryAfterSeconds,
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(lockStatus.retryAfterSeconds),
        },
      });
    }

    const valid = await verifyPassword(password, user.passwordHash || '');

    if (!valid) {
      // Record failed attempt
      const attemptResult = await recordFailedLoginAttempt(user.id);

      // Log failed login
      await logLoginActivity({
        userId: user.id,
        email: user.email,
        success: false,
        ipAddress: ip,
        userAgent,
        failureReason: 'Invalid password',
      });

      if (attemptResult.locked) {
        return new Response(JSON.stringify({
          error: `Account locked due to too many failed attempts. Try again in ${attemptResult.retryAfterSeconds} seconds.`,
          retryAfter: attemptResult.retryAfterSeconds,
        }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(attemptResult.retryAfterSeconds),
          },
        });
      }

      return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Password correct — clear failed attempts
    await clearFailedLoginAttempts(user.id);

    // Create session
    const { cookie } = await createSession(
      { userId: user.id, email: user.email, role: user.role },
      { userAgent, ipAddress: ip }
    );

    // Log successful login
    await logLoginActivity({
      userId: user.id,
      email: user.email,
      success: true,
      ipAddress: ip,
      userAgent,
    });

    // Check for suspicious login (new device/IP) — async, non-blocking
    checkAndAlertSuspiciousLogin(user.id, user.email, ip, userAgent).catch(err =>
      console.error('[auth] Suspicious login check failed:', err)
    );

    return new Response(JSON.stringify({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookie,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
