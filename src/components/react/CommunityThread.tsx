import { useState, useCallback } from 'react';
import CommunityAuthorBadge from './CommunityAuthorBadge';
import CommunityVoteButton from './CommunityVoteButton';
import CommunityCommentForm from './CommunityCommentForm';
import CommunityReportModal from './CommunityReportModal';

interface CommentData {
  id: string;
  postId: string;
  parentId: string | null;
  authorId: string;
  body: string;
  isAccepted?: boolean;
  voteScore: number;
  createdAt: string;
  updatedAt?: string;
  authorName: string | null;
  authorRole: string;
  authorClinicId: string | null;
  doctorName?: string | null;
  credential?: string | null;
  imageUrl?: string | null;
}

interface RelatedPost {
  id: string;
  slug: string;
  title: string;
  voteScore: number;
  commentCount: number;
  createdAt: string;
  categorySlug: string;
}

interface PostData {
  id: string;
  slug: string;
  title: string;
  body: string;
  isPinned: boolean;
  isLocked: boolean;
  voteScore: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  authorName: string | null;
  authorRole: string;
  authorClinicId: string | null;
  categorySlug: string;
  categoryName: string;
  categoryColor: string | null;
}

interface CommunityThreadProps {
  post: PostData;
  initialComments: CommentData[];
  relatedPosts?: RelatedPost[];
  isAuthenticated: boolean;
  currentUserId?: string;
  postVote?: number;
  commentVotes?: Record<string, number>;
  isPostAuthor?: boolean;
  categorySlug?: string;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function isEdited(createdAt: string, updatedAt?: string): boolean {
  if (!updatedAt) return false;
  return Math.abs(new Date(updatedAt).getTime() - new Date(createdAt).getTime()) > 60000;
}

function CommentItem({
  comment,
  replies,
  postId,
  isAuthenticated,
  isLocked,
  commentVotes,
  isPostAuthor,
}: {
  comment: CommentData;
  replies: CommentData[];
  postId: string;
  isAuthenticated: boolean;
  isLocked: boolean;
  commentVotes: Record<string, number>;
  isPostAuthor?: boolean;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [localReplies, setLocalReplies] = useState<CommentData[]>(replies);
  const [reportTarget, setReportTarget] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(comment.isAccepted || false);

  const handleReplyAdded = useCallback((newComment: CommentData) => {
    setLocalReplies(prev => [...prev, { ...newComment, authorName: 'You', authorRole: 'viewer', authorClinicId: null }]);
    setShowReplyForm(false);
  }, []);

  const handleAcceptAnswer = useCallback(async () => {
    try {
      const res = await fetch('/api/community/accept-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId: comment.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setAccepted(data.accepted);
      }
    } catch { /* ignore */ }
  }, [comment.id]);

  return (
    <div className="group">
      {/* Accepted answer highlight */}
      {accepted && (
        <div className="flex items-center gap-1.5 mb-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg w-fit">
          <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-xs font-semibold text-emerald-700">Accepted Answer</span>
        </div>
      )}

      <div className="flex gap-3">
        <CommunityVoteButton
          targetType="comment"
          targetId={comment.id}
          initialScore={comment.voteScore}
          initialVote={commentVotes[comment.id]}
          isAuthenticated={isAuthenticated}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <a href={`/community/user/${comment.authorId}`} className="hover:opacity-80 transition-opacity">
              <CommunityAuthorBadge
                authorName={comment.doctorName || comment.authorName}
                authorRole={comment.authorRole}
                credential={comment.credential || undefined}
                imageUrl={comment.imageUrl || undefined}
              />
            </a>
            <span className="text-[11px] text-[var(--muted)]">{timeAgo(comment.createdAt)}</span>
            {isEdited(comment.createdAt, comment.updatedAt) && (
              <span className="text-[10px] text-[var(--muted)] italic">edited</span>
            )}
          </div>

          <p className="text-sm text-[var(--ink2)] whitespace-pre-line mb-2 leading-relaxed">{comment.body}</p>

          <div className="flex items-center gap-3">
            {!isLocked && !comment.parentId && (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="text-xs text-[var(--muted)] hover:text-[var(--accent)] font-medium transition-colors"
              >
                Reply
              </button>
            )}
            {/* Accept answer button — only shown to post author, on top-level specialist comments */}
            {isPostAuthor && !comment.parentId && (comment.authorRole === 'clinic_owner' || comment.authorRole === 'admin') && (
              <button
                onClick={handleAcceptAnswer}
                className={`text-xs font-medium transition-colors ${accepted ? 'text-emerald-600' : 'text-[var(--muted)] hover:text-emerald-600 opacity-0 group-hover:opacity-100'}`}
              >
                {accepted ? 'Accepted' : 'Accept Answer'}
              </button>
            )}
            {isAuthenticated && (
              <button
                onClick={() => setReportTarget(comment.id)}
                className="text-xs text-[var(--muted)] hover:text-red-500 font-medium transition-colors opacity-0 group-hover:opacity-100"
              >
                Report
              </button>
            )}
          </div>

          {showReplyForm && (
            <div className="mt-2">
              <CommunityCommentForm
                postId={postId}
                parentId={comment.id}
                isAuthenticated={isAuthenticated}
                onCommentAdded={handleReplyAdded}
                onCancel={() => setShowReplyForm(false)}
                placeholder="Write a reply..."
              />
            </div>
          )}

          {/* Nested replies */}
          {localReplies.length > 0 && (
            <div className="mt-3 pl-4 border-l-2 border-[var(--line)] space-y-3">
              {localReplies.map(reply => (
                <div key={reply.id} className="flex gap-3 group">
                  <CommunityVoteButton
                    targetType="comment"
                    targetId={reply.id}
                    initialScore={reply.voteScore}
                    initialVote={commentVotes[reply.id]}
                    isAuthenticated={isAuthenticated}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <CommunityAuthorBadge
                        authorName={reply.doctorName || reply.authorName}
                        authorRole={reply.authorRole}
                        credential={reply.credential || undefined}
                        imageUrl={reply.imageUrl || undefined}
                      />
                      <span className="text-[11px] text-[var(--muted)]">{timeAgo(reply.createdAt)}</span>
                    </div>
                    <p className="text-sm text-[var(--ink2)] whitespace-pre-line leading-relaxed">{reply.body}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {reportTarget && (
        <CommunityReportModal
          targetType="comment"
          targetId={reportTarget}
          isOpen={true}
          onClose={() => setReportTarget(null)}
        />
      )}
    </div>
  );
}

export default function CommunityThread({
  post,
  initialComments,
  relatedPosts = [],
  isAuthenticated,
  currentUserId,
  postVote,
  commentVotes = {},
  isPostAuthor = false,
}: CommunityThreadProps) {
  const [comments, setComments] = useState<CommentData[]>(initialComments);
  const [reportingPost, setReportingPost] = useState(false);

  const handleCommentAdded = useCallback((newComment: CommentData) => {
    setComments(prev => [...prev, { ...newComment, authorName: 'You', authorRole: 'viewer', authorClinicId: null }]);
  }, []);

  // Group comments: top-level and their replies
  const topLevel = comments.filter(c => !c.parentId);
  const repliesByParent: Record<string, CommentData[]> = {};
  for (const c of comments) {
    if (c.parentId) {
      if (!repliesByParent[c.parentId]) repliesByParent[c.parentId] = [];
      repliesByParent[c.parentId].push(c);
    }
  }

  const postEdited = isEdited(post.createdAt, post.updatedAt);

  return (
    <div>
      {/* Post body */}
      <div className="bg-white rounded-xl border border-[var(--line)] p-6 mb-6">
        <div className="flex gap-4">
          <CommunityVoteButton
            targetType="post"
            targetId={post.id}
            initialScore={post.voteScore}
            initialVote={postVote}
            isAuthenticated={isAuthenticated}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <a
                href={`/community/${post.categorySlug}`}
                className="text-xs font-semibold text-[var(--accent)] hover:text-[var(--accent)]"
              >
                {post.categoryName}
              </a>
              <span className="text-[11px] text-[var(--muted)]">{timeAgo(post.createdAt)}</span>
              {postEdited && (
                <span className="text-[10px] text-[var(--muted)] italic">edited</span>
              )}
              {post.isPinned && (
                <span className="text-[10px] font-bold text-amber-600 uppercase">Pinned</span>
              )}
              {post.isLocked && (
                <span className="text-[10px] text-[var(--muted)] flex items-center gap-0.5">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Locked
                </span>
              )}
            </div>

            <h1 className="text-xl font-bold text-[var(--ink)] mb-3">{post.title}</h1>
            <div className="text-sm text-[var(--ink2)] whitespace-pre-line leading-relaxed mb-4">{post.body}</div>

            <div className="flex items-center justify-between pt-3 border-t border-[var(--line)]">
              <a href={`/community/user/${post.authorId}`} className="hover:opacity-80 transition-opacity">
                <CommunityAuthorBadge
                  authorName={post.authorName}
                  authorRole={post.authorRole}
                  size="md"
                />
              </a>

              <div className="flex items-center gap-3">
                <span className="text-xs text-[var(--muted)]">
                  {post.commentCount} comment{post.commentCount !== 1 ? 's' : ''}
                </span>
                {isAuthenticated && (
                  <button
                    onClick={() => setReportingPost(true)}
                    className="text-xs text-[var(--muted)] hover:text-red-500 transition-colors"
                  >
                    Report
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comment form */}
      {!post.isLocked && (
        <div className="mb-6">
          <CommunityCommentForm
            postId={post.id}
            isAuthenticated={isAuthenticated}
            onCommentAdded={handleCommentAdded}
          />
        </div>
      )}

      {post.isLocked && (
        <div className="bg-[var(--paper2)] border border-[var(--line)] rounded-lg p-4 text-center mb-6">
          <p className="text-sm text-[var(--muted)]">This thread has been locked. No new comments can be added.</p>
        </div>
      )}

      {/* Comments */}
      <div className="space-y-4">
        {topLevel.length === 0 && (
          <p className="text-sm text-[var(--muted)] text-center py-6">No comments yet. Be the first to share your thoughts!</p>
        )}

        {topLevel.map(comment => (
          <CommentItem
            key={comment.id}
            comment={comment}
            replies={repliesByParent[comment.id] || []}
            postId={post.id}
            isAuthenticated={isAuthenticated}
            isLocked={post.isLocked}
            commentVotes={commentVotes}
            isPostAuthor={isPostAuthor}
          />
        ))}
      </div>

      {/* Related posts */}
      {relatedPosts.length > 0 && (
        <div className="mt-8 pt-6 border-t border-[var(--line)]">
          <h3 className="text-sm font-bold text-[var(--ink)] mb-3">Related Discussions</h3>
          <div className="space-y-2">
            {relatedPosts.map(rp => (
              <a
                key={rp.id}
                href={`/community/${rp.categorySlug}/${rp.slug}`}
                className="flex items-center justify-between p-3 bg-white rounded-lg border border-[var(--line)] hover:border-[rgba(10,22,40,0.15)] hover:shadow-sm transition-all"
              >
                <span className="text-sm font-medium text-[var(--ink2)] line-clamp-1 flex-1 mr-3">{rp.title}</span>
                <div className="flex items-center gap-3 text-xs text-[var(--muted)] shrink-0">
                  <span>{rp.voteScore} votes</span>
                  <span>{rp.commentCount} comments</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Report modal for post */}
      {reportingPost && (
        <CommunityReportModal
          targetType="post"
          targetId={post.id}
          isOpen={true}
          onClose={() => setReportingPost(false)}
        />
      )}
    </div>
  );
}
