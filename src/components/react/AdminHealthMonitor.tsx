import { useState, useEffect, useCallback } from 'react';

interface Incident {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  message: string;
  createdAt: string;
  updatedAt: string;
  timeline: { status: string; message: string; timestamp: string }[];
}

interface Maintenance {
  id: string;
  title: string;
  message: string;
  startTime: string;
  endTime: string;
  autoEnable: boolean;
  status: 'scheduled' | 'in_progress' | 'completed';
}

interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  latency: number | null;
  lastCheck: string;
}

interface ErrorLog {
  id: string;
  route: string;
  method: string;
  type: string;
  statusCode: number;
  count: number;
  lastSeen: string;
}

type TabKey = 'incidents' | 'maintenance' | 'health_checks' | 'error_rates';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'incidents', label: 'Incidents' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'health_checks', label: 'Health Checks' },
  { key: 'error_rates', label: 'Error Rates' },
];

const STATUS_COLORS: Record<string, string> = {
  healthy: 'bg-emerald-100 text-emerald-700',
  degraded: 'bg-amber-100 text-amber-700',
  down: 'bg-red-100 text-red-700',
  unknown: 'bg-gray-100 text-gray-500',
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-600 text-white',
  high: 'bg-amber-500 text-white',
  medium: 'bg-yellow-500 text-gray-900',
  low: 'bg-blue-100 text-blue-700',
};

const INCIDENT_STATUS_COLORS: Record<string, string> = {
  investigating: 'bg-red-100 text-red-700',
  identified: 'bg-amber-100 text-amber-700',
  monitoring: 'bg-blue-100 text-blue-700',
  resolved: 'bg-emerald-100 text-emerald-700',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
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

export default function AdminHealthMonitor() {
  const [tab, setTab] = useState<TabKey>('incidents');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [maintenanceWindows, setMaintenanceWindows] = useState<Maintenance[]>([]);
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [errorFilter, setErrorFilter] = useState('');
  const [saving, setSaving] = useState(false);

  // Incident form
  const [incidentTitle, setIncidentTitle] = useState('');
  const [incidentSeverity, setIncidentSeverity] = useState<'critical' | 'high' | 'medium' | 'low'>('medium');
  const [incidentMessage, setIncidentMessage] = useState('');

  // Maintenance form
  const [maintTitle, setMaintTitle] = useState('');
  const [maintMessage, setMaintMessage] = useState('');
  const [maintStart, setMaintStart] = useState('');
  const [maintEnd, setMaintEnd] = useState('');
  const [maintAutoEnable, setMaintAutoEnable] = useState(true);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const endpoint = tab === 'incidents' ? '/api/admin/incidents'
        : tab === 'maintenance' ? '/api/admin/maintenance'
        : tab === 'health_checks' ? '/api/admin/health-checks'
        : '/api/admin/error-rates';

      const res = await fetch(endpoint);
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to fetch data');

      const json = await res.json();
      if (tab === 'incidents') setIncidents(json.data || []);
      else if (tab === 'maintenance') setMaintenanceWindows(json.data || []);
      else if (tab === 'health_checks') setHealthChecks(json.data || []);
      else setErrorLogs(json.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const activeIncident = incidents.find(i => i.status !== 'resolved');

  async function createIncident() {
    if (!incidentTitle || !incidentMessage) { showToast('error', 'Title and message are required'); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: incidentTitle, severity: incidentSeverity, message: incidentMessage, status: 'investigating' }),
      });
      if (!res.ok) throw new Error('Failed to create incident');
      showToast('success', 'Incident created');
      setShowIncidentModal(false);
      fetchData();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to create incident');
    } finally {
      setSaving(false);
    }
  }

  async function updateIncidentStatus(id: string, status: Incident['status']) {
    try {
      const res = await fetch(`/api/admin/incidents?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update incident');
      showToast('success', `Incident ${status}`);
      fetchData();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to update incident');
    }
  }

  async function createMaintenance() {
    if (!maintTitle || !maintStart || !maintEnd) { showToast('error', 'Title, start, and end times are required'); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: maintTitle, message: maintMessage, startTime: maintStart, endTime: maintEnd, autoEnable: maintAutoEnable }),
      });
      if (!res.ok) throw new Error('Failed to create maintenance');
      showToast('success', 'Maintenance window scheduled');
      setShowMaintenanceModal(false);
      fetchData();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to create maintenance');
    } finally {
      setSaving(false);
    }
  }

  const filteredErrors = errorFilter
    ? errorLogs.filter(e => e.type.toLowerCase().includes(errorFilter.toLowerCase()))
    : errorLogs;

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.message}
        </div>
      )}

      {/* Active Incident Banner */}
      {activeIncident && (
        <div className={`rounded-xl px-5 py-4 ${activeIncident.severity === 'critical' ? 'bg-red-600 text-white' : activeIncident.severity === 'high' ? 'bg-amber-500 text-white' : 'bg-yellow-500 text-gray-900'}`}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
              <div>
                <p className="font-semibold">{activeIncident.title}</p>
                <p className="text-sm opacity-90">{activeIncident.message}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs font-medium rounded ${INCIDENT_STATUS_COLORS[activeIncident.status]} bg-white/20`}>
                {activeIncident.status}
              </span>
              <select
                value={activeIncident.status}
                onChange={e => updateIncidentStatus(activeIncident.id, e.target.value as Incident['status'])}
                className="text-sm bg-white/20 border-0 rounded px-2 py-1 text-white"
              >
                <option value="investigating">Investigating</option>
                <option value="identified">Identified</option>
                <option value="monitoring">Monitoring</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>
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
          <h2 className="text-xl font-semibold text-gray-900">Operations / Health Monitor</h2>
          <p className="text-sm text-gray-500 mt-0.5">Monitor incidents, maintenance, and system health</p>
        </div>
        <button onClick={fetchData} className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Tabs */}
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
 ) : tab === 'incidents' ? (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => { setIncidentTitle(''); setIncidentSeverity('medium'); setIncidentMessage(''); setShowIncidentModal(true); }} className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Incident
                </button>
              </div>

              {incidents.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No incidents recorded.</div>
              ) : (
                <div className="space-y-4">
                  {incidents.map(incident => (
                    <div key={incident.id} className={`border rounded-xl p-5 ${incident.status !== 'resolved' ? 'border-red-200' : 'border-gray-200'}`}>
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${SEVERITY_COLORS[incident.severity]}`}>
                            {incident.severity}
                          </span>
                          <h4 className="text-sm font-semibold text-gray-900">{incident.title}</h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${INCIDENT_STATUS_COLORS[incident.status]}`}>
                            {incident.status}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">{formatDate(incident.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{incident.message}</p>

                      {incident.timeline && incident.timeline.length > 0 && (
                        <div className="border-t border-gray-100 pt-3 mt-3">
                          <p className="text-xs font-medium text-gray-500 uppercase mb-2">Timeline</p>
                          <div className="space-y-2">
                            {incident.timeline.map((entry, idx) => (
                              <div key={idx} className="flex items-start gap-3 text-sm">
                                <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5" />
                                <div>
                                  <span className="font-medium text-gray-900">{entry.status}</span>
                                  <span className="text-gray-500 mx-2">-</span>
                                  <span className="text-gray-600">{entry.message}</span>
                                  <span className="text-xs text-gray-400 ml-2">{formatTime(entry.timestamp)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {incident.status !== 'resolved' && (
                        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                          {['investigating', 'identified', 'monitoring', 'resolved'].filter(s => s !== incident.status).map(status => (
                            <button key={status} onClick={() => updateIncidentStatus(incident.id, status as Incident['status'])} className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors capitalize">
                              Mark as {status}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
 ) : tab === 'maintenance' ? (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => { setMaintTitle(''); setMaintMessage(''); setMaintStart(''); setMaintEnd(''); setMaintAutoEnable(true); setShowMaintenanceModal(true); }} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Schedule Maintenance
                </button>
              </div>

              {maintenanceWindows.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No maintenance windows scheduled.</div>
              ) : (
                <div className="space-y-3">
                  {maintenanceWindows.map(maint => (
                    <div key={maint.id} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900">{maint.title}</h4>
                          <p className="text-xs text-gray-500 mt-1">{maint.message}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>Start: {new Date(maint.startTime).toLocaleString()}</span>
                            <span>End: {new Date(maint.endTime).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${maint.status === 'in_progress' ? 'bg-amber-100 text-amber-700' : maint.status === 'completed' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'}`}>
                            {maint.status.replace('_', ' ')}
                          </span>
                          <p className="text-xs text-gray-400 mt-1">
                            Auto-enable: {maint.autoEnable ? 'Yes' : 'No'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
 ) : tab === 'health_checks' ? (
            <div className="space-y-4">
              {healthChecks.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No health check data.</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {healthChecks.map(check => (
                    <div key={check.service} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">{check.service}</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${STATUS_COLORS[check.status]}`}>
                          {check.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        <p>Latency: {check.latency !== null ? `${check.latency}ms` : 'N/A'}</p>
                        <p>Last check: {check.lastCheck ? formatTime(check.lastCheck) : 'Never'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
 ) : tab === 'error_rates' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  value={errorFilter}
                  onChange={e => setErrorFilter(e.target.value)}
                  placeholder="Filter by error type..."
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {filteredErrors.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No errors recorded.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Route</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Method</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Error Type</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Count</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Last Seen</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredErrors.map(log => (
                        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-mono text-gray-900">{log.route}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${log.method === 'GET' ? 'bg-blue-100 text-blue-700' : log.method === 'POST' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                              {log.method}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-red-600">{log.type}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{log.statusCode}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{log.count.toLocaleString()}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{formatTime(log.lastSeen)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">Select a tab</div>
          )}
        </div>
      </div>

      {/* Create Incident Modal */}
      <Modal open={showIncidentModal} onClose={() => setShowIncidentModal(false)} title="Create Incident">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input type="text" value={incidentTitle} onChange={e => setIncidentTitle(e.target.value)} placeholder="Database connection issues" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
            <select value={incidentSeverity} onChange={e => setIncidentSeverity(e.target.value as typeof incidentSeverity)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
            <textarea value={incidentMessage} onChange={e => setIncidentMessage(e.target.value)} rows={3} placeholder="Describe the incident..." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setShowIncidentModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={createIncident} disabled={saving} className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50">Create</button>
          </div>
        </div>
      </Modal>

      {/* Schedule Maintenance Modal */}
      <Modal open={showMaintenanceModal} onClose={() => setShowMaintenanceModal(false)} title="Schedule Maintenance">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input type="text" value={maintTitle} onChange={e => setMaintTitle(e.target.value)} placeholder="Database upgrade" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea value={maintMessage} onChange={e => setMaintMessage(e.target.value)} rows={2} placeholder="Service will be unavailable..." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start *</label>
              <input type="datetime-local" value={maintStart} onChange={e => setMaintStart(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End *</label>
              <input type="datetime-local" value={maintEnd} onChange={e => setMaintEnd(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={maintAutoEnable} onChange={e => setMaintAutoEnable(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              Auto-enable services after maintenance
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setShowMaintenanceModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={createMaintenance} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">Schedule</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
