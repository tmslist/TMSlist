import Stripe from 'stripe';

const SECRET_KEY = import.meta.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;

function getStripe() {
  if (!SECRET_KEY) return null;
  return new Stripe(SECRET_KEY, { apiVersion: '2025-04-30.basil' });
}

export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    priceId: null,
    features: [
      'Basic clinic listing',
      'Show in search results',
      'Patient reviews',
      'Contact information',
    ],
    limits: {
      analytics: false,
      leadNotifications: false,
      featuredPlacement: false,
      badgeType: null,
      responseToReviews: false,
      prioritySupport: false,
    },
  },
  pro: {
    name: 'Pro',
    price: 99,
    priceId: 'price_pro_monthly', // Replace with actual Stripe price ID
    features: [
      'Everything in Free',
      'Lead SMS + email notifications',
      'Basic analytics dashboard',
      'Respond to reviews',
      '"Pro" badge on listing',
      'Priority in search results',
    ],
    limits: {
      analytics: true,
      leadNotifications: true,
      featuredPlacement: false,
      badgeType: 'pro' as const,
      responseToReviews: true,
      prioritySupport: false,
    },
  },
  premium: {
    name: 'Premium',
    price: 249,
    priceId: 'price_premium_monthly', // Replace with actual Stripe price ID
    features: [
      'Everything in Pro',
      'Featured placement in city/state pages',
      'Advanced analytics with competitor insights',
      '"Premium Verified" badge',
      'AI-matched lead routing',
      'Photo gallery (up to 20 images)',
      'Priority support',
    ],
    limits: {
      analytics: true,
      leadNotifications: true,
      featuredPlacement: true,
      badgeType: 'premium' as const,
      responseToReviews: true,
      prioritySupport: true,
    },
  },
  enterprise: {
    name: 'Enterprise',
    price: 499,
    priceId: 'price_enterprise_monthly', // Replace with actual Stripe price ID
    features: [
      'Everything in Premium',
      'Multi-location management',
      'API access for integrations',
      'White-label performance reports',
      'Dedicated account manager',
      'Custom branding options',
      'Bulk lead export',
    ],
    limits: {
      analytics: true,
      leadNotifications: true,
      featuredPlacement: true,
      badgeType: 'enterprise' as const,
      responseToReviews: true,
      prioritySupport: true,
    },
  },
} as const;

export type PlanId = keyof typeof PLANS;

/**
 * Create a Stripe checkout session for a subscription plan.
 */
export async function createSubscriptionCheckout(opts: {
  planId: PlanId;
  clinicId: string;
  clinicName: string;
  clinicEmail: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const stripe = getStripe();
  if (!stripe) throw new Error('Stripe not configured');

  const plan = PLANS[opts.planId];
  if (!plan.priceId) throw new Error('Free plan does not require checkout');

  return stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: opts.clinicEmail,
    line_items: [{ price: plan.priceId, quantity: 1 }],
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    metadata: {
      clinicId: opts.clinicId,
      clinicName: opts.clinicName,
      plan: opts.planId,
      type: 'subscription',
    },
    subscription_data: {
      metadata: {
        clinicId: opts.clinicId,
        plan: opts.planId,
      },
    },
  });
}

/**
 * Get the current plan for a clinic based on subscription status.
 */
export async function getClinicPlan(clinicId: string): Promise<PlanId> {
  const stripe = getStripe();
  if (!stripe) return 'free';

  try {
    // Search for active subscriptions with this clinic ID
    const subscriptions = await stripe.subscriptions.search({
      query: `metadata["clinicId"]:"${clinicId}" status:"active"`,
      limit: 1,
    });

    if (subscriptions.data.length === 0) return 'free';

    const plan = subscriptions.data[0].metadata.plan as PlanId;
    return plan && plan in PLANS ? plan : 'free';
  } catch {
    return 'free';
  }
}
