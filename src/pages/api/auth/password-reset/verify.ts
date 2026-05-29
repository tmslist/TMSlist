import type { APIRoute } from 'astro';
import { verifyMagicToken, getUserByEmail, createSession, getClientIpFromRequest, isSafeRedirectPath } from '../../../../utils/auth.js';
import { Resend } from 'resend';

export const prerender = false;

const RESEND_KEY = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;
const SITE_URL = import.meta.env.SITE_URL || process.env.SITE_URL || 'https://tmslist.com';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

/**
 * GET /api/auth/password-reset/verify — validate a reset token and return user info.
 */
export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return new Response(JSON.stringify({ error: 'Token required' }), { status: 400 });
  }

  try {
    const result = await verifyMagicToken(token, 'password-reset');
    if (!result) {
      return new Response(JSON.stringify({ error: 'invalid-or-expired' }), { status: 400 });
    }

    return json({ email: result.email });
  } catch (err) {
    console.error('[password-reset/verify]', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};

/**
 * POST /api/auth/password-reset/confirm — set new password and create session.
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || typeof token !== 'string') {
      return json({ error: 'token required' }, 400);
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      return json({ error: 'Password must be at least 8 characters' }, 400);
    }

    const ipAddress = getClientIpFromRequest(request);
    const userAgent = request.headers.get('user-agent') || '';

    // Validate token — consumes it (single-use)
    const result = await verifyMagicToken(token, 'password-reset');
    if (!result) {
      return json({ error: 'This reset link has expired or already been used. Please request a new one.' }, 400);
    }

    const user = await getUserByEmail(result.email);
    if (!user) {
      return json({ error: 'User not found' }, 404);
    }

    const { createHash, randomBytes, scrypt } = await import('crypto');
    const salt = randomBytes(16).toString('hex');
    const saltBuf = Buffer.from(salt, 'hex');
    const passwordBuf = Buffer.from(password, 'utf8');
    const hash = await new Promise<string>((resolve, reject) => {
      scrypt(passwordBuf, saltBuf, 64, (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey.toString('hex'));
      });
    });
    const passwordHash = `scrypt:${salt}:${hash}`;

    // Update password
    const { db } = await import('../../../../db');
    const { users } = await import('../../../../db/schema');
    const { eq } = await import('drizzle-orm');
    await db.update(users).set({ passwordHash, lockedUntil: null, failedLoginAttempts: 0 }).where(eq(users.id, user.id));

    // Create session
    const { cookie } = await createSession(
      { userId: user.id, email: user.email, role: user.role },
      { userAgent, ipAddress }
    );

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookie,
      },
    });
  } catch (err) {
    console.error('[password-reset/confirm]', err);
    return json({ error: 'Internal server error' }, 500);
  }
};
