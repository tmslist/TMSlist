import { useState, useEffect } from 'react';

interface NotificationBellProps {
  userId: string;
}

export default function CommunityNotificationBell({ userId }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await fetch(`/api/community/notifications?userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.count || 0);
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUnreadCount();

    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [userId]);

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 rounded-lg hover:bg-[var(--paper2)] transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5 text-[var(--ink2)]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {!loading && unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-72 bg-white border border-[var(--line)] rounded-xl shadow-lg z-50 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[var(--line)]">
              <h3 className="font-bold text-[var(--ink)]">Notifications</h3>
              <a
                href="/community/notifications"
                className="text-xs text-[var(--accent)] hover:underline"
                onClick={() => setShowDropdown(false)}
              >
                View all
              </a>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {unreadCount === 0 ? (
                <div className="p-6 text-center text-sm text-[var(--muted)]">
                  <svg className="w-8 h-8 mx-auto mb-2 text-[var(--line)]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  No new notifications
                </div>
              ) : (
                <div className="p-4 text-sm text-[var(--ink2)]">
                  <p className="text-center">
                    <span className="font-bold text-rose-500">{unreadCount}</span> unread notification{unreadCount !== 1 ? 's' : ''}
                  </p>
                  <a
                    href="/community/notifications"
                    className="block mt-3 text-center text-[var(--accent)] font-medium hover:underline"
                    onClick={() => setShowDropdown(false)}
                  >
                    View your notifications
                  </a>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
