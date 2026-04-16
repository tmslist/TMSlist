import type { APIRoute } from 'astro';
import {
  getSessionFromRequest,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  createSession,
  getClientIpFromRequest,
  logLoginActivity,
} from '../../../../utils/auth';
import { db } from '../../../../db';
import { users } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

const RP_ID = (import.meta.env.SITE_URL || process.env.SITE_URL || 'https://tmslist.com')
  .replace(/^https?:\/\//, '')
  .split(':')[0]
  .split('/')[0];

/**
 * POST /api/auth/passkey/authenticate
 * Authenticate using a passkey. Two-step flow:
 *   Step 1: { email } -> returns auth options
 *   Step 2: { userId, assertion, challenge } -> verifies and creates session
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    // Step 1: Get auth options (email provided, no assertion yet)
    if (body.email && !body.assertion) {
      const userResults = await db.select({
        id: users.id,
        email: users.email,
        passkeys: users.passkeys,
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

      const options = await generateAuthenticationOptions({
        rpId: RP_ID,
        allowCredentials: user.passkeys.map(cred => ({
          id: cred.credentialID,
          type: 'public-key' as const,
        })),
        userVerification: 'preferred',
      });

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

    // Find the credential that was used
    const assertionRawId = typeof body.assertion.rawId === 'string' ? body.assertion.rawId : '';
    const credential = user.passkeys.find(c => c.credentialID === assertionRawId);
    if (!credential) {
      return new Response(JSON.stringify({ error: 'Credential not found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const verification = await verifyAuthenticationResponse({
      response: body.assertion,
      expectedChallenge: body.challenge,
      expectedOrigin: import.meta.env.SITE_URL || process.env.SITE_URL || 'https://tmslist.com',
      expectedRPID: RP_ID,
      authenticator: {
        credentialID: credential.credentialID,
        credentialPublicKey: Buffer.from(credential.credentialPublicKey, 'base64url'),
        counter: credential.counter,
      },
    });

    // Update counter in DB
    const newCounter = verification.authenticatorInfo?.credentialCounter ?? credential.counter;
    const updatedPasskeys = user.passkeys.map(c =>
      c.credentialID === credential.credentialID
        ? { ...c, counter: newCounter }
        : c
    );
    await db.update(users).set({ passkeys: updatedPasskeys }).where(eq(users.id, user.id));

    // Create session
    const ip = getClientIpFromRequest(request);
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
    return new Response(JSON.stringify({ error: 'Passkey authentication failed' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};