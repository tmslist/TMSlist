import type { APIRoute } from 'astro';
import { sql, eq, desc, count, or } from 'drizzle-orm';
import { db } from '../../../db';
import { emailLogs, bulkEmailCampaigns } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

const guard = (request: Request) => {
  const s = getSessionFromRequest(request);
  return !s || !hasRole(s, 'admin', 'editor') ? json({ error: 'Unauthorized' }, 401) : null;
};

// GET /api/admin/email-stats
// Returns aggregate stats + campaign list + recent individual logs
export const GET: APIRoute = async ({ request }) => {
  const denied = guard(request); if (denied) return denied;

  const url = new URL(request.url);
  const campaignId = url.searchParams.get('campaignId') ?? undefined;

  try {
    // Aggregate totals from email_logs
    const [totalRow, deliveredRow, openedRow, clickedRow, bouncedRow, complainedRow] = await Promise.all([
      db.select({ val: sql<number>`count(*)` }).from(emailLogs),
      db.select({ val: sql<number>`count(*)` }).from(emailLogs).where(eq(emailLogs.status, 'delivered')),
      db.select({ val: sql<number>`count(*)` }).from(emailLogs).where(
        or(eq(emailLogs.status, 'opened'), eq(emailLogs.status, 'clicked'))
      ),
      db.select({ val: sql<number>`count(*)` }).from(emailLogs).where(eq(emailLogs.status, 'clicked')),
      db.select({ val: sql<number>`count(*)` }).from(emailLogs).where(eq(emailLogs.status, 'bounced')),
      db.select({ val: sql<number>`count(*)` }).from(emailLogs).where(eq(emailLogs.status, 'complained')),
    ]);

    const stats = {
      total: Number(totalRow[0]?.val ?? 0),
      delivered: Number(deliveredRow[0]?.val ?? 0),
      opened: Number(openedRow[0]?.val ?? 0),
      clicked: Number(clickedRow[0]?.val ?? 0),
      bounced: Number(bouncedRow[0]?.val ?? 0),
      complained: Number(complainedRow[0]?.val ?? 0),
      recentSends: Number(totalRow[0]?.val ?? 0),
    };

    if (campaignId) {
      const logs = await db.select().from(emailLogs)
        .where(eq(emailLogs.campaignId, campaignId))
        .orderBy(desc(emailLogs.sentAt))
        .limit(100);
      return json({ logs });
    }

    // Per-campaign stats via subqueries
    const campaigns = await db
      .select({
        id: bulkEmailCampaigns.id,
        name: bulkEmailCampaigns.name,
        subject: bulkEmailCampaigns.subject,
        status: bulkEmailCampaigns.status,
        sentCount: bulkEmailCampaigns.sentCount,
        failedCount: bulkEmailCampaigns.failedCount,
        scheduledAt: bulkEmailCampaigns.scheduledAt,
        sentAt: bulkEmailCampaigns.sentAt,
        createdAt: bulkEmailCampaigns.createdAt,
        sent: sql<number>`coalesce((select count(*) from email_logs el where el.campaign_id = ${bulkEmailCampaigns.id}), 0)`.as('sent'),
        openedCount: sql<number>`coalesce((select count(*) from email_logs el where el.campaign_id = ${bulkEmailCampaigns.id} and el.status in ('opened','clicked')), 0)`.as('opened'),
        clickedCount: sql<number>`coalesce((select count(*) from email_logs el where el.campaign_id = ${bulkEmailCampaigns.id} and el.status = 'clicked'), 0)`.as('clicked'),
        bouncedCount: sql<number>`coalesce((select count(*) from email_logs el where el.campaign_id = ${bulkEmailCampaigns.id} and el.status = 'bounced'), 0)`.as('bounced'),
      })
      .from(bulkEmailCampaigns)
      .orderBy(desc(bulkEmailCampaigns.createdAt))
      .limit(50);

    // Recent individual logs for the live log tab
    const recentLogs = await db.select().from(emailLogs)
      .orderBy(desc(emailLogs.sentAt))
      .limit(50);

    return json({ stats, campaigns, logs: recentLogs });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return json({ error: message }, 500);
  }
};

// POST /api/admin/email-stats
// Used to log a sent email or update an email_log status
export const POST: APIRoute = async ({ request }) => {
  const denied = guard(request); if (denied) return denied;

  try {
    const body = await request.json();

    if (body.action === 'log_sent') {
      const [log] = await db.insert(emailLogs).values({
        campaignId: body.campaignId ?? null,
        campaignName: body.campaignName ?? null,
        recipientEmail: body.recipientEmail ?? '',
        subject: body.subject ?? '',
        status: 'sent',
        sentAt: new Date(),
      }).returning();
      return json({ log }, 201);
    }

    if (body.id && body.status) {
      const updates: Record<string, unknown> = { status: body.status, updatedAt: new Date() };
      if (body.status === 'delivered') updates.deliveredAt = new Date();
      if (body.status === 'opened') updates.openedAt = new Date();
      if (body.status === 'clicked') updates.clickedAt = new Date();
      if (body.status === 'bounced') updates.bouncedAt = new Date();
      const [updated] = await db.update(emailLogs)
        .set(updates)
        .where(eq(emailLogs.id, body.id))
        .returning();
      return json({ log: updated });
    }

    return json({ error: 'action or id+status required' }, 400);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return json({ error: message }, 500);
  }
};

// DELETE /api/admin/email-stats?before=<ISO date>
// Clears logs older than the given date (admin only)
export const DELETE: APIRoute = async ({ request, url }) => {
  const denied = guard(request); if (denied) return denied;
  const before = url.searchParams.get('before');
  if (!before) return json({ error: 'before date required' }, 400);
  try {
    const beforeDate = new Date(before);
    if (isNaN(beforeDate.getTime())) return json({ error: 'invalid date' }, 400);
    const result = await db.delete(emailLogs).where(sql`${emailLogs.sentAt} < ${beforeDate}`);
    return json({ success: true, deleted: result.rowCount ?? 0 });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500);
  }
};