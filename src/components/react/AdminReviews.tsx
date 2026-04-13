import { useState, useEffect, useCallback, useMemo } from 'react';

interface Review {
  id: string;
  clinicId: string;
  userId: string | null;
  userName: string;
  userEmail: string | null;
  rating: number;
  title: string | null;
  body: string;
  source: string | null;
  verified: boolean;
  approved: boolean;
  helpfulCount: number;
  unhelpfulCount: number;
  createdAt: string;
  clinicName: string | null;
  clinicSlug: string | null;
  reply?: string | null;
}

const SOURCE_COLORS: Record<string, string> = {
  google: 'bg-blue-50 text-blue-700',
  healthgrades: 'bg-emerald-50 text-emerald-700',
  zocdoc: 'bg-orange-50 text-orange-700',
  yelp: 'bg-red-50 text-red-700',
  vitals: 'bg-purple-50 text-purple-700',
  tmslist: 'bg-indigo-50 text-indigo-700',
};

const SOURCE_LABELS: Record<string, string> = {
  google: 'Google',
  healthgrades: 'Healthgrades',
  zocdoc: 'Zocdoc',
  yelp: 'Yelp',
  vitals: 'Vitals',
  tmslist: 'TMS List',
};

const SOURCES = ['google', 'healthgrades', 'zocdoc', 'yelp', 'vitals', 'tmslist'];

const STAR = '\u2605';

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

interface ReplyModalProps {
  review: Review;
  onClose: () => void;
  onSubmit: (reviewId: string, reply: string) => void;
}

function ReplyModal({ review, onClose, onSubmit }: ReplyModalProps) {
  const [replyText, setReplyText] = useState(review.reply || '');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Reply to Review</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Review by {review.userName}</p>
          <p className="text-sm text-gray-700 line-clamp-3">{review.body}</p>
        </div>

        <textarea
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder="Write your reply..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
        />

        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(review.id, replyText)}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Submit Reply
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<ToastProps | null>(null);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Filters
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);

  // Reply modal
  const [replyReview, setReplyReview] = useState<Review | null>(null);
  const [replies, setReplies] = useState<Record<string, string>>({});

  const showToast = useCallback((message: string, type: ToastProps['type'] = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: '100', offset: '0' });
      if (filter !== 'all') params.set('status', filter);

      const res = await fetch(`/api/admin/reviews?${params}`);
      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch reviews');
      const json = await res.json();
      setReviews(json.data);
      setTotal(json.total);
      setPendingCount(json.pendingCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  // Reset selection when filter changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [filter]);

  const filteredReviews = useMemo(() => {
    return reviews.filter(r => {
      if (ratingFilter !== null && r.rating !== ratingFilter) return false;
      if (sourceFilter !== null && r.source !== sourceFilter) return false;
      return true;
    });
  }, [reviews, ratingFilter, sourceFilter]);

  const selectedCount = selectedIds.size;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedCount === filteredReviews.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredReviews.map(r => r.id)));
    }
  };

  async function handleAction(id: string, approved: boolean) {
    setUpdating(id);
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, approved }),
      });
      if (res.ok) {
        setReviews(prev => prev.map(r =>
          r.id === id ? { ...r, approved } : r
        ));
        if (!approved && filter === 'approved') {
          setReviews(prev => prev.filter(r => r.id !== id));
        }
        if (approved && filter === 'pending') {
          setReviews(prev => prev.filter(r => r.id !== id));
        }
        setPendingCount(prev => approved ? Math.max(0, prev - 1) : prev + 1);
        setError('');
        showToast(approved ? 'Review approved' : 'Review rejected', 'success');
      } else {
        setError('Failed to update review. Please try again.');
        showToast('Failed to update review', 'error');
      }
    } catch {
      setError('Network error. Please try again.');
      showToast('Network error', 'error');
    } finally {
      setUpdating(null);
    }
  }

  async function handleBulkAction(approved: boolean) {
    if (selectedCount === 0) return;
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
        if (res.ok) {
          success++;
          setReviews(prev => prev.map(r =>
            r.id === id ? { ...r, approved } : r
          ));
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    setSelectedIds(new Set());
    setBulkUpdating(false);

    if (failed === 0) {
      showToast(`${success} review${success !== 1 ? 's' : ''} ${approved ? 'approved' : 'rejected'}`, 'success');
    } else {
      showToast(`${success} succeeded, ${failed} failed`, failed > 0 ? 'error' : 'info');
    }

    // Refresh counts
    const pendingRes = await fetch('/api/admin/reviews?status=pending');
    if (pendingRes.ok) {
      const json = await pendingRes.json();
      setPendingCount(json.pendingCount);
    }
  }

  function handleReplySubmit(reviewId: string, reply: string) {
    setReplies(prev => ({ ...prev, [reviewId]: reply }));
    setReviews(prev => prev.map(r =>
      r.id === reviewId ? { ...r, reply } : r
    ));
    setReplyReview(null);
    showToast('Reply saved', 'success');
  }

  function exportToCsv() {
    const headers = ['Date', 'Clinic', 'User', 'Email', 'Rating', 'Title', 'Body', 'Source', 'Verified', 'Status', 'Helpful', 'Reply'];
    const rows = filteredReviews.map(r => [
      new Date(r.createdAt).toLocaleDateString(),
      r.clinicName || '',
      r.userName,
      r.userEmail || '',
      r.rating.toString(),
      r.title || '',
      r.body.replace(/"/g, '""'),
      r.source || '',
      r.verified ? 'Yes' : 'No',
      r.approved ? 'Approved' : 'Pending',
      r.helpfulCount.toString(),
      replies[r.id] || '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reviews-${filter}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exported', 'success');
  }

  function renderStars(rating: number, size: 'sm' | 'md' = 'md') {
    const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
    return (
      <span className={`text-yellow-500 ${textSize}`}>
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={i < rating ? 'text-yellow-500' : 'text-gray-200'}>{STAR}</span>
        ))}
      </span>
    );
  }

  const allSelected = filteredReviews.length > 0 && selectedCount === filteredReviews.length;
  const someSelected = selectedCount > 0 && selectedCount < filteredReviews.length;

  return (
    <div className="space-y-6">
      {/* Pending Banner */}
      {pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-semibold text-sm">
            {pendingCount}
          </div>
          <p className="text-sm text-amber-800">
            <span className="font-semibold">{pendingCount} review{pendingCount !== 1 ? 's' : ''}</span> awaiting moderation
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Filters Row */}
      <div className="space-y-3">
        {/* Status Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: 'pending', label: 'Pending' },
            { key: 'approved', label: 'Approved' },
            { key: 'all', label: 'All' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f.key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={exportToCsv}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5"
              disabled={filteredReviews.length === 0}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              Export CSV
            </button>
            <span className="text-sm text-gray-500">
              {filteredReviews.length} of {total} review{filteredReviews.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Rating Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">Rating:</span>
          <button
            onClick={() => setRatingFilter(null)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              ratingFilter === null
                ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          {[5, 4, 3, 2, 1].map(stars => (
            <button
              key={stars}
              onClick={() => setRatingFilter(ratingFilter === stars ? null : stars)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                ratingFilter === stars
                  ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className={stars >= 4 ? 'text-yellow-500' : stars >= 3 ? 'text-yellow-400' : 'text-orange-400'}>
                {STAR}
              </span>
              {stars}
            </button>
          ))}
        </div>

        {/* Source Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">Source:</span>
          <select
            value={sourceFilter || ''}
            onChange={(e) => setSourceFilter(e.target.value || null)}
            className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors appearance-none cursor-pointer ${
              sourceFilter
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
            style={{ minWidth: '120px' }}
          >
            <option value="">All Sources</option>
            {SOURCES.map(s => (
              <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
            ))}
          </select>

          {(ratingFilter !== null || sourceFilter) && (
            <button
              onClick={() => { setRatingFilter(null); setSourceFilter(null); }}
              className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-gray-700">
              <span className="font-semibold">{selectedCount}</span> review{selectedCount !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleBulkAction(true)}
                disabled={bulkUpdating}
                className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Approve Selected ({selectedCount})
              </button>
              <button
                onClick={() => handleBulkAction(false)}
                disabled={bulkUpdating}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Reject Selected ({selectedCount})
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
              >
                Clear selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-3 pb-20">
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
        ) : filteredReviews.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
            {filter === 'pending' ? 'No pending reviews.' : 'No reviews match your filters.'}
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-5">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected; }}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>
                <div className="flex-1 grid grid-cols-12 gap-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <div className="col-span-3">Review</div>
                  <div className="col-span-2">Clinic</div>
                  <div className="col-span-2">Source / Verified</div>
                  <div className="col-span-3">Review Content</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>
              </div>
            </div>

            {filteredReviews.map(review => (
              <div
                key={review.id}
                className={`bg-white rounded-xl border p-4 transition-colors ${
                  review.approved ? 'border-gray-200' : 'border-amber-200 bg-amber-50/20'
                } ${selectedIds.has(review.id) ? 'ring-2 ring-indigo-300 ring-offset-1' : ''}`}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <div className="w-5 pt-1">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(review.id)}
                      onChange={() => toggleSelect(review.id)}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>

                  {/* Main content grid */}
                  <div className="flex-1 grid grid-cols-12 gap-4">
                    {/* Reviewer info */}
                    <div className="col-span-3 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-gray-900 truncate">{review.userName}</span>
                        {review.approved ? (
                          <span className="shrink-0 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-semibold">
                            Published
                          </span>
                        ) : (
                          <span className="shrink-0 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-semibold">
                            Pending
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        {renderStars(review.rating, 'sm')}
                        {review.helpfulCount > 0 && (
                          <span className="text-[10px] text-gray-400">
                            Helpful: {review.helpfulCount}
                          </span>
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
                          className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                        >
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                          </svg>
                          <span className="truncate">{review.clinicName}</span>
                          <svg className="w-3 h-3 shrink-0 opacity-50" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                          </svg>
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">No clinic</span>
                      )}
                    </div>

                    {/* Source / Verified */}
                    <div className="col-span-2 min-w-0">
                      <div className="flex flex-col gap-1">
                        {review.source && (
                          <span className={`inline-flex w-fit px-2 py-0.5 rounded text-[10px] font-semibold ${SOURCE_COLORS[review.source] || 'bg-gray-50 text-gray-600'}`}>
                            {SOURCE_LABELS[review.source] || review.source}
                          </span>
                        )}
                        {review.verified && (
                          <span className="inline-flex items-center gap-1 w-fit px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-semibold border border-emerald-200">
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Verified
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Review content */}
                    <div className="col-span-3 min-w-0">
                      {review.title && (
                        <p className="text-sm font-medium text-gray-800 mb-0.5 truncate">{review.title}</p>
                      )}
                      <p className="text-xs text-gray-600 line-clamp-2">{review.body}</p>
                      {replies[review.id] && (
                        <div className="mt-2 px-2 py-1.5 bg-indigo-50 border border-indigo-100 rounded text-xs">
                          <span className="font-semibold text-indigo-700">Your reply:</span>
                          <p className="text-gray-600 mt-0.5">{replies[review.id]}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        {review.approved && (
                          <button
                            onClick={() => setReplyReview(review)}
                            className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 0 12.328 0 8.375 0 3.816 4.03 0 9 0c5 0 9 3.816 9 8.25z" />
                            </svg>
                            Reply
                          </button>
                        )}
                        {!review.approved && (
                          <button
                            onClick={() => handleAction(review.id, true)}
                            disabled={updating === review.id}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                          >
                            {updating === review.id ? (
                              <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                            )}
                            Approve
                          </button>
                        )}
                        {review.approved && (
                          <button
                            onClick={() => handleAction(review.id, false)}
                            disabled={updating === review.id}
                            className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center gap-1"
                          >
                            {updating === review.id ? (
                              <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                            Reject
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Reply Modal */}
      {replyReview && (
        <ReplyModal
          review={replyReview}
          onClose={() => setReplyReview(null)}
          onSubmit={handleReplySubmit}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} />}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
