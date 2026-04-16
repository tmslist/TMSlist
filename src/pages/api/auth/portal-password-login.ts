import type { APIRoute } from 'astro';
import { loginSchema } from '../../../db/validation';
import { getUserByEmail, verifyPassword, createSession, getClientIpFromRequest } from '../../../utils/auth';
import { strictRateLimit } from '../../../utils/rateLimit';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    // Rate limit: 5 requests per IP per 15 minutes
    const ip = getClientIpFromRequest(request);
    const rateLimited = await strictRateLimit(ip, 5, '15 m', 'auth:portal-password');
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid credentials format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { email, password } = parsed.data;
    const user = await getUserByEmail(email.toLowerCase());

    if (!user) {
      return new Response(JSON.stringify({ error: 'No account found. Please sign up first.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!user.passwordHash) {
      return new Response(JSON.stringify({ error: 'This account uses magic link login. Please use "Send Login Link" instead.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create session with tracking
    const { cookie } = await createSession(
      { userId: user.id, email: user.email, role: user.role },
      {
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: ip,
      }
    );

    // Determine redirect based on whether user has a clinic
    const finalRedirect = user.clinicId ? '/portal/dashboard' : '/portal/claim';

    // Return 302 redirect — browser sets the HttpOnly cookie when following
    return new Response(null, {
      status: 302,
      headers: {
        Location: finalRedirect,
        'Set-Cookie': cookie,
      },
    });
  } catch (err) {
    console.error('Portal password login error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
