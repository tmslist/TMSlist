import type { APIRoute } from 'astro';
import { resetPasswordSchema } from '../../../db/validation';
import { verifyMagicToken, hashPassword, isPasswordStrongEnough, invalidateAllUserSessions } from '../../../utils/auth';
import { strictRateLimit, getClientIp } from '../../../utils/rateLimit';
import { db } from '../../../db';
import { users, auditLog } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  // Rate limit: 5 attempts per IP per 15 minutes to prevent token brute-forcing
  const ip = getClientIp(request);
  const rateLimited = await strictRateLimit(ip, 5, '15 m', 'auth:reset-password');
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { token, password } = parsed.data;

    // Enforce password strength
    if (!isPasswordStrongEnough(password)) {
      return new Response(JSON.stringify({
        error: 'Password must be at least 8 characters with a mix of uppercase, lowercase, numbers, and special characters',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify the token (and consume it — prevents replay)
    const result = await verifyMagicToken(token, 'password-reset');
    if (!result) {
      return new Response(JSON.stringify({ error: 'This reset link has expired or already been used. Please request a new one.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const normalizedEmail = result.email.toLowerCase();

    // Look up user to get their ID before updating
    const [userRecord] = await db.select({ id: users.id }).from(users).where(eq(users.email, normalizedEmail)).limit(1);
    if (!userRecord) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update password hash
    const passwordHash = await hashPassword(password);
    await db.update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.email, normalizedEmail));

    // Invalidate all existing sessions so old tokens are revoked
    await invalidateAllUserSessions(userRecord.id);

    // Audit log
    await db.insert(auditLog).values({
      userId: userRecord.id,
      action: 'reset_user_password',
      entityType: 'user',
      entityId: userRecord.id,
      metadata: { email: normalizedEmail, reason: 'self-service-reset' },
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Reset password error:', err);
    return new Response(JSON.stringify({ error: 'Failed to reset password' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
