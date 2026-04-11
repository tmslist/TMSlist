import { useState, useEffect, useCallback } from 'react';

interface AdminBlogEditorProps {
  postId?: string;
}

interface PostData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  category: string;
  tags: string[];
  status: string;
  scheduledAt: string;
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
}

const INITIAL_POST: PostData = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  coverImage: '',
  author: '',
  category: '',
  tags: [],
  status: 'draft',
  scheduledAt: '',
  metaTitle: '',
  metaDescription: '',
  ogImage: '',
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function AdminBlogEditor({ postId }: AdminBlogEditorProps) {
  const [post, setPost] = useState<PostData>(INITIAL_POST);
  const [loading, setLoading] = useState(!!postId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [seoOpen, setSeoOpen] = useState(false);

  // Fetch existing post
  useEffect(() => {
    if (!postId) return;
    (async () => {
      try {
        const res = await fetch(`/api/admin/blog?id=${postId}`);
        if (!res.ok) {
          setError('Post not found');
          setLoading(false);
          return;
        }
        const json = await res.json();
        const d = json.data;
        setPost({
          title: d.title || '',
          slug: d.slug || '',
          excerpt: d.excerpt || '',
          content: d.content || '',
          coverImage: d.coverImage || '',
          author: d.author || '',
          category: d.category || '',
          tags: d.tags || [],
          status: d.status || 'draft',
          scheduledAt: d.scheduledAt ? new Date(d.scheduledAt).toISOString().slice(0, 16) : '',
          metaTitle: d.metaTitle || '',
          metaDescription: d.metaDescription || '',
          ogImage: d.ogImage || '',
        });
        setSlugManual(true);
      } catch {
        setError('Failed to load post');
      } finally {
        setLoading(false);
      }
    })();
  }, [postId]);

  const updateField = useCallback((field: keyof PostData, value: string | string[]) => {
    setPost(prev => {
      const updated = { ...prev, [field]: value };
      // Auto-generate slug from title if not manually edited
      if (field === 'title' && !slugManual) {
        updated.slug = slugify(value as string);
      }
      return updated;
    });
  }, [slugManual]);

  const handleSlugChange = (value: string) => {
    setSlugManual(true);
    setPost(prev => ({ ...prev, slug: value }));
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !post.tags.includes(tag)) {
      setPost(prev => ({ ...prev, tags: [...prev.tags, tag] }));
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setPost(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const save = async (overrideStatus?: string) => {
    setError('');
    setSuccess('');
    setSaving(true);

    const payload: Record<string, unknown> = {
      ...post,
      status: overrideStatus || post.status,
    };

    if (postId) {
      payload.id = postId;
    }

    // Clean up empty strings to null
    if (!payload.scheduledAt) delete payload.scheduledAt;

    try {
      const method = postId ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/blog', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Save failed');
        return;
      }

      setSuccess(postId ? 'Post updated successfully' : 'Post created successfully');

      // Redirect to edit page if this was a new post
      if (!postId && json.data?.id) {
        window.location.href = `/admin/blog/${json.data.id}`;
      } else {
        // Refresh the data
        setPost(prev => ({
          ...prev,
          status: overrideStatus || prev.status,
        }));
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <a
            href="/admin/blog"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <h1 className="text-2xl font-semibold text-gray-900">
            {postId ? 'Edit Post' : 'New Post'}
          </h1>
        </div>
        {post.slug && (
          <a
            href={`/blog/${post.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-500 hover:text-violet-600 flex items-center gap-1 transition-colors"
          >
            Preview
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <input
              type="text"
              placeholder="Post title"
              value={post.title}
              onChange={(e) => updateField('title', e.target.value)}
              className="w-full text-2xl font-semibold text-gray-900 placeholder-gray-300 border-0 p-0 focus:ring-0 outline-none"
            />
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-gray-400">/blog/</span>
              <input
                type="text"
                placeholder="post-slug"
                value={post.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                className="flex-1 text-sm text-gray-600 placeholder-gray-300 border-0 p-0 focus:ring-0 outline-none"
              />
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
            <textarea
              placeholder="Write your blog post content here..."
              value={post.content}
              onChange={(e) => updateField('content', e.target.value)}
              rows={20}
              className="w-full text-sm text-gray-800 font-mono border border-gray-200 rounded-lg p-4 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none resize-y"
            />
          </div>

          {/* Excerpt */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Excerpt</label>
            <textarea
              placeholder="Brief summary of the post..."
              value={post.excerpt}
              onChange={(e) => updateField('excerpt', e.target.value)}
              rows={3}
              className="w-full text-sm text-gray-800 border border-gray-200 rounded-lg p-4 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none resize-y"
            />
          </div>

          {/* SEO Section */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <button
              onClick={() => setSeoOpen(!seoOpen)}
              className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">SEO Settings</span>
              </div>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${seoOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {seoOpen && (
              <div className="px-6 pb-6 space-y-4 border-t border-gray-100 pt-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-gray-700">Meta Title</label>
                    <span className={`text-xs ${post.metaTitle.length > 60 ? 'text-red-500' : 'text-gray-400'}`}>
                      {post.metaTitle.length}/60
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder="SEO title (defaults to post title)"
                    value={post.metaTitle}
                    onChange={(e) => updateField('metaTitle', e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-gray-700">Meta Description</label>
                    <span className={`text-xs ${post.metaDescription.length > 160 ? 'text-red-500' : 'text-gray-400'}`}>
                      {post.metaDescription.length}/160
                    </span>
                  </div>
                  <textarea
                    placeholder="SEO description (defaults to excerpt)"
                    value={post.metaDescription}
                    onChange={(e) => updateField('metaDescription', e.target.value)}
                    rows={3}
                    className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none resize-y"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">OG Image URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/og-image.jpg"
                    value={post.ogImage}
                    onChange={(e) => updateField('ogImage', e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publish panel */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Publish</h3>

            {/* Status */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
              <select
                value={post.status}
                onChange={(e) => updateField('status', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none bg-white"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>

            {/* Scheduled datetime */}
            {post.status === 'scheduled' && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Schedule For</label>
                <input
                  type="datetime-local"
                  value={post.scheduledAt}
                  onChange={(e) => updateField('scheduledAt', e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
                />
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => save('published')}
                disabled={saving || !post.title}
                className="w-full px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Publish'}
              </button>
              <button
                onClick={() => save('draft')}
                disabled={saving || !post.title}
                className="w-full px-4 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Draft
              </button>
              {post.status !== 'scheduled' && (
                <button
                  onClick={() => save('scheduled')}
                  disabled={saving || !post.title}
                  className="w-full px-4 py-2.5 bg-white text-blue-700 text-sm font-medium rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Schedule
                </button>
              )}
            </div>
          </div>

          {/* Details panel */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Details</h3>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Author</label>
              <input
                type="text"
                placeholder="Author name"
                value={post.author}
                onChange={(e) => updateField('author', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Category</label>
              <input
                type="text"
                placeholder="e.g. Research, News, Guides"
                value={post.category}
                onChange={(e) => updateField('category', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Tags</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {post.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-50 text-violet-700 text-xs font-medium rounded-full"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="w-3.5 h-3.5 flex items-center justify-center rounded-full hover:bg-violet-200 transition-colors"
                    >
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
                />
                <button
                  onClick={addTag}
                  disabled={!tagInput.trim()}
                  className="px-3 py-2 text-sm font-medium text-violet-600 border border-violet-200 rounded-lg hover:bg-violet-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Cover Image URL</label>
              <input
                type="url"
                placeholder="https://example.com/cover.jpg"
                value={post.coverImage}
                onChange={(e) => updateField('coverImage', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
              />
              {post.coverImage && (
                <div className="mt-2 rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={post.coverImage}
                    alt="Cover preview"
                    className="w-full h-32 object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
