import { useState, useEffect } from 'react';

interface Post {
  id: string;
  title: string;
  author: string;
  createdAt: string;
  status: 'published' | 'draft' | 'scheduled';
  flags: string[];
  replyCount: number;
}

interface Comment {
  id: string;
  postId: string;
  author: string;
  body: string;
  createdAt: string;
  flagged: boolean;
  flagReason?: string;
}

export default function AdminForumModeration() {
  const [tab, setTab] = useState<'posts' | 'comments' | 'flagged'>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [tab]);

  async function loadData() {
    setLoading(true);
    try {
      const [postsRes, commentsRes] = await Promise.all([
        fetch('/api/admin/forum/posts').then(r => r.ok ? r.json() : { posts: [] }),
        fetch('/api/admin/forum/comments').then(r => r.ok ? r.json() : { comments: [] }),
      ]);
      setPosts(postsRes.posts || []);
      setComments(commentsRes.comments || []);
    } catch { /* silent */ }
    setLoading(false);
  }

  async function moderateAction(id: string, action: 'approve' | 'reject' | 'flag') {
    try {
      await fetch(`/api/admin/forum/${action === 'flag' ? 'flag' : 'moderate'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      if (action === 'reject') {
        setPosts(prev => prev.filter(p => p.id !== id));
        setComments(prev => prev.filter(c => c.id !== id));
      }
    } catch { /* silent */ }
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Forum Moderation</h1>
          <p className="text-gray-500 mt-1">Review posts, comments, and flagged content</p>
        </div>
        <div className="flex gap-3">
          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
            {comments.filter(c => c.flagged).length} flagged
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-8 w-fit">
        {(['posts', 'comments', 'flagged'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'posts' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Author</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Replies</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{post.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{post.author}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatDate(post.createdAt)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      post.status === 'published' ? 'bg-emerald-100 text-emerald-700' :
                      post.status === 'draft' ? 'bg-gray-100 text-gray-600' : 'bg-violet-100 text-violet-700'
                    }`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{post.replyCount}</td>
                  <td className="px-6 py-4 flex gap-2">
                    {post.status === 'draft' && (
                      <button onClick={() => moderateAction(post.id, 'approve')} className="text-xs font-medium text-emerald-600 hover:text-emerald-700">Approve</button>
                    )}
                    <button onClick={() => moderateAction(post.id, 'reject')} className="text-xs font-medium text-red-600 hover:text-red-700">Reject</button>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No posts to review</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'comments' && (
        <div className="space-y-4">
          {comments.filter(c => !c.flagged).map((comment) => (
            <div key={comment.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900">{comment.author}</p>
                  <p className="text-sm text-gray-600 mt-1">{comment.body}</p>
                  <p className="text-xs text-gray-400 mt-2">{formatDate(comment.createdAt)}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => moderateAction(comment.id, 'approve')} className="px-3 py-1 text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors">Approve</button>
                  <button onClick={() => moderateAction(comment.id, 'flag')} className="px-3 py-1 text-xs font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors">Flag</button>
                  <button onClick={() => moderateAction(comment.id, 'reject')} className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">Reject</button>
                </div>
              </div>
            </div>
          ))}
          {comments.filter(c => !c.flagged).length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-500">No pending comments</p>
            </div>
          )}
        </div>
      )}

      {tab === 'flagged' && (
        <div className="space-y-4">
          {comments.filter(c => c.flagged).map((comment) => (
            <div key={comment.id} className="bg-red-50 border border-red-200 rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-red-900">{comment.author}</p>
                  <p className="text-sm text-red-700 mt-0.5">
                    Flagged: {comment.flagReason || 'Inappropriate content'}
                  </p>
                </div>
                <span className="px-2 py-1 bg-red-200 text-red-800 text-xs rounded-full font-medium">Flagged</span>
              </div>
              <p className="text-sm text-red-800 mb-4">{comment.body}</p>
              <div className="flex gap-2">
                <button onClick={() => moderateAction(comment.id, 'approve')} className="px-4 py-2 text-sm font-medium text-emerald-700 bg-white border border-emerald-200 hover:bg-emerald-50 rounded-lg transition-colors">Approve</button>
                <button onClick={() => moderateAction(comment.id, 'reject')} className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-200 hover:bg-red-50 rounded-lg transition-colors">Remove</button>
              </div>
            </div>
          ))}
          {comments.filter(c => c.flagged).length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-500">No flagged content</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}