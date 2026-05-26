import { useState, useEffect, useCallback } from 'react';

interface JobApplication {
  id: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string | null;
  resumeUrl: string | null;
  coverLetter: string | null;
  linkedInUrl: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  jobId: string;
  clinicId: string;
  jobTitle: string | null;
  jobRoleCategory: string | null;
  clinicName: string | null;
  clinicCity: string | null;
  clinicState: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-amber-100 text-amber-700',
  viewed: 'bg-[rgba(10,22,40,0.1)] text-[var(--ink)]',
  contacted: 'bg-[rgba(201,101,74,0.1)] text-[var(--warm)]',
  rejected: 'bg-[var(--paper2)] text-[var(--ink2)]',
  hired: 'bg-emerald-100 text-emerald-700',
};

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  viewed: 'Viewed',
  contacted: 'Contacted',
  rejected: 'Rejected',
  hired: 'Hired',
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  };
}

export default function AdminJobApplications() {
  const [apps, setApps] = useState<JobApplication[]>([]);
  const [stats, setStats] = useState({ total: 0, new: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [page, setPage] = useState(0);
  const [updating, setUpdating] = useState<string | null>(null);
  const limit = 50;

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchApps = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: String(limit), offset: String(page * limit) });
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/admin/job-applications?${params}`);
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setApps(json.data || []);
      setStats(json.stats || { total: 0, new: 0 });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { setPage(0); setSelectedIds(new Set()); setExpandedId(null); }, [statusFilter]);
  useEffect(() => { fetchApps(); }, [fetchApps]);

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    try {
      const res = await fetch('/api/admin/job-applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error();
      setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      showToast('success', `Status updated to "${STATUS_LABELS[status]}"`);
    } catch {
      showToast('error', 'Failed to update status');
    } finally {
      setUpdating(null);
    }
  }

  async function deleteSelected() {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} application(s)? This cannot be undone.`)) return;
    try {
      const res = await fetch('/api/admin/job-applications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (!res.ok) throw new Error();
      showToast('success', `Deleted ${selectedIds.size} application(s)`);
      setSelectedIds(new Set());
      fetchApps();
    } catch {
      showToast('error', 'Failed to delete');
    }
  }

  function exportCSV() {
    const headers = ['Applicant', 'Email', 'Phone', 'Job Title', 'Clinic', 'Status', 'Applied', 'Resume', 'LinkedIn'];
    const rows = filtered.map(a => [
      a.applicantName, a.applicantEmail, a.applicantPhone || '',
      a.jobTitle || '', a.clinicName || '', a.status,
      new Date(a.createdAt).toISOString(), a.resumeUrl || '', a.linkedInUrl || '',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `job_applications_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    showToast('success', 'CSV exported');
  }

  const filtered = searchQuery
    ? apps.filter(a =>
        a.applicantName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.applicantEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.clinicName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : apps;

  const totalPages = Math.ceil(stats.total / limit) || 1;

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.message}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-800 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700 text-xs font-medium ml-3">Dismiss</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-[var(--ink)]">Job Applications</h2>
          <p className="text-sm text-[var(--muted)] mt-0.5">
            {stats.total} total
            {stats.new > 0 && <span className="ml-2 text-amber-600 font-medium">· {stats.new} new</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchApps} className="px-3 py-2 bg-white border border-[var(--line)] rounded-lg text-sm font-medium text-[var(--ink2)] hover:bg-[var(--paper2)] transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Refresh
          </button>
          <button onClick={exportCSV} disabled={apps.length === 0} className="px-3 py-2 bg-[var(--ink2)] text-white rounded-lg text-sm font-semibold hover:bg-[var(--ink2)] transition-colors flex items-center gap-2 disabled:opacity-50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Bulk delete */}
      {selectedIds.size > 0 && (
        <div className="bg-[rgba(201,101,74,0.06)] border border-[var(--line)] rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--warm)]">{selectedIds.size} selected</span>
          <button onClick={deleteSelected} className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors">
            Delete Selected
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {['', 'new', 'viewed', 'contacted', 'rejected', 'hired'].map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(0); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === s ? 'bg-[var(--ink)] text-white' : 'bg-white border border-[var(--line)] text-[var(--ink2)] hover:bg-[var(--paper2)]'}`}>
              {s === '' ? 'All' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search applicant, job, or clinic..."
            className="w-full pl-9 pr-4 py-2 border border-[var(--line)] rounded-lg text-sm focus:border-[rgba(201,101,74,0.2)] focus:ring-1 focus:ring-[rgba(10,22,40,0.2)]" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-[var(--line)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[var(--paper2)] border-b border-[var(--line)]">
                <th className="px-4 py-3 w-10">
                  <input type="checkbox"
                    checked={selectedIds.size === filtered.length && filtered.length > 0}
                    onChange={() => selectedIds.size === filtered.length ? setSelectedIds(new Set()) : setSelectedIds(new Set(filtered.map(a => a.id)))}
                    className="rounded border-[var(--line)] text-[var(--warm)] focus:ring-[rgba(10,22,40,0.2)]" />
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Applicant</th>
                <th className="px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Position</th>
                <th className="px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Clinic</th>
                <th className="px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-[var(--muted)]">
                  <div className="inline-block w-5 h-5 border-2 border-[var(--line)] border-t-indigo-600 rounded-full animate-spin mb-2"></div><br />Loading...
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-[var(--muted)] text-sm">
                  {searchQuery ? 'No applications match your search.' : 'No job applications found.'}
                </td></tr>
              ) : filtered.map(app => {
                const { date, time } = formatDate(app.createdAt);
                const isExpanded = expandedId === app.id;
                return (
                  <>
                    <tr key={app.id}
                      className={`hover:bg-[var(--paper2)] transition-colors cursor-pointer ${isExpanded ? 'bg-[rgba(201,101,74,0.06)]' : ''}`}
                      onClick={() => setExpandedId(isExpanded ? null : app.id)}>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedIds.has(app.id)}
                          onChange={() => { const n = new Set(selectedIds); n.has(app.id) ? n.delete(app.id) : n.add(app.id); setSelectedIds(n); }}
                          className="rounded border-[var(--line)] text-[var(--warm)] focus:ring-[rgba(10,22,40,0.2)]" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-semibold text-[var(--ink)]">{app.applicantName}</div>
                        <div className="text-xs text-[var(--muted)]">{app.applicantEmail}</div>
                        {app.applicantPhone && <div className="text-xs text-[var(--muted)] mt-0.5">{app.applicantPhone}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-[var(--ink)]">{app.jobTitle || '--'}</div>
                        {app.jobRoleCategory && <div className="text-xs text-[var(--muted)] mt-0.5">{app.jobRoleCategory}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-[var(--ink)]">{app.clinicName || '--'}</div>
                        {app.clinicCity && <div className="text-xs text-[var(--muted)]">{app.clinicCity}, {app.clinicState}</div>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-[var(--ink2)]">{date}</div>
                        <div className="text-xs text-[var(--muted)]">{time}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[app.status] || STATUS_COLORS.new}`}>
                          {STATUS_LABELS[app.status] || 'New'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <svg className={`w-4 h-4 text-[var(--muted)] transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${app.id}-expanded`}>
                        <td colSpan={7} className="px-4 py-5 bg-[rgba(201,101,74,0.60)]">
                          <div className="space-y-4">
                            {app.coverLetter && (
                              <div>
                                <h4 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-1">Cover Letter</h4>
                                <p className="text-sm text-[var(--ink2)] bg-white border border-[var(--line)] rounded-lg px-4 py-3">{app.coverLetter}</p>
                              </div>
                            )}
                            <div className="flex flex-wrap gap-4">
                              {app.resumeUrl && (
                                <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[var(--line)] rounded-lg text-xs font-medium text-[var(--ink2)] hover:bg-[var(--paper2)]">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                  Resume
                                </a>
                              )}
                              {app.linkedInUrl && (
                                <a href={app.linkedInUrl} target="_blank" rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[var(--line)] rounded-lg text-xs font-medium text-[var(--ink2)] hover:bg-[var(--paper2)]">
                                  LinkedIn Profile
                                </a>
                              )}
                            </div>
                            <div className="flex items-center gap-3 pt-1">
                              <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mr-2">Update status:</span>
                              {(['new', 'viewed', 'contacted', 'rejected', 'hired'] as const).map(s => (
                                <button key={s} onClick={e => { e.stopPropagation(); if (app.status !== s) updateStatus(app.id, s); }}
                                  disabled={updating === app.id}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${app.status === s ? 'bg-[var(--ink2)] text-white' : 'bg-white border border-[var(--line)] text-[var(--ink2)] hover:bg-[var(--paper2)]'} disabled:opacity-50`}>
                                  {STATUS_LABELS[s]}
                                </button>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-[var(--line)] bg-[var(--paper2)] flex items-center justify-between">
            <span className="text-sm text-[var(--muted)]">Page {page + 1} of {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="px-3 py-1.5 bg-white border border-[var(--line)] rounded-lg text-sm disabled:opacity-50 hover:bg-[var(--paper2)]">Previous</button>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="px-3 py-1.5 bg-white border border-[var(--line)] rounded-lg text-sm disabled:opacity-50 hover:bg-[var(--paper2)]">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
