import { useState, useEffect } from 'react';
import { TargetIcon, HospitalIcon, EditIcon, UserIcon, LockIcon, StarIcon, CheckIcon } from './Icons';
import type React from 'react';

interface Notification {
  id: string;
  type: 'lead' | 'review' | 'clinic' | 'blog' | 'user' | 'security' | string;
  icon: React.ReactNode;
  title: string;
  description: string;
  timeAgo: string;
  link: string;
  read: boolean;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  lead: <TargetIcon size={20} />,
  review: <StarIcon size={20} />,
  clinic: <HospitalIcon size={20} />,
  blog: <EditIcon size={20} />,
  user: <UserIcon size={20} />,
  security: <LockIcon size={20} />,
  enquiry: <TargetIcon size={20} />,
  newsletter: <EditIcon size={20} />,
};

function timeAgo(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

const LINK_MAP: Record<string, string> = {
  lead: '/admin/leads',
  review: '/admin/reviews',
  clinic: '/admin/clinics',
  blog: '/admin/blog',
  user: '/admin/users',
  security: '/admin/audit',
  enquiry: '/admin/enquiries',
  newsletter: '/admin/newsletter',
  system: '/admin/dashboard',
};

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch('/api/admin/notifications?limit=50');
        if (res.ok) {
          const data = await res.json();
          const mapped: Notification[] = (data.notifications || []).map((n: any) => ({
            id: n.notification?.id || n.id || String(Math.random()),
            type: n.notification?.type || n.type || 'system',
            icon: TYPE_ICONS[n.notification?.type || n.type] || TYPE_ICONS.blog,
            title: n.notification?.title || n.title || 'Notification',
            description: n.notification?.message || n.message || '',
            timeAgo: n.notification?.createdAt ? timeAgo(n.notification.createdAt) : 'recently',
            link: n.notification?.link || LINK_MAP[n.notification?.type || n.type] || '/admin/dashboard',
            read: n.notification?.read ?? n.read ?? true,
          }));
          setNotifications(mapped);
        }
      } catch {
        // fail silently
      } finally {
        setLoading(false);
      }
    }
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
    } catch {
      // best-effort
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleMarkRead = async (id: string) => {
    try {
      await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch {
      // best-effort
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const filteredNotifications = notifications.filter((n) =>
    filter === 'unread' ? !n.read : true
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-[rgba(10,22,40,0.08)] text-[var(--ink)]'
                : 'bg-white text-[var(--ink2)] hover:bg-[var(--paper2)] border border-[var(--line)]'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-[rgba(10,22,40,0.08)] text-[var(--ink)]'
                : 'bg-white text-[var(--ink2)] hover:bg-[var(--paper2)] border border-[var(--line)]'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-sm text-[var(--ink)] hover:text-[var(--ink)] font-medium"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-[var(--line)] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <svg className="w-8 h-8 mx-auto text-[var(--muted)] animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-sm text-[var(--muted)] mt-3">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--paper2)] flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-[var(--ink)] mb-1">No notifications</h3>
            <p className="text-[var(--muted)]">
              {filter === 'unread' ? 'You have read all your notifications.' : 'You have no notifications yet.'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start gap-4 p-4 border-b border-[var(--line)] last:border-0 hover:bg-[var(--paper2)] transition-colors ${
                !notification.read ? 'bg-[rgba(10,22,40,0.08)]/30' : ''
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                !notification.read ? 'bg-[rgba(10,22,40,0.08)]' : 'bg-[var(--paper2)]'
              }`}>
                <span className="text-lg flex items-center justify-center">{notification.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[var(--ink)]">{notification.title}</span>
                  {!notification.read && (
                    <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  )}
                </div>
                <p className="text-sm text-[var(--muted)] mt-0.5">{notification.description}</p>
                <span className="text-xs text-[var(--muted)] mt-1 block">{notification.timeAgo}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!notification.read && (
                  <button
                    onClick={() => handleMarkRead(notification.id)}
                    className="text-xs text-[var(--muted)] hover:text-[var(--ink2)] px-2 py-1 rounded hover:bg-[var(--paper2)]"
                    title="Mark as read"
                  >
                    <CheckIcon size={12} />
                  </button>
                )}
                <a
                  href={notification.link}
                  className="text-xs text-[var(--ink)] hover:text-[var(--ink)] font-medium px-2 py-1 rounded hover:bg-[rgba(10,22,40,0.08)]"
                >
                  View
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
