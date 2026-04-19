import { useState, useEffect } from 'react';

interface DoctorOutcome {
  id: string;
  doctorId: string;
  treatmentType: string;
  metricName: string;
  metricValue: number;
  measurementPeriod: string | null;
  sampleSize: number | null;
  createdAt: string;
}

interface OutcomeForm {
  metricName: string;
  metricValue: string;
  treatmentType: string;
  measurementPeriod: string;
  sampleSize: string;
}

interface PatientOutcomeSummary {
  name: string;
  treatmentType: string;
  latestScore: number | null;
  trend: 'improving' | 'stable' | 'worsening' | 'unknown';
  recordCount: number;
}

const METRIC_DEFINITIONS = [
  {
    name: 'PHQ-9',
    description: 'Patient Health Questionnaire - Depression severity (0-27)',
    min: 0, max: 27,
    improvement: 'lower is better',
    color: 'text-blue-600 dark:text-blue-400',
  },
  {
    name: 'GAD-7',
    description: 'Generalized Anxiety Disorder scale (0-21)',
    min: 0, max: 21,
    improvement: 'lower is better',
    color: 'text-purple-600 dark:text-purple-400',
  },
  {
    name: 'CGI-S',
    description: 'Clinical Global Impression - Severity (1-7)',
    min: 1, max: 7,
    improvement: 'lower is better',
    color: 'text-green-600 dark:text-green-400',
  },
  {
    name: 'CGI-I',
    description: 'Clinical Global Impression - Improvement (1-7)',
    min: 1, max: 7,
    improvement: 'higher is better for positive change',
    color: 'text-teal-600 dark:text-teal-400',
  },
  {
    name: 'QIDS',
    description: 'Quick Inventory of Depressive Symptomatology (0-27)',
    min: 0, max: 27,
    improvement: 'lower is better',
    color: 'text-orange-600 dark:text-orange-400',
  },
  {
    name: 'BDI-II',
    description: 'Beck Depression Inventory II (0-63)',
    min: 0, max: 63,
    improvement: 'lower is better',
    color: 'text-red-600 dark:text-red-400',
  },
  {
    name: 'HAM-D',
    description: 'Hamilton Rating Scale for Depression (0-52)',
    min: 0, max: 52,
    improvement: 'lower is better',
    color: 'text-pink-600 dark:text-pink-400',
  },
  {
    name: 'HAM-A',
    description: 'Hamilton Rating Scale for Anxiety (0-56)',
    min: 0, max: 56,
    improvement: 'lower is better',
    color: 'text-blue-600 dark:text-blue-400',
  },
];

const TREATMENT_TYPES = [
  'tms_depression',
  'tms_anxiety',
  'tms_ocd',
  'tms_ptsd',
  'tms_chronic_pain',
  'ketamine',
  'spravato',
  'combination',
  'other',
];

const METRIC_COLORS: Record<string, string> = {
  'PHQ-9': 'border-blue-500',
  'GAD-7': 'border-purple-500',
  'CGI-S': 'border-green-500',
  'CGI-I': 'border-teal-500',
  'QIDS': 'border-orange-500',
  'BDI-II': 'border-red-500',
  'HAM-D': 'border-pink-500',
  'HAM-A': 'border-blue-500',
};

const METRIC_LINE_COLORS: Record<string, string> = {
  'PHQ-9': '#3b82f6',
  'GAD-7': '#a855f7',
  'CGI-S': '#22c55e',
  'CGI-I': '#14b8a6',
  'QIDS': '#f97316',
  'BDI-II': '#ef4444',
  'HAM-D': '#ec4899',
  'HAM-A': '#6366f1',
};

interface DoctorOutcomesProps {
  doctorId?: string;
}

export default function DoctorOutcomes({ doctorId }: DoctorOutcomesProps) {
  const [outcomes, setOutcomes] = useState<DoctorOutcome[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'chart' | 'table' | 'summary'>('chart');

  const [form, setForm] = useState<OutcomeForm>({
    metricName: 'PHQ-9',
    metricValue: '',
    treatmentType: 'tms_depression',
    measurementPeriod: '',
    sampleSize: '',
  });

  useEffect(() => {
    if (!doctorId) { setLoading(false); return; }
    fetch('/api/doctor/outcomes')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setOutcomes(d.outcomes || []))
      .catch(() => setError('Failed to load outcomes'))
      .finally(() => setLoading(false));
  }, [doctorId]);

  const showMsg = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.metricName || form.metricValue === '') {
      setError('Metric and value are required');
      return;
    }
    setError('');
    try {
      const payload = {
        metric: form.metricName,
        value: Number(form.metricValue),
        sampleSize: form.sampleSize ? Number(form.sampleSize) : undefined,
        methodology: form.measurementPeriod || undefined,
      };
      const res = await fetch('/api/doctor/outcomes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to save');
      }
      const data = await res.json();
      if (editingId) {
        setOutcomes(prev => prev.map(o => o.id === editingId ? data : o));
        showMsg('Outcome record updated');
      } else {
        setOutcomes(prev => [data, ...prev]);
        showMsg('Outcome record added');
      }
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to save outcome');
    }
  };

  const resetForm = () => {
    setForm({ metricName: 'PHQ-9', metricValue: '', treatmentType: 'tms_depression', measurementPeriod: '', sampleSize: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const editOutcome = (outcome: DoctorOutcome) => {
    setForm({
      metricName: outcome.metricName,
      metricValue: outcome.metricValue.toString(),
      treatmentType: outcome.treatmentType,
      measurementPeriod: outcome.measurementPeriod || '',
      sampleSize: outcome.sampleSize?.toString() || '',
    });
    setEditingId(outcome.id);
    setShowForm(true);
  };

  // Group outcomes by metric for charts
  const groupedByMetric = outcomes.reduce<Record<string, DoctorOutcome[]>>((acc, o) => {
    if (!acc[o.metricName]) acc[o.metricName] = [];
    acc[o.metricName].push(o);
    return acc;
  }, {});

  // For chart: get unique metrics sorted by date
  const chartMetrics = selectedMetric === 'all'
    ? Object.keys(groupedByMetric)
    : [selectedMetric];

  const filteredOutcomes = selectedMetric === 'all'
    ? outcomes
    : outcomes.filter(o => o.metricName === selectedMetric);

  // Simple SVG chart rendering
  const renderChart = (metricName: string, data: DoctorOutcome[]) => {
    const sorted = [...data].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    if (sorted.length < 2) return null;

    const values = sorted.map(o => o.metricValue);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const width = 500;
    const height = 160;
    const pad = 30;
    const chartW = width - pad * 2;
    const chartH = height - pad * 2;

    const points = sorted.map((o, i) => {
      const x = pad + (i / (sorted.length - 1)) * chartW;
      const y = pad + chartH - ((o.metricValue - min) / range) * chartH;
      return { x, y, value: o.metricValue, date: o.createdAt };
    });

    const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');
    const color = METRIC_LINE_COLORS[metricName] || '#3b82f6';

    // Area fill path
    const areaPath = `M${points[0].x},${height - pad} L${points.map(p => `${p.x},${p.y}`).join(' L')} L${points[points.length - 1].x},${height - pad} Z`;

    return (
      <div key={metricName} className="mb-6">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{metricName}</h4>
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 overflow-x-auto">
          <svg width={Math.max(width, 300)} height={height} className="w-full" viewBox={`0 0 ${width} ${height}`}>
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
              const y = pad + chartH - frac * chartH;
              const val = min + frac * range;
              return (
                <g key={frac}>
                  <line x1={pad} y1={y} x2={width - pad} y2={y} stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" />
                  <text x={pad - 6} y={y + 4} textAnchor="end" fontSize="10" fill="currentColor" className="text-gray-400">{val.toFixed(1)}</text>
                </g>
              );
            })}
            {/* Area fill */}
            <path d={areaPath} fill={color} fillOpacity="0.08" />
            {/* Line */}
            <polyline points={polylinePoints} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Dots */}
            {points.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="4" fill={color} />
                <circle cx={p.x} cy={p.y} r="6" fill={color} fillOpacity="0.2" />
              </g>
            ))}
            {/* X-axis labels */}
            {points.filter((_, i) => i === 0 || i === points.length - 1 || points.length <= 6 || i % Math.ceil(points.length / 4) === 0).map((p, i) => (
              <text key={i} x={p.x} y={height - 6} textAnchor="middle" fontSize="9" fill="currentColor" className="text-gray-400">
                {new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </text>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  // Compute before/after comparison
  const getBeforeAfter = (metricName: string) => {
    const metricOutcomes = (groupedByMetric[metricName] || [])
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    if (metricOutcomes.length < 2) return null;
    const before = metricOutcomes[0].metricValue;
    const after = metricOutcomes[metricOutcomes.length - 1].metricValue;
    const change = after - before;
    const metricDef = METRIC_DEFINITIONS.find(m => m.name === metricName);
    const improvement = metricDef?.improvement.includes('lower') ? change < 0 : change > 0;
    return { before, after, change, improvement, count: metricOutcomes.length };
  };

  const uniqueMetrics = Object.keys(groupedByMetric);

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
          onClick={() => { setShowForm(true); setEditingId(null); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Record Outcome
        </button>

        {/* Metric Filter */}
        <select
          value={selectedMetric}
          onChange={e => setSelectedMetric(e.target.value)}
          className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Metrics ({uniqueMetrics.length})</option>
          {METRIC_DEFINITIONS.map(m => (
            <option key={m.name} value={m.name}>{m.name} — {m.description.split(' (')[0]}</option>
          ))}
        </select>
      </div>

      {/* New Outcome Form */}
      {showForm && (
        <div className="mb-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {editingId ? 'Edit Outcome Record' : 'Record Treatment Outcome'}
            </h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Metric *</label>
                <select
                  value={form.metricName}
                  onChange={e => setForm(f => ({ ...f, metricName: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  {METRIC_DEFINITIONS.map(m => (
                    <option key={m.name} value={m.name}>{m.name}: {m.description.split(' (')[0]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Score Value *</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.metricValue}
                  onChange={e => setForm(f => ({ ...f, metricValue: e.target.value }))}
                  placeholder={`e.g. ${METRIC_DEFINITIONS.find(m => m.name === form.metricName)?.min ?? 0}`}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Treatment Type</label>
                <select
                  value={form.treatmentType}
                  onChange={e => setForm(f => ({ ...f, treatmentType: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  {TREATMENT_TYPES.map(t => (
                    <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Measurement Period</label>
                <input
                  type="text"
                  value={form.measurementPeriod}
                  onChange={e => setForm(f => ({ ...f, measurementPeriod: e.target.value }))}
                  placeholder="e.g. Week 4, Post-treatment"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Sample Size</label>
                <input
                  type="number"
                  value={form.sampleSize}
                  onChange={e => setForm(f => ({ ...f, sampleSize: e.target.value }))}
                  placeholder="Number of patients"
                  min="1"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                {editingId ? 'Update Record' : 'Save Outcome'}
              </button>
              <button type="button" onClick={resetForm} className="px-5 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* View Tabs */}
      <div className="flex gap-1 mb-6">
        {(['chart', 'table', 'summary'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Charts Tab */}
      {activeTab === 'chart' && (
        <div>
          {uniqueMetrics.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">No outcome data yet. Record your first outcome above.</p>
            </div>
          ) : (
            chartMetrics.map(metricName => {
              const data = groupedByMetric[metricName];
              return renderChart(metricName, data);
            })
          )}
        </div>
      )}

      {/* Table Tab */}
      {activeTab === 'table' && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Metric</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Value</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Treatment</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Period</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Sample</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOutcomes.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">No records found</td></tr>
              ) : filteredOutcomes
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map(outcome => (
                  <tr key={outcome.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${METRIC_DEFINITIONS.find(m => m.name === outcome.metricName)?.color || 'text-gray-900 dark:text-white'}`}>
                        {outcome.metricName}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{outcome.metricValue}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 capitalize">{outcome.treatmentType.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{outcome.measurementPeriod || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{outcome.sampleSize ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{new Date(outcome.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => editOutcome(outcome)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Edit</button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Tab */}
      {activeTab === 'summary' && (
        <div>
          {uniqueMetrics.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">No outcome data to summarize.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {METRIC_DEFINITIONS.filter(m => groupedByMetric[m.name]?.length > 0).map(metric => {
                const comparison = getBeforeAfter(metric.name);
                if (!comparison) return null;
                const { before, after, change, improvement, count } = comparison;
                const def = METRIC_DEFINITIONS.find(d => d.name === metric.name);
                return (
                  <div key={metric.name} className={`bg-white dark:bg-gray-900 border-t-4 ${METRIC_COLORS[metric.name]} rounded-xl p-5 shadow-sm`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className={`text-base font-bold ${metric.color}`}>{metric.name}</h4>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{count} records</span>
                    </div>
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Before</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{before}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">After</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{after}</span>
                      </div>
                      <div className="flex justify-between text-sm pt-2 border-t border-gray-100 dark:border-gray-800">
                        <span className="text-gray-500 dark:text-gray-400">Change</span>
                        <span className={`font-bold ${improvement ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {change > 0 ? '+' : ''}{change.toFixed(1)}
                          <span className="text-xs ml-1">{improvement ? 'improved' : 'no improvement'}</span>
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 italic">{metric.description}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
