import { useState, useCallback } from 'react';

interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
}

interface CommunityNewPostProps {
  categories: Category[];
  defaultCategoryId?: string;
}

export default function CommunityNewPost({ categories, defaultCategoryId }: CommunityNewPostProps) {
  const [categoryId, setCategoryId] = useState(defaultCategoryId || '');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !title.trim() || !body.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId, title: title.trim(), body: body.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create post');
      }

      const data = await res.json();
      const cat = categories.find(c => c.id === categoryId);
      window.location.href = `/community/${cat?.slug || 'treatment-experiences'}/${data.post.slug}`;
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setLoading(false);
    }
  }, [categoryId, title, body, categories]);

  const titleValid = title.trim().length >= 5;
  const bodyValid = body.trim().length >= 10;

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <div>
        <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-1.5">
          Category
        </label>
        <select
          id="category"
          value={categoryId}
          onChange={e => setCategoryId(e.target.value)}
          required
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
        >
          <option value="">Select a category...</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-1.5">
          Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="What's on your mind?"
          maxLength={200}
          required
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        />
        <div className="flex justify-between mt-1">
          <p className={`text-xs ${titleValid ? 'text-gray-400' : 'text-amber-500'}`}>
            {title.trim().length < 5 && title.length > 0 ? 'At least 5 characters' : ''}
          </p>
          <p className="text-xs text-gray-400">{title.length}/200</p>
        </div>
      </div>

      <div>
        <label htmlFor="body" className="block text-sm font-semibold text-gray-700 mb-1.5">
          Body
        </label>
        <textarea
          id="body"
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Share your experience, question, or thoughts..."
          rows={8}
          maxLength={10000}
          required
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm resize-y focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        />
        <div className="flex justify-between mt-1">
          <p className={`text-xs ${bodyValid ? 'text-gray-400' : 'text-amber-500'}`}>
            {body.trim().length < 10 && body.length > 0 ? 'At least 10 characters' : ''}
          </p>
          <p className="text-xs text-gray-400">{body.length}/10,000</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <a href="/community" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
          Cancel
        </a>
        <button
          type="submit"
          disabled={loading || !categoryId || !titleValid || !bodyValid}
          className="px-6 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Publishing...' : 'Publish Post'}
        </button>
      </div>
    </form>
  );
}
