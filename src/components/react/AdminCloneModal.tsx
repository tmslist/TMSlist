'use client';
import { useState } from 'react';

interface Props {
  clinicId: string;
  clinicName: string;
  onClose: () => void;
  onCloned: () => void;
}

export default function AdminCloneModal({ clinicId, clinicName, onClose, onCloned }: Props) {
  const [suffix, setSuffix] = useState(' (Copy)');
  const [cloning, setCloning] = useState(false);
  const [result, setResult] = useState<{ newSlug: string; newName: string } | null>(null);

  const handleClone = async () => {
    setCloning(true);
    try {
      const res = await fetch(`/api/admin/clinics/${clinicId}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suffix }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult({ newSlug: data.newSlug, newName: data.newName });
    } catch (err: any) {
      alert(err.message || 'Clone failed');
    } finally {
      setCloning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--ink)]">Clone Clinic</h2>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--ink2)] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!result ? (
          <>
            <p className="text-sm text-[var(--muted)] mb-4">
              Create a copy of <strong className="text-[var(--ink)]">{clinicName}</strong>. All fields will be duplicated except reviews and claims.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-[var(--ink2)] mb-1">Name suffix</label>
              <input
                type="text"
                value={suffix}
                onChange={e => setSuffix(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--line)] rounded-lg text-sm focus:ring-2 focus:ring-[#1E2A3B] focus:border-[var(--ink2)] outline-none"
                placeholder=" (Copy)"
              />
              <p className="mt-1 text-xs text-[var(--muted)]">
                Preview: <strong>{clinicName}{suffix}</strong>
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
              <p className="text-xs text-amber-700">
                <strong>Note:</strong> The cloned clinic will start as unverified. You can edit it before publishing.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={cloning}
                className="flex-1 px-4 py-2.5 border border-[var(--line)] text-[var(--ink2)] text-sm font-medium rounded-lg hover:bg-[var(--paper2)] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleClone}
                disabled={cloning}
                className="flex-1 px-4 py-2.5 bg-[var(--ink)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--ink)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {cloning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Cloning...
                  </>
                ) : 'Clone Clinic'}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-semibold text-[var(--ink)] mb-1">Clinic Cloned!</h3>
            <p className="text-sm text-[var(--muted)] mb-4">"{result.newName}" created.</p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-[var(--line)] text-[var(--ink2)] text-sm font-medium rounded-lg hover:bg-[var(--paper2)]"
              >
                Close
              </button>
              <button
                onClick={() => { onCloned(); onClose(); }}
                className="flex-1 px-4 py-2.5 bg-[var(--ink)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--ink)]"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}