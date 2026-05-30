'use client';
import { useState, useEffect } from 'react';

interface Session {
  id: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  userRole: string;
  createdAt: string;
  expiresAt: string;
  lastUsedAt: string | null;
  ipAddress: string | null;
  userAgent: string | null;
}

export default function AdminSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  async function fetchSessions() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/sessions');
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      const data = await res.json();
      if (res.ok) setSessions(data.sessions || []);
    } catch {
      showToast('error', 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  async function revokeSession(id: string) {
    if (!confirm('Revoke this session? The user will be logged out.')) return;
    setRevoking(id);
    try {
      const res = await fetch(`/api/admin/sessions/${id}?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to revoke');
      setSessions(s => s.filter(sess => sess.id !== id));
      showToast('success', 'Session revoked');
    } catch {
      showToast('error', 'Failed to revoke session');
    } finally {
      setRevoking(null);
    }
  }

  async function revokeAllUser(userId: string, email: string) {
    if (!confirm(`Log out ${email} from all devices?`)) return;
    setRevoking(userId);
    try {
      const res = await fetch(`/api/admin/sessions/${userId}?userId=${userId}&all=true`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to revoke');
      setSessions(s => s.filter(sess => sess.userId !== userId));
      showToast('success', `${email} logged out from all devices`);
    } catch {
      showToast('error', 'Failed to revoke sessions');
    } finally {
      setRevoking(null);
    }
  }

  function parseDevice(ua: string | null) {
    if (!ua) return 'Unknown device';
    if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) return 'Mobile';
    if (ua.includes('iPad')) return 'Tablet';
    return 'Desktop';
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[var(--ink)]">Active Sessions</h2>
        <span className="text-sm text-[var(--muted)]">{sessions.length} sessions</span>
      </div>

      <div className="bg-white rounded-xl border border-[rgba(10,22,40,0.15)] overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-6 h-6 border-2 border-[var(--line)] border-t-violet-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-[var(--muted)] mt-2">Loading sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[var(--muted)]">No active sessions</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-[rgba(10,22,40,0.1)]">
            <thead className="bg-[var(--paper2)]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Device</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">IP</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(10,22,40,0.1)]">
              {sessions.map(session => (
                <tr key={session.id} className="hover:bg-[var(--paper2)]/50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-[var(--ink)]">{session.userName || 'Unknown'}</p>
                    <p className="text-sm text-[var(--muted)]">{session.userEmail}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                      session.userRole === 'admin'
                        ? 'bg-red-50 text-red-700'
                        : session.userRole === 'editor'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-[var(--paper2)] text-[var(--muted)]'
                    }`}>{session.userRole}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--ink2)]">
                    {parseDevice(session.userAgent)}
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--muted)] font-mono">
                    {session.ipAddress || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--muted)]">
                    {new Date(session.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => revokeSession(session.id)}
                      disabled={revoking === session.id}
                      className="px-3 py-1 text-xs text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                    >
                      {revoking === session.id ? 'Revoking...' : 'Revoke'}
                    </button>
                    <button
                      onClick={() => revokeAllUser(session.userId, session.userEmail)}
                      disabled={revoking === session.userId}
                      className="ml-2 px-3 py-1 text-xs text-amber-600 hover:bg-amber-50 rounded disabled:opacity-50"
                    >
                      {revoking === session.userId ? '...' : 'Log out all'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}