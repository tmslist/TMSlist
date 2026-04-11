import { useState, useCallback } from 'react';

interface CommunityCommentFormProps {
  postId: string;
  parentId?: string;
  isAuthenticated: boolean;
  onCommentAdded?: (comment: any) => void;
  onCancel?: () => void;
  placeholder?: string;
}

export default function CommunityCommentForm({
  postId,
  parentId,
  isAuthenticated,
  onCommentAdded,
  onCancel,
  placeholder = 'Share your thoughts...',
}: CommunityCommentFormProps) {
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;

    if (!isAuthenticated) {
      window.location.href = `/community/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: body.trim(), parentId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to post comment');
      }

      const data = await res.json();
      setBody('');
      onCommentAdded?.(data.comment);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [body, postId, parentId, isAuthenticated, onCommentAdded]);

  if (!isAuthenticated) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
        <p className="text-sm text-gray-500 mb-2">Join the conversation</p>
        <a
          href={`/community/login?redirect=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/community')}`}
          className="inline-flex items-center px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors"
        >
          Sign in to comment
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder={placeholder}
        rows={parentId ? 2 : 3}
        maxLength={5000}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder-gray-400"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-2 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading || !body.trim()}
          className="px-4 py-1.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Posting...' : parentId ? 'Reply' : 'Comment'}
        </button>
      </div>
    </form>
  );
}
