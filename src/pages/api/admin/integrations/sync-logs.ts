import type { APIRoute } from 'astro';
import { desc, eq } from 'drizzle-orm';
import { db } from '../../../../db';
import { integrationSyncLogs } from '../../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../../utils/auth.js';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export const GET: APIRoute = async ({ request, url }) => {
  const s = getSessionFromRequest(request);
  if (!s || !hasRole(s, 'admin')) return json({ error: 'Forbidden' }, 403);
  try {
    const integrationId = url.searchParams.get('integrationId');
    const query = integrationId
      ? db.select().from(integrationSyncLogs).where(eq(integrationSyncLogs.integrationId, integrationId))
      : db.select().from(integrationSyncLogs);
    const rows = await query.orderBy(desc(integrationSyncLogs.createdAt)).limit(200);
    return json({ data: rows });
  } catch (err) { console.error('integrations/sync-logs GET', err); return json({ error: 'Internal server error' }, 500); }
};
