import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { leads } from '../../../db/schema';
import { eq, sql, and } from 'drizzle-orm';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export const GET: APIRoute = async ({ url, request }) => {
  // Auth check — require admin role
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!hasRole(session, 'admin')) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const clinicId = url.searchParams.get('clinicId');
  if (!clinicId) {
    return new Response(JSON.stringify({ error: 'clinicId required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!isValidUUID(clinicId)) {
    return new Response(JSON.stringify({ error: 'Invalid clinicId format' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(and(eq(leads.clinicId, clinicId), sql`${leads.createdAt} > NOW() - INTERVAL '30 days'`));
    return new Response(JSON.stringify({ count: Number(result[0]?.count ?? 0) }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.error('[social-proof]', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};