import Stripe from 'stripe';

const SECRET_KEY = import.meta.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;

function getStripe() {
  if (!SECRET_KEY) return null;
  return new Stripe(SECRET_KEY, { apiVersion: '2025-04-30.basil' });
}

/**
 * Create a checkout session for a featured listing subscription.
 */
export async function createFeaturedListingCheckout(opts: {
  clinicId: string;
  clinicName: string;
  clinicEmail: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const stripe = getStripe();
  if (!stripe) throw new Error('Stripe not configured');

  return stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: opts.clinicEmail,
    line_items: [{ price: opts.priceId, quantity: 1 }],
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    metadata: {
      clinicId: opts.clinicId,
      clinicName: opts.clinicName,
      type: 'featured_listing',
    },
  });
}

/**
 * Create a one-time payment for verified badge.
 */
export async function createVerifiedBadgeCheckout(opts: {
  clinicId: string;
  clinicEmail: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const stripe = getStripe();
  if (!stripe) throw new Error('Stripe not configured');

  return stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: opts.clinicEmail,
    line_items: [{ price: opts.priceId, quantity: 1 }],
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    metadata: {
      clinicId: opts.clinicId,
      type: 'verified_badge',
    },
  });
}

/**
 * Verify a Stripe webhook signature.
 */
export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): Stripe.Event {
  const stripe = getStripe();
  if (!stripe) throw new Error('Stripe not configured');
  return stripe.webhooks.constructEvent(body, signature, secret);
}

/**
 * Cancel a subscription.
 */
export async function cancelSubscription(subscriptionId: string) {
  const stripe = getStripe();
  if (!stripe) throw new Error('Stripe not configured');
  return stripe.subscriptions.cancel(subscriptionId);
}
