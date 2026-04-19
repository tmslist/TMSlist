import type { APIRoute } from 'astro';
import { z } from 'zod';
import { eq, sql, and } from 'drizzle-orm';
import { db } from '../../../db';
import {
  users, clinics, bulkEmailCampaigns, bulkSmsCampaigns, auditLog
} from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const emailCampaignSchema = z.object({
  name: z.string().min(1).max(200),
  subject: z.string().min(1).max(500),
  body: z.string().min(1),
  targetType: z.enum(['clinic_owners', 'all_users', 'filtered']),
  filterCriteria: z.record(z.unknown()).optional(),
  preview: z.boolean().default(false),
});

const smsCampaignSchema = z.object({
  name: z.string().min(1).max(200),
  message: z.string().min(1).max(160),
  targetType: z.enum(['clinic_owners', 'all_users', 'filtered']),
  filterCriteria: z.record(z.unknown()).optional(),
  preview: z.boolean().default(false),
});

// GET: List campaigns
export const GET: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'admin')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const type = url.searchParams.get('type') || 'email';
    const limit = Math.max(1, Math.min(parseInt(url.searchParams.get('limit') || '20'), 100));
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0'));

    if (type === 'sms') {
      const data = await db.select().from(bulkSmsCampaigns)
        .orderBy(sql`${bulkSmsCampaigns.createdAt} DESC`).limit(limit).offset(offset);
      return json({ data });
    }

    const data = await db.select().from(bulkEmailCampaigns)
      .orderBy(sql`${bulkEmailCampaigns.createdAt} DESC`).limit(limit).offset(offset);
    return json({ data });
  } catch (err) {
    console.error('List campaigns error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// POST: Create and send campaign (email or SMS)
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'admin')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await request.json();
    const type = body.type || 'email';

    if (type === 'email') {
      const parsed = emailCampaignSchema.safeParse(body);
      if (!parsed.success) {
        return json({ error: 'Invalid payload', details: parsed.error.flatten() }, 400);
      }
      const { name, subject, body: emailBody, targetType, filterCriteria, preview } = parsed.data;

      const recipients = await resolveRecipients(targetType, filterCriteria as Record<string, unknown>);

      if (preview) {
        return json({
          preview: true,
          recipientCount: recipients.length,
          sample: recipients.slice(0, 3),
          subject,
          body: emailBody,
        });
      }

      const [campaign] = await db.insert(bulkEmailCampaigns).values({
        name,
        subject,
        body: emailBody,
        targetType,
        filterCriteria,
        status: 'sending',
        createdBy: session.userId,
      }).returning();

      // Send emails via Resend (deferred via await for synchronous send)
      try {
        const { sendBulkEmail } = await import('../../../utils/email');
        const sent = await sendBulkEmail({ recipients, subject, body: emailBody, campaignId: campaign.id });
        await db.update(bulkEmailCampaigns).set({
          status: sent ? 'sent' : 'failed',
          sentAt: sent ? new Date() : null,
          sentCount: sent ? recipients.length : 0,
        }).where(eq(bulkEmailCampaigns.id, campaign.id));
      } catch {
        await db.update(bulkEmailCampaigns).set({ status: 'failed' })
          .where(eq(bulkEmailCampaigns.id, campaign.id));
      }

      await db.insert(auditLog).values({
        userId: session.userId,
        action: 'create_email_campaign',
        entityType: 'bulk_email_campaign',
        entityId: campaign.id,
        details: { name, subject, targetType, recipientCount: recipients.length },
      });

      return json({ success: true, campaignId: campaign.id, recipientCount: recipients.length });

    } else if (type === 'sms') {
      const parsed = smsCampaignSchema.safeParse(body);
      if (!parsed.success) {
        return json({ error: 'Invalid payload', details: parsed.error.flatten() }, 400);
      }
      const { name, message, targetType, filterCriteria, preview } = parsed.data;

      const recipients = await resolveRecipients(targetType, filterCriteria as Record<string, unknown>);

      if (preview) {
        return json({
          preview: true,
          recipientCount: recipients.length,
          sample: recipients.slice(0, 3),
          message,
        });
      }

      const [campaign] = await db.insert(bulkSmsCampaigns).values({
        name,
        message,
        targetType,
        filterCriteria,
        status: 'sending',
        createdBy: session.userId,
      }).returning();

      try {
        const { sendBulkSms } = await import('../../../utils/sms');
        const sent = await sendBulkSms({ recipients, message, campaignId: campaign.id });
        await db.update(bulkSmsCampaigns).set({
          status: sent ? 'sent' : 'failed',
          sentAt: sent ? new Date() : null,
          sentCount: sent ? recipients.length : 0,
        }).where(eq(bulkSmsCampaigns.id, campaign.id));
      } catch {
        await db.update(bulkSmsCampaigns).set({ status: 'failed' })
          .where(eq(bulkSmsCampaigns.id, campaign.id));
      }

      await db.insert(auditLog).values({
        userId: session.userId,
        action: 'create_sms_campaign',
        entityType: 'bulk_sms_campaign',
        entityId: campaign.id,
        details: { name, targetType, recipientCount: recipients.length },
      });

      return json({ success: true, campaignId: campaign.id, recipientCount: recipients.length });
    }

    return json({ error: 'Invalid campaign type' }, 400);
  } catch (err) {
    console.error('Campaign error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// DELETE: Cancel/delete a campaign
export const DELETE: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'admin')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const id = url.searchParams.get('id');
    const type = url.searchParams.get('type') || 'email';
    if (!id) return json({ error: 'Campaign ID required' }, 400);

    if (type === 'sms') {
      await db.delete(bulkSmsCampaigns).where(eq(bulkSmsCampaigns.id, id));
    } else {
      await db.delete(bulkEmailCampaigns).where(eq(bulkEmailCampaigns.id, id));
    }
    return json({ success: true });
  } catch (err) {
    console.error('Delete campaign error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

async function resolveRecipients(
  targetType: string,
  filterCriteria?: Record<string, unknown>
): Promise<Array<{ email: string; name?: string | null; phone?: string }>> {
  if (targetType === 'clinic_owners') {
    const result = await db
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(eq(users.role, 'clinic_owner'));
    return result.filter((u: { email: string }) => u.email);
  }

  if (targetType === 'filtered' && filterCriteria) {
    const conditions = [];
    if (filterCriteria.state) conditions.push(sql`${clinics.state} = ${String(filterCriteria.state)}`);
    if (filterCriteria.city) conditions.push(sql`${clinics.city} = ${String(filterCriteria.city)}`);
    if (filterCriteria.country) conditions.push(sql`${clinics.country} = ${String(filterCriteria.country)}`);
    if (filterCriteria.verified === true) conditions.push(eq(clinics.verified, true));

    const result = await db
      .selectDistinct({ email: users.email, name: users.name })
      .from(users)
      .innerJoin(clinics, eq(users.clinicId, clinics.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    return result.filter((u: { email: string }) => u.email);
  }

  const result = await db
    .select({ email: users.email, name: users.name })
    .from(users)
    .where(sql`${users.email} IS NOT NULL`);
  return result.filter((u: { email: string }) => u.email);
}
