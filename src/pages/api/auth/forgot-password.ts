import type { APIRoute } from 'astro';
import { forgotPasswordSchema } from '../../../db/validation';
import { createMagicToken, getUserByEmail } from '../../../utils/auth';
import { strictRateLimit } from '../../../utils/rateLimit';
import { sendPasswordResetEmail } from '../../../utils/email';

export const prerender = false;

const SITE_URL = import.meta.env.SITE_URL || process.env.SITE_URL || 'https://tmslist.com';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Please enter a valid email address' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { email } = parsed.data;

    // Rate limit: 3 requests per email per 15 minutes
    const rateLimited = await strictRateLimit(email.toLowerCase(), 3, '15 m', 'auth:forgot-password');
    if (rateLimited) return rateLimited;

    // Always return success to prevent email enumeration
    // Only send email if the account exists
    const user = await getUserByEmail(email.toLowerCase());

    if (user) {
      const token = await createMagicToken(email, 'password-reset');
      const resetUrl = `${SITE_URL}/portal/reset-password?token=${token}`;

      if (import.meta.env.DEV || process.env.NODE_ENV === 'development') {
        console.log(`\n[DEV] Password reset for ${email}:\n   ${resetUrl}\n`);
      }

      await sendPasswordResetEmail({
        to: email,
        resetUrl,
        userName: user.name || undefined,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    return new Response(JSON.stringify({ error: 'Failed to process request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
