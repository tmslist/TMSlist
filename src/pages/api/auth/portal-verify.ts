import type { APIRoute } from 'astro';
import { verifyMagicToken, getUserByEmail, createSession, getClientIpFromRequest, logLoginActivity } from '../../../utils/auth';
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
        loginUrl: `${SITE_URL}/portal/login`,
      });
    }
  } catch (err) {
    console.error('[auth] Failed to check suspicious login:', err);
  }
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return new Response(null, { status: 302, headers: { Location: '/portal/login?error=missing-token' } });
  }

  const ipAddress = getClientIpFromRequest(request);
  const userAgent = request.headers.get('user-agent') || '';

  try {
    // Only accept portal-magic tokens (scope enforcement)
    const result = await verifyMagicToken(token, 'portal-magic');
    if (!result) {
      return new Response(null, { status: 302, headers: { Location: '/portal/login?error=invalid-or-expired' } });
    }

    const normalizedEmail = result.email.toLowerCase();

    // Look up or create user with clinic_owner role
    let user = await getUserByEmail(normalizedEmail);

    if (!user) {
      const created = await db.insert(users).values({
        email: normalizedEmail,
        name: normalizedEmail.split('@')[0],
        role: 'clinic_owner' as const,
      }).returning();
      user = created[0];
    }

    // Update last login
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

    // Create session with session tracking
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

    // If user doesn't have a clinicId, redirect to claim flow
    if (!user.clinicId) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: '/portal/claim',
          'Set-Cookie': cookie,
        },
      });
    }

    // User has a clinic, go to dashboard
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/portal/dashboard',
        'Set-Cookie': cookie,
      },
    });
  } catch (err) {
    console.error('Portal verify error:', err);
    return new Response(null, { status: 302, headers: { Location: '/portal/login?error=server-error' } });
  }
};
