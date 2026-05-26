'use client';
import { useState } from 'react';

interface Props {
  clinicId: string;
  currentReason: string | null;
  onClose: () => void;
  onSaved: (reason: string) => void;
}

const SUGGESTED_REASONS = [
  'Duplicate entry',
  'Wrong location',
  'Permanently closed',
  'Incorrect information',
  'Spam / fake listing',
  'Merged with another clinic',
  'Owner requested removal',
  'Compliance violation',
];

export default function AdminStatusReasonModal({ clinicId, currentReason, onClose, onSaved }: Props) {
  const [reason, setReason] = useState(currentReason ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!reason.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/clinics/${clinicId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      onSaved(reason);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--ink)]">Status Reason</h2>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--ink2)] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-[var(--muted)] mb-4">
          Document the reason for this clinic's status change. Visible in the admin audit log.
        </p>

        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={3}
          placeholder="Describe the reason for this status change..."
          className="w-full px-3 py-2 border border-[var(--line)] rounded-lg text-sm focus:ring-2 focus:ring-[#1E2A3B] focus:border-[var(--ink2)] outline-none mb-3"
        />

        <div className="mb-4">
          <p className="text-xs text-[var(--muted)] mb-2">Quick select:</p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_REASONS.map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className="px-2.5 py-1 bg-[var(--paper2)] text-[var(--ink2)] text-xs rounded-full hover:bg-[rgba(10,22,40,0.08)] hover:text-[var(--ink)] transition-colors"
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 px-4 py-2.5 border border-[var(--line)] text-[var(--ink2)] text-sm font-medium rounded-lg hover:bg-[var(--paper2)] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !reason.trim()}
            className="flex-1 px-4 py-2.5 bg-[var(--ink)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--ink)] transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Reason'}
          </button>
        </div>
      </div>
    </div>
  );
}