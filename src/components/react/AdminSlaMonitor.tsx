import { useState, useEffect, useCallback } from 'react';

interface SlaMetric {
  id: string;
  period: string;
  uptimePercent: string;
  incidentCount: number;
  totalDowntimeMinutes: number;
  affectedUsers: number;
  resolvedWithinRto: boolean;
  complianceStatus: string;
  createdAt: string;
}

type TabKey = 'dashboard' | 'incidents' | 'reports';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'dashboard', label: 'SLA Dashboard' },
  { key: 'incidents', label: 'Incident Impact' },
  { key: 'reports', label: 'Export Reports' },
];

const COMPLIANCE_COLORS: Record<string, string> = {
  met: 'bg-emerald-100 text-emerald-700',
  partial: 'bg-amber-100 text-amber-700',
  missed: 'bg-red-100 text-red-700',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminSlaMonitor() {
  const [tab, setTab] = useState<TabKey>('dashboard');
  const [metrics, setMetrics] = useState<SlaMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [exporting, setExporting] = useState(false);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/sla-metrics');
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to fetch data');
      const json = await res.json();
      setMetrics(json.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function exportReport(format: 'csv' | 'pdf') {
    setExporting(true);
    try {
      const res = await fetch(`/api/admin/sla-metrics/export?format=${format}`);
      if (!res.ok) throw new Error('Failed to export');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sla-report-${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('success', `Report exported as ${format.toUpperCase()}`);
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to export');
    } finally {
      setExporting(false);
    }
  }

  const latestMetric = metrics[0] || null;
  const uptimeValue = latestMetric ? parseFloat(latestMetric.uptimePercent) : null;
  const uptimeDisplay = uptimeValue !== null ? `${uptimeValue.toFixed(3)}%` : 'N/A';
  const totalIncidents = metrics.reduce((sum, m) => sum + m.incidentCount, 0);
  const totalDowntime = metrics.reduce((sum, m) => sum + m.totalDowntimeMinutes, 0);
  const metCount = metrics.filter(m => m.complianceStatus === 'met').length;

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.message}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-800 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700 text-xs font-medium ml-3">Dismiss</button>
        </div>
      )}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">SLA Monitor</h2>
          <p className="text-sm text-gray-500 mt-0.5">Service level compliance and uptime tracking</p>
        </div>
        <button onClick={() => fetchData()} className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex gap-1 px-4">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
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
          ) : tab === 'dashboard' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-indigo-50 rounded-xl p-4">
                  <p className="text-xs font-medium text-indigo-600 uppercase">Uptime</p>
                  <p className="text-2xl font-bold text-indigo-900 mt-1">{uptimeDisplay}</p>
                  <p className="text-xs text-indigo-500">Current period</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-xs font-medium text-blue-600 uppercase">Incidents</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">{totalIncidents}</p>
                  <p className="text-xs text-blue-500">Total recorded</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-4">
                  <p className="text-xs font-medium text-amber-600 uppercase">Downtime</p>
                  <p className="text-2xl font-bold text-amber-900 mt-1">{totalDowntime}m</p>
                  <p className="text-xs text-amber-500">Total minutes</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4">
                  <p className="text-xs font-medium text-emerald-600 uppercase">Compliance</p>
                  <p className="text-2xl font-bold text-emerald-900 mt-1">{metCount}/{metrics.length}</p>
                  <p className="text-xs text-emerald-500">Periods met SLA</p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl p-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Uptime Gauge</h4>
                <div className="relative w-48 h-48 mx-auto">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#6366f1" strokeWidth="8"
                      strokeDasharray={`${((uptimeValue ?? 99.9) / 100) * 251.2} 251.2`}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{uptimeDisplay}</p>
                      <p className="text-xs text-gray-500">Uptime</p>
                    </div>
                  </div>
                </div>
              </div>

              {metrics.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Period</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Uptime</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Incidents</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Downtime</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Affected Users</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {metrics.slice(0, 20).map(m => (
                        <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{m.period}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{parseFloat(m.uptimePercent).toFixed(3)}%</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{m.incidentCount}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{m.totalDowntimeMinutes}m</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{m.affectedUsers}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${COMPLIANCE_COLORS[m.complianceStatus] || 'bg-gray-100 text-gray-600'}`}>
                              {m.complianceStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : tab === 'incidents' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-red-50 rounded-xl p-4">
                  <p className="text-xs font-medium text-red-600 uppercase">Critical Incidents</p>
                  <p className="text-2xl font-bold text-red-900 mt-1">{metrics.filter(m => m.incidentCount > 0).length}</p>
                  <p className="text-xs text-red-500">Total impacting SLA</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-4">
                  <p className="text-xs font-medium text-amber-600 uppercase">Avg Downtime</p>
                  <p className="text-2xl font-bold text-amber-900 mt-1">{metrics.length > 0 ? Math.round(totalDowntime / metrics.length) : 0}m</p>
                  <p className="text-xs text-amber-500">Per incident</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-xs font-medium text-blue-600 uppercase">Avg Affected Users</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">
                    {metrics.length > 0 ? Math.round(metrics.reduce((sum, m) => sum + m.affectedUsers, 0) / metrics.length) : 0}
                  </p>
                  <p className="text-xs text-blue-500">Per incident</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Period</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Incidents</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Downtime</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Affected Users</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Within RTO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {metrics.slice(0, 20).map(m => (
                      <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{m.period}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{m.incidentCount}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{m.totalDowntimeMinutes}m</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{m.affectedUsers}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${m.resolvedWithinRto ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {m.resolvedWithinRto ? 'Yes' : 'No'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex gap-3">
                <button onClick={() => exportReport('csv')} disabled={exporting} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export CSV
                </button>
                <button onClick={() => exportReport('pdf')} disabled={exporting} className="px-4 py-2 border border-gray-300 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Export PDF
                </button>
              </div>

              <div className="border border-gray-200 rounded-xl p-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">SLA Report Summary</h4>
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Report Generated</dt>
                    <dd className="text-sm font-medium text-gray-900">{new Date().toLocaleString()}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Periods Covered</dt>
                    <dd className="text-sm font-medium text-gray-900">{metrics.length}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Total Incidents</dt>
                    <dd className="text-sm font-medium text-gray-900">{totalIncidents}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Total Downtime</dt>
                    <dd className="text-sm font-medium text-gray-900">{totalDowntime} minutes</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">SLA Compliance Rate</dt>
                    <dd className="text-sm font-medium text-emerald-600">{metrics.length > 0 ? ((metCount / metrics.length) * 100).toFixed(1) : 0}%</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Average Uptime</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {metrics.length > 0 ? (metrics.reduce((sum, m) => sum + parseFloat(m.uptimePercent), 0) / metrics.length).toFixed(3) : 0}%
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
