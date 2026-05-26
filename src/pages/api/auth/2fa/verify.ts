import type { APIRoute } from 'astro';
import {
  getSessionFromRequest,
  createSession,
  getClientIpFromRequest,
  logAuthEvent,
  verifyPendingMfaCookie,
  clearPendingMfaCookie,
} from '../../../../utils/auth.js';
import { strictRateLimit, getClientIp } from '../../../../utils/rateLimit.js';
import { decryptSecret, isEncryptedSecret, encryptSecret } from '../../../../utils/secretEncryption.js';
import { db } from '../../../../db';
import { users } from '../../../../db/schema';
import { eq, sql } from 'drizzle-orm';
import { authenticator } from 'otplib';

export const prerender = false;

const TOTP_LOCK_THRESHOLD = 5;
const TOTP_LOCK_DURATION_MS = 15 * 60 * 1000;

const json = (data: unknown, status = 200, extraHeaders: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });

/**
 * POST /api/auth/2fa/verify
 *
 * Verifies a TOTP code for either:
 *   (a) the post-password-login 2FA step (identified by the `tms_mfa_pending`
 *       cookie set by /api/auth/login), or
 *   (b) the initial 2FA enrollment (identified by the active session cookie).
 *
 * In both cases the userId is derived from a server-issued cookie. The body
 * is NEVER consulted for the userId — that would let unauthenticated callers
 * target arbitrary accounts.
 *
 * Lockout uses the shared `failedLoginAttempts` column with atomic increment.
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // Rate-limit per IP regardless of identity to slow distributed guesses.
    const ip = getClientIp(request);
    const rateLimited = await strictRateLimit(ip, 10, '5 m', 'auth:2fa-verify');
    if (rateLimited) return rateLimited;

    const body = await request.json().catch(() => ({} as { code?: string }));
    const code = (body as { code?: string }).code;

    if (!code) return json({ error: 'code is required' }, 400);
    if (!/^\d{6}$/.test(code)) return json({ error: 'Code must be 6 digits' }, 400);

    // Resolve userId from server-issued credentials only.
    const session = getSessionFromRequest(request);
    const pendingMfa = verifyPendingMfaCookie(request);
    const userId = pendingMfa?.userId ?? session?.userId;
    const isLoginFlow = !!pendingMfa && !session;

    if (!userId) {
      return json({ error: 'No active 2FA session. Sign in with your password again.' }, 401);
    }

    const results = await db.select({
      id: users.id,
      email: users.email,
      role: users.role,
      totpSecret: users.totpSecret,
      totpEnabled: users.totpEnabled,
      lockedUntil: users.lockedUntil,
      failedLoginAttempts: users.failedLoginAttempts,
    })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const user = results[0];
    if (!user) return json({ error: 'User not found' }, 404);

    if (!user.totpSecret) {
      return json({ error: '2FA setup not initiated. Call POST /api/auth/2fa/setup first.' }, 400);
    }

    // Honor existing lockout window.
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      const retryAfterSeconds = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 1000);
      return json(
        { error: `Too many failed attempts. Try again in ${retryAfterSeconds} seconds.`, retryAfter: retryAfterSeconds },
        429,
        { 'Retry-After': String(retryAfterSeconds) },
      );
    }

    let plainSecret: string;
    try {
      plainSecret = decryptSecret(user.totpSecret);
    } catch (err) {
      console.error('[2fa/verify] secret decrypt failed:', err);
      return json({ error: 'Server misconfiguration' }, 500);
    }
    const isValid = authenticator.verify({ token: code, secret: plainSecret });

    if (!isValid) {
      const userAgent = request.headers.get('user-agent') || '';
      const newAttempts = (user.failedLoginAttempts ?? 0) + 1;
      const reachedThreshold = newAttempts >= TOTP_LOCK_THRESHOLD;
      const newLockedUntil = reachedThreshold ? new Date(Date.now() + TOTP_LOCK_DURATION_MS) : user.lockedUntil;

      await db
        .update(users)
        .set({
          failedLoginAttempts: newAttempts,
          lockedUntil: newLockedUntil,
        })
        .where(eq(users.id, user.id));

      await logAuthEvent({
        userId: user.id,
        action: '2fa_verification_failed',
        ipAddress: ip,
        userAgent,
        metadata: { attempts: newAttempts, locked: reachedThreshold },
      });

      if (reachedThreshold) {
        const retry = Math.ceil(TOTP_LOCK_DURATION_MS / 1000);
        return json(
          { error: `Too many failed attempts. Account locked for 15 minutes.`, retryAfter: retry },
          429,
          { 'Retry-After': String(retry) },
        );
      }

      return json({ error: 'Invalid code' }, 401);
    }

    // Success — reset counters and complete the appropriate flow.
    // Opportunistically re-encrypt legacy plaintext secrets.
    const updates: Record<string, unknown> = {
      lockedUntil: null,
      failedLoginAttempts: 0,
      totpEnabled: true,
      totpVerifiedAt: new Date(),
    };
    if (!isEncryptedSecret(user.totpSecret)) {
      updates.totpSecret = encryptSecret(plainSecret);
    }
    await db.update(users).set(updates).where(eq(users.id, user.id));

    const userAgent = request.headers.get('user-agent') || '';
    const { cookie } = await createSession(
      { userId: user.id, email: user.email, role: user.role },
      { userAgent, ipAddress: ip },
    );

    await logAuthEvent({
      userId: user.id,
      action: isLoginFlow ? '2fa_login_success' : '2fa_enabled',
      ipAddress: ip,
      userAgent,
    });

    // Set the real session cookie and clear the pending-MFA cookie.
    const headers = new Headers({ 'Content-Type': 'application/json' });
    headers.append('Set-Cookie', cookie);
    headers.append('Set-Cookie', clearPendingMfaCookie());

    return new Response(JSON.stringify({
      success: true,
      totpEnabled: true,
      user: { id: user.id, email: user.email, role: user.role },
    }), { status: 200, headers });
  } catch (err) {
    console.error('[2fa/verify]', err);
    return json({ error: 'Internal server error' }, 500);
  }
};
