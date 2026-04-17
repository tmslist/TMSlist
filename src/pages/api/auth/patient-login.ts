import type { APIRoute } from 'astro';
import {
  getUserByEmail,
  verifyPassword,
  createSessionCookie,
  isAccountLocked,
  recordFailedLoginAttempt,
  clearFailedLoginAttempts,
} from '../../../utils/auth';
import { strictRateLimit, getClientIp } from '../../../utils/rateLimit';

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

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      await recordFailedLoginAttempt(user.id);
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Password correct — clear failed attempts
    await clearFailedLoginAttempts(user.id);

    const cookie = createSessionCookie({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

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