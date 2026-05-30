import { useState } from 'react';
import { PortalCard, PortalButton } from './PortalUI';

interface ReviewResponseProps {
  reviewId: string;
  existingResponse?: string | null;
  onResponseSubmitted?: () => void;
}

export default function ReviewResponse({ reviewId, existingResponse, onResponseSubmitted }: ReviewResponseProps) {
  const [show, setShow] = useState(false);
  const [response, setResponse] = useState(existingResponse || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!response.trim()) return;

    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/portal/review-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, response: response.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to submit response');
      }

      setShow(false);
      onResponseSubmitted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {!show && !existingResponse && (
        <button
          onClick={() => setShow(true)}
          className="text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
        >
          Respond
        </button>
      )}

      {show && (
        <form onSubmit={handleSubmit} className="mt-3 p-3 bg-[var(--paper2)] rounded-lg border border-[var(--line)]">
          <label className="block text-xs font-medium text-[var(--ink2)] mb-2">
            Your response (public, max 2000 chars)
          </label>
          <textarea
            value={response}
            onChange={e => setResponse(e.target.value)}
            placeholder="Thank you for your feedback..."
            rows={3}
            maxLength={2000}
            className="w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm text-[var(--ink)] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
          />
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          <div className="flex gap-2 mt-2">
            <PortalButton variant="primary" size="sm" type="submit" disabled={saving || !response.trim()}>
              {saving ? 'Submitting...' : 'Submit Response'}
            </PortalButton>
            <button
              type="button"
              onClick={() => { setShow(false); setResponse(existingResponse || ''); }}
              className="text-xs text-[var(--muted)] hover:text-[var(--ink)] py-2"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {existingResponse && !show && (
        <div className="mt-2 p-3 bg-white rounded-lg border border-[var(--line)]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-emerald-600">Clinic Response</span>
            <button
              onClick={() => setShow(true)}
              className="text-[10px] text-[var(--muted)] hover:text-[var(--ink)]"
            >
              Edit
            </button>
          </div>
          <p className="text-sm text-[var(--ink2)]">{existingResponse}</p>
        </div>
      )}
    </>
  );
}

// Inline review response button for integration into existing reviews lists
interface ReviewResponseButtonProps {
  reviewId: string;
  hasResponse: boolean;
}

export function ReviewResponseButton({ reviewId, hasResponse }: ReviewResponseButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`text-xs font-medium transition-colors ${hasResponse ? 'text-emerald-600' : 'text-[var(--muted)] hover:text-[var(--ink)]'}`}
      >
        {hasResponse ? 'View Response' : 'Respond'}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-10 w-80">
          <ReviewDialog reviewId={reviewId} onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}

function ReviewDialog({ reviewId, onClose }: { reviewId: string; onClose: () => void }) {
  const [response, setResponse] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!response.trim()) return;

    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/portal/review-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, response: response.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to submit');
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setSaving(false);
    }
  }

  return (
    <PortalCard padding="md" className="w-80">
      <form onSubmit={handleSubmit}>
        <h4 className="text-sm font-semibold text-[var(--ink)] mb-2">Respond to Review</h4>
        <textarea
          value={response}
          onChange={e => setResponse(e.target.value)}
          placeholder="Thank you for your feedback..."
          rows={4}
          maxLength={2000}
          className="w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm text-[var(--ink)] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
        />
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        <div className="flex gap-2 mt-3">
          <PortalButton variant="primary" size="sm" type="submit" disabled={saving || !response.trim()}>
            {saving ? 'Submitting...' : 'Submit'}
          </PortalButton>
          <button type="button" onClick={onClose} className="text-xs text-[var(--muted)] hover:text-[var(--ink)] py-2 px-3">
            Cancel
          </button>
        </div>
      </form>
    </PortalCard>
  );
}