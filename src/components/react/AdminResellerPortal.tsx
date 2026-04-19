import { useState, useEffect, useCallback } from 'react';

interface Reseller {
  id: string;
  domain: string;
  brandName: string;
  primaryColor: string;
  secondaryColor?: string;
  logoUrl?: string;
  headerLinks?: { label: string; url: string }[];
  footerLinks?: { label: string; url: string }[];
  status: 'active' | 'inactive';
  clinicCount: number;
  doctorCount: number;
  totalLeads: number;
  monthlyRevenue: number;
  revenueShare: number;
  quota: number;
  quotaUsed: number;
  createdAt: string;
  billingEmail?: string;
  plan: 'starter' | 'professional' | 'enterprise';
  whiteLabelConfigId?: string;
}

interface UsageStat {
  month: string;
  leads: number;
  clinics: number;
  revenue: number;
}

interface BillingRecord {
  id: string;
  resellerId: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  invoiceDate: string;
  paidDate?: string;
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function QuotaBar({ used, total }: { used: number; total: number }) {
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  const color = pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500 dark:text-slate-400">{used} / {total}</span>
        <span className="text-gray-500 dark:text-slate-400">{pct.toFixed(0)}%</span>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function AdminResellerPortal() {
  const [tab, setTab] = useState<'clients' | 'quotas' | 'billing'>('clients');
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [billing, setBilling] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingReseller, setEditingReseller] = useState<Reseller | null>(null);
  const [selectedReseller, setSelectedReseller] = useState<Reseller | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStat[]>([]);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formDomain, setFormDomain] = useState('');
  const [formBrandName, setFormBrandName] = useState('');
  const [formRevenueShare, setFormRevenueShare] = useState('20');
  const [formQuota, setFormQuota] = useState('100');
  const [formBillingEmail, setFormBillingEmail] = useState('');
  const [formPlan, setFormPlan] = useState<Reseller['plan']>('starter');

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [resellerRes, billingRes] = await Promise.all([
        fetch('/api/admin/resellers'),
        fetch('/api/admin/reseller-billing'),
      ]);
      if (resellerRes.status === 401) { window.location.href = '/admin/login'; return; }
      if (!resellerRes.ok) throw new Error('Failed to fetch resellers');

      const resellerJson = await resellerRes.json();
      setResellers(resellerJson.data || []);

      if (billingRes.ok) {
        const billingJson = await billingRes.json();
        setBilling(billingJson.data || []);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function openModal(res?: Reseller) {
    if (res) {
      setEditingReseller(res);
      setFormDomain(res.domain);
      setFormBrandName(res.brandName);
      setFormRevenueShare(String(res.revenueShare));
      setFormQuota(String(res.quota));
      setFormBillingEmail(res.billingEmail || '');
      setFormPlan(res.plan);
    } else {
      setEditingReseller(null);
      setFormDomain('');
      setFormBrandName('');
      setFormRevenueShare('20');
      setFormQuota('100');
      setFormBillingEmail('');
      setFormPlan('starter');
    }
    setShowModal(true);
  }

  async function openDetail(reseller: Reseller) {
    setSelectedReseller(reseller);
    try {
      const res = await fetch(`/api/admin/reseller-usage?resellerId=${reseller.id}`);
      if (res.ok) {
        const json = await res.json();
        setUsageStats(json.data || []);
      }
    } catch { setUsageStats([]); }
    setShowDetailModal(true);
  }

  async function handleSave() {
    if (!formDomain || !formBrandName) { showToast('error', 'Domain and brand name are required'); return; }

    setSaving(true);
    try {
      const body = {
        domain: formDomain,
        brandName: formBrandName,
        revenueShare: Number(formRevenueShare),
        quota: Number(formQuota),
        billingEmail: formBillingEmail,
        plan: formPlan,
      };

      const url = editingReseller ? `/api/admin/resellers?id=${editingReseller.id}` : '/api/admin/resellers';
      const method = editingReseller ? 'PUT' : 'POST';

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to save reseller');

      showToast('success', `Reseller ${editingReseller ? 'updated' : 'created'}`);
      setShowModal(false);
      fetchData();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(reseller: Reseller) {
    try {
      const res = await fetch(`/api/admin/resellers?id=${reseller.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...reseller, status: reseller.status === 'active' ? 'inactive' : 'active' }),
      });
      if (!res.ok) throw new Error('Failed to toggle');
      setResellers(resellers.map(r => r.id === reseller.id ? { ...r, status: r.status === 'active' ? 'inactive' : 'active' } : r));
      showToast('success', `Reseller ${reseller.status === 'active' ? 'deactivated' : 'activated'}`);
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to toggle');
    }
  }

  async function handleDelete(reseller: Reseller) {
    if (!confirm(`Delete reseller "${reseller.brandName}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/resellers?id=${reseller.id}`, { method: 'DELETE' });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to delete');
      setResellers(resellers.filter(r => r.id !== reseller.id));
      showToast('success', 'Reseller deleted');
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to delete');
    }
  }

  async function handleBillingAction(record: BillingRecord, action: 'paid' | 'overdue') {
    try {
      const res = await fetch(`/api/admin/reseller-billing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: record.id, status: action }),
      });
      if (!res.ok) throw new Error('Failed to update billing');
      setBilling(billing.map(r => r.id === record.id ? { ...r, status: action } : r));
      showToast('success', `Invoice marked as ${action}`);
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to update');
    }
  }

  const planColors = {
    starter: 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300',
    professional: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    enterprise: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  };

  const TABS = [
    { key: 'clients' as const, label: 'Client List' },
    { key: 'quotas' as const, label: 'Quota Management' },
    { key: 'billing' as const, label: 'Billing' },
  ];

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.message}
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-sm text-red-800 dark:text-red-300 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700 text-xs font-medium ml-3">Dismiss</button>
        </div>
      )}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Reseller Portal</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{resellers.length} reseller{resellers.length !== 1 ? 's' : ''}, ${resellers.reduce((sum, r) => sum + r.monthlyRevenue, 0).toLocaleString()} MRR</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button onClick={() => openModal()} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Reseller
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
        <div className="border-b border-gray-200 dark:border-slate-700">
          <nav className="flex gap-1 px-4">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'}`}>
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="inline-block w-8 h-8 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : tab === 'clients' ? (
            <div className="overflow-x-auto">
              {resellers.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-slate-400">No resellers yet. Add your first reseller.</div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Domain</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Brand</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Plan</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Clinics</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Revenue Share</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">MRR</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Status</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                    {resellers.map(reseller => (
                      <tr key={reseller.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">{reseller.domain}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{reseller.brandName}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded capitalize ${planColors[reseller.plan]}`}>
                            {reseller.plan}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-400">{reseller.clinicCount}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-400">{reseller.revenueShare}%</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">${reseller.monthlyRevenue.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleToggle(reseller)} className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${reseller.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-400 dark:bg-slate-700 dark:text-slate-400'}`}>
                            {reseller.status}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => openDetail(reseller)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400" title="View Details">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </button>
                            <button onClick={() => openModal(reseller)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button onClick={() => handleDelete(reseller)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : tab === 'quotas' ? (
            <div className="space-y-4">
              {resellers.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-slate-400">No resellers to manage quotas for.</div>
              ) : (
                resellers.map(reseller => (
                  <div key={reseller.id} className="border border-gray-200 dark:border-slate-700 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{reseller.brandName}</h4>
                        <p className="text-xs text-gray-500 dark:text-slate-400">{reseller.domain}</p>
                      </div>
                      <button onClick={() => openModal(reseller)} className="px-3 py-1.5 border border-gray-300 dark:border-slate-600 rounded-lg text-xs font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700">
                        Edit Quota
                      </button>
                    </div>
                    <QuotaBar used={reseller.quotaUsed} total={reseller.quota} />
                    <div className="grid grid-cols-3 gap-4 mt-3">
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{reseller.clinicCount}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">Clinics</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{reseller.totalLeads}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">Total Leads</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{reseller.doctorCount}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">Doctors</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : tab === 'billing' ? (
            <div className="space-y-4">
              {billing.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-slate-400">No billing records yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Reseller</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Amount</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Invoice Date</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Status</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                      {billing.map(record => (
                        <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                            {resellers.find(r => r.id === record.resellerId)?.brandName || record.resellerId}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">${record.amount.toLocaleString()}</td>
                          <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-400">{new Date(record.invoiceDate).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${record.status === 'paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : record.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                              {record.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {record.status === 'pending' && (
                              <button onClick={() => handleBillingAction(record, 'paid')} className="px-2 py-1 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700">Mark Paid</button>
                            )}
                            {record.status === 'overdue' && (
                              <button onClick={() => handleBillingAction(record, 'paid')} className="px-2 py-1 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700">Mark Paid</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Add/Edit Reseller Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingReseller ? 'Edit Reseller' : 'Add Reseller'}>
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Domain *</label>
              <input type="text" value={formDomain} onChange={e => setFormDomain(e.target.value)} placeholder="clinic.example.com" className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Brand Name *</label>
              <input type="text" value={formBrandName} onChange={e => setFormBrandName(e.target.value)} placeholder="Example Clinics" className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Plan</label>
              <select value={formPlan} onChange={e => setFormPlan(e.target.value as Reseller['plan'])} className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900">
                <option value="starter">Starter</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Revenue Share %</label>
              <input type="number" value={formRevenueShare} onChange={e => setFormRevenueShare(e.target.value)} placeholder="20" className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Quota (clinics)</label>
              <input type="number" value={formQuota} onChange={e => setFormQuota(e.target.value)} placeholder="100" className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Billing Email</label>
            <input type="email" value={formBillingEmail} onChange={e => setFormBillingEmail(e.target.value)} placeholder="billing@example.com" className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900" />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Saving...' : editingReseller ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Reseller Detail Modal */}
      <Modal open={showDetailModal} onClose={() => setShowDetailModal(false)} title={selectedReseller?.brandName || 'Reseller Details'}>
        {selectedReseller && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-gray-900 dark:text-white">{selectedReseller.clinicCount}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Clinics</p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-gray-900 dark:text-white">{selectedReseller.totalLeads}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Total Leads</p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-gray-900 dark:text-white">{selectedReseller.revenueShare}%</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Rev Share</p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-gray-900 dark:text-white">${selectedReseller.monthlyRevenue.toLocaleString()}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">MRR</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Quota Usage</h4>
              <QuotaBar used={selectedReseller.quotaUsed} total={selectedReseller.quota} />
            </div>

            {usageStats.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Monthly Usage</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-slate-700">
                        <th className="pb-2 text-gray-500 dark:text-slate-400">Month</th>
                        <th className="pb-2 text-gray-500 dark:text-slate-400">Leads</th>
                        <th className="pb-2 text-gray-500 dark:text-slate-400">Clinics</th>
                        <th className="pb-2 text-gray-500 dark:text-slate-400">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                      {usageStats.map(stat => (
                        <tr key={stat.month}>
                          <td className="py-2 text-gray-700 dark:text-slate-300">{stat.month}</td>
                          <td className="py-2 text-gray-700 dark:text-slate-300">{stat.leads}</td>
                          <td className="py-2 text-gray-700 dark:text-slate-300">{stat.clinics}</td>
                          <td className="py-2 text-gray-700 dark:text-slate-300">${stat.revenue.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
