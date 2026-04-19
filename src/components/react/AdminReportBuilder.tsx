import { useState, useCallback } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Metric {
  id: string;
  label: string;
  category: 'leads' | 'revenue' | 'engagement' | 'clinical';
}

interface ReportFilter {
  entityType: 'clinic' | 'doctor' | 'treatment' | 'all';
  entityIds: string[];
  dateRange: { start: string; end: string };
}

interface SavedReport {
  id: string;
  name: string;
  metrics: string[];
  filters: ReportFilter;
  schedule?: { frequency: 'daily' | 'weekly' | 'monthly'; recipients: string[] };
}

interface ReportResult {
  rows: Record<string, (string | number)[]>;
  summary: Record<string, number>;
}

const AVAILABLE_METRICS: Metric[] = [
  // Leads
  { id: 'lead_count', label: 'Total Leads', category: 'leads' },
  { id: 'lead_enquiry', label: 'Specialist Enquiries', category: 'leads' },
  { id: 'lead_magnet', label: 'Lead Magnet Responses', category: 'leads' },
  { id: 'lead_quiz', label: 'Quiz Completions', category: 'leads' },
  // Revenue
  { id: 'mrr', label: 'Monthly Recurring Revenue', category: 'revenue' },
  { id: 'arr', label: 'Annual Recurring Revenue', category: 'revenue' },
  { id: 'new_subs', label: 'New Subscriptions', category: 'revenue' },
  { id: 'churned_subs', label: 'Churned Subscriptions', category: 'revenue' },
  // Engagement
  { id: 'page_views', label: 'Page Views', category: 'engagement' },
  { id: 'unique_visitors', label: 'Unique Visitors', category: 'engagement' },
  { id: 'review_count', label: 'Reviews Submitted', category: 'engagement' },
  { id: 'claim_rate', label: 'Clinic Claim Rate', category: 'engagement' },
  // Clinical
  { id: 'clinic_signups', label: 'New Clinic Signups', category: 'clinical' },
  { id: 'doctor_approvals', label: 'Doctor Approvals', category: 'clinical' },
  { id: 'booking_rate', label: 'Booking Rate', category: 'clinical' },
];

const DATE_PRESETS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'This month', days: -1 },
  { label: 'Last month', days: -2 },
  { label: 'Custom', days: 0 },
];

const ENTITY_TYPES = [
  { value: 'all', label: 'All Entities' },
  { value: 'clinic', label: 'Clinics' },
  { value: 'doctor', label: 'Doctors' },
  { value: 'treatment', label: 'Treatments' },
];

function MetricChip({ metric, selected, onToggle }: { metric: Metric; selected: boolean; onToggle: () => void }) {
  const colors: Record<string, string> = {
    leads: 'bg-violet-100 text-violet-700 border-violet-200',
    revenue: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    engagement: 'bg-blue-100 text-blue-700 border-blue-200',
    clinical: 'bg-amber-100 text-amber-700 border-amber-200',
  };
  const catColor = colors[metric.category] || 'bg-gray-100 text-gray-700 border-gray-200';
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${catColor} ${
        selected ? 'ring-2 ring-violet-400 ring-offset-1' : 'hover:opacity-80'
      }`}
    >
      {selected && (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      )}
      {metric.label}
    </button>
  );
}

function TextBarChart({ label, value, max, color = 'bg-violet-500' }: { label: string; value: number; max: number; color?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-36 shrink-0 truncate">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-5">
        <div className={`h-5 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-900 w-16 text-right shrink-0">{value.toLocaleString()}</span>
    </div>
  );
}

function generateMockData(metrics: string[]): ReportResult {
  const rows: Record<string, (string | number)[]> = {};
  const days = 14;
  const dates = Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return d.toISOString().slice(0, 10);
  });
  rows['date'] = dates;
  const summary: Record<string, number> = {};
  metrics.forEach((mid) => {
    const base = Math.floor(Math.random() * 500) + 50;
    rows[mid] = dates.map(() => Math.floor(base * (0.5 + Math.random())));
    summary[mid] = rows[mid].reduce((s: number, v: number) => s + v, 0);
  });
  return { rows, summary };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminReportBuilder() {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['lead_count', 'page_views']);
  const [entityType, setEntityType] = useState<'clinic' | 'doctor' | 'treatment' | 'all'>('all');
  const [entityIds, setEntityIds] = useState<string[]>([]);
  const [datePreset, setDatePreset] = useState(30);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [reportName, setReportName] = useState('');
  const [scheduleFreq, setScheduleFreq] = useState<'daily' | 'weekly' | 'monthly' | 'none'>('none');
  const [recipients, setRecipients] = useState('');
  const [results, setResults] = useState<ReportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [activeTab, setActiveTab] = useState<'build' | 'schedule'>('build');

  const toggleMetric = useCallback((id: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  }, []);

  const getDateRange = useCallback(() => {
    const end = new Date();
    let start = new Date();
    if (datePreset === -1) {
      start = new Date(end.getFullYear(), end.getMonth(), 1);
    } else if (datePreset === -2) {
      start = new Date(end.getFullYear(), end.getMonth() - 1, 1);
      end.setDate(0);
    } else if (datePreset > 0) {
      start.setDate(start.getDate() - datePreset);
    } else {
      start = customStart ? new Date(customStart) : new Date(Date.now() - 30 * 86400000);
      end.setTime(customEnd ? new Date(customEnd).getTime() + 86400000 : Date.now());
    }
    return { start: start.toISOString(), end: end.toISOString() };
  }, [datePreset, customStart, customEnd]);

  const runReport = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      const data = generateMockData(selectedMetrics);
      setResults(data);
      setLoading(false);
    }, 600);
  }, [selectedMetrics]);

  const exportCSV = useCallback(() => {
    if (!results) return;
    const headers = Object.keys(results.rows).join(',');
    const dateRange = getDateRange();
    const startStr = dateRange.start.slice(0, 10);
    const endStr = dateRange.end.slice(0, 10);
    const lines = [headers];
    const len = (results.rows['date'] as string[]).length;
    for (let i = 0; i < len; i++) {
      const row = Object.values(results.rows).map((arr) => String(arr[i])).join(',');
      lines.push(row);
    }
    lines.push('');
    lines.push(`Summary (${startStr} to ${endStr})`);
    Object.entries(results.summary).forEach(([k, v]) => {
      const label = AVAILABLE_METRICS.find((m) => m.id === k)?.label || k;
      lines.push(`${label},${v}`);
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${startStr}-to-${endStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [results, getDateRange]);

  const saveReport = useCallback(() => {
    if (!reportName.trim()) return;
    const report: SavedReport = {
      id: Date.now().toString(),
      name: reportName,
      metrics: [...selectedMetrics],
      filters: {
        entityType,
        entityIds: [...entityIds],
        dateRange: getDateRange(),
      },
      schedule: scheduleFreq !== 'none' ? { frequency: scheduleFreq, recipients: recipients.split(',').map((r) => r.trim()).filter(Boolean) } : undefined,
    };
    setSavedReports((prev) => [report, ...prev]);
    setReportName('');
  }, [reportName, selectedMetrics, entityType, entityIds, scheduleFreq, recipients, getDateRange]);

  const loadReport = useCallback((report: SavedReport) => {
    setSelectedMetrics(report.metrics);
    setEntityType(report.filters.entityType);
    setEntityIds(report.filters.entityIds);
    setActiveTab('build');
  }, []);

  const metricLabel = (id: string) => AVAILABLE_METRICS.find((m) => m.id === id)?.label || id;
  const groups = ['leads', 'revenue', 'engagement', 'clinical'] as const;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Report Builder</h1>
          <p className="text-gray-500 mt-1">Create and schedule custom analytics reports</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('build')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'build'
                ? 'bg-violet-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Build Report
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'schedule'
                ? 'bg-violet-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Scheduled
          </button>
        </div>
      </div>

      {activeTab === 'build' ? (
        <>
          {/* Metric Selection — drag-and-drop style grid */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Select Metrics</h2>
            <p className="text-xs text-gray-400 mb-4">Click metrics to include them in your report. Selected metrics appear at the top.</p>
            <div className="space-y-4">
              {groups.map((cat) => {
                const catMetrics = AVAILABLE_METRICS.filter((m) => m.category === cat);
                const selectedInCat = catMetrics.filter((m) => selectedMetrics.includes(m.id));
                return (
                  <div key={cat}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-block w-2 h-2 rounded-full ${
                        cat === 'leads' ? 'bg-violet-500' : cat === 'revenue' ? 'bg-emerald-500' : cat === 'engagement' ? 'bg-blue-500' : 'bg-amber-500'
                      }`} />
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{cat}</span>
                      {selectedInCat.length > 0 && (
                        <span className="text-xs bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full">{selectedInCat.length}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {catMetrics.map((m) => (
                        <MetricChip
                          key={m.id}
                          metric={m}
                          selected={selectedMetrics.includes(m.id)}
                          onToggle={() => toggleMetric(m.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Date Range */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Date Range</h2>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {DATE_PRESETS.map((p) => (
                  <button
                    key={p.days}
                    onClick={() => setDatePreset(p.days)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                      datePreset === p.days
                        ? 'bg-violet-600 text-white'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              {datePreset === 0 && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Start Date</label>
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">End Date</label>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Entity Filter */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Filter by Entity</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Entity Type</label>
                  <select
                    value={entityType}
                    onChange={(e) => setEntityType(e.target.value as typeof entityType)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                  >
                    {ENTITY_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                {entityType !== 'all' && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Entity IDs (comma-separated)</label>
                    <textarea
                      value={entityIds.join(', ')}
                      onChange={(e) => setEntityIds(e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                      placeholder="e.g. clinic-001, clinic-002"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Save Report */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Save Report</h2>
              <div className="space-y-3">
                <input
                  type="text"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="Report name"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Schedule</label>
                  <select
                    value={scheduleFreq}
                    onChange={(e) => setScheduleFreq(e.target.value as typeof scheduleFreq)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                  >
                    <option value="none">No schedule</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                {scheduleFreq !== 'none' && (
                  <input
                    type="text"
                    value={recipients}
                    onChange={(e) => setRecipients(e.target.value)}
                    placeholder="email@example.com, ..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                )}
                <button
                  onClick={saveReport}
                  disabled={!reportName.trim()}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Save Report
                </button>
              </div>
            </div>
          </div>

          {/* Saved Reports */}
          {savedReports.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Saved Reports</h2>
              <div className="space-y-2">
                {savedReports.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{r.name}</p>
                      <p className="text-xs text-gray-400">
                        {r.metrics.length} metrics · {r.schedule ? `Scheduled ${r.schedule.frequency}` : 'On-demand'}
                      </p>
                    </div>
                    <button
                      onClick={() => loadReport(r)}
                      className="text-xs text-violet-600 font-medium hover:text-violet-700"
                    >
                      Load
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Run & Export */}
          <div className="flex gap-3">
            <button
              onClick={runReport}
              disabled={selectedMetrics.length === 0 || loading}
              className="px-6 py-3 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Run Report
                </>
              )}
            </button>
            {results && (
              <>
                <button
                  onClick={exportCSV}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export CSV
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Export PDF
                </button>
              </>
            )}
          </div>

          {/* Results */}
          {results && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-6">Report Results</h2>
              <div className="mb-6">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Summary</h3>
                <div className="space-y-2">
                  {selectedMetrics.map((mid) => {
                    const maxVal = Math.max(...(Object.values(results.rows).filter((_, i) => i > 0).flat() as number[]), 1);
                    return (
                      <TextBarChart
                        key={mid}
                        label={metricLabel(mid)}
                        value={results.summary[mid] ?? 0}
                        max={maxVal || 1}
                        color={mid.includes('revenue') || mid.includes('mrr') || mid.includes('arr') ? 'bg-emerald-500' : mid.includes('review') ? 'bg-amber-500' : 'bg-violet-500'}
                      />
                    );
                  })}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      {selectedMetrics.map((mid) => (
                        <th key={mid} className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{metricLabel(mid)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(results.rows['date'] as string[]).map((date, i) => (
                      <tr key={date} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">{date}</td>
                        {selectedMetrics.map((mid) => (
                          <td key={mid} className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                            {(results.rows[mid] as number[])[i].toLocaleString()}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Schedule Tab */
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Scheduled Reports</h2>
            {savedReports.filter((r) => r.schedule).length === 0 ? (
              <p className="text-gray-400 text-sm">No scheduled reports yet. Save a report with a schedule to see it here.</p>
            ) : (
              <div className="space-y-3">
                {savedReports.filter((r) => r.schedule).map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{r.name}</p>
                      <p className="text-xs text-gray-500 capitalize">
                        {r.schedule!.frequency} · {r.schedule!.recipients.join(', ')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                        r.schedule!.frequency === 'daily' ? 'bg-blue-100 text-blue-700' :
                        r.schedule!.frequency === 'weekly' ? 'bg-violet-100 text-violet-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {r.schedule!.frequency}
                      </span>
                      <button
                        onClick={() => setSavedReports((prev) => prev.filter((x) => x.id !== r.id))}
                        className="text-xs text-red-500 hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}