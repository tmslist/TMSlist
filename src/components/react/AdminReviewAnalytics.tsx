import { useState, useEffect, useCallback } from 'react';

interface RatingTrend {
  month: string;
  avgRating: number;
  count: number;
}

interface RatingBreakdown {
  clinicId: string;
  clinicName: string;
  avgRating: number;
  totalReviews: number;
  oneStar: number;
  twoStars: number;
  threeStars: number;
  fourStars: number;
  fiveStars: number;
}

interface ResponseMetrics {
  totalReviews: number;
  responded: number;
  responseRate: number;
  avgResponseTimeHours: number;
}

interface NPSData {
  promoterCount: number;
  passiveCount: number;
  detractorCount: number;
  npsScore: number;
}

interface AnalyticsData {
  trends: RatingTrend[];
  byClinic: RatingBreakdown[];
  byDoctor: RatingBreakdown[];
  byTreatment: { treatment: string; avgRating: number; count: number }[];
  responseMetrics: ResponseMetrics;
  nps: NPSData;
  totalReviews: number;
  avgRatingOverall: number;
}

const STAR = '\u2605';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function MiniSparkline({ data }: { data: number[] }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1 || 1)) * 120;
    const y = 40 - ((v - min) / range) * 36;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={140} height={44} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke="#818cf8"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="text-yellow-500 text-sm">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={i <= rating ? 'text-yellow-500' : 'text-gray-200'}>{STAR}</span>
      ))}
    </span>
  );
}

export default function AdminReviewAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('90');
  const [breakdownBy, setBreakdownBy] = useState<'clinic' | 'doctor' | 'treatment'>('clinic');

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/reviews?analytics=true&period=${period}`);
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to load analytics');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
        Failed to load analytics. {error}
      </div>
    );
  }

  const breakdownData = breakdownBy === 'clinic' ? data.byClinic
    : breakdownBy === 'doctor' ? data.byDoctor
    : data.byTreatment.map(t => ({
        clinicId: t.treatment,
        clinicName: t.treatment,
        avgRating: t.avgRating,
        totalReviews: t.count,
        oneStar: 0, twoStars: 0, threeStars: 0, fourStars: 0, fiveStars: 0,
      }));

  const sparklineData = data.trends.map(t => t.avgRating);

  return (
    <div className="space-y-8">
      {/* Period Filter */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-500">Period:</span>
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
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Reviews</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{data.totalReviews.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">in selected period</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Avg Rating</p>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-3xl font-bold text-gray-900">{data.avgRatingOverall.toFixed(2)}</p>
            <StarRating rating={Math.round(data.avgRatingOverall)} />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Response Rate</p>
          <p className="text-3xl font-bold text-emerald-600 mt-2">{data.responseMetrics.responseRate.toFixed(1)}%</p>
          <p className="text-xs text-gray-400 mt-1">{data.responseMetrics.responded} / {data.responseMetrics.totalReviews}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">NPS Score</p>
          <p className={`text-3xl font-bold mt-2 ${
            data.nps.npsScore >= 50 ? 'text-emerald-600' :
            data.nps.npsScore >= 0 ? 'text-amber-600' : 'text-red-600'
          }`}>
            {data.nps.npsScore >= 0 ? '+' : ''}{data.nps.npsScore}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Promoters: {data.nps.promoterCount} / Passives: {data.nps.passiveCount} / Detractors: {data.nps.detractorCount}
          </p>
        </div>
      </div>

      {/* Rating Trends */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Rating Trend Over Time</h2>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          {data.trends.length === 0 ? (
            <p className="text-gray-500 text-sm">No trend data available.</p>
          ) : (
            <div className="space-y-4">
              {sparklineData.length > 1 && (
                <div className="flex justify-end">
                  <MiniSparkline data={sparklineData} />
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Avg Rating</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reviews</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {[...data.trends].reverse().map(trend => (
                      <tr key={trend.month} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(trend.month)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">{trend.avgRating.toFixed(2)}</span>
                            <StarRating rating={Math.round(trend.avgRating)} />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{trend.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Breakdown */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Breakdown</h2>
          <div className="flex gap-2">
            {([
              { key: 'clinic', label: 'By Clinic' },
              { key: 'doctor', label: 'By Doctor' },
              { key: 'treatment', label: 'By Treatment' },
            ] as const).map(b => (
              <button
                key={b.key}
                onClick={() => setBreakdownBy(b.key)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  breakdownBy === b.key
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {breakdownBy === 'clinic' ? 'Clinic' : breakdownBy === 'doctor' ? 'Doctor' : 'Treatment'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Rating</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">1</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">2</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">3</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">4</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">5</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {breakdownData.slice(0, 20).map((row, i) => (
                  <tr key={`${row.clinicId}-${i}`} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 truncate max-w-[200px]">
                      {row.clinicName}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{row.avgRating.toFixed(2)}</span>
                        <StarRating rating={Math.round(row.avgRating)} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{row.totalReviews}</td>
                    <td className="px-4 py-3 text-center text-xs text-red-500">{row.oneStar}</td>
                    <td className="px-4 py-3 text-center text-xs text-orange-500">{row.twoStars}</td>
                    <td className="px-4 py-3 text-center text-xs text-yellow-500">{row.threeStars}</td>
                    <td className="px-4 py-3 text-center text-xs text-lime-500">{row.fourStars}</td>
                    <td className="px-4 py-3 text-center text-xs text-emerald-500">{row.fiveStars}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Response Metrics Detail */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Response Metrics</h2>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 0 12.328 0 8.375 0 3.816 4.03 0 9 0c5 0 9 3.816 9 8.25z" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-gray-900">{data.responseMetrics.responseRate.toFixed(1)}%</p>
              <p className="text-xs text-gray-500 mt-1">Response Rate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{data.responseMetrics.responded}</p>
              <p className="text-xs text-gray-500 mt-1">Reviews Responded</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{data.responseMetrics.totalReviews}</p>
              <p className="text-xs text-gray-500 mt-1">Total Reviews</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {data.responseMetrics.avgResponseTimeHours > 0
                  ? `${data.responseMetrics.avgResponseTimeHours.toFixed(1)}h`
                  : 'N/A'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Avg Response Time</p>
            </div>
          </div>
        </div>
      </div>

      {/* NPS Score Detail */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">NPS Score Calculation</h2>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="mb-6 text-center">
            <p className={`text-5xl font-bold ${
              data.nps.npsScore >= 50 ? 'text-emerald-600' :
              data.nps.npsScore >= 0 ? 'text-amber-600' : 'text-red-600'
            }`}>
              {data.nps.npsScore >= 0 ? '+' : ''}{data.nps.npsScore}
            </p>
            <p className="text-sm text-gray-500 mt-2">Net Promoter Score</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-emerald-50 rounded-lg p-4 text-center border border-emerald-100">
              <p className="text-2xl font-bold text-emerald-700">{data.nps.promoterCount}</p>
              <p className="text-xs text-emerald-600 font-medium mt-1">Promoters (5-star)</p>
              <p className="text-xs text-emerald-500 mt-1">
                {data.totalReviews > 0 ? ((data.nps.promoterCount / data.totalReviews) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
              <p className="text-2xl font-bold text-gray-600">{data.nps.passiveCount}</p>
              <p className="text-xs text-gray-500 font-medium mt-1">Passives (3-4 star)</p>
              <p className="text-xs text-gray-400 mt-1">
                {data.totalReviews > 0 ? ((data.nps.passiveCount / data.totalReviews) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center border border-red-100">
              <p className="text-2xl font-bold text-red-700">{data.nps.detractorCount}</p>
              <p className="text-xs text-red-600 font-medium mt-1">Detractors (1-2 star)</p>
              <p className="text-xs text-red-500 mt-1">
                {data.totalReviews > 0 ? ((data.nps.detractorCount / data.totalReviews) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4 text-center">
            NPS = (% Promoters) - (% Detractors) = {' '}
            {data.totalReviews > 0 ? ((data.nps.promoterCount / data.totalReviews) * 100).toFixed(1) : 0}% - {' '}
            {data.totalReviews > 0 ? ((data.nps.detractorCount / data.totalReviews) * 100).toFixed(1) : 0}% = {' '}
            {data.nps.npsScore >= 0 ? '+' : ''}{data.nps.npsScore}
          </p>
        </div>
      </div>
    </div>
  );
}
