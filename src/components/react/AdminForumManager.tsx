import { useState, useCallback } from 'react';

interface ForumCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  sortOrder: number;
  postCount: number;
  lastActivityAt: string | null;
}

interface ForumPost {
  id: string;
  slug: string;
  title: string;
  body: string;
  status: 'published' | 'pending' | 'removed';
  isPinned: boolean;
  isLocked: boolean;
  voteScore: number;
  commentCount: number;
  isPinned?: boolean;
  isLocked?: boolean;
  createdAt: string;
  updatedAt: string;
  categoryId: string;
  authorId: string;
  authorName: string | null;
  authorRole: string;
  categorySlug?: string;
  categoryName?: string;
  categoryColor?: string;
}

interface Report {
  id: string;
  reporterId: string;
  targetType: string;
  targetId: string;
  reason: string;
  resolved: boolean;
  createdAt: string;
}

type Tab = 'threads' | 'categories' | 'moderation';

const COLOR_MAP: Record<string, string> = {
  violet: 'bg-violet-100 text-violet-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  rose: 'bg-rose-100 text-rose-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  blue: 'bg-blue-100 text-blue-700',
  teal: 'bg-teal-100 text-teal-700',
  indigo: 'bg-indigo-100 text-indigo-700',
};

const ICON_MAP: Record<string, string> = {
  brain: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
  specialist: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  currency: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  health: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  star: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  chart: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  heart: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
};

const STATUS_COLORS: Record<string, string> = {
  published: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  removed: 'bg-red-100 text-red-700',
};

export default function AdminForumManager() {
  const [activeTab, setActiveTab] = useState<Tab>('threads');
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [threads, setThreads] = useState<ForumPost[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Record<string, string>>({ status: '', category: '' });
  const [editingCategory, setEditingCategory] = useState<ForumCategory | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, threadsRes, reportsRes] = await Promise.all([
        fetch('/api/admin/forum/categories'),
        fetch('/api/admin/forum/threads'),
        fetch('/api/admin/forum/reports'),
      ]);

      const [catData, threadsData, reportsData] = await Promise.all([
        catRes.ok ? catRes.json() : {},
        threadsRes.ok ? threadsRes.json() : {},
        reportsRes.ok ? reportsRes.json() : {},
      ]);

      setCategories(catData.categories || catData || []);
      setThreads(threadsData.threads || threadsData.posts || []);
      setReports(reportsData.reports || reportsData || []);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(async () => { await fetchData(); }, [fetchData]);

  // Load data on mount
  const init = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, threadsRes, reportsRes] = await Promise.all([
        fetch('/api/admin/forum/categories'),
        fetch('/api/admin/forum/threads'),
        fetch('/api/admin/forum/reports'),
      ]);

      const [catData, threadsData, reportsData] = await Promise.all([
        catRes.ok ? catRes.json() : { categories: [] },
        threadsRes.ok ? threadsRes.json() : { threads: [] },
        reportsRes.ok ? reportsRes.json() : { reports: [] },
      ]);

      setCategories(Array.isArray(catData.categories) ? catData.categories : Array.isArray(catData) ? catData : []);
      setThreads(threadsData.threads || threadsData.posts || []);
      setReports(Array.isArray(reportsData.reports) ? reportsData.reports : Array.isArray(reportsData) ? reportsData : []);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  // Load on mount
  const [initialized, setInitialized] = useState(false);
  if (!initialized) {
    init().then(() => setInitialized(true));
  }

  const handlePinThread = useCallback(async (postId: string, pinned: boolean) => {
    setThreads(prev => prev.map(t => t.id === postId ? { ...t, isPinned: pinned } : t));
    try {
      await fetch(`/api/admin/forum/threads/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: pinned }),
      });
    } catch { /* silent */ }
  }, []);

  const handleLockThread = useCallback(async (postId: string, locked: boolean) => {
    setThreads(prev => prev.map(t => t.id === postId ? { ...t, isLocked: locked } : t));
    try {
      await fetch(`/api/admin/forum/threads/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isLocked: locked }),
      });
    } catch { /* silent */ }
  }, []);

  const handleDeleteThread = useCallback(async (postId: string) => {
    if (!confirm('Delete this thread? This action cannot be undone.')) return;
    setThreads(prev => prev.filter(t => t.id !== postId));
    try {
      await fetch(`/api/admin/forum/threads/${postId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch { /* silent */ }
  }, []);

  const handleResolveReport = useCallback(async (reportId: string) => {
    setReports(prev => prev.filter(r => r.id !== reportId));
    try {
      await fetch(`/api/admin/forum/reports/${reportId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch { /* silent */ }
  }, []);

  const handleCategorySave = useCallback(async (cat: ForumCategory) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/forum/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cat),
      });
      if (res.ok) {
        setCategories(prev => {
          const idx = prev.findIndex(c => c.id === cat.id);
          return idx >= 0 ? prev.map(c => c.id === cat.id ? cat : c) : [...prev, cat];
        });
        setEditingCategory(null);
      }
    } catch { /* silent */ }
    setSaving(false);
  }, []);

  const filteredThreads = threads.filter(t => {
    if (filter.status && t.status !== filter.status) return false;
    if (filter.category && t.categoryId !== filter.category) return false;
    return true;
  });

  const unresolvedReports = reports.filter(r => !r.resolved);

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'threads', label: 'Threads', count: threads.length },
    { key: 'categories', label: 'Categories', count: categories.length },
    { key: 'moderation', label: 'Moderation', count: unresolvedReports.length },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Forum Manager</h1>
          <p className="text-gray-500 mt-1">Manage forum categories, threads, and moderation</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-violet-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-1.5 text-xs px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded-full">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Threads Tab */}
      {activeTab === 'threads' && (
        <div>
          {/* Filters */}
          <div className="flex gap-3 mb-4">
            <select
              value={filter.status}
              onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:ring-violet-500"
            >
              <option value="">All statuses</option>
              <option value="published">Published</option>
              <option value="pending">Pending</option>
              <option value="removed">Removed</option>
            </select>
            <select
              value={filter.category}
              onChange={e => setFilter(f => ({ ...f, category: e.target.value }))}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:ring-violet-500"
            >
              <option value="">All categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Threads table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thread</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Author</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stats</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredThreads.map(thread => {
                  const colorKey = thread.categoryColor || 'violet';
                  return (
                    <tr key={thread.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <div className="flex items-center gap-2">
                            {thread.isPinned && (
                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded uppercase">PIN</span>
                            )}
                            {thread.isLocked && (
                              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded uppercase">LOCK</span>
                            )}
                          </div>
                          <a href={`/community/posts/${thread.slug}`} target="_blank" rel="noopener" className="text-sm font-semibold text-gray-900 hover:text-violet-600 line-clamp-1">
                            {thread.title}
                          </a>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{thread.body}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${COLOR_MAP[colorKey] || COLOR_MAP.violet}`}>
                          {thread.categoryName || thread.categorySlug || 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{thread.authorName || 'Unknown'}</div>
                        <div className="text-xs text-gray-500">{thread.authorRole}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[thread.status]}`}>
                          {thread.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                            {thread.voteScore}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            {thread.commentCount}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePinThread(thread.id, !thread.isPinned)}
                            className={`text-xs font-medium transition-colors ${thread.isPinned ? 'text-amber-600 hover:text-amber-700' : 'text-gray-400 hover:text-amber-600'}`}
                            title={thread.isPinned ? 'Unpin' : 'Pin'}
                          >
                            <svg className="w-4 h-4" fill={thread.isPinned ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleLockThread(thread.id, !thread.isLocked)}
                            className={`text-xs font-medium transition-colors ${thread.isLocked ? 'text-red-600 hover:text-red-700' : 'text-gray-400 hover:text-red-600'}`}
                            title={thread.isLocked ? 'Unlock' : 'Lock'}
                          >
                            <svg className="w-4 h-4" fill={thread.isLocked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteThread(thread.id)}
                            className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredThreads.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      {loading ? 'Loading...' : 'No threads found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(cat => {
              const colorKey = cat.color || 'violet';
              return (
                <div key={cat.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${COLOR_MAP[colorKey]?.split(' ')[0] || 'bg-violet-100'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={ICON_MAP[cat.icon || ''] || ICON_MAP.star} />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">{cat.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{cat.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingCategory(cat)}
                      className="text-xs text-violet-600 hover:text-violet-700 font-medium"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">{cat.postCount}</div>
                      <div className="text-[11px] text-gray-500">Posts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">{cat.sortOrder}</div>
                      <div className="text-[11px] text-gray-500">Order</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-mono text-gray-400">{cat.slug}</div>
                      <div className="text-[11px] text-gray-500">Slug</div>
                    </div>
                  </div>
                </div>
              );
            })}
            {categories.length === 0 && !loading && (
              <div className="col-span-full text-center py-12 text-gray-500">No categories yet</div>
            )}
          </div>
        </div>
      )}

      {/* Moderation Tab */}
      {activeTab === 'moderation' && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Reports Queue ({unresolvedReports.length})</h2>
          <div className="space-y-3">
            {unresolvedReports.map(report => (
              <div key={report.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        report.targetType === 'post' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {report.targetType}
                      </span>
                      <span className="text-xs text-gray-500">Report ID: {report.id.slice(0, 8)}</span>
                    </div>
                    <p className="text-sm text-gray-900 mt-2 font-medium">{report.reason}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(report.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleResolveReport(report.id)}
                      className="px-4 py-2 bg-violet-600 text-white text-xs font-medium rounded-lg hover:bg-violet-700 transition-colors"
                    >
                      Resolve
                    </button>
                    <button className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {unresolvedReports.length === 0 && (
              <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200">
                No pending reports
              </div>
            )}
          </div>
        </div>
      )}

      {/* Category Editor Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Category</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={editingCategory.name}
                    onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                  <input
                    type="text"
                    value={editingCategory.slug}
                    onChange={e => setEditingCategory({ ...editingCategory, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-mono focus:border-violet-500 focus:ring-violet-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editingCategory.description || ''}
                  onChange={e => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                  <select
                    value={editingCategory.icon || 'star'}
                    onChange={e => setEditingCategory({ ...editingCategory, icon: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500"
                  >
                    {Object.keys(ICON_MAP).map(k => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                  <select
                    value={editingCategory.color || 'violet'}
                    onChange={e => setEditingCategory({ ...editingCategory, color: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500"
                  >
                    {Object.keys(COLOR_MAP).map(k => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                <input
                  type="number"
                  value={editingCategory.sortOrder}
                  onChange={e => setEditingCategory({ ...editingCategory, sortOrder: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => handleCategorySave(editingCategory)}
                disabled={saving}
                className="px-5 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : 'Save Category'}
              </button>
              <button
                onClick={() => setEditingCategory(null)}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}