import { useState, useEffect } from 'react';

interface DoctorAnalyticsProps {
  doctorId?: string;
  clinicId?: string;
}

interface AnalyticsData {
  profileViews: { date: string; count: number }[];
  totalViews: number;
  leadsCount: number;
  reviewsCount: number;
  avgRating: number;
  rankingData?: { rank: number; date: string }[];
}

function SVGLineChart({ data, color }: { data: { date: string; count: number }[]; color: string }) {
  if (!data.length) return <p className="text-sm text-gray-400 text-center py-8">No data</p>;
  const max = Math.max(...data.map(d => d.count), 1);
  const w = 600, h = 120, pad = 20;
  const pts = data.map((d, i) => ({
    x: pad + (i / Math.max(data.length - 1, 1)) * (w - pad * 2),
    y: pad + (1 - d.count / max) * (h - pad * 2),
  }));
  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaD = `${pathD} L${pts[pts.length - 1]?.x || w},${h} L${pts[0]?.x || 0},${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-32">
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#grad-${color.replace('#', '')})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} />)}
    </svg>
  );
}

function StarBar({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-8 text-right">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-3">
        <div className="bg-amber-400 h-3 rounded-full transition-all" style={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }} />
      </div>
      <span className="text-sm font-medium text-gray-700 w-6">{value}</span>
    </div>
  );
}

export default function DoctorAnalytics({ doctorId, clinicId }: DoctorAnalyticsProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');

  useEffect(() => {
    if (!doctorId && !clinicId) { setLoading(false); return; }
    fetch(`/api/doctor/analytics?clinicId=${clinicId || ''}&period=${period}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError('Failed to load'); setLoading(false); });
  }, [doctorId, clinicId, period]);

  if (loading) return <div className="flex items-center justify-center min-h-[40vh]"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div>;

  return (
    <div>
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">{error}</div>}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Performance Overview</h2>
        <div className="flex gap-1">
          <button onClick={() => setPeriod('weekly')} className={`px-4 py-2 rounded-lg text-sm font-medium ${period === 'weekly' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>Weekly</button>
          <button onClick={() => setPeriod('monthly')} className={`px-4 py-2 rounded-lg text-sm font-medium ${period === 'monthly' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>Monthly</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm text-center">
          <p className="text-sm text-gray-500">Total Views</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{data?.totalViews?.toLocaleString() || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm text-center">
          <p className="text-sm text-gray-500">Leads</p>
          <p className="text-2xl font-semibold text-blue-600 mt-1">{data?.leadsCount?.toLocaleString() || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm text-center">
          <p className="text-sm text-gray-500">Reviews</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{data?.reviewsCount?.toLocaleString() || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm text-center">
          <p className="text-sm text-gray-500">Avg Rating</p>
          <p className="text-2xl font-semibold text-amber-500 mt-1">{data?.avgRating ? Number(data.avgRating).toFixed(1) : '0.0'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Profile Views Trend</h3>
          <SVGLineChart data={data?.profileViews || []} color="#3b82f6" />
        </div>
        {data?.rankingData && data.rankingData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Ranking Position</h3>
            <SVGLineChart data={data.rankingData.map(r => ({ date: r.date, count: r.rank }))} color="#8b5cf6" />
          </div>
        )}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Rating Distribution</h3>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map(star => <StarBar key={star} label={`${star} star`} value={0} max={10} />)}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Peer Comparison</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 w-24">Your Rating</span>
              <div className="flex-1 bg-gray-100 rounded-full h-3">
                <div className="bg-blue-600 h-3 rounded-full" style={{ width: `${data?.avgRating ? (Number(data.avgRating) / 5) * 100 : 0}%` }} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 w-24">Specialty Avg</span>
              <div className="flex-1 bg-gray-100 rounded-full h-3">
                <div className="bg-gray-400 h-3 rounded-full" style={{ width: '50%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
