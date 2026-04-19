import { useState, useEffect, useCallback } from 'react';

interface AchievementTemplate {
  id: string;
  key: string;
  name: string;
  description: string;
  category: 'milestone' | 'streak' | 'social' | 'exploration' | 'special';
  icon: string;
  emoji: string;
  color: string;
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  unlockCriteria: UnlockCriteria;
  active: boolean;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  createdAt: string;
}

interface UnlockCriteria {
  type: 'automatic' | 'manual';
  metric?: string;
  threshold?: number;
  timeWindow?: string;
  prerequisiteKeys?: string[];
  description: string;
}

interface AchievementUnlock {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  achievementKey: string;
  achievementName: string;
  unlockedAt: string;
  triggeredBy?: string;
}

interface AchievementStats {
  totalUnlocks: number;
  uniqueUsers: number;
  byCategory: Record<string, number>;
  byTier: Record<string, number>;
}

const DEFAULT_ACHIEVEMENTS: AchievementTemplate[] = [
  {
    id: 'first-pulse',
    key: 'first-pulse',
    name: 'First Pulse',
    description: 'Fired your first TMS pulse in the simulator',
    category: 'milestone',
    icon: 'zap',
    emoji: '\u26A1',
    color: '#f59e0b',
    points: 10,
    tier: 'bronze',
    unlockCriteria: { type: 'automatic', metric: 'pulse_count', threshold: 1, description: 'Fire your first pulse' },
    active: true,
    rarity: 'common',
    createdAt: '',
  },
  {
    id: 'hundred-pulses',
    key: 'hundred-pulses',
    name: '100 Pulses',
    description: 'Fired 100 pulses in a single session',
    category: 'milestone',
    icon: 'activity',
    emoji: '\u2694',
    color: '#3b82f6',
    points: 50,
    tier: 'bronze',
    unlockCriteria: { type: 'automatic', metric: 'session_pulses', threshold: 100, description: 'Reach 100 pulses in one session' },
    active: true,
    rarity: 'uncommon',
    createdAt: '',
  },
  {
    id: 'thousand-pulses',
    key: 'thousand-pulses',
    name: '1,000 Pulses',
    description: 'Reached 1,000 pulses \u2014 therapeutic dose territory',
    category: 'milestone',
    icon: 'target',
    emoji: '\u269B',
    color: '#f97316',
    points: 200,
    tier: 'silver',
    unlockCriteria: { type: 'automatic', metric: 'total_pulses', threshold: 1000, description: 'Reach 1,000 total pulses' },
    active: true,
    rarity: 'rare',
    createdAt: '',
  },
  {
    id: 'all-protocols',
    key: 'all-protocols',
    name: 'Protocol Explorer',
    description: 'Tested all 6 clinical protocols',
    category: 'exploration',
    icon: 'compass',
    emoji: '\u2693',
    color: '#8b5cf6',
    points: 100,
    tier: 'silver',
    unlockCriteria: { type: 'automatic', metric: 'protocols_used', threshold: 6, description: 'Use all 6 protocols' },
    active: true,
    rarity: 'rare',
    createdAt: '',
  },
  {
    id: 'deep-tms',
    key: 'deep-tms',
    name: 'Deep Reach',
    description: 'Activated the Deep TMS protocol',
    category: 'exploration',
    icon: 'brain',
    emoji: '\u{1F9E0}',
    color: '#ec4899',
    points: 30,
    tier: 'bronze',
    unlockCriteria: { type: 'automatic', metric: 'protocol_used', threshold: 1, description: 'Use Deep TMS protocol' },
    active: true,
    rarity: 'common',
    createdAt: '',
  },
  {
    id: 'theta-master',
    key: 'theta-master',
    name: 'Theta Master',
    description: 'Completed a full iTBS burst train',
    category: 'milestone',
    icon: 'zap',
    emoji: '\u26A1',
    color: '#14b8a6',
    points: 75,
    tier: 'silver',
    unlockCriteria: { type: 'automatic', metric: 'itbs_completed', threshold: 1, description: 'Complete an iTBS session' },
    active: true,
    rarity: 'uncommon',
    createdAt: '',
  },
  {
    id: 'navigator',
    key: 'navigator',
    name: 'Navigator',
    description: 'Moved the coil to 5 different brain regions',
    category: 'exploration',
    icon: 'map',
    emoji: '\u{1F30D}',
    color: '#84cc16',
    points: 40,
    tier: 'bronze',
    unlockCriteria: { type: 'automatic', metric: 'regions_visited', threshold: 5, description: 'Explore 5 brain regions' },
    active: true,
    rarity: 'uncommon',
    createdAt: '',
  },
  {
    id: 'motor-cortex',
    key: 'motor-cortex',
    name: 'Motor Mapping',
    description: 'Targeted the motor cortex region',
    category: 'exploration',
    icon: 'target',
    emoji: '\u{1F3AF}',
    color: '#06b6d4',
    points: 25,
    tier: 'bronze',
    unlockCriteria: { type: 'automatic', metric: 'motor_targeted', threshold: 1, description: 'Target the motor cortex' },
    active: true,
    rarity: 'common',
    createdAt: '',
  },
];

const CATEGORIES = [
  { key: 'milestone' as const, label: 'Milestone', description: 'Reaching numerical goals' },
  { key: 'streak' as const, label: 'Streak', description: 'Consistent engagement' },
  { key: 'social' as const, label: 'Social', description: 'Community interactions' },
  { key: 'exploration' as const, label: 'Exploration', description: 'Discovering features' },
  { key: 'special' as const, label: 'Special', description: 'Limited time events' },
];

const TIERS = [
  { key: 'bronze' as const, label: 'Bronze', color: '#cd7f32' },
  { key: 'silver' as const, label: 'Silver', color: '#c0c0c0' },
  { key: 'gold' as const, label: 'Gold', color: '#ffd700' },
  { key: 'platinum' as const, label: 'Platinum', color: '#e5e4e2' },
];

const RARITIES = [
  { key: 'common' as const, label: 'Common', color: '#9ca3af' },
  { key: 'uncommon' as const, label: 'Uncommon', color: '#22c55e' },
  { key: 'rare' as const, label: 'Rare', color: '#3b82f6' },
  { key: 'epic' as const, label: 'Epic', color: '#a855f7' },
  { key: 'legendary' as const, label: 'Legendary', color: '#f59e0b' },
];

const METRIC_OPTIONS = [
  { value: 'pulse_count', label: 'Pulse Count' },
  { value: 'session_pulses', label: 'Session Pulses' },
  { value: 'total_pulses', label: 'Total Pulses' },
  { value: 'protocol_used', label: 'Protocol Used' },
  { value: 'protocols_used', label: 'Protocols Used Count' },
  { value: 'regions_visited', label: 'Regions Visited' },
  { value: 'motor_targeted', label: 'Motor Targeted' },
  { value: 'itbs_completed', label: 'iTBS Completed' },
  { value: 'sessions_completed', label: 'Sessions Completed' },
  { value: 'time_spent', label: 'Time Spent (minutes)' },
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

function AchievementCard({ achievement, onEdit, onToggle, onDelete }: {
  achievement: AchievementTemplate;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const tier = TIERS.find(t => t.key === achievement.tier);
  const rarity = RARITIES.find(r => r.key === achievement.rarity);

  return (
    <div className={`p-4 border rounded-xl transition-colors ${achievement.active ? 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800' : 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 opacity-60'}`}>
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: achievement.color + '20' }}>
          {achievement.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{achievement.name}</h4>
            {tier && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded" style={{ backgroundColor: tier.color + '20', color: tier.color }}>
                {tier.label}
              </span>
            )}
            {rarity && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded capitalize" style={{ backgroundColor: rarity.color + '20', color: rarity.color }}>
                {rarity.label}
              </span>
            )}
            <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 capitalize">
              {achievement.category}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{achievement.description}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[10px] text-gray-400 dark:text-slate-500">{achievement.points} pts</span>
            <span className={`text-[10px] font-medium ${achievement.unlockCriteria.type === 'automatic' ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {achievement.unlockCriteria.type === 'automatic' ? 'Auto-unlock' : 'Manual'}
            </span>
            <span className="text-[10px] text-gray-400 dark:text-slate-500 truncate">{achievement.unlockCriteria.description}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400" title={achievement.active ? 'Deactivate' : 'Activate'}>
            {achievement.active ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            )}
          </button>
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminAchievements() {
  const [tab, setTab] = useState<'templates' | 'unlocks' | 'stats'>('templates');
  const [templates, setTemplates] = useState<AchievementTemplate[]>([]);
  const [unlocks, setUnlocks] = useState<AchievementUnlock[]>([]);
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterTier, setFilterTier] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<AchievementTemplate | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formKey, setFormKey] = useState('');
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<AchievementTemplate['category']>('milestone');
  const [formEmoji, setFormEmoji] = useState('\u269B');
  const [formColor, setFormColor] = useState('#6366f1');
  const [formPoints, setFormPoints] = useState('10');
  const [formTier, setFormTier] = useState<AchievementTemplate['tier']>('bronze');
  const [formRarity, setFormRarity] = useState<AchievementTemplate['rarity']>('common');
  const [formCriteriaType, setFormCriteriaType] = useState<'automatic' | 'manual'>('automatic');
  const [formMetric, setFormMetric] = useState('');
  const [formThreshold, setFormThreshold] = useState('');
  const [formCriteriaDesc, setFormCriteriaDesc] = useState('');

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/achievements');
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to fetch achievements');

      const json = await res.json();
      setTemplates(json.templates || DEFAULT_ACHIEVEMENTS);
      setUnlocks(json.unlocks || []);
      setStats(json.stats || null);
    } catch {
      setTemplates(DEFAULT_ACHIEVEMENTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function openModal(ach?: AchievementTemplate) {
    if (ach) {
      setEditingAchievement(ach);
      setFormKey(ach.key);
      setFormName(ach.name);
      setFormDescription(ach.description);
      setFormCategory(ach.category);
      setFormEmoji(ach.emoji);
      setFormColor(ach.color);
      setFormPoints(String(ach.points));
      setFormTier(ach.tier);
      setFormRarity(ach.rarity);
      setFormCriteriaType(ach.unlockCriteria.type);
      setFormMetric(ach.unlockCriteria.metric || '');
      setFormThreshold(ach.unlockCriteria.threshold ? String(ach.unlockCriteria.threshold) : '');
      setFormCriteriaDesc(ach.unlockCriteria.description || '');
    } else {
      setEditingAchievement(null);
      setFormKey('');
      setFormName('');
      setFormDescription('');
      setFormCategory('milestone');
      setFormEmoji('\u269B');
      setFormColor('#6366f1');
      setFormPoints('10');
      setFormTier('bronze');
      setFormRarity('common');
      setFormCriteriaType('automatic');
      setFormMetric('');
      setFormThreshold('');
      setFormCriteriaDesc('');
    }
    setShowModal(true);
  }

  async function handleSave() {
    if (!formKey || !formName) { showToast('error', 'Key and name are required'); return; }
    if (!editingAchievement && templates.some(t => t.key === formKey)) { showToast('error', 'Achievement key already exists'); return; }

    setSaving(true);
    try {
      const body = {
        key: formKey,
        name: formName,
        description: formDescription,
        category: formCategory,
        emoji: formEmoji,
        color: formColor,
        points: Number(formPoints),
        tier: formTier,
        rarity: formRarity,
        unlockCriteria: {
          type: formCriteriaType,
          metric: formCriteriaType === 'automatic' ? formMetric : undefined,
          threshold: formCriteriaType === 'automatic' && formThreshold ? Number(formThreshold) : undefined,
          description: formCriteriaDesc || `Reach ${formThreshold} ${formMetric}`,
        },
        active: true,
      };

      const url = editingAchievement ? `/api/admin/achievements?id=${editingAchievement.id}` : '/api/admin/achievements';
      const method = editingAchievement ? 'PUT' : 'POST';

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok && res.status !== 404) throw new Error('Failed to save achievement');

      showToast('success', `Achievement ${editingAchievement ? 'updated' : 'created'}`);
      setShowModal(false);
      fetchData();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(ach: AchievementTemplate) {
    try {
      const res = await fetch(`/api/admin/achievements?id=${ach.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...ach, active: !ach.active }),
      });
      if (!res.ok && res.status !== 404) throw new Error('Failed to toggle');
      setTemplates(templates.map(t => t.id === ach.id ? { ...t, active: !t.active } : t));
      showToast('success', `Achievement ${ach.active ? 'deactivated' : 'activated'}`);
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to toggle');
    }
  }

  async function handleDelete(ach: AchievementTemplate) {
    if (!confirm(`Delete "${ach.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/achievements?id=${ach.id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 404) throw new Error('Failed to delete');
      setTemplates(templates.filter(t => t.id !== ach.id));
      showToast('success', 'Achievement deleted');
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to delete');
    }
  }

  const filteredTemplates = templates.filter(t => {
    if (filterCategory && t.category !== filterCategory) return false;
    if (filterTier && t.tier !== filterTier) return false;
    return true;
  });

  const colorPresets = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#14b6d4', '#f97316', '#84cc16'];

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
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Achievements</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{templates.length} templates, {unlocks.length} total unlocks</p>
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
            {[
              { key: 'templates' as const, label: 'Templates' },
              { key: 'unlocks' as const, label: 'Unlocks' },
              { key: 'stats' as const, label: 'Statistics' },
            ].map(t => (
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
          ) : tab === 'templates' ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-1.5 text-sm bg-white dark:bg-slate-900">
                    <option value="">All Categories</option>
                    {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                  <select value={filterTier} onChange={e => setFilterTier(e.target.value)} className="rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-1.5 text-sm bg-white dark:bg-slate-900">
                    <option value="">All Tiers</option>
                    {TIERS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                  </select>
                </div>
                <button onClick={() => openModal()} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add Achievement
                </button>
              </div>

              {filteredTemplates.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-slate-400">No achievements match your filters.</div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredTemplates.map(ach => (
                    <AchievementCard
                      key={ach.id}
                      achievement={ach}
                      onEdit={() => openModal(ach)}
                      onToggle={() => handleToggle(ach)}
                      onDelete={() => handleDelete(ach)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : tab === 'unlocks' ? (
            <div>
              {unlocks.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-slate-400">No achievements unlocked yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">User</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Achievement</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Unlocked</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Trigger</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                      {unlocks.map(unlock => (
                        <tr key={unlock.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{unlock.userName}</p>
                              {unlock.userEmail && <p className="text-xs text-gray-500 dark:text-slate-400">{unlock.userEmail}</p>}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-medium rounded">
                              {unlock.achievementName}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-400">
                            {new Date(unlock.unlockedAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-400">{unlock.triggeredBy || 'System'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : tab === 'stats' ? (
            <div className="space-y-6">
              {stats ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.totalUnlocks}</p>
                      <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-1">Total Unlocks</p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.uniqueUsers}</p>
                      <p className="text-xs text-emerald-500 dark:text-emerald-400 mt-1">Unique Users</p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{templates.filter(t => t.active).length}</p>
                      <p className="text-xs text-amber-500 dark:text-amber-400 mt-1">Active Achievements</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{templates.filter(t => t.rarity === 'legendary' || t.rarity === 'epic').length}</p>
                      <p className="text-xs text-purple-500 dark:text-purple-400 mt-1">Epic / Legendary</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-gray-200 dark:border-slate-700 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">By Category</h4>
                      <div className="space-y-2">
                        {CATEGORIES.map(cat => {
                          const count = stats.byCategory?.[cat.key] || 0;
                          const total = stats.totalUnlocks || 1;
                          return (
                            <div key={cat.key}>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-600 dark:text-slate-400">{cat.label}</span>
                                <span className="text-gray-500 dark:text-slate-500">{count} ({total > 0 ? Math.round(count / total * 100) : 0}%)</span>
                              </div>
                              <div className="h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${total > 0 ? (count / total * 100) : 0}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="border border-gray-200 dark:border-slate-700 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">By Tier</h4>
                      <div className="space-y-2">
                        {TIERS.map(tier => {
                          const count = stats.byTier?.[tier.key] || 0;
                          const total = stats.totalUnlocks || 1;
                          return (
                            <div key={tier.key}>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-600 dark:text-slate-400" style={{ color: tier.color }}>{tier.label}</span>
                                <span className="text-gray-500 dark:text-slate-500">{count}</span>
                              </div>
                              <div className="h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${total > 0 ? (count / total * 100) : 0}%`, backgroundColor: tier.color }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-slate-400">
                  Statistics will appear here as achievements are unlocked.
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Achievement Editor Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingAchievement ? 'Edit Achievement' : 'New Achievement'}>
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Key *</label>
              <input
                type="text"
                value={formKey}
                onChange={e => setFormKey(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                placeholder="my-achievement"
                disabled={!!editingAchievement}
                className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Name *</label>
              <input type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="My Achievement" className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Description</label>
            <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} rows={2} placeholder="What does this achievement celebrate?" className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Category</label>
              <select value={formCategory} onChange={e => setFormCategory(e.target.value as AchievementTemplate['category'])} className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900">
                {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Tier</label>
              <select value={formTier} onChange={e => setFormTier(e.target.value as AchievementTemplate['tier'])} className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900">
                {TIERS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Rarity</label>
              <select value={formRarity} onChange={e => setFormRarity(e.target.value as AchievementTemplate['rarity'])} className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900">
                {RARITIES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Emoji</label>
              <input type="text" value={formEmoji} onChange={e => setFormEmoji(e.target.value)} placeholder="\u269B" className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900 text-center text-2xl" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Points</label>
              <input type="number" value={formPoints} onChange={e => setFormPoints(e.target.value)} placeholder="10" className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={formColor} onChange={e => setFormColor(e.target.value)} className="w-12 h-10 rounded border border-gray-300 dark:border-slate-600 cursor-pointer" />
              <input type="text" value={formColor} onChange={e => setFormColor(e.target.value)} className="flex-1 rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm font-mono bg-white dark:bg-slate-900" />
              <div className="flex gap-1">
                {colorPresets.map(c => (
                  <button key={c} type="button" onClick={() => setFormColor(c)} className="w-6 h-6 rounded border border-gray-200 dark:border-slate-600 hover:scale-110 transition-transform" style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Unlock Criteria</label>
            <div className="flex gap-4 mb-3">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300">
                <input type="radio" checked={formCriteriaType === 'automatic'} onChange={() => setFormCriteriaType('automatic')} className="text-indigo-600" />
                Automatic
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300">
                <input type="radio" checked={formCriteriaType === 'manual'} onChange={() => setFormCriteriaType('manual')} className="text-indigo-600" />
                Manual (admin grants)
              </label>
            </div>

            {formCriteriaType === 'automatic' && (
              <div className="space-y-3 p-3 bg-gray-50 dark:bg-slate-900 rounded-lg">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Metric</label>
                    <select value={formMetric} onChange={e => setFormMetric(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-1.5 text-sm bg-white dark:bg-slate-800">
                      <option value="">Select...</option>
                      {METRIC_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Threshold</label>
                    <input type="number" value={formThreshold} onChange={e => setFormThreshold(e.target.value)} placeholder="e.g. 100" className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-1.5 text-sm bg-white dark:bg-slate-800" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Description</label>
                  <input type="text" value={formCriteriaDesc} onChange={e => setFormCriteriaDesc(e.target.value)} placeholder="Reach 100 pulses in a session" className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-1.5 text-sm bg-white dark:bg-slate-800" />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Saving...' : editingAchievement ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
