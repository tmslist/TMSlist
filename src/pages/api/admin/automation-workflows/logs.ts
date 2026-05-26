import type { APIRoute } from 'astro';
import { desc, eq } from 'drizzle-orm';
import { db } from '../../../../db';
import { automationWorkflowLogs } from '../../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../../utils/auth.js';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export const GET: APIRoute = async ({ request, url }) => {
  const s = getSessionFromRequest(request);
  if (!s || !hasRole(s, 'admin')) return json({ error: 'Forbidden' }, 403);
  try {
    const workflowId = url.searchParams.get('workflowId');
    const query = workflowId
      ? db.select().from(automationWorkflowLogs).where(eq(automationWorkflowLogs.workflowId, workflowId))
      : db.select().from(automationWorkflowLogs);
    const rows = await query.orderBy(desc(automationWorkflowLogs.createdAt)).limit(200);
    return json({ data: rows });
  } catch (err) { console.error('automation-workflows/logs GET', err); return json({ error: 'Internal server error' }, 500); }
};
