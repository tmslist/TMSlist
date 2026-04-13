import type { APIRoute } from 'astro';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';
import { createProCheckout, createEnterpriseCheckout } from '../../../utils/stripe';

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
  if (!['pro', 'enterprise'].includes(plan)) {
    return new Response(JSON.stringify({ error: 'Invalid plan' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const SITE_URL = import.meta.env.SITE_URL || 'https://tmslist.com';
  const successUrl = `${SITE_URL}/portal/billing?success=true`;
  const cancelUrl = `${SITE_URL}/portal/billing?canceled=true`;

  const clinicId = (session as any).clinicId as string;
  const clinicName = (session as any).clinicName as string || session.email;

  try {
    let checkoutSession;

    if (plan === 'pro') {
      checkoutSession = await createProCheckout({
        clinicId: clinicId || '',
        clinicName,
        clinicEmail: session.email,
        successUrl,
        cancelUrl,
      });
    } else if (plan === 'enterprise') {
      checkoutSession = await createEnterpriseCheckout({
        clinicId: clinicId || '',
        clinicName,
        clinicEmail: session.email,
        successUrl,
        cancelUrl,
      });
    }

    if (!checkoutSession) {
      return new Response(JSON.stringify({ error: 'Stripe not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('Stripe checkout error:', err);
    return new Response(JSON.stringify({ error: 'Checkout creation failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};