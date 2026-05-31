import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { db } from '../../../db';
import { emailLogs } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

const RESEND_KEY = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;
const resend = RESEND_KEY ? new Resend(RESEND_KEY) : null;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

// POST /api/webhooks/resend — Resend email event webhooks
// Resend sends: delivered, bounced, complained, unsubscribed, open, click
export const POST: APIRoute = async ({ request }) => {
  if (request.headers.get('x-resend-signature')) {
    try {
      const body = await request.json();
      await handleResendWebhook(body);
      return json({ received: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[resend-webhook]', msg);
      return json({ error: msg }, 400);
    }
  }
  return json({ error: 'Unauthorized' }, 401);
};

async function handleResendWebhook(event: Record<string, unknown>) {
  const { type, data } = event as { type: string; data: Record<string, unknown> };

  const emailId = String(data.email_id ?? '');
  const recipientEmail = String(data.to ?? '').replace(/^[^<]*</, '').replace(/>$/, '');
  const subject = String(data.subject ?? '');
  const campaignId = String(data.metadata?.campaign_id ?? '') || null;

  switch (type) {
    case 'email.delivered':
      await db.update(emailLogs)
        .set({ status: 'delivered', deliveredAt: new Date() })
        .where(eq(emailLogs.recipientEmail, recipientEmail))
        .returning();
      break;

    case 'email.bounced':
      await db.update(emailLogs)
        .set({ status: 'bounced', bouncedAt: new Date(), errorMessage: String(data.bounce?.message ?? 'bounced') })
        .where(eq(emailLogs.recipientEmail, recipientEmail))
        .returning();
      break;

    case 'email.complained':
      await db.update(emailLogs)
        .set({ status: 'complained', complainedAt: new Date() })
        .where(eq(emailLogs.recipientEmail, recipientEmail))
        .returning();
      break;

    case 'email.opened':
      await db.update(emailLogs)
        .set({ status: 'opened', openedAt: new Date() })
        .where(eq(emailLogs.recipientEmail, recipientEmail))
        .returning();
      break;

    case 'email.clicked':
      await db.update(emailLogs)
        .set({ status: 'clicked', clickedAt: new Date() })
        .where(eq(emailLogs.recipientEmail, recipientEmail))
        .returning();
      break;

    case 'email.unsubscribed':
      await db.update(emailLogs)
        .set({ status: 'unsubscribed', unsubscribedAt: new Date() })
        .where(eq(emailLogs.recipientEmail, recipientEmail))
        .returning();
      break;

    default:
      console.log('[resend-webhook] unhandled event:', type);
  }
}