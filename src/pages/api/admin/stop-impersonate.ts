import type { APIRoute } from 'astro';
import { getSessionFromRequest, logAuthEvent, getClientIpFromRequest } from '../../../utils/auth.js';

export const prerender = false;

const COOKIE_NAME = 'session';
const isProd = process.env.NODE_ENV === 'production';
const secure = isProd ? '; Secure' : '';
const clearCookie = `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;

/**
 * POST /api/admin/stop-impersonate
 * Clears the impersonation cookie and redirects to admin login.
 * Accepts any session that is currently flagged isImpersonation.
 */
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);

  if (session?.isImpersonation) {
    try {
      await logAuthEvent({
        userId: session.userId,
        action: 'stop_impersonate',
        ipAddress: getClientIpFromRequest(request),
        userAgent: request.headers.get('user-agent') || '',
        metadata: { impersonatedEmail: session.email },
      });
    } catch (err) {
      console.error('stop-impersonate audit log failed', err);
    }
  }

  return new Response(null, {
    status: 302,
    headers: {
      'Location': '/admin/login?impersonation_ended=1',
      'Set-Cookie': clearCookie,
    },
  });
};

export const GET: APIRoute = async (ctx) => POST(ctx);
