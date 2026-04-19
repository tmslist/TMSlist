import { useState, useEffect, useCallback } from 'react';

interface Translation {
  id: string;
  localeCode: string;
  key: string;
  value: string;
  context: string | null;
}

interface LocaleInfo {
  code: string;
  name: string;
  translationCount: number;
  completionPercent: number;
}

type TabKey = 'keys' | 'compare' | 'import_export';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'keys', label: 'Translation Keys' },
  { key: 'compare', label: 'Language Compare' },
  { key: 'import_export', label: 'Import / Export' },
];

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
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

export default function AdminTranslationEditor() {
  const [tab, setTab] = useState<TabKey>('keys');
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [locales, setLocales] = useState<LocaleInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTranslation, setEditingTranslation] = useState<Translation | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchKey, setSearchKey] = useState('');
  const [selectedLocale, setSelectedLocale] = useState('en');

  const [editLocale, setEditLocale] = useState('');
  const [editKey, setEditKey] = useState('');
  const [editValue, setEditValue] = useState('');
  const [editContext, setEditContext] = useState('');

  const [addLocale, setAddLocale] = useState('en');
  const [addKey, setAddKey] = useState('');
  const [addValue, setAddValue] = useState('');
  const [addContext, setAddContext] = useState('');

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [tRes, lRes] = await Promise.all([
        fetch(`/api/admin/translations?locale=${selectedLocale}`),
        fetch('/api/admin/translations/locales'),
      ]);
      if (tRes.status === 401) { window.location.href = '/admin/login'; return; }
      if (!tRes.ok || !lRes.ok) throw new Error('Failed to fetch data');
      const [tJson, lJson] = await Promise.all([tRes.json(), lRes.json()]);
      setTranslations(tJson.data || []);
      setLocales(lJson.locales || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [selectedLocale]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function openEditModal(t: Translation) {
    setEditingTranslation(t);
    setEditLocale(t.localeCode);
    setEditKey(t.key);
    setEditValue(t.value);
    setEditContext(t.context || '');
    setShowEditModal(true);
  }

  async function saveTranslation() {
    if (!editKey || !editValue) { showToast('error', 'Key and value are required'); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/translations?id=${editingTranslation!.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: editKey, value: editValue, context: editContext }),
      });
      if (!res.ok) throw new Error('Failed to save');
      showToast('success', 'Translation saved');
      setShowEditModal(false);
      fetchData();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function addTranslation() {
    if (!addKey || !addValue) { showToast('error', 'Key and value are required'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/translations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ localeCode: addLocale, key: addKey, value: addValue, context: addContext }),
      });
      if (!res.ok) throw new Error('Failed to create');
      showToast('success', 'Translation added');
      setShowAddModal(false);
      setAddKey('');
      setAddValue('');
      setAddContext('');
      fetchData();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to add');
    } finally {
      setSaving(false);
    }
  }

  async function deleteTranslation(t: Translation) {
    if (!confirm(`Delete translation "${t.key}"?`)) return;
    try {
      const res = await fetch(`/api/admin/translations?id=${t.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setTranslations(translations.filter(tr => tr.id !== t.id));
      showToast('success', 'Translation deleted');
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to delete');
    }
  }

  async function importTranslations(file: File) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const json = JSON.parse(text);
        const res = await fetch('/api/admin/translations/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(json),
        });
        if (!res.ok) throw new Error('Failed to import');
        showToast('success', 'Translations imported');
        fetchData();
      } catch {
        showToast('error', 'Invalid JSON file');
      }
    };
    reader.readAsText(file);
  }

  function exportTranslations() {
    const data: Record<string, Record<string, string>> = {};
    translations.forEach(t => {
      if (!data[t.localeCode]) data[t.localeCode] = {};
      data[t.localeCode][t.key] = t.value;
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translations-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', 'Translations exported');
  }

  const filteredTranslations = searchKey
    ? translations.filter(t => t.key.toLowerCase().includes(searchKey.toLowerCase()) || t.value.toLowerCase().includes(searchKey.toLowerCase()))
    : translations;

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
          <h2 className="text-xl font-semibold text-gray-900">Translation Editor</h2>
          <p className="text-sm text-gray-500 mt-0.5">Key-value translations and language management</p>
        </div>
        <button onClick={() => fetchData()} className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex gap-1 px-4">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
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
          ) : tab === 'keys' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <select value={selectedLocale} onChange={e => setSelectedLocale(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                  {locales.map(l => <option key={l.code} value={l.code}>{l.name} ({l.code})</option>)}
                </select>
                <input type="text" value={searchKey} onChange={e => setSearchKey(e.target.value)} placeholder="Search keys or values..." className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                <button onClick={() => { setAddLocale(selectedLocale); setAddKey(''); setAddValue(''); setAddContext(''); setShowAddModal(true); }} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Key
                </button>
              </div>

              {filteredTranslations.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No translations found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Key</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Value</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Context</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredTranslations.map(t => (
                        <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-mono text-gray-900">{t.key}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{t.value}</td>
                          <td className="px-4 py-3 text-xs text-gray-400">{t.context || '-'}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button onClick={() => openEditModal(t)} className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Edit</button>
                              <button onClick={() => deleteTranslation(t)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600">
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
          ) : tab === 'compare' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <select value={selectedLocale} onChange={e => setSelectedLocale(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                  {locales.map(l => <option key={l.code} value={l.code}>{l.name} ({l.code})</option>)}
                </select>
              </div>

              {locales.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Key</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Base (en)</th>
                        {locales.filter(l => l.code !== 'en').map(l => (
                          <th key={l.code} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{l.name} ({l.code})</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {translations.slice(0, 50).map(t => {
                        const baseValue = t.localeCode === 'en' ? t.value : null;
                        return (
                          <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-sm font-mono text-gray-900">{t.key}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{baseValue || '-'}</td>
                            {locales.filter(l => l.code !== 'en').map(l => (
                              <td key={l.code} className="px-4 py-3 text-sm text-gray-400">-</td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-xl p-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Import Translations</h4>
                  <input type="file" accept=".json" onChange={e => { if (e.target.files?.[0]) importTranslations(e.target.files[0]); }} className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                  <p className="text-xs text-gray-500 mt-2">Upload a JSON file with translations.</p>
                </div>

                <div className="border border-gray-200 rounded-xl p-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Export Translations</h4>
                  <p className="text-sm text-gray-600 mb-3">Download all translations as a JSON file.</p>
                  <button onClick={exportTranslations} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                    Export JSON
                  </button>
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl p-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Translation Progress</h4>
                <div className="space-y-3">
                  {locales.map(l => (
                    <div key={l.code} className="flex items-center gap-3">
                      <span className="text-sm text-gray-700 w-24">{l.name}</span>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${l.completionPercent}%` }} />
                      </div>
                      <span className="text-sm text-gray-600 w-16 text-right">{l.completionPercent}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Translation">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Key *</label>
            <input type="text" value={editKey} onChange={e => setEditKey(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Value *</label>
            <textarea value={editValue} onChange={e => setEditValue(e.target.value)} rows={4} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Context</label>
            <input type="text" value={editContext} onChange={e => setEditContext(e.target.value)} placeholder="Optional context for translators" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setShowEditModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={saveTranslation} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </div>
      </Modal>

      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add Translation Key">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Locale</label>
            <select value={addLocale} onChange={e => setAddLocale(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              {locales.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Key *</label>
            <input type="text" value={addKey} onChange={e => setAddKey(e.target.value)} placeholder="common.buttons.submit" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Value *</label>
            <textarea value={addValue} onChange={e => setAddValue(e.target.value)} rows={4} placeholder="Translation value..." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Context</label>
            <input type="text" value={addContext} onChange={e => setAddContext(e.target.value)} placeholder="Optional" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={addTranslation} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Adding...' : 'Add'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
