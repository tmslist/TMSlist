import { useState, useEffect, useCallback, useRef } from 'react';

interface ScheduledPost {
  slug: string;
  title: string;
  description: string;
  publishDate: string;
  category: string;
  author: string;
  status: string;
  exists: boolean;
}

interface SchedulerSummary {
  total: number;
  published: number;
  scheduled: number;
  pending: number;
  generated: number;
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const STATUS_STYLES: Record<string, string> = {
  published: 'bg-emerald-100 text-emerald-700',
  scheduled: 'bg-blue-100 text-blue-700',
  pending_publish: 'bg-amber-100 text-amber-700',
  scheduled_pending: 'bg-indigo-100 text-indigo-700',
  draft: 'bg-gray-100 text-gray-600',
};

const CATEGORY_ICONS: Record<string, string> = {
  treatment: '💊',
  research: '🔬',
  insurance: '🏥',
  faq: '❓',
  'patient-guide': '📋',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

function getMonthLabel(key: string): string {
  const [year, month] = key.split('-');
  return `${MONTH_NAMES[parseInt(month, 10) - 1]} ${year}`;
}

export default function AdminBlogScheduler() {
  const [posts, setPosts] = useState<Record<string, ScheduledPost[]>>({});
  const [summary, setSummary] = useState<SchedulerSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [resultMsg, setResultMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'generated'>('all');
  const resultTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchScheduler = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/blog-scheduler');
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      const json = await res.json();
      if (res.ok) {
        setPosts(json.byMonth || {});
        setSummary(json.summary);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchScheduler(); }, [fetchScheduler]);

  // Auto-clear success messages
  useEffect(() => {
    if (resultMsg) {
      resultTimer.current = setTimeout(() => setResultMsg(null), 5000);
    }
    return () => { if (resultTimer.current) clearTimeout(resultTimer.current); };
  }, [resultMsg]);

  async function handleGenerate(mode: 'all' | 'month', month?: number) {
    setGenerating(true);
    setResultMsg(null);
    try {
      const body: Record<string, unknown> = mode === 'all' ? { all: true } : { month };
      const res = await fetch('/api/admin/blog-scheduler/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (res.ok) {
        const msg = json.errors === 0
          ? `Generated ${json.generated} post${json.generated !== 1 ? 's' : ''} successfully.`
          : `Generated ${json.generated} post${json.generated !== 1 ? 's' : ''} with ${json.errors} error${json.errors !== 1 ? 's' : ''}.`;
        setResultMsg({ type: json.errors === 0 ? 'success' : 'error', text: msg });
        await fetchScheduler();
      } else {
        setResultMsg({ type: 'error', text: json.error || 'Generation failed' });
      }
    } catch {
      setResultMsg({ type: 'error', text: 'Network error during generation' });
    } finally {
      setGenerating(false);
    }
  }

  function toggleMonth(key: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  // Build filtered month list
  const monthKeys = Object.keys(posts).sort();
  const filteredKeys = selectedMonth
    ? monthKeys.filter(k => k === selectedMonth)
    : monthKeys;

  // Count posts by filter
  const allPostsFlat = Object.values(posts).flat();
  const pendingCount = allPostsFlat.filter(p => !p.exists).length;
  const generatedCount = allPostsFlat.filter(p => p.exists).length;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Blog Scheduler</h1>
          <p className="text-gray-500 mt-1">Auto-schedule SEO blog posts for May–December 2026</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchScheduler}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button
            onClick={() => handleGenerate('all')}
            disabled={generating}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {generating ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating...</>
            ) : (
              <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Generate All Pending</>
            )}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Scheduled', value: summary.total, color: 'text-gray-900', bg: 'bg-white' },
            { label: 'Published', value: summary.published, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Pending Generation', value: summary.pending, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Files Generated', value: summary.generated, color: 'text-violet-600', bg: 'bg-violet-50' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`${bg} rounded-xl border border-gray-200 p-4`}>
              <p className="text-sm font-medium text-gray-500">{label}</p>
              <p className={`text-2xl font-semibold mt-1 ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg p-1">
          {[
            { key: 'all', label: `All (${allPostsFlat.length})` },
            { key: 'pending', label: `Pending (${pendingCount})` },
            { key: 'generated', label: `Generated (${generatedCount})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as typeof filter)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filter === key ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <select
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
        >
          <option value="">All months</option>
          {monthKeys.map(k => (
            <option key={k} value={k}>{getMonthLabel(k)}</option>
          ))}
        </select>
      </div>

      {/* Result message */}
      {resultMsg && (
        <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
          resultMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
          resultMsg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
          'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          {resultMsg.type === 'success' && <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
          {resultMsg.type === 'error' && <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
          {resultMsg.text}
          <button onClick={() => setResultMsg(null)} className="ml-auto opacity-60 hover:opacity-100">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {filteredKeys.map(key => {
            const monthPosts = posts[key].filter(p => {
              if (filter === 'pending') return !p.exists;
              if (filter === 'generated') return p.exists;
              return true;
            });
            if (monthPosts.length === 0) return null;
            const isOpen = expanded.has(key);
            const monthDate = new Date(key + '-01T00:00:00');
            const isPast = monthDate < new Date(new Date().getFullYear(), new Date().getMonth(), 1);

            return (
              <div key={key} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Month header */}
                <button
                  onClick={() => toggleMonth(key)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                      isPast ? 'bg-emerald-100 text-emerald-700' : 'bg-violet-100 text-violet-700'
                    }`}>
                      {MONTH_NAMES[monthDate.getMonth()].slice(0, 3)}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-900">{getMonthLabel(key)}</p>
                      <p className="text-xs text-gray-500">{monthPosts.length} post{monthPosts.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Mini status pills */}
                    <div className="hidden sm:flex items-center gap-1.5">
                      {monthPosts.filter(p => p.exists).length > 0 && (
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                          {monthPosts.filter(p => p.exists).length} generated
                        </span>
                      )}
                      {monthPosts.filter(p => !p.exists).length > 0 && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                          {monthPosts.filter(p => !p.exists).length} pending
                        </span>
                      )}
                    </div>
                    {/* Generate month button */}
                    {!isPast && monthPosts.some(p => !p.exists) && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleGenerate('month', monthDate.getMonth() + 1); }}
                        disabled={generating}
                        className="text-xs bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                      >
                        Generate Month
                      </button>
                    )}
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Posts list */}
                {isOpen && (
                  <div className="border-t border-gray-100 divide-y divide-gray-50">
                    {monthPosts.map(post => (
                      <div key={post.slug} className="px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                        <div className="text-lg">{CATEGORY_ICONS[post.category] || '📄'}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900 truncate">{post.title}</p>
                            <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              STATUS_STYLES[post.status] || STATUS_STYLES.draft
                            }`}>
                              {post.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 truncate mt-0.5">{post.description}</p>
                        </div>
                        <div className="hidden sm:block text-xs text-gray-400 shrink-0">
                          {formatDate(post.publishDate)}
                        </div>
                        {post.exists ? (
                          <a
                            href={`/blog/${post.slug}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 p-1.5 text-gray-400 hover:text-violet-600 rounded-lg hover:bg-violet-50 transition-colors"
                            title="View post"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        ) : (
                          <button
                            onClick={() => handleGenerate('all')}
                            disabled={generating}
                            className="shrink-0 text-xs text-violet-600 hover:text-violet-700 font-medium disabled:opacity-50"
                          >
                            Generate
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {filteredKeys.length === 0 && (
            <div className="text-center py-16">
              <svg className="w-12 h-12 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              <p className="text-gray-500">No posts match the current filter.</p>
            </div>
          )}
        </div>
      )}

      {/* How it works */}
      <div className="mt-8 bg-slate-50 rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">How Auto-Publishing Works</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600">
          <div className="flex gap-3">
            <div className="w-6 h-6 bg-violet-100 text-violet-700 rounded-full flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">1</div>
            <div>
              <p className="font-medium text-gray-800">Generate posts</p>
              <p className="text-xs mt-0.5">Click "Generate All Pending" to create markdown files with SEO-optimized content.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 bg-violet-100 text-violet-700 rounded-full flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">2</div>
            <div>
              <p className="font-medium text-gray-800">Git push / rebuild</p>
              <p className="text-xs mt-0.5">Commit and push the new files — the site rebuilds and picks up all new posts.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 bg-violet-100 text-violet-700 rounded-full flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">3</div>
            <div>
              <p className="font-medium text-gray-800">Auto-appears on publish date</p>
              <p className="text-xs mt-0.5">Posts display on the blog listing page based on their publishDate frontmatter field.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
