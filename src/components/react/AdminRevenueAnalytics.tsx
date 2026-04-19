import { useState, useCallback } from 'react';

// ── Types (revenueMetrics schema) ─────────────────────────────────────────────

interface MrrDataPoint {
  month: string;
  mrr: number;
  arr: number;
  growth: number;
}

interface RevenueSegment {
  label: string;
  value: number;
  percentage: number;
}

interface ChurnData {
  month: string;
  churnRate: number;
  churned: number;
  activeStart: number;
}

interface LTVData {
  plan: string;
  avgLTV: number;
  avgMonths: number;
  cohortSize: number;
}

const REGIONS = ['North America', 'Europe', 'APAC', 'LATAM', 'Other'];
const PLANS = ['verified', 'featured', 'premium', 'enterprise'];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
}

function formatLargeCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`;
  return formatCurrency(amount);
}

function MRRChart({ data }: { data: MrrDataPoint[] }) {
  if (data.length === 0) return null;
  const maxMrr = Math.max(...data.map((d) => d.mrr), 1);
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">MRR / ARR Trend</h3>
      <div className="space-y-1">
        {data.map((d, i) => {
          const mrrPct = (d.mrr / maxMrr) * 100;
          const arrPct = (d.arr / (maxMrr * 12)) * 100;
          return (
            <div key={d.month} className="flex items-center gap-3">
              <span className="text-xs text-gray-400 w-16 shrink-0">{d.month}</span>
              <div className="flex-1 flex gap-1">
                <div
                  className="h-5 bg-violet-500 rounded-r transition-all hover:opacity-80"
                  style={{ width: `${mrrPct}%`, minWidth: '2px' }}
                  title={`MRR: ${formatCurrency(d.mrr)}`}
                />
                <div
                  className="h-5 bg-violet-200 rounded-r transition-all"
                  style={{ width: `${arrPct * 0.1}%`, minWidth: '1px' }}
                  title={`ARR: ${formatCurrency(d.arr)}`}
                />
              </div>
              <span className="text-xs font-medium text-gray-700 w-20 text-right shrink-0">{formatLargeCurrency(d.mrr)}</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-violet-500" />
          <span className="text-xs text-gray-500">MRR</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-violet-200" />
          <span className="text-xs text-gray-500">ARR (scaled)</span>
        </div>
      </div>
    </div>
  );
}

function SegmentBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-sm text-gray-600 w-32 shrink-0 capitalize">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-6">
        <div className={`h-6 rounded-full ${color} transition-all flex items-center justify-end pr-2`} style={{ width: `${Math.max(pct, 2)}%` }}>
          {pct > 15 && <span className="text-xs font-medium text-white">{value.toLocaleString()}</span>}
        </div>
      </div>
      <span className="text-sm font-medium text-gray-900 w-20 text-right shrink-0">{value.toLocaleString()}</span>
    </div>
  );
}

function ChurnChart({ data }: { data: ChurnData[] }) {
  const maxRate = Math.max(...data.map((d) => d.churnRate), 1);
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Churn Rate Over Time</h3>
      <div className="space-y-1">
        {data.map((d) => {
          const pct = (d.churnRate / maxRate) * 100;
          return (
            <div key={d.month} className="flex items-center gap-3">
              <span className="text-xs text-gray-400 w-16 shrink-0">{d.month}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-5">
                <div
                  className={`h-5 rounded-full transition-all ${
                    d.churnRate > 5 ? 'bg-red-500' : d.churnRate > 2 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.max(pct, 2)}%` }}
                />
              </div>
              <span className={`text-xs font-medium w-12 text-right shrink-0 ${
                d.churnRate > 5 ? 'text-red-600' : d.churnRate > 2 ? 'text-amber-600' : 'text-emerald-600'
              }`}>
                {d.churnRate.toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-400 mt-3">{data.length} months tracked</p>
    </div>
  );
}

function LTVTable({ data }: { data: LTVData[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Lifetime Value by Plan</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg LTV</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Months</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cohort Size</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((row) => (
              <tr key={row.plan} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900 capitalize">{row.plan}</td>
                <td className="px-4 py-3 text-sm font-semibold text-emerald-600 text-right">{formatCurrency(row.avgLTV)}</td>
                <td className="px-4 py-3 text-sm text-gray-600 text-right">{row.avgMonths.toFixed(1)}</td>
                <td className="px-4 py-3 text-sm text-gray-600 text-right">{row.cohortSize}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const PLAN_COLORS: Record<string, string> = {
  verified: 'bg-blue-500',
  featured: 'bg-violet-500',
  premium: 'bg-amber-500',
  enterprise: 'bg-emerald-500',
};

function generateMockRevenueMetrics(): {
  mrrTrend: MrrDataPoint[];
  byPlan: RevenueSegment[];
  byRegion: RevenueSegment[];
  churn: ChurnData[];
  ltv: LTVData[];
} {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  let mrr = 8000;
  const mrrTrend = months.map((month) => {
    const growth = Math.random() * 0.08 + 0.02;
    mrr = Math.round(mrr * (1 + growth));
    return { month, mrr, arr: mrr * 12, growth: Math.round(growth * 100 * 10) / 10 };
  });
  const planData = [
    { label: 'verified', value: 342 },
    { label: 'featured', value: 198 },
    { label: 'premium', value: 87 },
    { label: 'enterprise', value: 23 },
  ];
  const totalPlan = planData.reduce((s, p) => s + p.value, 0);
  const byPlan = planData.map((p) => ({ ...p, percentage: Math.round((p.value / totalPlan) * 100) }));
  const regionData = [
    { label: 'North America', value: 312 },
    { label: 'Europe', value: 198 },
    { label: 'APAC', value: 98 },
    { label: 'LATAM', value: 31 },
    { label: 'Other', value: 11 },
  ];
  const totalRegion = regionData.reduce((s, r) => s + r.value, 0);
  const byRegion = regionData.map((r) => ({ ...r, percentage: Math.round((r.value / totalRegion) * 100) }));
  const churn = months.map((month) => ({
    month,
    churnRate: Math.random() * 3 + 0.5,
    churned: Math.floor(Math.random() * 15) + 2,
    activeStart: Math.floor(Math.random() * 50) + 200,
  }));
  const ltv: LTVData[] = [
    { plan: 'verified', avgLTV: 1200, avgMonths: 8.2, cohortSize: 342 },
    { plan: 'featured', avgLTV: 3600, avgMonths: 14.5, cohortSize: 198 },
    { plan: 'premium', avgLTV: 9600, avgMonths: 18.3, cohortSize: 87 },
    { plan: 'enterprise', avgLTV: 24000, avgMonths: 24.0, cohortSize: 23 },
  ];
  return { mrrTrend, byPlan, byRegion, churn, ltv };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminRevenueAnalytics() {
  const [loading, setLoading] = useState(false);
  const [mrrTrend, setMrrTrend] = useState<MrrDataPoint[]>([]);
  const [byPlan, setByPlan] = useState<RevenueSegment[]>([]);
  const [byRegion, setByRegion] = useState<RevenueSegment[]>([]);
  const [churn, setChurn] = useState<ChurnData[]>([]);
  const [ltv, setLtv] = useState<LTVData[]>([]);
  const [activeSection, setActiveSection] = useState<'overview' | 'segments' | 'churn'>('overview');

  const loadData = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      const { mrrTrend: m, byPlan: bp, byRegion: br, churn: c, ltv: l } = generateMockRevenueMetrics();
      setMrrTrend(m);
      setByPlan(bp);
      setByRegion(br);
      setChurn(c);
      setLtv(l);
      setLoading(false);
    }, 400);
  }, []);

  const currentMRR = mrrTrend[mrrTrend.length - 1]?.mrr ?? 0;
  const prevMRR = mrrTrend[mrrTrend.length - 2]?.mrr ?? currentMRR;
  const mrrGrowth = prevMRR > 0 ? ((currentMRR - prevMRR) / prevMRR) * 100 : 0;
  const totalARR = currentMRR * 12;
  const avgChurn = churn.length > 0 ? churn.reduce((s, c) => s + c.churnRate, 0) / churn.length : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Revenue Analytics</h1>
          <p className="text-gray-500 mt-1">MRR, ARR, churn, and lifetime value insights</p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="px-6 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Refreshing...
            </>
          ) : (
            'Refresh Data'
          )}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-violet-600 to-violet-700 rounded-xl p-6 text-white shadow-lg">
          <p className="text-sm font-medium text-violet-200">Monthly Recurring Revenue</p>
          <p className="text-3xl font-bold mt-2">{formatCurrency(currentMRR)}</p>
          <p className={`text-sm mt-1 ${mrrGrowth >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
            {mrrGrowth >= 0 ? '+' : ''}{mrrGrowth.toFixed(1)}% vs last month
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Annual Run Rate</p>
          <p className="text-3xl font-semibold text-gray-900 mt-2">{formatLargeCurrency(totalARR)}</p>
          <p className="text-xs text-gray-400 mt-1">Based on current MRR</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Avg Monthly Churn</p>
          <p className={`text-3xl font-semibold mt-2 ${avgChurn > 3 ? 'text-red-600' : avgChurn > 1.5 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {avgChurn.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-400 mt-1">{churn.reduce((s, c) => s + c.churned, 0)} churned this period</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Avg LTV (All Plans)</p>
          <p className="text-3xl font-semibold text-emerald-600 mt-2">
            {formatCurrency(ltv.reduce((s, l) => s + l.avgLTV * l.cohortSize, 0) / Math.max(ltv.reduce((s, l) => s + l.cohortSize, 0), 1))}
          </p>
          <p className="text-xs text-gray-400 mt-1">Weighted by cohort size</p>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1 w-fit">
        {(['overview', 'segments', 'churn'] as const).map((sec) => (
          <button
            key={sec}
            onClick={() => setActiveSection(sec)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize ${
              activeSection === sec ? 'bg-violet-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {sec === 'overview' ? 'MRR/ARR' : sec === 'segments' ? 'Revenue Segments' : 'Churn & LTV'}
          </button>
        ))}
      </div>

      {/* MRR/ARR Section */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          <MRRChart data={mrrTrend} />
          {mrrTrend.length > 1 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Growth Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {mrrTrend.map((d, i) => {
                  if (i === 0) return null;
                  const prev = mrrTrend[i - 1].mrr;
                  const delta = prev > 0 ? ((d.mrr - prev) / prev) * 100 : 0;
                  return (
                    <div key={d.month} className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-400">{d.month}</p>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(d.mrr)}</p>
                      <span className={`text-xs font-medium ${delta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {delta >= 0 ? '+' : ''}{delta.toFixed(1)}% MoM
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Revenue Segments Section */}
      {activeSection === 'segments' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Revenue by Plan</h3>
            {byPlan.length === 0 ? (
              <p className="text-sm text-gray-400">No data loaded</p>
            ) : (
              <>
                {byPlan.map((s) => (
                  <SegmentBar
                    key={s.label}
                    label={s.label}
                    value={s.value}
                    max={Math.max(...byPlan.map((p) => p.value), 1)}
                    color={PLAN_COLORS[s.label] || 'bg-gray-400'}
                  />
                ))}
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
                  {byPlan.map((s) => (
                    <div key={s.label} className="flex items-center gap-1.5">
                      <div className={`w-3 h-3 rounded-sm ${PLAN_COLORS[s.label] || 'bg-gray-400'}`} />
                      <span className="text-xs text-gray-500 capitalize">{s.label}: {s.percentage}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Revenue by Region</h3>
            {byRegion.length === 0 ? (
              <p className="text-sm text-gray-400">No data loaded</p>
            ) : (
              <>
                {byRegion.map((s) => {
                  const color = s.label === 'North America' ? 'bg-blue-500' :
                    s.label === 'Europe' ? 'bg-violet-500' :
                    s.label === 'APAC' ? 'bg-amber-500' :
                    'bg-gray-400';
                  return (
                    <SegmentBar
                      key={s.label}
                      label={s.label}
                      value={s.value}
                      max={Math.max(...byRegion.map((r) => r.value), 1)}
                      color={color}
                    />
                  );
                })}
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
                  {byRegion.map((s) => (
                    <span key={s.label} className="text-xs text-gray-500">{s.label}: {s.percentage}%</span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Churn & LTV Section */}
      {activeSection === 'churn' && (
        <div className="space-y-6">
          <ChurnChart data={churn} />
          <LTVTable data={ltv} />
          {ltv.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">LTV Summary</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {ltv.map((row) => (
                  <div key={row.plan} className="p-4 bg-gray-50 rounded-lg text-center">
                    <p className="text-xs text-gray-400 capitalize mb-1">{row.plan} Plan</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(row.avgLTV)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{row.avgMonths.toFixed(0)} mo avg</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}