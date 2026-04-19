import { useState, useEffect, useCallback } from 'react';

interface WhiteLabelConfig {
  id: string;
  resellerId?: string;
  domain: string;
  brandName: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor?: string;
  customCss?: string;
  customHeaderLinks?: string;
  customFooterLinks?: string;
  isActive: boolean;
  createdAt: string;
  reseller?: { id: string; name: string; email: string } | null;
}

interface FontOption {
  name: string;
  value: string;
}

const FONT_OPTIONS: FontOption[] = [
  { name: 'Inter', value: 'Inter, sans-serif' },
  { name: 'Roboto', value: 'Roboto, sans-serif' },
  { name: 'Open Sans', value: 'Open Sans, sans-serif' },
  { name: 'Lato', value: 'Lato, sans-serif' },
  { name: 'Poppins', value: 'Poppins, sans-serif' },
  { name: 'Montserrat', value: 'Montserrat, sans-serif' },
  { name: 'Source Sans Pro', value: 'Source Sans Pro, sans-serif' },
  { name: 'Nunito', value: 'Nunito, sans-serif' },
];

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

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const presets = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#14b6d4', '#0f172a', '#1e293b'];
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-12 h-10 rounded border border-gray-300 dark:border-slate-600 cursor-pointer" />
        <input type="text" value={value} onChange={e => onChange(e.target.value)} className="flex-1 rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm font-mono bg-white dark:bg-slate-900" />
        <div className="flex gap-1">
          {presets.map(c => (
            <button key={c} type="button" onClick={() => onChange(c)} className="w-6 h-6 rounded border border-gray-200 dark:border-slate-600 hover:scale-110 transition-transform" style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function BrandingPreview({ config }: { config: Partial<WhiteLabelConfig> }) {
  const primary = config.primaryColor || '#6366f1';
  const secondary = config.secondaryColor || '#8b5cf6';
  return (
    <div className="border border-gray-200 dark:border-slate-600 rounded-xl p-4 bg-gray-50 dark:bg-slate-900">
      <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase mb-3">Preview</p>
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-3">
          {config.logoUrl && <img src={config.logoUrl} alt="Logo" className="h-8 object-contain" />}
          <span className="text-sm font-bold" style={{ color: primary }}>{config.brandName || 'Brand Name'}</span>
        </div>
        <div className="h-1 rounded-full overflow-hidden bg-gray-100 dark:bg-slate-700 mb-2">
          <div className="h-full rounded-full" style={{ width: '70%', backgroundColor: primary }} />
        </div>
        <div className="h-1 rounded-full overflow-hidden bg-gray-100 dark:bg-slate-700 mb-3">
          <div className="h-full rounded-full" style={{ width: '40%', backgroundColor: secondary }} />
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 rounded-lg text-xs font-medium text-white" style={{ backgroundColor: primary }}>
            Primary
          </button>
          <button className="px-3 py-1.5 rounded-lg text-xs font-medium text-white" style={{ backgroundColor: secondary }}>
            Secondary
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminWhiteLabelEditor() {
  const [configs, setConfigs] = useState<WhiteLabelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<WhiteLabelConfig | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formDomain, setFormDomain] = useState('');
  const [formBrandName, setFormBrandName] = useState('');
  const [formLogoUrl, setFormLogoUrl] = useState('');
  const [formFaviconUrl, setFormFaviconUrl] = useState('');
  const [formPrimaryColor, setFormPrimaryColor] = useState('#6366f1');
  const [formSecondaryColor, setFormSecondaryColor] = useState('#8b5cf6');
  const [formCustomCss, setFormCustomCss] = useState('');
  const [formHeaderLinks, setFormHeaderLinks] = useState<{ label: string; url: string }[]>([]);
  const [formFooterLinks, setFormFooterLinks] = useState<{ label: string; url: string }[]>([]);
  const [formFont, setFormFont] = useState('Inter, sans-serif');
  const [formResellerId, setFormResellerId] = useState('');

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/white-label');
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to fetch white-label configs');
      const json = await res.json();
      setConfigs(json.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  function openModal(cfg?: WhiteLabelConfig) {
    if (cfg) {
      setEditingConfig(cfg);
      setFormDomain(cfg.domain);
      setFormBrandName(cfg.brandName || '');
      setFormLogoUrl(cfg.logoUrl || '');
      setFormFaviconUrl(cfg.faviconUrl || '');
      setFormPrimaryColor(cfg.primaryColor || '#6366f1');
      setFormSecondaryColor(cfg.secondaryColor || '#8b5cf6');
      setFormCustomCss(cfg.customCss || '');
      setFormHeaderLinks(cfg.customHeaderLinks ? JSON.parse(cfg.customHeaderLinks) : []);
      setFormFooterLinks(cfg.customFooterLinks ? JSON.parse(cfg.customFooterLinks) : []);
      setFormFont('Inter, sans-serif');
      setFormResellerId(cfg.resellerId || '');
    } else {
      setEditingConfig(null);
      setFormDomain('');
      setFormBrandName('');
      setFormLogoUrl('');
      setFormFaviconUrl('');
      setFormPrimaryColor('#6366f1');
      setFormSecondaryColor('#8b5cf6');
      setFormCustomCss('');
      setFormHeaderLinks([]);
      setFormFooterLinks([]);
      setFormFont('Inter, sans-serif');
      setFormResellerId('');
    }
    setShowModal(true);
  }

  function addLink(type: 'header' | 'footer') {
    if (type === 'header') setFormHeaderLinks([...formHeaderLinks, { label: '', url: '' }]);
    else setFormFooterLinks([...formFooterLinks, { label: '', url: '' }]);
  }

  function updateLink(type: 'header' | 'footer', index: number, key: 'label' | 'url', value: string) {
    const links = type === 'header' ? [...formHeaderLinks] : [...formFooterLinks];
    links[index][key] = value;
    if (type === 'header') setFormHeaderLinks(links);
    else setFormFooterLinks(links);
  }

  function removeLink(type: 'header' | 'footer', index: number) {
    if (type === 'header') setFormHeaderLinks(formHeaderLinks.filter((_, i) => i !== index));
    else setFormFooterLinks(formFooterLinks.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!formDomain || !formBrandName) { showToast('error', 'Domain and brand name are required'); return; }

    setSaving(true);
    try {
      const body = {
        domain: formDomain,
        brandName: formBrandName,
        logoUrl: formLogoUrl || null,
        faviconUrl: formFaviconUrl || null,
        primaryColor: formPrimaryColor,
        secondaryColor: formSecondaryColor,
        customCss: formCustomCss || null,
        customHeaderLinks: formHeaderLinks.length > 0 ? JSON.stringify(formHeaderLinks) : null,
        customFooterLinks: formFooterLinks.length > 0 ? JSON.stringify(formFooterLinks) : null,
        isActive: true,
        resellerId: formResellerId || null,
      };

      const url = editingConfig ? `/api/admin/white-label?id=${editingConfig.id}` : '/api/admin/white-label';
      const method = editingConfig ? 'PUT' : 'POST';

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to save configuration');

      showToast('success', `White-label config ${editingConfig ? 'updated' : 'created'}`);
      setShowModal(false);
      fetchConfigs();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(cfg: WhiteLabelConfig) {
    try {
      const res = await fetch(`/api/admin/white-label?id=${cfg.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...cfg, isActive: !cfg.isActive }),
      });
      if (!res.ok) throw new Error('Failed to toggle');
      setConfigs(configs.map(c => c.id === cfg.id ? { ...c, isActive: !c.isActive } : c));
      showToast('success', `Config ${cfg.isActive ? 'deactivated' : 'activated'}`);
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to toggle');
    }
  }

  async function handleDelete(cfg: WhiteLabelConfig) {
    if (!confirm(`Delete white-label config for "${cfg.domain}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/white-label?id=${cfg.id}`, { method: 'DELETE' });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to delete');
      setConfigs(configs.filter(c => c.id !== cfg.id));
      showToast('success', 'Configuration deleted');
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to delete');
    }
  }

  const currentPreview = {
    domain: formDomain,
    brandName: formBrandName,
    logoUrl: formLogoUrl,
    primaryColor: formPrimaryColor,
    secondaryColor: formSecondaryColor,
  };

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
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">White-Label Editor</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{configs.length} configuration{configs.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchConfigs} className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button onClick={() => openModal()} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Configuration
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="inline-block w-8 h-8 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : configs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-slate-400">No white-label configurations yet.</p>
            <button onClick={() => openModal()} className="mt-3 text-indigo-600 hover:text-indigo-700 text-sm font-medium">Create your first configuration</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Domain</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Brand</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Colors</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Reseller</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {configs.map(cfg => (
                  <tr key={cfg.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">{cfg.domain}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{cfg.brandName || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded border border-gray-200 dark:border-slate-600" style={{ backgroundColor: cfg.primaryColor }} />
                        <div className="w-5 h-5 rounded border border-gray-200 dark:border-slate-600" style={{ backgroundColor: cfg.secondaryColor || '#8b5cf6' }} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggle(cfg)} className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${cfg.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200' : 'bg-gray-100 text-gray-400 dark:bg-slate-700 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-600'}`}>
                        {cfg.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-400">{cfg.reseller?.name || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openModal(cfg)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 dark:text-slate-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(cfg)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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

      {/* White-Label Config Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingConfig ? 'Edit White-Label Configuration' : 'New White-Label Configuration'}>
        <div className="space-y-6">
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Logo URL</label>
              <input type="url" value={formLogoUrl} onChange={e => setFormLogoUrl(e.target.value)} placeholder="https://..." className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Favicon URL</label>
              <input type="url" value={formFaviconUrl} onChange={e => setFormFaviconUrl(e.target.value)} placeholder="https://.../favicon.ico" className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ColorPicker label="Primary Color" value={formPrimaryColor} onChange={setFormPrimaryColor} />
            <ColorPicker label="Secondary Color" value={formSecondaryColor} onChange={setFormSecondaryColor} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Font Family</label>
            <select value={formFont} onChange={e => setFormFont(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900">
              {FONT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Custom Header Links</label>
              <button type="button" onClick={() => addLink('header')} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">+ Add Link</button>
            </div>
            <div className="space-y-2">
              {formHeaderLinks.map((link, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="text" value={link.label} onChange={e => updateLink('header', i, 'label', e.target.value)} placeholder="Label" className="flex-1 rounded-lg border border-gray-300 dark:border-slate-600 px-2 py-1.5 text-sm bg-white dark:bg-slate-900" />
                  <input type="url" value={link.url} onChange={e => updateLink('header', i, 'url', e.target.value)} placeholder="https://..." className="flex-1 rounded-lg border border-gray-300 dark:border-slate-600 px-2 py-1.5 text-sm bg-white dark:bg-slate-900" />
                  <button onClick={() => removeLink('header', i)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
              {formHeaderLinks.length === 0 && <p className="text-xs text-gray-400 dark:text-slate-500">No custom header links</p>}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Custom Footer Links</label>
              <button type="button" onClick={() => addLink('footer')} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">+ Add Link</button>
            </div>
            <div className="space-y-2">
              {formFooterLinks.map((link, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="text" value={link.label} onChange={e => updateLink('footer', i, 'label', e.target.value)} placeholder="Label" className="flex-1 rounded-lg border border-gray-300 dark:border-slate-600 px-2 py-1.5 text-sm bg-white dark:bg-slate-900" />
                  <input type="url" value={link.url} onChange={e => updateLink('footer', i, 'url', e.target.value)} placeholder="https://..." className="flex-1 rounded-lg border border-gray-300 dark:border-slate-600 px-2 py-1.5 text-sm bg-white dark:bg-slate-900" />
                  <button onClick={() => removeLink('footer', i)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
              {formFooterLinks.length === 0 && <p className="text-xs text-gray-400 dark:text-slate-500">No custom footer links</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Custom CSS</label>
            <textarea
              value={formCustomCss}
              onChange={e => setFormCustomCss(e.target.value)}
              rows={4}
              placeholder=":root { --brand-primary: #6366f1; }"
              className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm font-mono bg-white dark:bg-slate-900"
            />
          </div>

          <BrandingPreview config={currentPreview} />

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Saving...' : editingConfig ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
