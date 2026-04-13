import type { APIRoute } from 'astro';
import { resetPasswordSchema } from '../../../db/validation';
import { verifyMagicToken, hashPassword, isPasswordStrongEnough } from '../../../utils/auth';
import { db } from '../../../db';
import { users } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
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

    // Update password hash
    const passwordHash = await hashPassword(password);
    await db.update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.email, normalizedEmail));

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
