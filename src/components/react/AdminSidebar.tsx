import { useState, useCallback, useEffect, useRef } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

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

interface AdminSidebarProps {
  currentPage: string;
  userEmail: string;
  isAdmin?: boolean;
}

interface SearchResult {
  id: string;
  type: 'clinic' | 'user' | 'blog';
  title: string;
  subtitle: string;
  href: string;
}

// ── Sample notification data (swap for DB fetch later) ──────────────────────────

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'lead',
    icon: '🎯',
    title: 'New Lead',
    description: 'John D. submitted a specialist enquiry',
    timeAgo: '2m ago',
    link: '/admin/leads',
    read: false,
  },
  {
    id: '2',
    type: 'review',
    icon: '⭐',
    title: 'Review Pending',
    description: '1 review awaiting moderation',
    timeAgo: '15m ago',
    link: '/admin/reviews',
    read: false,
  },
  {
    id: '3',
    type: 'clinic',
    icon: '🏥',
    title: 'Clinic Claimed',
    description: 'New clinic claim pending review',
    timeAgo: '1h ago',
    link: '/admin/clinics',
    read: false,
  },
  {
    id: '4',
    type: 'blog',
    icon: '📝',
    title: 'Blog Draft',
    description: 'Draft post needs review',
    timeAgo: '3h ago',
    link: '/admin/blog',
    read: true,
  },
  {
    id: '5',
    type: 'user',
    icon: '👤',
    title: 'New User',
    description: 'New user signed up: jane@example.com',
    timeAgo: '5h ago',
    link: '/admin/users',
    read: true,
  },
  {
    id: '6',
    type: 'security',
    icon: '🔒',
    title: 'Security',
    description: 'Failed login attempt detected',
    timeAgo: '1d ago',
    link: '/admin/audit',
    read: true,
  },
];

// ── Nav items ────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    key: 'clinics',
    label: 'Clinics',
    href: '/admin/clinics',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    key: 'doctors',
    label: 'Doctors',
    href: '/admin/doctors',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: 'reviews',
    label: 'Reviews',
    href: '/admin/reviews',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
  {
    key: 'page-content',
    label: 'Page Content',
    href: '/admin/page-content',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm12 0a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
  },
  {
    key: 'content',
    label: 'Content',
    href: '/admin/content',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    key: 'leads',
    label: 'Leads',
    href: '/admin/leads',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    key: 'users',
    label: 'Users',
    href: '/admin/users',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    key: 'blog',
    label: 'Blog',
    href: '/admin/blog',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
    ),
  },
  {
    key: 'blog-scheduler',
    label: 'Blog Scheduler',
    href: '/admin/blog-scheduler',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    key: 'seo',
    label: 'SEO',
    href: '/admin/seo',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    key: 'analytics',
    label: 'Analytics',
    href: '/admin/analytics',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    key: 'audit',
    label: 'Audit Log',
    href: '/admin/audit',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    key: 'data-quality',
    label: 'Data Quality',
    href: '/admin/data-quality',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    key: 'revenue',
    label: 'Revenue',
    href: '/admin/revenue',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: 'settings',
    label: 'Settings',
    href: '/admin/settings',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function getUnreadCount(notifications: Notification[]): number {
  return notifications.filter((n) => !n.read).length;
}

function getBadgeLabel(count: number): string {
  if (count === 0) return '';
  if (count > 9) return '9+';
  return String(count);
}

// ── Search helpers ──────────────────────────────────────────────────────────────

const RESULT_TYPE_ICONS: Record<string, string> = {
  clinic: '⬤',
  user: '👤',
  blog: '📝',
};

const RESULT_TYPE_LABELS: Record<string, string> = {
  clinic: 'Clinics',
  user: 'Users',
  blog: 'Blog Posts',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminSidebar({ currentPage, userEmail, isAdmin = false }: AdminSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const unreadCount = getUnreadCount(notifications);
  const hasUnread = unreadCount > 0;
  const badgeLabel = getBadgeLabel(unreadCount);

  // Group results by type
  const groupedResults = searchResults.reduce<Record<string, SearchResult[]>>((acc, result) => {
    if (!acc[result.type]) acc[result.type] = [];
    acc[result.type].push(result);
    return acc;
  }, {});

  const hasResults = Object.keys(groupedResults).length > 0;

  // Search function
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const results: SearchResult[] = [];

    try {
      // Search clinics
      const clinicsRes = await fetch(`/api/admin/clinics?search=${encodeURIComponent(query)}&limit=3`);
      if (clinicsRes.ok) {
        const clinicsData = await clinicsRes.json();
        if (clinicsData.clinics && Array.isArray(clinicsData.clinics)) {
          clinicsData.clinics.forEach((clinic: { id: string; name?: string; title?: string; city?: string; state?: string; location?: string }) => {
            results.push({
              id: clinic.id,
              type: 'clinic',
              title: clinic.name || clinic.title || 'Unnamed Clinic',
              subtitle: [clinic.city, clinic.state].filter(Boolean).join(', ') || clinic.location || 'Unknown location',
              href: `/admin/clinics/${clinic.id}`,
            });
          });
        }
      }

      // Search blog posts (try /api/admin/blog first)
      const blogRes = await fetch(`/api/admin/blog?search=${encodeURIComponent(query)}&limit=3`);
      if (blogRes.ok) {
        const blogData = await blogRes.json();
        const posts = blogData.posts || blogData.blog || blogData.data || (Array.isArray(blogData) ? blogData : []);
        if (Array.isArray(posts)) {
          posts.slice(0, 3).forEach((post: { id: string; title?: string; name?: string; slug?: string }) => {
            results.push({
              id: post.id || post.slug || '',
              type: 'blog',
              title: post.title || post.name || 'Untitled Post',
              subtitle: 'Blog Post',
              href: `/admin/blog/${post.id || post.slug}`,
            });
          });
        }
      }

      // Search users (admin only)
      if (isAdmin) {
        const usersRes = await fetch(`/api/admin/users?search=${encodeURIComponent(query)}&limit=3`);
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          const users = usersData.users || usersData.data || (Array.isArray(usersData) ? usersData : []);
          if (Array.isArray(users)) {
            users.slice(0, 3).forEach((user: { id: string; email?: string; name?: string; role?: string }) => {
              results.push({
                id: user.id,
                type: 'user',
                title: user.email || user.name || 'Unknown User',
                subtitle: user.role ? `(${user.role})` : 'User',
                href: '/admin/users',
              });
            });
          }
        }
      }
    } catch {
      // Silently fail on search errors
    }

    setSearchResults(results);
    setIsSearching(false);
  }, [isAdmin]);

  // Debounced search on query change
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      setSearchOpen(false);
      return;
    }

    setIsSearching(true);
    setSearchOpen(true);

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, performSearch]);

  // Close search dropdown on outside click
  useEffect(() => {
    if (!searchOpen) return;
    function handleClickOutside(e: MouseEvent) {
      const input = searchInputRef.current;
      const dropdown = searchDropdownRef.current;
      if (
        input && dropdown &&
        !input.contains(e.target as Node) &&
        !dropdown.contains(e.target as Node)
      ) {
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchOpen]);

  // Keyboard: Escape to close search
  useEffect(() => {
    if (!searchOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        searchInputRef.current?.blur();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  // Close notification dropdown on outside click
  useEffect(() => {
    if (!notificationOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setNotificationOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notificationOpen]);

  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      if (!notification.read) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
        );
      }
      setNotificationOpen(false);
      window.location.href = notification.link;
    },
    []
  );

  const handleMarkAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const handleSearchFocus = useCallback(() => {
    if (searchQuery.trim()) {
      setSearchOpen(true);
    }
  }, [searchQuery]);

  const handleResultClick = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setSearchOpen(false);
      searchInputRef.current?.blur();
    }
  }, []);

  const sortedNotifications = [...notifications].sort((a, b) => {
    if (a.read === b.read) return 0;
    return a.read ? 1 : -1;
  });

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo + Notification Bell */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <a href="/admin/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <span className="text-lg font-bold text-gray-900">TMS List</span>
              <span className="block text-[10px] font-semibold text-violet-600 uppercase tracking-wider -mt-0.5">Admin</span>
            </div>
          </a>

          {/* Search focus button + Notification Bell */}
          <div className="flex items-center gap-1">
            {/* Search toggle button */}
            <button
              onClick={() => searchInputRef.current?.focus()}
              className="p-2 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
              aria-label="Search"
              title="Search (Cmd+K)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Notification Bell */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setNotificationOpen((prev) => !prev)}
                className={`relative p-2 rounded-lg transition-colors ${
                  hasUnread
                    ? 'text-violet-600 hover:bg-violet-50'
                    : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                }`}
                aria-label={`Notifications${hasUnread ? `, ${unreadCount} unread` : ''}`}
              >
                {/* Bell icon */}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>

                {/* Unread badge */}
                {badgeLabel && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full px-1 leading-none">
                    {badgeLabel}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notificationOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50">
                  {/* Dropdown header */}
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">Notifications</span>
                    {hasUnread && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-violet-600 hover:text-violet-700 font-medium transition-colors"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* Notification list */}
                  <div className="max-h-80 overflow-y-auto">
                    {sortedNotifications.map((notification) => (
                      <button
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-b border-gray-50 last:border-0 hover:bg-gray-50 ${
                          !notification.read ? 'bg-violet-50/40' : ''
                        }`}
                      >
                        {/* Icon */}
                        <span className="mt-0.5 text-lg shrink-0">{notification.icon}</span>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{notification.title}</span>
                            {!notification.read && (
                              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notification.description}</p>
                          <span className="text-[11px] text-gray-400 mt-1 block">{notification.timeAgo}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Dropdown footer */}
                  <div className="px-4 py-3 border-t border-gray-100">
                    <a
                      href="/admin/notifications"
                      onClick={() => setNotificationOpen(false)}
                      className="flex items-center justify-center text-sm text-violet-600 hover:text-violet-700 font-medium transition-colors"
                    >
                      View all notifications
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative mt-4">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={handleSearchFocus}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search clinics, doctors, users, blog posts, leads..."
              className="w-full pl-9 pr-8 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:bg-white focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-colors"
              autoComplete="off"
              spellCheck={false}
            />
            {/* Loading spinner */}
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <svg className="w-4 h-4 text-violet-500 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            )}
            {/* Cmd+K hint */}
            {!searchQuery && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-medium bg-gray-100 px-1.5 py-0.5 rounded">
                ⌘K
              </span>
            )}
          </div>

          {/* Search dropdown */}
          {searchOpen && (
            <div
              ref={searchDropdownRef}
              className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden"
            >
              {isSearching && !hasResults ? (
                /* Loading state (no results yet) */
                <div className="px-4 py-6 text-center text-sm text-gray-500">
                  <svg className="w-5 h-5 mx-auto mb-2 animate-spin text-violet-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Searching...
                </div>
              ) : !isSearching && !hasResults && searchQuery.trim() ? (
                /* Empty state */
                <div className="px-4 py-6 text-center text-sm text-gray-500">
                  <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  No results found
                  <p className="text-xs text-gray-400 mt-1">Try different keywords</p>
                </div>
              ) : hasResults ? (
                /* Results list */
                <div className="max-h-80 overflow-y-auto">
                  {Object.entries(groupedResults).map(([type, results]) => (
                    <div key={type}>
                      {/* Section header */}
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                          {RESULT_TYPE_LABELS[type] || type}
                        </span>
                      </div>
                      {/* Result rows */}
                      {results.map((result) => (
                        <a
                          key={`${result.type}-${result.id}`}
                          href={result.href}
                          onClick={handleResultClick}
                          className="flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                        >
                          {/* Type icon */}
                          <span className="text-base shrink-0 w-6 text-center">
                            {RESULT_TYPE_ICONS[result.type] || '•'}
                          </span>
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {result.title}
                            </div>
                            {result.subtitle && (
                              <div className="text-xs text-gray-500 truncate">
                                {result.subtitle}
                              </div>
                            )}
                          </div>
                          {/* Arrow */}
                          <svg
                            className="w-4 h-4 text-gray-300 shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </a>
                      ))}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = currentPage === item.key;
          return (
            <a
              key={item.key}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-violet-50 text-violet-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className={isActive ? 'text-violet-600' : 'text-gray-400'}>{item.icon}</span>
              {item.label}
            </a>
          );
        })}
      </nav>

      {/* User section */}
      <div className="px-3 py-4 border-t border-gray-100">
        <div className="px-3 py-2 mb-2">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Signed in as</div>
          <div className="text-sm font-medium text-gray-700 truncate" title={userEmail}>{userEmail}</div>
        </div>
        <button
          onClick={() => {
            // TODO: call /api/auth/logout then redirect
            window.location.href = '/admin/login';
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-gray-200"
        aria-label="Open navigation"
      >
        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600"
              aria-label="Close navigation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 bg-white border-r border-gray-200 min-h-screen shrink-0">
        <div className="sticky top-0 h-screen overflow-hidden">
          {sidebarContent}
        </div>
      </aside>
    </>
  );
}
