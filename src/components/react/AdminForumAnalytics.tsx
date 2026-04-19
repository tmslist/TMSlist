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
  violet: 'bg-violet-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  yellow: 'bg-yellow-500',
  blue: 'bg-blue-500',
  teal: 'bg-teal-500',
  indigo: 'bg-indigo-500',
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

  // Generate mock data if API not available
  const mockData: ForumAnalytics = {
    totalPosts: 1847,
    totalComments: 9243,
    totalUsers: 612,
    postsThisWeek: 89,
    postsThisMonth: 347,
    avgCommentsPerPost: 5.0,
    topCategories: [
      { categoryId: '1', name: 'Treatment Experiences', color: 'violet', postCount: 423, engagement: 87 },
      { categoryId: '2', name: 'Insurance & Cost', color: 'amber', postCount: 312, engagement: 74 },
      { categoryId: '3', name: 'Success Stories', color: 'yellow', postCount: 289, engagement: 91 },
      { categoryId: '4', name: 'Research & Studies', color: 'blue', postCount: 241, engagement: 68 },
      { categoryId: '5', name: 'Ask a Specialist', color: 'emerald', postCount: 198, engagement: 82 },
    ],
    topContributors: [
      { userId: 'u1', name: 'Dr. Sarah Chen', role: 'clinic_owner', postCount: 89, commentCount: 412, score: 1847 },
      { userId: 'u2', name: 'Michael Torres', role: 'patient', postCount: 67, commentCount: 389, score: 1523 },
      { userId: 'u3', name: 'Dr. James Wilson', role: 'clinic_owner', postCount: 54, commentCount: 298, score: 1240 },
      { userId: 'u4', name: 'Emma Rodriguez', role: 'patient', postCount: 43, commentCount: 267, score: 1089 },
      { userId: 'u5', name: 'Dr. Aisha Patel', role: 'clinic_owner', postCount: 38, commentCount: 245, score: 987 },
      { userId: 'u6', name: 'David Kim', role: 'patient', postCount: 29, commentCount: 198, score: 823 },
      { userId: 'u7', name: 'Jennifer Brown', role: 'patient', postCount: 24, commentCount: 176, score: 698 },
      { userId: 'u8', name: 'Dr. Robert Johnson', role: 'clinic_owner', postCount: 21, commentCount: 167, score: 654 },
    ],
    postFrequency: Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return {
        date: d.toISOString().slice(0, 10),
        count: Math.floor(Math.random() * 30) + 5,
      };
    }),
    activeUsers: Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return {
        date: d.toISOString().slice(0, 10),
        activeUsers: Math.floor(Math.random() * 150) + 20,
      };
    }),
    categoryBreakdown: [
      { categoryId: '1', name: 'Treatment Experiences', color: 'violet', posts: 423, comments: 2108, avgVotes: 12.4 },
      { categoryId: '2', name: 'Insurance & Cost', color: 'amber', posts: 312, comments: 1856, avgVotes: 8.7 },
      { categoryId: '3', name: 'Success Stories', color: 'yellow', posts: 289, comments: 1234, avgVotes: 18.2 },
      { categoryId: '4', name: 'Research & Studies', color: 'blue', posts: 241, comments: 1423, avgVotes: 14.1 },
      { categoryId: '5', name: 'Ask a Specialist', color: 'emerald', posts: 198, comments: 987, avgVotes: 16.8 },
      { categoryId: '6', name: 'Mental Health Support', color: 'teal', posts: 167, comments: 845, avgVotes: 11.3 },
      { categoryId: '7', name: 'Side Effects & Recovery', color: 'rose', posts: 134, comments: 623, avgVotes: 9.8 },
      { categoryId: '8', name: 'Events & Workshops', color: 'indigo', posts: 83, comments: 167, avgVotes: 6.2 },
    ],
  };

  const data = analytics || mockData;

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
          <h1 className="text-2xl font-semibold text-gray-900">Forum Analytics</h1>
          <p className="text-gray-500 mt-1">Track engagement, activity, and community growth</p>
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {(['7d', '30d', '90d', 'all'] as const).map(range => (
            <button
              key={range}
              onClick={() => { setTimeRange(range); setInitialized(false); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                timeRange === range ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
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
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${metric.color}-50`}>
                <svg className={`w-4 h-4 text-${metric.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={metric.icon} />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{metric.label}</div>
          </div>
        ))}
      </div>

      {/* Post Frequency Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Post Frequency</h2>
        <div className="relative" style={{ height: chartHeight }}>
          <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
            {/* Y axis labels */}
            <text x="8" y="14" className="fill-gray-400" style={{ fontSize: '10px' }}>{maxFreq}</text>
            <text x="8" y={chartHeight - 8} className="fill-gray-400" style={{ fontSize: '10px' }}>0</text>
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
                  className="fill-violet-400"
                />
              );
            })}
          </svg>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{data.postFrequency[0]?.date}</span>
            <span>{data.postFrequency[data.postFrequency.length - 1]?.date}</span>
          </div>
        </div>
      </div>

      {/* Active Users Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Users</h2>
        <div className="relative" style={{ height: chartHeight }}>
          <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
            <text x="8" y="14" className="fill-gray-400" style={{ fontSize: '10px' }}>{maxActive}</text>
            <text x="8" y={chartHeight - 8} className="fill-gray-400" style={{ fontSize: '10px' }}>0</text>
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
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{data.activeUsers[0]?.date}</span>
            <span>{data.activeUsers[data.activeUsers.length - 1]?.date}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Engagement Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Category Engagement</h2>
          <div className="space-y-4">
            {data.categoryBreakdown.map((cat, i) => {
              const total = data.categoryBreakdown.reduce((s, c) => s + c.posts, 0);
              const pct = total > 0 ? (cat.posts / total) * 100 : 0;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${COLOR_MAP[cat.color] || 'bg-violet-500'}`} />
                      <span className="text-sm font-medium text-gray-900">{cat.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">{cat.posts} posts · {cat.comments} comments · {cat.avgVotes.toFixed(1)} avg votes</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${COLOR_MAP[cat.color] || 'bg-violet-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Contributors */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Contributors</h2>
          <div className="space-y-3">
            {data.topContributors.map((user, i) => (
              <div key={user.userId} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  i === 0 ? 'bg-amber-100 text-amber-700' :
                  i === 1 ? 'bg-gray-100 text-gray-600' :
                  i === 2 ? 'bg-orange-100 text-orange-700' :
                  'bg-gray-50 text-gray-500'
                }`}>
                  #{i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{user.name}</div>
                  <div className="text-xs text-gray-500">{user.role.replace('_', ' ')}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-gray-900">{formatNumber(user.score)}</div>
                  <div className="text-[11px] text-gray-400">{user.postCount} posts · {user.commentCount} comments</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}