import { useState, useEffect, useCallback } from 'react';

interface ClaimRecord {
  id: string;
  clinicId: string | null;
  insurerId: string | null;
  planId: string | null;
  memberId: string | null;
  status: string;
  claimAmount: string | null;
  approvedAmount: string | null;
  paidAmount: string | null;
  denialReason: string | null;
  appealReason: string | null;
  appealStatus: string | null;
  timeline: { status: string; timestamp: string; note?: string }[] | null;
  submittedAt: string;
  processedAt: string | null;
  approvedAt: string | null;
  paidAt: string | null;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  submitted: { label: 'Submitted', color: 'text-[var(--ink)] dark:text-[var(--ink2)]', bg: 'bg-[var(--paper2)] dark:bg-[var(--paper2)]' },
  pending: { label: 'Pending', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30' },
  approved: { label: 'Approved', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
  paid: { label: 'Paid', color: 'text-[var(--ink)] dark:text-[var(--ink2)]', bg: 'bg-[rgba(10,22,40,0.08)] dark:bg-[#0A1628]/30' },
  rejected: { label: 'Rejected', color: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30' },
};

const TIMELINE_STEPS = ['submitted', 'pending', 'approved', 'paid'];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function Timeline({ steps, currentStatus }: { steps: string[]; currentStatus: string }) {
  const currentIdx = TIMELINE_STEPS.indexOf(currentStatus);
  return (
    <div className="flex items-center gap-1">
      {TIMELINE_STEPS.map((step, i) => {
        const isComplete = i <= currentIdx;
        const isCurrent = step === currentStatus;
        return (
          <div key={step} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${isComplete ? 'bg-[var(--ink)] text-white' : 'bg-[var(--paper2)] dark:bg-[var(--ink2)] text-[var(--muted)]'}`}>
              {i + 1}
            </div>
            {i < TIMELINE_STEPS.length - 1 && (
              <div className={`w-8 h-0.5 ${isComplete ? 'bg-[var(--ink)]' : 'bg-[var(--paper2)] dark:bg-[var(--ink2)]'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function AdminClaimsTracker() {
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [selectedClaim, setSelectedClaim] = useState<ClaimRecord | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const limit = 50;

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(limit), offset: String(page * limit) });
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/admin/claims?${params}`);
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error();
      const json = await res.json();
      setClaims(json.data.records);
      setStatusCounts(json.data.statusCounts);
      setTotal(json.data.total);
    } catch { showToast('error', 'Failed to load claims'); }
    finally { setLoading(false); }
  }, [statusFilter, page, showToast]);

  useEffect(() => { fetchClaims(); }, [fetchClaims]);

  const handleUpdateStatus = async (id: string, status: string, extra?: any) => {
    try {
      const res = await fetch('/api/admin/claims', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, ...extra }),
      });
      if (!res.ok) throw new Error();
      showToast('success', `Claim marked as ${status}`);
      fetchClaims();
    } catch { showToast('error', 'Failed to update claim'); }
  };

  const handleCreate = async (data: any) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      showToast('success', 'Claim created');
      setShowNewModal(false);
      fetchClaims();
    } catch { showToast('error', 'Failed to create claim'); }
    finally { setSaving(false); }
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
          <h1 className="text-3xl font-semibold text-[var(--ink)] dark:text-[var(--line)]">Claims Tracker</h1>
          <p className="text-[var(--muted)] dark:text-[var(--muted)] mt-1 text-sm">Track TMS insurance claims through the approval process</p>
        </div>
        <button onClick={() => setShowNewModal(true)} className="px-4 py-2 bg-[var(--ink)] hover:bg-[var(--ink)] text-white text-sm font-semibold rounded-lg transition-colors">
          + New Claim
        </button>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <button key={key} onClick={() => { setStatusFilter(statusFilter === key ? '' : key); setPage(0); }}
            className={`bg-white dark:bg-[var(--ink2)] rounded-xl border p-4 text-left transition-colors ${statusFilter === key ? 'border-[var(--ink2)] ring-1 ring-[#1E2A3B]' : 'border-[var(--line)] dark:border-[var(--ink2)] hover:border-[var(--line)]'}`}>
            <p className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</p>
            <p className="text-2xl font-bold text-[var(--ink)] dark:text-[var(--line)] mt-1">{statusCounts[key] || 0}</p>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[var(--ink2)] rounded-xl border border-[var(--line)] dark:border-[var(--ink2)] overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <div className="inline-block w-6 h-6 border-2 border-[var(--line)] border-t-[#0A1628] rounded-full animate-spin mb-3" />
          </div>
        ) : claims.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-[var(--muted)] dark:text-[var(--muted)]">No claims found</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-[var(--line)] dark:divide-[var(--line)]">
            <thead className="bg-[var(--paper2)] dark:bg-[var(--paper2)]">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-[var(--muted)] dark:text-[var(--muted)] uppercase">Member ID</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-[var(--muted)] dark:text-[var(--muted)] uppercase">Status</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-[var(--muted)] dark:text-[var(--muted)] uppercase">Timeline</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-[var(--muted)] dark:text-[var(--muted)] uppercase">Amount</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-[var(--muted)] dark:text-[var(--muted)] uppercase">Date</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-[var(--muted)] dark:text-[var(--muted)] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)] dark:divide-[var(--line)]">
              {claims.map(claim => {
                const cfg = STATUS_CONFIG[claim.status] || STATUS_CONFIG.pending;
                return (
                  <tr key={claim.id} className="hover:bg-[var(--paper2)] dark:hover:bg-[var(--ink2)]">
                    <td className="px-5 py-3.5 text-sm font-mono text-[var(--ink)] dark:text-[var(--line)]">{claim.memberId || '-'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                    </td>
                    <td className="px-5 py-3.5"><Timeline steps={TIMELINE_STEPS} currentStatus={claim.status} /></td>
                    <td className="px-5 py-3.5 text-sm text-[var(--ink)] dark:text-[var(--line)]">
                      {claim.claimAmount ? `$${Number(claim.claimAmount).toLocaleString()}` : '-'}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[var(--muted)] dark:text-[var(--muted)]">{formatDate(claim.submittedAt)}</td>
                    <td className="px-5 py-3.5 flex gap-2">
                      <button onClick={() => setSelectedClaim(claim)} className="text-xs text-[var(--ink)] dark:text-[var(--ink2)] hover:underline">View</button>
                      {claim.status === 'rejected' && (
                        <button onClick={() => handleUpdateStatus(claim.id, 'pending', { appealReason: 'Appeal submitted' })} className="text-xs text-amber-600 dark:text-amber-400 hover:underline">Appeal</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-[var(--muted)] dark:text-[var(--muted)]">Page {page + 1} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="px-3 py-1.5 bg-white dark:bg-[var(--ink2)] border border-[var(--line)] dark:border-[var(--ink2)] rounded-lg text-sm disabled:opacity-40">Previous</button>
            <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="px-3 py-1.5 bg-white dark:bg-[var(--ink2)] border border-[var(--line)] dark:border-[var(--ink2)] rounded-lg text-sm disabled:opacity-40">Next</button>
          </div>
        </div>
      )}

      {selectedClaim && (
        <ClaimDetailModal claim={selectedClaim} onClose={() => setSelectedClaim(null)} onUpdate={handleUpdateStatus} />
      )}

      {showNewModal && (
        <NewClaimModal onSave={handleCreate} onClose={() => setShowNewModal(false)} saving={saving} />
      )}
    </div>
  );
}

function ClaimDetailModal({ claim, onClose, onUpdate }: { claim: ClaimRecord; onClose: () => void; onUpdate: (id: string, status: string, extra?: any) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-[var(--ink2)] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)] dark:border-[var(--ink2)]">
          <h3 className="text-lg font-semibold text-[var(--ink)] dark:text-[var(--line)]">Claim Details</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--paper2)] dark:hover:bg-[var(--ink2)] text-[var(--muted)]"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[var(--muted)] dark:text-[var(--muted)] uppercase">Status</p>
              <p className="text-sm font-semibold text-[var(--ink)] dark:text-[var(--line)] mt-1">{claim.status}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted)] dark:text-[var(--muted)] uppercase">Member ID</p>
              <p className="text-sm font-semibold text-[var(--ink)] dark:text-[var(--line)] mt-1 font-mono">{claim.memberId || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted)] dark:text-[var(--muted)] uppercase">Claim Amount</p>
              <p className="text-sm font-semibold text-[var(--ink)] dark:text-[var(--line)] mt-1">{claim.claimAmount ? `$${Number(claim.claimAmount).toLocaleString()}` : '-'}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted)] dark:text-[var(--muted)] uppercase">Approved Amount</p>
              <p className="text-sm font-semibold text-[var(--ink)] dark:text-[var(--line)] mt-1">{claim.approvedAmount ? `$${Number(claim.approvedAmount).toLocaleString()}` : '-'}</p>
            </div>
            {claim.denialReason && (
              <div className="col-span-2">
                <p className="text-xs text-red-500 uppercase">Denial Reason</p>
                <p className="text-sm text-red-700 dark:text-red-400 mt-1">{claim.denialReason}</p>
              </div>
            )}
          </div>

          {claim.timeline && claim.timeline.length > 0 && (
            <div>
              <p className="text-xs text-[var(--muted)] dark:text-[var(--muted)] uppercase mb-3">Timeline</p>
              <div className="space-y-2">
                {claim.timeline.map((event, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-[var(--ink)] shrink-0" />
                    <div>
                      <p className="font-medium text-[var(--ink)] dark:text-[var(--line)]">{event.status}</p>
                      <p className="text-xs text-[var(--muted)] dark:text-[var(--muted)]">{new Date(event.timestamp).toLocaleString()}</p>
                      {event.note && <p className="text-xs text-[var(--ink2)] dark:text-[var(--muted)] mt-1">{event.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            {claim.status === 'submitted' && <button onClick={() => { onUpdate(claim.id, 'pending'); onClose(); }} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg">Mark Pending</button>}
            {claim.status === 'pending' && <button onClick={() => { onUpdate(claim.id, 'approved'); onClose(); }} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg">Approve</button>}
            {claim.status === 'approved' && <button onClick={() => { onUpdate(claim.id, 'paid'); onClose(); }} className="px-4 py-2 bg-[var(--ink)] hover:bg-[var(--ink)] text-white text-sm font-semibold rounded-lg">Mark Paid</button>}
            {claim.status !== 'rejected' && claim.status !== 'paid' && <button onClick={() => { onUpdate(claim.id, 'rejected'); onClose(); }} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg">Reject</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

function NewClaimModal({ onSave, onClose, saving }: { onSave: (d: any) => void; onClose: () => void; saving: boolean }) {
  const [form, setForm] = useState({ clinicId: '', insurerId: '', planId: '', memberId: '', claimAmount: '' });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-[var(--ink2)] rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)] dark:border-[var(--ink2)]">
          <h3 className="text-lg font-semibold text-[var(--ink)] dark:text-[var(--line)]">New Claim</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--paper2)] dark:hover:bg-[var(--ink2)] text-[var(--muted)]"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--ink2)] dark:text-[var(--line)] mb-1">Clinic ID</label>
            <input value={form.clinicId} onChange={e => setForm({ ...form, clinicId: e.target.value })} className="w-full rounded-lg border border-[var(--line)] dark:border-[var(--ink2)] px-3 py-2 text-sm bg-white dark:bg-[var(--ink2)] text-[var(--ink)] dark:text-[var(--line)]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--ink2)] dark:text-[var(--line)] mb-1">Insurer ID</label>
            <input value={form.insurerId} onChange={e => setForm({ ...form, insurerId: e.target.value })} className="w-full rounded-lg border border-[var(--line)] dark:border-[var(--ink2)] px-3 py-2 text-sm bg-white dark:bg-[var(--ink2)] text-[var(--ink)] dark:text-[var(--line)]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--ink2)] dark:text-[var(--line)] mb-1">Plan ID</label>
            <input value={form.planId} onChange={e => setForm({ ...form, planId: e.target.value })} className="w-full rounded-lg border border-[var(--line)] dark:border-[var(--ink2)] px-3 py-2 text-sm bg-white dark:bg-[var(--ink2)] text-[var(--ink)] dark:text-[var(--line)]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--ink2)] dark:text-[var(--line)] mb-1">Member ID</label>
            <input value={form.memberId} onChange={e => setForm({ ...form, memberId: e.target.value })} className="w-full rounded-lg border border-[var(--line)] dark:border-[var(--ink2)] px-3 py-2 text-sm bg-white dark:bg-[var(--ink2)] text-[var(--ink)] dark:text-[var(--line)]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--ink2)] dark:text-[var(--line)] mb-1">Claim Amount ($)</label>
            <input type="number" value={form.claimAmount} onChange={e => setForm({ ...form, claimAmount: e.target.value })} className="w-full rounded-lg border border-[var(--line)] dark:border-[var(--ink2)] px-3 py-2 text-sm bg-white dark:bg-[var(--ink2)] text-[var(--ink)] dark:text-[var(--line)]" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-4 py-2 bg-[var(--paper2)] dark:bg-[var(--ink2)] text-[var(--ink2)] dark:text-[var(--line)] text-sm font-medium rounded-lg">Cancel</button>
            <button onClick={() => onSave(form)} disabled={saving} className="px-4 py-2 bg-[var(--ink)] hover:bg-[var(--ink)] text-white text-sm font-semibold rounded-lg disabled:opacity-50">{saving ? 'Creating...' : 'Create Claim'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
