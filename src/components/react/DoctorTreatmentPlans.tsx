import { useState, useEffect } from 'react';

interface PlanData {
  frequencyHz?: number;
  intensityPercent?: number;
  milestones?: string[];
}

interface TreatmentPlan {
  id: string;
  doctorId: string;
  patientId: string | null;
  patientEmail?: string;
  treatmentType: string;
  protocol: string;
  sessionCount: number;
  frequencyHz: number | null;
  intensityPercent: number | null;
  milestones: string[] | null;
  status: 'active' | 'completed' | 'paused';
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

interface PlanForm {
  patientEmail: string;
  protocol: string;
  sessionCount: number;
  frequencyHz: string;
  intensityPercent: string;
  milestones: string;
}

interface SessionUpdate {
  planId: string;
  completedSessions: number;
}

const PROTOCOL_TEMPLATES = [
  {
    name: 'Standard TMS (Depression)',
    protocol: 'High-Frequency Left DLPFC',
    sessionCount: 36,
    frequencyHz: '10',
    intensityPercent: '120',
    description: 'Traditional protocol for MDD using high-frequency stimulation to left dorsolateral prefrontal cortex',
  },
  {
    name: 'Bilateral TMS (Depression)',
    protocol: 'Bilateral DLPFC',
    sessionCount: 30,
    frequencyHz: '10/1',
    intensityPercent: '120',
    description: 'Combination of high-frequency left and low-frequency right DLPFC stimulation',
  },
  {
    name: 'Accelerated TMS',
    protocol: 'Accelerated iTBS',
    sessionCount: 20,
    frequencyHz: '50',
    intensityPercent: '90',
    description: 'Accelerated intermittent theta-burst stimulation protocol, 2 sessions/day',
  },
  {
    name: 'Deep TMS (OCD)',
    protocol: 'Deep TMS - mPFC',
    sessionCount: 29,
    frequencyHz: '18',
    intensityPercent: '100',
    description: 'Deep TMS targeting medial prefrontal cortex for OCD treatment',
  },
  {
    name: 'Low-Frequency Right DLPFC',
    protocol: 'Low-Frequency Right DLPFC',
    sessionCount: 20,
    frequencyHz: '1',
    intensityPercent: '100',
    description: 'Right-sided low-frequency stimulation for depression with anxiety features',
  },
  {
    name: 'Theta-Burst (Anxiety)',
    protocol: 'cTBS Right DLPFC',
    sessionCount: 30,
    frequencyHz: '5',
    intensityPercent: '80',
    description: 'Continuous theta-burst protocol for treatment-resistant anxiety',
  },
];

const TREATMENT_TYPES = [
  'depression_mdd',
  'bipolar_depression',
  'ocd',
  'anxiety',
  'ptsd',
  'chronic_pain',
  'smoking_cessation',
  'auditory_hallucinations',
  'other',
];

const STATUS_BADGES: Record<string, string> = {
  active: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  paused: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  completed: 'Completed',
  paused: 'Paused',
};

interface DoctorTreatmentPlansProps {
  doctorId?: string;
}

export default function DoctorTreatmentPlans({ doctorId }: DoctorTreatmentPlansProps) {
  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sessionUpdates, setSessionUpdates] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed' | 'paused'>('all');

  const [form, setForm] = useState<PlanForm>({
    patientEmail: '',
    protocol: '',
    sessionCount: 30,
    frequencyHz: '10',
    intensityPercent: '120',
    milestones: '',
  });

  useEffect(() => {
    if (!doctorId) { setLoading(false); return; }
    fetch('/api/doctor/treatment-plans')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setPlans(d.plans || []))
      .catch(() => setError('Failed to load treatment plans'))
      .finally(() => setLoading(false));
  }, [doctorId]);

  const showMsg = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientEmail || !form.protocol || !form.sessionCount) {
      setError('Patient email, protocol, and session count are required');
      return;
    }
    setError('');
    try {
      const milestones = form.milestones
        ? form.milestones.split(',').map(m => m.trim()).filter(Boolean)
        : [];
      const payload = {
        patientEmail: form.patientEmail,
        protocol: form.protocol,
        sessionCount: Number(form.sessionCount),
        frequencyHz: form.frequencyHz ? Number(form.frequencyHz) : undefined,
        intensityPercent: form.intensityPercent ? Number(form.intensityPercent) : undefined,
        milestones,
      };
      const res = await fetch('/api/doctor/treatment-plans', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to save');
      }
      const data = await res.json();
      if (editingId) {
        setPlans(prev => prev.map(p => p.id === editingId ? { ...p, ...data } : p));
        showMsg('Treatment plan updated');
      } else {
        setPlans(prev => [data, ...prev]);
        showMsg('Treatment plan created');
      }
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to save treatment plan');
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/doctor/treatment-plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setPlans(prev => prev.map(p => p.id === id ? { ...p, status: status as TreatmentPlan['status'] } : p));
        showMsg(`Plan marked as ${status}`);
      }
    } catch {
      setError('Failed to update status');
    }
  };

  const handleSessionIncrement = async (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    const current = sessionUpdates[planId] ?? plan.sessionCount;
    const newCompleted = Math.min(current + 1, plan.sessionCount);
    setSessionUpdates(prev => ({ ...prev, [planId]: newCompleted }));
  };

  const handleSessionDecrement = async (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    const current = sessionUpdates[planId] ?? plan.sessionCount;
    const newCompleted = Math.max(current - 1, 0);
    setSessionUpdates(prev => ({ ...prev, [planId]: newCompleted }));
  };

  const applyTemplate = (template: typeof PROTOCOL_TEMPLATES[0]) => {
    setForm({
      patientEmail: '',
      protocol: template.protocol,
      sessionCount: template.sessionCount,
      frequencyHz: template.frequencyHz,
      intensityPercent: template.intensityPercent,
      milestones: '',
    });
    setShowTemplates(false);
    setShowForm(true);
    setEditingId(null);
  };

  const editPlan = (plan: TreatmentPlan) => {
    setForm({
      patientEmail: (plan as any).patientEmail || '',
      protocol: plan.protocol,
      sessionCount: plan.sessionCount,
      frequencyHz: plan.frequencyHz?.toString() || '',
      intensityPercent: plan.intensityPercent?.toString() || '',
      milestones: plan.milestones?.join(', ') || '',
    });
    setEditingId(plan.id);
    setShowForm(true);
    setShowTemplates(false);
  };

  const resetForm = () => {
    setForm({ patientEmail: '', protocol: '', sessionCount: 30, frequencyHz: '10', intensityPercent: '120', milestones: '' });
    setEditingId(null);
    setShowForm(false);
    setShowTemplates(false);
  };

  const filteredPlans = activeTab === 'all'
    ? plans
    : plans.filter(p => p.status === activeTab);

  const getCompletedSessions = (plan: TreatmentPlan) => {
    return sessionUpdates[plan.id] ?? plan.sessionCount;
  };

  const getProgressPercent = (plan: TreatmentPlan) => {
    const completed = getCompletedSessions(plan);
    return Math.round((completed / plan.sessionCount) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {msg && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-lg text-green-800 dark:text-green-200 text-sm">
          {msg}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <button
          onClick={() => { setShowForm(true); setShowTemplates(false); setEditingId(null); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Treatment Plan
        </button>
        <button
          onClick={() => { setShowTemplates(!showTemplates); setShowForm(false); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Template Library ({PROTOCOL_TEMPLATES.length})
        </button>
      </div>

      {/* Template Library */}
      {showTemplates && (
        <div className="mb-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Protocol Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PROTOCOL_TEMPLATES.map((template) => (
              <div key={template.name} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{template.name}</h4>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{template.description}</p>
                <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1 mb-3">
                  <div className="flex justify-between"><span>Sessions:</span><span className="font-medium">{template.sessionCount}</span></div>
                  <div className="flex justify-between"><span>Frequency:</span><span className="font-medium">{template.frequencyHz} Hz</span></div>
                  <div className="flex justify-between"><span>Intensity:</span><span className="font-medium">{template.intensityPercent}%</span></div>
                </div>
                <button
                  onClick={() => applyTemplate(template)}
                  className="w-full text-xs px-3 py-1.5 rounded-lg font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                >
                  Use Template
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New/Edit Plan Form */}
      {showForm && (
        <div className="mb-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {editingId ? 'Edit Treatment Plan' : 'New Treatment Plan'}
            </h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Patient Email *</label>
                <input
                  type="email"
                  value={form.patientEmail}
                  onChange={e => setForm(f => ({ ...f, patientEmail: e.target.value }))}
                  placeholder="patient@example.com"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Protocol *</label>
                <input
                  type="text"
                  value={form.protocol}
                  onChange={e => setForm(f => ({ ...f, protocol: e.target.value }))}
                  placeholder="e.g. High-Frequency Left DLPFC"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Total Sessions *</label>
                <input
                  type="number"
                  value={form.sessionCount}
                  onChange={e => setForm(f => ({ ...f, sessionCount: Number(e.target.value) }))}
                  min="1"
                  max="100"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Frequency (Hz)</label>
                <input
                  type="text"
                  value={form.frequencyHz}
                  onChange={e => setForm(f => ({ ...f, frequencyHz: e.target.value }))}
                  placeholder="e.g. 10 or 10/1"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Intensity (%)</label>
                <input
                  type="text"
                  value={form.intensityPercent}
                  onChange={e => setForm(f => ({ ...f, intensityPercent: e.target.value }))}
                  placeholder="e.g. 120"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Milestones (comma-separated)</label>
                <input
                  type="text"
                  value={form.milestones}
                  onChange={e => setForm(f => ({ ...f, milestones: e.target.value }))}
                  placeholder="e.g. Week 2 review, Week 4 assessment"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                {editingId ? 'Update Plan' : 'Create Plan'}
              </button>
              <button type="button" onClick={resetForm} className="px-5 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {(['all', 'active', 'completed', 'paused'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}>
            {tab === 'all' ? 'All Plans' : STATUS_LABELS[tab]}
            <span className="ml-1.5 text-xs opacity-70">
              ({tab === 'all' ? plans.length : plans.filter(p => p.status === tab).length})
            </span>
          </button>
        ))}
      </div>

      {/* Plans List */}
      {filteredPlans.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">No treatment plans found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPlans.map(plan => {
            const completed = getCompletedSessions(plan);
            const progress = getProgressPercent(plan);
            return (
              <div key={plan.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  {/* Plan Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{plan.protocol}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGES[plan.status]}`}>
                        {STATUS_LABELS[plan.status]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      {(plan as any).patientEmail || 'Patient linked'}
                      {plan.startedAt && (
                        <span className="ml-2">Started {new Date(plan.startedAt).toLocaleDateString()}</span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-300">
                      <span><span className="font-medium">Sessions:</span> {plan.sessionCount}</span>
                      {plan.frequencyHz && <span><span className="font-medium">Freq:</span> {plan.frequencyHz} Hz</span>}
                      {plan.intensityPercent && <span><span className="font-medium">Intensity:</span> {plan.intensityPercent}%</span>}
                      {plan.milestones && plan.milestones.length > 0 && (
                        <span><span className="font-medium">Milestones:</span> {plan.milestones.length}</span>
                      )}
                    </div>
                  </div>

                  {/* Session Progress */}
                  <div className="lg:w-48">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-gray-600 dark:text-gray-300">Sessions</span>
                      <span className="text-gray-500 dark:text-gray-400">{completed}/{plan.sessionCount}</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 mb-2">
                      <div
                        className={`h-2 rounded-full transition-all ${progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSessionDecrement(plan.id)}
                        className="w-7 h-7 rounded-lg text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
                      >-</button>
                      <input
                        type="number"
                        value={sessionUpdates[plan.id] ?? completed}
                        onChange={e => setSessionUpdates(prev => ({ ...prev, [plan.id]: Number(e.target.value) }))}
                        min={0}
                        max={plan.sessionCount}
                        className="flex-1 text-center px-2 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                      <button
                        onClick={() => handleSessionIncrement(plan.id)}
                        className="w-7 h-7 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors flex items-center justify-center"
                      >+</button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 lg:flex-col lg:items-end">
                    {plan.status === 'active' && (
                      <>
                        <button onClick={() => editPlan(plan)} className="text-xs px-3 py-1.5 rounded-lg font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                          Edit
                        </button>
                        <button onClick={() => handleStatusChange(plan.id, 'paused')} className="text-xs px-3 py-1.5 rounded-lg font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors">
                          Pause
                        </button>
                        <button onClick={() => handleStatusChange(plan.id, 'completed')} className="text-xs px-3 py-1.5 rounded-lg font-medium text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/40 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors">
                          Complete
                        </button>
                      </>
                    )}
                    {plan.status === 'paused' && (
                      <button onClick={() => handleStatusChange(plan.id, 'active')} className="text-xs px-3 py-1.5 rounded-lg font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                        Resume
                      </button>
                    )}
                    {plan.status === 'completed' && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium px-3 py-1.5">Finished</span>
                    )}
                  </div>
                </div>

                {/* Milestones */}
                {plan.milestones && plan.milestones.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Milestones</p>
                    <div className="flex flex-wrap gap-2">
                      {plan.milestones.map((milestone, i) => (
                        <span key={i} className="text-xs px-2 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300">
                          {milestone}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
