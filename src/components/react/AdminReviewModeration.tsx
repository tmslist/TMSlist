import { useState, useCallback } from 'react';

interface FlaggedReview {
  id: string;
  clinicId: string;
  clinicName: string | null;
  clinicSlug: string | null;
  userName: string;
  userEmail: string | null;
  rating: number;
  title: string | null;
  body: string;
  source: string | null;
  verified: boolean;
  approved: boolean;
  helpfulCount: number;
  createdAt: string;
  flagReason: string;
  flagDetails: string | null;
  sentiment: 'positive' | 'neutral' | 'negative';
  ownerResponse: string | null;
  ownerResponseAt: string | null;
}

interface ResponseTemplate {
  id: string;
  label: string;
  body: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

const SENTIMENT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  positive: { label: 'Positive', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  neutral: { label: 'Neutral', color: 'text-amber-600', bg: 'bg-amber-50' },
  negative: { label: 'Negative', color: 'text-red-600', bg: 'bg-red-50' },
};

const SOURCE_COLORS: Record<string, string> = {
  google: 'bg-blue-50 text-blue-700',
  healthgrades: 'bg-emerald-50 text-emerald-700',
  zocdoc: 'bg-orange-50 text-orange-700',
  yelp: 'bg-red-50 text-red-700',
  vitals: 'bg-purple-50 text-purple-700',
  tmslist: 'bg-indigo-50 text-indigo-700',
};

const FLAG_REASONS = [
  { value: '', label: 'All Flags' },
  { value: 'inappropriate', label: 'Inappropriate Content' },
  { value: 'fake', label: 'Suspected Fake' },
  { value: 'competing', label: 'Competitor Review' },
  { value: 'vulgar', label: 'Vulgar / Profanity' },
  { value: 'off_topic', label: 'Off-Topic' },
  { value: 'unverified', label: 'Unverified Patient' },
  { value: 'spam', label: 'Spam / Promotional' },
];

const RESPONSE_TEMPLATES: ResponseTemplate[] = [
  {
    id: 'thank_you',
    label: 'Thank You',
    body: 'Thank you so much for your wonderful feedback! We are thrilled to hear about your positive experience. Our team takes great pride in providing exceptional care, and your kind words mean the world to us. We look forward to continuing to serve you.',
    sentiment: 'positive',
  },
  {
    id: 'thank_specific',
    label: 'Thank You (Specific)',
    body: 'Thank you for taking the time to share your experience. We are delighted to hear that our team exceeded your expectations. Your feedback has been shared with our staff. We appreciate your trust in our services.',
    sentiment: 'positive',
  },
  {
    id: 'sorry_hear',
    label: 'Sorry to Hear',
    body: 'We are sorry to hear about your experience. Your feedback is important to us, and we take all concerns seriously. Please contact our clinic directly so we can address this matter promptly and ensure we meet your expectations going forward.',
    sentiment: 'negative',
  },
  {
    id: 'neutral_generic',
    label: 'Neutral / Generic',
    body: 'Thank you for your feedback. We appreciate you taking the time to share your experience. If you have any questions or concerns, please do not hesitate to reach out to our team directly.',
    sentiment: 'neutral',
  },
  {
    id: 'response_time',
    label: 'Response Time Concern',
    body: 'We apologize if your experience did not meet our high standards. We are committed to continuous improvement and have addressed the concerns raised. Please reach out to us directly so we can make things right.',
    sentiment: 'negative',
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="text-sm text-yellow-500">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={i <= rating ? 'text-yellow-500' : 'text-gray-200'}>&#9733;</span>
      ))}
    </span>
  );
}

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
}

function Toast({ message, type }: ToastProps) {
  return (
    <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg text-sm font-medium z-50 animate-fade-in ${
      type === 'success' ? 'bg-emerald-600 text-white' :
      type === 'error' ? 'bg-red-600 text-white' :
      'bg-indigo-600 text-white'
    }`}>
      {message}
    </div>
  );
}

interface RespondModalProps {
  review: FlaggedReview;
  templates: ResponseTemplate[];
  onClose: () => void;
  onSubmit: (reviewId: string, response: string) => void;
  existingResponse: string;
}

function RespondModal({ review, templates, onClose, onSubmit, existingResponse }: RespondModalProps) {
  const [responseText, setResponseText] = useState(existingResponse || '');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const applyTemplate = (template: ResponseTemplate) => {
    setSelectedTemplate(template.id);
    setResponseText(template.body);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Respond to Review</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-sm text-gray-900">{review.userName}</span>
            <StarRating rating={review.rating} />
          </div>
          {review.title && <p className="text-sm font-medium text-gray-800 mb-1">{review.title}</p>}
          <p className="text-sm text-gray-600">{review.body}</p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Response Templates</label>
          <div className="flex flex-wrap gap-2">
            {templates.map(t => (
              <button
                key={t.id}
                onClick={() => applyTemplate(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  selectedTemplate === t.id
                    ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Your Response</label>
          <textarea
            value={responseText}
            onChange={(e) => { setResponseText(e.target.value); setSelectedTemplate(null); }}
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            placeholder="Write your response..."
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(review.id, responseText)}
            disabled={!responseText.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            Post Response
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminReviewModeration() {
  const [reviews, setReviews] = useState<FlaggedReview[]>([]);
  const [flaggedCount, setFlaggedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<ToastProps | null>(null);
  const [flagReason, setFlagReason] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [respondReview, setRespondReview] = useState<FlaggedReview | null>(null);
  const [responses, setResponses] = useState<Record<string, string>>({});

  const showToast = useCallback((message: string, type: ToastProps['type'] = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchFlagged = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: '100', offset: '0' });
      if (flagReason) params.set('flagReason', flagReason);
      const res = await fetch(`/api/admin/reviews?${params}`);
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to fetch reviews');
      const json = await res.json();
      const flagged = (json.data as FlaggedReview[]).filter((r: FlaggedReview) => {
        if (sentimentFilter && r.sentiment !== sentimentFilter) return false;
        return true;
      });
      setReviews(flagged);
      setFlaggedCount(json.pendingCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [flagReason, sentimentFilter]);

  useEffect(() => {
    fetchFlagged();
  }, [fetchFlagged]);

  const handleAction = async (id: string, approved: boolean) => {
    setUpdating(id);
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, approved }),
      });
      if (res.ok) {
        setReviews(prev => prev.filter(r => r.id !== id));
        setFlaggedCount(prev => approved ? Math.max(0, prev - 1) : prev + 1);
        showToast(approved ? 'Review approved' : 'Review rejected', 'success');
      } else {
        showToast('Failed to update', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setUpdating(null);
    }
  };

  const handleBulkAction = async (approved: boolean) => {
    if (selectedIds.size === 0) return;
    setBulkUpdating(true);
    let success = 0;
    let failed = 0;
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      try {
        const res = await fetch('/api/admin/reviews', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, approved }),
        });
        if (res.ok) { success++; } else { failed++; }
      } catch { failed++; }
    }
    setReviews(prev => prev.filter(r => !selectedIds.has(r.id)));
    setSelectedIds(new Set());
    setBulkUpdating(false);
    showToast(
      failed === 0
        ? `${success} review${success !== 1 ? 's' : ''} ${approved ? 'approved' : 'rejected'}`
        : `${success} succeeded, ${failed} failed`,
      failed > 0 ? 'error' : 'success'
    );
  };

  const handleResponseSubmit = async (reviewId: string, response: string) => {
    setResponses(prev => ({ ...prev, [reviewId]: response }));
    setReviews(prev => prev.map(r =>
      r.id === reviewId ? { ...r, ownerResponse: response } : r
    ));
    setRespondReview(null);
    try {
      const res = await fetch('/api/reviews/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, response }),
      });
      if (!res.ok) throw new Error();
      showToast('Response posted', 'success');
    } catch {
      showToast('Failed to post response', 'error');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === reviews.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(reviews.map(r => r.id)));
    }
  };

  const sentimentColors: Record<string, string> = {
    positive: 'text-emerald-500',
    neutral: 'text-amber-500',
    negative: 'text-red-500',
  };

  const sentimentBg: Record<string, string> = {
    positive: 'bg-emerald-50',
    neutral: 'bg-amber-50',
    negative: 'bg-red-50',
  };

  return (
    <div className="space-y-6">
      {flaggedCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-semibold text-sm">
            {flaggedCount}
          </div>
          <p className="text-sm text-amber-800">
            <span className="font-semibold">{flaggedCount} review{flaggedCount !== 1 ? 's' : ''}</span> need moderation
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={flagReason}
          onChange={(e) => setFlagReason(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"
        >
          {FLAG_REASONS.map(f => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>

        <div className="flex gap-2">
          {['', 'positive', 'neutral', 'negative'].map(s => (
            <button
              key={s}
              onClick={() => setSentimentFilter(s)}
              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                sentimentFilter === s
                  ? s === '' ? 'bg-indigo-600 text-white border-indigo-600'
                  : `${sentimentBg[s]} ${sentimentColors[s]} border-current`
                  : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s === '' ? 'All Sentiment' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <button
          onClick={fetchFlagged}
          className="ml-auto px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-gray-700">
              <span className="font-semibold">{selectedIds.size}</span> selected
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleBulkAction(true)}
                disabled={bulkUpdating}
                className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                Approve ({selectedIds.size})
              </button>
              <button
                onClick={() => handleBulkAction(false)}
                disabled={bulkUpdating}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Reject ({selectedIds.size})
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          <div className="inline-flex items-center gap-2">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading...
          </div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          No flagged reviews match your filters.
        </div>
      ) : (
        <div className="space-y-3 pb-20">
          {reviews.map(review => {
            const sentConfig = SENTIMENT_CONFIG[review.sentiment] || SENTIMENT_CONFIG.neutral;
            return (
              <div key={review.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 pt-1">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(review.id)}
                      onChange={() => toggleSelect(review.id)}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 cursor-pointer"
                    />
                  </div>
                  <div className="flex-1 grid grid-cols-12 gap-4">
                    {/* Reviewer info */}
                    <div className="col-span-3 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-gray-900 truncate">{review.userName}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${sentConfig.bg} ${sentConfig.color}`}>
                          {sentConfig.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mb-1">
                        <StarRating rating={review.rating} />
                        {review.helpfulCount > 0 && (
                          <span className="text-[10px] text-gray-400">Helpful: {review.helpfulCount}</span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    {/* Clinic */}
                    <div className="col-span-2 min-w-0">
                      {review.clinicName ? (
                        <a
                          href={`/clinic/${review.clinicSlug}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
                        >
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                          </svg>
                          <span className="truncate">{review.clinicName}</span>
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">No clinic</span>
                      )}
                    </div>

                    {/* Source */}
                    <div className="col-span-1 min-w-0">
                      {review.source && (
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${SOURCE_COLORS[review.source] || 'bg-gray-50 text-gray-600'}`}>
                          {review.source}
                        </span>
                      )}
                      {review.flagReason && (
                        <div className="mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 bg-red-50 text-red-600 rounded text-[10px] font-medium">
                            Flag: {review.flagReason}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="col-span-4 min-w-0">
                      {review.title && (
                        <p className="text-sm font-medium text-gray-800 mb-0.5 truncate">{review.title}</p>
                      )}
                      <p className="text-xs text-gray-600 line-clamp-2">{review.body}</p>
                      {responses[review.id] && (
                        <div className="mt-2 px-2 py-1.5 bg-indigo-50 border border-indigo-100 rounded text-xs">
                          <span className="font-semibold text-indigo-700">Your reply:</span>
                          <p className="text-gray-600 mt-0.5">{responses[review.id]}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex flex-col items-end gap-2">
                      <div className="flex flex-col gap-1.5">
                        <button
                          onClick={() => handleAction(review.id, true)}
                          disabled={updating === review.id}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 w-full"
                        >
                          {updating === review.id ? '...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleAction(review.id, false)}
                          disabled={updating === review.id}
                          className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 w-full"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => setRespondReview(review)}
                          className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 w-full"
                        >
                          Respond
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {respondReview && (
        <RespondModal
          review={respondReview}
          templates={RESPONSE_TEMPLATES}
          onClose={() => setRespondReview(null)}
          onSubmit={handleResponseSubmit}
          existingResponse={responses[respondReview.id] || respondReview.ownerResponse || ''}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </div>
  );
}
