import { useState, useEffect, useCallback } from 'react';

interface Redirect {
  id: string;
  sourcePath: string;
  targetPath: string;
  type: '301' | '302' | '307' | '308';
  active: boolean;
  createdAt: string;
}

const TYPE_COLORS: Record<string, string> = {
  '301': 'bg-blue-100 text-blue-700',
  '302': 'bg-green-100 text-green-700',
  '307': 'bg-amber-100 text-amber-700',
  '308': 'bg-purple-100 text-purple-700',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

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

export default function AdminRedirectManager() {
  const [redirects, setRedirects] = useState<Redirect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingRedirect, setEditingRedirect] = useState<Redirect | null>(null);
  const [conflictWarning, setConflictWarning] = useState('');
  const [saving, setSaving] = useState(false);

  // Form state
  const [sourcePath, setSourcePath] = useState('');
  const [targetPath, setTargetPath] = useState('');
  const [type, setType] = useState<'301' | '302' | '307' | '308'>('301');

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchRedirects = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/redirects');
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to fetch redirects');
      const json = await res.json();
      setRedirects(json.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load redirects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRedirects(); }, [fetchRedirects]);

  function openModal(redirect?: Redirect) {
    if (redirect) {
      setEditingRedirect(redirect);
      setSourcePath(redirect.sourcePath);
      setTargetPath(redirect.targetPath);
      setType(redirect.type);
    } else {
      setEditingRedirect(null);
      setSourcePath('');
      setTargetPath('');
      setType('301');
    }
    setConflictWarning('');
    setShowModal(true);
  }

  function checkConflict(path: string) {
    const existing = redirects.find(r => r.sourcePath === path && r.id !== editingRedirect?.id);
    if (existing) {
      setConflictWarning(`Warning: "${path}" already redirects to "${existing.targetPath}"`);
    } else {
      setConflictWarning('');
    }
  }

  function handleSourceChange(value: string) {
    setSourcePath(value);
    checkConflict(value);
  }

  async function handleSave() {
    if (!sourcePath || !targetPath) { showToast('error', 'Source and target paths are required'); return; }
    if (sourcePath === targetPath) { showToast('error', 'Source and target paths cannot be the same'); return; }

    setSaving(true);
    try {
      const body = { sourcePath, targetPath, type };
      const url = editingRedirect ? `/api/admin/redirects?id=${editingRedirect.id}` : '/api/admin/redirects';
      const method = editingRedirect ? 'PUT' : 'POST';

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to save redirect');

      showToast('success', `Redirect ${editingRedirect ? 'updated' : 'created'}`);
      setShowModal(false);
      fetchRedirects();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to save redirect');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(redirect: Redirect) {
    try {
      const res = await fetch(`/api/admin/redirects?id=${redirect.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...redirect, active: !redirect.active }),
      });
      if (!res.ok) throw new Error('Failed to update redirect');
      setRedirects(redirects.map(r => r.id === redirect.id ? { ...r, active: !redirect.active } : r));
      showToast('success', `Redirect ${!redirect.active ? 'activated' : 'deactivated'}`);
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to update redirect');
    }
  }

  async function handleDelete(redirect: Redirect) {
    if (!confirm(`Delete redirect from "${redirect.sourcePath}"?`)) return;
    try {
      const res = await fetch(`/api/admin/redirects?id=${redirect.id}`, { method: 'DELETE' });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to delete redirect');
      setRedirects(redirects.filter(r => r.id !== redirect.id));
      showToast('success', 'Redirect deleted');
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to delete redirect');
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
          <h2 className="text-xl font-semibold text-gray-900">Redirect Manager</h2>
          <p className="text-sm text-gray-500 mt-0.5">{redirects.length} redirect{redirects.length !== 1 ? 's' : ''} configured</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchRedirects} className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button onClick={() => openModal()} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Redirect
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="inline-block w-8 h-8 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : redirects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No redirects configured.</p>
            <button onClick={() => openModal()} className="mt-3 text-indigo-600 hover:text-indigo-700 text-sm font-medium">Add your first redirect</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Source Path</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Target Path</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Created</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {redirects.map(redirect => (
                  <tr key={redirect.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-gray-900">{redirect.sourcePath}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">{redirect.targetPath}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${TYPE_COLORS[redirect.type]}`}>{redirect.type}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggle(redirect)} className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${redirect.active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                        {redirect.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(redirect.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openModal(redirect)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDelete(redirect)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600">
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
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingRedirect ? 'Edit Redirect' : 'Add Redirect'}>
        <div className="space-y-5">
          {conflictWarning && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
              {conflictWarning}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source Path *</label>
            <input type="text" value={sourcePath} onChange={e => handleSourceChange(e.target.value)} placeholder="/old-page" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            <p className="text-xs text-gray-400 mt-1">The path users will be redirected from</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Path *</label>
            <input type="text" value={targetPath} onChange={e => setTargetPath(e.target.value)} placeholder="/new-page" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            <p className="text-xs text-gray-400 mt-1">The path users will be redirected to</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Redirect Type</label>
            <select value={type} onChange={e => setType(e.target.value as typeof type)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option value="301">301 - Moved Permanently</option>
              <option value="302">302 - Found (Temporary)</option>
              <option value="307">307 - Temporary Redirect</option>
              <option value="308">308 - Permanent Redirect</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">
              {type === '301' && 'Browsers and search engines will cache this redirect permanently'}
              {type === '302' && 'Browsers may cache this redirect; SEO impact'}
              {type === '307' && 'Temporary redirect that preserves HTTP method'}
              {type === '308' && 'Permanent redirect that preserves HTTP method'}
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : editingRedirect ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
