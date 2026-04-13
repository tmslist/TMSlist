import { useState, useEffect, useCallback } from 'react';

interface Review {
  id: string;
  clinicId: string;
  userName: string;
  userEmail: string | null;
  rating: number;
  title: string | null;
  body: string;
  source: string | null;
  helpful: number | null;
  verified: boolean;
  createdAt: string;
  clinicName: string | null;
  clinicSlug: string | null;
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

const STAR = '\u2605';

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: '50', offset: '0' });
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
      setError(err instanceof Error ? err.message : "An error occurred" || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

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
          r.id === id ? { ...r, verified: approved } : r
        ));
        if (!approved && filter === 'approved') {
          setReviews(prev => prev.filter(r => r.id !== id));
        }
        if (approved && filter === 'pending') {
          setReviews(prev => prev.filter(r => r.id !== id));
        }
        setPendingCount(prev => approved ? Math.max(0, prev - 1) : prev + 1);
        setError('');
      } else {
        setError('Failed to update review. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setUpdating(null);
    }
  }

  function renderStars(rating: number) {
    return (
      <span className="text-yellow-500">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={i < rating ? 'text-yellow-500' : 'text-gray-200'}>{STAR}</span>
        ))}
      </span>
    );
  }

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

      {/* Filters */}
      <div className="flex gap-2">
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
        <div className="ml-auto text-sm text-gray-500 self-center">
          {total} review{total !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">⏳ Loading...</div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
            {filter === 'pending' ? 'No pending reviews.' : 'No reviews found.'}
          </div>
        ) : reviews.map(review => (
          <div key={review.id} className={`bg-white rounded-xl border p-5 transition-colors ${
            review.verified ? 'border-gray-200' : 'border-amber-200 bg-amber-50/30'
          }`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="font-semibold text-gray-900">{review.userName}</span>
                  {renderStars(review.rating)}
                  {review.source && (
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${SOURCE_COLORS[review.source] || 'bg-gray-50 text-gray-600'}`}>
                      {SOURCE_LABELS[review.source] || review.source}
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    review.verified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {review.verified ? 'Approved' : 'Pending'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {review.title && (
                  <h4 className="font-medium text-gray-800 mb-1">{review.title}</h4>
                )}
                <p className="text-sm text-gray-600 mb-2">{review.body}</p>

                {review.clinicName && (
                  <a
                    href={`/clinic/${review.clinicSlug}/`}
                    target="_blank"
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    {review.clinicName}
                  </a>
                )}
                {review.userEmail && (
                  <span className="text-xs text-gray-400 ml-3">{review.userEmail}</span>
                )}
              </div>

              <div className="flex gap-2 shrink-0">
                {!review.verified && (
                  <button
                    onClick={() => handleAction(review.id, true)}
                    disabled={updating === review.id}
                    className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    Approve
                  </button>
                )}
                {review.verified && (
                  <button
                    onClick={() => handleAction(review.id, false)}
                    disabled={updating === review.id}
                    className="px-4 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
