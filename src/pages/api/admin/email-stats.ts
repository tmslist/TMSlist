import type { APIRoute } from 'astro';
import { sql, eq, desc, count } from 'drizzle-orm';
import { db } from '../../../db';
import { emailLogs, bulkEmailCampaigns } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin', 'editor')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const url = new URL(request.url);
  const campaignId = url.searchParams.get('campaignId') ?? undefined;

  try {
    // Fetch stats — aggregate from email_logs table
    const [totalRow, deliveredRow, openedRow, clickedRow, bouncedRow, recentRow] = await Promise.all([
      db.select({ val: sql<number>`count(*)` }).from(emailLogs),
      db.select({ val: sql<number>`count(*)` }).from(emailLogs).where(eq(emailLogs.status, 'delivered')),
      db.select({ val: sql<number>`count(*)` }).from(emailLogs).where(eq(emailLogs.status, 'opened')),
      db.select({ val: sql<number>`count(*)` }).from(emailLogs).where(eq(emailLogs.status, 'clicked')),
      db.select({ val: sql<number>`count(*)` }).from(emailLogs).where(eq(emailLogs.status, 'bounced')),
      db.select({ val: sql<number>`count(*)` }).from(emailLogs),
    ]);

    if (campaignId) {
      const logs = await db.select().from(emailLogs)
        .where(eq(emailLogs.campaignId, campaignId))
        .orderBy(desc(emailLogs.sentAt))
        .limit(100);
      return json({ logs });
    }

    const stats = {
      total: Number(totalRow[0]?.val ?? 0),
      delivered: Number(deliveredRow[0]?.val ?? 0),
      opened: Number(openedRow[0]?.val ?? 0),
      clicked: Number(clickedRow[0]?.val ?? 0),
      bounced: Number(bouncedRow[0]?.val ?? 0),
      recentSends: Number(recentRow[0]?.val ?? 0),
    };

    const campaigns = await db.select().from(bulkEmailCampaigns)
      .orderBy(desc(bulkEmailCampaigns.createdAt))
      .limit(50);

    return json({ stats, campaigns });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return json({ error: message }, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin', 'editor')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await request.json();

    if (body.action === 'log_sent') {
      const [log] = await db.insert(emailLogs).values({
        campaignId: body.campaignId ?? null,
        recipientEmail: body.recipientEmail ?? '',
        subject: body.subject ?? '',
        status: 'sent',
        sentAt: new Date(),
      }).returning();
      return json({ log }, 201);
    }

    if (body.id && body.status) {
      const [updated] = await db.update(emailLogs)
        .set({ status: body.status, updatedAt: new Date() })
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
