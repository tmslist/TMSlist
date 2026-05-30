'use client';
import { useState } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  onInvited: () => void;
}

const ROLES = [
  { value: 'admin', label: 'Admin', desc: 'Full access to all features' },
  { value: 'editor', label: 'Editor', desc: 'Can edit content but not manage users' },
  { value: 'viewer', label: 'Viewer', desc: 'Read-only access' },
];

export default function AdminInviteModal({ open, onClose, onInvited }: Props) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('editor');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) { setError('Email and name are required'); return; }
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/admin/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, role }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to send invite'); return; }
      onInvited();
      onClose();
      setEmail('');
      setName('');
      setRole('editor');
    } catch {
      setError('Network error');
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center gap-3 px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-[var(--ink)]">Invite User</h2>
          <button onClick={onClose} className="ml-auto text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--ink)] mb-1">Full Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--ink)]/20 rounded-lg bg-transparent"
              placeholder="Jane Smith" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--ink)] mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--ink)]/20 rounded-lg bg-transparent"
              placeholder="jane@example.com" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--ink)] mb-2">Role</label>
            <div className="space-y-2">
              {ROLES.map(r => (
                <label key={r.value} className="flex items-start gap-3 p-3 border border-[var(--ink)]/20 rounded-lg cursor-pointer hover:bg-[var(--paper2)]">
                  <input type="radio" name="role" value={r.value} checked={role === r.value}
                    onChange={() => setRole(r.value)} className="mt-1" />
                  <div>
                    <p className="text-sm font-medium">{r.label}</p>
                    <p className="text-xs text-[var(--muted)]">{r.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-[var(--ink)]/20 rounded-lg">Cancel</button>
            <button type="submit" disabled={sending}
              className="flex-1 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50">
              {sending ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}