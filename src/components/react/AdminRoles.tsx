'use client';
import { useState, useEffect } from 'react';

const DEFAULT_PERMISSIONS = [
  'can_view',
  'can_edit',
  'can_delete',
  'can_export',
  'can_manage_users',
  'can_manage_settings',
  'can_billing',
  'can_content',
];

interface Role {
  id?: string;
  name: string;
  label: string;
  description?: string;
  permissions: string[];
  isSystem?: boolean;
}

export default function AdminRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Role | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => { fetchRoles(); }, []);

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  async function fetchRoles() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/roles');
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      const data = await res.json();
      if (res.ok) setRoles(data.roles || []);
    } catch {
      showToast('error', 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  }

  async function saveRole(role: Role) {
    setSaving(true);
    try {
      const method = role.id ? 'PUT' : 'POST';
      const url = role.id ? `/api/admin/roles?id=${role.id}` : '/api/admin/roles';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(role) });
      if (!res.ok) throw new Error('Failed to save');
      showToast('success', `Role ${role.id ? 'updated' : 'created'}`);
      setEditing(null);
      fetchRoles();
    } catch {
      showToast('error', 'Failed to save role');
    } finally {
      setSaving(false);
    }
  }

  function togglePerm(form: Role, perm: string): Role {
    const perms = form.permissions || [];
    return { ...form, permissions: perms.includes(perm) ? perms.filter(p => p !== perm) : [...perms, perm] };
  }

  const PRESET_ROLES: Role[] = [
    { name: 'admin', label: 'Admin', description: 'Full access to all features', permissions: DEFAULT_PERMISSIONS, isSystem: true },
    { name: 'editor', label: 'Editor', description: 'Can edit content but not manage users', permissions: ['can_view', 'can_edit', 'can_export', 'can_content'], isSystem: true },
    { name: 'viewer', label: 'Viewer', description: 'Read-only access', permissions: ['can_view'], isSystem: true },
  ];

  const displayRoles = roles.length > 0 ? roles : PRESET_ROLES;

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
        <h2 className="text-xl font-semibold text-[var(--ink)]">Roles</h2>
        <button onClick={() => setEditing({ name: '', label: '', permissions: [], description: '' })}
          className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-semibold rounded-lg">
          + Add Role
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[rgba(10,22,40,0.15)] overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-[var(--paper2)]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted)] uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted)] uppercase">Description</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted)] uppercase">Permissions</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--muted)] uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(10,22,40,0.1)]">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-[var(--muted)]">Loading...</td></tr>
            ) : displayRoles.map(role => (
              <tr key={role.name} className="hover:bg-[var(--paper2)]/50">
                <td className="px-6 py-4">
                  <p className="font-medium text-[var(--ink)]">{role.label}</p>
                  <p className="text-sm text-[var(--muted)]">{role.name}</p>
                  {role.isSystem && <span className="inline-block mt-1 px-1.5 py-0.5 text-xs bg-[var(--paper2)] text-[var(--muted)] rounded">System</span>}
                </td>
                <td className="px-6 py-4 text-sm text-[var(--ink2)]">{role.description || '—'}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {(role.permissions || []).map((p: string) => (
                      <span key={p} className="px-2 py-0.5 text-xs bg-[var(--paper2)] text-[var(--ink2)] rounded">{p}</span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  {!role.isSystem && (
                    <button onClick={() => setEditing(role)} className="text-sm text-[var(--primary)] hover:underline">Edit</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <RoleModal role={editing} onSave={saveRole} onClose={() => setEditing(null)} saving={saving} togglePerm={togglePerm} />
      )}
    </div>
  );
}

function RoleModal({ role, onSave, onClose, saving, togglePerm }: {
  role: Role;
  onSave: (r: Role) => void;
  onClose: () => void;
  saving: boolean;
  togglePerm: (r: Role, p: string) => Role;
}) {
  const [form, setForm] = useState(role);

  function setField(key: keyof Role, value: unknown) {
    setForm(prev => ({ ...prev, [key]: value } as Role));
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--ink)]">{role.id ? 'Edit Role' : 'New Role'}</h3>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--ink2)]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--ink)] mb-1">Key (slug)</label>
            <input value={form.name} onChange={e => setField('name', e.target.value)}
              className="w-full px-3 py-2 border border-[var(--line)] rounded-lg bg-transparent"
              placeholder="editor" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--ink)] mb-1">Label</label>
            <input value={form.label} onChange={e => setField('label', e.target.value)}
              className="w-full px-3 py-2 border border-[var(--line)] rounded-lg bg-transparent"
              placeholder="Editor" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--ink)] mb-1">Description</label>
            <input value={form.description || ''} onChange={e => setField('description', e.target.value)}
              className="w-full px-3 py-2 border border-[var(--line)] rounded-lg bg-transparent"
              placeholder="Brief description" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--ink)] mb-2">Permissions</label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {DEFAULT_PERMISSIONS.map(perm => (
                <label key={perm} className="flex items-center gap-2 p-2 border border-[var(--line)] rounded cursor-pointer hover:bg-[var(--paper2)]">
                  <input type="checkbox"
                    checked={(form.permissions || []).includes(perm)}
                    onChange={() => setForm(togglePerm(form, perm))}
                    className="w-4 h-4" />
                  <span className="text-sm text-[var(--ink2)]">{perm}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-[var(--line)] rounded-lg text-[var(--ink2)]">Cancel</button>
          <button onClick={() => onSave(form)} disabled={saving}
            className="flex-1 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-semibold disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}