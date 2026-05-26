import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '../../../../db';
import { disasterRecoveryConfigs } from '../../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../../utils/auth.js';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

// Toggles failover status on a DR config. Actual cutover automation must be
// wired to your infra; this only records intent in the database.
export const POST: APIRoute = async ({ request }) => {
  const s = getSessionFromRequest(request);
  if (!s || !hasRole(s, 'admin')) return json({ error: 'Forbidden' }, 403);
  try {
    const body = await request.json().catch(() => ({}));
    const id = body.id;
    if (!id) return json({ error: 'id required' }, 400);
    const status = body.status || 'failover_active';
    const [row] = await db.update(disasterRecoveryConfigs).set({
      failoverStatus: status,
    }).where(eq(disasterRecoveryConfigs.id, id)).returning();
    return json({ data: row });
  } catch (err) { console.error('dr failover POST', err); return json({ error: 'Internal server error' }, 500); }
};
