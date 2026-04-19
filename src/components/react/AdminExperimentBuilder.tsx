import { useState, useEffect, useCallback, useMemo } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ExperimentStatus = 'draft' | 'running' | 'paused' | 'concluded';

interface ExperimentVariant {
  id: string;
  experimentId: string;
  name: string;
  changes: string | null;
  impressions: number;
  conversions: number;
  createdAt: string;
}

interface Experiment {
  id: string;
  name: string;
  hypothesis: string | null;
  description: string | null;
  status: ExperimentStatus;
  trafficPercent: number;
  holdoutPercent: number;
  primaryMetric: string;
  winnerVariant: string | null;
  startedAt: string | null;
  concludedAt: string | null;
  createdAt: string;
  updatedAt: string;
  variants: ExperimentVariant[];
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-fade-in ${
            t.type === 'success' ? 'bg-emerald-600 text-white' :
            t.type === 'error' ? 'bg-red-600 text-white' :
            'bg-indigo-600 text-white'
          }`}
        >
          {t.type === 'success' && (
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {t.type === 'error' && (
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {t.type === 'info' && (
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ─── Simple Bar Chart ──────────────────────────────────────────────────────────

function VariantChart({ variants }: { variants: ExperimentVariant[] }) {
  const data = useMemo(() => {
    return variants.map(v => ({
      name: v.name,
      rate: v.impressions > 0 ? (v.conversions / v.impressions) * 100 : 0,
      conversions: v.conversions,
      impressions: v.impressions,
    }));
  }, [variants]);

  const maxRate = Math.max(...data.map(d => d.rate), 0.1);

  if (data.length === 0) return null;

  return (
    <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Conversion Rate Comparison</h4>
      <div className="space-y-2">
        {data.map(d => {
          const pct = (d.rate / maxRate) * 100;
          return (
            <div key={d.name} className="flex items-center gap-3">
              <div className="w-24 text-xs text-gray-600 font-medium truncate">{d.name}</div>
              <div className="flex-1 h-6 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(pct, 2)}%` }}
                />
              </div>
              <div className="w-28 text-xs text-gray-500 text-right">
                <span className="font-semibold text-gray-800">{d.rate.toFixed(2)}%</span>
                <span className="ml-2 text-gray-400">({d.conversions}/{d.impressions})</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── New/Edit Experiment Modal ─────────────────────────────────────────────────

interface ExperimentFormData {
  name: string;
  hypothesis: string;
  description: string;
  primaryMetric: string;
  trafficPercent: number;
  startDate: string;
  endDate: string;
  status: ExperimentStatus;
}

const EMPTY_FORM: ExperimentFormData = {
  name: '',
  hypothesis: '',
  description: '',
  primaryMetric: 'leads',
  trafficPercent: 10,
  startDate: '',
  endDate: '',
  status: 'draft',
};

function ExperimentModal({
  existing,
  onClose,
  onSaved,
}: {
  existing?: Experiment;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<ExperimentFormData>(existing ? {
    name: existing.name,
    hypothesis: existing.hypothesis || '',
    description: existing.description || '',
    primaryMetric: existing.primaryMetric,
    trafficPercent: existing.trafficPercent,
    startDate: existing.startedAt ? existing.startedAt.split('T')[0] : '',
    endDate: existing.concludedAt ? existing.concludedAt.split('T')[0] : '',
    status: existing.status,
  } : EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const update = (field: keyof ExperimentFormData, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name) { setError('Name is required'); return; }
    setSaving(true);
    try {
      const method = existing ? 'PUT' : 'POST';
      const payload = existing
        ? { id: existing.id, name: form.name, hypothesis: form.hypothesis, primaryMetric: form.primaryMetric, trafficPercent: form.trafficPercent, status: form.status }
        : { name: form.name, hypothesis: form.hypothesis, description: form.description, primaryMetric: form.primaryMetric, trafficPercent: form.trafficPercent, variants: ['control', 'variant_a'] };

      const res = await fetch('/api/admin/experiments', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok) { onSaved(); onClose(); }
      else { setError(json.error || 'Failed to save'); }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto animate-scale-in">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900">{existing ? 'Edit Experiment' : 'New Experiment'}</h2>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="e.g. Homepage CTA Color Test"
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hypothesis</label>
              <input type="text" value={form.hypothesis} onChange={(e) => update('hypothesis', e.target.value)} placeholder="e.g. Changing the CTA to green will increase conversions by 10%"
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Optional detailed description..."
                rows={2}
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Key Metric *</label>
              <select value={form.primaryMetric} onChange={(e) => update('primaryMetric', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white">
                <option value="leads">Leads</option>
                <option value="conversions">Conversions</option>
                <option value="revenue">Revenue</option>
                <option value="engagement">Engagement</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Traffic Percentage: {form.trafficPercent}%</label>
              <input
                type="range"
                min={1} max={100}
                value={form.trafficPercent}
                onChange={(e) => update('trafficPercent', parseInt(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>1%</span><span>50%</span><span>100%</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input type="date" value={form.startDate} onChange={(e) => update('startDate', e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input type="date" value={form.endDate} onChange={(e) => update('endDate', e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
              </div>
            </div>
            {existing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={form.status} onChange={(e) => update('status', e.target.value as ExperimentStatus)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white">
                  <option value="draft">Draft</option>
                  <option value="running">Running</option>
                  <option value="paused">Paused</option>
                  <option value="concluded">Concluded</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50">Cancel</button>
            <button onClick={handleSubmit} disabled={saving}
              className="px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
              {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {existing ? 'Update' : 'Create Experiment'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Add Variant Modal ─────────────────────────────────────────────────────────

function VariantModal({
  experimentId,
  onClose,
  onSaved,
}: {
  experimentId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [trafficAlloc, setTrafficAlloc] = useState(50);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!name) { setError('Variant name is required'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/experiment-variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experimentId, name, changes: description }),
      });
      const json = await res.json();
      if (res.ok) { onSaved(); onClose(); }
      else { setError(json.error || 'Failed to add variant'); }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900">Add Variant</h2>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Variant Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. variant_b"
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description / Changes</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what changes in this variant..."
                rows={3}
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Traffic Allocation: {trafficAlloc}%</label>
              <input
                type="range"
                min={1} max={100}
                value={trafficAlloc}
                onChange={(e) => setTrafficAlloc(parseInt(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <p className="text-xs text-amber-600 mt-1">Note: Ensure total allocation across all variants sums to 100%</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50">Cancel</button>
            <button onClick={handleSubmit} disabled={saving}
              className="px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
              {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Add Variant
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_META: Record<ExperimentStatus, { label: string; color: string; dot: string }> = {
  draft:      { label: 'Draft',      color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
  running:    { label: 'Running',    color: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  paused:     { label: 'Paused',     color: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  concluded:  { label: 'Concluded', color: 'bg-indigo-50 text-indigo-700', dot: 'bg-indigo-400' },
};

const METRIC_LABELS: Record<string, string> = {
  leads: 'Leads',
  conversions: 'Conversions',
  revenue: 'Revenue',
  engagement: 'Engagement',
};

function formatDate(iso: string | null): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminExperimentBuilder() {
  const [activeTab, setActiveTab] = useState<'experiments' | 'variants'>('experiments');
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Modals / UI state
  const [experimentForm, setExperimentForm] = useState<Experiment | undefined>(undefined);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [selectedExpId, setSelectedExpId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Experiment | null>(null);
  const [confirmVariantDelete, setConfirmVariantDelete] = useState<string | null>(null);

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = String(Date.now());
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const fetchExperiments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/experiments');
      if (res.ok) {
        const json = await res.json();
        setExperiments(json.data || []);
      }
    } catch { /* handled by empty state */ }
    finally { setLoading(false); }
  }, []);

  const fetchVariants = useCallback(async (experimentId: string) => {
    const res = await fetch(`/api/admin/experiment-variants?experimentId=${experimentId}`);
    if (res.ok) {
      const json = await res.json();
      setExperiments(prev => prev.map(e =>
        e.id === experimentId ? { ...e, variants: json.data || [] } : e
      ));
    }
  }, []);

  useEffect(() => {
    fetchExperiments();
  }, [fetchExperiments]);

  const selectedExperiment = useMemo(
    () => experiments.find(e => e.id === selectedExpId),
    [experiments, selectedExpId]
  );

  const handleStatusChange = async (exp: Experiment, newStatus: ExperimentStatus) => {
    try {
      const res = await fetch('/api/admin/experiments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: exp.id, status: newStatus }),
      });
      if (res.ok) {
        setExperiments(prev => prev.map(e => e.id === exp.id ? { ...e, status: newStatus } : e));
        showToast(`Experiment ${newStatus === 'running' ? 'started' : newStatus === 'paused' ? 'paused' : newStatus}`);
      }
    } catch { showToast('Failed to update status', 'error'); }
  };

  const handleDeleteExperiment = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/experiments?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setExperiments(prev => prev.filter(e => e.id !== id));
        if (selectedExpId === id) setSelectedExpId(null);
        showToast('Experiment deleted');
      }
    } catch { showToast('Failed to delete', 'error'); }
    setConfirmDelete(null);
  };

  const handleDeleteVariant = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/experiment-variants?id=${id}`, { method: 'DELETE' });
      if (res.ok && selectedExpId) {
        fetchVariants(selectedExpId);
        showToast('Variant removed');
      }
    } catch { showToast('Failed to remove variant', 'error'); }
    setConfirmVariantDelete(null);
  };

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Experiment Builder</h1>
          <p className="text-gray-500 mt-1 text-sm">A/B testing and variant management</p>
        </div>
        {activeTab === 'experiments' && (
          <button
            onClick={() => setExperimentForm(undefined)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Experiment
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1">
          {(['experiments', 'variants'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'experiments' ? 'Experiments' : 'Variants'}
              {tab === 'experiments' && experiments.filter(e => e.status === 'running').length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                  {experiments.filter(e => e.status === 'running').length} active
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Experiments Tab ── */}
      {activeTab === 'experiments' && (
        loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : experiments.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm text-center py-16">
            <svg className="w-12 h-12 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-gray-500 font-medium">No experiments yet</p>
            <p className="text-gray-400 text-sm mt-1">Create your first A/B test to get started</p>
            <button onClick={() => setExperimentForm(undefined)} className="mt-4 text-indigo-600 hover:text-indigo-700 text-sm font-medium">
              Create experiment
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {experiments.map(exp => {
              const statusMeta = STATUS_META[exp.status];
              return (
                <div key={exp.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                  {/* Status badge + traffic */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${statusMeta.dot}`} />
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusMeta.color}`}>
                        {statusMeta.label}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 font-mono">{exp.trafficPercent}% traffic</span>
                  </div>

                  {/* Name & hypothesis */}
                  <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-1">{exp.name}</h3>
                  {exp.hypothesis && (
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{exp.hypothesis}</p>
                  )}

                  {/* Metric + dates */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="text-xs bg-violet-50 text-violet-700 px-2 py-1 rounded-md font-medium">
                      {METRIC_LABELS[exp.primaryMetric] || exp.primaryMetric}
                    </span>
                    {exp.startedAt && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                        Started {formatDate(exp.startedAt)}
                      </span>
                    )}
                    {exp.concludedAt && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                        Concluded {formatDate(exp.concludedAt)}
                      </span>
                    )}
                    {!exp.startedAt && !exp.concludedAt && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                        {(exp.variants || []).length} variant{((exp.variants || []).length) !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Quick stats */}
                  {(exp.variants || []).length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
                      {(exp.variants || []).map(v => {
                        const rate = v.impressions > 0 ? ((v.conversions / v.impressions) * 100).toFixed(1) : '0.0';
                        return (
                          <div key={v.id} className="text-center">
                            <div className="text-xs font-bold text-gray-800">{rate}%</div>
                            <div className="text-xs text-gray-400 truncate">{v.name}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => setExperimentForm(exp)}
                      className="flex-1 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Edit
                    </button>
                    {exp.status === 'draft' && (
                      <button
                        onClick={() => handleStatusChange(exp, 'running')}
                        className="flex-1 px-3 py-2 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        Start
                      </button>
                    )}
                    {exp.status === 'running' && (
                      <button
                        onClick={() => handleStatusChange(exp, 'paused')}
                        className="flex-1 px-3 py-2 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                      >
                        Pause
                      </button>
                    )}
                    {exp.status === 'paused' && (
                      <button
                        onClick={() => handleStatusChange(exp, 'running')}
                        className="flex-1 px-3 py-2 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        Resume
                      </button>
                    )}
                    <button
                      onClick={() => setConfirmDelete(exp)}
                      className="px-3 py-2 text-xs font-medium text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Archive / Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                    </button>
                    <button
                      onClick={() => { setSelectedExpId(exp.id); setActiveTab('variants'); }}
                      className="px-3 py-2 text-xs font-medium text-indigo-600 hover:text-indigo-700 rounded-lg hover:bg-indigo-50 transition-colors"
                      title="View Variants"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── Variants Tab ── */}
      {activeTab === 'variants' && (
        <>
          {/* Experiment Selector */}
          <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
            <label className="text-sm font-medium text-gray-700">Experiment:</label>
            <select
              value={selectedExpId || ''}
              onChange={(e) => {
                setSelectedExpId(e.target.value || null);
              }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white flex-1 min-w-[200px]"
            >
              <option value="">Select an experiment...</option>
              {experiments.map(exp => (
                <option key={exp.id} value={exp.id}>{exp.name}</option>
              ))}
            </select>
            {selectedExpId && (
              <button
                onClick={() => fetchVariants(selectedExpId)}
                className="p-2 text-gray-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                title="Refresh variants"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
          </div>

          {!selectedExpId ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm text-center py-16">
              <svg className="w-12 h-12 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-gray-500 font-medium">Select an experiment to view its variants</p>
            </div>
          ) : selectedExperiment ? (
            <div className="space-y-4">
              {/* Experiment info bar */}
              <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{selectedExperiment.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {METRIC_LABELS[selectedExperiment.primaryMetric] || selectedExperiment.primaryMetric} &middot;
                    Traffic: {selectedExperiment.trafficPercent}% &middot;
                    Status: <span className={`font-medium ${selectedExperiment.status === 'running' ? 'text-emerald-600' : 'text-gray-600'}`}>{STATUS_META[selectedExperiment.status].label}</span>
                  </p>
                </div>
                <button
                  onClick={() => setShowVariantModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Variant
                </button>
              </div>

              {/* Chart */}
              {(selectedExperiment.variants || []).length > 0 && (
                <VariantChart variants={selectedExperiment.variants} />
              )}

              {/* Variants table */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : !(selectedExperiment.variants || []).length ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 font-medium">No variants yet</p>
                    <button onClick={() => setShowVariantModal(true)} className="mt-2 text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                      Add the first variant
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Variant Name</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Impressions</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Conversions</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Conversion Rate</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Winner</th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(selectedExperiment.variants || []).map(v => {
                          const rate = v.impressions > 0 ? (v.conversions / v.impressions) * 100 : 0;
                          const isWinner = selectedExperiment.winnerVariant === v.name;
                          return (
                            <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 text-sm font-semibold text-gray-900">{v.name}</td>
                              <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                                {v.changes ? <span className="line-clamp-1">{v.changes}</span> : <span className="text-gray-300">--</span>}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">{v.impressions.toLocaleString()}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{v.conversions.toLocaleString()}</td>
                              <td className="px-6 py-4 text-sm">
                                <span className={`font-semibold ${rate > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                                  {rate.toFixed(2)}%
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                {isWinner && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    Winner
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={() => setConfirmVariantDelete(v.id)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                  title="Remove variant"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </>
      )}

      {/* Modals */}
      {(experimentForm !== undefined) && (
        <ExperimentModal
          existing={experimentForm}
          onClose={() => setExperimentForm(undefined)}
          onSaved={() => { fetchExperiments(); showToast(experimentForm ? 'Experiment updated' : 'Experiment created'); }}
        />
      )}
      {showVariantModal && selectedExpId && (
        <VariantModal
          experimentId={selectedExpId}
          onClose={() => setShowVariantModal(false)}
          onSaved={() => { fetchVariants(selectedExpId); showToast('Variant added'); setShowVariantModal(false); }}
        />
      )}
      {confirmDelete && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={() => setConfirmDelete(null)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-scale-in">
              <h3 className="text-base font-semibold text-gray-900 mb-2">Archive Experiment?</h3>
              <p className="text-sm text-gray-500 mb-5">
                Are you sure you want to archive <strong>"{confirmDelete.name}"</strong>? This will delete all associated variants. This cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50">Cancel</button>
                <button onClick={() => handleDeleteExperiment(confirmDelete.id)} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700">Archive</button>
              </div>
            </div>
          </div>
        </>
      )}
      {confirmVariantDelete && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={() => setConfirmVariantDelete(null)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-scale-in">
              <h3 className="text-base font-semibold text-gray-900 mb-2">Remove Variant?</h3>
              <p className="text-sm text-gray-500 mb-5">This variant will be permanently removed. This cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setConfirmVariantDelete(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50">Cancel</button>
                <button onClick={() => handleDeleteVariant(confirmVariantDelete)} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700">Remove</button>
              </div>
            </div>
          </div>
            </>
      )}
    </div>
  );
}