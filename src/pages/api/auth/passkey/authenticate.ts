import type { APIRoute } from 'astro';
import {
  getSessionFromRequest,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  createSession,
  getClientIpFromRequest,
  logLoginActivity,
  logAuthEvent,
  storePasskeyAuthChallenge,
  verifyPasskeyAuth,
} from '../../../../utils/auth';
import { strictRateLimit } from '../../../../utils/rateLimit';
import { db } from '../../../../db';
import { users } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

const RP_ID = (import.meta.env.SITE_URL || process.env.SITE_URL || 'https://tmslist.com')
  .replace(/^https?:\/\//, '')
  .split(':')[0]
  .split('/')[0];

const PASSKEY_LOCK_THRESHOLD = 10;
const PASSKEY_LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * POST /api/auth/passkey/authenticate
 * Authenticate using a passkey. Two-step flow:
 *   Step 1: { email } -> returns auth options with server-generated challenge
 *   Step 2: { userId, assertion, challenge } -> verifies and creates session
 */
export const POST: APIRoute = async ({ request }) => {
  const ip = getClientIpFromRequest(request);

  // Rate limit the entire endpoint: 20 attempts per IP per 15 minutes
  const rateLimited = await strictRateLimit(ip, 20, '15 m', 'auth:passkey');
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();

    // Step 1: Get auth options (email provided, no assertion yet)
    if (body.email && !body.assertion) {
      const userResults = await db.select({
        id: users.id,
        email: users.email,
        passkeys: users.passkeys,
        lockedUntil: users.lockedUntil,
      })
        .from(users)
        .where(eq(users.email, body.email.toLowerCase()))
        .limit(1);

      const user = userResults[0];
      if (!user || !user.passkeys || user.passkeys.length === 0) {
        return new Response(JSON.stringify({ error: 'No passkeys registered for this account' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Check if account is locked
      if (user.lockedUntil && new Date() < user.lockedUntil) {
        const retryAfterSeconds = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 1000);
        return new Response(JSON.stringify({
          error: 'Account temporarily locked due to too many failed attempts.',
          retryAfter: retryAfterSeconds,
        }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfterSeconds),
          },
        });
      }

      const options = await generateAuthenticationOptions({
        rpId: RP_ID,
        allowCredentials: user.passkeys.map(cred => ({
          id: cred.credentialID,
          type: 'public-key' as const,
        })),
        userVerification: 'preferred',
      });

      // CRITICAL: Store the challenge in the DB so POST can verify it.
      await storePasskeyAuthChallenge(user.id, options.challenge);

      return new Response(JSON.stringify({
        options,
        userId: user.id,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Step 2: Verify assertion
    if (!body.assertion || !body.userId) {
      return new Response(JSON.stringify({ error: 'assertion and userId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch user's passkey credentials
    const userResults = await db.select({
      id: users.id,
      email: users.email,
      role: users.role,
      passkeys: users.passkeys,
      lockedUntil: users.lockedUntil,
    })
      .from(users)
      .where(eq(users.id, body.userId))
      .limit(1);

    const user = userResults[0];
    if (!user || !user.passkeys || user.passkeys.length === 0) {
      return new Response(JSON.stringify({ error: 'User not found or no passkeys' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if account is locked
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      const retryAfterSeconds = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 1000);
      return new Response(JSON.stringify({
        error: 'Account temporarily locked.',
        retryAfter: retryAfterSeconds,
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfterSeconds),
        },
      });
    }

    // Find the credential that was used
    const assertionRawId = typeof body.assertion.rawId === 'string' ? body.assertion.rawId : '';
    const credential = user.passkeys.find((c: { credentialID: string }) => c.credentialID === assertionRawId);
    if (!credential) {
      return new Response(JSON.stringify({ error: 'Credential not found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // CRITICAL: Verify the challenge from the client matches the one we stored in DB.
    // This prevents replay attacks and ensures the assertion was generated for this session.
    // Also check the authenticator counter to detect cloned passkeys.
    const clientChallenge = (() => {
      try {
        const clientDataObj = JSON.parse(atob(body.assertion.response.clientDataJSON));
        return clientDataObj.challenge;
      } catch {
        return null;
      }
    })();

    // Extract counter from authenticator data (bytes 53-57, big-endian u32)
    let clientCounter = 0;
    try {
      const authData = body.assertion.response.authenticatorData;
      if (authData && typeof authData === 'string') {
        const rawBytes = Buffer.from(authData, 'base64');
        if (rawBytes.length >= 57) {
          clientCounter = rawBytes.readUInt32BE(53);
        }
      }
    } catch {
      // Use 0 if extraction fails
    }

    const challengeResult = await verifyPasskeyAuth(
      user.id,
      clientChallenge,
      credential.credentialID,
      clientCounter
    );

    if (!challengeResult.valid) {
      return new Response(JSON.stringify({ error: challengeResult.reason }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const verification = await verifyAuthenticationResponse({
      response: body.assertion,
      expectedChallenge: clientChallenge,
      expectedOrigin: import.meta.env.SITE_URL || process.env.SITE_URL || 'https://tmslist.com',
      expectedRPID: RP_ID,
      authenticator: {
        credentialID: credential.credentialID,
        credentialPublicKey: Buffer.from(credential.credentialPublicKey, 'base64url'),
        counter: credential.counter,
      },
    });

    // Update counter in DB (counter is already validated above; this persists the new value)
    const newCounter = verification.authenticatorInfo?.credentialCounter ?? credential.counter;
    const updatedPasskeys = user.passkeys.map(c =>
      c.credentialID === credential.credentialID
        ? { ...c, counter: newCounter }
        : c
    );
    await db.update(users).set({ passkeys: updatedPasskeys, lockedUntil: null }).where(eq(users.id, user.id));

    // Create session
    const userAgent = request.headers.get('user-agent') || '';
    const { cookie } = await createSession(
      { userId: user.id, email: user.email, role: user.role },
      { userAgent, ipAddress: ip }
    );

    await logLoginActivity({
      userId: user.id,
      email: user.email,
      success: true,
      ipAddress: ip,
      userAgent,
    });

    return new Response(JSON.stringify({
      success: true,
      user: { id: user.id, email: user.email, role: user.role },
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookie,
      },
    });
  } catch (err) {
    console.error('[passkey/authenticate]', err);

    // On verification failure, try to increment lockout counter if userId was provided
    try {
      if (request.headers.get('content-type')?.includes('application/json')) {
        const bodyText = await request.text();
        const body = JSON.parse(bodyText);
        if (body.userId) {
          const userResults = await db.select({ lockedUntil: users.lockedUntil })
            .from(users).where(eq(users.id, body.userId)).limit(1);
          const current = userResults[0]?.lockedUntil;
          if (current && new Date() < current) {
            // Already locked, no need to update
          } else {
            await db.update(users).set({
              lockedUntil: new Date(Date.now() + PASSKEY_LOCK_DURATION_MS),
            }).where(eq(users.id, body.userId));
          }
        }
      }
    } catch {
      // Non-fatal — lockout tracking failed
    }

    return new Response(JSON.stringify({ error: 'Passkey authentication failed' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
