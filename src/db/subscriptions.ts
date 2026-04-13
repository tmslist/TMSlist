import { db } from './index';
import { subscriptions, clinics } from './schema';
import { eq, and, desc } from 'drizzle-orm';

export type PlanId = 'free' | 'pro' | 'enterprise';

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

export const PLANS = {
  free: {
    id: 'free' as PlanId,
    name: 'Free',
    monthlyPriceInr: 0,
    monthlyPriceUsd: 0,
    currency: 'both',
    planEnum: null,
    features: {
      listing: 'basic' as const,
      photos: 1,
      devices: false,
      insurance: false,
      protocols: false,
      doctors: false,
      leadCapture: 'form' as const,
      leadDashboard: false,
      analytics: false,
      chatbot: false,
      multiLocation: false,
    } satisfies FeatureFlags,
  },
  pro: {
    id: 'pro' as PlanId,
    name: 'Pro',
    monthlyPriceInr: 1499,
    monthlyPriceUsd: 18,
    currency: 'inr',
    planEnum: 'pro' as const,
    razorpayPlanId: process.env.RAZORPAY_PLAN_PRO,
    stripePriceId: process.env.STRIPE_PRICE_PRO,
    features: {
      listing: 'full' as const,
      photos: 5,
      devices: true,
      insurance: true,
      protocols: true,
      doctors: true,
      leadCapture: 'instant' as const,
      leadDashboard: false,
      analytics: false,
      chatbot: false,
      multiLocation: false,
    } satisfies FeatureFlags,
  },
  enterprise: {
    id: 'enterprise' as PlanId,
    name: 'Enterprise',
    monthlyPriceInr: 4999,
    monthlyPriceUsd: 60,
    currency: 'inr',
    planEnum: 'enterprise' as const,
    razorpayPlanId: process.env.RAZORPAY_PLAN_ENTERPRISE,
    stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE,
    features: {
      listing: 'priority' as const,
      photos: 999,
      devices: true,
      insurance: true,
      protocols: true,
      doctors: true,
      leadCapture: 'instant' as const,
      leadDashboard: true,
      analytics: true,
      chatbot: true,
      multiLocation: true,
    } satisfies FeatureFlags,
  },
} as const;

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

  const planEnumToPlanId: Record<string, PlanId> = {
    pro: 'pro',
    enterprise: 'enterprise',
    featured: 'free',
    premium: 'free',
    verified: 'free',
  };

  return planEnumToPlanId[sub.plan] ?? 'free';
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