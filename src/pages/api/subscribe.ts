import type { APIRoute } from 'astro';
import { getSessionFromRequest, hasRole } from '../../utils/auth';
import { createSubscriptionCheckout, type PlanId, PLANS } from '../../utils/subscriptions';
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { users, clinics } from '../../db/schema';

export const prerender = false;

export const GET: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'clinic_owner', 'admin')) {
    // Redirect to login
    const planParam = url.searchParams.get('plan') || 'pro';
    return new Response(null, {
      status: 302,
      headers: { Location: `/admin/login?redirect=/api/subscribe?plan=${planParam}` },
    });
  }

  const planId = (url.searchParams.get('plan') || 'pro') as PlanId;

  if (!(planId in PLANS) || planId === 'free') {
    return new Response(JSON.stringify({ error: 'Invalid plan' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Get user's clinic
    const user = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
    const clinicId = user[0]?.clinicId;

    if (!clinicId) {
      return new Response(JSON.stringify({ error: 'No clinic linked to your account' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const clinicData = await db.select().from(clinics).where(eq(clinics.id, clinicId)).limit(1);
    const clinic = clinicData[0];

    if (!clinic) {
      return new Response(JSON.stringify({ error: 'Clinic not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const siteUrl = import.meta.env.SITE_URL || process.env.SITE_URL || 'https://tmslist.com';

    const checkoutSession = await createSubscriptionCheckout({
      planId,
      clinicId,
      clinicName: clinic.name,
      clinicEmail: clinic.email || session.email,
      successUrl: `${siteUrl}/owner/dashboard?subscribed=${planId}`,
      cancelUrl: `${siteUrl}/pricing`,
    });

    return new Response(null, {
      status: 302,
      headers: { Location: checkoutSession.url! },
    });
  } catch (err) {
    console.error('Subscription checkout error:', err);
    return new Response(JSON.stringify({ error: 'Failed to create checkout session' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
