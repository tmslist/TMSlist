import { useState, useEffect, useCallback } from 'react';

interface ConsentRecord {
  id: string;
  userId: string | null;
  email: string | null;
  consentType: string;
  category: string | null;
  granted: boolean;
  withdrawnAt: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface ConsentStats {
  gdprCount: number;
  ccpCount: number;
  withdrawnCount: number;
  total: number;
}

const CONSENT_TYPES = [
  { value: 'gdpr', label: 'GDPR' },
  { value: 'ccpa', label: 'CCPA' },
  { value: 'cookie_analytics', label: 'Cookie Analytics' },
  { value: 'cookie_marketing', label: 'Cookie Marketing' },
  { value: 'data_processing', label: 'Data Processing' },
  { value: 'marketing_email', label: 'Marketing Email' },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function AdminConsentManager() {
  const [records, setRecords] = useState<ConsentRecord[]>([]);
  const [stats, setStats] = useState<ConsentStats>({ gdprCount: 0, ccpCount: 0, withdrawnCount: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'granted' | 'withdrawn'>('all');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 50;

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(limit), offset: String(page * limit) });
      if (typeFilter) params.set('consentType', typeFilter);
      const res = await fetch(`/api/admin/consent-manager?${params}`);
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error();
      const json = await res.json();
      setRecords(json.data.records);
      setStats(json.data.stats);
      setTotal(json.data.total);
    } catch {
      showToast('error', 'Failed to load consent records');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, page, showToast]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const handleWithdraw = async (id: string) => {
    if (!confirm('Withdraw this consent record?')) return;
    try {
      const res = await fetch('/api/admin/consent-manager', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, withdraw: true }),
      });
      if (!res.ok) throw new Error();
      showToast('success', 'Consent withdrawn');
      fetchRecords();
    } catch {
      showToast('error', 'Failed to withdraw consent');
    }
  };

  const filteredRecords = records.filter(r => {
    if (statusFilter === 'granted') return r.granted && !r.withdrawnAt;
    if (statusFilter === 'withdrawn') return !r.granted || r.withdrawnAt;
    return true;
  });

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-[var(--ink)] dark:text-[var(--line)]">Consent Manager</h1>
          <p className="text-[var(--muted)] dark:text-[var(--muted)] mt-1 text-sm">GDPR/CCPA compliance tracking and consent records</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Records', value: stats.total, color: 'text-[var(--ink)] dark:text-[var(--line)]' },
          { label: 'GDPR Consents', value: stats.gdprCount, color: 'text-[var(--ink)] dark:text-[var(--ink2)]' },
          { label: 'CCPA Consents', value: stats.ccpCount, color: 'text-[var(--ink)] dark:text-[var(--ink2)]' },
          { label: 'Withdrawn', value: stats.withdrawnCount, color: 'text-red-600 dark:text-red-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-[var(--ink2)] rounded-xl border border-[var(--line)] dark:border-[var(--ink2)] p-4">
            <p className="text-xs font-medium text-[var(--muted)] dark:text-[var(--muted)] uppercase tracking-wide">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[var(--ink2)] rounded-xl border border-[var(--line)] dark:border-[var(--ink2)] p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <select
            value={typeFilter}
            onChange={e => { setTypeFilter(e.target.value); setPage(0); }}
            className="rounded-lg border border-[var(--line)] dark:border-[var(--ink2)] px-3 py-2 text-sm bg-white dark:bg-[var(--ink2)] text-[var(--ink)] dark:text-[var(--line)]"
          >
            <option value="">All Types</option>
            {CONSENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <div className="flex gap-2">
            {(['all', 'granted', 'withdrawn'] as const).map(s => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(0); }}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${statusFilter === s ? 'bg-[var(--ink)] text-white' : 'bg-[var(--paper2)] dark:bg-[var(--ink2)] text-[var(--ink2)] dark:text-[var(--line)] hover:bg-[var(--paper2)] dark:hover:bg-[var(--muted)]'}`}
              >
                {s === 'all' ? 'All' : s === 'granted' ? 'Granted' : 'Withdrawn'}
              </button>
            ))}
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
        ) : filteredRecords.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-[var(--muted)] dark:text-[var(--muted)]">No consent records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--line)] dark:divide-[var(--line)]">
              <thead className="bg-[var(--paper2)] dark:bg-[var(--paper2)]">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--muted)] dark:text-[var(--muted)] uppercase">Type</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--muted)] dark:text-[var(--muted)] uppercase">User</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--muted)] dark:text-[var(--muted)] uppercase">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--muted)] dark:text-[var(--muted)] uppercase">Date</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--muted)] dark:text-[var(--muted)] uppercase">IP</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--muted)] dark:text-[var(--muted)] uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)] dark:divide-[var(--line)]">
                {filteredRecords.map(record => (
                  <tr key={record.id} className="hover:bg-[var(--paper2)] dark:hover:bg-[var(--ink2)] transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 bg-[rgba(10,22,40,0.08)] dark:bg-[#0A1628]/30 text-[var(--ink)] dark:text-[var(--ink2)] text-xs font-semibold rounded-lg">
                        {record.consentType}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-[var(--ink)] dark:text-[var(--line)]">
                      {record.email || <span className="text-[var(--muted)] italic">Anonymous</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      {record.withdrawnAt || !record.granted ? (
                        <span className="px-2.5 py-1 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-semibold rounded-full">Withdrawn</span>
                      ) : (
                        <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold rounded-full">Granted</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[var(--muted)] dark:text-[var(--muted)]">{formatDate(record.createdAt)}</td>
                    <td className="px-5 py-3.5 text-xs font-mono text-[var(--muted)] dark:text-[var(--muted)]">{record.ipAddress || '-'}</td>
                    <td className="px-5 py-3.5">
                      {!record.withdrawnAt && record.granted && (
                        <button
                          onClick={() => handleWithdraw(record.id)}
                          className="text-xs text-red-600 dark:text-red-400 hover:underline"
                        >
                          Withdraw
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-[var(--muted)] dark:text-[var(--muted)]">Page {page + 1} of {totalPages} ({total} total)</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="px-3 py-1.5 bg-white dark:bg-[var(--ink2)] border border-[var(--line)] dark:border-[var(--ink2)] rounded-lg text-sm disabled:opacity-40 hover:bg-[var(--paper2)] dark:hover:bg-[var(--ink2)]">Previous</button>
            <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="px-3 py-1.5 bg-white dark:bg-[var(--ink2)] border border-[var(--line)] dark:border-[var(--ink2)] rounded-lg text-sm disabled:opacity-40 hover:bg-[var(--paper2)] dark:hover:bg-[var(--ink2)]">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
