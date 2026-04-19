import { useState, useEffect, useCallback } from 'react';

interface BadgeTemplate {
  id: string;
  type: 'clinic' | 'doctor';
  key: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  criteria: BadgeCriteria;
  active: boolean;
  createdAt: string;
}

interface BadgeCriteria {
  type: 'automatic' | 'manual';
  metric?: string;
  threshold?: number;
  description?: string;
}

interface AwardRecord {
  id: string;
  entityId: string;
  entityName: string;
  badgeKey: string;
  badgeName: string;
  awardedAt: string;
  awardedBy?: string;
}

const DEFAULT_CLINIC_TEMPLATES: BadgeTemplate[] = [
  { id: 'early_adopter', type: 'clinic', key: 'early_adopter', name: 'Early Adopter', description: 'Joined TMS List in the first year', icon: 'star', color: '#f59e0b', criteria: { type: 'manual' }, active: true, createdAt: '' },
  { id: 'top_rated', type: 'clinic', key: 'top_rated', name: 'Top Rated', description: 'Maintained 4.8+ rating for 6 months', icon: 'shield', color: '#10b981', criteria: { type: 'automatic', metric: 'avg_rating', threshold: 4.8, description: 'Average rating >= 4.8' }, active: true, createdAt: '' },
  { id: 'fast_responder', type: 'clinic', key: 'fast_responder', name: 'Fast Responder', description: 'Responds to leads within 2 hours on average', icon: 'bolt', color: '#6366f1', criteria: { type: 'automatic', metric: 'response_time', threshold: 120, description: 'Avg response time < 2 hours' }, active: true, createdAt: '' },
  { id: '100_reviews', type: 'clinic', key: '100_reviews', name: '100 Reviews', description: 'Received 100 or more patient reviews', icon: 'chat', color: '#ec4899', criteria: { type: 'automatic', metric: 'review_count', threshold: 100, description: 'Review count >= 100' }, active: true, createdAt: '' },
  { id: 'champion', type: 'clinic', key: 'champion', name: 'Champion', description: 'Top performer in monthly leaderboard', icon: 'trophy', color: '#f59e0b', criteria: { type: 'automatic', metric: 'leads', threshold: 1, description: 'Rank #1 in monthly leaderboard' }, active: true, createdAt: '' },
];

const DEFAULT_DOCTOR_TEMPLATES: BadgeTemplate[] = [
  { id: 'npi_verified', type: 'doctor', key: 'npi_verified', name: 'NPI Verified', description: 'Doctor NPI number has been verified', icon: 'check-circle', color: '#10b981', criteria: { type: 'manual' }, active: true, createdAt: '' },
  { id: '100_plus_sessions', type: 'doctor', key: '100_plus_sessions', name: '100+ Sessions', description: 'Completed 100 or more TMS sessions', icon: 'activity', color: '#3b82f6', criteria: { type: 'automatic', metric: 'session_count', threshold: 100, description: 'Session count >= 100' }, active: true, createdAt: '' },
  { id: 'rising_star', type: 'doctor', key: 'rising_star', name: 'Rising Star', description: 'New doctor with excellent patient ratings', icon: 'trending-up', color: '#8b5cf6', criteria: { type: 'automatic', metric: 'avg_rating', threshold: 4.9, description: 'Rating >= 4.9 with 10+ reviews' }, active: true, createdAt: '' },
  { id: 'patients_choice', type: 'doctor', key: 'patients_choice', name: "Patient's Choice", description: 'Most selected doctor by patients', icon: 'heart', color: '#ef4444', criteria: { type: 'automatic', metric: 'selection_count', threshold: 50, description: 'Selected by 50+ patients' }, active: true, createdAt: '' },
  { id: 'top_contributor', type: 'doctor', key: 'top_contributor', name: 'Top Contributor', description: 'Contributes educational content regularly', icon: 'award', color: '#f59e0b', criteria: { type: 'manual' }, active: true, createdAt: '' },
];

const ICON_OPTIONS = [
  { key: 'star', label: 'Star' },
  { key: 'shield', label: 'Shield' },
  { key: 'bolt', label: 'Bolt' },
  { key: 'chat', label: 'Chat' },
  { key: 'trophy', label: 'Trophy' },
  { key: 'check-circle', label: 'Check' },
  { key: 'activity', label: 'Activity' },
  { key: 'trending-up', label: 'Trending' },
  { key: 'heart', label: 'Heart' },
  { key: 'award', label: 'Award' },
  { key: 'zap', label: 'Zap' },
  { key: 'crown', label: 'Crown' },
];

function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {ICON_OPTIONS.map(icon => (
        <button
          key={icon.key}
          type="button"
          onClick={() => onChange(icon.key)}
          className={`p-2 rounded-lg border text-center transition-colors ${value === icon.key ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}
          title={icon.label}
        >
          <span className="text-lg">{ICON_OPTIONS.find(i => i.key === icon.key)?.key === 'star' ? '\u2605' : ICON_OPTIONS.find(i => i.key === icon.key)?.key === 'shield' ? '\u26E8' : ICON_OPTIONS.find(i => i.key === icon.key)?.key === 'bolt' ? '\u26A1' : icon.key[0].toUpperCase()}</span>
        </button>
      ))}
    </div>
  );
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-white">
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

export default function AdminBadgeEditor() {
  const [tab, setTab] = useState<'clinic' | 'doctor'>('clinic');
  const [templates, setTemplates] = useState<BadgeTemplate[]>([]);
  const [awards, setAwards] = useState<AwardRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<BadgeTemplate | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formKey, setFormKey] = useState('');
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIcon, setFormIcon] = useState('star');
  const [formColor, setFormColor] = useState('#6366f1');
  const [formCriteriaType, setFormCriteriaType] = useState<'automatic' | 'manual'>('manual');
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
      const [tplRes, awardRes] = await Promise.all([
        fetch('/api/admin/badge-templates'),
        fetch('/api/admin/badge-awards'),
      ]);
      if (awardRes.status === 401) { window.location.href = '/admin/login'; return; }

      // Use defaults if API not available
      const tplData = tplRes.ok ? await tplRes.json() : { data: null };
      const awardData = awardRes.ok ? await awardRes.json() : { data: [] };

      setTemplates(tplData.data || (tab === 'clinic' ? DEFAULT_CLINIC_TEMPLATES : DEFAULT_DOCTOR_TEMPLATES));
      setAwards(awardData.data || []);
    } catch {
      setTemplates(tab === 'clinic' ? DEFAULT_CLINIC_TEMPLATES : DEFAULT_DOCTOR_TEMPLATES);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function openModal(tpl?: BadgeTemplate) {
    if (tpl) {
      setEditingTemplate(tpl);
      setFormKey(tpl.key);
      setFormName(tpl.name);
      setFormDescription(tpl.description);
      setFormIcon(tpl.icon);
      setFormColor(tpl.color);
      setFormCriteriaType(tpl.criteria.type);
      setFormMetric(tpl.criteria.metric || '');
      setFormThreshold(tpl.criteria.threshold ? String(tpl.criteria.threshold) : '');
      setFormCriteriaDesc(tpl.criteria.description || '');
    } else {
      setEditingTemplate(null);
      setFormKey('');
      setFormName('');
      setFormDescription('');
      setFormIcon('star');
      setFormColor('#6366f1');
      setFormCriteriaType('manual');
      setFormMetric('');
      setFormThreshold('');
      setFormCriteriaDesc('');
    }
    setShowModal(true);
  }

  async function handleSave() {
    if (!formKey || !formName) { showToast('error', 'Key and name are required'); return; }
    if (!editingTemplate && templates.some(t => t.key === formKey)) { showToast('error', 'Badge key already exists'); return; }

    setSaving(true);
    try {
      const body = {
        type: tab,
        key: formKey,
        name: formName,
        description: formDescription,
        icon: formIcon,
        color: formColor,
        criteria: {
          type: formCriteriaType,
          metric: formCriteriaType === 'automatic' ? formMetric : undefined,
          threshold: formCriteriaType === 'automatic' && formThreshold ? Number(formThreshold) : undefined,
          description: formCriteriaType === 'automatic' ? formCriteriaDesc : undefined,
        },
        active: true,
      };

      const url = editingTemplate ? `/api/admin/badge-templates?id=${editingTemplate.id}` : '/api/admin/badge-templates';
      const method = editingTemplate ? 'PUT' : 'POST';

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok && res.status !== 404) throw new Error('Failed to save template');

      showToast('success', `Badge template ${editingTemplate ? 'updated' : 'created'}`);
      setShowModal(false);
      fetchData();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(tpl: BadgeTemplate) {
    try {
      const res = await fetch(`/api/admin/badge-templates?id=${tpl.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...tpl, active: !tpl.active }),
      });
      if (!res.ok && res.status !== 404) throw new Error('Failed to toggle');
      setTemplates(templates.map(t => t.id === tpl.id ? { ...t, active: !t.active } : t));
      showToast('success', `Badge ${tpl.active ? 'deactivated' : 'activated'}`);
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to toggle');
    }
  }

  async function handleDelete(tpl: BadgeTemplate) {
    if (!confirm(`Delete "${tpl.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/badge-templates?id=${tpl.id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 404) throw new Error('Failed to delete');
      setTemplates(templates.filter(t => t.id !== tpl.id));
      showToast('success', 'Badge template deleted');
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to delete');
    }
  }

  const currentTemplates = templates.filter(t => t.type === tab);
  const badgeColors = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#14b8a6', '#f97316', '#84cc16'];

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
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Badge Editor</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Configure badge templates and award criteria</p>
        </div>
        <button onClick={fetchData} className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Badge Type Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
        <div className="border-b border-gray-200 dark:border-slate-700">
          <nav className="flex gap-1 px-4">
            <button onClick={() => setTab('clinic')} className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === 'clinic' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'}`}>
              Clinic Badges
            </button>
            <button onClick={() => setTab('doctor')} className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === 'doctor' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'}`}>
              Doctor Badges
            </button>
          </nav>
        </div>

        <div className="p-6">
          <div className="flex justify-end mb-4">
            <button onClick={() => openModal()} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Badge Template
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="inline-block w-8 h-8 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : currentTemplates.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-slate-400">
              No badge templates. Click "Add Badge Template" to create one.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {currentTemplates.map(tpl => (
                <div key={tpl.id} className={`p-4 border rounded-xl transition-colors ${tpl.active ? 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800' : 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 opacity-60'}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold" style={{ backgroundColor: tpl.color + '20', color: tpl.color }}>
                      {tpl.icon[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{tpl.name}</h4>
                        <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${tpl.active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                          {tpl.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{tpl.description}</p>
                      <div className="mt-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${tpl.criteria.type === 'automatic' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                          {tpl.criteria.type === 'automatic' ? 'Auto' : 'Manual'}
                        </span>
                        {tpl.criteria.metric && (
                          <span className="ml-1 text-[10px] text-gray-400 dark:text-slate-500">{tpl.criteria.description || `${tpl.criteria.metric} ${tpl.criteria.threshold}`}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => handleToggle(tpl)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 dark:text-slate-400" title={tpl.active ? 'Deactivate' : 'Activate'}>
                        {tpl.active ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        )}
                      </button>
                      <button onClick={() => openModal(tpl)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 dark:text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => handleDelete(tpl)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Award Distribution Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Badge Distribution</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Track which badges have been awarded</p>
        </div>
        <div className="p-6">
          {awards.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-slate-400">
              No badges awarded yet. Award badges from the Badges page.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Recipient</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Badge</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Awarded</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {awards.slice(0, 20).map(award => (
                    <tr key={award.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{award.entityName}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-medium rounded">
                          {award.badgeName}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-400">
                        {new Date(award.awardedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-400">{award.awardedBy || 'System'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Badge Editor Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingTemplate ? 'Edit Badge Template' : 'New Badge Template'}>
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Badge Key *</label>
              <input
                type="text"
                value={formKey}
                onChange={e => setFormKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                placeholder="my_badge"
                disabled={!!editingTemplate}
                className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Display Name *</label>
              <input
                type="text"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="My Badge"
                className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Description</label>
            <textarea
              value={formDescription}
              onChange={e => setFormDescription(e.target.value)}
              placeholder="What does this badge represent?"
              rows={2}
              className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Icon</label>
            <IconPicker value={formIcon} onChange={setFormIcon} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formColor}
                onChange={e => setFormColor(e.target.value)}
                className="w-12 h-10 rounded border border-gray-300 dark:border-slate-600 cursor-pointer"
              />
              <input
                type="text"
                value={formColor}
                onChange={e => setFormColor(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm font-mono bg-white dark:bg-slate-900"
              />
              <div className="flex gap-1">
                {badgeColors.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFormColor(c)}
                    className="w-6 h-6 rounded border border-gray-200 dark:border-slate-600 hover:scale-110 transition-transform"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Award Criteria</label>
            <div className="flex gap-4 mb-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={formCriteriaType === 'manual'}
                  onChange={() => setFormCriteriaType('manual')}
                  className="text-indigo-600"
                />
                <span className="text-gray-700 dark:text-slate-300">Manual (admin awards)</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={formCriteriaType === 'automatic'}
                  onChange={() => setFormCriteriaType('automatic')}
                  className="text-indigo-600"
                />
                <span className="text-gray-700 dark:text-slate-300">Automatic (system awards)</span>
              </label>
            </div>

            {formCriteriaType === 'automatic' && (
              <div className="space-y-3 p-3 bg-gray-50 dark:bg-slate-900 rounded-lg">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Metric</label>
                    <select
                      value={formMetric}
                      onChange={e => setFormMetric(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-1.5 text-sm bg-white dark:bg-slate-800"
                    >
                      <option value="">Select...</option>
                      <option value="avg_rating">Average Rating</option>
                      <option value="review_count">Review Count</option>
                      <option value="leads">Lead Count</option>
                      <option value="response_time">Response Time</option>
                      <option value="session_count">Session Count</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Threshold</label>
                    <input
                      type="number"
                      value={formThreshold}
                      onChange={e => setFormThreshold(e.target.value)}
                      placeholder="e.g. 4.8"
                      className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-1.5 text-sm bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Criteria Description</label>
                  <input
                    type="text"
                    value={formCriteriaDesc}
                    onChange={e => setFormCriteriaDesc(e.target.value)}
                    placeholder="e.g. Average rating >= 4.8 for 6 months"
                    className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-1.5 text-sm bg-white dark:bg-slate-800"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Saving...' : editingTemplate ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
