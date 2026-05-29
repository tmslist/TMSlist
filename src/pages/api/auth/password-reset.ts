import type { APIRoute } from 'astro';
import { createMagicToken, isAllowedEmail, getUserByEmail } from '../../../utils/auth.js';
import { strictRateLimit, getClientIp } from '../../../utils/rateLimit.js';
import { Resend } from 'resend';

export const prerender = false;

const RESEND_KEY = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;
const SITE_URL = import.meta.env.SITE_URL || process.env.SITE_URL || 'https://tmslist.com';

/**
 * POST /api/auth/password-reset
 *
 * Initiates a password reset flow. Always returns 200 to prevent email enumeration.
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const ip = getClientIp(request);

    // Rate limit: 3 per IP per 15 minutes (prevents password spraying on IPs)
    const rateLimited = await strictRateLimit(ip, 3, '15 m', 'auth:password-reset-ip');
    if (rateLimited) return rateLimited;

    let email: string;
    try {
      const body = await request.json();
      if (!body?.email || typeof body.email !== 'string') {
        return new Response(JSON.stringify({ error: 'email required' }), { status: 400 });
      }
      email = body.email.toLowerCase().trim();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400 });
    }

    // Also rate limit per email address (prevents targeting a specific user)
    const emailLimitedEmail = await strictRateLimit(email, 3, '15 m', 'auth:password-reset-email');
    if (emailLimitedEmail) return emailLimitedEmail;

    // Check if user exists — only if allowed
    if (!isAllowedEmail(email)) {
      // Always return success to prevent enumeration
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    const user = await getUserByEmail(email);
    if (!user || !user.passwordHash) {
      // User not found or OAuth-only account — still return success
      // so attackers can't tell valid from invalid emails
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    const token = await createMagicToken(email, 'password-reset');
    const resetUrl = `${SITE_URL}/admin/set-password?token=${token}`;

    if (!RESEND_KEY) {
      console.error('[password-reset] RESEND_API_KEY not set');
      return new Response(JSON.stringify({ error: 'Email service not configured' }), { status: 500 });
    }

    const resend = new Resend(RESEND_KEY);
    await resend.emails.send({
      from: 'TMS List <security@mail.tmslist.com>',
      to: email,
      subject: 'Reset your TMS List admin password',
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 24px; font-weight: 700; color: #111827; margin: 0;">TMS List</h1>
            <p style="color: #6b7280; margin-top: 8px;">Password Reset</p>
          </div>
          <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px; text-align: center;">
            <p style="color: #374151; font-size: 16px; margin: 0 0 24px;">
              We received a request to reset your password. Click the button below to set a new one.
            </p>
            <a href="${resetUrl}" style="display: inline-block; background: #4f46e5; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Reset Password</a>
            <p style="color: #9ca3af; font-size: 13px; margin-top: 24px;">
              This link expires in 15 minutes and can only be used once.<br/>
              If you didn't request this, your account is still secure — just ignore this email.
            </p>
          </div>
        </div>
      `,
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('Password reset error:', err);
    return new Response(JSON.stringify({ error: 'Failed to send reset link' }), { status: 500 });
  }
};
