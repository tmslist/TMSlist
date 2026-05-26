import { useState, useEffect, useCallback } from 'react';

interface Locale {
  id: string;
  code: string;
  name: string;
  nativeName: string | null;
  isActive: boolean;
  isRtl: boolean;
  pluralRules: string | null;
  sortOrder: number;
}

type TabKey = 'languages' | 'plural_rules';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'languages', label: 'Languages' },
  { key: 'plural_rules', label: 'Plural Rules' },
];

const PLURAL_RULE_TEMPLATES = [
  { value: 'one', label: 'One (1)' },
  { value: 'few', label: 'Few (2-4)' },
  { value: 'many', label: 'Many (5+)' },
  { value: 'other', label: 'Other (all)' },
];

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)]">
          <h3 className="text-lg font-semibold text-[var(--ink)]">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--paper2)] text-[var(--muted)] hover:text-[var(--ink2)]">
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

export default function AdminLocaleManager() {
  const [tab, setTab] = useState<TabKey>('languages');
  const [locales, setLocales] = useState<Locale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showLocaleModal, setShowLocaleModal] = useState(false);
  const [editingLocale, setEditingLocale] = useState<Locale | null>(null);
  const [saving, setSaving] = useState(false);

  const [localeCode, setLocaleCode] = useState('');
  const [localeName, setLocaleName] = useState('');
  const [localeNativeName, setLocaleNativeName] = useState('');
  const [localeActive, setLocaleActive] = useState(false);
  const [localeRtl, setLocaleRtl] = useState(false);
  const [localePluralRules, setLocalePluralRules] = useState('');
  const [localeSortOrder, setLocaleSortOrder] = useState('0');

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/locales');
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to fetch locales');
      const json = await res.json();
      setLocales(json.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function openLocaleModal(l?: Locale) {
    if (l) {
      setEditingLocale(l);
      setLocaleCode(l.code);
      setLocaleName(l.name);
      setLocaleNativeName(l.nativeName || '');
      setLocaleActive(l.isActive);
      setLocaleRtl(l.isRtl);
      setLocalePluralRules(l.pluralRules || '');
      setLocaleSortOrder(String(l.sortOrder));
    } else {
      setEditingLocale(null);
      setLocaleCode('');
      setLocaleName('');
      setLocaleNativeName('');
      setLocaleActive(false);
      setLocaleRtl(false);
      setLocalePluralRules('');
      setLocaleSortOrder('0');
    }
    setShowLocaleModal(true);
  }

  async function saveLocale() {
    if (!localeCode || !localeName) { showToast('error', 'Code and name are required'); return; }
    setSaving(true);
    try {
      const body = {
        code: localeCode, name: localeName, nativeName: localeNativeName,
        isActive: localeActive, isRtl: localeRtl,
        pluralRules: localePluralRules, sortOrder: Number(localeSortOrder),
      };
      const url = editingLocale ? `/api/admin/locales?id=${editingLocale.id}` : '/api/admin/locales';
      const method = editingLocale ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Failed to save locale');
      showToast('success', 'Locale saved');
      setShowLocaleModal(false);
      fetchData();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function toggleLocale(l: Locale) {
    try {
      const res = await fetch(`/api/admin/locales?id=${l.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !l.isActive }),
      });
      if (!res.ok) throw new Error('Failed to toggle');
      showToast('success', l.isActive ? 'Locale deactivated' : 'Locale activated');
      fetchData();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to toggle');
    }
  }

  async function deleteLocale(l: Locale) {
    if (!confirm(`Delete locale "${l.name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/locales?id=${l.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setLocales(locales.filter(loc => loc.id !== l.id));
      showToast('success', 'Locale deleted');
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to delete');
    }
  }

  const activeLocales = locales.filter(l => l.isActive);
  const rtlLocales = locales.filter(l => l.isRtl);

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
          <h2 className="text-xl font-semibold text-[var(--ink)]">Locale Manager</h2>
          <p className="text-sm text-[var(--muted)] mt-0.5">Languages, translations, and RTL support</p>
        </div>
        <button onClick={() => fetchData()} className="px-3 py-2 bg-white border border-[var(--line)] rounded-lg text-sm font-medium text-[var(--ink2)] hover:bg-[var(--paper2)] transition-colors">
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-[rgba(201,101,74,0.06)] rounded-xl p-4">
          <p className="text-xs font-medium text-[var(--warm)] uppercase">Total Languages</p>
          <p className="text-2xl font-bold text-[var(--warm)] mt-1">{locales.length}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4">
          <p className="text-xs font-medium text-emerald-600 uppercase">Active</p>
          <p className="text-2xl font-bold text-emerald-900 mt-1">{activeLocales.length}</p>
        </div>
        <div className="bg-[var(--paper2)] rounded-xl p-4">
          <p className="text-xs font-medium text-[var(--ink)] uppercase">RTL Languages</p>
          <p className="text-2xl font-bold text-[var(--ink)] mt-1">{rtlLocales.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[var(--line)]">
        <div className="border-b border-[var(--line)]">
          <nav className="flex gap-1 px-4">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t.key ? 'border-[rgba(201,101,74,0.2)] text-[var(--warm)]' : 'border-transparent text-[var(--muted)] hover:text-[var(--ink2)]'}`}>
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="inline-block w-8 h-8 border-2 border-[var(--line)] border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : tab === 'languages' ? (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => openLocaleModal()} className="px-4 py-2 bg-[var(--ink2)] text-white text-sm font-medium rounded-lg hover:bg-[var(--ink2)] transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Language
                </button>
              </div>

              {locales.length === 0 ? (
                <div className="text-center py-12 text-[var(--muted)]">No languages configured.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-[var(--paper2)] border-b border-[var(--line)]">
                        <th className="px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase">Code</th>
                        <th className="px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase">Name</th>
                        <th className="px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase">Native Name</th>
                        <th className="px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase">Status</th>
                        <th className="px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase">RTL</th>
                        <th className="px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--line)]">
                      {locales.map(l => (
                        <tr key={l.id} className="hover:bg-[var(--paper2)] transition-colors">
                          <td className="px-4 py-3 text-sm font-mono font-medium text-[var(--ink)]">{l.code}</td>
                          <td className="px-4 py-3 text-sm font-medium text-[var(--ink)]">{l.name}</td>
                          <td className="px-4 py-3 text-sm text-[var(--ink2)]">{l.nativeName || '-'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${l.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-[var(--paper2)] text-[var(--muted)]'}`}>
                              {l.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {l.isRtl ? (
                              <span className="px-2 py-1 text-xs font-medium bg-[rgba(10,22,40,0.1)] text-[var(--ink)] rounded">RTL</span>
                            ) : (
                              <span className="text-xs text-[var(--muted)]">LTR</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button onClick={() => toggleLocale(l)} className={`w-10 h-5 rounded-full transition-colors relative ${l.isActive ? 'bg-[var(--ink2)]' : 'bg-[var(--line)]'}`}>
                                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${l.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                              </button>
                              <button onClick={() => openLocaleModal(l)} className="p-1.5 rounded-lg hover:bg-[var(--paper2)] text-[var(--muted)]">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button onClick={() => deleteLocale(l)} className="p-1.5 rounded-lg hover:bg-red-50 text-[var(--muted)] hover:text-red-600">
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
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-[var(--ink2)]">Configure plural rules for each language. Different languages have different plural forms based on cardinal numbers.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[var(--paper2)] border-b border-[var(--line)]">
                      <th className="px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase">Language</th>
                      <th className="px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase">Plural Rules</th>
                      <th className="px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase">Template</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)]">
                    {locales.map(l => (
                      <tr key={l.id} className="hover:bg-[var(--paper2)] transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-[var(--ink)]">{l.name} <span className="text-[var(--muted)]">({l.code})</span></td>
                        <td className="px-4 py-3 text-sm text-[var(--ink2)]">{l.pluralRules || '-'}</td>
                        <td className="px-4 py-3 text-xs text-[var(--muted)]">
                          {l.pluralRules ? l.pluralRules.split(',').map(p => p.trim()).join(', ') : 'one, other'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal open={showLocaleModal} onClose={() => setShowLocaleModal(false)} title={editingLocale ? 'Edit Language' : 'Add Language'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--ink2)] mb-1">Language Code *</label>
            <input type="text" value={localeCode} onChange={e => setLocaleCode(e.target.value)} placeholder="fr, ar, es" className="w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm focus:ring-2 focus:ring-[rgba(10,22,40,0.2)] focus:border-[rgba(201,101,74,0.2)]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--ink2)] mb-1">Display Name *</label>
            <input type="text" value={localeName} onChange={e => setLocaleName(e.target.value)} placeholder="French, Arabic, Spanish" className="w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm focus:ring-2 focus:ring-[rgba(10,22,40,0.2)] focus:border-[rgba(201,101,74,0.2)]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--ink2)] mb-1">Native Name</label>
            <input type="text" value={localeNativeName} onChange={e => setLocaleNativeName(e.target.value)} placeholder="Francais, العربية" className="w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm focus:ring-2 focus:ring-[rgba(10,22,40,0.2)] focus:border-[rgba(201,101,74,0.2)]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--ink2)] mb-1">Plural Rules</label>
            <input type="text" value={localePluralRules} onChange={e => setLocalePluralRules(e.target.value)} placeholder="one, few, many, other" className="w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm focus:ring-2 focus:ring-[rgba(10,22,40,0.2)] focus:border-[rgba(201,101,74,0.2)]" />
            <p className="text-xs text-[var(--muted)] mt-1">Comma-separated plural forms</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--ink2)] mb-1">Sort Order</label>
            <input type="number" value={localeSortOrder} onChange={e => setLocaleSortOrder(e.target.value)} min="0" className="w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm focus:ring-2 focus:ring-[rgba(10,22,40,0.2)] focus:border-[rgba(201,101,74,0.2)]" />
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm text-[var(--ink2)]">
              <input type="checkbox" checked={localeActive} onChange={e => setLocaleActive(e.target.checked)} className="w-4 h-4 rounded border-[var(--line)] text-[var(--warm)] focus:ring-[rgba(10,22,40,0.2)]" />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm text-[var(--ink2)]">
              <input type="checkbox" checked={localeRtl} onChange={e => setLocaleRtl(e.target.checked)} className="w-4 h-4 rounded border-[var(--line)] text-[var(--warm)] focus:ring-[rgba(10,22,40,0.2)]" />
              RTL Support
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--line)]">
            <button onClick={() => setShowLocaleModal(false)} className="px-4 py-2 border border-[var(--line)] rounded-lg text-sm font-medium text-[var(--ink2)] hover:bg-[var(--paper2)]">Cancel</button>
            <button onClick={saveLocale} disabled={saving} className="px-4 py-2 bg-[var(--ink2)] text-white text-sm font-medium rounded-lg hover:bg-[var(--ink2)] disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
