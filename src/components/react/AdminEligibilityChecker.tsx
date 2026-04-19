import { useState, useEffect, useCallback } from 'react';

interface EligibilityRecord {
  id: string;
  insurerId: string | null;
  planId: string | null;
  memberId: string | null;
  groupNumber: string | null;
  status: string;
  verifiedAt: string | null;
  coverageDetails: {
    coversTMS?: boolean;
    copay?: number;
    deductible?: number;
    priorAuthRequired?: boolean;
    coveragePercent?: number;
    planType?: string;
    metalLevel?: string;
  } | null;
  errorMessage: string | null;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  verified: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  eligible: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  not_eligible: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  rejected: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  error: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function AdminEligibilityChecker() {
  const [records, setRecords] = useState<EligibilityRecord[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [showCheckForm, setShowCheckForm] = useState(false);
  const [checking, setChecking] = useState(false);
  const limit = 50;

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(limit), offset: String(page * limit) });
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/admin/eligibility?${params}`);
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error();
      const json = await res.json();
      setRecords(json.data.records);
      setStatusCounts(json.data.statusCounts);
      setTotal(json.data.total);
    } catch { showToast('error', 'Failed to load records'); }
    finally { setLoading(false); }
  }, [statusFilter, page, showToast]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const handleCheck = async (formData: { insurerId: string; planId: string; memberId: string; groupNumber: string }) => {
    setChecking(true);
    try {
      const res = await fetch('/api/admin/eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error();
      showToast('success', 'Eligibility check submitted');
      setShowCheckForm(false);
      fetchRecords();
    } catch { showToast('error', 'Failed to submit check'); }
    finally { setChecking(false); }
  };

  const handleUpdateStatus = async (id: string, status: string, coverageDetails?: any) => {
    try {
      const res = await fetch('/api/admin/eligibility', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, coverageDetails }),
      });
      if (!res.ok) throw new Error();
      showToast('success', 'Status updated');
      fetchRecords();
    } catch { showToast('error', 'Failed to update status'); }
  };

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
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">Eligibility Checker</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Verify patient insurance coverage for TMS</p>
        </div>
        <button onClick={() => setShowCheckForm(true)} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors">
          + New Eligibility Check
        </button>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Object.entries(statusCounts).map(([status, count]) => (
          <button key={status} onClick={() => { setStatusFilter(statusFilter === status ? '' : status); setPage(0); }}
            className={`bg-white dark:bg-gray-800 rounded-xl border p-4 text-left transition-colors ${statusFilter === status ? 'border-violet-500 ring-1 ring-violet-500' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{status.replace('_', ' ')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{count}</p>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <div className="inline-block w-6 h-6 border-2 border-gray-200 border-t-violet-600 rounded-full animate-spin mb-3" />
          </div>
        ) : records.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-gray-500 dark:text-gray-400">No eligibility checks found</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Member ID</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Coverage Details</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {records.map(record => (
                <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                  <td className="px-5 py-3.5 text-sm font-mono text-gray-900 dark:text-gray-100">{record.memberId || '-'}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[record.status] || STATUS_COLORS.pending}`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-600 dark:text-gray-400">
                    {record.coverageDetails ? (
                      <div className="space-y-0.5">
                        {record.coverageDetails.coversTMS !== undefined && <p>TMS: {record.coverageDetails.coversTMS ? 'Yes' : 'No'}</p>}
                        {record.coverageDetails.copay !== undefined && <p>Copay: ${record.coverageDetails.copay}</p>}
                        {record.coverageDetails.coveragePercent !== undefined && <p>Coverage: {record.coverageDetails.coveragePercent}%</p>}
                      </div>
                    ) : <span className="text-gray-400">No data</span>}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400">{formatDate(record.createdAt)}</td>
                  <td className="px-5 py-3.5">
                    <select
                      value={record.status}
                      onChange={e => handleUpdateStatus(record.id, e.target.value)}
                      className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      <option value="pending">Pending</option>
                      <option value="verified">Verified</option>
                      <option value="eligible">Eligible</option>
                      <option value="not_eligible">Not Eligible</option>
                      <option value="error">Error</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Page {page + 1} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm disabled:opacity-40">Previous</button>
            <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm disabled:opacity-40">Next</button>
          </div>
        </div>
      )}

      {/* Check Form Modal */}
      {showCheckForm && (
        <EligibilityCheckForm onSave={handleCheck} onClose={() => setShowCheckForm(false)} saving={checking} />
      )}
    </div>
  );
}

function EligibilityCheckForm({ onSave, onClose, saving }: { onSave: (d: any) => void; onClose: () => void; saving: boolean }) {
  const [form, setForm] = useState({ insurerId: '', planId: '', memberId: '', groupNumber: '' });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">New Eligibility Check</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Insurer ID</label>
            <input value={form.insurerId} onChange={e => setForm({ ...form, insurerId: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plan ID</label>
            <input value={form.planId} onChange={e => setForm({ ...form, planId: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Member ID</label>
            <input value={form.memberId} onChange={e => setForm({ ...form, memberId: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Group Number</label>
            <input value={form.groupNumber} onChange={e => setForm({ ...form, groupNumber: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg">Cancel</button>
            <button onClick={() => onSave(form)} disabled={saving} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50">{saving ? 'Checking...' : 'Check Eligibility'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
