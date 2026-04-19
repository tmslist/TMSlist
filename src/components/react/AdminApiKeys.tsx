import { useState, useEffect } from 'react';

interface ApiKey {
  id: string;
  name: string;
  keyPreview: string;
  permissions: string[];
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  active: boolean;
}

const PERMISSIONS = [
  'clinics:read', 'clinics:write',
  'doctors:read', 'doctors:write',
  'leads:read', 'leads:write',
  'reviews:read', 'reviews:write',
  'analytics:read',
];

export default function AdminApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState({ name: '', permissions: [] as string[], expiresAt: '' });

  useEffect(() => {
    fetch('/api/admin/api-keys')
      .then(r => r.ok ? r.json() : { keys: [] })
      .then(d => setKeys(d.keys || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function createKey() {
    if (!newKey.name) return;
    setCreating(true);
    try {
      const res = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newKey),
      });
      const data = await res.json();
      if (data.key) {
        // Show full key only once
        setKeys(prev => [...prev, { ...data.key, keyPreview: data.key.key.slice(0, 8) + '...' }]);
        setNewKey({ name: '', permissions: [], expiresAt: '' });
      }
    } catch { /* silent */ }
    setCreating(false);
  }

  async function revokeKey(id: string) {
    try {
      await fetch(`/api/admin/api-keys/${id}`, { method: 'DELETE' });
      setKeys(prev => prev.filter(k => k.id !== id));
    } catch { /* silent */ }
  }

  async function toggleKey(key: ApiKey) {
    setKeys(prev => prev.map(k => k.id === key.id ? { ...k, active: !k.active } : k));
    try {
      await fetch(`/api/admin/api-keys/${key.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !key.active }),
      });
    } catch { /* silent */ }
  }

  function formatDate(d: string | null) {
    if (!d) return 'Never';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">API Keys</h1>
          <p className="text-gray-500 mt-1">Manage access tokens for third-party integrations</p>
        </div>
        <button
          onClick={() => setNewKey({ name: '', permissions: [], expiresAt: '' })}
          className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors"
        >
          + Create Key
        </button>
      </div>

      {/* Create key form */}
      {newKey.name !== undefined && !newKey.permissions.length === false && (
        <div className="bg-white rounded-xl border border-violet-200 p-6 mb-6 shadow-sm ring-1 ring-violet-100">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Create New API Key</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Key Name</label>
              <input
                type="text"
                value={newKey.name}
                onChange={e => setNewKey({ ...newKey, name: e.target.value })}
                placeholder="Production API Client"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expires At (optional)</label>
              <input
                type="date"
                value={newKey.expiresAt}
                onChange={e => setNewKey({ ...newKey, expiresAt: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {PERMISSIONS.map(p => (
                <label key={p} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={newKey.permissions.includes(p)}
                    onChange={e => {
                      const perms = e.target.checked ? [...newKey.permissions, p] : newKey.permissions.filter(x => x !== p);
                      setNewKey({ ...newKey, permissions: perms });
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-violet-600"
                  />
                  <span className="font-medium text-gray-700 text-xs">{p}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={createKey}
              disabled={creating || !newKey.name || newKey.permissions.length === 0}
              className="px-5 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors"
            >
              {creating ? 'Creating...' : 'Create Key'}
            </button>
            <button
              onClick={() => setNewKey({ name: '', permissions: [] as string[], expiresAt: '' })}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Key list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Key Preview</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Permissions</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Used</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {keys.map(key => (
              <tr key={key.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">{key.name}</td>
                <td className="px-6 py-4 font-mono text-xs text-gray-500">{key.keyPreview}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {key.permissions.map(p => (
                      <span key={p} className="px-2 py-0.5 bg-violet-50 text-violet-700 text-xs rounded-md font-medium">{p}</span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{formatDate(key.expiresAt)}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{formatDate(key.lastUsedAt)}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => toggleKey(key)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      key.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {key.active ? 'Active' : 'Revoked'}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <button onClick={() => revokeKey(key.id)} className="text-xs font-medium text-red-600 hover:text-red-700">
                    Revoke
                  </button>
                </td>
              </tr>
            ))}
            {keys.length === 0 && (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">No API keys yet. Create one above.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}