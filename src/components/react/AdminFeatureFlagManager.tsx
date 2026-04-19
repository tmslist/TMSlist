import { useState, useCallback } from 'react';

interface FeatureFlag {
  id: string;
  key: string;
  description?: string;
  enabled: boolean;
  rolloutPercentage: number;
  environments: string[];
  targetingRules?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Environment {
  key: 'development' | 'staging' | 'production';
  label: string;
  color: string;
}

const ENVIRONMENTS: Environment[] = [
  { key: 'development', label: 'Development', color: 'bg-gray-100 text-gray-700' },
  { key: 'staging', label: 'Staging', color: 'bg-amber-100 text-amber-700' },
  { key: 'production', label: 'Production', color: 'bg-emerald-100 text-emerald-700' },
];

const SEGMENTS = ['all_users', 'admin_users', 'beta_testers', 'new_users', 'premium_users'];

export default function AdminFeatureFlagManager() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<FeatureFlag | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const fetchFlags = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/feature-flags');
      if (res.ok) {
        const data = await res.json();
        setFlags(data.flags || data || []);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  const [initialized, setInitialized] = useState(false);
  if (!initialized) {
    fetchFlags().then(() => setInitialized(true));
  }

  // Mock flags
  const mockFlags: FeatureFlag[] = [
    { id: 'f1', key: 'new_dashboard_v2', description: 'Redesigned dashboard layout for all users', enabled: true, rolloutPercentage: 100, environments: ['production', 'staging'], targetingRules: 'all_users', status: 'stable', createdAt: '2026-03-01', updatedAt: '2026-04-10' },
    { id: 'f2', key: 'ai_search_suggestions', description: 'AI-powered search suggestions in header', enabled: true, rolloutPercentage: 25, environments: ['production'], targetingRules: 'beta_testers', status: 'beta', createdAt: '2026-03-15', updatedAt: '2026-04-15' },
    { id: 'f3', key: 'ml_recommendations', description: 'ML-based clinic recommendations on homepage', enabled: true, rolloutPercentage: 50, environments: ['staging'], targetingRules: 'new_users', status: 'testing', createdAt: '2026-03-20', updatedAt: '2026-04-18' },
    { id: 'f4', key: 'dark_mode_ui', description: 'Dark mode theme option', enabled: false, rolloutPercentage: 0, environments: ['development'], targetingRules: '', status: 'draft', createdAt: '2026-04-01', updatedAt: '2026-04-01' },
    { id: 'f5', key: 'forum_badges_system', description: 'Gamification badges for forum contributions', enabled: true, rolloutPercentage: 75, environments: ['production'], targetingRules: 'all_users', status: 'stable', createdAt: '2026-02-15', updatedAt: '2026-04-12' },
    { id: 'f6', key: 'advanced_analytics', description: 'Premium analytics dashboard features', enabled: false, rolloutPercentage: 0, environments: ['staging'], targetingRules: 'premium_users', status: 'draft', createdAt: '2026-04-05', updatedAt: '2026-04-05' },
  ];

  const allFlags = flags.length > 0 ? flags : mockFlags;
  const filteredFlags = allFlags.filter(f =>
    f.key.toLowerCase().includes(search.toLowerCase()) ||
    (f.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = useCallback(async (flag: FeatureFlag) => {
    setFlags(prev => prev.map(f => f.id === flag.id ? { ...f, enabled: !f.enabled } : f));
    try {
      await fetch(`/api/admin/feature-flags/${flag.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !flag.enabled }),
      });
    } catch { /* silent */ }
  }, []);

  const handleRollout = useCallback(async (flag: FeatureFlag, pct: number) => {
    setFlags(prev => prev.map(f => f.id === flag.id ? { ...f, rolloutPercentage: pct } : f));
    try {
      await fetch(`/api/admin/feature-flags/${flag.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rolloutPercentage: pct }),
      });
    } catch { /* silent */ }
  }, []);

  function addNew() {
    setEditing({
      id: `new-${Date.now()}`,
      key: '',
      description: '',
      enabled: false,
      rolloutPercentage: 100,
      environments: ['production'],
      targetingRules: '',
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

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
        return idx >= 0 ? prev.map(f => f.id === flag.id ? { ...flag, updatedAt: new Date().toISOString() } : f) : [...prev, flag];
      });
      setEditing(null);
    } catch { /* silent */ }
    setSaving(false);
  }

  const STATUS_COLORS: Record<string, string> = {
    stable: 'bg-emerald-100 text-emerald-700',
    beta: 'bg-blue-100 text-blue-700',
    testing: 'bg-amber-100 text-amber-700',
    draft: 'bg-gray-100 text-gray-500',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Feature Flags</h1>
          <p className="text-gray-500 mt-1">Control feature rollouts across environments and user segments</p>
        </div>
        <button
          onClick={addNew}
          className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors"
        >
          + New Flag
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search flags..."
          className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500"
        />
      </div>

      {/* Flag list */}
      <div className="space-y-4">
        {filteredFlags.map(flag => (
          <div key={flag.id} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono font-bold text-gray-900">{flag.key}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[flag.status] || STATUS_COLORS.draft}`}>
                    {flag.status}
                  </span>
                  <button
                    onClick={() => handleToggle(flag)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      flag.enabled ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {flag.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
                {flag.description && (
                  <p className="text-sm text-gray-500 mt-1">{flag.description}</p>
                )}
                {/* Environments */}
                <div className="flex items-center gap-2 mt-3">
                  {ENVIRONMENTS.map(env => (
                    <span
                      key={env.key}
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${env.color}`}
                    >
                      {env.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Rollout slider */}
              <div className="flex items-center gap-4 ml-6">
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">{flag.rolloutPercentage}%</div>
                  <div className="text-[11px] text-gray-400">rollout</div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={flag.rolloutPercentage}
                  onChange={e => handleRollout(flag, parseInt(e.target.value))}
                  className="w-28 accent-violet-600"
                />
                <button
                  onClick={() => setEditing(flag)}
                  className="text-xs text-violet-600 hover:text-violet-700 font-medium"
                >
                  Edit
                </button>
              </div>
            </div>

            {/* Targeting rules */}
            {flag.targetingRules && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                <span className="text-xs text-gray-500">Targeting: <span className="font-medium text-gray-700">{flag.targetingRules}</span></span>
              </div>
            )}

            {/* Timestamps */}
            <div className="flex items-center gap-4 mt-3 text-[11px] text-gray-400">
              <span>Created: {new Date(flag.createdAt).toLocaleDateString()}</span>
              <span>Updated: {new Date(flag.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
        {filteredFlags.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200">
            No feature flags found
          </div>
        )}
      </div>

      {/* Editor modal */}
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
                    placeholder="new_feature_v2"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-mono focus:border-violet-500 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editing.status}
                    onChange={e => setEditing({ ...editing, status: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="testing">Testing</option>
                    <option value="beta">Beta</option>
                    <option value="stable">Stable</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editing.description || ''}
                  onChange={e => setEditing({ ...editing, description: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Environments</label>
                <div className="flex gap-2">
                  {ENVIRONMENTS.map(env => (
                    <label key={env.key} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={editing.environments.includes(env.key)}
                        onChange={e => {
                          const envs = e.target.checked ? [...editing.environments, env.key] : editing.environments.filter(e => e !== env.key);
                          setEditing({ ...editing, environments: envs as typeof editing.environments });
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-violet-600"
                      />
                      <span className="font-medium text-gray-700">{env.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rollout Percentage</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={editing.rolloutPercentage}
                    onChange={e => setEditing({ ...editing, rolloutPercentage: parseInt(e.target.value) })}
                    className="flex-1 accent-violet-600"
                  />
                  <span className="text-sm font-bold text-gray-900 w-12 text-right">{editing.rolloutPercentage}%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">User Segment</label>
                <select
                  value={editing.targetingRules || ''}
                  onChange={e => setEditing({ ...editing, targetingRules: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500"
                >
                  <option value="">All users</option>
                  {SEGMENTS.filter(s => s !== 'all_users').map(s => (
                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => saveFlag(editing)}
                disabled={saving || !editing.key}
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
    </div>
  );
}