import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';
import { db } from '../../../db';
import { users } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

const AD_PRICES: Record<string, { name: string; description: string; priceUsd: number; priceId?: string }> = {
  'sponsored-listing-monthly': {
    name: 'Sponsored Clinic Listing',
    description: 'Your clinic appears first in city and state search results for 1 month',
    priceUsd: 149,
  },
  'sponsored-listing-yearly': {
    name: 'Sponsored Clinic Listing (Annual)',
    description: 'Your clinic appears first — billed annually',
    priceUsd: 990,
  },
  'display-banner-monthly': {
    name: 'Display Banner Placement',
    description: 'Banner ad on high-traffic pages (treatment guides, directory) for 30 days',
    priceUsd: 499,
  },
  'content-sponsorship': {
    name: 'Content Sponsorship',
    description: 'Your brand featured alongside a TMS List educational article',
    priceUsd: 999,
  },
};

function getStripe() {
  const key = import.meta.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: '2025-04-30.basil' });
}

export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Please log in to purchase advertising', code: 'UNAUTHORIZED' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { package: string; clinicId?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const { package: pkg, clinicId } = body;
  const adConfig = AD_PRICES[pkg];
  if (!adConfig) {
    return new Response(JSON.stringify({ error: `Unknown advertising package: ${pkg}` }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const stripe = getStripe();
  if (!stripe) {
    return new Response(JSON.stringify({
      error: 'Stripe is not configured. Please contact brandingpioneers@gmail.com to set up your advertising purchase.',
      code: 'STRIPE_NOT_CONFIGURED',
    }), { status: 503, headers: { 'Content-Type': 'application/json' } });
  }

  const siteUrl = import.meta.env.SITE_URL || 'https://tmslist.com';
  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  const userClinicId = clinicId || user?.clinicId;

  // If no price ID configured, try to create ad-hoc or fall back to contact
  if (adConfig.priceId) {
    try {
      const checkoutSession = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: session.email,
        line_items: [{ price: adConfig.priceId, quantity: 1 }],
        success_url: `${siteUrl}/advertise/success/?session_id={CHECKOUT_SESSION_ID}&package=${pkg}`,
        cancel_url: `${siteUrl}/advertise/?canceled=true`,
        metadata: {
          package: pkg,
          userId: session.userId,
          clinicId: userClinicId || '',
        },
      });

      return new Response(JSON.stringify({ checkoutUrl: checkoutSession.url }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      console.error('[advertising checkout]', err);
      return new Response(JSON.stringify({ error: 'Failed to create checkout session. Please email brandingpioneers@gmail.com.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  }

  // No Stripe price ID — send contact email
  return new Response(JSON.stringify({
    error: `The "${adConfig.name}" package requires manual setup. We've received your request and will contact you within 1 business day at ${session.email}.`,
    code: 'MANUAL_SETUP_REQUIRED',
    package: pkg,
    contactEmail: 'brandingpioneers@gmail.com',
  }), { status: 202, headers: { 'Content-Type': 'application/json' } });
};
