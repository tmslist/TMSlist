import { useState, useEffect, useCallback } from 'react';

interface OverviewStat {
  count: number;
  change: number;
}

interface DayData {
  day: string;
  count: number;
}

interface TypeData {
  type: string;
  count: number;
}

interface Lead {
  id: string;
  type: string;
  name: string | null;
  email: string | null;
  message: string | null;
  createdAt: string;
}

interface Review {
  id: string;
  rating: number | null;
  comment: string | null;
  reviewerName: string | null;
  approved: boolean;
  createdAt: string;
}

interface ClinicAnalyticsData {
  clinic: {
    id: string;
    name: string;
    isFeatured: boolean;
    subscriptionTier: string | null;
  };
  overview: {
    leads: OverviewStat;
    reviews: OverviewStat;
  };
  leadsByDay: DayData[];
  leadsByType: TypeData[];
  reviewsByDay: DayData[];
  recentLeads: Lead[];
  recentReviews: Review[];
  days: number;
  updatedAt: string;
}

interface ClinicAnalyticsProps {
  clinicId: string;
  clinicName: string;
  isFeatured?: boolean;
}

const RANGES = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
];

const LEAD_TYPE_LABELS: Record<string, string> = {
  specialist_enquiry: 'Appointment Requests',
  lead_magnet: 'Lead Magnets',
  newsletter: 'Newsletter',
  quiz_lead: 'Quiz Leads',
  callback_request: 'Callbacks',
};

const LEAD_TYPE_COLORS: Record<string, string> = {
  specialist_enquiry: 'bg-violet-500',
  lead_magnet: 'bg-blue-500',
  newsletter: 'bg-emerald-500',
  quiz_lead: 'bg-amber-500',
  callback_request: 'bg-rose-500',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function StatCard({ label, stat }: { label: string; stat: OverviewStat }) {
  const isPositive = stat.change >= 0;
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{stat.count}</p>
      {stat.change !== 0 && (
        <p className={`text-xs font-semibold mt-1 ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
          {isPositive ? '+' : ''}{stat.change}% vs prev period
        </p>
      )}
    </div>
  );
}

function SimpleBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-slate-600 w-8 text-right">{value}</span>
    </div>
  );
}

export default function ClinicAnalytics({ clinicId, clinicName, isFeatured }: ClinicAnalyticsProps) {
  const [data, setData] = useState<ClinicAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/clinic/analytics?clinicId=${clinicId}&days=${days}`);
      if (res.status === 401) {
        setError('Sign in to view your analytics');
        setLoading(false);
        return;
      }
      if (res.status === 403) {
        setError('You do not have access to this clinic\'s analytics');
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError('Failed to load analytics');
      console.error('[ClinicAnalytics]', e);
    } finally {
      setLoading(false);
    }
  }, [clinicId, days]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  if (error) {
    return (
      <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6 text-center">
        <svg className="w-8 h-8 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-sm text-slate-500">{error}</p>
        {!error.includes('Sign in') && (
          <button onClick={fetchAnalytics} className="mt-3 text-xs text-violet-600 font-semibold hover:underline">
            Try again
          </button>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-slate-50 rounded-2xl border border-slate-100 p-8 text-center">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-200 rounded w-1/3 mx-auto" />
          <div className="h-8 bg-slate-200 rounded w-1/2 mx-auto" />
          <div className="h-4 bg-slate-200 rounded w-1/4 mx-auto" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const maxLeadsDay = Math.max(...data.leadsByDay.map(d => d.count), 1);
  const maxType = Math.max(...data.leadsByType.map(d => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Your Clinic Analytics</h3>
            <p className="text-xs text-slate-500">Performance for <span className="font-medium">{clinicName}</span></p>
          </div>
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {RANGES.map(r => (
            <button
              key={r.value}
              onClick={() => setDays(r.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                days === r.value
                  ? 'bg-white text-violet-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Featured badge */}
      {data.clinic.isFeatured && (
        <div className="flex items-center gap-2 bg-violet-50 border border-violet-100 rounded-xl px-4 py-3">
          <svg className="w-4 h-4 text-violet-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
          <span className="text-xs font-bold text-violet-700">
            Featured Listing — Your clinic gets priority placement and visibility
          </span>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Patient Enquiries" stat={data.overview.leads} />
        <StatCard label="New Reviews" stat={data.overview.reviews} />
      </div>

      {/* Leads by Day Chart */}
      {data.leadsByDay.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">Enquiries Over Time</h4>
          <div className="space-y-2">
            {data.leadsByDay.slice(-14).map((d) => (
              <div key={d.day} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-16 shrink-0">{formatDate(d.day)}</span>
                <div className="flex-1 h-4 bg-slate-50 rounded overflow-hidden">
                  <div
                    className="h-full bg-violet-500 rounded transition-all"
                    style={{ width: `${Math.round((d.count / maxLeadsDay) * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-700 w-4 text-right">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leads by Type */}
      {data.leadsByType.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">Enquiry Sources</h4>
          <div className="space-y-3">
            {data.leadsByType.map((t) => (
              <div key={t.type}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-700">
                    {LEAD_TYPE_LABELS[t.type] || t.type}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">{t.count}</span>
                </div>
                <SimpleBar value={t.count} max={maxType} color={LEAD_TYPE_COLORS[t.type] || 'bg-violet-500'} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Enquiries */}
      {data.recentLeads.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">Recent Enquiries</h4>
          <div className="space-y-2">
            {data.recentLeads.slice(0, 5).map((lead) => (
              <div key={lead.id} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
                <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-violet-600">
                    {(lead.name || lead.email || '?')[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {lead.name || lead.email || 'Anonymous'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {LEAD_TYPE_LABELS[lead.type] || lead.type}
                    {lead.message && ` — "${lead.message.slice(0, 40)}"`}
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0">{formatDate(lead.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No data state */}
      {data.overview.leads.count === 0 && data.overview.reviews.count === 0 && (
        <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-100">
          <svg className="w-10 h-10 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm text-slate-500 font-medium">No data yet for this period</p>
          <p className="text-xs text-slate-400 mt-1">Enquiries and reviews will appear here as patients interact with your listing</p>
        </div>
      )}

      <p className="text-center text-[10px] text-slate-400">
        Updated {formatDateTime(data.updatedAt)}
      </p>
    </div>
  );
}
