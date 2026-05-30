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
  maxLocations: number; // 0 = primary only, 1 = +1 branch, 3 = +3 branches, -1 = unlimited
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
      maxLocations: 0, // primary only
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
    name: 'Starter',
    price: 29,
    priceId: process.env.STRIPE_PRICE_PRO ?? null,
    monthlyPriceInr: 2499,
    monthlyPriceUsd: 29,
    currency: 'both',
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
      analytics: true,
      chatbot: false,
      multiLocation: false,
      maxLocations: 0, // primary only
    },
    marketingFeatures: [
      'Everything in Free',
      '5 clinic photos',
      'TMS devices & protocols listed',
      'Insurance carriers displayed',
      'Doctor profiles (up to 3)',
      'Instant lead SMS + email notifications',
      'Basic analytics dashboard',
      'Respond to patient reviews',
      '"Starter" badge on listing',
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
    name: 'Professional',
    price: 59,
    priceId: process.env.STRIPE_PRICE_PREMIUM ?? null,
    monthlyPriceInr: 4999,
    monthlyPriceUsd: 59,
    currency: 'both',
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
      maxLocations: 3, // up to 3 additional branches
    },
    marketingFeatures: [
      'Everything in Starter',
      '20 clinic photos with gallery',
      'Lead dashboard with enquiry management',
      'Advanced analytics with trends',
      '"Professional Verified" badge',
      'Featured placement in city/state',
      'Patient enquiry management',
      'Priority email + chat support',
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
    name: 'Clinic Group',
    price: 119,
    priceId: process.env.STRIPE_PRICE_ENTERPRISE ?? null,
    monthlyPriceInr: 9999,
    monthlyPriceUsd: 119,
    currency: 'both',
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
      maxLocations: -1, // unlimited
    },
    marketingFeatures: [
      'Everything in Professional',
      'Multi-location management',
      'AI chatbot for patient engagement',
      'Bulk lead export & CRM sync',
      '"Clinic Group" enterprise badge',
      'Dedicated account manager',
      'Custom branding options',
      'White-label reports',
      'API access for integrations',
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

/**
 * Check if a clinic can add more locations under their current plan.
 * Returns { allowed: true } if under limit, or { allowed: false, limit: number } if at limit.
 */
export async function checkLocationLimit(clinicId: string, currentCount: number): Promise<
  { allowed: true } | { allowed: false; limit: number; current: number }
> {
  const features = await getClinicFeatures(clinicId);
  const { maxLocations } = features;

  // -1 means unlimited
  if (maxLocations === -1) return { allowed: true };

  if (currentCount >= maxLocations) {
    return { allowed: false, limit: maxLocations, current: currentCount };
  }

  return { allowed: true };
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
  return new Stripe(key, { apiVersion: '2022-11-15' });
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
  pro: 29,
  premium: 59,
  enterprise: 119,
};

/**
 * Client-safe plan display data — used by React components.
 * Single source of truth for all plan names, prices, and colors.
 * Import this instead of hardcoding plan details in UI components.
 */
export const PLAN_DISPLAY: Record<PlanId, {
  name: string;
  price: number;       // USD monthly
  priceLabel: string;  // formatted string e.g. "$29/mo"
  color: string;       // CSS class for plan badge color
}> = {
  free: {
    name: 'Free',
    price: 0,
    priceLabel: '$0/mo',
    color: 'text-[var(--ink2)]',
  },
  pro: {
    name: 'Starter',
    price: 29,
    priceLabel: '$29/mo',
    color: 'text-[var(--accent)]',
  },
  premium: {
    name: 'Professional',
    price: 59,
    priceLabel: '$59/mo',
    color: 'text-[var(--accent)]',
  },
  enterprise: {
    name: 'Clinic Group',
    price: 119,
    priceLabel: '$119/mo',
    color: 'text-[var(--ink)]',
  },
} as const;