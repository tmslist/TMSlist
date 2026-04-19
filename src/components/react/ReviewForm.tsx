import { useState, useEffect } from 'react';
import { StarIcon } from './Icons';

interface ReviewFormProps {
  clinicId: string;
  clinicName: string;
}

interface Session {
  userId: string;
  email: string;
  role: string;
  clinicId?: string;
}

export default function ReviewForm({ clinicId, clinicName }: ReviewFormProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.user && (data.user.role === 'patient' || data.user.role === 'viewer')) {
          setSession(data.user);
        }
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (rating === 0) {
      setErrorMsg('Please select a rating');
      return;
    }

    setStatus('submitting');
    setErrorMsg('');

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId,
          userName: session.email.split('@')[0], // use account name
          userEmail: session.email,
          rating,
          title: formData.get('title'),
          body: formData.get('body'),
        }),
      });

      if (res.ok) {
        setStatus('success');
        form.reset();
        setRating(0);
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to submit review');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
      setStatus('error');
    }
  }

  // Gate: require patient or viewer session
  if (!session) {
    return (
      <div className="p-6 bg-indigo-50 border border-violet-200 rounded-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Review {clinicName}</h3>
        <p className="text-sm text-gray-600 mb-4">Sign in with Google to leave a review. Your email will be verified automatically.</p>
        <a
          href={`/login?redirect=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/community')}`}
          className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-white border border-gray-200 rounded-xl text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all shadow-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google to Review
        </a>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="p-6 bg-green-50 border border-green-200 rounded-xl text-center">
        <p className="text-green-800 font-medium">Thank you for your review!</p>
        <p className="text-green-600 text-sm mt-1">Your review will appear after moderation.</p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-3 text-sm text-violet-600 hover:text-violet-800 font-medium"
        >
          Write another review
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Review {clinicName}</h3>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Star Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
        <div className="flex gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="text-3xl transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-violet-300 rounded"
              role="radio"
              aria-checked={rating === star}
              aria-label={`${star} star${star > 1 ? 's' : ''}`}
            >
              <span className={star <= (hoveredRating || rating) ? 'text-amber-400' : 'text-gray-300'}>
                ★
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-600">
        Posting as <span className="font-medium text-gray-900">{session.email}</span>
      </div>

      <div>
        <label htmlFor="rv-title" className="block text-sm font-medium text-gray-700">Title (optional)</label>
        <input type="text" name="title" id="rv-title" maxLength={200}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:ring-violet-500" />
      </div>

      <div>
        <label htmlFor="rv-body" className="block text-sm font-medium text-gray-700">Your Review <span className="text-red-400">*</span></label>
        <textarea name="body" id="rv-body" rows={4} required minLength={10} maxLength={5000}
          aria-required="true"
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
          placeholder="Share your experience with this clinic..."
          onInput={(e) => {
            const counter = e.currentTarget.parentElement?.querySelector('.char-count');
            if (counter) counter.textContent = `${e.currentTarget.value.length}/5000`;
          }}
        />
        <span className="char-count text-xs text-gray-400 mt-1 block text-right">0/5000</span>
      </div>

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 transition-all disabled:opacity-50"
      >
        {status === 'submitting' ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
}
