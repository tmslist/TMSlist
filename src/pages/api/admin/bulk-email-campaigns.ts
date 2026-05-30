import type { APIRoute } from 'astro';
import { getSessionFromRequest } from '../../../utils/auth';
import { db } from '../../../db';
import { bulkEmailCampaigns, users } from '../../../db/schema';
import { eq, desc, count, and } from 'drizzle-orm';

export const prerender = false;

type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'paused';

// GET /api/admin/bulk-email-campaigns - List all campaigns
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  if (session.role !== 'admin' && session.role !== 'editor') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') as CampaignStatus | null;
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10) || 50));
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10) || 0);

    const conditions = [];
    if (status) conditions.push(eq(bulkEmailCampaigns.status, status as any));

    const [rows, [{ total }]] = await Promise.all([
      db.select({
        id: bulkEmailCampaigns.id,
        name: bulkEmailCampaigns.name,
        subject: bulkEmailCampaigns.subject,
        body: bulkEmailCampaigns.body,
        status: bulkEmailCampaigns.status,
        sentCount: bulkEmailCampaigns.sentCount,
        failedCount: bulkEmailCampaigns.failedCount,
        scheduledAt: bulkEmailCampaigns.scheduledAt,
        sentAt: bulkEmailCampaigns.sentAt,
        createdBy: bulkEmailCampaigns.createdBy,
        createdAt: bulkEmailCampaigns.createdAt,
      })
        .from(bulkEmailCampaigns)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(bulkEmailCampaigns.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(bulkEmailCampaigns),
    ]);

    // Fetch creator names
    const creatorIds = [...new Set(rows.map(r => r.createdBy).filter(Boolean))];
    const creators = creatorIds.length > 0
      ? await db.select({ id: users.id, name: users.name }).from(users).where(
          eq(users.id, creatorIds[0] as any)
        )
      : [];

    const creatorMap: Record<string, string> = {};
    for (const c of creators) {
      if (c.id && c.name) creatorMap[c.id] = c.name;
    }

    const campaigns = rows.map(r => ({
      ...r,
      createdByName: r.createdBy ? creatorMap[r.createdBy] ?? null : null,
    }));

    return new Response(JSON.stringify({ campaigns, total, limit, offset }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Bulk email campaigns list error:', err);
    return new Response(JSON.stringify({ error: 'Failed to load campaigns' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

// POST /api/admin/bulk-email-campaigns - Create a new campaign
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  if (session.role !== 'admin' && session.role !== 'editor') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const body = await request.json();
    const { name, subject, body: emailBody, scheduledAt } = body;

    if (!name || !subject || !emailBody) {
      return new Response(JSON.stringify({ error: 'name, subject, and body are required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const status: CampaignStatus = scheduledAt ? 'scheduled' : 'draft';

    const [campaign] = await db.insert(bulkEmailCampaigns).values({
      name,
      subject,
      body: emailBody,
      status,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      createdBy: session.userId,
    }).returning();

    return new Response(JSON.stringify({ campaign }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Bulk email campaign create error:', err);
    return new Response(JSON.stringify({ error: 'Failed to create campaign' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

// GET /api/admin/bulk-email-campaigns/:id - Get single campaign
export const GET_CAMPAIGN: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  if (session.role !== 'admin' && session.role !== 'editor') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const campaignId = pathParts[pathParts.length - 1];

    const [campaign] = await db.select().from(bulkEmailCampaigns).where(eq(bulkEmailCampaigns.id, campaignId)).limit(1);
    if (!campaign) {
      return new Response(JSON.stringify({ error: 'Campaign not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ campaign }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Bulk email campaign get error:', err);
    return new Response(JSON.stringify({ error: 'Failed to load campaign' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

// PUT /api/admin/bulk-email-campaigns/:id - Update campaign
export const PUT_CAMPAIGN: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  if (session.role !== 'admin' && session.role !== 'editor') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const campaignId = pathParts[pathParts.length - 1];

    const body = await request.json();
    const { name, subject, body: emailBody, status, scheduledAt } = body;

    const validStatuses: CampaignStatus[] = ['draft', 'scheduled', 'sending', 'sent', 'failed', 'paused'];
    if (status && !validStatuses.includes(status)) {
      return new Response(JSON.stringify({ error: 'Invalid status' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Can only update non-sent campaigns
    const [existing] = await db.select({ status: bulkEmailCampaigns.status }).from(bulkEmailCampaigns).where(eq(bulkEmailCampaigns.id, campaignId)).limit(1);
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Campaign not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }
    if (existing.status === 'sent') {
      return new Response(JSON.stringify({ error: 'Cannot update a sent campaign' }), { status: 409, headers: { 'Content-Type': 'application/json' } });
    }

    const updates: Record<string, unknown> = {};
    if (name) updates.name = name;
    if (subject) updates.subject = subject;
    if (emailBody) updates.body = emailBody;
    if (status) updates.status = status;
    if (scheduledAt !== undefined) updates.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;

    const [updated] = await db.update(bulkEmailCampaigns)
      .set(updates as any)
      .where(eq(bulkEmailCampaigns.id, campaignId))
      .returning();

    return new Response(JSON.stringify({ campaign: updated }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Bulk email campaign update error:', err);
    return new Response(JSON.stringify({ error: 'Failed to update campaign' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

// DELETE /api/admin/bulk-email-campaigns/:id - Delete campaign
export const DELETE_CAMPAIGN: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: 'application/json' } });
  }
  if (session.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const campaignId = pathParts[pathParts.length - 1];

    const [existing] = await db.select({ status: bulkEmailCampaigns.status }).from(bulkEmailCampaigns).where(eq(bulkEmailCampaigns.id, campaignId)).limit(1);
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Campaign not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }
    if (existing.status === 'sent' || existing.status === 'sending') {
      return new Response(JSON.stringify({ error: 'Cannot delete a campaign that is sending or has been sent' }), { status: 409, headers: { 'Content-Type': 'application/json' } });
    }

    await db.delete(bulkEmailCampaigns).where(eq(bulkEmailCampaigns.id, campaignId));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Bulk email campaign delete error:', err);
    return new Response(JSON.stringify({ error: 'Failed to delete campaign' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

// POST /api/admin/bulk-email-campaigns/:id/send - Trigger sending (mock implementation)
export const POST_SEND: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  if (session.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const campaignId = pathParts[pathParts.length - 2];

    const [campaign] = await db.select().from(bulkEmailCampaigns).where(eq(bulkEmailCampaigns.id, campaignId)).limit(1);
    if (!campaign) {
      return new Response(JSON.stringify({ error: 'Campaign not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    if (campaign.status === 'sent' || campaign.status === 'sending') {
      return new Response(JSON.stringify({ error: 'Campaign already sent or in progress' }), { status: 409, headers: { 'Content-Type': 'application/json' } });
    }

    // Mark as sending immediately, actual sending would be handled by a background job
    const [updated] = await db.update(bulkEmailCampaigns)
      .set({ status: 'sending' as any })
      .where(eq(bulkEmailCampaigns.id, campaignId))
      .returning();

    return new Response(JSON.stringify({
      campaign: updated,
      message: 'Campaign send triggered. Actual delivery is handled by a background job.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Bulk email campaign send error:', err);
    return new Response(JSON.stringify({ error: 'Failed to trigger campaign send' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};