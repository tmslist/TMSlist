import { useState, useEffect, useCallback } from 'react';

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

interface SuspiciousPattern {
  type: string;
  description: string;
  count: number;
  severity: 'low' | 'medium' | 'high';
}

function getActionBadge(action: string): { bg: string; text: string } {
  if (/^create_/.test(action)) return { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' };
  if (/^update_/.test(action)) return { bg: 'bg-[var(--paper2)] dark:bg-[var(--paper2)]', text: 'text-[var(--ink)] dark:text-[var(--ink2)]' };
  if (/^delete_/.test(action)) return { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' };
  if (/^publish_/.test(action)) return { bg: 'bg-[rgba(10,22,40,0.08)] dark:bg-[#0A1628]/30', text: 'text-[var(--ink)] dark:text-[var(--ink2)]' };
  if (/login|logout/.test(action)) return { bg: 'bg-[var(--paper2)] dark:bg-[var(--ink2)]', text: 'text-[var(--ink2)] dark:text-[var(--muted)]' };
  return { bg: 'bg-[var(--paper2)] dark:bg-[var(--ink2)]', text: 'text-[var(--ink2)] dark:text-[var(--muted)]' };
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function exportToCSV(entries: AuditEntry[]) {
  const headers = ['Timestamp', 'User Email', 'User Name', 'Action', 'Entity Type', 'Entity ID', 'Details'];
  const rows = entries.map(e => [e.createdAt, e.userEmail || '', e.userName || '', e.action, e.entityType, e.entityId || '', e.details ? JSON.stringify(e.details) : '']);
  const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit-trail-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function detectSuspicious(entries: AuditEntry[]): SuspiciousPattern[] {
  const patterns: SuspiciousPattern[] = [];
  const recent = entries.filter(e => Date.now() - new Date(e.createdAt).getTime() < 3600000);

  // Multiple failed logins
  const failedActions = recent.filter(e => /failed|error|unauthorized/.test(e.action));
  if (failedActions.length > 5) patterns.push({ type: 'bulk_failed_actions', description: 'High number of failed actions in the last hour', count: failedActions.length, severity: 'high' });

  // Bulk deletes
  const deletes = entries.filter(e => /^delete_/.test(e.action));
  if (deletes.length > 10) patterns.push({ type: 'bulk_deletes', description: 'High number of delete operations', count: deletes.length, severity: 'medium' });

  // Rapid changes
  const rapidActions = entries.reduce((acc, e) => { acc[e.action] = (acc[e.action] || 0) + 1; return acc; }, {} as Record<string, number>);
  Object.entries(rapidActions).filter(([, count]) => count > 50).forEach(([action, count]) => {
    patterns.push({ type: 'rapid_repeated', description: `Repeated action "${action}" many times`, count, severity: 'low' });
  });

  return patterns.slice(0, 5);
}

export default function AdminAuditTrail() {
  const [data, setData] = useState<{ entries: AuditEntry[]; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [suspiciousPatterns, setSuspiciousPatterns] = useState<SuspiciousPattern[]>([]);

  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(0);
  const limit = 50;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(limit), offset: String(page * limit) });
      if (actionFilter) params.set('action', actionFilter);
      if (entityFilter) params.set('entityType', entityFilter);
      if (userFilter) params.set('userId', userFilter);
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);

      const res = await fetch(`/api/admin/audit?${params}`);
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error();
      const json = await res.json();
      setData(json);
      setSuspiciousPatterns(detectSuspicious(json.entries));
    } catch {
      console.error('Failed to load audit trail');
    } finally {
      setLoading(false);
    }
  }, [actionFilter, entityFilter, userFilter, dateFrom, dateTo, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const clearFilters = () => {
    setActionFilter(''); setEntityFilter(''); setUserFilter(''); setDateFrom(''); setDateTo(''); setPage(0);
  };

  const hasFilters = actionFilter || entityFilter || userFilter || dateFrom || dateTo;
  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-[var(--ink)] dark:text-[var(--line)]">Audit Trail</h1>
          <p className="text-[var(--muted)] dark:text-[var(--muted)] mt-1 text-sm">
            {data ? `${data.total.toLocaleString()} total entries` : 'Loading...'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasFilters && (
            <button onClick={clearFilters} className="px-3 py-2 text-sm text-[var(--muted)] dark:text-[var(--muted)] hover:text-[var(--ink2)] dark:hover:text-[var(--line)] hover:bg-[var(--paper2)] dark:hover:bg-[var(--ink2)] rounded-lg transition-colors">Clear filters</button>
          )}
          <button onClick={() => data?.entries && exportToCSV(data.entries)} disabled={!data?.entries.length} className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-[var(--ink2)] border border-[var(--line)] dark:border-[var(--ink2)] rounded-lg text-sm font-medium text-[var(--ink2)] dark:text-[var(--line)] hover:bg-[var(--paper2)] dark:hover:bg-[var(--ink2)] disabled:opacity-50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Suspicious activity alerts */}
      {suspiciousPatterns.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Suspicious Activity Detected
          </h3>
          <div className="space-y-1">
            {suspiciousPatterns.map((p, i) => (
              <p key={i} className="text-xs text-red-700 dark:text-red-400">
                <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${
                  p.severity === 'high' ? 'bg-red-500' : p.severity === 'medium' ? 'bg-amber-500' : 'bg-yellow-500'
                }`} />
                {p.description} ({p.count})
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-[var(--ink2)] rounded-xl border border-[var(--line)] dark:border-[var(--ink2)] p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--muted)] dark:text-[var(--muted)] mb-1">Action</label>
            <input type="text" value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(0); }} placeholder="e.g. create_..." className="w-full rounded-lg border border-[var(--line)] dark:border-[var(--ink2)] px-3 py-2 text-sm bg-white dark:bg-[var(--ink2)] text-[var(--ink)] dark:text-[var(--line)]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--muted)] dark:text-[var(--muted)] mb-1">Entity Type</label>
            <input type="text" value={entityFilter} onChange={e => { setEntityFilter(e.target.value); setPage(0); }} placeholder="e.g. clinic, user..." className="w-full rounded-lg border border-[var(--line)] dark:border-[var(--ink2)] px-3 py-2 text-sm bg-white dark:bg-[var(--ink2)] text-[var(--ink)] dark:text-[var(--line)]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--muted)] dark:text-[var(--muted)] mb-1">From</label>
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(0); }} className="w-full rounded-lg border border-[var(--line)] dark:border-[var(--ink2)] px-3 py-2 text-sm bg-white dark:bg-[var(--ink2)] text-[var(--ink)] dark:text-[var(--line)]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--muted)] dark:text-[var(--muted)] mb-1">To</label>
            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(0); }} className="w-full rounded-lg border border-[var(--line)] dark:border-[var(--ink2)] px-3 py-2 text-sm bg-white dark:bg-[var(--ink2)] text-[var(--ink)] dark:text-[var(--line)]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--muted)] dark:text-[var(--muted)] mb-1">User ID</label>
            <input type="text" value={userFilter} onChange={e => { setUserFilter(e.target.value); setPage(0); }} placeholder="User ID..." className="w-full rounded-lg border border-[var(--line)] dark:border-[var(--ink2)] px-3 py-2 text-sm bg-white dark:bg-[var(--ink2)] text-[var(--ink)] dark:text-[var(--line)]" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[var(--ink2)] rounded-xl border border-[var(--line)] dark:border-[var(--ink2)] overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <div className="inline-block w-6 h-6 border-2 border-[var(--line)] border-t-[#0A1628] rounded-full animate-spin mb-3" />
            <p className="text-[var(--muted)] text-sm">Loading...</p>
          </div>
        ) : !data?.entries.length ? (
          <div className="p-16 text-center">
            <p className="text-[var(--muted)] dark:text-[var(--muted)]">No entries found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--line)] dark:divide-[var(--line)]">
              <thead className="bg-[var(--paper2)] dark:bg-[var(--paper2)]">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--muted)] dark:text-[var(--muted)] uppercase">Time</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--muted)] dark:text-[var(--muted)] uppercase">User</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--muted)] dark:text-[var(--muted)] uppercase">Action</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--muted)] dark:text-[var(--muted)] uppercase">Entity</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--muted)] dark:text-[var(--muted)] uppercase">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)] dark:divide-[var(--line)]">
                {data.entries.map(entry => {
                  const badge = getActionBadge(entry.action);
                  return (
                    <tr key={entry.id} className="hover:bg-[var(--paper2)] dark:hover:bg-[var(--ink2)] transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="text-xs text-[var(--muted)] dark:text-[var(--muted)] font-mono cursor-help" title={formatDateTime(entry.createdAt)}>{getRelativeTime(entry.createdAt)}</span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-[var(--ink)] dark:text-[var(--line)] truncate max-w-[180px]">
                        {entry.userEmail || entry.userName || <span className="text-[var(--muted)] italic">System</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>{entry.action}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-medium text-[var(--muted)] dark:text-[var(--muted)] bg-[var(--paper2)] dark:bg-[var(--ink2)] px-2 py-0.5 rounded">{entry.entityType || '-'}</span>
                        {entry.entityId && <span className="text-xs text-[var(--line)] dark:text-[var(--ink2)] ml-2 font-mono">{entry.entityId.slice(0, 8)}...</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        {entry.details ? (
                          <button onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)} className="text-xs text-[var(--ink)] dark:text-[var(--ink2)] hover:underline">{expandedId === entry.id ? 'Hide' : 'View'} JSON</button>
                        ) : <span className="text-xs text-[var(--line)] dark:text-[var(--ink2)]">-</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {expandedId && (() => {
              const entry = data.entries.find(e => e.id === expandedId);
              if (!entry?.details) return null;
              return (
                <div className="border-t border-[var(--line)] dark:border-[var(--ink2)] bg-[var(--paper2)] dark:bg-[var(--paper2)] px-6 py-4">
                  <div className="flex justify-between mb-3">
                    <span className="text-xs font-semibold text-[var(--muted)] uppercase">Entry Details</span>
                    <button onClick={() => setExpandedId(null)} className="text-xs text-[var(--muted)] hover:text-[var(--ink2)]">Close</button>
                  </div>
                  <pre className="text-xs text-[var(--ink2)] dark:text-[var(--line)] bg-white dark:bg-[var(--ink2)] border border-[var(--line)] dark:border-[var(--ink2)] rounded-lg p-4 overflow-x-auto max-h-64 font-mono">{JSON.stringify(entry.details, null, 2)}</pre>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {totalPages > 0 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-[var(--muted)] dark:text-[var(--muted)]">Page {page + 1} of {totalPages} ({data?.total.toLocaleString()} total)</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="px-3 py-1.5 bg-white dark:bg-[var(--ink2)] border border-[var(--line)] dark:border-[var(--ink2)] rounded-lg text-sm disabled:opacity-40 hover:bg-[var(--paper2)] dark:hover:bg-[var(--ink2)]">Previous</button>
            <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="px-3 py-1.5 bg-white dark:bg-[var(--ink2)] border border-[var(--line)] dark:border-[var(--ink2)] rounded-lg text-sm disabled:opacity-40 hover:bg-[var(--paper2)] dark:hover:bg-[var(--ink2)]">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
