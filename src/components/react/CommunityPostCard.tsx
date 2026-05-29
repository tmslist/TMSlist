import CommunityAuthorBadge from './CommunityAuthorBadge';
import CommunityVoteButton from './CommunityVoteButton';

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
  lastActivityAt?: string;
  authorId?: string;
  authorName: string | null;
  authorRole: string;
  authorClinicId: string | null;
  categorySlug: string;
  categoryName: string;
  categoryColor: string | null;
  doctorName?: string | null;
  credential?: string | null;
  imageUrl?: string | null;
}

interface CommunityPostCardProps {
  post: PostData;
  userVote?: number;
  isAuthenticated: boolean;
  showCategory?: boolean;
  isSaved?: boolean;
  isNew?: boolean;
  isActive?: boolean;
  recentActivity?: number;
  onBookmarkToggle?: (postId: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  violet: 'bg-[rgba(10,22,40,0.08)] text-[var(--accent)]',
  emerald: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  rose: 'bg-[rgba(201,101,74,0.1)] text-[var(--warm)]',
  yellow: 'bg-yellow-100 text-yellow-700',
  blue: 'bg-[rgba(10,22,40,0.1)] text-[var(--accent)]',
  teal: 'bg-teal-100 text-teal-700',
  indigo: 'bg-[rgba(201,101,74,0.1)] text-[var(--warm)]',
};

function timeAgo(dateStr: string | Date): string {
  const date = dateStr instanceof Date ? dateStr : new Date(dateStr);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
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

export default function CommunityPostCard({
  post,
  userVote,
  isAuthenticated,
  showCategory = true,
  isSaved = false,
  isNew = false,
  isActive = false,
  recentActivity = 0,
  onBookmarkToggle,
}: CommunityPostCardProps) {
  const preview = post.body.length > 200 ? post.body.slice(0, 200) + '...' : post.body;
  const colorClass = CATEGORY_COLORS[post.categoryColor || 'violet'] || CATEGORY_COLORS.violet;

  const isNewPost = () => {
    const hoursAge = (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);
    return hoursAge < 24;
  };

  const isActiveThread = () => {
    if (post.lastActivityAt) {
      const minsAge = (Date.now() - new Date(post.lastActivityAt).getTime()) / (1000 * 60);
      return minsAge < 60;
    }
    return recentActivity > 0 || (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60) < 30;
  };

  return (
    <div className={`flex gap-3 bg-white rounded-xl border ${post.isPinned ? 'border-amber-200 bg-amber-50/30' : 'border-[var(--line)]'} p-4 hover:border-[rgba(10,22,40,0.15)] hover:shadow-sm transition-all`}>
      {/* Vote column */}
      <CommunityVoteButton
        targetType="post"
        targetId={post.id}
        initialScore={post.voteScore}
        initialVote={userVote}
        isAuthenticated={isAuthenticated}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Meta row */}
        <div className="flex items-center gap-2 flex-wrap mb-1.5">
          {post.isPinned && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 uppercase">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Pinned
            </span>
          )}
          {(isNew || isNewPost()) && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase bg-emerald-50 px-1.5 py-0.5 rounded">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              New
            </span>
          )}
          {(isActive || isActiveThread()) && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 uppercase bg-rose-50 px-1.5 py-0.5 rounded">
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></span>
              Active
            </span>
          )}
          {showCategory && (
            <a
              href={`/community/${post.categorySlug}`}
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${colorClass} hover:opacity-80 transition-opacity`}
            >
              {post.categoryName}
            </a>
          )}
          <span className="text-[11px] text-[var(--muted)]">{timeAgo(post.createdAt)}</span>
          {post.isLocked && (
            <span className="text-[10px] text-[var(--muted)] flex items-center gap-0.5">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Locked
            </span>
          )}
        </div>

        {/* Title */}
        <a
          href={`/community/${post.categorySlug}/${post.slug}`}
          className="block text-base font-bold text-[var(--ink)] hover:text-[var(--accent)] transition-colors mb-1 leading-snug"
        >
          {post.title}
        </a>

        {/* Preview */}
        <p className="text-sm text-[var(--ink2)] mb-2.5 line-clamp-2 leading-relaxed">{preview}</p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <a href={post.authorId ? `/community/user/${post.authorId}` : '#'} className="hover:opacity-80 transition-opacity">
            <CommunityAuthorBadge
              authorName={post.doctorName || post.authorName}
              authorRole={post.authorRole}
              credential={post.credential || undefined}
              imageUrl={post.imageUrl || undefined}
            />
          </a>

          <div className="flex items-center gap-3">
            {/* Bookmark button */}
            {onBookmarkToggle && (
              <button
                onClick={() => onBookmarkToggle(post.id)}
                className={`p-1 rounded transition-colors ${isSaved ? 'text-[var(--accent)]' : 'text-[var(--muted)] hover:text-[var(--accent)]'}`}
                aria-label={isSaved ? 'Remove bookmark' : 'Bookmark post'}
              >
                <svg className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                </svg>
              </button>
            )}

            {/* Comments count */}
            <a
              href={`/community/${post.categorySlug}/${post.slug}`}
              className="flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
              </svg>
              <span className="font-semibold">{post.commentCount}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
