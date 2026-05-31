import { useState, useEffect } from 'react';

interface LeadSource {
  source: string;
  count: number;
  percentage: number;
}

interface FunnelData {
  formViews: number;
  leadsSubmitted: number;
  appointmentsBooked: number;
  appointmentsCompleted: number;
  conversionRate: number;
}

interface BenchmarkData {
  avgLeadsPerWeek: number;
  yourLeadsPerWeek: number;
  percentile: number;
  gapToNextTier: number;
}

interface DashboardData {
  leadsThisWeek: number;
  leadsLastWeek: number;
  leadsTrend: number;
  appointmentsThisWeek: number;
  appointmentsLastWeek: number;
  appointmentsTrend: number;
  profileViewsThisWeek: number;
  profileViewsLastWeek: number;
  viewsTrend: number;
  rankingPosition: { keyword: string; position: number; change: number }[];
  leadSources: LeadSource[];
  funnel: FunnelData;
  benchmark: BenchmarkData;
  upgradeTriggers: {
    title: string;
    description: string;
    ctaLabel: string;
    ctaUrl: string;
    impact: 'high' | 'medium';
  }[];
}

function MetricCard({ label, value, trend, subtext }: { label: string; value: number; trend: number; subtext?: string }) {
  return (
    <div className="bg-white rounded-xl border border-[var(--line)] p-5 shadow-sm">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-bold text-[var(--ink)] mt-1">{value}</p>
      <div className="flex items-center gap-2 mt-2">
        {trend > 0 && (
          <span className="inline-flex items-center text-emerald-600 text-sm font-medium">
            <svg className="w-4 h-4 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            +{trend}%
          </span>
        )}
        {trend < 0 && (
          <span className="inline-flex items-center text-red-600 text-sm font-medium">
            <svg className="w-4 h-4 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            {trend}%
          </span>
        )}
        {trend === 0 && <span className="text-gray-400 text-sm">No change</span>}
        {subtext && <span className="text-gray-400 text-xs">vs last week</span>}
      </div>
    </div>
  );
}

function SourceBar({ source, percentage }: { source: string; percentage: number }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-sm text-gray-600 w-24 truncate">{source}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-medium text-gray-900 w-10 text-right">{percentage}%</span>
    </div>
  );
}

function FunnelStep({ label, value, percentage, isLast }: { label: string; value: number; percentage: number; isLast: boolean }) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-32 text-sm text-gray-600">{label}</div>
      <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden relative">
        <div
          className={`h-full rounded-full transition-all duration-500 ${isLast ? 'bg-emerald-500' : 'bg-blue-500'}`}
          style={{ width: `${percentage}%` }}
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-white">
          {value}
        </span>
      </div>
      <span className="text-sm text-gray-500 w-12 text-right">{percentage}%</span>
    </div>
  );
}

function UpgradeCard({ trigger }: { trigger: DashboardData['upgradeTriggers'][0] }) {
  const impactColors = {
    high: 'bg-amber-50 border-amber-200 text-amber-900',
    medium: 'bg-blue-50 border-blue-200 text-blue-900',
  };

  return (
    <div className={`rounded-lg border p-4 ${impactColors[trigger.impact]}`}>
      <div className="flex items-start justify-between">
        <div>
          <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-2 ${
            trigger.impact === 'high' ? 'bg-amber-200 text-amber-800' : 'bg-blue-200 text-blue-800'
          }`}>
            {trigger.impact === 'high' ? 'High Impact' : 'Medium Impact'}
          </span>
          <p className="font-semibold text-sm">{trigger.title}</p>
          <p className="text-xs mt-1 opacity-80">{trigger.description}</p>
        </div>
        <a
          href={trigger.ctaUrl}
          className="inline-flex items-center text-xs font-medium hover:underline whitespace-nowrap ml-4"
        >
          {trigger.ctaLabel}
          <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </div>
  );
}

export default function PortalRevenueDashboard({ userId }: { userId: string }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/portal/revenue-dashboard')
      .then((r) => r.ok ? r.json() : Promise.reject(new Error('Failed to load')))
      .then((d) => { setData(d); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [userId]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-[var(--line)] p-5 h-28" />
          ))}
        </div>
        <div className="bg-white rounded-xl border border-[var(--line)] p-6 h-64" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-amber-800 text-sm">Unable to load revenue dashboard. Please try again later.</p>
      </div>
    );
  }

  // Calculate funnel percentages (relative to form views)
  const funnelMax = data.funnel.formViews || 1;
  const funnelSteps = [
    { label: 'Form Views', value: data.funnel.formViews, pct: 100 },
    { label: 'Leads', value: data.funnel.leadsSubmitted, pct: Math.round((data.funnel.leadsSubmitted / funnelMax) * 100) },
    { label: 'Appointments', value: data.funnel.appointmentsBooked, pct: Math.round((data.funnel.appointmentsBooked / funnelMax) * 100) },
    { label: 'Completed', value: data.funnel.appointmentsCompleted, pct: Math.round((data.funnel.appointmentsCompleted / funnelMax) * 100) },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Leads" value={data.leadsThisWeek} trend={data.leadsTrend} />
        <MetricCard label="Appointments" value={data.appointmentsThisWeek} trend={data.appointmentsTrend} />
        <MetricCard label="Profile Views" value={data.profileViewsThisWeek} trend={data.viewsTrend} />
        <MetricCard
          label="Ranking"
          value={data.rankingPosition[0]?.position || 0}
          trend={data.rankingPosition[0]?.change || 0}
          subtext="position"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Sources */}
        <div className="bg-white rounded-xl border border-[var(--line)] p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-[var(--ink)] mb-4">Lead Sources</h3>
          {data.leadSources.length > 0 ? (
            <div className="space-y-1">
              {data.leadSources.map((src) => (
                <SourceBar key={src.source} source={src.source} percentage={src.percentage} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No lead source data yet.</p>
          )}
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white rounded-xl border border-[var(--line)] p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-[var(--ink)] mb-4">Conversion Funnel</h3>
          <div className="space-y-3">
            {funnelSteps.map((step, idx) => (
              <FunnelStep
                key={step.label}
                label={step.label}
                value={step.value}
                percentage={step.pct}
                isLast={idx === funnelSteps.length - 1}
              />
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Overall conversion</span>
              <span className="font-semibold text-emerald-600">{data.funnel.conversionRate}%</span>
            </div>
          </div>
        </div>

        {/* Benchmark */}
        <div className="bg-white rounded-xl border border-[var(--line)] p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-[var(--ink)] mb-4">Benchmark</h3>
          <div className="text-center">
            <div className="relative inline-flex items-center justify-center w-24 h-24 mb-4">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle cx="48" cy="48" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                <circle
                  cx="48" cy="48" r="40" fill="none"
                  stroke={data.benchmark.percentile >= 70 ? '#10b981' : data.benchmark.percentile >= 40 ? '#3b82f6' : '#f59e0b'}
                  strokeWidth="8"
                  strokeDasharray={`${(data.benchmark.percentile / 100) * 251.2} 251.2`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-[var(--ink)]">{data.benchmark.percentile}%</span>
              </div>
            </div>
            <p className="text-sm text-gray-600">You're in the top {100 - data.benchmark.percentile}% of similar clinics</p>
            <div className="mt-3 flex justify-between text-xs text-gray-500">
              <span>Your: {data.benchmark.yourLeadsPerWeek} leads/wk</span>
              <span>Avg: {data.benchmark.avgLeadsPerWeek} leads/wk</span>
            </div>
            {data.benchmark.gapToNextTier > 0 && (
              <p className="mt-2 text-xs text-amber-600">
                +{data.benchmark.gapToNextTier} health points to rank higher
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Upgrade Triggers */}
      {data.upgradeTriggers.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Opportunities</h3>
          {data.upgradeTriggers.map((trigger, idx) => (
            <UpgradeCard key={idx} trigger={trigger} />
          ))}
        </div>
      )}
    </div>
  );
}