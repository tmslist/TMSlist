import { useState } from 'react';
import { TargetIcon, HospitalIcon, EditIcon, UserIcon, LockIcon, StarIcon, CheckIcon } from './Icons';
import type React from 'react';

interface Notification {
  id: string;
  type: 'lead' | 'review' | 'clinic' | 'blog' | 'user' | 'security';
  icon: React.ReactNode;
  title: string;
  description: string;
  timeAgo: string;
  link: string;
  read: boolean;
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'lead',
    icon: <TargetIcon size={20} />,
    title: 'New Lead',
    description: 'John D. submitted a specialist enquiry',
    timeAgo: '2m ago',
    link: '/admin/leads',
    read: false,
  },
  {
    id: '2',
    type: 'review',
    icon: <StarIcon size={20} />,
    title: 'Review Pending',
    description: '1 review awaiting moderation',
    timeAgo: '15m ago',
    link: '/admin/reviews',
    read: false,
  },
  {
    id: '3',
    type: 'clinic',
    icon: <HospitalIcon size={20} />,
    title: 'Clinic Claimed',
    description: 'New clinic claim pending review',
    timeAgo: '1h ago',
    link: '/admin/clinics',
    read: false,
  },
  {
    id: '4',
    type: 'blog',
    icon: <EditIcon size={20} />,
    title: 'Blog Draft',
    description: 'Draft post needs review',
    timeAgo: '3h ago',
    link: '/admin/blog',
    read: true,
  },
  {
    id: '5',
    type: 'user',
    icon: <UserIcon size={20} />,
    title: 'New User',
    description: 'New user signed up: jane@example.com',
    timeAgo: '5h ago',
    link: '/admin/users',
    read: true,
  },
  {
    id: '6',
    type: 'security',
    icon: <LockIcon size={20} />,
    title: 'Security',
    description: 'Failed login attempt detected',
    timeAgo: '1d ago',
    link: '/admin/audit',
    read: true,
  },
];

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleMarkRead = (id: string) => {
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
      {/* Filters and actions */}
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

      {/* Notifications list */}
      <div className="bg-white rounded-xl border border-[var(--line)] overflow-hidden">
        {filteredNotifications.length === 0 ? (
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
              {/* Icon */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                !notification.read ? 'bg-[rgba(10,22,40,0.08)]' : 'bg-[var(--paper2)]'
              }`}>
                <span className="text-lg flex items-center justify-center">{notification.icon}</span>
              </div>

              {/* Content */}
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

              {/* Actions */}
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
