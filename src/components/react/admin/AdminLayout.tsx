/**
 * AdminLayout — Unified Admin Page Layout
 * Design System: Editorial Warm with Teal Accent
 *
 * Provides consistent layout across all admin pages:
 * - Sidebar navigation
 * - Top header with search and notifications
 * - Main content area
 * - Responsive design
 */
import React, { useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { AdminButton, AdminBadge } from './AdminBase';

interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: ReactNode;
  badge?: number;
}

interface AdminLayoutProps {
  children: ReactNode;
  currentPage: string;
  userEmail: string;
  isAdmin?: boolean;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  notifications?: Notification[];
  onNotificationClick?: (notification: Notification) => void;
}

// Sample notifications - replace with actual data
const DEFAULT_NOTIFICATIONS: Notification[] = [
  { id: '1', type: 'lead', icon: '🎯', title: 'New Lead', description: 'John D. submitted a specialist enquiry', timeAgo: '2m ago', link: '/admin/leads', read: false },
  { id: '2', type: 'review', icon: '⭐', title: 'Review Pending', description: '1 review awaiting moderation', timeAgo: '15m ago', link: '/admin/reviews', read: false },
  { id: '3', type: 'clinic', icon: '🏥', title: 'Clinic Claimed', description: 'New clinic claim pending review', timeAgo: '1h ago', link: '/admin/clinics', read: true },
  { id: '4', type: 'security', icon: '🔒', title: 'Security', description: 'Failed login attempt detected', timeAgo: '1d ago', link: '/admin/audit', read: true },
];

interface Notification {
  id: string;
  type: 'lead' | 'review' | 'clinic' | 'blog' | 'user' | 'security';
  icon: string;
  title: string;
  description: string;
  timeAgo: string;
  link: string;
  read: boolean;
}

// Navigation items
const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', href: '/admin/dashboard', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )},
  { key: 'clinics', label: 'Clinics', href: '/admin/clinics', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  )},
  { key: 'reviews', label: 'Reviews', href: '/admin/reviews', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  )},
  { key: 'leads', label: 'Leads', href: '/admin/leads', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )},
  { key: 'users', label: 'Users', href: '/admin/users', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )},
  { key: 'blog', label: 'Blog', href: '/admin/blog', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
    </svg>
  )},
  { key: 'analytics', label: 'Analytics', href: '/admin/analytics', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )},
  { key: 'audit', label: 'Audit Log', href: '/admin/audit', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  )},
  { key: 'settings', label: 'Settings', href: '/admin/settings', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )},
];

export function AdminLayout({
  children,
  currentPage,
  userEmail,
  isAdmin = false,
  title,
  subtitle,
  actions,
  notifications = DEFAULT_NOTIFICATIONS,
  onNotificationClick,
}: AdminLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close notification dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setNotificationOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0D10] flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-[#0B0D10] border-r border-[#21262D]">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#21262D]">
          <div className="w-8 h-8 rounded-lg bg-[var(--ink2)] flex items-center justify-center">
            <span className="text-white font-bold text-sm">TMS</span>
          </div>
          <div>
            <span className="text-[#E6EDF3] font-semibold text-sm">TMS List</span>
            <span className="block text-[10px] text-[#6E7681] uppercase tracking-wider">Admin</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = currentPage === item.key;
            return (
              <a
                key={item.key}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-100
                  ${isActive
                    ? 'bg-[rgba(30,42,59,0.15)] text-[var(--ink2)]'
                    : 'text-[#8B949E] hover:bg-[#161B22] hover:text-[#E6EDF3]'
                  }
                `}
              >
                <span className={isActive ? 'text-[var(--ink2)]' : 'text-[#6E7681]'}>
                  {item.icon}
                </span>
                {item.label}
                {item.badge && item.badge > 0 && (
                  <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-[var(--ink2)] text-white">
                    {item.badge}
                  </span>
                )}
              </a>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-[#21262D]">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-[var(--ink2)] flex items-center justify-center text-white text-xs font-semibold">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#E6EDF3] truncate">{userEmail}</p>
              <p className="text-xs text-[#6E7681]">{isAdmin ? 'Administrator' : 'User'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`
          lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-[#0B0D10] border-r border-[#21262D]
          transform transition-transform duration-200 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#21262D]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--ink2)] flex items-center justify-center">
              <span className="text-white font-bold text-sm">TMS</span>
            </div>
            <span className="text-[#E6EDF3] font-semibold text-sm">TMS List</span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="text-[#8B949E] hover:text-[#E6EDF3]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="py-4 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = currentPage === item.key;
            return (
              <a
                key={item.key}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-100
                  ${isActive
                    ? 'bg-[rgba(30,42,59,0.15)] text-[var(--ink2)]'
                    : 'text-[#8B949E] hover:bg-[#161B22] hover:text-[#E6EDF3]'
                  }
                `}
              >
                {item.icon}
                {item.label}
              </a>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-[#0B0D10]/80 backdrop-blur-lg border-b border-[#21262D]">
          <div className="flex items-center justify-between px-4 lg:px-6 py-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden text-[#8B949E] hover:text-[#E6EDF3]"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Page title - mobile */}
            {title && (
              <div className="lg:hidden">
                <h1 className="text-lg font-semibold text-[#E6EDF3]">{title}</h1>
                {subtitle && <p className="text-xs text-[#6E7681]">{subtitle}</p>}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 ml-auto">
              {/* Notifications */}
              <div className="relative" ref={dropdownRef}>
                <AdminButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setNotificationOpen(!notificationOpen)}
                  icon={
                    <div className="relative">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#F85149] text-[10px] font-bold text-white flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </div>
                  }
                />

                {notificationOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-[#111418] border border-[#30363D] rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-3 border-b border-[#21262D] flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-[#E6EDF3]">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="text-xs text-[#8B949E]">{unreadCount} unread</span>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-[#6E7681] text-sm">
                          No notifications
                        </div>
                      ) : (
                        notifications.slice(0, 5).map((notification) => (
                          <a
                            key={notification.id}
                            href={notification.link}
                            onClick={() => {
                              setNotificationOpen(false);
                              onNotificationClick?.(notification);
                            }}
                            className={`
                              flex gap-3 px-4 py-3 hover:bg-[#161B22] transition-colors border-b border-[#21262D] last:border-0
                              ${!notification.read ? 'bg-[rgba(30,42,59,0.05)]' : ''}
                            `}
                          >
                            <span className="text-lg">{notification.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${notification.read ? 'text-[#8B949E]' : 'text-[#E6EDF3]'}`}>
                                {notification.title}
                              </p>
                              <p className="text-xs text-[#6E7681] truncate">{notification.description}</p>
                            </div>
                            <span className="text-xs text-[#6E7681] shrink-0">{notification.timeAgo}</span>
                          </a>
                        ))
                      )}
                    </div>
                    <a
                      href="/admin/notifications"
                      className="block px-4 py-3 text-center text-sm text-[var(--ink2)] hover:bg-[#161B22] border-t border-[#21262D]"
                    >
                      View all notifications
                    </a>
                  </div>
                )}
              </div>

              {/* User menu - desktop */}
              <div className="hidden lg:flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--ink2)] flex items-center justify-center text-white text-xs font-semibold">
                  {userEmail.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm text-[#E6EDF3]">{userEmail}</p>
                  <p className="text-xs text-[#6E7681]">{isAdmin ? 'Administrator' : 'User'}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {/* Desktop header */}
          {title && (
            <div className="hidden lg:flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-[#E6EDF3]">{title}</h1>
                {subtitle && <p className="text-[#8B949E] mt-1">{subtitle}</p>}
              </div>
              {actions && <div className="flex items-center gap-3">{actions}</div>}
            </div>
          )}

          {/* Main children */}
          {children}
        </main>
      </div>
    </div>
  );
}

/* ============================================================
   AdminPageHeader — Standalone header for simple pages
   ============================================================ */
interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function AdminPageHeader({ title, subtitle, actions }: AdminPageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#E6EDF3]">{title}</h1>
        {subtitle && <p className="text-[#8B949E] mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
