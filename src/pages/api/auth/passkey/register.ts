import type { APIRoute } from 'astro';
import {
  getSessionFromRequest,
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from '../../../../utils/auth';
import { db } from '../../../../db';
import { users } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

const RP_NAME = 'TMS List';
const RP_ID = (import.meta.env.SITE_URL || process.env.SITE_URL || 'https://tmslist.com')
  .replace(/^https?:\/\//, '')
  .split(':')[0]
  .split('/')[0];  // Extract host from URL

/**
 * GET /api/auth/passkey/register
 * Get registration options (challenge) for registering a passkey.
 */
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Fetch existing passkeys to exclude them (prevent duplicate registration)
    const results = await db.select({ passkeys: users.passkeys })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    const existingCredentials = results[0]?.passkeys ?? [];

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpId: RP_ID,
      userName: session.email,
      userId: session.userId,
      attestationType: 'none',
      excludeCredentials: existingCredentials.map(cred => ({
        id: cred.credentialID,
        type: 'public-key' as const,
      })),
      authenticatorSelection: {
        authenticatorAttachment: 'cross-platform',
        userVerification: 'preferred',
        requireResidentKey: false,
      },
    });

    return new Response(JSON.stringify(options), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[passkey/register]', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * POST /api/auth/passkey/register
 * Verify and store the passkey registration response.
 * Body: RegistrationResponse from @simplewebauthn/browser
 */
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const credential = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: session.userId,  // Use userId as challenge (stored in session)
      expectedOrigin: import.meta.env.SITE_URL || process.env.SITE_URL || 'https://tmslist.com',
      expectedRPID: RP_ID,
    });

    // Store the credential
    const newCredential = {
      credentialID: credential.id,
      credentialPublicKey: Buffer.from(credential.publicKey).toString('base64url'),
      counter: credential.counter,
      deviceType: 'cross-platform',
      createdAt: new Date().toISOString(),
    };

    // Append to existing passkeys array
    const results = await db.select({ passkeys: users.passkeys })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    const existingPasskeys: Array<typeof newCredential> = results[0]?.passkeys ?? [];
    const updatedPasskeys = [...existingPasskeys, newCredential];

    await db.update(users).set({ passkeys: updatedPasskeys }).where(eq(users.id, session.userId));

    return new Response(JSON.stringify({
      success: true,
      passkeyCount: updatedPasskeys.length,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[passkey/register]', err);
    return new Response(JSON.stringify({ error: 'Passkey registration failed' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};