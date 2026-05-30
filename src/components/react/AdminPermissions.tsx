'use client';
import { useState, useEffect } from 'react';

interface Permission {
  id: string;
  key: string;
  label: string;
  description?: string | null;
  category?: string | null;
  createdAt: string;
}

const PRESET_PERMISSIONS: Permission[] = [
  { id: 'preset-1', key: 'can_view', label: 'View', description: 'Can view content', category: 'General', createdAt: '' },
  { id: 'preset-2', key: 'can_edit', label: 'Edit', description: 'Can edit content', category: 'General', createdAt: '' },
  { id: 'preset-3', key: 'can_delete', label: 'Delete', description: 'Can delete content', category: 'General', createdAt: '' },
  { id: 'preset-4', key: 'can_export', label: 'Export', description: 'Can export data', category: 'Data', createdAt: '' },
  { id: 'preset-5', key: 'can_manage_users', label: 'Manage Users', description: 'Can manage user accounts', category: 'Admin', createdAt: '' },
  { id: 'preset-6', key: 'can_manage_settings', label: 'Manage Settings', description: 'Can manage system settings', category: 'Admin', createdAt: '' },
  { id: 'preset-7', key: 'can_billing', label: 'Billing', description: 'Can access billing features', category: 'Admin', createdAt: '' },
  { id: 'preset-8', key: 'can_content', label: 'Content', description: 'Can manage blog and content', category: 'Content', createdAt: '' },
];

export default function AdminPermissions() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newPerm, setNewPerm] = useState({ key: '', label: '', description: '', category: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => { fetchPermissions(); }, []);

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  async function fetchPermissions() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/permissions');
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      const data = await res.json();
      if (res.ok) setPermissions(data.permissions || []);
    } catch {
      showToast('error', 'Failed to load permissions');
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!newPerm.key || !newPerm.label) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPerm),
      });
      if (!res.ok) throw new Error();
      showToast('success', 'Permission added');
      setShowAdd(false);
      setNewPerm({ key: '', label: '', description: '', category: '' });
      fetchPermissions();
    } catch {
      showToast('error', 'Failed to add permission');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, key: string) {
    if (!confirm(`Delete permission "${key}"?`)) return;
    try {
      const res = await fetch(`/api/admin/permissions?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setPermissions(p => p.filter(x => x.id !== id));
      showToast('success', 'Permission deleted');
    } catch {
      showToast('error', 'Failed to delete permission');
    }
  }

  const displayPerms = permissions.length > 0 ? permissions : PRESET_PERMISSIONS;
  const grouped = displayPerms.reduce<Record<string, Permission[]>>((acc, p) => {
    const cat = p.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

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
        <h2 className="text-xl font-semibold text-[var(--ink)]">Permissions</h2>
        <button onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-semibold rounded-lg">
          + Add Permission
        </button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-xl border border-[rgba(10,22,40,0.15)] p-4 space-y-3">
          <h3 className="text-sm font-semibold text-[var(--ink)]">New Permission</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input value={newPerm.key} onChange={e => setNewPerm(p => ({ ...p, key: e.target.value }))}
              placeholder="Key (e.g. can_manage_users)" className="px-3 py-2 border border-[var(--line)] rounded-lg text-sm" />
            <input value={newPerm.label} onChange={e => setNewPerm(p => ({ ...p, label: e.target.value }))}
              placeholder="Label" className="px-3 py-2 border border-[var(--line)] rounded-lg text-sm" />
            <input value={newPerm.description} onChange={e => setNewPerm(p => ({ ...p, description: e.target.value }))}
              placeholder="Description (optional)" className="px-3 py-2 border border-[var(--line)] rounded-lg text-sm" />
            <input value={newPerm.category} onChange={e => setNewPerm(p => ({ ...p, category: e.target.value }))}
              placeholder="Category (optional)" className="px-3 py-2 border border-[var(--line)] rounded-lg text-sm" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 border border-[var(--line)] rounded-lg text-sm">Cancel</button>
            <button onClick={handleAdd} disabled={saving || !newPerm.key || !newPerm.label}
              className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-semibold disabled:opacity-50">
              {saving ? 'Adding...' : 'Add'}
            </button>
          </div>
        </div>
      )}

      {Object.entries(grouped).map(([category, perms]) => (
        <div key={category}>
          <h3 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">{category}</h3>
          <div className="bg-white rounded-xl border border-[rgba(10,22,40,0.15)] overflow-hidden divide-y divide-[rgba(10,22,40,0.1)]">
            {loading ? (
              <p className="px-6 py-8 text-center text-[var(--muted)] text-sm">Loading...</p>
            ) : perms.map(p => (
              <div key={p.id} className="px-6 py-4 flex items-center justify-between hover:bg-[var(--paper2)]/50">
                <div>
                  <p className="font-medium text-[var(--ink)]">{p.label}</p>
                  <p className="text-sm text-[var(--muted)] font-mono">{p.key}</p>
                  {p.description && <p className="text-xs text-[var(--muted)] mt-0.5">{p.description}</p>}
                </div>
                <button onClick={() => handleDelete(p.id, p.key)}
                  className="text-xs text-red-600 hover:bg-red-50 px-3 py-1 rounded">
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}