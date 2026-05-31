import { useState, useEffect } from 'react';

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

interface SubscriptionRow {
  id: string;
  clinicId: string;
  plan: string;
  status: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  billingCurrency: string | null;
  currentPeriodEnd: Date | null;
  createdAt: Date;
  clinicName: string | null;
  clinicSlug: string | null;
}

interface SubscriptionsResponse {
  data: SubscriptionRow[];
  stats: { total: number; active: number; returned: number };
  error: string | null;
}

const PLAN_LABELS: Record<string, string> = {
  featured: 'Featured',
  premium: 'Premium',
  verified: 'Verified',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  canceled: 'bg-gray-100 text-gray-600',
  past_due: 'bg-red-100 text-red-800',
};

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-[var(--line)] p-5 shadow-sm">
      <p className="text-sm font-medium text-[var(--muted)]">{label}</p>
      <p className="text-3xl font-semibold text-[var(--ink)] mt-1">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {sub && <p className="text-xs text-[var(--muted)] mt-1">{sub}</p>}
    </div>
  );
}

function PlanBar({ plan, count, total }: { plan: string; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 text-sm text-[var(--ink2)]">{PLAN_LABELS[plan] ?? plan}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div
          className="bg-[var(--ink2)] h-2 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-sm text-right text-[var(--muted)]">{count}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {status}
    </span>
  );
}

export default function AdminBilling() {
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([]);
  const [totalSubs, setTotalSubs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'subscriptions'>('overview');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const limit = 25;

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const [billingRes, subsRes] = await Promise.all([
        fetch('/api/admin/billing'),
        fetch(`/api/admin/subscriptions?limit=${limit}`),
      ]);
      if (!billingRes.ok || !subsRes.ok) throw new Error('Failed to load');
      const billingData = await billingRes.json();
      const subsData: SubscriptionsResponse = await subsRes.json();
      setStats(billingData.stats);
      setSubscriptions(subsData.data ?? []);
      setTotalSubs(subsData.stats?.total ?? 0);
    } catch (e) {
      setError('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  }

  async function fetchSubscriptions(resetPage = false) {
    setLoading(true);
    try {
      const offset = resetPage ? 0 : page * limit;
      const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/subscriptions?${params}`);
      const data: SubscriptionsResponse = await res.json();
      setSubscriptions(data.data ?? []);
      setTotalSubs(data.stats?.total ?? 0);
    } catch {
      setError('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (activeTab === 'subscriptions') fetchSubscriptions();
  }, [activeTab, statusFilter, page]);

  if (loading && !stats) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
        {error}
      </div>
    );
  }

  const planEntries = stats ? Object.entries(stats.by_plan) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--ink)]">Billing & Subscriptions</h2>
          <p className="text-sm text-[var(--muted)] mt-0.5">Overview of all clinic subscriptions and revenue</p>
        </div>
        {!stats?.stripe_configured && (
          <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
            Stripe not configured — showing estimates
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--line)]">
        {(['overview', 'subscriptions'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'text-[var(--ink)] border-b-2 border-[var(--ink)]'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && stats && (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Subscriptions" value={stats.total} sub={`Last ${stats.period_days} days`} />
            <StatCard label="Active" value={stats.active} sub="Currently paying" />
            <StatCard label="New This Period" value={stats.new_in_period} />
            <StatCard
              label="Est. Monthly Revenue"
              value={`$${stats.estimated_mrr.toLocaleString()}`}
              sub={stats.mrr_note === 'estimate_only' ? 'Plan-based estimate' : 'From Stripe'}
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard label="Canceled" value={stats.canceled} />
            <StatCard label="Past Due" value={stats.past_due} />
            <StatCard label="Expiring in 7 Days" value={stats.expiring_soon} />
          </div>

          {/* Plan Breakdown */}
          {planEntries.length > 0 && (
            <div className="bg-white rounded-xl border border-[var(--line)] p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-[var(--ink2)] mb-4">Subscriptions by Plan</h3>
              <div className="space-y-3">
                {planEntries.map(([plan, count]) => (
                  <PlanBar key={plan} plan={plan} count={count} total={stats.total} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'subscriptions' && (
        <>
          {/* Filters */}
          <div className="flex gap-3 items-center">
            <input
              type="text"
              placeholder="Search clinic, Stripe ID..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="flex-1 border border-[var(--line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ink)]"
            />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              className="border border-[var(--line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ink)]"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="canceled">Canceled</option>
              <option value="past_due">Past Due</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-[var(--line)] shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--line)] bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-[var(--muted)]">Clinic</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--muted)]">Plan</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--muted)]">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--muted)]">Renews</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-[var(--muted)]">No subscriptions found</td>
                  </tr>
                ) : (
                  subscriptions.map((sub) => (
                    <tr key={sub.id} className="border-t border-[var(--line)] hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-[var(--ink)]">
                        {sub.clinicName ?? sub.clinicId.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 text-[var(--ink2)]">
                        {PLAN_LABELS[sub.plan] ?? sub.plan}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={sub.status} />
                      </td>
                      <td className="px-4 py-3 text-[var(--muted)]">
                        {sub.currentPeriodEnd
                          ? new Date(sub.currentPeriodEnd).toLocaleDateString()
                          : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalSubs > limit && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--muted)]">
                Showing {page * limit + 1}–{Math.min((page + 1) * limit, totalSubs)} of {totalSubs}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 text-sm border border-[var(--line)] rounded-lg disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={(page + 1) * limit >= totalSubs}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 text-sm border border-[var(--line)] rounded-lg disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}