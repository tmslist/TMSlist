import { useState, useCallback } from 'react';

interface CommunityReportModalProps {
  targetType: 'post' | 'comment';
  targetId: string;
  isOpen: boolean;
  onClose: () => void;
}

const REPORT_REASONS = [
  'Spam or misleading',
  'Harassment or abuse',
  'Misinformation',
  'Inappropriate content',
  'Off-topic',
  'Other',
];

export default function CommunityReportModal({
  targetType,
  targetId,
  isOpen,
  onClose,
}: CommunityReportModalProps) {
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = reason === 'Other' ? customReason.trim() : reason;
    if (!finalReason || finalReason.length < 5) {
      setError('Please provide a reason (at least 5 characters)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/community/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType, targetId, reason: finalReason }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit report');
      }

      setSubmitted(true);
      setTimeout(onClose, 2000);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [reason, customReason, targetType, targetId, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        {submitted ? (
          <div className="text-center py-4">
            <svg className="w-8 h-8 text-emerald-500 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-gray-600">Report submitted. Thank you for helping keep our community safe.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Report {targetType}</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {REPORT_REASONS.map(r => (
                <label key={r} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={reason === r}
                    onChange={e => setReason(e.target.value)}
                    className="text-violet-600 focus:ring-violet-500"
                  />
                  <span className="text-sm text-gray-700">{r}</span>
                </label>
              ))}

              {reason === 'Other' && (
                <textarea
                  value={customReason}
                  onChange={e => setCustomReason(e.target.value)}
                  placeholder="Describe the issue..."
                  rows={2}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={loading || !reason}
                className="w-full py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Report'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
