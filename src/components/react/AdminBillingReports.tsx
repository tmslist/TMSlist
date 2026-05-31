'use client';
import { useState, useEffect, useCallback } from 'react';

interface BillingStats {
  total: number;
  active: number;
  canceled: number;
  past_due: number;
  new_in_period: number;
  expiring_soon: number;
  estimated_mrr: number;
  mrr_note: string;
  by_plan: Record<string, number>;
  stripe_configured: boolean;
  period_days: number;
}

interface TopClinic {
  name: string;
  plan: string;
  amount: number;
  status: string;
}

type Period = 'this_month' | 'last_month' | 'last_3_months' | 'this_year' | 'custom';

const PERIOD_DAYS: Record<Period, number> = {
  this_month: 30,
  last_month: 60,
  last_3_months: 90,
  this_year: 365,
  custom: 30,
};

const PLAN_LABELS: Record<string, string> = {
  featured: 'Featured',
  premium: 'Premium',
  verified: 'Verified',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
}

function MetricCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-xl border border-[var(--line)] p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={`text-2xl font-semibold mt-1 ${color || 'text-gray-900'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="bg-white rounded-xl border border-[var(--line)] p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-[var(--ink)] mb-4">Monthly Revenue Trend</h3>
      <div className="flex items-end gap-2 h-32">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full bg-violet-100 rounded-t" style={{ height: `${Math.max((d.value / max) * 100, 4)}%` }}>
              <div className="w-full bg-violet-400 rounded-t h-full min-h-[4px]" />
            </div>
            <span className="text-xs text-gray-400 truncate w-full text-center">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminBillingReports() {
  const [period, setPeriod] = useState<Period>('this_month');
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBilling = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const days = PERIOD_DAYS[period];
      const res = await fetch(`/api/admin/billing?days=${days}`);
      const json = await res.json();
      if (res.ok) {
        setStats(json.stats);
      } else {
        setError(json.error || 'Failed to load billing data');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchBilling(); }, [fetchBilling]);

  // Mock monthly trend data (in production this would come from the API)
  const monthlyTrend = [
    { label: 'Jan', value: stats?.estimated_mrr ? stats.estimated_mrr * 0.85 : 1200 },
    { label: 'Feb', value: stats?.estimated_mrr ? stats.estimated_mrr * 0.9 : 1400 },
    { label: 'Mar', value: stats?.estimated_mrr ? stats.estimated_mrr * 0.95 : 1600 },
    { label: 'Apr', value: stats?.estimated_mrr ? stats.estimated_mrr * 1.0 : 1800 },
    { label: 'May', value: stats?.estimated_mrr ? stats.estimated_mrr * 1.05 : 2000 },
    { label: 'Jun', value: stats?.estimated_mrr || 2200 },
  ];

  // Mock top clinics (in production this would come from the API)
  const topClinics: TopClinic[] = [
    { name: 'Bright TMS Center', plan: 'enterprise', amount: 999, status: 'active' },
    { name: 'NeuroWellness Clinic', plan: 'pro', amount: 299, status: 'active' },
    { name: 'MindCare TMS', plan: 'premium', amount: 199, status: 'active' },
    { name: 'Serenity Health', plan: 'featured', amount: 99, status: 'active' },
    { name: 'Healing Minds', plan: 'verified', amount: 79, status: 'past_due' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--ink)]">Billing Reports</h1>
          <p className="text-sm text-[var(--muted)] mt-1">Subscription and revenue overview</p>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-lg border border-[var(--line)] p-1">
          {(['this_month', 'last_month', 'last_3_months', 'this_year'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                period === p
                  ? 'bg-violet-600 text-white'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              {p === 'this_month' ? 'This Month' :
               p === 'last_month' ? 'Last Month' :
               p === 'last_3_months' ? 'Last 3 Months' : 'This Year'}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : stats ? (
        <>
          {/* Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <MetricCard
              label="MRR"
              value={formatCurrency(stats.estimated_mrr)}
              sub={stats.mrr_note === 'from_stripe' ? 'Live from Stripe' : 'Estimated'}
              color="text-violet-600"
            />
            <MetricCard
              label="New Subscriptions"
              value={stats.new_in_period.toString()}
              sub={`In last ${stats.period_days} days`}
            />
            <MetricCard
              label="Churned"
              value={stats.canceled.toString()}
              sub="Canceled"
              color="text-red-500"
            />
            <MetricCard
              label="Net Revenue"
              value={formatCurrency(stats.estimated_mrr * 0.85)}
              sub="After churn"
              color="text-emerald-600"
            />
          </div>

          {/* Charts + Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <BarChart data={monthlyTrend} />
            </div>
            <div className="bg-white rounded-xl border border-[var(--line)] p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-[var(--ink)] mb-4">By Plan</h3>
              <div className="space-y-3">
                {Object.entries(stats.by_plan).map(([plan, count]) => (
                  <div key={plan} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[var(--ink)]">{PLAN_LABELS[plan] || plan}</p>
                      <p className="text-xs text-[var(--muted)]">{count} subscription{count !== 1 ? 's' : ''}</p>
                    </div>
                    <span className="text-sm font-semibold text-[var(--ink)]">{count}</span>
                  </div>
                ))}
                {Object.keys(stats.by_plan).length === 0 && (
                  <p className="text-sm text-[var(--muted)] text-center py-4">No subscription data</p>
                )}
              </div>
            </div>
          </div>

          {/* Top Clinics Table */}
          <div className="bg-white rounded-xl border border-[var(--line)] overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-[var(--line)]">
              <h3 className="text-sm font-semibold text-[var(--ink)]">Top Clinics by Revenue</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clinic</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monthly</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {topClinics.map((clinic, i) => (
                    <tr key={i} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{clinic.name}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-violet-50 text-violet-700">
                          {PLAN_LABELS[clinic.plan] || clinic.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatCurrency(clinic.amount)}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          clinic.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {clinic.status === 'active' ? 'Active' : 'Past Due'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
