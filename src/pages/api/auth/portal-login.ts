import type { APIRoute } from 'astro';
import { magicLinkSchema } from '../../../db/validation';
import { createMagicToken } from '../../../utils/auth';
import { strictRateLimit } from '../../../utils/rateLimit';
import { sendMagicLinkEmail } from '../../../utils/email';

export const prerender = false;

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

    // Rate limit: 3 requests per email per 15 minutes
    const rateLimited = await strictRateLimit(email.toLowerCase(), 3, '15 m', 'auth:portal-login');
    if (rateLimited) return rateLimited;

    const token = await createMagicToken(email, 'portal-magic');
    const magicUrl = `${SITE_URL}/api/auth/portal-verify?token=${token}`;

    // Log magic link in dev mode for easy testing without email
    if (import.meta.env.DEV || process.env.NODE_ENV === 'development') {
      console.log(`\n🔗 [DEV] Magic link for ${email}:\n   ${magicUrl}\n`);
    }

    await sendMagicLinkEmail({
      to: email,
      magicUrl,
      type: 'portal',
    });

    // Always return success to prevent email enumeration
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Portal login error:', err);
    return new Response(JSON.stringify({ error: 'Failed to process login request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
