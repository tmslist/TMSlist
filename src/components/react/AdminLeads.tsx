import { useState, useEffect, useCallback } from 'react';

interface Lead {
  id: string;
  type: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  clinicId: string | null;
  doctorName: string | null;
  clinicName: string | null;
  sourceUrl: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface Stats {
  total: number;
  specialist_enquiry?: number;
  lead_magnet?: number;
  newsletter?: number;
  quiz_lead?: number;
  callback_request?: number;
  whatsapp_inquiry?: number;
  appointment_request?: number;
  contact?: number;
}

type TabKey = 'all' | 'specialist_enquiry' | 'lead_magnet' | 'newsletter' | 'quiz_lead' | 'callback_request' | 'whatsapp_inquiry' | 'appointment_request' | 'contact';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'specialist_enquiry', label: 'Specialist Enquiry' },
  { key: 'lead_magnet', label: 'Lead Magnet' },
  { key: 'newsletter', label: 'Newsletter' },
  { key: 'quiz_lead', label: 'Quiz Lead' },
  { key: 'callback_request', label: 'Callback' },
  { key: 'whatsapp_inquiry', label: 'WhatsApp' },
  { key: 'appointment_request', label: 'Appointment' },
  { key: 'contact', label: 'Contact' },
];

const TYPE_COLORS: Record<string, string> = {
  specialist_enquiry: 'bg-[rgba(201,101,74,0.1)] text-[var(--warm)]',
  lead_magnet: 'bg-[rgba(10,22,40,0.1)] text-[var(--ink)]',
  newsletter: 'bg-[rgba(10,22,40,0.1)] text-[var(--ink)]',
  quiz_lead: 'bg-[rgba(201,101,74,0.1)] text-[var(--warm)]',
  callback_request: 'bg-amber-100 text-amber-700',
  whatsapp_inquiry: 'bg-green-100 text-green-700',
  appointment_request: 'bg-[rgba(201,101,74,0.1)] text-[var(--warm)]',
  contact: 'bg-[var(--paper2)] text-[var(--ink2)]',
};

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-[var(--paper2)] text-[var(--ink2)]',
  contacted: 'bg-[rgba(10,22,40,0.1)] text-[var(--ink)]',
  converted: 'bg-emerald-100 text-emerald-700',
};

function formatType(type: string) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function getLeadStatus(metadata: Record<string, unknown> | null): string {
  return (metadata?.status as string) || 'new';
}

function getFormPage(metadata: Record<string, unknown> | null): string | null {
  return (metadata?.formPage as string) || (metadata?.page as string) || null;
}

function getContactPreference(metadata: Record<string, unknown> | null): string | null {
  return (metadata?.contactPreference as string) || null;
}

function getUtmParams(metadata: Record<string, unknown> | null): Record<string, string> | null {
  if (!metadata) return null;
  const utm: Record<string, string> = {};
  if (metadata.utm_source) utm.utm_source = metadata.utm_source as string;
  if (metadata.utm_medium) utm.utm_medium = metadata.utm_medium as string;
  if (metadata.utm_campaign) utm.utm_campaign = metadata.utm_campaign as string;
  if (metadata.utm_content) utm.utm_content = metadata.utm_content as string;
  return Object.keys(utm).length > 0 ? utm : null;
}

function getReferralSource(metadata: Record<string, unknown> | null): string | null {
  return (metadata?.referralSource as string) || (metadata?.referral_source as string) || null;
}

function formatSource(url: string | null) {
  if (!url) return '-';
  try {
    const parsed = new URL(url);
    return parsed.pathname || parsed.hostname;
  } catch {
    return url;
  }
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  };
}

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0 });
  const [tab, setTab] = useState<TabKey>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [page, setPage] = useState(0);
  const limit = 50;

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: String(limit), offset: String(page * limit) });
      if (tab !== 'all') params.set('type', tab);
      const res = await fetch(`/api/admin/leads?${params}`);
      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch leads');
      const json = await res.json();
      setLeads(json.data);
      setStats(json.stats);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => {
    setPage(0);
    setSelectedIds(new Set());
    setExpandedId(null);
    fetchLeads();
  }, [tab, fetchLeads]);

  useEffect(() => {
    fetchLeads();
  }, [page]);

  // Search filter
  const filteredLeads = searchQuery
    ? leads.filter((lead) => {
        const q = searchQuery.toLowerCase();
        return (
          (lead.email || '').toLowerCase().includes(q) ||
          (lead.name || '').toLowerCase().includes(q) ||
          (lead.message || '').toLowerCase().includes(q) ||
          (lead.clinicName || '').toLowerCase().includes(q)
        );
      })
    : leads;

  async function handleStatusUpdate(id: string, status: string) {
    setUpdating(id);
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to update status');
      setLeads((prev) =>
        prev.map((l) =>
          l.id === id
            ? { ...l, metadata: { ...(l.metadata || {}), status } }
            : l
        )
      );
      showToast('success', `Status updated to "${status}"`);
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdating(null);
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    setDeleting(true);
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to delete leads');
      showToast('success', `Deleted ${selectedIds.size} lead(s)`);
      setSelectedIds(new Set());
      fetchLeads();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to delete leads');
    } finally {
      setDeleting(false);
    }
  }

  function exportCSV() {
    const headers = ['email', 'name', 'type', 'created_at', 'clinic_name', 'status'];
    const rows = filteredLeads.map((lead) =>
      [
        lead.email || '',
        lead.name || '',
        lead.type,
        new Date(lead.createdAt).toISOString(),
        lead.clinicName || '',
        getLeadStatus(lead.metadata),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    showToast('success', 'CSV exported');
  }

  function toggleSelectAll() {
    if (selectedIds.size === filteredLeads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredLeads.map((l) => l.id)));
    }
  }

  function toggleSelect(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  const totalPages = Math.ceil(stats.total / limit) || 1;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
            toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-800 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700 text-xs font-medium ml-3">
            Dismiss
          </button>
        </div>
      )}

      {/* Header row: title + actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-[var(--ink)]">Leads</h2>
          <p className="text-sm text-[var(--muted)] mt-0.5">{stats.total} total</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchLeads}
            className="px-3 py-2 bg-white border border-[var(--line)] rounded-lg text-sm font-medium text-[var(--ink2)] hover:bg-[var(--paper2)] transition-colors flex items-center gap-2"
            title="Refresh"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button
            onClick={exportCSV}
            disabled={leads.length === 0}
            className="px-3 py-2 bg-[var(--ink2)] text-white rounded-lg text-sm font-semibold hover:bg-[var(--ink2)] transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="bg-[rgba(201,101,74,0.06)] border border-[var(--line)] rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--warm)]">{selectedIds.size} selected</span>
          <button
            onClick={handleBulkDelete}
            disabled={deleting}
            className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete Selected'}
          </button>
        </div>
      )}

      {/* Search + tabs row */}
      <div className="flex flex-col gap-3">
        {/* Type filter tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setPage(0); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shrink-0 ${
                tab === t.key
                  ? 'bg-[var(--ink)] text-white'
                  : 'text-[var(--ink2)] hover:bg-[var(--paper2)]'
              }`}
            >
              {t.label}
              {stats[t.key] > 0 && (
                <span
                  className={`ml-1.5 text-xs ${
                    tab === t.key ? 'text-[var(--line)]' : 'text-[var(--muted)]'
                  }`}
                >
                  {stats[t.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search bar */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by email, name, message, or clinic..."
            className="w-full pl-9 pr-4 py-2 border border-[var(--line)] rounded-lg text-sm focus:border-[rgba(201,101,74,0.2)] focus:ring-1 focus:ring-[rgba(10,22,40,0.2)]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-[var(--line)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[var(--paper2)] border-b border-[var(--line)]">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredLeads.length && filteredLeads.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-[var(--line)] text-[var(--warm)] focus:ring-[rgba(10,22,40,0.2)]"
                  />
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Contact</th>
                <th className="px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Clinic / Doctor</th>
                <th className="px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-[var(--muted)]">
                    <div className="inline-block w-5 h-5 border-2 border-[var(--line)] border-t-indigo-600 rounded-full animate-spin mb-2"></div>
                    <br />
                    Loading...
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[var(--muted)] text-sm">
                    {searchQuery ? 'No leads match your search.' : 'No leads found.'}
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const { date, time } = formatDate(lead.createdAt);
                  const isExpanded = expandedId === lead.id;
                  const status = getLeadStatus(lead.metadata);
                  const utmParams = getUtmParams(lead.metadata);
                  const contactPref = getContactPreference(lead.metadata);
                  const referral = getReferralSource(lead.metadata);
                  const formPage = getFormPage(lead.metadata);

                  return (
                    <>
                      <tr
                        key={lead.id}
                        className={`hover:bg-[var(--paper2)] transition-colors cursor-pointer ${isExpanded ? 'bg-[rgba(201,101,74,0.06)]' : ''}`}
                        onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                      >
                        {/* Checkbox */}
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(lead.id)}
                            onChange={() => toggleSelect(lead.id)}
                            className="rounded border-[var(--line)] text-[var(--warm)] focus:ring-[rgba(10,22,40,0.2)]"
                          />
                        </td>
                        {/* Type badge */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${TYPE_COLORS[lead.type] || 'bg-[var(--paper2)] text-[var(--ink2)]'}`}>
                            {formatType(lead.type)}
                          </span>
                        </td>
                        {/* Contact */}
                        <td className="px-4 py-3">
                          <div className="text-sm font-semibold text-[var(--ink)]">{lead.name || '--'}</div>
                          <div className="text-xs text-[var(--muted)]">{lead.email || 'No email'}</div>
                          {lead.phone && <div className="text-xs text-[var(--muted)] mt-0.5">{lead.phone}</div>}
                        </td>
                        {/* Clinic / Doctor */}
                        <td className="px-4 py-3">
                          {lead.clinicName ? (
                            <div className="text-sm text-[var(--ink)] font-medium">{lead.clinicName}</div>
                          ) : (
                            <span className="text-[var(--muted)] text-sm">--</span>
                          )}
                          {lead.doctorName && (
                            <div className="text-xs text-[var(--muted)] mt-0.5">{lead.doctorName}</div>
                          )}
                          {lead.message && (
                            <p className="text-xs text-[var(--muted)] mt-1 line-clamp-1">{lead.message}</p>
                          )}
                        </td>
                        {/* Date */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-[var(--ink2)]">{date}</div>
                          <div className="text-xs text-[var(--muted)]">{time}</div>
                        </td>
                        {/* Status */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[status] || STATUS_COLORS.new}`}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </span>
                        </td>
                        {/* Expand toggle */}
                        <td className="px-4 py-3 text-center">
                          <svg
                            className={`w-4 h-4 text-[var(--muted)] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </td>
                      </tr>

                      {/* Expanded details row */}
                      {isExpanded && (
                        <tr key={`${lead.id}-expanded`}>
                          <td colSpan={7} className="px-4 py-5 bg-[rgba(201,101,74,0.60)]">
                            <div className="space-y-4">
                              {/* Message */}
                              {lead.message && (
                                <div>
                                  <h4 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-1">Message</h4>
                                  <p className="text-sm text-[var(--ink2)] bg-white border border-[var(--line)] rounded-lg px-4 py-3">{lead.message}</p>
                                </div>
                              )}

                              {/* Two-column meta grid */}
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {contactPref && (
                                  <div>
                                    <h4 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-1">Contact Preference</h4>
                                    <p className="text-sm text-[var(--ink2)]">{contactPref}</p>
                                  </div>
                                )}
                                {referral && (
                                  <div>
                                    <h4 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-1">Referral Source</h4>
                                    <p className="text-sm text-[var(--ink2)]">{referral}</p>
                                  </div>
                                )}
                                {lead.sourceUrl && (
                                  <div>
                                    <h4 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-1">Source URL</h4>
                                    <p className="text-xs text-[var(--ink2)] truncate" title={lead.sourceUrl}>{formatSource(lead.sourceUrl)}</p>
                                  </div>
                                )}
                                {formPage && (
                                  <div>
                                    <h4 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-1">Form Page</h4>
                                    <p className="text-xs text-[var(--ink)] font-medium">{formPage}</p>
                                  </div>
                                )}
                                {lead.clinicId && (
                                  <div>
                                    <h4 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-1">Clinic ID</h4>
                                    <p className="text-xs text-[var(--muted)] font-mono">{lead.clinicId.slice(0, 18)}...</p>
                                  </div>
                                )}
                              </div>

                              {/* UTM params */}
                              {utmParams && (
                                <div>
                                  <h4 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-2">UTM Parameters</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {Object.entries(utmParams).map(([k, v]) => (
                                      <span key={k} className="px-2 py-1 bg-white border border-[var(--line)] rounded text-xs font-mono text-[var(--ink2)]">
                                        {k}: <span className="text-[var(--ink)]">{v}</span>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Actions row */}
                              <div className="flex items-center gap-3 pt-1">
                                <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mr-2">Status:</span>
                                {['new', 'contacted', 'converted'].map((s) => (
                                  <button
                                    key={s}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (status !== s) handleStatusUpdate(lead.id, s);
                                    }}
                                    disabled={updating === lead.id}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                      status === s
                                        ? 'bg-[var(--ink2)] text-white'
                                        : 'bg-white border border-[var(--line)] text-[var(--ink2)] hover:bg-[var(--paper2)]'
                                    } disabled:opacity-50`}
                                  >
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                  </button>
                                ))}

                                <div className="ml-auto">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const next = new Set(selectedIds);
                                      next.add(lead.id);
                                      setSelectedIds(next);
                                    }}
                                    className="px-3 py-1.5 bg-[var(--paper2)] hover:bg-[var(--paper2)] text-[var(--ink2)] text-xs font-medium rounded-lg transition-colors"
                                  >
                                    Select
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-[var(--line)] bg-[var(--paper2)] flex items-center justify-between">
            <div className="text-sm text-[var(--muted)]">
              Page {page + 1} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 bg-white border border-[var(--line)] rounded-lg text-sm disabled:opacity-50 hover:bg-[var(--paper2)] transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 bg-white border border-[var(--line)] rounded-lg text-sm disabled:opacity-50 hover:bg-[var(--paper2)] transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}