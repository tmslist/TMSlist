import { useState, useEffect, useCallback } from 'react';

interface Reseller {
  id: string;
  domain: string;
  brandName: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  headerLinks?: { label: string; url: string }[];
  footerLinks?: { label: string; url: string }[];
  status: 'active' | 'inactive';
  clinicCount: number;
  revenueShare: number;
  createdAt: string;
}

interface ResellerClinic {
  id: string;
  name: string;
  city: string;
  revenue: number;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
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

export default function AdminWhiteLabel() {
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingReseller, setEditingReseller] = useState<Reseller | null>(null);
  const [selectedReseller, setSelectedReseller] = useState<Reseller | null>(null);
  const [resellerClinics, setResellerClinics] = useState<ResellerClinic[]>([]);
  const [saving, setSaving] = useState(false);

  // Form state
  const [domain, setDomain] = useState('');
  const [brandName, setBrandName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [secondaryColor, setSecondaryColor] = useState('#8b5cf6');
  const [logoUrl, setLogoUrl] = useState('');
  const [headerLinks, setHeaderLinks] = useState<{ label: string; url: string }[]>([]);
  const [footerLinks, setFooterLinks] = useState<{ label: string; url: string }[]>([]);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchResellers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/white-label');
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to fetch resellers');
      const json = await res.json();
      setResellers(json.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load resellers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchResellers(); }, [fetchResellers]);

  function openModal(res?: Reseller) {
    if (res) {
      setEditingReseller(res);
      setDomain(res.domain);
      setBrandName(res.brandName);
      setPrimaryColor(res.primaryColor);
      setSecondaryColor(res.secondaryColor);
      setLogoUrl(res.logoUrl || '');
      setHeaderLinks(res.headerLinks || []);
      setFooterLinks(res.footerLinks || []);
    } else {
      setEditingReseller(null);
      setDomain('');
      setBrandName('');
      setPrimaryColor('#6366f1');
      setSecondaryColor('#8b5cf6');
      setLogoUrl('');
      setHeaderLinks([]);
      setFooterLinks([]);
    }
    setShowModal(true);
  }

  async function openDetail(reseller: Reseller) {
    setSelectedReseller(reseller);
    try {
      const res = await fetch(`/api/admin/white-label/${reseller.id}`);
      if (res.ok) {
        const json = await res.json();
        setResellerClinics(json.clinics || []);
      }
    } catch { setResellerClinics([]); }
    setShowDetailModal(true);
  }

  function addLink(type: 'header' | 'footer') {
    if (type === 'header') setHeaderLinks([...headerLinks, { label: '', url: '' }]);
    else setFooterLinks([...footerLinks, { label: '', url: '' }]);
  }

  function updateLink(type: 'header' | 'footer', index: number, key: 'label' | 'url', value: string) {
    const links = type === 'header' ? [...headerLinks] : [...footerLinks];
    links[index][key] = value;
    if (type === 'header') setHeaderLinks(links);
    else setFooterLinks(links);
  }

  function removeLink(type: 'header' | 'footer', index: number) {
    if (type === 'header') setHeaderLinks(headerLinks.filter((_, i) => i !== index));
    else setFooterLinks(footerLinks.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!domain || !brandName) { showToast('error', 'Domain and brand name are required'); return; }

    setSaving(true);
    try {
      const body = { domain, brandName, primaryColor, secondaryColor, logoUrl, headerLinks, footerLinks };
      const url = editingReseller ? `/api/admin/white-label?id=${editingReseller.id}` : '/api/admin/white-label';
      const method = editingReseller ? 'PUT' : 'POST';

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to save reseller');

      showToast('success', `Reseller ${editingReseller ? 'updated' : 'created'}`);
      setShowModal(false);
      fetchResellers();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to save reseller');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(reseller: Reseller) {
    try {
      const res = await fetch(`/api/admin/white-label?id=${reseller.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...reseller, status: reseller.status === 'active' ? 'inactive' : 'active' }),
      });
      if (!res.ok) throw new Error('Failed to update reseller');
      setResellers(resellers.map(r => r.id === reseller.id ? { ...r, status: r.status === 'active' ? 'inactive' : 'active' } : r));
      showToast('success', `Reseller ${reseller.status === 'active' ? 'deactivated' : 'activated'}`);
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to update reseller');
    }
  }

  async function handleDelete(reseller: Reseller) {
    if (!confirm(`Delete reseller "${reseller.brandName}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/white-label?id=${reseller.id}`, { method: 'DELETE' });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to delete reseller');
      setResellers(resellers.filter(r => r.id !== reseller.id));
      showToast('success', 'Reseller deleted');
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to delete reseller');
    }
  }

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

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">White Label / Resellers</h2>
          <p className="text-sm text-gray-500 mt-0.5">{resellers.length} reseller{resellers.length !== 1 ? 's' : ''} configured</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchResellers} className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="inline-block w-8 h-8 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : resellers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No resellers configured.</p>
            <button onClick={() => openModal()} className="mt-3 text-indigo-600 hover:text-indigo-700 text-sm font-medium">Add your first reseller</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Domain</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Brand</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Colors</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Clinics</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Revenue Share</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {resellers.map(reseller => (
                  <tr key={reseller.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-gray-900">{reseller.domain}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{reseller.brandName}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded border border-gray-200" style={{ backgroundColor: reseller.primaryColor }} />
                        <div className="w-5 h-5 rounded border border-gray-200" style={{ backgroundColor: reseller.secondaryColor }} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggle(reseller)} className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${reseller.status === 'active' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                        {reseller.status === 'active' ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{reseller.clinicCount}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{reseller.revenueShare}%</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openDetail(reseller)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700" title="View Details">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button onClick={() => openModal(reseller)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDelete(reseller)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingReseller ? 'Edit Reseller' : 'Add Reseller'}>
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Domain *</label>
              <input type="text" value={domain} onChange={e => setDomain(e.target.value)} placeholder="clinic.example.com" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name *</label>
              <input type="text" value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="Example Clinics" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-12 h-10 rounded border border-gray-300 cursor-pointer" />
                <input type="text" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="w-12 h-10 rounded border border-gray-300 cursor-pointer" />
                <input type="text" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
            <input type="url" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://..." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Header Links</label>
              <button onClick={() => addLink('header')} type="button" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">+ Add</button>
            </div>
            <div className="space-y-2">
              {headerLinks.map((link, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="text" value={link.label} onChange={e => updateLink('header', i, 'label', e.target.value)} placeholder="Label" className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm" />
                  <input type="url" value={link.url} onChange={e => updateLink('header', i, 'url', e.target.value)} placeholder="URL" className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm" />
                  <button onClick={() => removeLink('header', i)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Footer Links</label>
              <button onClick={() => addLink('footer')} type="button" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">+ Add</button>
            </div>
            <div className="space-y-2">
              {footerLinks.map((link, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="text" value={link.label} onChange={e => updateLink('footer', i, 'label', e.target.value)} placeholder="Label" className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm" />
                  <input type="url" value={link.url} onChange={e => updateLink('footer', i, 'url', e.target.value)} placeholder="URL" className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm" />
                  <button onClick={() => removeLink('footer', i)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : editingReseller ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal open={showDetailModal} onClose={() => setShowDetailModal(false)} title={selectedReseller?.brandName || 'Reseller Details'}>
        {selectedReseller && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{selectedReseller.clinicCount}</p>
                <p className="text-xs text-gray-500 mt-1">Clinics</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{selectedReseller.revenueShare}%</p>
                <p className="text-xs text-gray-500 mt-1">Revenue Share</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-900 capitalize">{selectedReseller.status}</p>
                <p className="text-xs text-gray-500 mt-1">Status</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Their Clinics</h4>
              {resellerClinics.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No clinics assigned to this reseller.</div>
              ) : (
                <div className="space-y-2">
                  {resellerClinics.map(clinic => (
                    <div key={clinic.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{clinic.name}</p>
                        <p className="text-xs text-gray-500">{clinic.city}</p>
                      </div>
                      <span className="text-sm text-gray-600">${clinic.revenue.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
