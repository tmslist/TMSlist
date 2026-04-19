import { useState, useEffect, useCallback } from 'react';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  author: string;
  category: string | null;
  status: string;
  publishedAt: string | null;
  updatedAt: string;
  metaTitle: string;
  metaDescription: string;
}

interface ApprovalAction {
  id: string;
  postId: string;
  action: 'approved' | 'rejected' | 'resubmitted';
  reviewer: string;
  notes: string;
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending_review: 'bg-amber-50 text-amber-700',
  approved: 'bg-blue-50 text-blue-700',
  rejected: 'bg-red-50 text-red-700',
  scheduled: 'bg-indigo-50 text-indigo-700',
  published: 'bg-emerald-50 text-emerald-700',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function ReviewNotesModal({
  post,
  onClose,
  onAction,
}: {
  post: BlogPost;
  onClose: () => void;
  onAction: (action: 'approved' | 'rejected' | 'resubmitted', notes: string) => void;
}) {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(action: 'approved' | 'rejected') {
    setLoading(true);
    onAction(action, notes);
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-base font-semibold text-gray-900">Review: {post.title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 text-xs">Author</span>
              <p className="font-medium text-gray-900">{post.author}</p>
            </div>
            <div>
              <span className="text-gray-500 text-xs">Category</span>
              <p className="font-medium text-gray-900">{post.category || '--'}</p>
            </div>
            <div>
              <span className="text-gray-500 text-xs">Current Status</span>
              <p className="font-medium"><StatusBadge status={post.status} /></p>
            </div>
            <div>
              <span className="text-gray-500 text-xs">Last Updated</span>
              <p className="font-medium text-gray-900">{formatDate(post.updatedAt)}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Excerpt</p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{post.excerpt || 'No excerpt'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Meta Description</p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{post.metaDescription || 'No meta description'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Review Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200 resize-y"
              placeholder="Add feedback for the author..."
            />
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={() => handleSubmit('rejected')}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-red-50 text-red-700 text-sm font-semibold rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            Reject
          </button>
          <button
            onClick={() => handleSubmit('approved')}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminContentApproval() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [actionHistory, setActionHistory] = useState<ApprovalAction[]>([]);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/blog-content');
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      const json = await res.json();
      if (res.ok) setPosts(json.posts ?? []);
    } catch {
      showToast('error', 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  async function handleAction(post: BlogPost, action: 'approved' | 'rejected' | 'resubmitted', notes: string) {
    try {
      const res = await fetch(`/api/admin/blog-content/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action === 'approved' ? 'approved' : action === 'rejected' ? 'rejected' : 'pending_review', reviewerNotes: notes }),
      });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (res.ok) {
        const actionRecord: ApprovalAction = {
          id: Date.now().toString(),
          postId: post.id,
          action,
          reviewer: 'Current User',
          notes,
          createdAt: new Date().toISOString(),
        };
        setActionHistory((prev) => [actionRecord, ...prev]);
        showToast('success', `Post ${action}`);
        setSelectedPost(null);
        fetchPosts();
      } else {
        showToast('error', 'Failed to update post');
      }
    } catch {
      showToast('error', 'Failed to update post');
    }
  }

  const filteredPosts = posts.filter((p) => {
    if (filter === 'pending') return p.status === 'pending_review' || p.status === 'draft';
    if (filter === 'approved') return p.status === 'approved';
    if (filter === 'rejected') return p.status === 'rejected';
    return true;
  });

  const counts = {
    pending: posts.filter((p) => p.status === 'pending_review' || p.status === 'draft').length,
    approved: posts.filter((p) => p.status === 'approved').length,
    rejected: posts.filter((p) => p.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Content Approval</h2>
          <p className="text-sm text-gray-500 mt-0.5">Review and approve blog posts</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 overflow-x-auto">
        {(['pending', 'approved', 'rejected'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 min-w-[100px] px-4 py-2.5 text-sm font-medium rounded-lg transition-colors capitalize ${
              filter === f ? 'bg-violet-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.replace('_', ' ')}
            <span className={`ml-1.5 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full ${
              filter === f ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      {/* Posts list */}
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block w-5 h-5 border-2 border-gray-300 border-t-violet-600 rounded-full animate-spin mb-2" />
          <p className="text-gray-400 text-sm">Loading posts...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h4 className="text-sm font-medium text-gray-700 mb-1">No {filter} content</h4>
          <p className="text-sm text-gray-500">{filter === 'pending' ? 'All posts are reviewed' : `No ${filter} posts found`}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filteredPosts.map((post) => (
              <div key={post.id} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">{post.title}</h4>
                    <StatusBadge status={post.status} />
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{post.excerpt || 'No excerpt'}</p>
                  <div className="flex items-center gap-4 text-[11px] text-gray-400">
                    <span>By {post.author}</span>
                    <span>{post.category || 'Uncategorized'}</span>
                    <span>Updated {formatDate(post.updatedAt)}</span>
                  </div>
                  {post.metaDescription && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">SEO: {post.metaDescription}</p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => window.location.href = `/admin/blog/${post.id}`}
                    className="px-3 py-1.5 bg-gray-50 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Edit
                  </button>
                  {filter === 'pending' && (
                    <>
                      <button
                        onClick={() => handleAction(post, 'rejected', '')}
                        className="px-3 py-1.5 bg-red-50 text-red-700 text-xs font-medium rounded-lg hover:bg-red-100 transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => setSelectedPost(post)}
                        className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        Review
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approval history */}
      {actionHistory.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Recent Actions</h3>
          </div>
          <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
            {actionHistory.map((action) => (
              <div key={action.id} className="px-5 py-3">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-xs font-semibold capitalize ${
                    action.action === 'approved' ? 'text-emerald-600' : action.action === 'rejected' ? 'text-red-600' : 'text-blue-600'
                  }`}>{action.action}</span>
                  <span className="text-xs text-gray-400">&middot; {action.reviewer}</span>
                  <span className="text-xs text-gray-400">&middot; {formatDate(action.createdAt)}</span>
                </div>
                {action.notes && <p className="text-xs text-gray-500 italic">"{action.notes}"</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedPost && (
        <ReviewNotesModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onAction={(action, notes) => handleAction(selectedPost, action, notes)}
        />
      )}
    </div>
  );
}
