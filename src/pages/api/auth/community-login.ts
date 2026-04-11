import type { APIRoute } from 'astro';
import { magicLinkSchema } from '../../../db/validation';
import { createMagicToken } from '../../../utils/auth';
import { strictRateLimit } from '../../../utils/rateLimit';
import { Resend } from 'resend';

export const prerender = false;

const RESEND_KEY = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;
const SITE_URL = import.meta.env.SITE_URL || process.env.SITE_URL || 'https://tmslist.com';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const parsed = magicLinkSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Please enter a valid email address' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { email } = parsed.data;
    const redirectTo = body.redirectTo || '/community';

    // Rate limit: 3 requests per email per 15 minutes
    const rateLimited = await strictRateLimit(email.toLowerCase(), 3, '15 m', 'auth:community-login');
    if (rateLimited) return rateLimited;

    const token = await createMagicToken(email);
    const magicUrl = `${SITE_URL}/api/auth/community-verify?token=${token}&redirect=${encodeURIComponent(redirectTo)}`;

    if (!RESEND_KEY) {
      console.error('[community-login] RESEND_API_KEY not set');
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const resend = new Resend(RESEND_KEY);
    await resend.emails.send({
      from: 'TMS List <login@mail.tmslist.com>',
      to: email,
      subject: 'Your TMS List Community login link',
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 24px; font-weight: 700; color: #111827; margin: 0;">TMS List</h1>
            <p style="color: #7C3AED; margin-top: 8px; font-weight: 600;">Community Forum</p>
          </div>
          <div style="background: #ffffff; border: 1px solid #ede9fe; border-radius: 12px; padding: 32px; text-align: center;">
            <p style="color: #374151; font-size: 16px; margin: 0 0 24px;">Click the button below to join the TMS List Community. This link expires in 15 minutes.</p>
            <a href="${magicUrl}" style="display: inline-block; background: #7C3AED; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Join Community</a>
            <p style="color: #9ca3af; font-size: 13px; margin-top: 24px;">If you didn't request this link, you can safely ignore this email.</p>
          </div>
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">Share experiences, ask questions, and connect with the TMS community.</p>
        </div>
      `,
    });

    // Always return success to prevent email enumeration
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Community login error:', err);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
