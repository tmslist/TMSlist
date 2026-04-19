import { useState, useEffect, useCallback } from 'react';

interface LeaderboardEntry {
  entityId: string;
  entityName: string;
  entityType: string;
  score: number;
  rank: number;
  clinicId?: string;
  doctorId?: string;
}

interface Leaderboard {
  id: string;
  type: string;
  period: string;
  category: string;
  periodStart?: string;
  periodEnd?: string;
  entries: LeaderboardEntry[];
  createdAt: string;
  totalEntries?: number;
}

interface CustomLeaderboard {
  id: string;
  name: string;
  description: string;
  criteria: string;
  rankingMetric: string;
  entryEntityType: string;
  entityIds: string[];
  active: boolean;
  createdAt: string;
}

interface PointsRule {
  id: string;
  action: string;
  points: number;
  description: string;
  active: boolean;
}

const LEADERBOARD_TYPES = [
  { key: 'leads', label: 'Leads Generated', icon: 'users', description: 'Rank by number of leads received' },
  { key: 'rating', label: 'Highest Rating', icon: 'star', description: 'Rank by average patient rating' },
  { key: 'fast_responder', label: 'Fastest Response', icon: 'zap', description: 'Rank by response time to leads' },
  { key: 'reviews', label: 'Most Reviews', icon: 'message-circle', description: 'Rank by number of reviews' },
  { key: 'conversion', label: 'Best Conversion', icon: 'trending-up', description: 'Rank by lead-to-appointment conversion' },
];

const PERIODS = [
  { key: 'weekly', label: 'Weekly', description: 'Last 7 days' },
  { key: 'monthly', label: 'Monthly', description: 'Last 30 days' },
  { key: 'all_time', label: 'All Time', description: 'Since account creation' },
];

const ENTITY_TYPES = [
  { key: 'clinic', label: 'Clinics' },
  { key: 'doctor', label: 'Doctors' },
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

export default function AdminLeaderboards() {
  const [tab, setTab] = useState<'leaderboards' | 'custom' | 'points'>('leaderboards');
  const [leaderboards, setLeaderboards] = useState<Leaderboard[]>([]);
  const [customLeaderboards, setCustomLeaderboards] = useState<CustomLeaderboard[]>([]);
  const [pointsRules, setPointsRules] = useState<PointsRule[]>([]);
  const [clinics, setClinics] = useState<{ id: string; name: string }[]>([]);
  const [doctors, setDoctors] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedLeaderboard, setSelectedLeaderboard] = useState<Leaderboard | null>(null);

  // Generation form
  const [genType, setGenType] = useState('leads');
  const [genPeriod, setGenPeriod] = useState('monthly');

  // Custom leaderboard form
  const [customName, setCustomName] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customCriteria, setCustomCriteria] = useState('');
  const [customMetric, setCustomMetric] = useState('leads');
  const [customEntityType, setCustomEntityType] = useState('clinic');
  const [customEntityIds, setCustomEntityIds] = useState<string[]>([]);
  const [editingCustom, setEditingCustom] = useState<CustomLeaderboard | null>(null);

  // Points rule form
  const [pointsAction, setPointsAction] = useState('');
  const [pointsValue, setPointsValue] = useState('');
  const [pointsDesc, setPointsDesc] = useState('');
  const [editingPoints, setEditingPoints] = useState<PointsRule | null>(null);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/leaderboards');
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to fetch leaderboards');
      const json = await res.json();
      setLeaderboards(json.data || []);

      // Fetch custom leaderboards and points rules from additional endpoints
      const [customRes, pointsRes] = await Promise.allSettled([
        fetch('/api/admin/custom-leaderboards'),
        fetch('/api/admin/points-rules'),
      ]);

      if (customRes.status === 'fulfilled' && customRes.value.ok) {
        const data = await customRes.value.json();
        setCustomLeaderboards(data.data || []);
      }
      if (pointsRes.status === 'fulfilled' && pointsRes.value.ok) {
        const data = await pointsRes.value.json();
        setPointsRules(data.data || []);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEntities = useCallback(async () => {
    try {
      const [clinicsRes, doctorsRes] = await Promise.all([
        fetch('/api/admin/clinics?limit=500'),
        fetch('/api/admin/doctors?limit=500'),
      ]);
      if (clinicsRes.ok) { const j = await clinicsRes.json(); setClinics(j.data || []); }
      if (doctorsRes.ok) { const j = await doctorsRes.json(); setDoctors(j.data || []); }
    } catch {}
  }, []);

  useEffect(() => { fetchData(); fetchEntities(); }, [fetchData, fetchEntities]);

  async function generateLeaderboard() {
    setGenerating(true);
    try {
      const res = await fetch('/api/admin/leaderboards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: genType, period: genPeriod }),
      });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to generate leaderboard');
      const json = await res.json();
      showToast('success', `Leaderboard generated with ${json.data?.entries?.length || 0} entries`);
      fetchData();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  }

  function openCustomModal(lb?: CustomLeaderboard) {
    if (lb) {
      setEditingCustom(lb);
      setCustomName(lb.name);
      setCustomDesc(lb.description);
      setCustomCriteria(lb.criteria);
      setCustomMetric(lb.rankingMetric);
      setCustomEntityType(lb.entryEntityType);
      setCustomEntityIds(lb.entityIds || []);
    } else {
      setEditingCustom(null);
      setCustomName('');
      setCustomDesc('');
      setCustomCriteria('');
      setCustomMetric('leads');
      setCustomEntityType('clinic');
      setCustomEntityIds([]);
    }
    setShowModal(true);
  }

  async function saveCustomLeaderboard() {
    if (!customName) { showToast('error', 'Name is required'); return; }
    setSaving(true);
    try {
      const body = { name: customName, description: customDesc, criteria: customCriteria, rankingMetric: customMetric, entryEntityType: customEntityType, entityIds: customEntityIds, active: true };
      const url = editingCustom ? `/api/admin/custom-leaderboards?id=${editingCustom.id}` : '/api/admin/custom-leaderboards';
      const method = editingCustom ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok && res.status !== 404) throw new Error('Failed to save');
      showToast('success', `Custom leaderboard ${editingCustom ? 'updated' : 'created'}`);
      setShowModal(false);
      fetchData();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  function openPointsModal(rule?: PointsRule) {
    if (rule) {
      setEditingPoints(rule);
      setPointsAction(rule.action);
      setPointsValue(String(rule.points));
      setPointsDesc(rule.description);
    } else {
      setEditingPoints(null);
      setPointsAction('');
      setPointsValue('');
      setPointsDesc('');
    }
    setShowModal(true);
  }

  async function savePointsRule() {
    if (!pointsAction || !pointsValue) { showToast('error', 'Action and points are required'); return; }
    setSaving(true);
    try {
      const body = { action: pointsAction, points: Number(pointsValue), description: pointsDesc, active: true };
      const url = editingPoints ? `/api/admin/points-rules?id=${editingPoints.id}` : '/api/admin/points-rules';
      const method = editingPoints ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok && res.status !== 404) throw new Error('Failed to save');
      showToast('success', `Points rule ${editingPoints ? 'updated' : 'created'}`);
      setShowModal(false);
      fetchData();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(entity: CustomLeaderboard | PointsRule, setFn: Function, key: 'active') {
    try {
      const endpoint = 'active' in entity && 'rankingMetric' in entity ? 'custom-leaderboards' : 'points-rules';
      const res = await fetch(`/api/admin/${endpoint}?id=${entity.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...entity, [key]: !(entity as Record<string,unknown>)[key] }),
      });
      if (!res.ok && res.status !== 404) throw new Error('Failed to toggle');
      setToast({ type: 'success', message: 'Updated' });
      setTimeout(() => setToast(null), 2000);
      fetchData();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to toggle');
    }
  }

  async function deleteEntity(id: string, endpoint: string) {
    if (!confirm('Delete this item? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/admin/${endpoint}?id=${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 404) throw new Error('Failed to delete');
      showToast('success', 'Deleted');
      fetchData();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to delete');
    }
  }

  function toggleEntity(entityId: string) {
    if (customEntityIds.includes(entityId)) {
      setCustomEntityIds(customEntityIds.filter(id => id !== entityId));
    } else {
      setCustomEntityIds([...customEntityIds, entityId]);
    }
  }

  function getRankBadge(rank: number) {
    const classes = rank === 1 ? 'bg-yellow-400 text-yellow-900' : rank === 2 ? 'bg-gray-300 text-gray-800' : rank === 3 ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300';
    return classes;
  }

  const TABS = [
    { key: 'leaderboards' as const, label: 'Leaderboards' },
    { key: 'custom' as const, label: 'Custom Boards' },
    { key: 'points' as const, label: 'Points System' },
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
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Leaderboards</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Manage rankings, custom boards, and points</p>
        </div>
        <button onClick={fetchData} className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
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
          ) : tab === 'leaderboards' ? (
            <div className="space-y-6">
              {/* Generation Controls */}
              <div className="bg-gray-50 dark:bg-slate-900 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Generate New Leaderboard</h4>
                <div className="flex items-end gap-4 flex-wrap">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Type</label>
                    <select value={genType} onChange={e => setGenType(e.target.value)} className="rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-800">
                      {LEADERBOARD_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Period</label>
                    <select value={genPeriod} onChange={e => setGenPeriod(e.target.value)} className="rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-800">
                      {PERIODS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                    </select>
                  </div>
                  <button onClick={generateLeaderboard} disabled={generating} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                    {generating ? 'Generating...' : 'Generate'}
                  </button>
                </div>
              </div>

              {/* Leaderboard List */}
              <div className="space-y-4">
                {leaderboards.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-slate-400">No leaderboards yet. Generate one above.</div>
                ) : (
                  leaderboards.map(lb => (
                    <div key={lb.id} className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
                      <button
                        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-slate-900 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                        onClick={() => setSelectedLeaderboard(selectedLeaderboard?.id === lb.id ? null : lb)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{LEADERBOARD_TYPES.find(t => t.key === lb.type)?.label || lb.type}</span>
                          <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-medium rounded capitalize">{lb.period}</span>
                          <span className="text-xs text-gray-500 dark:text-slate-400">{lb.totalEntries || 0} entries</span>
                        </div>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${selectedLeaderboard?.id === lb.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {selectedLeaderboard?.id === lb.id && lb.entries && lb.entries.length > 0 && (
                        <div className="p-4">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left">
                              <thead>
                                <tr className="border-b border-gray-200 dark:border-slate-700">
                                  <th className="pb-2 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Rank</th>
                                  <th className="pb-2 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Name</th>
                                  <th className="pb-2 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Type</th>
                                  <th className="pb-2 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Score</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                {lb.entries.slice(0, 20).map(entry => (
                                  <tr key={entry.entityId} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                    <td className="py-2 pr-3">
                                      <span className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${getRankBadge(entry.rank)}`}>
                                        {entry.rank}
                                      </span>
                                    </td>
                                    <td className="py-2 text-sm font-medium text-gray-900 dark:text-white">{entry.entityName}</td>
                                    <td className="py-2 text-xs text-gray-500 dark:text-slate-400 capitalize">{entry.entityType}</td>
                                    <td className="py-2 text-sm text-gray-600 dark:text-slate-300">{entry.score.toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {lb.entries.length > 20 && (
                            <p className="text-xs text-gray-400 dark:text-slate-500 mt-2 text-center">Showing top 20 of {lb.entries.length} entries</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : tab === 'custom' ? (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => openCustomModal()} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  New Custom Board
                </button>
              </div>

              {customLeaderboards.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-slate-400">No custom leaderboards. Create one to track specific criteria.</div>
              ) : (
                <div className="space-y-3">
                  {customLeaderboards.map(lb => (
                    <div key={lb.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-slate-700 rounded-xl">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{lb.name}</h4>
                          <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${lb.active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                            {lb.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{lb.description}</p>
                        <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">{lb.entityIds?.length || 0} entities - {lb.rankingMetric}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => openCustomModal(lb)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => deleteEntity(lb.id, 'custom-leaderboards')} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : tab === 'points' ? (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => openPointsModal()} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add Rule
                </button>
              </div>

              {pointsRules.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-slate-400">No points rules configured. Add rules to define the scoring system.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Action</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Points</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Description</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Status</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                      {pointsRules.map(rule => (
                        <tr key={rule.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                          <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">{rule.action}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-sm font-bold rounded">
                              +{rule.points}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-400">{rule.description}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${rule.active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                              {rule.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button onClick={() => openPointsModal(rule)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              </button>
                              <button onClick={() => deleteEntity(rule.id, 'points-rules')} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600">
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
          ) : null}
        </div>
      </div>

      {/* Custom Leaderboard Modal */}
      <Modal open={showModal && tab !== 'points'} onClose={() => setShowModal(false)} title={editingCustom ? 'Edit Custom Board' : 'New Custom Board'}>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Board Name *</label>
            <input type="text" value={customName} onChange={e => setCustomName(e.target.value)} placeholder="Top TMS Clinics 2024" className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Description</label>
            <input type="text" value={customDesc} onChange={e => setCustomDesc(e.target.value)} placeholder="Custom leaderboard for..." className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Ranking Metric</label>
              <select value={customMetric} onChange={e => setCustomMetric(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900">
                <option value="leads">Leads</option>
                <option value="rating">Rating</option>
                <option value="reviews">Reviews</option>
                <option value="conversion">Conversion Rate</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Entity Type</label>
              <select value={customEntityType} onChange={e => setCustomEntityType(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900">
                {ENTITY_TYPES.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Criteria (optional)</label>
            <input type="text" value={customCriteria} onChange={e => setCustomCriteria(e.target.value)} placeholder="e.g. Region = Northeast" className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Include Entities</label>
            <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-slate-600 rounded-lg p-2 space-y-1">
              {(customEntityType === 'clinic' ? clinics : doctors).map(e => (
                <label key={e.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer">
                  <input type="checkbox" checked={customEntityIds.includes(e.id)} onChange={() => toggleEntity(e.id)} className="rounded text-indigo-600" />
                  <span className="text-sm text-gray-700 dark:text-slate-300">{e.name}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{customEntityIds.length} selected (leave empty for all)</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700">Cancel</button>
            <button onClick={saveCustomLeaderboard} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Saving...' : editingCustom ? 'Update' : 'Create'}</button>
          </div>
        </div>
      </Modal>

      {/* Points Rule Modal */}
      <Modal open={showModal && tab === 'points'} onClose={() => setShowModal(false)} title={editingPoints ? 'Edit Points Rule' : 'New Points Rule'}>
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Action Key *</label>
              <input type="text" value={pointsAction} onChange={e => setPointsAction(e.target.value)} placeholder="lead_received" className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Points *</label>
              <input type="number" value={pointsValue} onChange={e => setPointsValue(e.target.value)} placeholder="10" className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Description</label>
            <input type="text" value={pointsDesc} onChange={e => setPointsDesc(e.target.value)} placeholder="Points awarded when..." className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700">Cancel</button>
            <button onClick={savePointsRule} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Saving...' : editingPoints ? 'Update' : 'Create'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
