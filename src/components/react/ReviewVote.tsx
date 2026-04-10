import { useState } from 'react';

interface Props {
  reviewId: string;
  initialHelpful?: number;
  initialUnhelpful?: number;
}

export default function ReviewVote({ reviewId, initialHelpful = 0, initialUnhelpful = 0 }: Props) {
  const [voted, setVoted] = useState<'helpful' | 'unhelpful' | null>(null);
  const [helpful, setHelpful] = useState(initialHelpful);
  const [unhelpful, setUnhelpful] = useState(initialUnhelpful);

  const vote = async (isHelpful: boolean) => {
    if (voted) return;

    try {
      const res = await fetch('/api/reviews/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, helpful: isHelpful }),
      });

      if (res.ok) {
        setVoted(isHelpful ? 'helpful' : 'unhelpful');
        if (isHelpful) setHelpful(h => h + 1);
        else setUnhelpful(u => u + 1);
      } else if (res.status === 409) {
        setVoted(isHelpful ? 'helpful' : 'unhelpful');
      }
    } catch {
      /* network error — fail silently for vote */
    }
  };

  return (
    <div className="flex items-center gap-3 text-xs" role="group" aria-label="Rate this review's helpfulness">
      <span className="text-slate-400">Helpful?</span>
      <button
        onClick={() => vote(true)}
        disabled={voted !== null}
        aria-label={`Mark review as helpful${helpful > 0 ? ` (${helpful} votes)` : ''}`}
        className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all focus-visible:ring-2 focus-visible:ring-emerald-300 ${
          voted === 'helpful'
            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
            : voted !== null
            ? 'text-slate-300 cursor-default'
            : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 border border-transparent hover:border-emerald-200'
        }`}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
        </svg>
        {helpful > 0 && <span>{helpful}</span>}
      </button>
      <button
        onClick={() => vote(false)}
        disabled={voted !== null}
        aria-label={`Mark review as not helpful${unhelpful > 0 ? ` (${unhelpful} votes)` : ''}`}
        className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all focus-visible:ring-2 focus-visible:ring-red-300 ${
          voted === 'unhelpful'
            ? 'bg-red-50 text-red-500 border border-red-200'
            : voted !== null
            ? 'text-slate-300 cursor-default'
            : 'text-slate-500 hover:bg-red-50 hover:text-red-500 border border-transparent hover:border-red-200'
        }`}
      >
        <svg className="w-3.5 h-3.5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
        </svg>
        {unhelpful > 0 && <span>{unhelpful}</span>}
      </button>
    </div>
  );
}
