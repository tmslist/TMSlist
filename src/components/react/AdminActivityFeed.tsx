import { useState, useEffect } from 'react';

interface ActivityItem {
  id: string;
  actorName: string;
  actorInitials: string;
  action: 'added' | 'removed' | 'edited' | 'approved' | 'rejected' | 'exported';
  subject: string;
  timestamp: string;
}

interface AdminActivityFeedProps {
  maxItems?: number;
  className?: string;
}

const ACTION_COLORS: Record<ActivityItem['action'], string> = {
  added: 'text-emerald-400',
  removed: 'text-red-400',
  edited: 'text-[var(--warm)]',
  approved: 'text-emerald-400',
  rejected: 'text-red-400',
  exported: 'text-[var(--ink2)]',
};

function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

const AVATAR_COLORS = [
  'bg-[var(--ink)] text-white/80',
  'bg-emerald-900 text-emerald-300',
  'bg-amber-900 text-amber-300',
  'bg-[var(--ink)] text-[var(--muted)]',
  'bg-[var(--ink2)] text-[var(--muted)]',
];

function getAvatarClass(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function AdminActivityFeed({ maxItems = 10, className = '' }: AdminActivityFeedProps) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeed = async () => {
    try {
      const res = await fetch('/api/admin/activity-feed');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setItems((data.items || []).slice(0, maxItems));
      setError(null);
    } catch {
      setError('Could not load activity');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
    const interval = setInterval(fetchFeed, 30000);
    return () => clearInterval(interval);
  }, [maxItems]);

  if (loading) {
    return (
      <div className={className}>
        <h3 className="text-xs font-semibold text-[#8B9DB5] uppercase tracking-wide mb-3">Recent Activity</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-[#1E242C] shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-[#1E242C] rounded w-3/4" />
                <div className="h-2 bg-[#1E242C] rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <h3 className="text-xs font-semibold text-[#8B9DB5] uppercase tracking-wide mb-2">Recent Activity</h3>
        <p className="text-xs text-[#8B9DB5] opacity-60">{error}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={className}>
        <h3 className="text-xs font-semibold text-[#8B9DB5] uppercase tracking-wide mb-2">Recent Activity</h3>
        <p className="text-xs text-[#8B9DB5] opacity-60 text-center py-2">No recent activity</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <h3 className="text-xs font-semibold text-[#8B9DB5] uppercase tracking-wide mb-3">Recent Activity</h3>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-3">
            <div
              className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-semibold ${getAvatarClass(item.actorName)}`}
            >
              {item.actorInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#E6EAF0] leading-relaxed">
                <span className="font-medium">{item.actorName}</span>{' '}
                <span className={ACTION_COLORS[item.action]}>{item.action}</span>{' '}
                <span className="text-[#8B9DB5]">{item.subject}</span>
              </p>
              <p className="text-[11px] text-[#8B9DB5] opacity-60 mt-0.5">{formatRelativeTime(item.timestamp)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
