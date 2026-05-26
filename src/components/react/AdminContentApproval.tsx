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
  draft: 'bg-[var(--paper2)] text-[var(--ink2)]',
  pending_review: 'bg-amber-50 text-amber-700',
  approved: 'bg-[var(--paper2)] text-[var(--ink)]',
  rejected: 'bg-red-50 text-red-700',
  scheduled: 'bg-[rgba(201,101,74,0.06)] text-[var(--warm)]',
  published: 'bg-emerald-50 text-emerald-700',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[status] ?? 'bg-[var(--paper2)] text-[var(--ink2)]'}`}>
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)] bg-[var(--paper2)]">
          <h3 className="text-base font-semibold text-[var(--ink)]">Review: {post.title}</h3>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--ink2)] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-[var(--muted)] text-xs">Author</span>
              <p className="font-medium text-[var(--ink)]">{post.author}</p>
            </div>
            <div>
              <span className="text-[var(--muted)] text-xs">Category</span>
              <p className="font-medium text-[var(--ink)]">{post.category || '--'}</p>
            </div>
            <div>
              <span className="text-[var(--muted)] text-xs">Current Status</span>
              <p className="font-medium"><StatusBadge status={post.status} /></p>
            </div>
            <div>
              <span className="text-[var(--muted)] text-xs">Last Updated</span>
              <p className="font-medium text-[var(--ink)]">{formatDate(post.updatedAt)}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-[var(--muted)] mb-1">Excerpt</p>
            <p className="text-sm text-[var(--ink2)] bg-[var(--paper2)] rounded-lg p-3">{post.excerpt || 'No excerpt'}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--muted)] mb-1">Meta Description</p>
            <p className="text-sm text-[var(--ink2)] bg-[var(--paper2)] rounded-lg p-3">{post.metaDescription || 'No meta description'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">Review Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-[var(--line)] rounded-lg text-sm focus:border-[var(--ink2)] focus:ring-1 focus:ring-[rgba(10,22,40,0.15)] resize-y"
              placeholder="Add feedback for the author..."
            />
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 bg-[var(--paper2)] border-t border-[var(--line)]">
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
          <h2 className="text-xl font-semibold text-[var(--ink)]">Content Approval</h2>
          <p className="text-sm text-[var(--muted)] mt-0.5">Review and approve blog posts</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-[var(--line)] rounded-xl p-1 overflow-x-auto">
        {(['pending', 'approved', 'rejected'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 min-w-[100px] px-4 py-2.5 text-sm font-medium rounded-lg transition-colors capitalize ${
              filter === f ? 'bg-[var(--ink)] text-white' : 'text-[var(--ink2)] hover:bg-[var(--paper2)]'
            }`}
          >
            {f.replace('_', ' ')}
            <span className={`ml-1.5 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full ${
              filter === f ? 'bg-white/20 text-white' : 'bg-[var(--paper2)] text-[var(--ink2)]'
            }`}>
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      {/* Posts list */}
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block w-5 h-5 border-2 border-[var(--line)] border-t-[#0A1628] rounded-full animate-spin mb-2" />
          <p className="text-[var(--muted)] text-sm">Loading posts...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="bg-white rounded-xl border border-[var(--line)] p-12 text-center">
          <div className="w-12 h-12 bg-[var(--paper2)] rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h4 className="text-sm font-medium text-[var(--ink2)] mb-1">No {filter} content</h4>
          <p className="text-sm text-[var(--muted)]">{filter === 'pending' ? 'All posts are reviewed' : `No ${filter} posts found`}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[var(--line)] overflow-hidden">
          <div className="divide-y divide-[var(--line)]">
            {filteredPosts.map((post) => (
              <div key={post.id} className="flex items-start gap-4 px-5 py-4 hover:bg-[var(--paper2)] transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-[var(--ink)] truncate">{post.title}</h4>
                    <StatusBadge status={post.status} />
                  </div>
                  <p className="text-xs text-[var(--muted)] mb-2">{post.excerpt || 'No excerpt'}</p>
                  <div className="flex items-center gap-4 text-[11px] text-[var(--muted)]">
                    <span>By {post.author}</span>
                    <span>{post.category || 'Uncategorized'}</span>
                    <span>Updated {formatDate(post.updatedAt)}</span>
                  </div>
                  {post.metaDescription && (
                    <p className="text-xs text-[var(--muted)] mt-1 line-clamp-1">SEO: {post.metaDescription}</p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => window.location.href = `/admin/blog/${post.id}`}
                    className="px-3 py-1.5 bg-[var(--paper2)] text-[var(--ink2)] text-xs font-medium rounded-lg hover:bg-[var(--paper2)] transition-colors"
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
        <div className="bg-white rounded-xl border border-[var(--line)] overflow-hidden">
          <div className="px-5 py-3 bg-[var(--paper2)] border-b border-[var(--line)]">
            <h3 className="text-sm font-semibold text-[var(--ink2)]">Recent Actions</h3>
          </div>
          <div className="divide-y divide-[var(--line)] max-h-48 overflow-y-auto">
            {actionHistory.map((action) => (
              <div key={action.id} className="px-5 py-3">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-xs font-semibold capitalize ${
                    action.action === 'approved' ? 'text-emerald-600' : action.action === 'rejected' ? 'text-red-600' : 'text-[var(--ink)]'
                  }`}>{action.action}</span>
                  <span className="text-xs text-[var(--muted)]">&middot; {action.reviewer}</span>
                  <span className="text-xs text-[var(--muted)]">&middot; {formatDate(action.createdAt)}</span>
                </div>
                {action.notes && <p className="text-xs text-[var(--muted)] italic">"{action.notes}"</p>}
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
