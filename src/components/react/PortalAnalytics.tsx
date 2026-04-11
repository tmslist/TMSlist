import { useState, useEffect } from 'react';

interface PortalAnalyticsProps {
  userId: string;
}

interface MonthData {
  month: string;
  count: number;
  avgRating?: number | null;
}

interface AnalyticsData {
  months: string[];
  leadCounts: MonthData[];
  reviewCounts: MonthData[];
  overallAvgRating: number;
}

function formatMonth(yyyymm: string): string {
  const [year, month] = yyyymm.split('-');
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

function BarChart({ data, label, color }: { data: MonthData[]; label: string; color: string }) {
  const max = Math.max(...data.map((d) => Number(d.count)), 1);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">{label}</h3>
      {data.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">No data yet</p>
      ) : (
        <div className="flex items-end gap-3 h-40">
          {data.map((d) => {
            const pct = (Number(d.count) / max) * 100;
            return (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-semibold text-gray-700">{Number(d.count)}</span>
                <div className="w-full relative" style={{ height: '120px' }}>
                  <div
                    className={`absolute bottom-0 w-full rounded-t-md transition-all duration-500 ${color}`}
                    style={{ height: `${Math.max(pct, 4)}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-500 font-medium">{formatMonth(d.month)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.25 && rating - full < 0.75;
  const empty = 5 - full - (hasHalf ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: full }).map((_, i) => (
        <svg key={`f${i}`} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      {hasHalf && (
        <svg className="w-5 h-5 text-amber-400" viewBox="0 0 20 20">
          <defs>
            <linearGradient id="half-star">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="#D1D5DB" />
            </linearGradient>
          </defs>
          <path fill="url(#half-star)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      )}
      {Array.from({ length: empty }).map((_, i) => (
        <svg key={`e${i}`} className="w-5 h-5 text-gray-200" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function PortalAnalytics({ userId }: PortalAnalyticsProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/portal/analytics')
      .then((res) => res.json())
      .then((d) => {
        if (d.error) {
          setError(d.error);
        } else {
          setData(d);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load analytics');
        setLoading(false);
      });
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const rating = data.overallAvgRating;
  const totalLeads = data.leadCounts.reduce((sum, d) => sum + Number(d.count), 0);
  const totalReviews = data.reviewCounts.reduce((sum, d) => sum + Number(d.count), 0);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Average rating */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Average Rating</h3>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-gray-900">{rating > 0 ? rating.toFixed(1) : '--'}</span>
            <div>
              <StarRating rating={rating} />
              <p className="text-xs text-gray-500 mt-1">{totalReviews} review{totalReviews !== 1 ? 's' : ''} (6 mo)</p>
            </div>
          </div>
        </div>

        {/* Total leads */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Leads (6 mo)</h3>
          <span className="text-3xl font-bold text-gray-900">{totalLeads}</span>
          <p className="text-xs text-gray-500 mt-1">total enquiries</p>
        </div>

        {/* Profile views placeholder */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Profile Views</h3>
          <div className="flex items-center gap-2 mt-1">
            <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-gray-400 font-medium">Coming soon</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BarChart data={data.leadCounts} label="Leads by Month" color="bg-teal-500" />
        <BarChart data={data.reviewCounts} label="Reviews by Month" color="bg-emerald-500" />
      </div>
    </div>
  );
}
