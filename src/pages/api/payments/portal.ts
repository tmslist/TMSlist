import type { APIRoute } from 'astro';
import { validateSessionStrict, hasRole } from '../../../utils/auth';
import { getClinicSubscription, getClinicPlan, PLANS } from '../../../db/subscriptions';
import { cancelRazorpaySubscription } from '../../../utils/razorpay';
import { cancelSubscription } from '../../../utils/stripe';
import { db } from '../../../db';
import { subscriptions, users } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const session = await validateSessionStrict(request);
  if (!session || !hasRole(session, 'clinic_owner', 'admin')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const userRows = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  const clinicId = userRows[0]?.clinicId || session.clinicId;
  if (!clinicId) {
    return new Response(JSON.stringify({ error: 'Clinic not associated with user' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const subscription = await getClinicSubscription(clinicId);
  const plan = await getClinicPlan(clinicId);
  const features = PLANS[plan].features;

  return new Response(JSON.stringify({
    plan,
    status: subscription?.status || null,
    currency: subscription?.billingCurrency || 'usd',
    currentPeriodEnd: subscription?.currentPeriodEnd || null,
    stripeSubscriptionId: subscription?.stripeSubscriptionId || null,
    razorpaySubscriptionId: subscription?.razorpaySubscriptionId || null,
    features,
    planDetails: PLANS[plan],
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};

export const PUT: APIRoute = async ({ request }) => {
  const session = await validateSessionStrict(request);
  if (!session || !hasRole(session, 'clinic_owner', 'admin')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const userRows = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  const clinicId = userRows[0]?.clinicId || session.clinicId;
  if (!clinicId) {
    return new Response(JSON.stringify({ error: 'Clinic not associated with user' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  let body: { action: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  if (body.action === 'cancel') {
    const sub = await getClinicSubscription(clinicId);
    if (!sub) {
      return new Response(JSON.stringify({ error: 'No active subscription' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // B-1: Idempotency guard - check if already canceling or canceled
    if (sub.status === 'canceling' || sub.status === 'canceled') {
      return new Response(JSON.stringify({
        success: true,
        status: sub.status,
        message: 'Subscription is already being canceled or has been canceled'
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // B-1: Set intermediate "canceling" state BEFORE making provider calls
    await db.update(subscriptions)
      .set({ status: 'canceling' })
      .where(eq(subscriptions.clinicId, clinicId));

    // Cancel at provider(s) and track each result
    const results: { razorpay?: string; stripe?: string } = {};
    let overallSuccess = true;

    if (sub.razorpaySubscriptionId) {
      try {
        await cancelRazorpaySubscription(sub.razorpaySubscriptionId);
        results.razorpay = 'canceled';
      } catch (err) {
        console.error('[payments] Razorpay cancel failed:', err);
        results.razorpay = 'failed';
        overallSuccess = false;
      }
      // B-2: Track partial cancellation state after each provider call
      await db.update(subscriptions)
        .set({ status: overallSuccess ? 'canceled' : 'partially_canceled' })
        .where(eq(subscriptions.clinicId, clinicId));
    }

    if (sub.stripeSubscriptionId) {
      try {
        await cancelSubscription(sub.stripeSubscriptionId);
        results.stripe = 'canceled';
      } catch (err) {
        console.error('[payments] Stripe cancel failed:', err);
        results.stripe = 'failed';
        overallSuccess = false;
      }
      // B-2: Track partial cancellation state after each provider call
      await db.update(subscriptions)
        .set({ status: overallSuccess ? 'canceled' : 'partially_canceled' })
        .where(eq(subscriptions.clinicId, clinicId));
    }

    // Always update local DB to final state
    await db.update(subscriptions)
      .set({ status: overallSuccess ? 'canceled' : 'partially_canceled' })
      .where(eq(subscriptions.clinicId, clinicId));

    // B-3: Audit log for financial operation
    try {
      console.log(JSON.stringify({
        event: 'subscription_cancel_attempted',
        timestamp: new Date().toISOString(),
        userId: session.userId,
        clinicId,
        metadata: {
          razorpayResult: results.razorpay,
          stripeResult: results.stripe,
          overallSuccess,
          subscriptionId: sub.stripeSubscriptionId || sub.razorpaySubscriptionId,
        },
      }));
    } catch (auditErr) {
      console.error('[billing] Audit log failed:', auditErr);
    }

    if (!overallSuccess) {
      return new Response(JSON.stringify({
        error: 'One or more cancellations failed. Please contact support.',
        details: results,
      }), { status: 502, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
};