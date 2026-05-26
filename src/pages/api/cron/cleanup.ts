import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { magicTokens, clinicClaims } from '../../../db/schema';
import { lt, and } from 'drizzle-orm';
import { invalidateClinicsCache } from '../../../utils/dataHelpers';
import { requireCronAuth } from '../../../utils/cronAuth';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const authFail = requireCronAuth(request);
  if (authFail) return authFail;

  const now = new Date();
  await Promise.all([
    db.delete(magicTokens).where(lt(magicTokens.expiresAt, now)),
    db.delete(clinicClaims).where(and(lt(clinicClaims.expiresAt, now))),
  ]);

  // Invalidate clinic data cache so next request fetches fresh data
  invalidateClinicsCache();

  return new Response(JSON.stringify({ cleaned: true, timestamp: now.toISOString() }), {
    headers: { 'Content-Type': 'application/json' },
  });
};