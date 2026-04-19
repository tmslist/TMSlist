import { useState, useCallback, useEffect } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface FailedLogin {
  id: string;
  email: string;
  ipAddress: string;
  userAgent: string;
  attemptedAt: string;
  failureReason: string;
  locked: boolean;
}

interface ActiveSession {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  ipAddress: string;
  userAgent: string;
  lastUsedAt: string;
  expiresAt: string;
  createdAt: string;
}

interface SuspiciousEvent {
  id: string;
  userId: string | null;
  userEmail: string | null;
  action: string;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface IpRule {
  id: string;
  ipAddress: string;
  type: 'block' | 'whitelist';
  reason: string;
  expiresAt: string | null;
  createdAt: string;
  createdBy: string | null;
}

interface TwoFactorStatus {
  email: string;
  totpEnabled: boolean;
  totpVerifiedAt: string | null;
  registeredDevices: number;
  lastLoginAt: string | null;
  failedLoginAttempts: number;
  locked: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatFullTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function getSeverityColor(severity: string): { bg: string; text: string; border: string } {
  switch (severity) {
    case 'critical': return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
    case 'high': return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' };
    case 'medium': return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
    default: return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
  }
}

// ── Modal ──────────────────────────────────────────────────────────────────────

function ConfirmModal({ title, message, onConfirm, onCancel, confirmLabel = 'Confirm', danger = false }: {
  title: string; message: string; onConfirm: () => void; onCancel: () => void;
  confirmLabel?: string; danger?: boolean;
}) {
  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onCancel} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-scale-in">
          <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-500 mb-5">{message}</p>
          <div className="flex justify-end gap-3">
            <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50">Cancel</button>
            <button onClick={onConfirm} className={`px-4 py-2 text-sm font-medium text-white rounded-xl hover:opacity-90 ${danger ? 'bg-red-600' : 'bg-indigo-600'}`}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Toast ──────────────────────────────────────────────────────────────────────

interface Toast { id: string; message: string; type: 'success' | 'error' | 'info'; }

function ToastBar({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-slide-up ${
          t.type === 'success' ? 'bg-emerald-600 text-white' :
          t.type === 'error' ? 'bg-red-600 text-white' :
          'bg-indigo-600 text-white'
        }`}>
          {t.type === 'success' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
          {t.type === 'error' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

type TabKey = 'failed_logins' | 'sessions' | 'suspicious' | 'ip_rules' | 'twofa';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  {
    key: 'failed_logins', label: 'Failed Logins',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  },
  {
    key: 'sessions', label: 'Active Sessions',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  },
  {
    key: 'suspicious', label: 'Suspicious Activity',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  },
  {
    key: 'ip_rules', label: 'IP Rules',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
  {
    key: 'twofa', label: '2FA Status',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  },
];

export default function AdminSecurityDashboard() {
  const [tab, setTab] = useState<TabKey>('failed_logins');
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Data state
  const [failedLogins, setFailedLogins] = useState<FailedLogin[]>([]);
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [suspiciousEvents, setSuspiciousEvents] = useState<SuspiciousEvent[]>([]);
  const [ipRules, setIpRules] = useState<IpRule[]>([]);
  const [twofaUsers, setTwofaUsers] = useState<TwoFactorStatus[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [confirmLogout, setConfirmLogout] = useState<ActiveSession | null>(null);
  const [showIpModal, setShowIpModal] = useState(false);
  const [editingIp, setEditingIp] = useState<IpRule | null>(null);

  // Stats
  const [stats, setStats] = useState({ failedToday: 0, lockedAccounts: 0, activeSessions: 0, suspicious24h: 0 });

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = String(Date.now());
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/security');
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (res.ok) {
        const json = await res.json();
        setFailedLogins(json.failedLogins || []);
        setSessions(json.sessions || []);
        setSuspiciousEvents(json.suspiciousEvents || []);
        setIpRules(json.ipRules || []);
        setTwofaUsers(json.twofaUsers || []);
        if (json.stats) setStats(json.stats);
      }
    } catch { /* fail silently */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Actions
  const handleForceLogout = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/admin/security/session?id=${sessionId}`, { method: 'DELETE' });
      if (res.ok) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        showToast('Session terminated successfully');
      }
    } catch { showToast('Failed to terminate session', 'error'); }
    setConfirmLogout(null);
  };

  const handleAddIpRule = async (data: { ipAddress: string; type: 'block' | 'whitelist'; reason: string; expiresAt: string }) => {
    try {
      const res = await fetch('/api/admin/security/ip-rule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        showToast('IP rule created');
        setShowIpModal(false);
        fetchData();
      }
    } catch { showToast('Failed to create rule', 'error'); }
  };

  const handleDeleteIpRule = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/security/ip-rule?id=${id}`, { method: 'DELETE' });
      if (res.ok) { setIpRules(prev => prev.filter(r => r.id !== id)); showToast('IP rule deleted'); }
    } catch { showToast('Failed to delete rule', 'error'); }
  };

  return (
    <div className="space-y-6">
      <ToastBar toasts={toasts} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Security Dashboard</h1>
          <p className="text-gray-500 mt-1 text-sm">Monitor auth security, sessions, and access controls</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Failed Today', value: stats.failedToday, color: 'text-red-600' },
              { label: 'Locked Accounts', value: stats.lockedAccounts, color: 'text-orange-600' },
              { label: 'Active Sessions', value: stats.activeSessions, color: 'text-blue-600' },
              { label: 'Alerts 24h', value: stats.suspicious24h, color: 'text-amber-600' },
            ].map(stat => (
              <div key={stat.label} className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-center">
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
          <button onClick={fetchData} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Refresh">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex gap-1 px-4 overflow-x-auto">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === t.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
                {t.icon}
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : tab === 'failed_logins' ? (
            <FailedLoginsTab data={failedLogins} />
          ) : tab === 'sessions' ? (
            <SessionsTab data={sessions} onLogout={(s) => setConfirmLogout(s)} />
          ) : tab === 'suspicious' ? (
            <SuspiciousTab data={suspiciousEvents} />
          ) : tab === 'ip_rules' ? (
            <IpRulesTab data={ipRules} onAdd={() => { setEditingIp(null); setShowIpModal(true); }} onEdit={(r) => { setEditingIp(r); setShowIpModal(true); }} onDelete={handleDeleteIpRule} />
          ) : tab === 'twofa' ? (
            <TwoFaTab data={twofaUsers} />
          ) : null}
        </div>
      </div>

      {/* Confirm logout */}
      {confirmLogout && (
        <ConfirmModal
          title="Terminate Session?"
          message={`This will immediately log out ${confirmLogout.userEmail} on all devices. Are you sure?`}
          onConfirm={() => handleForceLogout(confirmLogout.id)}
          onCancel={() => setConfirmLogout(null)}
          confirmLabel="Terminate"
          danger
        />
      )}

      {/* IP Rule modal */}
      {showIpModal && (
        <IpRuleModal
          existing={editingIp}
          onClose={() => { setShowIpModal(false); setEditingIp(null); }}
          onSave={handleAddIpRule}
        />
      )}
    </div>
  );
}

// ── Failed Logins Tab ──────────────────────────────────────────────────────────

function FailedLoginsTab({ data }: { data: FailedLogin[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">Failed Login Attempts</h2>
        <span className="text-xs text-gray-400">{data.length} attempts</span>
      </div>
      {data.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <svg className="w-10 h-10 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">No failed login attempts</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map(entry => (
                <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap" title={formatFullTime(entry.attemptedAt)}>
                    {formatRelativeTime(entry.attemptedAt)}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{entry.email}</td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-600">{entry.ipAddress}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate">{entry.userAgent || 'Unknown'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-red-600 font-medium">{entry.failureReason}</span>
                  </td>
                  <td className="px-4 py-3">
                    {entry.locked ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 px-2 py-1 rounded-full">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        Locked
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">--</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Sessions Tab ───────────────────────────────────────────────────────────────

function SessionsTab({ data, onLogout }: { data: ActiveSession[]; onLogout: (s: ActiveSession) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">Active Sessions</h2>
        <span className="text-xs text-gray-400">{data.length} active</span>
      </div>
      {data.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <svg className="w-10 h-10 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">No active sessions</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map(session => {
            const isExpiring = new Date(session.expiresAt).getTime() - Date.now() < 3600000;
            return (
              <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{session.userEmail}</span>
                      {session.userName && <span className="text-xs text-gray-400">({session.userName})</span>}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" /></svg>
                        {session.ipAddress}
                      </span>
                      <span className="truncate max-w-[180px]" title={session.userAgent}>{session.userAgent || 'Unknown device'}</span>
                      <span>Last active: {formatRelativeTime(session.lastUsedAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs text-gray-400">Expires {formatRelativeTime(session.expiresAt)}</span>
                      {isExpiring && <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded">Expiring soon</span>}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onLogout(session)}
                  className="shrink-0 ml-4 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
                >
                  Force Logout
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Suspicious Activity Tab ───────────────────────────────────────────────────

function SuspiciousTab({ data }: { data: SuspiciousEvent[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">Suspicious Events</h2>
        <span className="text-xs text-gray-400">{data.length} events</span>
      </div>
      {data.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <svg className="w-10 h-10 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">No suspicious activity detected</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map(event => {
            const c = getSeverityColor(event.severity);
            return (
              <div key={event.id} className={`p-4 rounded-xl border ${c.bg} ${c.border}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${c.bg.replace('50', '100')} ${c.text}`}>{event.severity}</span>
                      <span className="text-sm font-medium text-gray-900">{event.action}</span>
                    </div>
                    <div className="text-xs text-gray-600 flex items-center gap-3 flex-wrap">
                      {event.userEmail && <span>User: {event.userEmail}</span>}
                      {event.ipAddress && <span>IP: {event.ipAddress}</span>}
                      <span>{formatRelativeTime(event.createdAt)}</span>
                    </div>
                    {event.metadata && (
                      <pre className="mt-2 text-xs text-gray-500 bg-white/60 rounded-lg p-2 max-h-24 overflow-auto font-mono">
                        {JSON.stringify(event.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── IP Rules Tab ───────────────────────────────────────────────────────────────

function IpRulesTab({ data, onAdd, onEdit, onDelete }: {
  data: IpRule[];
  onAdd: () => void; onEdit: (r: IpRule) => void; onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">IP Access Rules</h2>
        <button onClick={onAdd} className="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Rule
        </button>
      </div>
      {data.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <svg className="w-10 h-10 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
          </svg>
          <p className="text-sm">No IP rules configured</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map(rule => (
                <tr key={rule.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-xs font-mono font-medium text-gray-900">{rule.ipAddress}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${rule.type === 'block' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {rule.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{rule.reason}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{rule.expiresAt ? formatRelativeTime(rule.expiresAt) : 'Never'}</td>
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{formatRelativeTime(rule.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => onEdit(rule)} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50" title="Edit">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => onDelete(rule.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50" title="Delete">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── IP Rule Modal ──────────────────────────────────────────────────────────────

function IpRuleModal({ existing, onClose, onSave }: {
  existing?: IpRule | null;
  onClose: () => void;
  onSave: (data: { ipAddress: string; type: 'block' | 'whitelist'; reason: string; expiresAt: string }) => void;
}) {
  const [ipAddress, setIpAddress] = useState(existing?.ipAddress || '');
  const [type, setType] = useState<'block' | 'whitelist'>(existing?.type || 'block');
  const [reason, setReason] = useState(existing?.reason || '');
  const [expiresAt, setExpiresAt] = useState(existing?.expiresAt ? existing.expiresAt.split('T')[0] : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!ipAddress) { setError('IP address is required'); return; }
    setSaving(true);
    onSave({ ipAddress: ipAddress.trim(), type, reason, expiresAt: expiresAt ? new Date(expiresAt).toISOString() : '' });
    setSaving(false);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900">{existing ? 'Edit IP Rule' : 'Add IP Rule'}</h2>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IP Address *</label>
              <input type="text" value={ipAddress} onChange={e => setIpAddress(e.target.value)} placeholder="e.g. 192.168.1.1 or 10.0.0.0/24"
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rule Type</label>
              <div className="flex gap-2">
                {(['block', 'whitelist'] as const).map(t => (
                  <button key={t} onClick={() => setType(t)} className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border transition-colors ${
                    type === t ? (t === 'block' ? 'bg-red-50 border-red-300 text-red-700' : 'bg-emerald-50 border-emerald-300 text-emerald-700') : 'bg-gray-50 border-gray-200 text-gray-600'
                  }`}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
              <input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="Why this rule was created..."
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expires (optional)</label>
              <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50">Cancel</button>
            <button onClick={handleSubmit} disabled={saving} className="px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
              {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {existing ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── 2FA Tab ────────────────────────────────────────────────────────────────────

function TwoFaTab({ data }: { data: TwoFactorStatus[] }) {
  const enabled = data.filter(u => u.totpEnabled).length;
  const disabled = data.length - enabled;
  const locked = data.filter(u => u.locked).length;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: '2FA Enabled', value: enabled, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
          { label: '2FA Not Enabled', value: disabled, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' },
          { label: 'Locked Accounts', value: locked, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
        ].map(s => (
          <div key={s.label} className={`p-4 rounded-xl border ${s.bg}`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* User table */}
      {data.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">No users found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">2FA Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Devices</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Failed Attempts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map(user => (
                <tr key={user.email} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{user.email}</td>
                  <td className="px-4 py-3">
                    {user.totpEnabled ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        Enabled
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                        Not enabled
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{user.registeredDevices}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{user.lastLoginAt ? formatRelativeTime(user.lastLoginAt) : 'Never'}</td>
                  <td className="px-4 py-3">
                    {user.failedLoginAttempts > 0 ? (
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${user.locked ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {user.failedLoginAttempts} attempts
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}