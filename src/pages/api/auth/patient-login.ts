import type { APIRoute } from 'astro';
import {
  getUserByEmail,
  verifyPassword,
  createSession,
  isAccountLocked,
  recordFailedLoginAttempt,
  clearFailedLoginAttempts,
  logLoginActivity,
} from '../../../utils/auth.js';
import { strictRateLimit, getClientIp } from '../../../utils/rateLimit.js';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const ip = getClientIp(request);
    const rateLimited = await strictRateLimit(ip, 5, '15 m', 'auth:patient-login');
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = await getUserByEmail(email);
    if (!user || !user.passwordHash) {
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // CRITICAL: Check brute-force lockout BEFORE verifying password (same as login.ts)
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

    const userAgent = request.headers.get('user-agent') || '';
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      await recordFailedLoginAttempt(user.id);
      // Audit-log failed patient login attempts so brute-force is visible.
      await logLoginActivity({
        userId: user.id,
        email: user.email,
        success: false,
        ipAddress: ip,
        userAgent,
        failureReason: 'Invalid password',
      }).catch((err) => console.error('[patient-login] log failure:', err));
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Password correct — clear failed attempts
    await clearFailedLoginAttempts(user.id);

    // Use createSession (writes to sessions table) so logout / invalidate
    // can revoke the cookie before its 7-day JWT expiry.
    const { cookie } = await createSession(
      { userId: user.id, email: user.email, role: user.role },
      { userAgent, ipAddress: ip },
    );

    await logLoginActivity({
      userId: user.id,
      email: user.email,
      success: true,
      ipAddress: ip,
      userAgent,
    }).catch((err) => console.error('[patient-login] log success:', err));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookie,
      },
    });
  } catch (err) {
    console.error('[patient-login]', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};