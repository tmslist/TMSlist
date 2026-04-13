import { useState, useEffect, useCallback, useMemo } from 'react';

interface AuditEntry {
  id: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
  userEmail: string | null;
  userName: string | null;
}

interface UserFilter {
  userId: string;
  email: string;
  name: string | null;
}

interface AuditResponse {
  entries: AuditEntry[];
  total: number;
  limit: number;
  offset: number;
  filters: {
    actions: string[];
    entityTypes: string[];
    users: UserFilter[];
  };
}

const ENTITY_LINKS: Record<string, string> = {
  blog: '/admin/blog',
  clinic: '/admin/clinics',
  review: '/admin/reviews',
  user: '/admin/users',
  lead: '/admin/leads',
  seo: '/admin/seo',
  treatment: '/admin/treatments',
  question: '/admin/questions',
  doctor: '/admin/doctors',
};

function getActionBadge(action: string): { bg: string; text: string; dot: string } {
  if (/^create_/.test(action)) return { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' };
  if (/^update_/.test(action)) return { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' };
  if (/^delete_/.test(action)) return { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' };
  if (/^(approve_|verify_)/.test(action)) return { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-500' };
  if (/^merge_/.test(action)) return { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' };
  if (/^(login|logout)/.test(action)) return { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' };
  return { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-400' };
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(diff / 86400000);
  if (days < 7) return `${days}d ago`;

  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateInput(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toISOString().split('T')[0];
}

function entriesToCSV(entries: AuditEntry[]): string {
  const headers = ['Timestamp', 'User Email', 'User Name', 'Action', 'Entity Type', 'Entity ID', 'Details'];
  const rows = entries.map((e) => [
    e.createdAt,
    e.userEmail || '',
    e.userName || '',
    e.action,
    e.entityType,
    e.entityId || '',
    e.details ? JSON.stringify(e.details) : '',
  ]);
  return [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
}

const ENTITY_TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'user', label: 'user' },
  { value: 'clinic', label: 'clinic' },
  { value: 'review', label: 'review' },
  { value: 'blog', label: 'blog' },
  { value: 'lead', label: 'lead' },
  { value: 'seo', label: 'seo' },
  { value: 'treatment', label: 'treatment' },
  { value: 'question', label: 'question' },
  { value: 'doctor', label: 'doctor' },
];

export default function AdminAuditLog() {
  const [data, setData] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filter state
  const [actionSearch, setActionSearch] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(0);
  const limit = 50;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', String(limit));
      params.set('offset', String(page * limit));
      if (actionSearch) params.set('action', actionSearch);
      if (userIdFilter) params.set('userId', userIdFilter);
      if (entityTypeFilter) params.set('entityType', entityTypeFilter);
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);

      const res = await fetch(`/api/admin/audit?${params}`);
      if (res.ok) setData(await res.json());
    } catch (err) {
      console.error('Failed to fetch audit log:', err);
    } finally {
      setLoading(false);
    }
  }, [actionSearch, userIdFilter, entityTypeFilter, dateFrom, dateTo, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExportCSV = () => {
    if (!data?.entries.length) return;
    const csv = entriesToCSV(data.entries);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearFilters = () => {
    setActionSearch('');
    setUserIdFilter('');
    setEntityTypeFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(0);
  };

  const hasFilters = actionSearch || userIdFilter || entityTypeFilter || dateFrom || dateTo;
  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  // Build entity type options dynamically
  const entityTypeOptions = useMemo(() => {
    const all = [...new Set([...ENTITY_TYPE_OPTIONS.map(o => o.value), ...(data?.filters.entityTypes ?? [])])];
    return [
      { value: '', label: 'All types' },
      ...all.filter(Boolean).map(v => ({ value: v, label: v })),
    ];
  }, [data?.filters.entityTypes]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Audit Log</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {data ? `${data.total.toLocaleString()} total entries` : 'Loading...'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasFilters && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Clear filters
            </button>
          )}
          <button
            onClick={handleExportCSV}
            disabled={!data?.entries.length}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Action search */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Action Search</label>
            <input
              type="text"
              value={actionSearch}
              onChange={(e) => { setActionSearch(e.target.value); setPage(0); }}
              placeholder="e.g. approve_review..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 placeholder-gray-400"
            />
          </div>

          {/* User filter */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">User</label>
            <select
              value={userIdFilter}
              onChange={(e) => { setUserIdFilter(e.target.value); setPage(0); }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            >
              <option value="">All users</option>
              {data?.filters.users.map((u) => (
                <option key={u.userId} value={u.userId}>
                  {u.email}{u.name ? ` (${u.name})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Entity type */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Entity Type</label>
            <select
              value={entityTypeFilter}
              onChange={(e) => { setEntityTypeFilter(e.target.value); setPage(0); }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            >
              {entityTypeOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Date from */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            />
          </div>

          {/* Date to */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <div className="inline-block w-6 h-6 border-2 border-gray-200 border-t-violet-600 rounded-full animate-spin mb-3" />
            <p className="text-gray-400 text-sm">Loading audit log...</p>
          </div>
        ) : !data?.entries.length ? (
          <div className="p-16 text-center">
            <svg className="w-10 h-10 mx-auto text-gray-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium text-gray-400">No entries found</p>
            <p className="text-sm text-gray-300 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Time</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Action</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Entity</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.entries.map((entry) => {
                  const badge = getActionBadge(entry.action);
                  const linkPath = entry.entityType ? ENTITY_LINKS[entry.entityType] : null;
                  return (
                    <tr key={entry.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          className="text-xs text-gray-500 font-mono cursor-help"
                          title={new Date(entry.createdAt).toLocaleString()}
                        >
                          {getRelativeTime(entry.createdAt)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-sm text-gray-900 truncate max-w-[180px]" title={entry.userEmail ?? undefined}>
                          {entry.userEmail
                            ? <span className="font-medium">{entry.userEmail}</span>
                            : entry.userName
                              ? <span className="text-gray-600">{entry.userName}</span>
                              : <span className="text-gray-400 italic">System</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot} flex-shrink-0`} />
                          {entry.action}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                            {entry.entityType || '-'}
                          </span>
                          {entry.entityId && linkPath ? (
                            <span
                              title={`Go to ${entry.entityType} (ID: ${entry.entityId})`}
                              className="inline-flex items-center justify-center w-5 h-5 text-gray-400 hover:text-violet-600 transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </span>
                          ) : entry.entityId ? (
                            <span className="text-xs text-gray-300 font-mono">{entry.entityId.slice(0, 8)}</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {entry.details ? (
                          <button
                            onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                            className="text-xs font-medium text-violet-600 hover:text-violet-800 transition-colors"
                          >
                            {expandedId === entry.id ? 'Hide' : 'View'} JSON
                          </button>
                        ) : (
                          <span className="text-xs text-gray-300">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Expanded details */}
            {expandedId && (() => {
              const entry = data.entries.find((e) => e.id === expandedId);
              if (!entry?.details) return null;
              return (
                <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Entry Details</span>
                    <button
                      onClick={() => setExpandedId(null)}
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                  <pre className="text-xs text-gray-600 bg-white border border-gray-200 rounded-lg p-4 overflow-x-auto max-h-64 font-mono leading-relaxed">
                    {JSON.stringify(entry.details, null, 2)}
                  </pre>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-sm text-gray-500">
            Page {page + 1} of {totalPages}
            <span className="ml-2 text-gray-400">
              ({data?.total.toLocaleString()} total)
            </span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>
            <span className="text-sm text-gray-400 min-w-[80px] text-center">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}