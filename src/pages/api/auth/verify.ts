import type { APIRoute } from 'astro';
import { verifyMagicToken, getOrCreateUserByEmail, createSession, getClientIpFromRequest, logLoginActivity } from '../../../utils/auth';
import { sendSuspiciousLoginAlert } from '../../../utils/email';
import { db } from '../../../db';
import { users } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

const SITE_URL = import.meta.env.SITE_URL || process.env.SITE_URL || 'https://tmslist.com';

// Suspicious login alert — check if IP/device is new
async function checkAndAlertSuspiciousLogin(
  userId: string,
  email: string,
  ipAddress: string,
  userAgent: string
) {
  try {
    const results = await db
      .select({ knownDevices: users.knownDevices })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!results[0]?.knownDevices || results[0].knownDevices.length === 0) {
      return;
    }

    const { createHash } = await import('crypto');
    const deviceHash = createHash('sha256')
      .update(`${ipAddress}:${userAgent}`)
      .digest('hex');
    const knownDevices = results[0].knownDevices;
    const isKnown = knownDevices.some(
      (d: { deviceHash: string }) => d.deviceHash === deviceHash
    );

    if (!isKnown) {
      await sendSuspiciousLoginAlert({
        to: email,
        userAgent,
        ipAddress,
        loginUrl: `${SITE_URL}/login`,
      });
    }
  } catch (err) {
    console.error('[auth] Failed to check suspicious login:', err);
  }
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const state = url.searchParams.get('state') || '/account';

  if (!token) {
    return new Response(null, { status: 302, headers: { Location: '/login?error=missing-token' } });
  }

  const ipAddress = getClientIpFromRequest(request);
  const userAgent = request.headers.get('user-agent') || '';

  try {
    // Try patient-magic first, then portal-magic (backwards compat)
    let result = await verifyMagicToken(token, 'patient-magic');
    if (!result) {
      result = await verifyMagicToken(token, 'portal-magic');
    }

    if (!result) {
      return new Response(null, { status: 302, headers: { Location: '/login?error=invalid-or-expired' } });
    }

    const user = await getOrCreateUserByEmail(result.email);

    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

    const { cookie } = await createSession(
      { userId: user.id, email: user.email, role: user.role },
      {
        userAgent,
        ipAddress,
      }
    );

    // Log successful login to history
    await logLoginActivity({
      userId: user.id,
      email: user.email,
      success: true,
      ipAddress,
      userAgent,
    });

    // Check for suspicious login (new device/IP) — async, non-blocking
    checkAndAlertSuspiciousLogin(user.id, user.email, ipAddress, userAgent).catch((err) =>
      console.error('[auth] Suspicious login check failed:', err)
    );

    // Determine redirect based on token purpose
    let redirect = state;
    if (result.purpose === 'portal-magic' && !state.startsWith('/account')) {
      redirect = '/portal/dashboard';
    }

    return new Response(null, {
      status: 302,
      headers: {
        Location: redirect,
        'Set-Cookie': cookie,
      },
    });
  } catch (err) {
    console.error('[verify]', err);
    return new Response(null, { status: 302, headers: { Location: '/login?error=server-error' } });
  }
};
