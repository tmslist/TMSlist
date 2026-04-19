import { useState, useCallback } from 'react';

// ── Types (cohortData schema) ─────────────────────────────────────────────────

interface CohortRow {
  cohortMonth: string;
  cohortSize: number;
  retentionByMonth: (number | null)[];
  churnRate: number | null;
}

interface CohortData {
  cohorts: CohortRow[];
}

interface ConversionMetric {
  label: string;
  rate: number;
  total: number;
  converted: number;
}

const COHORT_TYPES = [
  { value: 'signup', label: 'Sign-up Date', description: 'Group users by registration month' },
  { value: 'first_visit', label: 'First Visit', description: 'Group users by first booking date' },
  { value: 'subscription', label: 'Subscription Start', description: 'Group clinics by plan start date' },
];

const TIME_PRESETS = [
  { label: 'Last 3 months', months: 3 },
  { label: 'Last 6 months', months: 6 },
  { label: 'Last 12 months', months: 12 },
];

const SEGMENT_OPTIONS = [
  { value: 'all', label: 'All Segments' },
  { value: 'verified', label: 'Verified Clinics' },
  { value: 'featured', label: 'Featured Plans' },
  { value: 'premium', label: 'Premium Tier' },
];

function RetentionBarChart({ row, maxSize }: { row: CohortRow; maxSize: number }) {
  const bars = row.retentionByMonth;
  const monthLabels = bars.map((_, i) => `M${i}`);
  return (
    <div className="flex items-end gap-[3px] h-12">
      {bars.map((val, i) => {
        if (val === null) {
          return (
            <div key={i} className="flex-1 min-w-[16px] h-full flex items-center justify-center">
              <div className="w-full h-1 bg-gray-200 rounded" />
            </div>
          );
        }
        const pct = (val / maxSize) * 100;
        return (
          <div key={i} className="flex-1 min-w-[16px] flex flex-col justify-end">
            <div
              className="w-full bg-violet-500 rounded-t transition-all hover:bg-violet-600"
              style={{ height: `${Math.max(pct, 2)}%` }}
              title={`${monthLabels[i]}: ${val.toFixed(1)}%`}
            />
          </div>
        );
      })}
    </div>
  );
}

function RetentionCurve({ cohorts }: { cohorts: CohortRow[] }) {
  if (cohorts.length === 0) return null;
  const months = Math.max(...cohorts.map((c) => c.retentionByMonth.length), 1);
  const labels = Array.from({ length: months }, (_, i) => `M${i}`);
  const avgByMonth = labels.map((_, i) => {
    const vals = cohorts.map((c) => c.retentionByMonth[i]).filter((v) => v !== null) as number[];
    return vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
  });
  const maxVal = 100;
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Average Retention Curve</h3>
      <div className="flex items-end gap-[4px] h-48">
        {avgByMonth.map((val, i) => {
          const pct = (val / maxVal) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col justify-end items-center">
              <span className="text-[9px] text-gray-400 mb-1">{Math.round(val)}%</span>
              <div
                className="w-full bg-gradient-to-t from-violet-600 to-violet-400 rounded-t transition-all"
                style={{ height: `${Math.max(pct, 2)}%` }}
              />
              <span className="text-[9px] text-gray-500 mt-1">{labels[i]}</span>
            </div>
          );
        })}
      </div>
      <p className="text-center text-xs text-gray-400 mt-3">Months since cohort start</p>
    </div>
  );
}

function generateMockCohortData(period: number, cohortType: string): CohortData {
  const cohorts: CohortRow[] = [];
  const now = new Date();
  for (let i = period - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const size = Math.floor(Math.random() * 200) + 50;
    const retentionByMonth: (number | null)[] = [];
    for (let m = 0; m < period - i; m++) {
      if (m === 0) {
        retentionByMonth.push(100);
      } else {
        const prev = retentionByMonth[m - 1] as number;
        const decay = Math.random() * 0.15 + 0.05;
        retentionByMonth.push(Math.max(prev - decay * prev, 0.5));
      }
    }
    const paddedMonths = Math.min(retentionByMonth.length, 6);
    for (let p = paddedMonths; p < 6; p++) {
      retentionByMonth.push(null);
    }
    cohorts.push({
      cohortMonth: monthStr,
      cohortSize: size,
      retentionByMonth: retentionByMonth.slice(0, 6),
      churnRate: retentionByMonth.length > 1 ? 100 - (retentionByMonth[1] as number) : null,
    });
  }
  return { cohorts };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminCohortAnalysis() {
  const [cohortType, setCohortType] = useState('signup');
  const [periodMonths, setPeriodMonths] = useState(6);
  const [segment, setSegment] = useState('all');
  const [data, setData] = useState<CohortData | null>(null);
  const [loading, setLoading] = useState(false);

  const loadCohort = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setData(generateMockCohortData(periodMonths, cohortType));
      setLoading(false);
    }, 500);
  }, [periodMonths, cohortType]);

  const conversionMetrics: ConversionMetric[] = data
    ? [
        { label: 'Lead → Clinic Signup', rate: 12.3, total: 1542, converted: 190 },
        { label: 'Visitor → Lead Capture', rate: 8.7, total: 28500, converted: 2480 },
        { label: 'Lead → Appointment', rate: 31.2, total: 2480, converted: 774 },
        { label: 'Trial → Paid Subscription', rate: 18.5, total: 340, converted: 63 },
        { label: 'Free → Premium Upgrade', rate: 6.4, total: 890, converted: 57 },
      ]
    : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Cohort Analysis</h1>
        <p className="text-gray-500 mt-1">Analyze retention and conversion by user cohort</p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Cohort Type */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Cohort Basis</h3>
          <div className="space-y-2">
            {COHORT_TYPES.map((ct) => (
              <button
                key={ct.value}
                onClick={() => setCohortType(ct.value)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  cohortType === ct.value
                    ? 'border-violet-300 bg-violet-50'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <p className="text-sm font-medium text-gray-900">{ct.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{ct.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Time Period */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Time Period</h3>
          <div className="space-y-2">
            {TIME_PRESETS.map((tp) => (
              <button
                key={tp.months}
                onClick={() => setPeriodMonths(tp.months)}
                className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  periodMonths === tp.months
                    ? 'bg-violet-600 text-white'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Segment Filter */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Segment Filter</h3>
          <select
            value={segment}
            onChange={(e) => setSegment(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
          >
            {SEGMENT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <div className="mt-4">
            <p className="text-xs text-gray-400 mb-2">Active Cohorts</p>
            <p className="text-2xl font-bold text-gray-900">{periodMonths}</p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Period Summary</h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-400">Avg Cohort Size</p>
              <p className="text-xl font-bold text-gray-900">
                {data ? Math.round(data.cohorts.reduce((s, c) => s + c.cohortSize, 0) / data.cohorts.length) : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Avg Month-1 Retention</p>
              <p className="text-xl font-bold text-emerald-600">
                {data
                  ? data.cohorts
                      .map((c) => c.retentionByMonth[1])
                      .filter((v) => v !== null)
                      .reduce((s, v, i, arr) => s + (v as number) / arr.length, 0).toFixed(1)
                  : '—'}%
              </p>
            </div>
            <button
              onClick={loadCohort}
              disabled={loading}
              className="w-full px-4 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Loading...
                </>
              ) : (
                'Load Cohort Data'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Retention Curve */}
      {data && <RetentionCurve cohorts={data.cohorts} />}

      {/* Cohort Table */}
      {data && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Cohort Retention Table</h2>
            <p className="text-xs text-gray-400 mt-1">Percentage of cohort still active by month</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50">Cohort</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Cohort Size</th>
                  {Array.from({ length: 6 }, (_, i) => (
                    <th key={i} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">M{i}</th>
                  ))}
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Churn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.cohorts.map((row) => {
                  const maxSize = Math.max(...data.cohorts.map((c) => c.cohortSize));
                  return (
                    <tr key={row.cohortMonth} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white">{row.cohortMonth}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-center">{row.cohortSize}</td>
                      {row.retentionByMonth.map((val, i) => (
                        <td key={i} className="px-2 py-3 text-center">
                          {val === null ? (
                            <span className="text-xs text-gray-300">—</span>
                          ) : (
                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                              val >= 80 ? 'bg-emerald-100 text-emerald-700' :
                              val >= 50 ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {val.toFixed(0)}%
                            </span>
                          )}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-center">
                        {row.churnRate !== null ? (
                          <span className="text-xs font-medium text-red-600">{row.churnRate.toFixed(1)}%</span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conversion Metrics */}
      {data && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversion Metrics by Cohort</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {conversionMetrics.map((cm) => {
              const barColor = cm.rate >= 20 ? 'bg-emerald-500' : cm.rate >= 10 ? 'bg-amber-500' : 'bg-red-400';
              return (
                <div key={cm.label} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{cm.label}</span>
                    <span className={`text-lg font-bold ${
                      cm.rate >= 20 ? 'text-emerald-600' : cm.rate >= 10 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {cm.rate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className={`h-2 rounded-full ${barColor} transition-all`}
                      style={{ width: `${Math.min(cm.rate * 3, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400">{cm.converted.toLocaleString()} / {cm.total.toLocaleString()}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Comparison Period */}
      {data && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Period Comparison</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Current Period MRR', value: '$12,450', change: '+8.2%', up: true },
              { label: 'Previous Period MRR', value: '$11,510', change: '+5.1%', up: true },
              { label: 'QoQ Retention Delta', value: '+3.4%', change: 'vs last quarter', up: true },
            ].map((item) => (
              <div key={item.label} className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                <span className="inline-block mt-1 text-xs font-medium text-emerald-600">{item.change}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}