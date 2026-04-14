/**
 * @deprecated Import PLANS and related subscription types from '~/db/subscriptions' instead.
 * This file is kept for backward compatibility and will be removed in a future version.
 */
export { PLANS, getPlanFeatures, getClinicPlan, getClinicFeatures, getClinicSubscription, createSubscriptionCheckout, PLAN_PRICE_USD } from '../db/subscriptions';
import type { PlanId, FeatureFlags, MarketingFeatureLimits } from '../db/subscriptions';
export type { PlanId, FeatureFlags, MarketingFeatureLimits };
