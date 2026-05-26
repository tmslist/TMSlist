import { useState, useEffect, useCallback } from 'react';

interface DrConfig {
  id: string;
  name: string;
  rpoMinutes: number;
  rtoMinutes: number;
  failoverEnabled: boolean;
  failoverStatus: string;
  lastDrTestAt: string | null;
  lastDrTestResult: string | null;
  drTestLogs: { timestamp: string; result: string; duration: number; notes?: string }[];
}

type TabKey = 'overview' | 'objectives' | 'failover' | 'test_logs';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'objectives', label: 'RPO / RTO' },
  { key: 'failover', label: 'Failover' },
  { key: 'test_logs', label: 'DR Test Logs' },
];

const FAILOVER_STATUS_COLORS: Record<string, string> = {
  standby: 'bg-[rgba(10,22,40,0.1)] text-[var(--ink)]',
  active: 'bg-emerald-100 text-emerald-700',
  failed_over: 'bg-red-100 text-red-700',
  recovering: 'bg-amber-100 text-amber-700',
};

function formatDateTime(iso: string | null) {
  if (!iso) return 'N/A';
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)]">
          <h3 className="text-lg font-semibold text-[var(--ink)]">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--paper2)] text-[var(--muted)] hover:text-[var(--ink2)]">
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

export default function AdminDisasterRecovery() {
  const [tab, setTab] = useState<TabKey>('overview');
  const [configs, setConfigs] = useState<DrConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showObjectiveModal, setShowObjectiveModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<DrConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [runningTest, setRunningTest] = useState(false);

  const [rpoMinutes, setRpoMinutes] = useState('');
  const [rtoMinutes, setRtoMinutes] = useState('');
  const [testNotes, setTestNotes] = useState('');

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/disaster-recovery');
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to fetch data');
      const json = await res.json();
      setConfigs(json.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function openObjectiveModal(c?: DrConfig) {
    if (c) {
      setEditingConfig(c);
      setRpoMinutes(String(c.rpoMinutes));
      setRtoMinutes(String(c.rtoMinutes));
    } else {
      setEditingConfig(null);
      setRpoMinutes('60');
      setRtoMinutes('240');
    }
    setShowObjectiveModal(true);
  }

  async function saveObjectives() {
    if (!rpoMinutes || !rtoMinutes) { showToast('error', 'RPO and RTO values are required'); return; }
    setSaving(true);
    try {
      const body = { rpoMinutes: Number(rpoMinutes), rtoMinutes: Number(rtoMinutes) };
      const url = editingConfig ? `/api/admin/disaster-recovery?id=${editingConfig.id}` : '/api/admin/disaster-recovery';
      const method = editingConfig ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Failed to save');
      showToast('success', 'Objectives saved');
      setShowObjectiveModal(false);
      fetchData();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function toggleFailover(c: DrConfig) {
    try {
      const res = await fetch(`/api/admin/disaster-recovery/failover?id=${c.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !c.failoverEnabled }),
      });
      if (!res.ok) throw new Error('Failed to toggle failover');
      showToast('success', c.failoverEnabled ? 'Failover disabled' : 'Failover enabled');
      fetchData();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to toggle failover');
    }
  }

  async function triggerDrTest() {
    setRunningTest(true);
    try {
      const res = await fetch('/api/admin/disaster-recovery/test', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to run DR test');
      showToast('success', 'DR test completed. Check test logs for results.');
      setShowTestModal(false);
      setTestNotes('');
      fetchData();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to run DR test');
    } finally {
      setRunningTest(false);
    }
  }

  const primaryConfig = configs[0] || null;

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
          <h2 className="text-xl font-semibold text-[var(--ink)]">Disaster Recovery</h2>
          <p className="text-sm text-[var(--muted)] mt-0.5">RPO, RTO, failover configuration, and DR testing</p>
        </div>
        <button onClick={() => fetchData()} className="px-3 py-2 bg-white border border-[var(--line)] rounded-lg text-sm font-medium text-[var(--ink2)] hover:bg-[var(--paper2)] transition-colors">
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[var(--line)]">
        <div className="border-b border-[var(--line)]">
          <nav className="flex gap-1 px-4">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t.key ? 'border-[rgba(201,101,74,0.2)] text-[var(--warm)]' : 'border-transparent text-[var(--muted)] hover:text-[var(--ink2)]'}`}>
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="inline-block w-8 h-8 border-2 border-[var(--line)] border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : tab === 'overview' ? (
            <div className="space-y-6">
              {primaryConfig ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-[rgba(201,101,74,0.06)] rounded-xl p-4">
                      <p className="text-xs font-medium text-[var(--warm)] uppercase">RPO</p>
                      <p className="text-2xl font-bold text-[var(--warm)] mt-1">{primaryConfig.rpoMinutes}m</p>
                      <p className="text-xs text-[var(--warm)]">Recovery Point Objective</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-4">
                      <p className="text-xs font-medium text-emerald-600 uppercase">RTO</p>
                      <p className="text-2xl font-bold text-emerald-900 mt-1">{primaryConfig.rtoMinutes}m</p>
                      <p className="text-xs text-emerald-500">Recovery Time Objective</p>
                    </div>
                    <div className="bg-[var(--paper2)] rounded-xl p-4">
                      <p className="text-xs font-medium text-[var(--ink)] uppercase">Failover</p>
                      <p className="text-lg font-bold text-[var(--ink)] mt-1 capitalize">{primaryConfig.failoverStatus}</p>
                      <p className="text-xs text-[var(--ink2)]">{primaryConfig.failoverEnabled ? 'Enabled' : 'Disabled'}</p>
                    </div>
                    <div className="bg-[var(--paper2)] rounded-xl p-4">
                      <p className="text-xs font-medium text-[var(--muted)] uppercase">Last Test</p>
                      <p className="text-lg font-bold text-[var(--ink)] mt-1">{primaryConfig.lastDrTestResult || 'N/A'}</p>
                      <p className="text-xs text-[var(--muted)]">{formatDateTime(primaryConfig.lastDrTestAt)}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => openObjectiveModal(primaryConfig)} className="px-4 py-2 bg-[var(--ink2)] text-white text-sm font-medium rounded-lg hover:bg-[var(--ink2)] transition-colors">
                      Edit Objectives
                    </button>
                    <button onClick={() => { setShowTestModal(true); }} className="px-4 py-2 border border-[var(--line)] text-sm font-medium text-[var(--ink2)] rounded-lg hover:bg-[var(--paper2)] transition-colors">
                      Run DR Test
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-[var(--muted)]">
                  <p>No DR configuration found.</p>
                  <button onClick={() => openObjectiveModal()} className="mt-3 px-4 py-2 bg-[var(--ink2)] text-white text-sm font-medium rounded-lg hover:bg-[var(--ink2)]">Create Configuration</button>
                </div>
              )}
            </div>
          ) : tab === 'objectives' ? (
            <div className="space-y-6">
              <div className="flex justify-end">
                <button onClick={() => openObjectiveModal(primaryConfig)} className="px-4 py-2 bg-[var(--ink2)] text-white text-sm font-medium rounded-lg hover:bg-[var(--ink2)] transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Configure Objectives
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-[var(--line)] rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-[rgba(201,101,74,0.1)] rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-[var(--warm)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[var(--ink)]">RPO (Recovery Point Objective)</h4>
                      <p className="text-xs text-[var(--muted)]">Maximum acceptable data loss</p>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-[var(--warm)]">{primaryConfig?.rpoMinutes || 60}m</div>
                  <p className="text-xs text-[var(--muted)] mt-1">How much data can be lost in a disaster</p>
                </div>

                <div className="border border-[var(--line)] rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[var(--ink)]">RTO (Recovery Time Objective)</h4>
                      <p className="text-xs text-[var(--muted)]">Maximum acceptable downtime</p>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-emerald-600">{primaryConfig?.rtoMinutes || 240}m</div>
                  <p className="text-xs text-[var(--muted)] mt-1">How long the system can be unavailable</p>
                </div>
              </div>
            </div>
          ) : tab === 'failover' ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between border border-[var(--line)] rounded-xl p-6">
                <div>
                  <h4 className="text-sm font-semibold text-[var(--ink)]">Automatic Failover</h4>
                  <p className="text-xs text-[var(--muted)] mt-1">Enable automatic failover to DR site when primary fails</p>
                </div>
                {primaryConfig && (
                  <button onClick={() => toggleFailover(primaryConfig)} className={`w-12 h-6 rounded-full transition-colors relative ${primaryConfig.failoverEnabled ? 'bg-[var(--ink2)]' : 'bg-[var(--line)]'}`}>
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${primaryConfig.failoverEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                )}
              </div>

              <div className="border border-[var(--line)] rounded-xl p-6">
                <h4 className="text-sm font-semibold text-[var(--ink)] mb-3">Failover Status</h4>
                <div className="flex flex-wrap gap-3">
                  {['standby', 'active', 'failed_over', 'recovering'].map(status => (
                    <div key={status} className={`px-4 py-2 rounded-lg border ${primaryConfig?.failoverStatus === status ? 'border-[rgba(201,101,74,0.2)] bg-[rgba(201,101,74,0.06)]' : 'border-[var(--line)]'}`}>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${FAILOVER_STATUS_COLORS[status]}`}>{status.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[var(--muted)] mt-3">Current status: <strong>{primaryConfig?.failoverStatus || 'Unknown'}</strong></p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => { setTestNotes(''); setShowTestModal(true); }} className="px-4 py-2 bg-[var(--ink2)] text-white text-sm font-medium rounded-lg hover:bg-[var(--ink2)] transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Run DR Test
                </button>
              </div>

              {primaryConfig?.drTestLogs && primaryConfig.drTestLogs.length > 0 ? (
                <div className="space-y-3">
                  {[...primaryConfig.drTestLogs].reverse().map((log, i) => (
                    <div key={i} className="border border-[var(--line)] rounded-xl p-4">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${log.result === 'passed' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {log.result}
                          </span>
                          <span className="text-xs text-[var(--muted)]">{log.duration}ms</span>
                        </div>
                        <span className="text-xs text-[var(--muted)]">{formatDateTime(log.timestamp)}</span>
                      </div>
                      {log.notes && <p className="text-sm text-[var(--ink2)]">{log.notes}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-[var(--muted)]">No DR test logs recorded.</div>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal open={showObjectiveModal} onClose={() => setShowObjectiveModal(false)} title="Configure RPO / RTO">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--ink2)] mb-1">RPO (minutes) *</label>
            <input type="number" value={rpoMinutes} onChange={e => setRpoMinutes(e.target.value)} placeholder="60" className="w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm focus:ring-2 focus:ring-[rgba(10,22,40,0.2)] focus:border-[rgba(201,101,74,0.2)]" />
            <p className="text-xs text-[var(--muted)] mt-1">Maximum acceptable data loss in minutes</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--ink2)] mb-1">RTO (minutes) *</label>
            <input type="number" value={rtoMinutes} onChange={e => setRtoMinutes(e.target.value)} placeholder="240" className="w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm focus:ring-2 focus:ring-[rgba(10,22,40,0.2)] focus:border-[rgba(201,101,74,0.2)]" />
            <p className="text-xs text-[var(--muted)] mt-1">Maximum acceptable downtime in minutes</p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--line)]">
            <button onClick={() => setShowObjectiveModal(false)} className="px-4 py-2 border border-[var(--line)] rounded-lg text-sm font-medium text-[var(--ink2)] hover:bg-[var(--paper2)]">Cancel</button>
            <button onClick={saveObjectives} disabled={saving} className="px-4 py-2 bg-[var(--ink2)] text-white text-sm font-medium rounded-lg hover:bg-[var(--ink2)] disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </div>
      </Modal>

      <Modal open={showTestModal} onClose={() => setShowTestModal(false)} title="Run DR Test">
        <div className="space-y-4">
          <div className="bg-[var(--paper2)] border border-[var(--line)] rounded-lg p-4">
            <p className="text-sm text-[var(--ink)] font-medium">DR Test Notice</p>
            <p className="text-sm text-[var(--ink)] mt-1">Running a DR test will simulate failover procedures. Production data will not be affected.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--ink2)] mb-1">Notes (optional)</label>
            <textarea value={testNotes} onChange={e => setTestNotes(e.target.value)} rows={3} placeholder="Describe what to test..." className="w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm focus:ring-2 focus:ring-[rgba(10,22,40,0.2)] focus:border-[rgba(201,101,74,0.2)] resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--line)]">
            <button onClick={() => setShowTestModal(false)} className="px-4 py-2 border border-[var(--line)] rounded-lg text-sm font-medium text-[var(--ink2)] hover:bg-[var(--paper2)]">Cancel</button>
            <button onClick={triggerDrTest} disabled={runningTest} className="px-4 py-2 bg-[var(--ink2)] text-white text-sm font-medium rounded-lg hover:bg-[var(--ink2)] disabled:opacity-50">{runningTest ? 'Running Test...' : 'Run DR Test'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
