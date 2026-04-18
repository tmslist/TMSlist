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
    const redirectTo = body.redirectTo || '/community';

    // Rate limit: 3 requests per email per 15 minutes
    const rateLimited = await strictRateLimit(email.toLowerCase(), 3, '15 m', 'auth:community-login');
    if (rateLimited) return rateLimited;

    const token = await createMagicToken(email, 'community-magic');
    const magicUrl = `${SITE_URL}/api/auth/community-verify?token=${token}&redirect=${encodeURIComponent(redirectTo)}`;

    if (import.meta.env.DEV || process.env.NODE_ENV === 'development') {
      console.log(`\n[DEV] Community magic link for ${email}:\n   ${magicUrl}\n`);
    }

    await sendMagicLinkEmail({ to: email, magicUrl, type: 'community' });

    // Always return success to prevent email enumeration
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Community login error:', err);
    return new Response(JSON.stringify({ error: 'Failed to send login link. Please try again.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
