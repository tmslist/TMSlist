import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { subscriptions, users, clinics } from '../../../db/schema';
import { eq, and, gte, lte, isNull } from 'drizzle-orm';
import { sendTrialEndingReminder, sendPaymentMethodExpiring } from '../../../utils/billingEmails';
import { requireCronAuth } from '../../../utils/cronAuth';

export const prerender = false;

// ── Trial ending reminders ────────────────────────────────

async function sendTrialReminders() {
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const in8Days = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);

  // Get active subscriptions with trial ending in the next ~7 days
  const subs = await db.select({
    subscription: subscriptions,
    clinic: clinics,
  })
    .from(subscriptions)
    .innerJoin(clinics, eq(subscriptions.clinicId, clinics.id))
    .where(and(
      eq(subscriptions.status, 'active'),
    ))
    .limit(400);

  let sent = 0;
  for (const { subscription, clinic } of subs) {
    // Check if trial is ending in ~7 days
    // Stripe stores trial_end as Unix timestamp in subscription metadata
    // We use currentPeriodEnd as a proxy since trial_end isn't stored in our DB
    const periodEnd = subscription.currentPeriodEnd;
    if (!periodEnd) continue;

    const daysUntil = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Send reminder if trial ending in 6-8 days (to catch the 7-day mark)
    if (daysUntil >= 6 && daysUntil <= 8) {
      const ownerEmail = await getClinicOwnerEmail(subscription.clinicId);
      if (ownerEmail) {
        await sendTrialEndingReminder({
          to: ownerEmail,
          clinicName: clinic.name,
          plan: subscription.plan,
          trialEndDate: periodEnd,
          daysRemaining: daysUntil,
          billingPortalUrl: `${process.env.SITE_URL || 'https://tmslist.com'}/portal/billing`,
        }).catch(err => console.error('[cron] sendTrialEndingReminder failed:', err));
        sent++;
        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 100));
      }
    }
  }

  return sent;
}

async function getClinicOwnerEmail(clinicId: string): Promise<string | null> {
  const [user] = await db.select().from(users).where(eq(users.clinicId, clinicId)).limit(1);
  return user?.email || null;
}

// Note: Payment method expiry detection requires Stripe API calls
// to fetch subscription.default_payment_method.expires_at
// For now, this is a placeholder that can be expanded when needed
async function sendPaymentMethodReminders() {
  // This would require Stripe API calls to get payment method expiry dates
  // For now, return 0 - we can implement this when Stripe SDK is used
  // for full subscription management
  return 0;
}

export const GET: APIRoute = async ({ request }) => {
  // Verify cron auth
  const authResult = requireCronAuth(request);
  if (!authResult.authorized) {
    return new Response('Unauthorized', { status: 401 });
  }

  const now = new Date();
  const SITE_URL = import.meta.env.SITE_URL || process.env.SITE_URL || 'https://tmslist.com';

  // Check for offset parameter (for batch chaining)
  const url = new URL(request.url);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);
  const limit = 100;

  // Get pending subscriptions for reminder processing
  const subs = await db.select({
    subscription: subscriptions,
    clinic: clinics,
  })
    .from(subscriptions)
    .innerJoin(clinics, eq(subscriptions.clinicId, clinics.id))
    .where(eq(subscriptions.status, 'active'))
    .limit(limit)
    .offset(offset);

  let trialRemindersSent = 0;
  let paymentMethodRemindersSent = 0;

  for (const { subscription, clinic } of subs) {
    // Check for trial ending in 7 days
    const periodEnd = subscription.currentPeriodEnd;
    if (periodEnd) {
      const daysUntil = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntil >= 6 && daysUntil <= 8 && daysUntil > 0) {
        const ownerEmail = await getClinicOwnerEmail(subscription.clinicId);
        if (ownerEmail) {
          await sendTrialEndingReminder({
            to: ownerEmail,
            clinicName: clinic.name,
            plan: subscription.plan,
            trialEndDate: periodEnd,
            daysRemaining: daysUntil,
            billingPortalUrl: `${SITE_URL}/portal/billing`,
          }).catch(err => console.error('[cron] sendTrialEndingReminder failed:', err));
          trialRemindersSent++;
          await new Promise(r => setTimeout(r, 100));
        }
      }
    }
  }

  // Chain to next batch if there are more subscriptions
  if (subs.length === limit) {
    const nextOffset = offset + limit;
    // Fire and forget the next batch
    fetch(`${SITE_URL}/api/cron/payment-reminders?offset=${nextOffset}`, {
      headers: { 'Authorization': `Bearer ${authResult.token}` },
    }).catch(() => {});
  }

  return new Response(JSON.stringify({
    success: true,
    timestamp: now.toISOString(),
    trialRemindersSent,
    paymentMethodRemindersSent,
    processed: subs.length,
    nextOffset: subs.length === limit ? offset + limit : null,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};