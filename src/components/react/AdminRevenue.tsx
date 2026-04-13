import { useState, useEffect } from 'react';

interface PlanCount {
  plan: string;
  count: number;
}

interface StatusCount {
  status: string;
  count: number;
}

interface Subscription {
  id: string;
  clinicId: string;
  plan: string;
  status: string;
  createdAt: string;
  stripeSubscriptionId?: string;
}

interface RevenueData {
  mrr: number;
  byPlan: PlanCount[];
  byStatus: StatusCount[];
  recent: Subscription[];
}

const PLAN_COLORS: Record<string, { bar: string; bg: string; text: string }> = {
  verified: { bar: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
  featured: { bar: 'bg-violet-500', bg: 'bg-violet-50', text: 'text-violet-700' },
  premium: { bar: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' },
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800',
  canceled: 'bg-red-100 text-red-800',
  past_due: 'bg-amber-100 text-amber-800',
  trialing: 'bg-blue-100 text-blue-800',
  paused: 'bg-gray-100 text-gray-700',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminRevenue() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/revenue')
      .then(r => {
        if (r.status === 401) { window.location.href = '/admin/login'; return null; }
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then(d => { if (d) setData(d); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

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
        Failed to load revenue data. {error}
      </div>
    );
  }

  const totalActive = data.byPlan.reduce((s, p) => s + Number(p.count), 0);
  const maxPlanCount = Math.max(...data.byPlan.map(p => Number(p.count)), 1);

  return (
    <div className="space-y-8">
      {/* MRR + Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-violet-600 to-violet-700 rounded-xl p-6 text-white shadow-lg col-span-1">
          <p className="text-sm font-medium text-violet-200">Monthly Recurring Revenue</p>
          <p className="text-4xl font-bold mt-2">{formatCurrency(data.mrr)}</p>
          <p className="text-sm text-violet-200 mt-1">MRR</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Active Subscriptions</p>
          <p className="text-3xl font-semibold text-gray-900 mt-2">{totalActive}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Projected ARR</p>
          <p className="text-3xl font-semibold text-emerald-600 mt-2">{formatCurrency(data.mrr * 12)}</p>
        </div>
      </div>

      {/* Active Subs by Plan */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Subscriptions by Plan</h2>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
          {data.byPlan.length === 0 ? (
            <p className="text-gray-500 text-sm">No active subscriptions yet.</p>
          ) : (
            data.byPlan.map(p => {
              const colors = PLAN_COLORS[p.plan] || { bar: 'bg-gray-400', bg: 'bg-gray-50', text: 'text-gray-700' };
              const count = Number(p.count);
              const widthPct = Math.max((count / maxPlanCount) * 100, 4);
              return (
                <div key={p.plan}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium capitalize ${colors.text}`}>{p.plan}</span>
                    <span className="text-sm font-semibold text-gray-900">{count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${colors.bar} transition-all duration-500`}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Status Breakdown */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Status Breakdown</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {data.byStatus.map(s => (
            <div key={s.status} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm text-center">
              <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_COLORS[s.status] || 'bg-gray-100 text-gray-700'}`}>
                {s.status.replace(/_/g, ' ')}
              </span>
              <p className="text-2xl font-bold text-gray-900 mt-3">{Number(s.count)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Subscriptions Table */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Subscriptions</h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {data.recent.length === 0 ? (
            <p className="p-6 text-gray-500 text-sm">No subscriptions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clinic ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.recent.map(sub => (
                    <tr key={sub.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 capitalize">{sub.plan}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[sub.status] || 'bg-gray-100 text-gray-700'}`}>
                          {sub.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                        {sub.clinicId ? sub.clinicId.slice(0, 8) + '...' : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {sub.createdAt ? formatDate(sub.createdAt) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
