import { useState } from 'react';

interface ReviewFormProps {
  clinicId: string;
  clinicName: string;
}

export default function ReviewForm({ clinicId, clinicName }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

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
          userName: formData.get('userName'),
          userEmail: formData.get('userEmail'),
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

  if (status === 'success') {
    return (
      <div className="p-6 bg-green-50 border border-green-200 rounded-xl text-center">
        <p className="text-green-800 font-medium">Thank you for your review!</p>
        <p className="text-green-600 text-sm mt-1">Your review will appear after moderation.</p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-3 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
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
              className="text-3xl transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-300 rounded"
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="rv-name" className="block text-sm font-medium text-gray-700">Your Name</label>
          <input type="text" name="userName" id="rv-name" required
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
        </div>
        <div>
          <label htmlFor="rv-email" className="block text-sm font-medium text-gray-700">Email (optional)</label>
          <input type="email" name="userEmail" id="rv-email"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
        </div>
      </div>

      <div>
        <label htmlFor="rv-title" className="block text-sm font-medium text-gray-700">Title (optional)</label>
        <input type="text" name="title" id="rv-title" maxLength={200}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
      </div>

      <div>
        <label htmlFor="rv-body" className="block text-sm font-medium text-gray-700">Your Review <span className="text-red-400">*</span></label>
        <textarea name="body" id="rv-body" rows={4} required minLength={10} maxLength={5000}
          aria-required="true"
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
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
        className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all disabled:opacity-50"
      >
        {status === 'submitting' ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
}
