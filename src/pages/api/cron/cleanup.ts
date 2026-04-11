import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { magicTokens, clinicClaims } from '../../../db/schema';
import { lt, and } from 'drizzle-orm';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${import.meta.env.CRON_SECRET || process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const now = new Date();
  const [deletedTokens] = await Promise.all([
    db.delete(magicTokens).where(lt(magicTokens.expiresAt, now)),
    db.delete(clinicClaims).where(and(lt(clinicClaims.expiresAt, now))),
  ]);

  return new Response(JSON.stringify({ cleaned: true, timestamp: now.toISOString() }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
