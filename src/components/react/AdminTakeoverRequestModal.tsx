'use client';
import { useState, useEffect } from 'react';

interface Claim {
  id: string;
  email: string;
  status: string;
  created_at: string;
  verified_at: string | null;
  clinic_id: string;
  clinic_name: string;
  clinic_slug: string;
}

interface Props {
  onClose: () => void;
}

export default function AdminTakeoverRequestModal({ onClose }: Props) {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'verified' | 'rejected'>('pending');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/clinics/claims?status=${filter}`)
      .then(r => r.json())
      .then(data => {
        setClaims(data.claims || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filter]);

  const handleAction = async (claimId: string, action: 'approve' | 'reject') => {
    setProcessing(claimId + action);
    try {
      const res = await fetch('/api/admin/clinics/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimId, action }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setClaims(prev => prev.filter(c => c.id !== claimId));
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setProcessing(null);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700' },
      verified: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700' },
      rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700' },
    };
    const s = map[status] ?? { label: status, color: 'bg-[var(--paper2)] text-[var(--ink2)]' };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>{s.label}</span>;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)] shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-[var(--ink)]">Takeover Requests</h2>
            <p className="text-xs text-[var(--muted)]">Review clinic ownership claims</p>
          </div>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--ink2)] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex gap-1 px-6 pt-4 shrink-0">
          {(['pending', 'verified', 'rejected'] as const).map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); setLoading(true); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize ${
                filter === f ? 'bg-[rgba(10,22,40,0.08)] text-[var(--ink)]' : 'text-[var(--muted)] hover:bg-[var(--paper2)]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-3">
              <div className="w-5 h-5 border-2 border-[var(--ink)] border-t-transparent rounded-full animate-spin" />
              <span className="text-[var(--muted)] text-sm">Loading claims...</span>
            </div>
          ) : claims.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-[var(--muted)]">No {filter} claims.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {claims.map(claim => (
                <div key={claim.id} className="border border-[var(--line)] rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {statusBadge(claim.status)}
                        <span className="text-xs text-[var(--muted)]">
                          {new Date(claim.created_at).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric',
                          })}
                        </span>
                      </div>
                      <p className="font-medium text-[var(--ink)] text-sm truncate">{claim.clinic_name}</p>
                      <a
                        href={`/clinic/${claim.clinic_slug}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[var(--ink)] hover:underline"
                      >
                        /clinic/{claim.clinic_slug}/
                      </a>
                      <p className="text-xs text-[var(--muted)] mt-1">Claimed by: {claim.email}</p>
                    </div>
                    {filter === 'pending' && (
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleAction(claim.id, 'approve')}
                          disabled={processing === claim.id + 'approve'}
                          className="px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                        >
                          {processing === claim.id + 'approve' ? 'Approving...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleAction(claim.id, 'reject')}
                          disabled={processing === claim.id + 'reject'}
                          className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          {processing === claim.id + 'reject' ? 'Rejecting...' : 'Reject'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}