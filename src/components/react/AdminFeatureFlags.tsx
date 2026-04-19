import { useState, useEffect } from 'react';

interface FeatureFlag {
  id: string;
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  rollout: number; // 0-100 percentage
  targetRoles: string[];
  environments: string[];
  createdAt: string;
  updatedAt: string;
}

export default function AdminFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<FeatureFlag | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/feature-flags')
      .then(r => r.ok ? r.json() : { flags: [] })
      .then(d => setFlags(d.flags || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function saveFlag(flag: FeatureFlag) {
    setSaving(true);
    try {
      await fetch('/api/admin/feature-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flag),
      });
      setFlags(prev => {
        const idx = prev.findIndex(f => f.id === flag.id);
        return idx >= 0 ? prev.map(f => f.id === flag.id ? flag : f) : [...prev, flag];
      });
      setEditing(null);
    } catch { /* silent */ }
    setSaving(false);
  }

  async function toggleFlag(flag: FeatureFlag) {
    setFlags(prev => prev.map(f => f.id === flag.id ? { ...f, enabled: !f.enabled } : f));
    try {
      await fetch(`/api/admin/feature-flags/${flag.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !flag.enabled }),
      });
    } catch { /* silent */ }
  }

  function addNewFlag() {
    setEditing({
      id: `new-${Date.now()}`,
      key: '',
      label: '',
      description: '',
      enabled: false,
      rollout: 100,
      targetRoles: [],
      environments: ['production'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  const ROLES = ['admin', 'editor', 'clinic_owner', 'doctor'];
  const ENVIRONMENTS = ['production', 'staging', 'development'];

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
          <h1 className="text-2xl font-semibold text-gray-900">Feature Flags</h1>
          <p className="text-gray-500 mt-1">Control feature rollouts across environments</p>
        </div>
        <button
          onClick={addNewFlag}
          className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors"
        >
          + New Flag
        </button>
      </div>

      {/* Flag editor modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editing.id.startsWith('new') ? 'Create Feature Flag' : 'Edit Feature Flag'}
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Key</label>
                  <input
                    type="text"
                    value={editing.key}
                    onChange={e => setEditing({ ...editing, key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                    placeholder="new_dashboard"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rollout %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editing.rollout}
                    onChange={e => setEditing({ ...editing, rollout: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                <input
                  type="text"
                  value={editing.label}
                  onChange={e => setEditing({ ...editing, label: e.target.value })}
                  placeholder="New Dashboard Design"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editing.description}
                  onChange={e => setEditing({ ...editing, description: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500"
                />
              </div>

              {/* Target roles */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Roles</label>
                <div className="flex gap-2 flex-wrap">
                  {ROLES.map(role => (
                    <label key={role} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={editing.targetRoles.includes(role)}
                        onChange={e => {
                          const roles = e.target.checked
                            ? [...editing.targetRoles, role]
                            : editing.targetRoles.filter(r => r !== role);
                          setEditing({ ...editing, targetRoles: roles });
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-violet-600"
                      />
                      <span className="font-medium text-gray-700">{role}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Environments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Environments</label>
                <div className="flex gap-2">
                  {ENVIRONMENTS.map(env => (
                    <label key={env} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={editing.environments.includes(env)}
                        onChange={e => {
                          const envs = e.target.checked
                            ? [...editing.environments, env]
                            : editing.environments.filter(e => e !== env);
                          setEditing({ ...editing, environments: envs });
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-violet-600"
                      />
                      <span className="font-medium text-gray-700">{env}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => saveFlag(editing)}
                disabled={saving || !editing.key || !editing.label}
                className="px-5 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : 'Save Flag'}
              </button>
              <button
                onClick={() => setEditing(null)}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flag list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Flag</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rollout</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Environments</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Updated</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {flags.map(flag => (
              <tr key={flag.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-mono font-semibold text-violet-600">{flag.key}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{flag.label}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${flag.rollout === 100 ? 'bg-emerald-500' : 'bg-violet-500'}`}
                        style={{ width: `${flag.rollout}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 font-medium">{flag.rollout}%</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => toggleFlag(flag)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      flag.enabled
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {flag.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-1">
                    {flag.environments.map(e => (
                      <span key={e} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-md">{e}</span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-xs text-gray-500">{new Date(flag.updatedAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => setEditing(flag)}
                    className="text-xs font-medium text-violet-600 hover:text-violet-700"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
            {flags.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No feature flags configured</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}