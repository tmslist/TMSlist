import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { subscriptions, auditLog, clinics, users } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { verifyRazorpayWebhookSignature } from '../../../utils/razorpay';
import {
  sendSubscriptionActivated,
  sendPaymentFailed,
  sendSubscriptionCanceled,
  sendPaymentSucceeded,
} from '../../../utils/billingEmails';
import { PLANS } from '../../../db/subscriptions';

export const prerender = false;

const SITE_URL = import.meta.env.SITE_URL || process.env.SITE_URL || 'https://tmslist.com';

async function getClinicOwnerEmail(clinicId: string): Promise<string | null> {
  const [user] = await db.select().from(users).where(eq(users.clinicId, clinicId)).limit(1);
  return user?.email || null;
}

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
        const razorpayPlanId = entity.plan_id as string;

        if (!clinicId) break;

        const planMap: Record<string, string> = {
          'pro': 'pro',
          'premium': 'premium',
          'enterprise': 'enterprise',
        };
        const plan = razorpayPlanId
          ? (planMap[razorpayPlanId] ?? (razorpayPlanId.toLowerCase().includes('premium') ? 'premium' : razorpayPlanId.toLowerCase().includes('enterprise') ? 'enterprise' : 'pro'))
          : 'pro';

        await db.insert(subscriptions).values({
          clinicId,
          razorpaySubscriptionId: razorpaySubId,
          plan: plan as 'pro' | 'premium' | 'enterprise',
          status: 'active',
          billingCurrency: 'inr',
          currentPeriodEnd: new Date(entity.current_end * 1000),
        }).onConflictDoUpdate({
          target: subscriptions.razorpaySubscriptionId,
          set: {
            status: 'active',
            plan: plan as 'pro' | 'premium' | 'enterprise',
            currentPeriodEnd: new Date(entity.current_end * 1000),
          },
        });

        await db.insert(auditLog).values({
          action: 'razorpay_subscription_activated',
          entityType: 'subscription',
          entityId: razorpaySubId,
          details: { clinicId, plan },
        });

        // Send welcome email
        const ownerEmail = await getClinicOwnerEmail(clinicId);
        if (ownerEmail) {
          const [clinic] = await db.select().from(clinics).where(eq(clinics.id, clinicId)).limit(1);
          const trialEnd = entity.trial_end ? new Date(entity.trial_end * 1000) : null;
          const trialDays = trialEnd ? Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : undefined;

          sendSubscriptionActivated({
            to: ownerEmail,
            clinicName: clinic?.name || 'Your clinic',
            plan,
            trialEndDays: trialDays,
            billingPortalUrl: `${SITE_URL}/portal/billing`,
          }).catch(err => console.error('[billing-email] razorpay sendSubscriptionActivated failed:', err));
        }

        break;
      }

      case 'subscription.charged': {
        const razorpaySubId = entity.id as string;
        const nextBilling = entity.current_end
          ? new Date(entity.current_end * 1000)
          : null;
        const amount = entity.amount || 0;

        // Get subscription details for email
        const [sub] = await db.select().from(subscriptions)
          .where(eq(subscriptions.razorpaySubscriptionId, razorpaySubId))
          .limit(1);

        await db.update(subscriptions)
          .set({ currentPeriodEnd: nextBilling, status: 'active' })
          .where(eq(subscriptions.razorpaySubscriptionId, razorpaySubId));

        await db.insert(auditLog).values({
          action: 'razorpay_subscription_charged',
          entityType: 'subscription',
          entityId: razorpaySubId,
          details: { amount: amount / 100, nextBilling },
        });

        // Send payment receipt
        if (sub && sub.clinicId) {
          const ownerEmail = await getClinicOwnerEmail(sub.clinicId);
          if (ownerEmail) {
            const [clinic] = await db.select().from(clinics).where(eq(clinics.id, sub.clinicId)).limit(1);
            const now = new Date();

            sendPaymentSucceeded({
              to: ownerEmail,
              clinicName: clinic?.name || 'Your clinic',
              plan: sub.plan || 'pro',
              amount,
              currency: 'inr',
              periodStart: sub.currentPeriodEnd || now,
              periodEnd: now,
              nextBillingDate: nextBilling || now,
            }).catch(err => console.error('[billing-email] razorpay sendPaymentSucceeded failed:', err));
          }
        }

        break;
      }

      case 'subscription.cancelled': {
        const razorpaySubId = entity.id as string;

        // Get subscription for email before canceling
        const [sub] = await db.select().from(subscriptions)
          .where(eq(subscriptions.razorpaySubscriptionId, razorpaySubId))
          .limit(1);

        await db.update(subscriptions)
          .set({ status: 'canceled' })
          .where(eq(subscriptions.razorpaySubscriptionId, razorpaySubId));

        await db.insert(auditLog).values({
          action: 'razorpay_subscription_canceled',
          entityType: 'subscription',
          entityId: razorpaySubId,
          details: { canceledAt: new Date().toISOString() },
        });

        // Send cancellation email
        if (sub && sub.clinicId) {
          const ownerEmail = await getClinicOwnerEmail(sub.clinicId);
          if (ownerEmail) {
            const [clinic] = await db.select().from(clinics).where(eq(clinics.id, sub.clinicId)).limit(1);
            const effectiveDate = entity.current_end
              ? new Date(entity.current_end * 1000)
              : new Date();

            sendSubscriptionCanceled({
              to: ownerEmail,
              clinicName: clinic?.name || 'Your clinic',
              plan: sub.plan || 'pro',
              effectiveDate,
              featuresLost: PLANS[sub.plan as keyof typeof PLANS]?.marketingFeatures || [],
            }).catch(err => console.error('[billing-email] razorpay sendSubscriptionCanceled failed:', err));
          }
        }

        break;
      }

      case 'subscription.paused': {
        const razorpaySubId = entity.id as string;

        await db.update(subscriptions)
          .set({ status: 'past_due' })
          .where(eq(subscriptions.razorpaySubscriptionId, razorpaySubId));

        break;
      }

      case 'payment.failed': {
        const razorpaySubId = entity.subscription_id as string;
        const failureMessage = entity.error_description || entity.error_reason || 'Payment failed';

        // Get subscription for email
        const [sub] = await db.select().from(subscriptions)
          .where(eq(subscriptions.razorpaySubscriptionId, razorpaySubId))
          .limit(1);

        await db.insert(auditLog).values({
          action: 'razorpay_payment_failed',
          entityType: 'subscription',
          entityId: razorpaySubId,
          details: { error: failureMessage, amount: entity.amount / 100 },
        });

        // Send payment failed email
        if (sub && sub.clinicId) {
          const ownerEmail = await getClinicOwnerEmail(sub.clinicId);
          if (ownerEmail) {
            const [clinic] = await db.select().from(clinics).where(eq(clinics.id, sub.clinicId)).limit(1);

            sendPaymentFailed({
              to: ownerEmail,
              clinicName: clinic?.name || 'Your clinic',
              plan: sub.plan || 'pro',
              failureMessage,
              amount: entity.amount,
              currency: 'inr',
              billingPortalUrl: `${SITE_URL}/portal/billing`,
            }).catch(err => console.error('[billing-email] razorpay sendPaymentFailed failed:', err));
          }
        }

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