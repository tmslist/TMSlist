import { useState, useCallback, useRef } from 'react';
import CommunityPostCard from './CommunityPostCard';

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

interface CommunityPostListProps {
  initialPosts: PostData[];
  categoryId?: string;
  isAuthenticated: boolean;
  userVotes?: Record<string, number>;
  savedPostIds?: string[];
  showCategory?: boolean;
}

type SortOption = 'hot' | 'new' | 'top';
type TopPeriod = 'week' | 'month' | 'all';

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: 'hot', label: 'Hot' },
  { key: 'new', label: 'New' },
  { key: 'top', label: 'Top' },
];

const TOP_PERIODS: { key: TopPeriod; label: string }[] = [
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'all', label: 'All Time' },
];

export default function CommunityPostList({
  initialPosts,
  categoryId,
  isAuthenticated,
  userVotes = {},
  savedPostIds = [],
  showCategory = true,
}: CommunityPostListProps) {
  const [posts, setPosts] = useState<PostData[]>(initialPosts);
  const [sort, setSort] = useState<SortOption>('hot');
  const [topPeriod, setTopPeriod] = useState<TopPeriod>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialPosts.length >= 20);
  const [savedSet, setSavedSet] = useState<Set<string>>(new Set(savedPostIds));
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  const fetchPosts = useCallback(async (sortBy: SortOption, period: TopPeriod, search: string, offset = 0) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort: sortBy, topPeriod: period, limit: '20', offset: String(offset) });
      if (categoryId) params.set('categoryId', categoryId);
      if (search) params.set('search', search);

      const res = await fetch(`/api/community/posts?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');

      const data = await res.json();
      if (offset === 0) {
        setPosts(data.posts);
      } else {
        setPosts(prev => [...prev, ...data.posts]);
      }
      setHasMore(data.posts.length >= 20);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setLoading(false);
    }
  }, [categoryId, sort, topPeriod, activeSearch]);

  const handleSortChange = useCallback((newSort: SortOption) => {
    setSort(newSort);
    if (newSort !== 'top') setTopPeriod('all');
    fetchPosts(newSort, newSort === 'top' ? topPeriod : 'all', activeSearch, 0);
  }, [fetchPosts, topPeriod, activeSearch]);

  const handleTopPeriodChange = useCallback((period: TopPeriod) => {
    setTopPeriod(period);
    fetchPosts('top', period, activeSearch, 0);
  }, [fetchPosts, activeSearch]);

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setActiveSearch(value);
      fetchPosts(sort, topPeriod, value, 0);
    }, 400);
  }, [fetchPosts, sort, topPeriod]);

  const handleLoadMore = useCallback(() => {
    fetchPosts(sort, topPeriod, activeSearch, posts.length);
  }, [fetchPosts, sort, topPeriod, activeSearch, posts.length]);

  const handleBookmarkToggle = useCallback(async (postId: string) => {
    if (!isAuthenticated) {
      window.location.href = `/community/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    const wasSaved = savedSet.has(postId);
    setSavedSet(prev => {
      const next = new Set(prev);
      wasSaved ? next.delete(postId) : next.add(postId);
      return next;
    });
    try {
      await fetch('/api/community/bookmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });
    } catch {
      // revert on failure
      setSavedSet(prev => {
        const next = new Set(prev);
        wasSaved ? next.add(postId) : next.delete(postId);
        return next;
      });
    }
  }, [isAuthenticated, savedSet]);

  return (
    <div>
      {/* Search bar */}
      <div className="mb-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search discussions..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder-gray-400"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setActiveSearch(''); fetchPosts(sort, topPeriod, '', 0); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Sort tabs */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => handleSortChange(opt.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                sort === opt.key
                  ? 'bg-violet-100 text-violet-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Top period sub-filter */}
        {sort === 'top' && (
          <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1">
            {TOP_PERIODS.map(opt => (
              <button
                key={opt.key}
                onClick={() => handleTopPeriodChange(opt.key)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  topPeriod === opt.key
                    ? 'bg-violet-100 text-violet-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Active search indicator */}
      {activeSearch && (
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
          <span>Results for "<span className="font-semibold text-gray-700">{activeSearch}</span>"</span>
          <button
            onClick={() => { setSearchQuery(''); setActiveSearch(''); fetchPosts(sort, topPeriod, '', 0); }}
            className="text-violet-600 hover:text-violet-700 font-medium"
          >
            Clear
          </button>
        </div>
      )}

      {/* Posts */}
      <div className="space-y-3">
        {posts.length === 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
            </svg>
            <p className="text-gray-500 text-sm">
              {activeSearch ? 'No posts match your search.' : 'No posts yet. Be the first to start a discussion!'}
            </p>
          </div>
        )}

        {posts.map(post => (
          <CommunityPostCard
            key={post.id}
            post={post}
            userVote={userVotes[post.id]}
            isAuthenticated={isAuthenticated}
            showCategory={showCategory}
            isSaved={savedSet.has(post.id)}
            onBookmarkToggle={handleBookmarkToggle}
          />
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="text-center mt-6">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="px-6 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-violet-200 transition-all disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
