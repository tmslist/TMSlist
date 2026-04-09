import { useState, useEffect } from 'react';

interface Stats {
  [event: string]: {
    today: number;
    week: number;
    month: number;
    total: number;
  };
}

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'total'>('month');

  useEffect(() => {
    fetch('/api/analytics/stats')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.stats) setStats(d.stats); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-slate-50 rounded-xl p-6 text-center">
        <p className="text-sm text-slate-400">Analytics will appear once your clinic starts receiving traffic.</p>
      </div>
    );
  }

  const metrics = [
    { key: 'profile_view', label: 'Profile Views', icon: '👁', color: '#2563eb' },
    { key: 'phone_click', label: 'Phone Clicks', icon: '📞', color: '#059669' },
    { key: 'website_click', label: 'Website Clicks', icon: '🌐', color: '#7c3aed' },
    { key: 'search_impression', label: 'Search Impressions', icon: '🔍', color: '#d97706' },
    { key: 'lead_submit', label: 'Leads Submitted', icon: '📥', color: '#dc2626' },
  ];

  const periodLabels = { today: 'Today', week: 'This Week', month: 'This Month', total: 'All Time' };

  return (
    <div>
      {/* Period selector */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-6 w-fit">
        {(['today', 'week', 'month', 'total'] as const).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              period === p ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {periodLabels[p]}
          </button>
        ))}
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {metrics.map(m => {
          const value = stats[m.key]?.[period] || 0;
          const prevValue = period === 'week' ? (stats[m.key]?.month || 0) :
                           period === 'month' ? (stats[m.key]?.total || 0) : 0;

          return (
            <div key={m.key} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg">{m.icon}</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">{value.toLocaleString()}</div>
              <div className="text-xs text-slate-400 font-medium mt-1">{m.label}</div>
            </div>
          );
        })}
      </div>

      {/* Conversion funnel */}
      <div className="mt-6 bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Conversion Funnel ({periodLabels[period]})</h3>
        <div className="space-y-3">
          {(() => {
            const impressions = stats.search_impression?.[period] || 0;
            const views = stats.profile_view?.[period] || 0;
            const clicks = (stats.phone_click?.[period] || 0) + (stats.website_click?.[period] || 0);
            const leads = stats.lead_submit?.[period] || 0;

            const steps = [
              { label: 'Search Impressions', value: impressions, color: '#d97706' },
              { label: 'Profile Views', value: views, color: '#2563eb' },
              { label: 'Contact Actions', value: clicks, color: '#7c3aed' },
              { label: 'Leads Submitted', value: leads, color: '#dc2626' },
            ];

            const maxVal = Math.max(...steps.map(s => s.value), 1);

            return steps.map(step => (
              <div key={step.label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-500 font-medium">{step.label}</span>
                  <span className="text-slate-700 font-semibold">{step.value.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(step.value / maxVal) * 100}%`, backgroundColor: step.color }} />
                </div>
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
}
