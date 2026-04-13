import { useState, useEffect, useCallback } from 'react';

interface OverviewStat {
  count: number;
  change: number;
}

interface DayData {
  date: string;
  count: number;
}

interface TypeData {
  type: string;
  count: number;
}

interface ClinicRank {
  id: string;
  name: string;
  location: string;
  count: number;
}

interface AnalyticsData {
  overview: {
    leads: OverviewStat;
    reviews: OverviewStat;
    clinics: OverviewStat;
    users: OverviewStat;
  };
  leadsByDay: DayData[];
  leadsByType: TypeData[];
  reviewsByDay: DayData[];
  clinicsByDay: DayData[];
  usersByDay: DayData[];
  topClinicsByLeads: ClinicRank[];
  topClinicsByReviews: ClinicRank[];
  days: number;
}

const RANGES = [
  { label: 'Last 7 days', value: 7 },
  { label: 'Last 30 days', value: 30 },
  { label: 'Last 90 days', value: 90 },
  { label: 'All time', value: 365 },
];

const TYPE_COLORS: Record<string, string> = {
  specialist_enquiry: 'bg-violet-500',
  lead_magnet: 'bg-blue-500',
  newsletter: 'bg-emerald-500',
  quiz_lead: 'bg-amber-500',
};

function StatCard({ label, stat }: { label: string; stat: OverviewStat }) {
  const isPositive = stat.change >= 0;
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-3xl font-semibold text-gray-900 mt-2">{stat.count.toLocaleString()}</p>
      <div className="mt-2 flex items-center gap-1">
        <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? '+' : ''}{stat.change}%
        </span>
        <span className="text-xs text-gray-400">vs previous period</span>
      </div>
    </div>
  );
}

function BarChart({ data, color = 'bg-violet-500', label }: { data: DayData[]; color?: string; label: string }) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">{label}</h3>
        <div className="h-40 flex items-center justify-center text-gray-400 text-sm">No data</div>
      </div>
    );
  }
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">{label}</h3>
      <div className="flex items-end gap-[2px] h-40">
        {data.map((d) => (
          <div
            key={d.date}
            className={`flex-1 ${color} rounded-t transition-all hover:opacity-80 min-w-[3px]`}
            style={{ height: `${Math.max((d.count / maxCount) * 100, 2)}%` }}
            title={`${d.date}: ${d.count}`}
          />
        ))}
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-[10px] text-gray-400">{data[0]?.date}</span>
        <span className="text-[10px] text-gray-400">{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}

function HorizontalBarChart({ data, color = 'bg-violet-500', label }: { data: ClinicRank[]; color?: string; label: string }) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">{label}</h3>
        <div className="h-40 flex items-center justify-center text-gray-400 text-sm">No data</div>
      </div>
    );
  }
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">{label}</h3>
      <div className="space-y-2">
        {data.map((d) => (
          <div key={d.id}>
            <div className="flex items-center justify-between text-xs mb-0.5">
              <span className="text-gray-700 truncate max-w-[200px]" title={d.name}>{d.name}</span>
              <span className="text-gray-500 ml-2 shrink-0">{d.count}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className={`${color} h-2 rounded-full transition-all`}
                style={{ width: `${(d.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TypeBreakdown({ data }: { data: TypeData[] }) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Lead Breakdown by Type</h3>
        <div className="h-40 flex items-center justify-center text-gray-400 text-sm">No data</div>
      </div>
    );
  }
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Lead Breakdown by Type</h3>
      <div className="space-y-3">
        {data.map((d) => {
          const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
          const color = TYPE_COLORS[d.type] || 'bg-gray-500';
          return (
            <div key={d.type}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-700 capitalize">{d.type.replace(/_/g, ' ')}</span>
                <span className="text-gray-500">{d.count} ({pct}%)</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div className={`${color} h-2.5 rounded-full`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?days=${days}`);
      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      if (!res.ok) throw new Error('Failed to load analytics');
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-gray-300 border-t-violet-600 rounded-full animate-spin mb-4" />
          <p className="text-gray-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p>Failed to load analytics data.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Analytics</h1>
          <p className="text-gray-500 mt-1">Performance overview</p>
        </div>
        <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setDays(r.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                days === r.value
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard label="Leads" stat={data.overview.leads} />
        <StatCard label="Reviews" stat={data.overview.reviews} />
        <StatCard label="New Clinics" stat={data.overview.clinics} />
        <StatCard label="New Users" stat={data.overview.users} />
      </div>

      {/* Charts - row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <BarChart data={data.leadsByDay} color="bg-violet-500" label="Leads Over Time" />
        <TypeBreakdown data={data.leadsByType} />
      </div>

      {/* Charts - row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <BarChart data={data.reviewsByDay} color="bg-amber-500" label="Reviews Over Time" />
        <BarChart data={data.clinicsByDay} color="bg-emerald-500" label="New Clinics Over Time" />
      </div>

      {/* Top clinics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HorizontalBarChart data={data.topClinicsByLeads} color="bg-violet-500" label="Top Clinics by Leads" />
        <HorizontalBarChart data={data.topClinicsByReviews} color="bg-amber-500" label="Top Clinics by Reviews" />
      </div>
    </div>
  );
}
