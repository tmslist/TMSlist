import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/react-query';
import { PortalCard, PortalButton, PortalBadge, LoadingScreen, ErrorScreen } from './PortalUI';

interface Subscription {
  plan: 'free' | 'pro' | 'premium' | 'enterprise';
  status: 'active' | 'past_due' | 'canceled' | 'trialing' | null;
  currentPeriodEnd: string | null;
  stripeSubscriptionId: string | null;
  razorpaySubscriptionId: string | null;
  billingCurrency: string;
}

interface PlanInfo {
  name: string;
  price: number;
  features: string[];
}

const PLAN_DETAILS: Record<string, PlanInfo> = {
  free: { name: 'Free', price: 0, features: ['Basic listing', '1 photo', 'Contact form leads'] },
  pro: { name: 'Starter', price: 29, features: ['Full listing', '5 photos', 'Doctor profiles', 'Instant leads', 'Analytics'] },
  premium: { name: 'Professional', price: 59, features: ['Featured placement', '20 photos', 'Up to 3 locations', 'Lead dashboard', 'Advanced analytics', 'Priority support'] },
  enterprise: { name: 'Clinic Group', price: 119, features: ['Unlimited locations', 'AI chatbot', 'Dedicated support', 'Custom integration'] },
};

const FEATURES = [
  { label: 'Listing Visibility', free: 'Basic', pro: 'Full', premium: 'Featured', enterprise: 'Priority' },
  { label: 'Clinic Photos', free: '1 photo', pro: '5 photos', premium: '20 photos', enterprise: 'Unlimited' },
  { label: 'Doctor Profiles', free: '—', pro: '✓', premium: '✓', enterprise: '✓' },
  { label: 'TMS Devices & Protocols', free: '—', pro: '✓', premium: '✓', enterprise: '✓' },
  { label: 'Insurance Carriers', free: '—', pro: '✓', premium: '✓', enterprise: '✓' },
  { label: 'Lead Capture', free: 'Form only', pro: 'Instant', premium: 'Instant', enterprise: 'Instant' },
  { label: 'Lead Dashboard', free: '—', pro: '—', premium: '✓', enterprise: '✓' },
  { label: 'Analytics', free: '—', pro: 'Basic', premium: 'Advanced', enterprise: 'Advanced' },
  { label: 'AI Chatbot', free: '—', pro: '—', premium: '—', enterprise: '✓' },
  { label: 'Locations', free: '1 only', pro: '1 only', premium: 'Up to 3', enterprise: 'Unlimited' },
  { label: 'Support', free: '—', pro: 'Email', premium: 'Priority', enterprise: 'Dedicated' },
];

// API functions using React Query patterns
async function fetchSubscription(): Promise<{
  plan: string;
  status: string | null;
  currentPeriodEnd: string | null;
  stripeSubscriptionId: string | null;
  razorpaySubscriptionId: string | null;
  currency: string;
}> {
  const res = await fetch('/api/payments/portal');
  if (!res.ok) throw new Error('Failed to load subscription');
  return res.json();
}

async function upgradeSubscription(plan: string): Promise<{ checkoutUrl: string }> {
  const res = await fetch('/api/payments/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Checkout failed');
  }
  return res.json();
}

async function cancelSubscription(): Promise<void> {
  const res = await fetch('/api/payments/portal', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'cancel' }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Cancel failed');
  }
}

export default function PortalBilling({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const [urlParams, setUrlParams] = useState<{ success?: string; canceled?: boolean }>({});
  const [globalError, setGlobalError] = useState('');

  const [showCancelModal, setShowCancelModal] = useState(false);

  // Parse URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('subscribed');
    const canceled = params.get('canceled') === 'true';

    if (success || canceled) {
      setUrlParams({ success: success || undefined, canceled });
      window.history.replaceState({}, '', window.location.pathname);
    }

    // Listen for cancel subscription event
    const handleCancel = () => setShowCancelModal(true);
    window.addEventListener('portal:cancel-subscription', handleCancel);
    return () => window.removeEventListener('portal:cancel-subscription', handleCancel);
  }, []);

  // Subscription query with React Query
  const { data: subscriptionData, isLoading, error: queryError, refetch } = useQuery({
    queryKey: queryKeys.portal.subscription(),
    queryFn: fetchSubscription,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Upgrade mutation with optimistic updates
  const upgradeMutation = useMutation({
    mutationFn: upgradeSubscription,
    onSuccess: (data) => {
      window.location.href = data.checkoutUrl;
    },
    onError: (err: Error) => {
      setGlobalError(err.message);
      setTimeout(() => setGlobalError(''), 5000);
    },
  });

  // Cancel mutation with cache invalidation
  const cancelMutation = useMutation({
    mutationFn: cancelSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.portal.subscription() });
      window.location.reload();
    },
    onError: (err: Error) => {
      setGlobalError(err.message);
    },
  });

  // Derive subscription state
  const subscription: Subscription | null = subscriptionData ? {
    plan: (subscriptionData.plan || 'free') as Subscription['plan'],
    status: (subscriptionData.status || null) as Subscription['status'],
    currentPeriodEnd: subscriptionData.currentPeriodEnd || null,
    stripeSubscriptionId: subscriptionData.stripeSubscriptionId || null,
    razorpaySubscriptionId: subscriptionData.razorpaySubscriptionId || null,
    billingCurrency: subscriptionData.currency || 'usd',
  } : null;

  const plan = subscription?.plan || 'free';
  const planInfo = PLAN_DETAILS[plan] || PLAN_DETAILS.free;

  // Check for no-clinic state (API returns 400 with this message)
  if (queryError && (queryError.message === 'No clinic linked' || (queryError as any)?.response?.data?.error === 'No clinic linked')) {
    return (
      <div className="max-w-5xl mx-auto">
        <PortalCard padding="lg">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21m-3.75 3H21" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-[var(--ink)] mb-2">No Clinic Linked</h2>
            <p className="text-[var(--muted)] mb-6 max-w-md mx-auto">
              You need to claim your clinic before you can manage your billing and subscription.
            </p>
            <a
              href="/portal/claim/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
              Claim Your Clinic
            </a>
          </div>
        </PortalCard>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingScreen message="Loading billing information..." />;
  }

  if (queryError && !subscription) {
    return <ErrorScreen message={queryError.message} onRetry={() => refetch()} />;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Success/Cancel banners */}
      {urlParams.success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-emerald-800">Subscription activated!</p>
            <p className="text-sm text-emerald-700">Your plan has been upgraded. New features are now live.</p>
          </div>
        </div>
      )}

      {urlParams.canceled && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-amber-800">Checkout canceled</p>
            <p className="text-sm text-amber-700">No charges were made. You can try again anytime.</p>
          </div>
        </div>
      )}

      {/* Current Plan */}
      <PortalCard padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[var(--ink)]">Current Plan</h2>
          <PortalBadge variant={plan === 'enterprise' ? 'success' : 'default'}>
            {planInfo.name}
            {subscription?.status === 'past_due' && ' — Past Due'}
            {subscription?.status === 'canceled' && ' — Canceled'}
          </PortalBadge>
        </div>

        {subscription?.currentPeriodEnd && (
          <p className="text-sm text-[var(--muted)]">
            {subscription.status === 'canceled' ? 'Access until' : 'Next billing'}:
            {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        )}

        {plan === 'free' && (
          <p className="text-sm text-[var(--muted)] mt-2">Free forever — no card required.</p>
        )}

        {/* Quick upgrade CTA */}
        {plan !== 'enterprise' && (
          <div className="mt-6 p-4 bg-gradient-to-br from-[var(--paper2)] to-[var(--ink)] rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-semibold text-lg">
                  {plan === 'free' ? 'Upgrade to Starter' : plan === 'pro' ? 'Upgrade to Professional' : 'Upgrade to Clinic Group'}
                </p>
                <p className="text-[var(--muted)] text-sm">
                  {plan === 'free' ? 'Unlock doctor profiles, instant leads, and analytics.'
                    : plan === 'pro' ? 'Get featured placement, lead dashboard, and advanced analytics.'
                    : 'Unlock multi-location and dedicated support.'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-white text-2xl font-bold">
                  ${PLAN_DETAILS[plan === 'free' ? 'pro' : plan === 'pro' ? 'premium' : 'enterprise'].price}
                  <span className="text-[var(--muted)] text-sm font-normal">/mo</span>
                </p>
                <PortalButton
                  variant="secondary"
                  size="sm"
                  loading={upgradeMutation.isPending}
                  onClick={() => upgradeMutation.mutate(plan === 'free' ? 'pro' : plan === 'pro' ? 'premium' : 'enterprise')}
                  className="mt-2"
                >
                  Upgrade →
                </PortalButton>
              </div>
            </div>
          </div>
        )}
      </PortalCard>

      {/* Feature Comparison */}
      <PortalCard padding="lg">
        <h2 className="text-xl font-semibold text-[var(--ink)] mb-6">Plan Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--line)]">
                <th className="text-left py-3 pr-4 font-medium text-[var(--muted)]">Feature</th>
                <th className="text-center py-3 px-4 font-medium text-[var(--ink2)]">Free<br /><span className="text-xs font-normal text-[var(--muted)]">$0</span></th>
                <th className={`text-center py-3 px-4 font-medium ${plan === 'pro' ? 'text-emerald-600' : 'text-[var(--ink)]'}`}>Starter<br /><span className="text-xs font-normal text-[var(--muted)]">$29/mo</span></th>
                <th className={`text-center py-3 px-4 font-medium ${plan === 'premium' ? 'text-emerald-600' : 'text-[var(--ink)]'}`}>Professional<br /><span className="text-xs font-normal text-[var(--muted)]">$59/mo</span></th>
                <th className={`text-center py-3 px-4 font-medium ${plan === 'enterprise' ? 'text-emerald-600' : 'text-[var(--ink)]'}`}>Clinic Group<br /><span className="text-xs font-normal text-[var(--muted)]">$119/mo</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {FEATURES.map((row) => (
                <tr key={row.label}>
                  <td className="py-3 pr-4 text-[var(--ink2)]">{row.label}</td>
                  <td className="py-3 px-4 text-center text-[var(--muted)]">{row.free}</td>
                  <td className={`py-3 px-4 text-center font-medium ${plan === 'pro' ? 'text-[var(--ink)]' : 'text-[var(--ink2)]'}`}>{row.pro}</td>
                  <td className={`py-3 px-4 text-center font-medium ${plan === 'premium' ? 'text-[var(--ink)]' : 'text-[var(--ink2)]'}`}>{row.premium}</td>
                  <td className={`py-3 px-4 text-center font-medium ${plan === 'enterprise' ? 'text-[var(--ink)]' : 'text-[var(--ink2)]'}`}>{row.enterprise}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PortalCard>

      {/* Cancel Section */}
      {plan !== 'free' && (
        <div className="text-center pt-4">
          <button
            onClick={() => setShowCancelModal(true)}
            className="text-[var(--muted)] hover:text-red-600 text-sm font-medium transition-colors"
          >
            Cancel subscription
          </button>
        </div>
      )}

      {/* Global Error Toast */}
      {globalError && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white rounded-xl p-4 shadow-lg max-w-sm z-50 flex items-start gap-3 animate-slide-up">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <p className="text-sm font-medium">{globalError}</p>
        </div>
      )}

      {/* Footer */}
      <div className="pt-6 border-t border-[var(--line)] flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="text-xs text-[var(--muted)] space-y-0.5">
          <p>Payments processed by <strong className="text-[var(--muted)]">Stripe Inc.</strong></p>
          <p>&copy; 2026 ATZ Medappz Pvt Ltd &middot; <a href="/legal/privacy-policy/" className="hover:text-[var(--muted)] underline">Privacy Policy</a> &middot; <a href="/legal/terms-of-service/" className="hover:text-[var(--muted)] underline">Terms of Service</a></p>
        </div>
        <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--muted)] transition-colors shrink-0">
          <svg className="h-4 w-auto" viewBox="0 0 60 25" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5.45 10.2c0-.86.7-1.18 1.87-1.18 1.66 0 3.78.5 5.46 1.4V5.88C10.93 5.24 9.07 4.98 7.32 4.98 3.3 4.98 0 7.1 0 10.43c0 5.2 7.1 4.37 7.1 6.62 0 .99-.87 1.34-2.1 1.34-1.83 0-4.14-.76-5.96-1.7v4.66c1.97.8 3.95 1.13 5.96 1.13 4.08 0 7.4-1.68 7.4-5.12-.02-5.76-7.02-4.65-7.02-6.83v-.03h.07z" fill="#635BFF"/>
            <path d="M20.03 4.8h4.8l-4.8 4.8h4.8l-4.8 4.8h4.8l-4.8 4.8h8.64v-1.92H23.67l4.8-4.8h-3.84l4.8-4.8h-3.84l4.8-4.8H20.03v1.92z" fill="#635BFF"/>
          </svg>
        </a>
      </div>
    {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-[var(--ink)] mb-2">Cancel Subscription?</h2>
            <p className="text-[var(--muted)] text-sm mb-6">
              You'll lose access to {planInfo.name} features at the end of your current billing period. Your data will be preserved.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-[var(--line)] text-[var(--ink2)] hover:bg-[var(--paper2)] transition-colors"
              >
                Keep Plan
              </button>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  cancelMutation.mutate();
                }}
                disabled={cancelMutation.isPending}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {cancelMutation.isPending ? 'Canceling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}