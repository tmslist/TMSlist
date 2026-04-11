import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { leads } from '../../../db/schema';
import { eq, sql, and } from 'drizzle-orm';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const clinicId = url.searchParams.get('clinicId');
  if (!clinicId) return new Response(JSON.stringify({ count: 0 }), { headers: { 'Content-Type': 'application/json' } });

  try {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(and(eq(leads.clinicId, clinicId), sql`${leads.createdAt} > NOW() - INTERVAL '30 days'`));
    return new Response(JSON.stringify({ count: Number(result[0]?.count ?? 0) }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
    });
  } catch {
    return new Response(JSON.stringify({ count: 0 }), { headers: { 'Content-Type': 'application/json' } });
  }
};
