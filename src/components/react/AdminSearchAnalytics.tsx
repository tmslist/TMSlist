'use client';
import { useState, useCallback } from 'react';

interface SearchQuery {
  id: string;
  query: string;
  resultsCount: number;
  source: string;
  createdAt: string;
}

interface SearchAnalyticsProps {
  initialQueries?: SearchQuery[];
}

export default function AdminSearchAnalytics({ initialQueries = [] }: SearchAnalyticsProps) {
  const [queries, setQueries] = useState<SearchQuery[]>(initialQueries);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [loading, setLoading] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<string | null>(null);

  // Top queries (mock data for demo)
  const topQueries = [
    { query: 'tms therapy near me', count: 2847, ctr: 4.2 },
    { query: 'transcranial magnetic stimulation cost', count: 1923, ctr: 3.8 },
    { query: 'tms treatment for depression', count: 1654, ctr: 5.1 },
    { query: 'tms clinic new york', count: 1432, ctr: 4.7 },
    { query: 'neurostar tms', count: 1201, ctr: 3.2 },
    { query: 'tms side effects', count: 987, ctr: 2.9 },
    { query: 'fda approved tms', count: 876, ctr: 6.1 },
    { query: 'tms session duration', count: 754, ctr: 3.5 },
  ];

  // Zero-result queries
  const zeroResultQueries = [
    { query: 'tms for anxiety disorder', count: 23 },
    { query: 'tms treatment boston', count: 18 },
    { query: 'cheap tms near me', count: 12 },
    { query: 'tms for ocd treatment', count: 9 },
  ];

  // Volume trend data (mock)
  const volumeTrend = [
    { date: '2024-03-01', searches: 820 },
    { date: '2024-03-08', searches: 910 },
    { date: '2024-03-15', searches: 1042 },
    { date: '2024-03-22', searches: 987 },
    { date: '2024-03-29', searches: 1156 },
    { date: '2024-04-05', searches: 1234 },
    { date: '2024-04-12', searches: 1189 },
  ];

  // CTR by position
  const ctrByPosition = [
    { position: 1, ctr: 28.4 },
    { position: 2, ctr: 15.2 },
    { position: 3, ctr: 8.7 },
    { position: 4, ctr: 5.1 },
    { position: 5, ctr: 3.2 },
    { position: 6, ctr: 2.1 },
    { position: 7, ctr: 1.4 },
    { position: 8, ctr: 0.9 },
    { position: 9, ctr: 0.6 },
    { position: 10, ctr: 0.4 },
  ];

  const handleExport = useCallback(() => {
    const csvContent = [
      'Query,Search Count,CTR,Results',
      ...topQueries.map(q => `"${q.query}",${q.count},${q.ctr}%,`),
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `search-analytics-${timeRange}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [timeRange]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Search Analytics</h2>
          <p className="text-sm text-gray-500 mt-1">Understand how users find your listings</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Searches</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">12,847</p>
          <p className="text-xs text-emerald-600 mt-1">+18.3% vs last period</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Zero Results</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">62</p>
          <p className="text-xs text-gray-500 mt-1">Opportunity gaps</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Avg CTR</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">4.1%</p>
          <p className="text-xs text-emerald-600 mt-1">+0.3% vs last period</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Top Query</p>
          <p className="text-lg font-semibold text-gray-900 mt-1 truncate">tms therapy near me</p>
          <p className="text-xs text-gray-500 mt-1">2,847 searches</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Search Queries */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Top Search Queries</h3>
            <span className="text-xs text-gray-500">{timeRange}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Query</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Searches</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">CTR</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {topQueries.map((item, idx) => (
                  <tr key={item.query} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-semibold flex items-center justify-center">{idx + 1}</span>
                        <span className="text-sm font-medium text-gray-900">{item.query}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right text-sm font-medium text-gray-700">{item.count.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        item.ctr >= 5 ? 'bg-emerald-100 text-emerald-700' :
                        item.ctr >= 3 ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {item.ctr}%
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                        <span className="text-xs text-emerald-600 font-medium">{Math.floor(Math.random() * 20 + 5)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Zero Result Queries */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Zero Results</h3>
              <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">62 total</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Queries with no results — content gaps</p>
          </div>
          <div className="p-5 space-y-3">
            {zeroResultQueries.map((item) => (
              <div key={item.query} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-800">{item.query}</p>
                  <p className="text-xs text-gray-400">{item.count} searches</p>
                </div>
                <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">Create page</button>
              </div>
            ))}
            <button className="w-full text-center text-xs text-blue-600 hover:text-blue-700 font-medium py-2">
              View all 62 zero-result queries →
            </button>
          </div>
        </div>
      </div>

      {/* Volume Trend */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Search Volume Trend</h3>
          <span className="text-xs text-gray-500">{timeRange}</span>
        </div>
        <div className="p-5">
          <div className="flex items-end gap-2 h-48">
            {volumeTrend.map((item, idx) => {
              const maxVal = Math.max(...volumeTrend.map(v => v.searches));
              const heightPct = (item.searches / maxVal) * 100;
              return (
                <div key={item.date} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-blue-500 rounded-t-sm hover:bg-blue-600 transition-colors cursor-pointer group relative"
                    style={{ height: `${heightPct}%` }}
                  >
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none z-10">
                      {item.searches.toLocaleString()}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(item.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTR by Position */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Click-Through Rate by Result Position</h3>
          <p className="text-xs text-gray-500 mt-1">How often users click on results at each position</p>
        </div>
        <div className="p-5">
          <div className="space-y-3">
            {ctrByPosition.map((item) => (
              <div key={item.position} className="flex items-center gap-4">
                <span className="w-8 text-xs font-medium text-gray-500 text-right">#{item.position}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full flex items-center justify-end pr-3 transition-all"
                    style={{ width: `${(item.ctr / 30) * 100}%` }}
                  >
                    <span className="text-xs font-semibold text-white">{item.ctr}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search Sources */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Organic Search</p>
              <p className="text-xs text-gray-400">Google, Bing</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">8,234</p>
          <p className="text-xs text-emerald-600 mt-1">64.1% of all searches</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Direct</p>
              <p className="text-xs text-gray-400">Direct traffic</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">3,456</p>
          <p className="text-xs text-emerald-600 mt-1">26.9% of all searches</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Referral</p>
              <p className="text-xs text-gray-400">Other sites</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">1,157</p>
          <p className="text-xs text-gray-500 mt-1">9.0% of all searches</p>
        </div>
      </div>
    </div>
  );
}