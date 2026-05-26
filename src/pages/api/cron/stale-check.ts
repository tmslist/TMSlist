import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { clinics, notifications } from '../../../db/schema';
import { sql, eq } from 'drizzle-orm';
import { requireCronAuth } from '../../../utils/cronAuth';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const authFail = requireCronAuth(request);
  if (authFail) return authFail;

  const stale = await db.select({ id: clinics.id, name: clinics.name, updatedAt: clinics.updatedAt })
    .from(clinics).where(sql`${clinics.updatedAt} < NOW() - INTERVAL '6 months'`).limit(100);

  for (const c of stale) {
    await db.insert(notifications).values({
      type: 'stale_data',
      title: `Stale clinic: ${c.name}`,
      message: `Last updated ${c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : 'unknown'}`,
      link: `/admin/clinics/${c.id}`,
    });
  }

  return new Response(JSON.stringify({ staleCount: stale.length }), { headers: { 'Content-Type': 'application/json' } });
};
