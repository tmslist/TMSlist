import type { APIRoute } from 'astro';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';
import { createSubscriptionCheckout, PLANS } from '../../../db/subscriptions';
import type { PlanId } from '../../../db/subscriptions';
import { db } from '../../../db';
import { users } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'clinic_owner', 'admin')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  let body: { plan: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const { plan } = body;
  if (!['pro', 'premium', 'enterprise'].includes(plan)) {
    return new Response(JSON.stringify({ error: 'Invalid plan' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const SITE_URL = import.meta.env.SITE_URL || 'https://tmslist.com';

  // Get clinicId from user record
  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  const clinicId = user?.clinicId || (session as any).clinicId;

  if (!clinicId) {
    return new Response(JSON.stringify({ error: 'No clinic linked to your account. Please claim your clinic first.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const clinicName = user?.name || session.email;

  try {
    const checkoutSession = await createSubscriptionCheckout({
      planId: plan as PlanId,
      clinicId,
      clinicName,
      clinicEmail: session.email,
      successUrl: `${SITE_URL}/portal/billing/?subscribed=${plan}`,
      cancelUrl: `${SITE_URL}/portal/billing/?canceled=true`,
    });

    return new Response(JSON.stringify({
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('Stripe checkout error:', err);
    return new Response(JSON.stringify({ error: 'Checkout creation failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};