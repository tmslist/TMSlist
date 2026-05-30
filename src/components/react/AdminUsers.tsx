import { useState, useEffect, useCallback } from 'react';
import AdminInviteModal from './AdminInviteModal';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  clinicId: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  totpEnabled?: boolean;
  totpVerifiedAt?: string | null;
  permissions?: Record<string, boolean>;
}

const ROLES = ['admin', 'editor', 'clinic_owner', 'viewer'];

const PERMISSION_GROUPS = [
  {
    group: 'Content',
    perms: [
      { key: 'can_edit_clinics', label: 'Edit Clinics' },
      { key: 'can_delete_clinics', label: 'Delete Clinics' },
      { key: 'can_edit_doctors', label: 'Edit Doctors' },
      { key: 'can_delete_doctors', label: 'Delete Doctors' },
      { key: 'can_moderate_reviews', label: 'Moderate Reviews' },
      { key: 'can_manage_blog', label: 'Manage Blog' },
      { key: 'can_manage_content', label: 'Manage Content' },
    ],
  },
  {
    group: 'Leads & Enquiries',
    perms: [
      { key: 'can_manage_leads', label: 'Manage Leads' },
      { key: 'can_manage_enquiries', label: 'Manage Enquiries' },
    ],
  },
  {
    group: 'Admin',
    perms: [
      { key: 'can_manage_users', label: 'Manage Users' },
      { key: 'can_manage_admins', label: 'Manage Admins' },
    ],
  },
  {
    group: 'Analytics & Data',
    perms: [
      { key: 'can_view_analytics', label: 'View Analytics' },
      { key: 'can_export_data', label: 'Export Data' },
    ],
  },
  {
    group: 'Marketing',
    perms: [
      { key: 'can_manage_campaigns', label: 'Manage Campaigns' },
      { key: 'can_view_email_stats', label: 'View Email Stats' },
    ],
  },
  {
    group: 'System',
    perms: [
      { key: 'can_manage_settings', label: 'Manage Settings' },
      { key: 'can_manage_integrations', label: 'Manage Integrations' },
      { key: 'can_view_billing', label: 'View Billing' },
      { key: 'can_manage_billing', label: 'Manage Billing' },
      { key: 'can_view_audit_log', label: 'View Audit Log' },
      { key: 'can_manage_security', label: 'Manage Security' },
    ],
  },
];

const EMPTY_USER = {
  email: '',
  name: '',
  role: 'viewer',
  clinicId: '',
};

export default function AdminUsers({ currentUserEmail }: { currentUserEmail?: string }) {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState(EMPTY_USER);
  const [editingRole, setEditingRole] = useState<{ id: string; role: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [resetPw, setResetPw] = useState<{ id: string; email: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [impersonate, setImpersonate] = useState<{ id: string; email: string; name: string; role: string } | null>(null);
  const [mfaModal, setMfaModal] = useState<{ id: string; email: string; name: string; totpEnabled: boolean; secret?: string } | null>(null);
  const [mfaToken, setMfaToken] = useState('');
  const [permsModal, setPermsModal] = useState<User | null>(null);
  const [tempPerms, setTempPerms] = useState<Record<string, boolean>>({});
  const [activityModal, setActivityModal] = useState<string | null>(null);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [page, setPage] = useState(0);
  const limit = 25;

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: String(limit), offset: String(page * limit) });
      const res = await fetch(`/api/admin/users?${params}`);
      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch users');
      const json = await res.json();
      setUsers(json.data);
      setTotal(json.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function handleCreate() {
    if (!newUser.email) {
      showToast('error', 'Email is required');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          clinicId: newUser.clinicId || null,
        }),
      });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create user');
      }
      showToast('success', 'User created');
      setShowAddForm(false);
      setNewUser(EMPTY_USER);
      fetchUsers();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handleRoleUpdate(id: string, role: string) {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, role }),
      });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to update role');
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
      setEditingRole(null);
      showToast('success', 'Role updated');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordReset() {
    if (!resetPw || newPassword.length < 8) {
      showToast('error', 'Password must be at least 8 characters');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: resetPw.id, password: newPassword }),
      });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to reset password');
      showToast('success', 'Password updated');
      setResetPw(null);
      setNewPassword('');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const user = users.find((u) => u.id === id);
    if (user && currentUserEmail && user.email === currentUserEmail) {
      showToast('error', 'You cannot delete your own account');
      setDeleteConfirm(null);
      return;
    }
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to delete user');
      showToast('success', 'User deleted');
      setDeleteConfirm(null);
      fetchUsers();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : "An error occurred");
    }
  }

  async function handleMFAToggle(user: User) {
    setSaving(true);
    try {
      const action = user.totpEnabled ? 'disable' : 'enable';
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, mfaAction: action }),
      });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update MFA');

      if (action === 'enable' && data.totpSecret) {
        setMfaModal({ id: user.id, email: user.email, name: user.name, totpEnabled: false, secret: data.totpSecret });
      } else {
        showToast('success', `MFA ${action === 'enable' ? 'enabled' : 'disabled'} for ${user.email}`);
        setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, totpEnabled: false } : u));
      }
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handleMFAVerify() {
    if (!mfaModal || mfaToken.length !== 6) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: mfaModal.id, mfaAction: 'verify', token: mfaToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid token');
      showToast('success', 'MFA verified and enabled');
      setUsers((prev) => prev.map((u) => u.id === mfaModal.id ? { ...u, totpEnabled: true } : u));
      setMfaModal(null);
      setMfaToken('');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  function openPermissions(user: User) {
    setPermsModal(user);
    setTempPerms((user.permissions && Object.keys(user.permissions).length > 0) ? user.permissions : {});
  }

  async function handlePermissionsSave() {
    if (!permsModal) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: permsModal.id, permissions: tempPerms }),
      });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save permissions');
      showToast('success', 'Permissions updated');
      setUsers((prev) => prev.map((u) => u.id === permsModal.id ? { ...u, permissions: tempPerms } : u));
      setPermsModal(null);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function openActivity(userId: string) {
    setActivityModal(userId);
    setActivityLoading(true);
    setActivityLogs([]);
    try {
      const res = await fetch(`/api/admin/users?action=activity&userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setActivityLogs(data.logs || []);
      }
    } catch {
      // silent fail
    } finally {
      setActivityLoading(false);
    }
  }

  const totalPages = Math.ceil(total / limit);

  const ROLE_COLORS: Record<string, string> = {
    admin: 'bg-red-100 text-red-700',
    editor: 'bg-[rgba(201,101,74,0.1)] text-[var(--warm)]',
    owner: 'bg-amber-100 text-amber-700',
    viewer: 'bg-[var(--paper2)] text-[var(--ink2)]',
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-[var(--ink)] mb-1">Reset Password</h3>
            <p className="text-sm text-[var(--muted)] mb-4">for {resetPw.email}</p>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 8 chars)"
              className="w-full px-3 py-2 border border-[var(--line)] rounded-lg text-sm mb-4 focus:border-[var(--ink2)] focus:ring-1 focus:ring-[rgba(10,22,40,0.15)]"
              minLength={8}
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setResetPw(null); setNewPassword(''); }}
                className="px-4 py-2 bg-[var(--paper2)] text-[var(--ink2)] text-sm font-medium rounded-lg hover:bg-[var(--paper2)]">
                Cancel
              </button>
              <button onClick={handlePasswordReset} disabled={saving}
                className="px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MFA Setup Modal */}
      {mfaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--ink)]">Setup Two-Factor Auth</h3>
                <p className="text-sm text-[var(--muted)]">{mfaModal.email}</p>
              </div>
            </div>
            <p className="text-sm text-[var(--ink2)] mb-3">Scan this secret in your authenticator app:</p>
            <div className="bg-[var(--paper2)] rounded-lg p-3 mb-4 text-center">
              <code className="text-sm font-mono text-violet-600 tracking-widest break-all">{mfaModal.secret}</code>
            </div>
            <p className="text-xs text-[var(--muted)] mb-4">Open your authenticator app (Google Authenticator, Authy, 1Password) and enter the 6-digit code below to verify setup:</p>
            <input
              type="text"
              value={mfaToken}
              onChange={(e) => setMfaToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="w-full px-3 py-2 border border-[var(--line)] rounded-lg text-center text-xl font-mono tracking-widest mb-4 focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setMfaModal(null); setMfaToken(''); }}
                className="px-4 py-2 bg-[var(--paper2)] text-[var(--ink2)] text-sm font-medium rounded-lg">
                Cancel
              </button>
              <button onClick={handleMFAVerify} disabled={saving || mfaToken.length !== 6}
                className="px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 disabled:opacity-50">
                {saving ? 'Verifying...' : 'Verify & Enable'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {permsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-[var(--ink)]">User Permissions</h3>
                <p className="text-sm text-[var(--muted)]">{permsModal.email}</p>
              </div>
              <button onClick={() => setPermsModal(null)} className="text-[var(--muted)] hover:text-[var(--ink2)]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4 mb-6">
              {PERMISSION_GROUPS.map((group) => (
                <div key={group.group}>
                  <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">{group.group}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {group.perms.map((perm) => (
                      <label key={perm.key} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={tempPerms[perm.key] ?? false}
                          onChange={(e) => setTempPerms((prev) => ({ ...prev, [perm.key]: e.target.checked }))}
                          className="w-4 h-4 rounded border-[var(--line)] text-violet-600 focus:ring-violet-500 cursor-pointer"
                        />
                        <span className="text-sm text-[var(--ink2)] group-hover:text-[var(--ink)]">{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setPermsModal(null)}
                className="px-4 py-2 bg-[var(--paper2)] text-[var(--ink2)] text-sm font-medium rounded-lg">
                Cancel
              </button>
              <button onClick={handlePermissionsSave} disabled={saving}
                className="px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Permissions'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Log Modal */}
      {activityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--ink)]">Activity Log</h3>
              <button onClick={() => setActivityModal(null)} className="text-[var(--muted)] hover:text-[var(--ink2)]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {activityLoading ? (
              <div className="py-8 text-center">
                <div className="w-6 h-6 border-2 border-[var(--line)] border-t-violet-600 rounded-full animate-spin mx-auto"></div>
                <p className="text-sm text-[var(--muted)] mt-2">Loading...</p>
              </div>
            ) : activityLogs.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-[var(--muted)] text-sm">No activity found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activityLogs.map((log: any) => (
                  <div key={log.id} className="flex items-start gap-3 p-3 bg-[var(--paper2)] rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--ink)]">{log.action?.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-[var(--muted)]">{log.entityType}{log.entityId ? ` #${log.entityId.slice(0, 8)}` : ''}</p>
                      {log.details && <p className="text-xs text-[var(--muted)] mt-0.5">{JSON.stringify(log.details)}</p>}
                    </div>
                    <span className="text-xs text-[var(--muted)] shrink-0">
                      {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Login As Confirmation Modal */}
      {impersonate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[rgba(10,22,40,0.08)] rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-[var(--ink)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--ink)]">Login As</h3>
                <p className="text-sm text-[var(--muted)]">{impersonate.email}</p>
              </div>
            </div>
            <p className="text-sm text-[var(--ink2)] mb-1">
              You are about to switch into this account.
            </p>
            {impersonate.role === 'clinic_owner' && (
              <p className="text-xs text-[var(--muted)] mb-4">This will redirect to the Clinic Portal.</p>
            )}
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
              <p className="text-xs text-amber-700">
                This action will be logged in the audit trail.
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setImpersonate(null)}
                className="px-4 py-2 bg-[var(--paper2)] text-[var(--ink2)] text-sm font-medium rounded-lg hover:bg-[var(--paper2)]">
                Cancel
              </button>
              <form method="POST" action="/api/admin/impersonate">
                <input type="hidden" name="userId" value={impersonate.id} />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--ink)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--ink)]">
                  Confirm & Switch
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      <AdminInviteModal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInvited={fetchUsers}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[var(--ink)]">Users</h2>
        <button
          onClick={() => setShowInviteModal(true)}
          className="px-4 py-2 bg-[var(--ink)] hover:bg-[var(--ink)] text-white text-sm font-semibold rounded-lg transition-colors"
        >
          + Invite User
        </button>
      </div>

      {/* Add User Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl border border-[rgba(10,22,40,0.15)] shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--ink)]">New User</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--ink2)] mb-1">Email</label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-[var(--line)] rounded-lg text-sm focus:border-[var(--ink2)] focus:ring-1 focus:ring-[rgba(10,22,40,0.15)]"
                placeholder="user@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--ink2)] mb-1">Name</label>
              <input
                type="text"
                value={newUser.name}
                onChange={(e) => setNewUser((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-[var(--line)] rounded-lg text-sm focus:border-[var(--ink2)] focus:ring-1 focus:ring-[rgba(10,22,40,0.15)]"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--ink2)] mb-1">Role</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser((prev) => ({ ...prev, role: e.target.value }))}
                className="w-full px-3 py-2 border border-[var(--line)] rounded-lg text-sm bg-white focus:border-[var(--ink2)]"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--ink2)] mb-1">Clinic ID (optional)</label>
              <input
                type="text"
                value={newUser.clinicId}
                onChange={(e) => setNewUser((prev) => ({ ...prev, clinicId: e.target.value }))}
                className="w-full px-3 py-2 border border-[var(--line)] rounded-lg text-sm focus:border-[var(--ink2)] focus:ring-1 focus:ring-[rgba(10,22,40,0.15)]"
                placeholder="UUID of associated clinic"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => { setShowAddForm(false); setNewUser(EMPTY_USER); }}
              className="px-4 py-2 bg-[var(--paper2)] text-[var(--ink2)] text-sm font-medium rounded-lg hover:bg-[var(--paper2)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={saving}
              className="px-5 py-2 bg-[var(--ink)] hover:bg-[var(--ink)] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-800">
          {error}
          <button onClick={() => setError('')} className="ml-3 text-red-500 hover:text-red-700 text-xs font-medium">Dismiss</button>
        </div>
      )}

      <div className="text-sm text-[var(--muted)]">{total} user{total !== 1 ? 's' : ''}</div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-[var(--line)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[var(--paper2)] border-b border-[var(--line)]">
                <th className="px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase">Email</th>
                <th className="px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase">Name</th>
                <th className="px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase">Role</th>
                <th className="px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase">Clinic ID</th>
                <th className="px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase">Last Login</th>
                <th className="px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase">Created</th>
                <th className="px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-[var(--muted)]"><div class="inline-block w-5 h-5 border-2 border-[var(--line)] border-t-[#0A1628] rounded-full animate-spin mb-2"></div><br/>Loading</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-[var(--muted)]">No users found.</td></tr>
              ) : users.map((user) => {
                const isSelf = currentUserEmail && user.email === currentUserEmail;
                return (
                  <tr key={user.id} className="hover:bg-[var(--paper2)] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--ink)]">{user.email}</span>
                        {isSelf && (
                          <span className="px-1.5 py-0.5 bg-[rgba(10,22,40,0.08)] text-[var(--ink)] text-[10px] font-semibold rounded">You</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--ink2)]">{user.name || '--'}</td>
                    <td className="px-4 py-3">
                      {editingRole?.id === user.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={editingRole.role}
                            onChange={(e) => setEditingRole({ id: user.id, role: e.target.value })}
                            className="px-2 py-1 border border-[var(--line)] rounded text-xs bg-white focus:border-[var(--ink2)]"
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleRoleUpdate(user.id, editingRole.role)}
                            disabled={saving}
                            className="px-2 py-1 bg-[var(--ink)] text-white text-xs rounded hover:bg-[var(--ink)] disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingRole(null)}
                            className="px-2 py-1 bg-[var(--paper2)] text-[var(--ink2)] text-xs rounded hover:bg-[var(--paper2)]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingRole({ id: user.id, role: user.role })}
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity ${
                            ROLE_COLORS[user.role] || ROLE_COLORS.viewer
                          }`}
                          title="Click to edit role"
                        >
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--muted)] font-mono text-xs">
                      {user.clinicId ? user.clinicId.slice(0, 8) + '...' : '--'}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--muted)]">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--muted)]">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {isSelf ? (
                        <span className="text-xs text-[var(--muted)]">--</span>
                      ) : deleteConfirm === user.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-3 py-1.5 bg-[var(--paper2)] text-[var(--ink2)] text-xs font-medium rounded-lg hover:bg-[var(--paper2)] transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1 flex-wrap items-center">
                          {user.totpEnabled ? (
                            <button
                              onClick={() => handleMFAToggle(user)}
                              className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-lg hover:bg-emerald-100 transition-colors"
                              title="MFA enabled — click to disable"
                            >
                              2FA On
                            </button>
                          ) : (
                            <button
                              onClick={() => handleMFAToggle(user)}
                              className="px-2 py-1 bg-[rgba(10,22,40,0.08)] text-[var(--ink)] text-xs font-medium rounded-lg hover:bg-[rgba(10,22,40,0.15)] transition-colors"
                              title="Enable two-factor auth"
                            >
                              +2FA
                            </button>
                          )}
                          <button
                            onClick={() => openPermissions(user)}
                            className="px-2 py-1 bg-[rgba(10,22,40,0.08)] text-[var(--ink)] text-xs font-medium rounded-lg hover:bg-[rgba(10,22,40,0.08)] transition-colors"
                            title="Manage permissions"
                          >
                            Perms
                          </button>
                          <button
                            onClick={() => openActivity(user.id)}
                            className="px-2 py-1 bg-[rgba(10,22,40,0.08)] text-[var(--ink)] text-xs font-medium rounded-lg hover:bg-[rgba(10,22,40,0.08)] transition-colors"
                            title="View activity log"
                          >
                            Activity
                          </button>
                          <button
                            onClick={() => setResetPw({ id: user.id, email: user.email })}
                            className="px-2 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-lg hover:bg-amber-100 transition-colors"
                            title="Reset password"
                          >
                            Reset PW
                          </button>
                          <button
                            onClick={() => setImpersonate({ id: user.id, email: user.email, name: user.name, role: user.role })}
                            className="px-2 py-1 bg-[rgba(10,22,40,0.08)] text-[var(--ink)] text-xs font-medium rounded-lg hover:bg-[rgba(10,22,40,0.08)] transition-colors"
                            title="Switch into this account"
                          >
                            Login As
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(user.id)}
                            className="px-3 py-1.5 bg-red-50 text-red-700 text-xs font-medium rounded-lg hover:bg-red-100 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-[var(--line)] bg-[var(--paper2)] flex items-center justify-between">
            <div className="text-sm text-[var(--muted)]">Page {page + 1} of {totalPages}</div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 bg-white border border-[var(--line)] rounded-lg text-sm disabled:opacity-50 hover:bg-[var(--paper2)]"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 bg-white border border-[var(--line)] rounded-lg text-sm disabled:opacity-50 hover:bg-[var(--paper2)]"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
