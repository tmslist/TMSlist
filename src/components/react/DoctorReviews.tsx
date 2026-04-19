import { useState, useEffect } from 'react';

interface Review {
  id: string;
  userName: string;
  rating: number;
  title: string | null;
  body: string;
  approved: boolean;
  verified: boolean;
  ownerResponse: string | null;
  ownerResponseAt: string | null;
  createdAt: string;
  sentiment?: string;
}

interface DoctorReviewsProps {
  doctorId?: string;
  clinicId?: string;
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: 'bg-green-100 text-green-700',
  neutral: 'bg-gray-100 text-gray-600',
  negative: 'bg-red-100 text-red-700',
};

function detectSentiment(text: string): string {
  const pos = ['excellent', 'great', 'amazing', 'wonderful', 'fantastic', 'love', 'highly recommend', 'best', 'helpful', 'thank'];
  const neg = ['terrible', 'horrible', 'awful', 'worst', 'bad', 'disappointed', 'poor', 'avoid', 'never', 'waste'];
  const lower = text.toLowerCase();
  const p = pos.filter(w => lower.includes(w)).length;
  const n = neg.filter(w => lower.includes(w)).length;
  if (p > n) return 'positive';
  if (n > p) return 'negative';
  return 'neutral';
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex">
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} className={`w-4 h-4 ${i < rating ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function DoctorReviews({ doctorId, clinicId }: DoctorReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [flagReason, setFlagReason] = useState('');
  const [flaggingReview, setFlaggingReview] = useState<string | null>(null);

  useEffect(() => {
    if (!doctorId && !clinicId) { setLoading(false); return; }
    fetch(`/api/doctor/reviews?clinicId=${clinicId || ''}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { setReviews(d.reviews || []); setLoading(false); })
      .catch(() => { setError('Failed to load'); setLoading(false); });
  }, [doctorId, clinicId]);

  const submitResponse = async (reviewId: string) => {
    try {
      const res = await fetch('/api/doctor/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, response: responseText }),
      });
      if (res.ok) {
        setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, ownerResponse: responseText, ownerResponseAt: new Date().toISOString() } : r));
        setRespondingTo(null);
        setResponseText('');
      }
    } catch {
      setError('Failed to submit response');
    }
  };

  const flagReview = async (reviewId: string) => {
    try {
      const res = await fetch(`/api/admin/reviews?action=flag&reviewId=${reviewId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: flagReason }),
      });
      if (res.ok) {
        setFlaggingReview(null);
        setFlagReason('');
      }
    } catch {
      setError('Failed to flag review');
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[40vh]"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div>;

  return (
    <div>
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">{error}</div>}
      {reviews.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500 text-sm">No reviews yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => {
            const sentiment = review.sentiment || detectSentiment(review.body);
            return (
              <div key={review.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">{review.userName}</span>
                      <Stars rating={review.rating} />
                      {review.verified && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">Verified</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${SENTIMENT_COLORS[sentiment]}`}>{sentiment}</span>
                    </div>
                    <p className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setFlaggingReview(flaggingReview === review.id ? null : review.id)} className="text-xs text-gray-400 hover:text-red-600 px-2 py-1 border border-gray-200 rounded-lg">Flag</button>
                  </div>
                </div>
                {review.title && <p className="font-medium text-gray-800 mb-2">{review.title}</p>}
                <p className="text-gray-600 text-sm mb-4">{review.body}</p>

                {/* Owner response */}
                {review.ownerResponse ? (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-600 mb-1">Your Response</p>
                    <p className="text-sm text-gray-700">{review.ownerResponse}</p>
                  </div>
                ) : respondingTo === review.id ? (
                  <div className="mt-3">
                    <textarea
                      value={responseText}
                      onChange={e => setResponseText(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 mb-2"
                      placeholder="Write a professional response..."
                    />
                    <div className="flex gap-2">
                      <button onClick={() => submitResponse(review.id)} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">Submit</button>
                      <button onClick={() => setRespondingTo(null)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setRespondingTo(review.id)} className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium">Respond to this review</button>
                )}

                {/* Flag reason modal */}
                {flaggingReview === review.id && (
                  <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-2">Flag reason</p>
                    <textarea
                      value={flagReason}
                      onChange={e => setFlagReason(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 mb-2"
                      placeholder="Describe why this review should be flagged..."
                    />
                    <button onClick={() => flagReview(review.id)} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700">Submit Flag</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
