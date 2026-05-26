import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '../../../../db';
import { disasterRecoveryConfigs } from '../../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../../utils/auth.js';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

// Marks a DR test as performed. Real failover orchestration is out of scope —
// this records the test event so the dashboard's "last test" surfaces correctly.
export const POST: APIRoute = async ({ request }) => {
  const s = getSessionFromRequest(request);
  if (!s || !hasRole(s, 'admin')) return json({ error: 'Forbidden' }, 403);
  try {
    const body = await request.json().catch(() => ({}));
    const id = body.id;
    if (!id) return json({ error: 'id required' }, 400);
    const result = body.result || 'pass';
    const [row] = await db.update(disasterRecoveryConfigs).set({
      lastDrTestAt: new Date(),
      lastDrTestResult: result,
    }).where(eq(disasterRecoveryConfigs.id, id)).returning();
    return json({ data: row });
  } catch (err) { console.error('dr test POST', err); return json({ error: 'Internal server error' }, 500); }
};
