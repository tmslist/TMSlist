import { useState, useCallback } from 'react';

interface CommunityVoteButtonProps {
  targetType: 'post' | 'comment';
  targetId: string;
  initialScore: number;
  initialVote?: number; // +1, -1, or undefined
  isAuthenticated: boolean;
}

export default function CommunityVoteButton({
  targetType,
  targetId,
  initialScore,
  initialVote,
  isAuthenticated,
}: CommunityVoteButtonProps) {
  const [score, setScore] = useState(initialScore);
  const [currentVote, setCurrentVote] = useState<number | undefined>(initialVote);
  const [loading, setLoading] = useState(false);

  const handleVote = useCallback(async (value: 1 | -1) => {
    if (!isAuthenticated) {
      window.location.href = `/community/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    if (loading) return;
    setLoading(true);

    // Optimistic update
    const prevScore = score;
    const prevVote = currentVote;

    if (currentVote === value) {
      // Toggle off
      setScore(score - value);
      setCurrentVote(undefined);
    } else if (currentVote) {
      // Switch vote
      setScore(score + value * 2);
      setCurrentVote(value);
    } else {
      // New vote
      setScore(score + value);
      setCurrentVote(value);
    }

    try {
      const res = await fetch('/api/community/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType, targetId, value }),
      });

      if (!res.ok) {
        // Revert on failure
        setScore(prevScore);
        setCurrentVote(prevVote);
      }
    } catch {
      setScore(prevScore);
      setCurrentVote(prevVote);
    } finally {
      setLoading(false);
    }
  }, [targetType, targetId, score, currentVote, loading, isAuthenticated]);

  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        onClick={() => handleVote(1)}
        disabled={loading}
        className={`p-1 rounded transition-colors ${
          currentVote === 1
            ? 'text-violet-600 bg-violet-50'
            : 'text-gray-400 hover:text-violet-600 hover:bg-violet-50'
        }`}
        aria-label="Upvote"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      </button>

      <span className={`text-sm font-bold tabular-nums ${
        score > 0 ? 'text-violet-600' : score < 0 ? 'text-rose-500' : 'text-gray-500'
      }`}>
        {score}
      </span>

      <button
        onClick={() => handleVote(-1)}
        disabled={loading}
        className={`p-1 rounded transition-colors ${
          currentVote === -1
            ? 'text-rose-500 bg-rose-50'
            : 'text-gray-400 hover:text-rose-500 hover:bg-rose-50'
        }`}
        aria-label="Downvote"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  );
}
