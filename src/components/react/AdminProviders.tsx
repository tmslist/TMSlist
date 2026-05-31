'use client';
import { useState, useEffect, useCallback } from 'react';
import ProviderModal from './AdminProviderModal';

interface Provider {
  doctor: {
    id: string;
    clinicId: string;
    name: string;
    firstName: string | null;
    lastName: string | null;
    credential: string | null;
    title: string | null;
    school: string | null;
    yearsExperience: number | null;
    specialties: string[] | null;
    bio: string | null;
    imageUrl: string | null;
    createdAt: string;
  } | null;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    clinicId: string | null;
    emailVerified: boolean;
    npiNumber: string | null;
    failedLoginAttempts: number;
    lockedUntil: string | null;
    lastLoginAt: string | null;
    createdAt: string;
  } | null;
  clinic: {
    id: string;
    name: string;
    city: string;
    state: string;
    verified: boolean;
  } | null;
  subscription: {
    id: string;
    plan: string;
    status: string;
    currentPeriodEnd: string | null;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
  } | null;
}

const PLAN_LABELS: Record<string, string> = {
  featured: 'Featured',
  premium: 'Premium',
  verified: 'Verified',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

const PLAN_STYLES: Record<string, string> = {
  featured: 'bg-purple-100 text-purple-800',
  premium: 'bg-amber-100 text-amber-800',
  verified: 'bg-emerald-100 text-emerald-800',
  pro: 'bg-blue-100 text-blue-800',
  enterprise: 'bg-gray-100 text-gray-800',
};

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  canceled: 'bg-red-100 text-red-800',
  past_due: 'bg-yellow-100 text-yellow-800',
};

export default function AdminProviders() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [clinics, setClinics] = useState<{ id: string; name: string; city: string }[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [clinicFilter, setClinicFilter] = useState('');
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const limit = 25;

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(page * limit),
        sort,
        order,
      });
      if (search) params.set('search', search);
      if (planFilter) params.set('plan', planFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (clinicFilter) params.set('clinicId', clinicFilter);

      const res = await fetch(`/api/admin/providers?${params}`);
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to fetch providers');
      const json = await res.json();
      setProviders(json.providers);
      setTotal(json.total);
      if (json.clinics) setClinics(json.clinics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load providers');
    } finally {
      setLoading(false);
    }
  }, [page, search, planFilter, statusFilter, clinicFilter, sort, order]);

  useEffect(() => { fetchProviders(); }, [fetchProviders]);

  useEffect(() => { setSelected(new Set()); }, [page, search, planFilter, statusFilter, clinicFilter]);

  async function handleAction(action: string, data: Record<string, unknown>) {
    setActionLoading(action);
    try {
      const res = await fetch('/api/admin/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Action failed');
      showToast(json.message || 'Action completed');
      fetchProviders();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Action failed', 'error');
    } finally {
      setActionLoading(null);
    }
  }

  const handleRowAction = (provider: Provider, action: string) => {
    if (!provider.doctor) return;
    if (action === 'reset-password') {
      const email = provider.user?.email;
      if (!email || !confirm(`Send password reset to ${email}?`)) return;
      handleAction('reset-password', { email });
      return;
    }
    if (action === 'toggle-lock') {
      const userId = provider.user?.id;
      if (!userId) return;
      handleAction('toggle-lock', { userId });
      return;
    }
    if (action === 'change-plan') {
      const currentPlan = provider.subscription?.plan || 'verified';
      const newPlan = prompt(`Change plan from "${currentPlan}" to:`, currentPlan);
      if (!newPlan || newPlan === currentPlan) return;
      handleAction('change-plan', { doctorId: provider.doctor.id, plan: newPlan });
      return;
    }
  };

  function PlanBadge({ plan }: { plan: string }) {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${PLAN_STYLES[plan] || 'bg-gray-100 text-gray-600'}`}>
        {PLAN_LABELS[plan] || plan}
      </span>
    );
  }

  function StatusBadge({ status }: { status: string }) {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'}`}>
        {status}
      </span>
    );
  }

  const sortLabel = sort === 'name' ? 'Name' : sort === 'email' ? 'Email' : sort === 'plan' ? 'Plan' : sort === 'lastLogin' ? 'Last Login' : 'Created';

  return (
    <div className="p-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Providers</h1>
          <p className="text-sm text-gray-500 mt-1">{total.toLocaleString()} total providers</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Provider
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search name, email, NPI..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>
        <select value={planFilter} onChange={e => { setPlanFilter(e.target.value); setPage(0); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]">
          <option value="">All Plans</option>
          {['featured', 'premium', 'verified', 'pro', 'enterprise'].map(p => (
            <option key={p} value={p}>{PLAN_LABELS[p] || p}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]">
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="canceled">Canceled</option>
          <option value="past_due">Past Due</option>
        </select>
        <select value={clinicFilter} onChange={e => { setClinicFilter(e.target.value); setPage(0); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]">
          <option value="">All Clinics</option>
          {clinics.map(c => (
            <option key={c.id} value={c.id}>{c.name}{c.city ? ` (${c.city})` : ''}</option>
          ))}
        </select>
      </div>

      {/* Sort info */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500">
          Sorted by {sortLabel} ({order === 'asc' ? 'A→Z' : 'Z→A'})
        </p>
        <div className="flex gap-1">
          {['createdAt', 'name', 'email', 'plan'].map(s => (
            <button key={s} onClick={() => {
              if (sort === s) setOrder(order === 'asc' ? 'desc' : 'asc');
              else { setSort(s); setOrder('desc'); }
            }}
            className={`px-2 py-1 text-xs rounded ${sort === s ? 'bg-[var(--accent)] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s === 'createdAt' ? 'Date' : s === 'plan' ? 'Plan' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>
      ) : loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]"></div>
        </div>
      ) : providers.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-500 text-sm">No providers found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  <input type="checkbox" className="rounded" />
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Provider</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Clinic</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Plan</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Role</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Last Login</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {providers.map((p, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input type="checkbox" className="rounded" checked={selected.has(p.doctor?.id || '')}
                      onChange={e => {
                        const next = new Set(selected);
                        if (e.target.checked) next.add(p.doctor?.id || '');
                        else next.delete(p.doctor?.id || '');
                        setSelected(next);
                      }}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--accent)] bg-opacity-10 flex items-center justify-center text-[var(--accent)] font-semibold text-xs">
                        {(p.doctor?.name || p.user?.name || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{p.doctor?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{p.user?.email || 'No email'}</p>
                        {p.user?.npiNumber && <p className="text-xs text-gray-400">NPI: {p.user.npiNumber}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {p.clinic ? (
                      <div>
                        <p className="text-gray-900 text-xs">{p.clinic.name}</p>
                        <p className="text-xs text-gray-400">{[p.clinic.city, p.clinic.state].filter(Boolean).join(', ')}</p>
                      </div>
                    ) : <span className="text-gray-400 text-xs">Unassigned</span>}
                  </td>
                  <td className="px-4 py-3">
                    {p.subscription ? (
                      <button onClick={() => handleRowAction(p, 'change-plan')} title="Click to change plan">
                        <PlanBadge plan={p.subscription.plan} />
                      </button>
                    ) : <span className="text-gray-400 text-xs">No plan</span>}
                  </td>
                  <td className="px-4 py-3">
                    {p.subscription ? <StatusBadge status={p.subscription.status} /> : <span className="text-gray-400 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                      {p.user?.role || 'viewer'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {p.user?.lastLoginAt ? new Date(p.user.lastLoginAt).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <a href={`/admin/providers/${p.doctor?.id}`}
                        className="p-1.5 rounded hover:bg-gray-200 text-gray-500" title="View Detail">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </a>
                      <button onClick={() => handleRowAction(p, 'reset-password')}
                        className="p-1.5 rounded hover:bg-gray-200 text-gray-500" title="Edit">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {p.user?.email && (
                        <>
                          <button onClick={() => handleRowAction(p, 'reset-password')}
                            className="p-1.5 rounded hover:bg-gray-200 text-gray-500" title="Reset Password"
                            disabled={actionLoading !== null}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                          </button>
                          <button onClick={() => handleRowAction(p, 'toggle-lock')}
                            className="p-1.5 rounded hover:bg-gray-200 text-gray-500" title={p.user.lockedUntil && new Date(p.user.lockedUntil) > new Date() ? 'Unlock' : 'Lock'}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500">
              Showing {Math.min(page * limit + 1, total)}–{Math.min((page + 1) * limit, total)} of {total.toLocaleString()}
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
                className="px-3 py-1.5 rounded border border-gray-300 text-xs disabled:opacity-40 hover:bg-gray-100 disabled:cursor-not-allowed">
                Previous
              </button>
              <span className="text-xs text-gray-600">Page {page + 1}</span>
              <button onClick={() => setPage(page + 1)} disabled={(page + 1) * limit >= total}
                className="px-3 py-1.5 rounded border border-gray-300 text-xs disabled:opacity-40 hover:bg-gray-100 disabled:cursor-not-allowed">
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
