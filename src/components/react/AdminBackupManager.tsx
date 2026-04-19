import { useState, useEffect, useCallback } from 'react';

interface BackupSchedule {
  id: string;
  name: string;
  type: string;
  frequency: string;
  retentionCount: number;
  enabled: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
}

interface Backup {
  id: string;
  name: string;
  type: string;
  status: string;
  sizeBytes: number | null;
  location: string | null;
  scheduledAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

type TabKey = 'list' | 'schedule' | 'restore';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'list', label: 'Backup List' },
  { key: 'schedule', label: 'Schedule Config' },
  { key: 'restore', label: 'Restore' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  running: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
};

const FREQUENCY_OPTIONS = [
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

function formatBytes(bytes: number | null) {
  if (!bytes) return 'N/A';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDate(iso: string | null) {
  if (!iso) return 'N/A';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

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

export default function AdminBackupManager() {
  const [tab, setTab] = useState<TabKey>('list');
  const [backups, setBackups] = useState<Backup[]>([]);
  const [schedules, setSchedules] = useState<BackupSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<BackupSchedule | null>(null);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [saving, setSaving] = useState(false);
  const [runningBackup, setRunningBackup] = useState(false);

  const [scheduleName, setScheduleName] = useState('');
  const [scheduleType, setScheduleType] = useState('full');
  const [scheduleFrequency, setScheduleFrequency] = useState('daily');
  const [scheduleRetention, setScheduleRetention] = useState('7');
  const [scheduleEnabled, setScheduleEnabled] = useState(true);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [bRes, sRes] = await Promise.all([
        fetch('/api/admin/backups'),
        fetch('/api/admin/backup-schedules'),
      ]);
      if (bRes.status === 401) { window.location.href = '/admin/login'; return; }
      if (!bRes.ok || !sRes.ok) throw new Error('Failed to fetch data');
      const [bJson, sJson] = await Promise.all([bRes.json(), sRes.json()]);
      setBackups(bJson.data || []);
      setSchedules(sJson.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function triggerManualBackup() {
    setRunningBackup(true);
    try {
      const res = await fetch('/api/admin/backups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      if (!res.ok) throw new Error('Failed to trigger backup');
      showToast('success', 'Backup initiated');
      fetchData();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to start backup');
    } finally {
      setRunningBackup(false);
    }
  }

  function openScheduleModal(s?: BackupSchedule) {
    if (s) {
      setEditingSchedule(s);
      setScheduleName(s.name);
      setScheduleType(s.type);
      setScheduleFrequency(s.frequency);
      setScheduleRetention(String(s.retentionCount));
      setScheduleEnabled(s.enabled);
    } else {
      setEditingSchedule(null);
      setScheduleName('');
      setScheduleType('full');
      setScheduleFrequency('daily');
      setScheduleRetention('7');
      setScheduleEnabled(true);
    }
    setShowScheduleModal(true);
  }

  async function saveSchedule() {
    if (!scheduleName) { showToast('error', 'Name is required'); return; }
    setSaving(true);
    try {
      const body = { name: scheduleName, type: scheduleType, frequency: scheduleFrequency, retentionCount: Number(scheduleRetention), enabled: scheduleEnabled };
      const url = editingSchedule ? `/api/admin/backup-schedules?id=${editingSchedule.id}` : '/api/admin/backup-schedules';
      const method = editingSchedule ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Failed to save schedule');
      showToast('success', 'Schedule saved');
      setShowScheduleModal(false);
      fetchData();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function deleteSchedule(schedule: BackupSchedule) {
    if (!confirm(`Delete schedule "${schedule.name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/backup-schedules?id=${schedule.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setSchedules(schedules.filter(s => s.id !== schedule.id));
      showToast('success', 'Schedule deleted');
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to delete');
    }
  }

  async function toggleSchedule(schedule: BackupSchedule) {
    try {
      const res = await fetch(`/api/admin/backup-schedules?id=${schedule.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !schedule.enabled }),
      });
      if (!res.ok) throw new Error('Failed to toggle');
      showToast('success', schedule.enabled ? 'Schedule paused' : 'Schedule resumed');
      fetchData();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to toggle');
    }
  }

  function openRestoreModal(backup: Backup) {
    setSelectedBackup(backup);
    setShowRestoreModal(true);
  }

  async function confirmRestore() {
    if (!selectedBackup) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/backups/restore?id=${selectedBackup.id}`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to restore');
      showToast('success', 'Restore initiated. Check logs for progress.');
      setShowRestoreModal(false);
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to restore');
    } finally {
      setSaving(false);
    }
  }

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
          <h2 className="text-xl font-semibold text-gray-900">Backup Manager</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage backups, schedules, and restore points</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={triggerManualBackup} disabled={runningBackup}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {runningBackup ? 'Running...' : 'Manual Backup'}
          </button>
          <button onClick={() => fetchData()} className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Refresh
          </button>
        </div>
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
          ) : tab === 'list' ? (
            <div className="space-y-4">
              {backups.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No backups recorded. Run a manual backup to get started.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Size</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Created</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {backups.map(b => (
                        <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{b.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 capitalize">{b.type}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${STATUS_COLORS[b.status] || 'bg-gray-100 text-gray-600'}`}>{b.status}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{formatBytes(b.sizeBytes)}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(b.createdAt)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button onClick={() => openRestoreModal(b)} className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Restore</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : tab === 'schedule' ? (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => openScheduleModal()} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Schedule
                </button>
              </div>

              {schedules.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No backup schedules configured.</div>
              ) : (
                <div className="space-y-3">
                  {schedules.map(s => (
                    <div key={s.id} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-semibold text-gray-900">{s.name}</h4>
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded capitalize">{s.frequency}</span>
                            {!s.enabled && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded">Paused</span>}
                          </div>
                          <p className="text-xs text-gray-500">Retention: {s.retentionCount} copies | Type: {s.type}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                            <span>Last run: {s.lastRunAt ? formatDateTime(s.lastRunAt) : 'Never'}</span>
                            <span>Next run: {s.nextRunAt ? formatDateTime(s.nextRunAt) : 'N/A'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => toggleSchedule(s)} className={`w-10 h-5 rounded-full transition-colors relative ${s.enabled ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${s.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                          </button>
                          <button onClick={() => openScheduleModal(s)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button onClick={() => deleteSchedule(s)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center py-12 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
                <p>Select a backup from the list tab and click Restore to begin recovery.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal open={showScheduleModal} onClose={() => setShowScheduleModal(false)} title={editingSchedule ? 'Edit Schedule' : 'Add Schedule'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Name *</label>
            <input type="text" value={scheduleName} onChange={e => setScheduleName(e.target.value)} placeholder="Daily Database Backup" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Backup Type</label>
            <select value={scheduleType} onChange={e => setScheduleType(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option value="full">Full</option>
              <option value="incremental">Incremental</option>
              <option value="differential">Differential</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
            <select value={scheduleFrequency} onChange={e => setScheduleFrequency(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              {FREQUENCY_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Retention Count</label>
            <input type="number" value={scheduleRetention} onChange={e => setScheduleRetention(e.target.value)} min="1" max="100" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={scheduleEnabled} onChange={e => setScheduleEnabled(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              Enabled
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setShowScheduleModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={saveSchedule} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </div>
      </Modal>

      <Modal open={showRestoreModal} onClose={() => setShowRestoreModal(false)} title="Restore Backup">
        {selectedBackup && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800 font-medium">Restore Confirmation</p>
              <p className="text-sm text-amber-700 mt-1">You are about to restore from backup: <strong>{selectedBackup.name}</strong></p>
              <p className="text-sm text-amber-700 mt-1">Created: {formatDateTime(selectedBackup.createdAt)} | Size: {formatBytes(selectedBackup.sizeBytes)}</p>
              <p className="text-sm text-amber-600 mt-2">This operation may overwrite current data. Are you sure?</p>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button onClick={() => setShowRestoreModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={confirmRestore} disabled={saving} className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50">{saving ? 'Restoring...' : 'Restore Now'}</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
