'use client';
import { useState } from 'react';

interface Clinic {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  clinic: Clinic;
  onClose: () => void;
  onDeleted: () => void;
}

export default function AdminDeleteWithRedirectModal({ clinic, onClose, onDeleted }: Props) {
  const [redirectSlug, setRedirectSlug] = useState('');
  const [reason, setReason] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/clinics/${clinic.id}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redirectToSlug: redirectSlug || undefined, reason }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      onDeleted();
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={() => !deleting && onClose()} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--ink)]">Delete "{clinic.name}"?</h3>
            <p className="text-sm text-[var(--muted)]">This action is permanent.</p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-[var(--ink2)] mb-1">
              Reason for deletion (optional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Duplicate entry, Wrong location"
              className="w-full px-3 py-2 border border-[var(--line)] rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--ink2)] mb-1">
              Redirect visitors to another clinic slug (optional)
            </label>
            <input
              type="text"
              value={redirectSlug}
              onChange={e => setRedirectSlug(e.target.value)}
              placeholder="e.g. another-clinic-slug"
              className="w-full px-3 py-2 border border-[var(--line)] rounded-lg text-sm focus:ring-2 focus:ring-[#1E2A3B] focus:border-[var(--ink2)] outline-none font-mono"
            />
            <p className="mt-1 text-xs text-[var(--muted)]">
              Traffic to /clinic/{clinic.slug}/ will redirect to this slug instead of showing 404.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 border border-[var(--line)] text-[var(--ink2)] text-sm font-medium rounded-lg hover:bg-[var(--paper2)] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {deleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Deleting...
              </>
            ) : 'Delete Clinic'}
          </button>
        </div>
      </div>
    </div>
  );
}