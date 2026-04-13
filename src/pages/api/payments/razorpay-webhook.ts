import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { subscriptions, auditLog } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { verifyRazorpayWebhookSignature } from '../../../utils/razorpay';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const WEBHOOK_SECRET = import.meta.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    return new Response('Razorpay webhook not configured', { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get('x-razorpay-signature') || '';

  if (!verifyRazorpayWebhookSignature(body, signature, WEBHOOK_SECRET)) {
    return new Response('Invalid signature', { status: 400 });
  }

  let payload: any;
  try {
    payload = JSON.parse(body);
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const event = payload.event;
  const entity = payload.payload?.subscription?.entity || {};

  try {
    switch (event) {
      case 'subscription.activated': {
        const razorpaySubId = entity.id as string;
        const clinicId = entity.metadata?.clinic_id as string;
        const plan = entity.plan_id as string;

        if (!clinicId) break;

        await db.insert(subscriptions).values({
          clinicId,
          razorpaySubscriptionId: razorpaySubId,
          plan: 'pro',
          status: 'active',
          billingCurrency: 'inr',
          currentPeriodEnd: new Date(entity.current_end * 1000),
        }).onConflictDoUpdate({
          target: subscriptions.razorpaySubscriptionId,
          set: {
            status: 'active',
            plan: 'pro',
            currentPeriodEnd: new Date(entity.current_end * 1000),
          },
        });

        await db.insert(auditLog).values({
          action: 'razorpay_subscription_activated',
          entityType: 'subscription',
          entityId: razorpaySubId,
          details: { clinicId, plan },
        });

        break;
      }

      case 'subscription.charged': {
        const razorpaySubId = entity.id as string;
        const nextBilling = entity.current_end
          ? new Date(entity.current_end * 1000)
          : null;

        await db.update(subscriptions)
          .set({ currentPeriodEnd: nextBilling, status: 'active' })
          .where(eq(subscriptions.razorpaySubscriptionId, razorpaySubId));

        await db.insert(auditLog).values({
          action: 'razorpay_subscription_charged',
          entityType: 'subscription',
          entityId: razorpaySubId,
          details: { amount: entity.amount / 100, nextBilling },
        });

        break;
      }

      case 'subscription.cancelled': {
        const razorpaySubId = entity.id as string;

        await db.update(subscriptions)
          .set({ status: 'canceled' })
          .where(eq(subscriptions.razorpaySubscriptionId, razorpaySubId));

        await db.insert(auditLog).values({
          action: 'razorpay_subscription_canceled',
          entityType: 'subscription',
          entityId: razorpaySubId,
          details: { canceledAt: new Date().toISOString() },
        });

        break;
      }

      case 'subscription.paused': {
        const razorpaySubId = entity.id as string;

        await db.update(subscriptions)
          .set({ status: 'past_due' })
          .where(eq(subscriptions.razorpaySubscriptionId, razorpaySubId));

        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error('Razorpay webhook error:', err);
    return new Response('Webhook processing failed', { status: 500 });
  }

  return new Response('ok', { status: 200 });
};