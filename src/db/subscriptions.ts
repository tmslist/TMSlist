import { db } from './index';
import { subscriptions } from './schema';
import { eq, and, desc } from 'drizzle-orm';
import Stripe from 'stripe';

export type PlanId = 'free' | 'pro' | 'premium' | 'enterprise';

export type FeatureFlags = {
  listing: 'basic' | 'full' | 'priority';
  photos: number;
  devices: boolean;
  insurance: boolean;
  protocols: boolean;
  doctors: boolean;
  leadCapture: 'form' | 'instant';
  leadDashboard: boolean;
  analytics: boolean;
  chatbot: boolean;
  multiLocation: boolean;
};

export type MarketingFeatureLimits = {
  analytics: boolean;
  leadNotifications: boolean;
  featuredPlacement: boolean;
  badgeType: string | null;
  responseToReviews: boolean;
  prioritySupport: boolean;
};

export const PLANS: Record<PlanId, {
  id: PlanId;
  name: string;
  price: number;               // USD — used by pricing page & Stripe
  priceId: string | null;      // Stripe price ID
  monthlyPriceInr: number;
  monthlyPriceUsd: number;
  currency: 'both' | 'inr' | 'usd';
  planEnum: string | null;
  razorpayPlanId: string | null;
  stripePriceId: string | null;
  features: FeatureFlags;
  marketingFeatures: string[]; // Human-readable feature list for pricing page
  limits: MarketingFeatureLimits;
}> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    priceId: null,
    monthlyPriceInr: 0,
    monthlyPriceUsd: 0,
    currency: 'both',
    planEnum: null,
    razorpayPlanId: null,
    stripePriceId: null,
    features: {
      listing: 'basic',
      photos: 1,
      devices: false,
      insurance: false,
      protocols: false,
      doctors: false,
      leadCapture: 'form',
      leadDashboard: false,
      analytics: false,
      chatbot: false,
      multiLocation: false,
    },
    marketingFeatures: [
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
    id: 'pro',
    name: 'Pro',
    price: 99,
    priceId: process.env.STRIPE_PRICE_PRO ?? null,
    monthlyPriceInr: 1499,
    monthlyPriceUsd: 18,
    currency: 'inr',
    planEnum: 'pro',
    razorpayPlanId: process.env.RAZORPAY_PLAN_PRO ?? null,
    stripePriceId: process.env.STRIPE_PRICE_PRO ?? null,
    features: {
      listing: 'full',
      photos: 5,
      devices: true,
      insurance: true,
      protocols: true,
      doctors: true,
      leadCapture: 'instant',
      leadDashboard: false,
      analytics: false,
      chatbot: false,
      multiLocation: false,
    },
    marketingFeatures: [
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
      badgeType: 'pro',
      responseToReviews: true,
      prioritySupport: false,
    },
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 249,
    priceId: process.env.STRIPE_PRICE_PREMIUM ?? null,
    monthlyPriceInr: 2499,
    monthlyPriceUsd: 30,
    currency: 'inr',
    planEnum: 'premium',
    razorpayPlanId: process.env.RAZORPAY_PLAN_PREMIUM ?? null,
    stripePriceId: process.env.STRIPE_PRICE_PREMIUM ?? null,
    features: {
      listing: 'full',
      photos: 20,
      devices: true,
      insurance: true,
      protocols: true,
      doctors: true,
      leadCapture: 'instant',
      leadDashboard: true,
      analytics: true,
      chatbot: false,
      multiLocation: false,
    },
    marketingFeatures: [
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
      badgeType: 'premium',
      responseToReviews: true,
      prioritySupport: true,
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 499,
    priceId: process.env.STRIPE_PRICE_ENTERPRISE ?? null,
    monthlyPriceInr: 4999,
    monthlyPriceUsd: 60,
    currency: 'inr',
    planEnum: 'enterprise',
    razorpayPlanId: process.env.RAZORPAY_PLAN_ENTERPRISE ?? null,
    stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE ?? null,
    features: {
      listing: 'priority',
      photos: 999,
      devices: true,
      insurance: true,
      protocols: true,
      doctors: true,
      leadCapture: 'instant',
      leadDashboard: true,
      analytics: true,
      chatbot: true,
      multiLocation: true,
    },
    marketingFeatures: [
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
      badgeType: 'enterprise',
      responseToReviews: true,
      prioritySupport: true,
    },
  },
} as const;

// Maps DB subscription plan enum values to application PlanId
const PLAN_ENUM_TO_ID: Record<string, PlanId> = {
  pro: 'pro',
  premium: 'premium',
  enterprise: 'enterprise',
  featured: 'free',
  verified: 'free',
};

export function getPlanFeatures(planId: PlanId): FeatureFlags {
  return PLANS[planId].features;
}

export async function getClinicPlan(clinicId: string): Promise<PlanId> {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.clinicId, clinicId), eq(subscriptions.status, 'active')))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  if (!sub) return 'free';
  return PLAN_ENUM_TO_ID[sub.plan] ?? 'free';
}

export async function getClinicFeatures(clinicId: string): Promise<FeatureFlags> {
  const plan = await getClinicPlan(clinicId);
  return PLANS[plan].features;
}

export async function getClinicSubscription(clinicId: string) {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.clinicId, clinicId), eq(subscriptions.status, 'active')))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);
  return sub ?? null;
}

// ── Stripe checkout ─────────────────────────────────────────────────────────

function getStripe() {
  const key = import.meta.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: '2025-04-30.basil' });
}

/**
 * Create a Stripe checkout session for a subscription plan.
 * Exported here so all billing flows use the same PLANS source of truth.
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
      trial_period_days: 90,
      metadata: {
        clinicId: opts.clinicId,
        plan: opts.planId,
      },
    },
  });
}

// ── Admin MRR price map ─────────────────────────────────────────────────────

/** USD monthly price per DB plan enum — used for MRR calculations. */
export const PLAN_PRICE_USD: Record<string, number> = {
  free: 0,
  verified: 0,
  featured: 0,
  pro: 99,
  premium: 249,
  enterprise: 499,
};