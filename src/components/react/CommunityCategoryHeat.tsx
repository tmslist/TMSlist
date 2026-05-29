import { useState, useEffect } from 'react';

interface CategoryActivity {
  id: string;
  slug: string;
  name: string;
  color: string | null;
  icon: string | null;
  postCount: number;
  recentPosts: number;
  recentComments: number;
  activityScore: number;
}

interface CategoryHeatProps {
  initialData?: CategoryActivity[];
}

const CATEGORY_ICONS: Record<string, string> = {
  brain: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
  specialist: 'M10 6h4m-2 0v12m-4-4h8m-6 0v4m8-8v4m-8 0v4',
  currency: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  health: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  star: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  chart: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  heart: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
};

const HEAT_COLORS = [
  'bg-emerald-200 border-emerald-300',
  'bg-emerald-100 border-emerald-200',
  'bg-amber-50 border-amber-100',
  'bg-[var(--paper2)] border-[var(--line)]',
];

const SAMPLE_CATEGORIES: CategoryActivity[] = [
  { id: '1', slug: 'treatment-experiences', name: 'Treatment Experiences', color: 'violet', icon: 'brain', postCount: 156, recentPosts: 12, recentComments: 45, activityScore: 105 },
  { id: '2', slug: 'ask-a-specialist', name: 'Ask a Specialist', color: 'emerald', icon: 'specialist', postCount: 89, recentPosts: 8, recentComments: 67, activityScore: 99 },
  { id: '3', slug: 'insurance-cost', name: 'Insurance & Cost', color: 'amber', icon: 'currency', postCount: 124, recentPosts: 15, recentComments: 38, activityScore: 113 },
  { id: '4', slug: 'side-effects-recovery', name: 'Side Effects & Recovery', color: 'rose', icon: 'health', postCount: 78, recentPosts: 6, recentComments: 52, activityScore: 74 },
  { id: '5', slug: 'success-stories', name: 'Success Stories', color: 'yellow', icon: 'star', postCount: 234, recentPosts: 18, recentComments: 89, activityScore: 177 },
  { id: '6', slug: 'research-studies', name: 'Research & Studies', color: 'blue', icon: 'chart', postCount: 67, recentPosts: 4, recentComments: 23, activityScore: 43 },
];

function getHeatLevel(score: number, max: number): number {
  if (max === 0) return 0;
  const ratio = score / max;
  if (ratio >= 0.75) return 0;
  if (ratio >= 0.5) return 1;
  if (ratio >= 0.25) return 2;
  return 3;
}

export default function CommunityCategoryHeat({ initialData = [] }: CategoryHeatProps) {
  const [categories, setCategories] = useState<CategoryActivity[]>(initialData.length > 0 ? initialData : SAMPLE_CATEGORIES);
  const [loading, setLoading] = useState(initialData.length === 0);

  useEffect(() => {
    if (initialData.length > 0) return;

    const fetchActivity = async () => {
      try {
        const res = await fetch('/api/community/category-activity');
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories?.length > 0 ? data.categories : SAMPLE_CATEGORIES);
        }
      } catch (err) {
        console.error('Failed to fetch category activity:', err);
        setCategories(SAMPLE_CATEGORIES);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchActivity, 300);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-20 animate-pulse bg-[var(--paper2)] rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  const maxActivity = Math.max(...categories.map(c => c.activityScore));
  const sortedByActivity = [...categories].sort((a, b) => b.activityScore - a.activityScore);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-[var(--ink)] flex items-center gap-2">
          <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
          </svg>
          Topic Activity
        </h3>
        <span className="text-[10px] text-[var(--muted)]">Last 24h</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {sortedByActivity.slice(0, 6).map((cat) => {
          const heatLevel = getHeatLevel(cat.activityScore, maxActivity);
          const heatClass = HEAT_COLORS[heatLevel];
          const iconPath = CATEGORY_ICONS[cat.icon || 'brain'] || CATEGORY_ICONS.brain;

          return (
            <a
              key={cat.id}
              href={`/community/${cat.slug}`}
              className={`flex items-center gap-2 p-2.5 rounded-lg border ${heatClass} hover:shadow-sm transition-all group`}
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center">
                <svg className="w-4 h-4 text-[var(--accent)]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors truncate">
                  {cat.name}
                </p>
                <p className="text-[10px] text-[var(--muted)]">
                  {cat.recentPosts > 0 && `${cat.recentPosts} new`}
                  {cat.recentPosts > 0 && cat.recentComments > 0 && ' · '}
                  {cat.recentComments > 0 && `${cat.recentComments} replies`}
                  {cat.recentPosts === 0 && cat.recentComments === 0 && 'No recent activity'}
                </p>
              </div>
            </a>
          );
        })}
      </div>

      {sortedByActivity[0] && (
        <div className="mt-3 flex items-center justify-between text-[10px] text-[var(--muted)]">
          <span>Hottest:</span>
          <span className="font-semibold text-[var(--ink)]">{sortedByActivity[0].name}</span>
        </div>
      )}
    </div>
  );
}