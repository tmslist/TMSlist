import { useState, useEffect, useCallback } from 'react';

interface SubscriptionMetrics {
  mrr: number;
  arr: number;
  churn: number;
  ltv: number;
  activeCount: number;
  canceledCount: number;
  pastDueCount: number;
  trialCount: number;
}

interface PaymentStats {
  processed: number;
  pending: number;
  failed: number;
  refunds: number;
  disputes: number;
}

interface PlanBreakdown {
  plan: string;
  count: number;
  revenue: number;
  price: number;
}

interface RevenueTrend {
  month: string;
  mrr: number;
  churnRate: number;
  newSubs: number;
}

interface FinancialData {
  metrics: SubscriptionMetrics;
  payments: PaymentStats;
  byPlan: PlanBreakdown[];
  trends: RevenueTrend[];
  recentCancellations: { clinicId: string; plan: string; canceledAt: string }[];
}

const PLAN_COLORS: Record<string, { bar: string; badge: string }> = {
  verified: { bar: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700' },
  featured: { bar: 'bg-violet-500', badge: 'bg-violet-50 text-violet-700' },
  pro: { bar: 'bg-cyan-500', badge: 'bg-cyan-50 text-cyan-700' },
  premium: { bar: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700' },
  enterprise: { bar: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700' },
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800',
  canceled: 'bg-red-100 text-red-800',
  past_due: 'bg-amber-100 text-amber-800',
  trialing: 'bg-blue-100 text-blue-800',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function MetricCard({ label, value, sub, accent, trend }: {
  label: string;
  value: string;
  sub?: string;
  accent?: 'violet' | 'emerald' | 'amber' | 'red' | 'blue';
  trend?: { value: string; positive: boolean };
}) {
  const accentMap = {
    violet: 'from-violet-600 to-violet-700',
    emerald: 'bg-emerald-50 border-emerald-200',
    amber: 'bg-amber-50 border-amber-200',
    red: 'bg-red-50 border-red-200',
    blue: 'bg-blue-50 border-blue-200',
  };
  const cardClass = accent
    ? accent === 'violet'
      ? `bg-gradient-to-br ${accentMap.violet} text-white`
      : `border ${accentMap[accent]}`
    : 'bg-white border-gray-200';

  return (
    <div className={`rounded-xl p-5 shadow-sm ${cardClass} ${!accent ? 'border' : ''}`}>
      <p className={`text-xs font-medium uppercase tracking-wide ${accent === 'violet' ? 'text-violet-200' : 'text-gray-500'}`}>
        {label}
      </p>
      <p className={`text-2xl font-bold mt-1 ${accent === 'violet' ? 'text-white' : 'text-gray-900'}`}>
        {value}
      </p>
      {sub && (
        <p className={`text-xs mt-1 ${accent === 'violet' ? 'text-violet-200' : 'text-gray-400'}`}>
          {sub}
        </p>
      )}
      {trend && (
        <p className={`text-xs mt-1 font-medium ${trend.positive ? 'text-emerald-600' : 'text-red-500'}`}>
          {trend.positive ? '+' : ''}{trend.value} vs last month
        </p>
      )}
    </div>
  );
}

export default function AdminFinancialDashboard() {
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('30');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/revenue?full=true&period=${period}`);
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to load financial data');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load financial data');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
        Failed to load financial data. {error}
      </div>
    );
  }

  const maxPlanCount = Math.max(...data.byPlan.map(p => p.count), 1);

  return (
    <div className="space-y-8">
      {/* Period Filter */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-500">View:</span>
        {[
          { key: '30', label: '30 days' },
          { key: '90', label: '90 days' },
          { key: '180', label: '6 months' },
          { key: '365', label: '1 year' },
        ].map(p => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              period === p.key
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={fetchData}
          className="ml-auto px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100"
        >
          Refresh
        </button>
      </div>

      {/* MRR / ARR Hero */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-violet-600 to-violet-700 rounded-xl p-6 text-white shadow-lg col-span-1">
          <p className="text-sm font-medium text-violet-200">Monthly Recurring Revenue</p>
          <p className="text-4xl font-bold mt-2">{formatCurrency(data.metrics.mrr)}</p>
          <p className="text-sm text-violet-200 mt-1">MRR</p>
          {data.trends.length > 0 && data.trends[data.trends.length - 1] && (
            <p className="text-xs text-violet-300 mt-2">
              {data.trends[data.trends.length - 1].newSubs} new subs this month
            </p>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Annual Recurring Revenue</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(data.metrics.arr)}</p>
          <p className="text-xs text-gray-400 mt-1">ARR (MRR x 12)</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Monthly Churn Rate</p>
          <p className={`text-3xl font-bold mt-2 ${
            data.metrics.churn < 5 ? 'text-emerald-600' :
            data.metrics.churn < 10 ? 'text-amber-600' : 'text-red-600'
          }`}>
            {data.metrics.churn.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {data.metrics.canceledCount} cancellations
          </p>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Active Subscriptions"
          value={data.metrics.activeCount.toString()}
          sub={`${data.metrics.trialCount} trialing`}
          accent="blue"
        />
        <MetricCard
          label="Avg LTV"
          value={formatCurrency(data.metrics.ltv)}
          sub="Lifetime value per customer"
        />
        <MetricCard
          label="Past Due"
          value={data.metrics.pastDueCount.toString()}
          sub="Payments overdue"
          accent="amber"
        />
        <MetricCard
          label="Disputes"
          value={data.payments.disputes.toString()}
          sub="Chargebacks & disputes"
          accent="red"
        />
      </div>

      {/* Revenue Trends */}
      {data.trends.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trends</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">MRR</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">New Subs</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Churn Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[...data.trends].reverse().map(trend => (
                    <tr key={trend.month} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(trend.month)}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{formatCurrency(trend.mrr)}</td>
                      <td className="px-4 py-3 text-sm text-emerald-600 text-right font-medium">{trend.newSubs}</td>
                      <td className="px-4 py-3 text-sm text-right">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          trend.churnRate < 5 ? 'bg-emerald-100 text-emerald-700' :
                          trend.churnRate < 10 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {trend.churnRate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Breakdown by Plan */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscription Breakdown by Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bar chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            {data.byPlan.length === 0 ? (
              <p className="text-gray-500 text-sm">No data available.</p>
            ) : (
              <div className="space-y-4">
                {data.byPlan.map(p => {
                  const colors = PLAN_COLORS[p.plan] || { bar: 'bg-gray-400', badge: 'bg-gray-50 text-gray-700' };
                  const count = Number(p.count);
                  const widthPct = Math.max((count / maxPlanCount) * 100, 4);
                  return (
                    <div key={p.plan}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium capitalize ${colors.badge.split(' ')[1]}`}>
                            {p.plan}
                          </span>
                          <span className="text-xs text-gray-400">{count}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-gray-900">{formatCurrency(p.revenue)}</span>
                          <span className="text-xs text-gray-400 ml-1">/mo</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${colors.bar} transition-all duration-500`}
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Summary stats */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Payment Processing</h3>
            <div className="space-y-3">
              {[
                { label: 'Processed', value: formatCurrency(data.payments.processed), color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Pending', value: formatCurrency(data.payments.pending), color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Failed', value: formatCurrency(data.payments.failed), color: 'text-red-600', bg: 'bg-red-50' },
                { label: 'Refunds', value: formatCurrency(data.payments.refunds), color: 'text-gray-600', bg: 'bg-gray-50' },
              ].map(item => (
                <div key={item.label} className={`flex items-center justify-between p-3 rounded-lg ${item.bg}`}>
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  <span className={`text-sm font-semibold ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Cancellations */}
      {data.recentCancellations.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Cancellations</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clinic ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Canceled At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.recentCancellations.map(c => (
                    <tr key={`${c.clinicId}-${c.canceledAt}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500 font-mono">{c.clinicId.slice(0, 8)}...</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 capitalize">{c.plan}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatDate(c.canceledAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
