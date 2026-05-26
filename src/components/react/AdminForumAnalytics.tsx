import { useState, useCallback } from 'react';

interface ForumAnalytics {
  totalPosts: number;
  totalComments: number;
  totalUsers: number;
  postsThisWeek: number;
  postsThisMonth: number;
  avgCommentsPerPost: number;
  topCategories: Array<{ categoryId: string; name: string; color: string; postCount: number; engagement: number }>;
  topContributors: Array<{ userId: string; name: string; role: string; postCount: number; commentCount: number; score: number }>;
  postFrequency: Array<{ date: string; count: number }>;
  activeUsers: Array<{ date: string; activeUsers: number }>;
  categoryBreakdown: Array<{ categoryId: string; name: string; color: string; posts: number; comments: number; avgVotes: number }>;
}

const COLOR_MAP: Record<string, string> = {
  violet: 'bg-[var(--ink2)]',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-[var(--warm)]',
  yellow: 'bg-yellow-500',
  blue: 'bg-[var(--ink2)]',
  teal: 'bg-teal-500',
  indigo: 'bg-[var(--warm)]',
};

export default function AdminForumAnalytics() {
  const [analytics, setAnalytics] = useState<ForumAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/forum/analytics?range=${timeRange}`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data.analytics || data);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, [timeRange]);

  const [initialized, setInitialized] = useState(false);
  if (!initialized) {
    fetchAnalytics().then(() => setInitialized(true));
  }

  if (!analytics) {
    return (
      <div className="p-12 text-center text-[var(--muted)]">
        {loading ? 'Loading forum analytics…' : 'No forum analytics available. The /api/admin/forum/analytics endpoint is not implemented yet.'}
      </div>
    );
  }

  const data = analytics;

  // SVG bar chart for post frequency
  const maxFreq = Math.max(...data.postFrequency.map(p => p.count));
  const chartWidth = 800;
  const chartHeight = 180;
  const barWidth = chartWidth / data.postFrequency.length;
  const barGap = 1;

  // SVG bar chart for active users
  const maxActive = Math.max(...data.activeUsers.map(u => u.activeUsers));

  const formatNumber = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--ink)]">Forum Analytics</h1>
          <p className="text-[var(--muted)] mt-1">Track engagement, activity, and community growth</p>
        </div>
        <div className="flex gap-1 bg-[var(--paper2)] p-1 rounded-xl">
          {(['7d', '30d', '90d', 'all'] as const).map(range => (
            <button
              key={range}
              onClick={() => { setTimeRange(range); setInitialized(false); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                timeRange === range ? 'bg-white text-[var(--ink)] shadow-sm' : 'text-[var(--muted)] hover:text-[var(--ink2)]'
              }`}
            >
              {range === 'all' ? 'All Time' : range}
            </button>
          ))}
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {[
          { label: 'Total Posts', value: formatNumber(data.totalPosts), icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z', color: 'violet' },
          { label: 'Total Comments', value: formatNumber(data.totalComments), icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', color: 'blue' },
          { label: 'Active Users', value: formatNumber(data.totalUsers), icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', color: 'emerald' },
          { label: 'Posts This Week', value: formatNumber(data.postsThisWeek), icon: 'M13 7h8m0 0v-8m0 8 8-8m-8 8-8-8', color: 'amber' },
          { label: 'Posts This Month', value: formatNumber(data.postsThisMonth), icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', color: 'rose' },
          { label: 'Avg Comments/Post', value: data.avgCommentsPerPost.toFixed(1), icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z', color: 'teal' },
        ].map((metric, i) => (
          <div key={i} className="bg-white rounded-xl border border-[var(--line)] p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${metric.color}-50`}>
                <svg className={`w-4 h-4 text-${metric.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={metric.icon} />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold text-[var(--ink)]">{metric.value}</div>
            <div className="text-xs text-[var(--muted)] mt-0.5">{metric.label}</div>
          </div>
        ))}
      </div>

      {/* Post Frequency Chart */}
      <div className="bg-white rounded-xl border border-[var(--line)] p-6 mb-6">
        <h2 className="text-lg font-semibold text-[var(--ink)] mb-4">Post Frequency</h2>
        <div className="relative" style={{ height: chartHeight }}>
          <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
            {/* Y axis labels */}
            <text x="8" y="14" className="fill-[var(--muted)]" style={{ fontSize: '10px' }}>{maxFreq}</text>
            <text x="8" y={chartHeight - 8} className="fill-[var(--muted)]" style={{ fontSize: '10px' }}>0</text>
            {/* Bars */}
            {data.postFrequency.map((item, i) => {
              const barH = (item.count / maxFreq) * (chartHeight - 24);
              const x = i * barWidth;
              const y = chartHeight - barH - 4;
              return (
                <rect
                  key={i}
                  x={x + barGap / 2}
                  y={y}
                  width={Math.max(barWidth - barGap, 2)}
                  height={barH}
                  rx="2"
                  className="fill-[#1E2A3B]"
                />
              );
            })}
          </svg>
          <div className="flex justify-between text-xs text-[var(--muted)] mt-1">
            <span>{data.postFrequency[0]?.date}</span>
            <span>{data.postFrequency[data.postFrequency.length - 1]?.date}</span>
          </div>
        </div>
      </div>

      {/* Active Users Chart */}
      <div className="bg-white rounded-xl border border-[var(--line)] p-6 mb-6">
        <h2 className="text-lg font-semibold text-[var(--ink)] mb-4">Active Users</h2>
        <div className="relative" style={{ height: chartHeight }}>
          <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
            <text x="8" y="14" className="fill-[var(--muted)]" style={{ fontSize: '10px' }}>{maxActive}</text>
            <text x="8" y={chartHeight - 8} className="fill-[var(--muted)]" style={{ fontSize: '10px' }}>0</text>
            {data.activeUsers.map((item, i) => {
              const barH = (item.activeUsers / maxActive) * (chartHeight - 24);
              const x = i * barWidth;
              const y = chartHeight - barH - 4;
              return (
                <rect
                  key={i}
                  x={x + barGap / 2}
                  y={y}
                  width={Math.max(barWidth - barGap, 2)}
                  height={barH}
                  rx="2"
                  className="fill-emerald-400"
                />
              );
            })}
          </svg>
          <div className="flex justify-between text-xs text-[var(--muted)] mt-1">
            <span>{data.activeUsers[0]?.date}</span>
            <span>{data.activeUsers[data.activeUsers.length - 1]?.date}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Engagement Breakdown */}
        <div className="bg-white rounded-xl border border-[var(--line)] p-6">
          <h2 className="text-lg font-semibold text-[var(--ink)] mb-4">Category Engagement</h2>
          <div className="space-y-4">
            {data.categoryBreakdown.map((cat, i) => {
              const total = data.categoryBreakdown.reduce((s, c) => s + c.posts, 0);
              const pct = total > 0 ? (cat.posts / total) * 100 : 0;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${COLOR_MAP[cat.color] || 'bg-[var(--ink2)]'}`} />
                      <span className="text-sm font-medium text-[var(--ink)]">{cat.name}</span>
                    </div>
                    <span className="text-xs text-[var(--muted)]">{cat.posts} posts · {cat.comments} comments · {cat.avgVotes.toFixed(1)} avg votes</span>
                  </div>
                  <div className="w-full bg-[var(--paper2)] rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${COLOR_MAP[cat.color] || 'bg-[var(--ink2)]'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Contributors */}
        <div className="bg-white rounded-xl border border-[var(--line)] p-6">
          <h2 className="text-lg font-semibold text-[var(--ink)] mb-4">Top Contributors</h2>
          <div className="space-y-3">
            {data.topContributors.map((user, i) => (
              <div key={user.userId} className="flex items-center gap-4 p-3 rounded-xl hover:bg-[var(--paper2)] transition-colors">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  i === 0 ? 'bg-amber-100 text-amber-700' :
                  i === 1 ? 'bg-[var(--paper2)] text-[var(--ink2)]' :
                  i === 2 ? 'bg-orange-100 text-orange-700' :
                  'bg-[var(--paper2)] text-[var(--muted)]'
                }`}>
                  #{i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[var(--ink)] truncate">{user.name}</div>
                  <div className="text-xs text-[var(--muted)]">{user.role.replace('_', ' ')}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-[var(--ink)]">{formatNumber(user.score)}</div>
                  <div className="text-[11px] text-[var(--muted)]">{user.postCount} posts · {user.commentCount} comments</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}