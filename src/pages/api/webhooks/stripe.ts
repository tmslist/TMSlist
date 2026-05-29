import type { APIRoute } from 'astro';
import { verifyWebhookSignature } from '../../../utils/stripe';
import {
  sendSubscriptionActivated,
  sendTrialEndingReminder,
  sendTrialConverted,
  sendPaymentFailed,
  sendSubscriptionRecovered,
  sendSubscriptionCanceled,
  sendPlanUpgraded,
  sendPaymentSucceeded,
} from '../../../utils/billingEmails';
import { eq } from 'drizzle-orm';
import { db } from '../../../db';
import { clinics, subscriptions, auditLog, users } from '../../../db/schema';
import { PLANS } from '../../../db/subscriptions';

export const prerender = false;

const WEBHOOK_SECRET = import.meta.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET;
const SITE_URL = import.meta.env.SITE_URL || process.env.SITE_URL || 'https://tmslist.com';

// Helper to get clinic owner email
async function getClinicOwnerEmail(clinicId: string): Promise<string | null> {
  const [user] = await db.select().from(users).where(eq(users.clinicId, clinicId)).limit(1);
  return user?.email || null;
}

async function sendBillingEmail(clinicId: string, sendFn: (email: string) => Promise<void>) {
  const email = await getClinicOwnerEmail(clinicId);
  if (email) {
    await sendFn(email).catch(err => console.error('[billing-email] Failed to send:', err));
  }
}

export const POST: APIRoute = async ({ request }) => {
  if (!WEBHOOK_SECRET) {
    return new Response('Webhook not configured', { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature') || '';

  let event;
  try {
    event = verifyWebhookSignature(body, signature, WEBHOOK_SECRET);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err);
    return new Response('Invalid signature', { status: 400 });
  }

  try {
    switch (event.type) {
      // ── CHECKOUT COMPLETED (new subscription) ──────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const clinicId = session.metadata?.clinicId;
        const type = session.metadata?.type;
        const plan = session.metadata?.plan;

        if (clinicId && plan && ['pro', 'premium', 'enterprise'].includes(plan)) {
          const planEnum = plan as 'pro' | 'premium' | 'enterprise';

          // Get trial end from subscription if available
          let trialEndAt: Date | undefined;
          if (session.subscription) {
            const subData = event.data.object as any;
            trialEndAt = subData.trial_end ? new Date(subData.trial_end * 1000) : undefined;
          }

          await db.insert(subscriptions).values({
            clinicId,
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
            plan: planEnum,
            status: 'active',
            billingCurrency: 'usd',
            currentPeriodEnd: session.subscription_details?.billing_cycle_anchor
              ? new Date(session.subscription_details.billing_cycle_anchor * 1000)
              : undefined,
          }).onConflictDoUpdate({
            target: subscriptions.stripeSubscriptionId,
            set: {
              status: 'active',
              plan: planEnum,
              clinicId,
            },
          });

          await db.insert(auditLog).values({
            action: 'subscription_activated',
            entityType: 'clinic',
            entityId: clinicId,
            details: { stripeSessionId: session.id, subscriptionId: session.subscription, plan },
          });

          // Send welcome email
          const ownerEmail = await getClinicOwnerEmail(clinicId);
          const clinicName = session.metadata?.clinicName || 'Your clinic';
          const trialDays = trialEndAt ? Math.ceil((trialEndAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : undefined;

          if (ownerEmail) {
            sendSubscriptionActivated({
              to: ownerEmail,
              clinicName,
              plan,
              trialEndDays: trialDays,
              billingPortalUrl: `${SITE_URL}/portal/billing`,
            }).catch(err => console.error('[billing-email] sendSubscriptionActivated failed:', err));
          }
        }

        if (clinicId && type === 'featured_listing') {
          await db.update(clinics)
            .set({ isFeatured: true, updatedAt: new Date() })
            .where(eq(clinics.id, clinicId));

          await db.insert(auditLog).values({
            action: 'featured_listing_activated',
            entityType: 'clinic',
            entityId: clinicId,
            details: { stripeSessionId: session.id, subscriptionId: session.subscription },
          });
        }

        if (clinicId && type === 'verified_badge') {
          await db.update(clinics)
            .set({ verified: true, updatedAt: new Date() })
            .where(eq(clinics.id, clinicId));

          await db.insert(auditLog).values({
            action: 'verified_badge_purchased',
            entityType: 'clinic',
            entityId: clinicId,
            details: { stripeSessionId: session.id },
          });
        }
        break;
      }

      // ── TRIAL WILL END (7 days before) ────────────────────────
      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as any;
        const clinicId = subscription.metadata?.clinicId;
        const plan = subscription.metadata?.plan;
        const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;

        if (clinicId && plan && trialEnd) {
          const ownerEmail = await getClinicOwnerEmail(clinicId);
          if (ownerEmail) {
            const [clinic] = await db.select().from(clinics).where(eq(clinics.id, clinicId)).limit(1);
            sendTrialEndingReminder({
              to: ownerEmail,
              clinicName: clinic?.name || 'Your clinic',
              plan,
              trialEndDate: trialEnd,
              daysRemaining: 7,
              billingPortalUrl: `${SITE_URL}/portal/billing`,
            }).catch(err => console.error('[billing-email] sendTrialEndingReminder failed:', err));
          }
        }
        break;
      }

      // ── SUBSCRIPTION DELETED (canceled) ───────────────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const clinicId = subscription.metadata?.clinicId;
        const plan = subscription.metadata?.plan;

        if (clinicId) {
          await db.update(clinics)
            .set({ isFeatured: false, updatedAt: new Date() })
            .where(eq(clinics.id, clinicId));
        }

        if (subscription.id) {
          await db.update(subscriptions)
            .set({ status: 'canceled' })
            .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
        }

        // Send cancellation email
        if (clinicId && plan) {
          const ownerEmail = await getClinicOwnerEmail(clinicId);
          if (ownerEmail) {
            const [clinic] = await db.select().from(clinics).where(eq(clinics.id, clinicId)).limit(1);
            const effectiveDate = subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000)
              : new Date();

            sendSubscriptionCanceled({
              to: ownerEmail,
              clinicName: clinic?.name || 'Your clinic',
              plan,
              effectiveDate,
              featuresLost: PLANS[plan]?.marketingFeatures || [],
            }).catch(err => console.error('[billing-email] sendSubscriptionCanceled failed:', err));
          }
        }
        break;
      }

      // ── SUBSCRIPTION UPDATED (status changes, plan changes) ────
      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const clinicId = subscription.metadata?.clinicId;
        const plan = subscription.metadata?.plan;
        const previousPlanAttr = subscription.items?.data?.[0]?.price?.id;

        // Get current subscription to compare status
        const currentSub = await db.select().from(subscriptions)
          .where(eq(subscriptions.stripeSubscriptionId, subscription.id))
          .limit(1);

        const previousStatus = currentSub[0]?.status;
        const newStatus = subscription.status === 'active' ? 'active'
          : subscription.status === 'past_due' ? 'past_due'
          : subscription.status === 'canceled' ? 'canceled' : 'active';

        const updates: Record<string, unknown> = {
          status: newStatus,
          currentPeriodEnd: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000)
            : undefined,
        };

        // Update plan if changed
        if (plan && plan !== currentSub[0]?.plan) {
          updates.plan = plan;
        }

        await db.update(subscriptions)
          .set(updates as any)
          .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

        // Email: past_due → active (recovered)
        if (previousStatus === 'past_due' && newStatus === 'active' && clinicId) {
          const ownerEmail = await getClinicOwnerEmail(clinicId);
          if (ownerEmail) {
            const [clinic] = await db.select().from(clinics).where(eq(clinics.id, clinicId)).limit(1);
            sendSubscriptionRecovered({
              to: ownerEmail,
              clinicName: clinic?.name || 'Your clinic',
              plan: plan || currentSub[0]?.plan || 'pro',
              nextBillingDate: subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000)
                : new Date(),
            }).catch(err => console.error('[billing-email] sendSubscriptionRecovered failed:', err));
          }
        }

        // Email: plan upgraded (detect via price change in items)
        // Note: full plan change detection requires comparing old vs new price
        break;
      }

      // ── INVOICE PAYMENT FAILED ──────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription;
        const amountDue = invoice.amount_due;
        const currency = invoice.currency;
        const failureMessage = invoice.last_payment_error?.message;

        // Find clinic by subscription ID
        const [sub] = await db.select().from(subscriptions)
          .where(eq(subscriptions.stripeSubscriptionId, subscriptionId))
          .limit(1);

        if (sub) {
          const ownerEmail = await getClinicOwnerEmail(sub.clinicId);
          if (ownerEmail) {
            const [clinic] = await db.select().from(clinics).where(eq(clinics.id, sub.clinicId)).limit(1);
            sendPaymentFailed({
              to: ownerEmail,
              clinicName: clinic?.name || 'Your clinic',
              plan: sub.plan || 'pro',
              failureMessage,
              amount: amountDue,
              currency,
              billingPortalUrl: `${SITE_URL}/portal/billing`,
            }).catch(err => console.error('[billing-email] sendPaymentFailed failed:', err));
          }
        }
        break;
      }

      // ── INVOICE PAYMENT SUCCEEDED (recurring billing) ───────────
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription;
        const amountPaid = invoice.amount_paid;
        const currency = invoice.currency;

        // Only send for actual charges (not trial conversions which go through checkout)
        if (invoice.billing_reason === 'subscription_cycle' || invoice.billing_reason === 'subscription_update') {
          const [sub] = await db.select().from(subscriptions)
            .where(eq(subscriptions.stripeSubscriptionId, subscriptionId))
            .limit(1);

          if (sub) {
            const ownerEmail = await getClinicOwnerEmail(sub.clinicId);
            if (ownerEmail) {
              const [clinic] = await db.select().from(clinics).where(eq(clinics.id, sub.clinicId)).limit(1);
              const periodStart = invoice.period_start ? new Date(invoice.period_start * 1000) : new Date();
              const periodEnd = invoice.period_end ? new Date(invoice.period_end * 1000) : new Date();
              const nextBilling = sub.currentPeriodEnd || new Date();

              sendPaymentSucceeded({
                to: ownerEmail,
                clinicName: clinic?.name || 'Your clinic',
                plan: sub.plan || 'pro',
                amount: amountPaid,
                currency,
                periodStart,
                periodEnd,
                nextBillingDate: nextBilling,
                invoiceUrl: invoice.hosted_invoice_url || undefined,
              }).catch(err => console.error('[billing-email] sendPaymentSucceeded failed:', err));
            }
          }
        }
        break;
      }
    }
  } catch (err) {
    console.error('Stripe webhook processing error:', err);
    return new Response('Webhook processing failed', { status: 500 });
  }

  return new Response('ok', { status: 200 });
};
