import { useState, useEffect } from 'react';

interface ActivityItem {
  id: string;
  type: 'post' | 'comment' | 'answer';
  postTitle: string;
  postSlug: string;
  categoryName: string;
  authorName: string | null;
  authorRole: string;
  doctorName?: string | null;
  credential?: string | null;
  targetAuthorName?: string | null;
  createdAt: string;
}

interface ActivityFeedProps {
  initialActivities?: ActivityItem[];
}

function timeAgo(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'unknown';
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 0) return 'just now';
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  } catch {
    return 'recently';
  }
}

const ACTIVITY_ICONS = {
  post: {
    path: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l-.172-.172z',
    color: 'text-blue-500 bg-blue-50',
  },
  comment: {
    path: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
    color: 'text-teal-500 bg-teal-50',
  },
  answer: {
    path: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    color: 'text-emerald-500 bg-emerald-50',
  },
};

const ROLE_LABELS: Record<string, string> = {
  clinic_owner: 'TMS Specialist',
  patient: 'Patient',
  admin: 'Admin',
};

const SAMPLE_ACTIVITIES: ActivityItem[] = [
  { id: '1', type: 'post', postTitle: 'FDA approves new accelerated TMS protocol - 18 minutes instead of 37', postSlug: 'fda-tms-protocol', categoryName: 'Research & Studies', authorName: 'Dr. Emily Chen', authorRole: 'clinic_owner', doctorName: 'Dr. Emily Chen', credential: 'MD, PhD', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: '2', type: 'answer', postTitle: 'Does insurance cover TMS in 2026? Success stories needed', postSlug: 'insurance-appeal', categoryName: 'Insurance & Cost', authorName: 'Dr. Robert Martinez', authorRole: 'clinic_owner', doctorName: 'Dr. Robert Martinez', credential: 'MD', targetAuthorName: 'Michael R.', createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
  { id: '3', type: 'comment', postTitle: 'Headache after each session - is this normal?', postSlug: 'side-effects', categoryName: 'Side Effects & Recovery', authorName: 'Dr. Sarah Kim', authorRole: 'clinic_owner', doctorName: 'Dr. Sarah Kim', credential: 'MD', targetAuthorName: 'Jennifer L.', createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() },
  { id: '4', type: 'post', postTitle: 'Two years post-TMS: Still feeling great!', postSlug: 'tms-long-term', categoryName: 'Success Stories', authorName: 'David K.', authorRole: 'patient', createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() },
  { id: '5', type: 'comment', postTitle: 'TMS for Depression - My 6-week journey', postSlug: 'tms-depression', categoryName: 'Treatment Experiences', authorName: 'Lisa M.', authorRole: 'patient', targetAuthorName: 'Sarah M.', createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() },
  { id: '6', type: 'answer', postTitle: 'Insurance denied TMS twice - what worked for appeals?', postSlug: 'insurance-appeal-2', categoryName: 'Insurance & Cost', authorName: 'Dr. James Wilson', authorRole: 'clinic_owner', doctorName: 'Dr. James Wilson', credential: 'MD, PhD', targetAuthorName: 'Rachel T.', createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString() },
];

const getCategorySlug = (name: string) => name.toLowerCase().replace(/\s+&\s+/g, '-').replace(/\s+/g, '-');

export default function CommunityActivityFeed({ initialActivities = [] }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>(initialActivities.length > 0 ? initialActivities : SAMPLE_ACTIVITIES);
  const [loading, setLoading] = useState(initialActivities.length === 0);
  const [filter, setFilter] = useState<'all' | 'post' | 'comment' | 'answer'>('all');

  useEffect(() => {
    if (initialActivities.length > 0) return;

    const fetchActivity = async () => {
      try {
        const res = await fetch('/api/community/recent-activity');
        if (res.ok) {
          const data = await res.json();
          setActivities(data.activities?.length > 0 ? data.activities : SAMPLE_ACTIVITIES);
        }
      } catch (err) {
        console.error('Failed to fetch activity feed:', err);
        setActivities(SAMPLE_ACTIVITIES);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchActivity, 500);
    return () => clearTimeout(timer);
  }, []);

  const filteredActivities = filter === 'all'
    ? activities
    : activities.filter(a => a.type === filter);

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

  if (activities.length === 0) {
    return (
      <div className="text-center py-6 text-[var(--muted)] text-sm">
        No recent activity yet. Be the first to start a discussion!
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-[var(--ink)] flex items-center gap-2">
          <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Live Feed
        </h3>
        <div className="flex gap-1 text-xs">
          {(['all', 'post', 'comment'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-1 rounded capitalize ${filter === f ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)] hover:text-[var(--ink2)]'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filteredActivities.slice(0, 8).map((activity) => {
          const icon = ACTIVITY_ICONS[activity.type];
          const roleLabel = ROLE_LABELS[activity.authorRole] || activity.authorRole;
          const displayName = activity.doctorName || activity.authorName || 'Anonymous';

          return (
            <a
              key={activity.id}
              href={`/community/${getCategorySlug(activity.categoryName)}/${activity.postSlug}`}
              className="flex items-start gap-3 p-3 bg-white border border-[var(--line)] rounded-lg hover:border-[rgba(10,22,40,0.15)] hover:shadow-sm transition-all group"
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${icon.color}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={icon.path} />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-semibold text-[var(--ink)]">
                    {displayName}
                  </span>
                  <span className="text-[10px] text-[var(--muted)] px-1.5 py-0.5 bg-[var(--paper2)] rounded">
                    {roleLabel}
                  </span>
                  <span className="text-[10px] text-[var(--muted)]">
                    {activity.type === 'post' ? 'posted' : activity.type === 'answer' ? 'answered' : 'replied'}
                  </span>
                  <span className="text-[10px] text-[var(--muted)]">
                    {timeAgo(activity.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-[var(--ink2)] group-hover:text-[var(--accent)] transition-colors line-clamp-2 leading-relaxed mt-0.5">
                  {activity.postTitle}
                </p>
                <p className="text-[10px] text-[var(--muted)] mt-1">
                  in {activity.categoryName}
                  {activity.targetAuthorName && activity.type !== 'post' && (
                    <span className="text-[var(--accent)]"> ← {activity.targetAuthorName}</span>
                  )}
                </p>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}