import type { APIRoute } from 'astro';
import { getSessionFromRequest } from '../../../../utils/auth.js';
import { db } from '../../../../db';
import { users } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { authenticator } from 'otplib';
import { encryptSecret } from '../../../../utils/secretEncryption.js';

export const prerender = false;

const SITE_URL = import.meta.env.SITE_URL || process.env.SITE_URL || 'https://tmslist.com';
const APP_NAME = 'TMS List';

/**
 * POST /api/auth/2fa/setup
 * Generate a new TOTP secret and return provisioning URI + QR code.
 */
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Generate a new TOTP secret
  const secret = authenticator.generateSecret();
  const encodedSecret = authenticator.encodeSecret(secret);
  const otpauthUrl = authenticator.keyuri(session.email, APP_NAME, secret);

  // Store the encrypted secret. Verify endpoints decrypt before use; legacy
  // plaintext rows are accepted for backwards compatibility and re-encrypted
  // on next successful verify.
  await db.update(users).set({
    totpSecret: encryptSecret(secret),
  }).where(eq(users.id, session.userId));

  return new Response(JSON.stringify({
    secret: encodedSecret,  // base32 for manual entry
    otpauthUrl,              // URI for QR code scanning
    qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

/**
 * GET /api/auth/2fa/setup
 * Check if 2FA is currently enabled for the authenticated user.
 */
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const results = await db.select({
    totpEnabled: users.totpEnabled,
    totpVerifiedAt: users.totpVerifiedAt,
  })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  return new Response(JSON.stringify({
    totpEnabled: results[0]?.totpEnabled ?? false,
    totpVerifiedAt: results[0]?.totpVerifiedAt ?? null,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
};