import { useState, useEffect } from 'react';

interface TrendingPost {
  id: string;
  title: string;
  slug: string;
  categoryName: string;
  categoryColor: string | null;
  voteScore: number;
  commentCount: number;
  velocity: number;
}

interface TrendingTopicsProps {
  initialPosts?: TrendingPost[];
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

const SAMPLE_TRENDING: TrendingPost[] = [
  { id: '1', title: 'FDA approves new accelerated TMS protocol - 18 minutes instead of 37', slug: 'fda-tms-protocol', categoryName: 'Research & Studies', categoryColor: 'blue', voteScore: 52, commentCount: 31, velocity: 200 },
  { id: '2', title: 'Two years post-TMS: Still feeling great! Long-term success story', slug: 'tms-long-term', categoryName: 'Success Stories', categoryColor: 'yellow', voteScore: 89, commentCount: 42, velocity: 180 },
  { id: '3', title: 'Insurance denied TMS twice - what documentation helped you appeal?', slug: 'insurance-appeal', categoryName: 'Insurance & Cost', categoryColor: 'amber', voteScore: 35, commentCount: 18, velocity: 150 },
  { id: '4', title: 'TMS for Depression - My 6-week journey complete breakdown', slug: 'tms-depression', categoryName: 'Treatment Experiences', categoryColor: 'violet', voteScore: 47, commentCount: 23, velocity: 120 },
  { id: '5', title: 'Headache after each session - is this normal? Day 5 concern', slug: 'side-effects', categoryName: 'Side Effects & Recovery', categoryColor: 'rose', voteScore: 28, commentCount: 15, velocity: 90 },
];

const getCategorySlug = (name: string) => name.toLowerCase().replace(/\s+&\s+/g, '-').replace(/\s+/g, '-');

export default function CommunityTrending({ initialPosts = [] }: TrendingTopicsProps) {
  const [posts, setPosts] = useState<TrendingPost[]>(initialPosts.length > 0 ? initialPosts : SAMPLE_TRENDING);
  const [loading, setLoading] = useState(initialPosts.length === 0);
  const [timeframe, setTimeframe] = useState<'24h' | '7d'>('24h');

  useEffect(() => {
    if (initialPosts.length > 0) return;

    const fetchTrending = async () => {
      try {
        const res = await fetch(`/api/community/trending?timeframe=${timeframe}`);
        if (res.ok) {
          const data = await res.json();
          setPosts(data.posts?.length > 0 ? data.posts : SAMPLE_TRENDING);
        }
      } catch (err) {
        console.error('Failed to fetch trending:', err);
        setPosts(SAMPLE_TRENDING);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchTrending, 500);
    return () => clearTimeout(timer);
  }, [timeframe]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-[var(--paper2)] rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-6 text-[var(--muted)] text-sm">
        No trending topics yet. Start a discussion!
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-[var(--ink)] flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
          </svg>
          Trending Now
        </h3>
        <div className="flex gap-1 text-xs">
          <button
            onClick={() => setTimeframe('24h')}
            className={`px-2 py-1 rounded ${timeframe === '24h' ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)] hover:text-[var(--ink2)]'}`}
          >
            24h
          </button>
          <button
            onClick={() => setTimeframe('7d')}
            className={`px-2 py-1 rounded ${timeframe === '7d' ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)] hover:text-[var(--ink2)]'}`}
          >
            7d
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {posts.slice(0, 5).map((post, index) => {
          const colorClass = CATEGORY_COLORS[post.categoryColor || 'violet'] || CATEGORY_COLORS.violet;
          return (
            <a
              key={post.id}
              href={`/community/${getCategorySlug(post.categoryName)}/${post.slug}`}
              className="flex items-start gap-3 p-3 bg-white border border-[var(--line)] rounded-lg hover:border-[rgba(10,22,40,0.15)] hover:shadow-sm transition-all group"
            >
              <span className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                index === 0 ? 'bg-amber-100 text-amber-700' :
                index === 1 ? 'bg-gray-100 text-gray-600' :
                index === 2 ? 'bg-orange-100 text-orange-700' :
                'bg-[var(--paper2)] text-[var(--muted)]'
              }`}>
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors line-clamp-2 leading-snug">
                  {post.title}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${colorClass}`}>
                    {post.categoryName}
                  </span>
                  <span className="text-[10px] text-[var(--muted)] flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                    {post.voteScore}
                  </span>
                  <span className="text-[10px] text-[var(--muted)] flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {post.commentCount}
                  </span>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}