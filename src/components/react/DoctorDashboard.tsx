import { useState, useEffect, useCallback } from 'react';

// ============================================================================
// Type Definitions
// ============================================================================

interface DoctorProfile {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
  bio?: string;
  specialties: string[];
  availability?: string;
  insurance?: string[];
}

interface ProfileCompletion {
  percentage: number;
  items: ProfileCompletionItem[];
}

interface ProfileCompletionItem {
  key: string;
  label: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  link: string;
}

interface AnalyticsStats {
  profileViews: number;
  profileViewsTrend: number[];
  leadsThisMonth: number;
  leadsTrend: number;
  avgRating: number;
  reviewCount: number;
  responseRate: number;
  responseRateTrend: number;
}

interface Appointment {
  id: string;
  patientName: string;
  time: string;
  duration: number;
  type: 'initial' | 'followup' | 'consultation';
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
}

interface ActivityItem {
  id: string;
  type: 'new_lead' | 'new_review' | 'appointment_request' | 'appointment_confirmed';
  title: string;
  description: string;
  timestamp: string;
  link?: string;
}

interface EarningsData {
  thisMonth: number;
  lastMonth: number;
  ytd: number;
  allTime: number;
  pendingBalance: number;
  trend: number;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  read: boolean;
  createdAt: string;
}

interface DashboardData {
  needsClaim?: boolean;
  doctorId?: string;
  doctorName?: string;
  email?: string;
  photoUrl?: string;
  bio?: string;
  specialties?: string[];
  availability?: string;
  insurance?: string[];
  profileCompletion?: ProfileCompletion;
  stats?: AnalyticsStats;
  appointments?: Appointment[];
  activities?: ActivityItem[];
  earnings?: EarningsData;
}

// ============================================================================
// Utility Functions
// ============================================================================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTime(timeStr: string): string {
  return new Date(timeStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function Sparkline({ data, color = '#2563eb' }: { data: number[]; color?: string }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 60;
  const height = 24;
  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg width={width} height={height} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Stars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const starSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className={`${starSize} ${i <= Math.round(rating) ? 'text-amber-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function ActivityIcon({ type }: { type: ActivityItem['type'] }) {
  const icons: Record<string, { bg: string; color: string; path: string }> = {
    new_lead: {
      bg: 'bg-blue-100',
      color: 'text-blue-600',
      path: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
    },
    new_review: {
      bg: 'bg-amber-100',
      color: 'text-amber-600',
      path: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0l-4.725 2.885a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z',
    },
    appointment_request: {
      bg: 'bg-purple-100',
      color: 'text-purple-600',
      path: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    },
    appointment_confirmed: {
      bg: 'bg-blue-100',
      color: 'text-blue-600',
      path: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    },
  };
  const icon = icons[type] || icons.new_lead;
  return (
    <div className={`w-9 h-9 rounded-lg ${icon.bg} flex items-center justify-center flex-shrink-0`}>
      <svg className={`w-4 h-4 ${icon.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d={icon.path} />
      </svg>
    </div>
  );
}

function TrendArrow({ value, suffix = '%' }: { value: number; suffix?: string }) {
  const isPositive = value >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${isPositive ? 'text-blue-600' : 'text-red-600'}`}>
      <svg className={`w-3 h-3 ${isPositive ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
      {Math.abs(value)}{suffix}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-32 bg-gray-100 rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-gray-100 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 bg-gray-100 rounded-xl" />
        <div className="h-64 bg-gray-100 rounded-xl" />
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function DoctorDashboard({ userEmail }: { userEmail: string }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [earningsLoading, setEarningsLoading] = useState(false);
  const [earnings, setEarnings] = useState<EarningsData | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [dashRes, analyticsRes, leadsRes, appointmentsRes, reviewsRes] = await Promise.all([
        fetch('/api/doctor/dashboard'),
        fetch('/api/doctor/analytics'),
        fetch('/api/doctor/leads?limit=5'),
        fetch('/api/doctor/appointments'),
        fetch('/api/doctor/reviews?limit=5'),
      ]);

      let dashboardData: DashboardData = {};

      // Try to get comprehensive data from dashboard endpoint first
      if (dashRes.ok) {
        const dashJson = await dashRes.json();
        dashboardData = { ...dashJson };
      }

      // Get stats from analytics endpoint
      if (analyticsRes.ok) {
        const analytics = await analyticsRes.json();
        dashboardData.stats = {
          profileViews: analytics.profileViews || 0,
          profileViewsTrend: analytics.profileViewsTrend || [0, 0, 0, 0, 0, 0, 0],
          leadsThisMonth: analytics.leadsThisMonth || 0,
          leadsTrend: analytics.leadsTrend || 0,
          avgRating: analytics.avgRating || 0,
          reviewCount: analytics.reviewCount || 0,
          responseRate: analytics.responseRate || 0,
          responseRateTrend: analytics.responseRateTrend || 0,
        };
        if (analytics.photoUrl) dashboardData.photoUrl = analytics.photoUrl;
        if (analytics.doctorName) dashboardData.doctorName = analytics.doctorName;
        if (analytics.profileCompletion) dashboardData.profileCompletion = analytics.profileCompletion;
        if (analytics.earnings) dashboardData.earnings = analytics.earnings;
      }

      // Build appointments for today
      if (appointmentsRes.ok) {
        const apts = await appointmentsRes.json();
        const today = new Date().toISOString().split('T')[0];
        dashboardData.appointments = (apts.appointments || apts.data || [])
          .filter((a: Appointment) => a.time?.startsWith(today))
          .slice(0, 5)
          .map((a: Appointment) => ({
            ...a,
            type: a.type || 'followup',
            status: a.status || 'confirmed',
          }));
      }

      // Build activities from leads and reviews
      const leads = leadsRes.ok ? await leadsRes.json() : { data: [] };
      const reviews = reviewsRes.ok ? await reviewsRes.json() : { reviews: [] };

      const activities: ActivityItem[] = [
        ...(leads.data || []).map((l: { id: string; name: string; createdAt: string; message?: string }) => ({
          id: `lead-${l.id}`,
          type: 'new_lead' as const,
          title: 'New Lead Received',
          description: l.name || 'Anonymous enquiry',
          timestamp: l.createdAt,
          link: '/doctor/leads/',
        })),
        ...(reviews.reviews || []).map((r: { id: string; userName: string; rating: number; createdAt: string }) => ({
          id: `review-${r.id}`,
          type: 'new_review' as const,
          title: 'New Review',
          description: `${r.userName} left a ${r.rating}-star review`,
          timestamp: r.createdAt,
          link: '/doctor/reviews/',
        })),
      ]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);

      dashboardData.activities = activities;

      setData(dashboardData);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=5');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch {
      // silent fail
    }
  }, []);

  const fetchEarnings = useCallback(async () => {
    try {
      setEarningsLoading(true);
      const res = await fetch('/api/doctor/earnings');
      if (res.ok) {
        const data = await res.json();
        setEarnings(data);
      }
    } catch {
      // silent fail
    } finally {
      setEarningsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    fetchNotifications();
  }, [fetchDashboardData, fetchNotifications]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  async function handleSignOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/doctor/login';
  }

  async function markNotificationRead(id: string) {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch {
      // silent
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  if (error || data?.needsClaim) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to the Doctor Portal</h2>
          <p className="text-gray-500 mb-6">
            {data?.needsClaim
              ? 'You need to claim your doctor profile to access the portal.'
              : 'Unable to load your dashboard. Please try again.'}
          </p>
          <a
            href={data?.needsClaim ? '/doctor/register' : '#'}
            onClick={!data?.needsClaim ? (e) => { e.preventDefault(); fetchDashboardData(); } : undefined}
            className="inline-flex px-6 py-3 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            {data?.needsClaim ? 'Get Started' : 'Try Again'}
          </a>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const profile: DoctorProfile = {
    id: data.doctorId || '',
    name: data.doctorName || 'Doctor',
    email: data.email || userEmail,
    photoUrl: data.photoUrl,
    bio: data.bio,
    specialties: data.specialties || [],
    availability: data.availability,
    insurance: data.insurance || [],
  };

  const completion = data.profileCompletion || { percentage: 0, items: [] };
  const stats = data.stats || {
    profileViews: 0,
    profileViewsTrend: [0, 0, 0, 0, 0, 0, 0],
    leadsThisMonth: 0,
    leadsTrend: 0,
    avgRating: 0,
    reviewCount: 0,
    responseRate: 0,
    responseRateTrend: 0,
  };
  const appointments = data.appointments || [];
  const activities = data.activities || [];

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              {profile.photoUrl ? (
                <img src={profile.photoUrl} alt={profile.name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Welcome back, Dr. {profile.name}</h1>
                <p className="text-sm text-gray-500">Doctor Portal Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/doctor/profile/"
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Edit Profile
              </a>
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-6 text-center text-gray-400 text-sm">No notifications</div>
                      ) : (
                        notifications.map((n) => (
                          <button
                            key={n.id}
                            onClick={() => {
                              if (!n.read) markNotificationRead(n.id);
                              if (n.message) window.location.href = n.message;
                            }}
                            className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-50 last:border-b-0 ${!n.read ? 'bg-blue-50/50' : ''}`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm truncate ${!n.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>{n.title}</p>
                              {n.message && <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{n.message}</p>}
                              <p className="text-[11px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                            </div>
                            {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5" />}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <button onClick={handleSignOut} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Welcome Section */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-2xl p-6 md:p-8 text-white shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Your Practice Overview</h2>
              <p className="text-blue-100 text-sm md:text-base mb-4">
                {completion.percentage === 100
                  ? 'Your profile is complete! Keep up the great work.'
                  : `Complete your profile to attract more patients. You're ${completion.percentage}% done.`}
              </p>
              {/* Progress Bar */}
              <div className="w-full max-w-md">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-blue-200">Profile Completion</span>
                  <span className="text-xs font-bold text-white">{completion.percentage}%</span>
                </div>
                <div className="w-full bg-blue-800/50 rounded-full h-2.5">
                  <div
                    className="bg-white h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${completion.percentage}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href="/doctor/leads/"
                className="px-5 py-2.5 bg-white text-blue-700 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-colors shadow-md flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
                View Leads
              </a>
              <a
                href="/doctor/appointments/"
                className="px-5 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-400 transition-colors shadow-md flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Schedule
              </a>
            </div>
          </div>
        </div>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Profile Views */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Profile Views</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.profileViews.toLocaleString()}</p>
              </div>
              <Sparkline data={stats.profileViewsTrend} color="#2563eb" />
            </div>
            <p className="text-xs text-gray-400 mt-2">Last 7 days</p>
          </div>

          {/* Leads This Month */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Leads This Month</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.leadsThisMonth}</p>
              </div>
              <TrendArrow value={stats.leadsTrend} />
            </div>
            <p className="text-xs text-gray-400 mt-2">New patient enquiries</p>
          </div>

          {/* Reviews Average */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Average Rating</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-2xl font-bold text-gray-900">{stats.avgRating.toFixed(1)}</p>
                <Stars rating={stats.avgRating} />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">{stats.reviewCount} total reviews</p>
          </div>

          {/* Response Rate */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Response Rate</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.responseRate}%</p>
              </div>
              <TrendArrow value={stats.responseRateTrend} />
            </div>
            <p className="text-xs text-gray-400 mt-2">Leads responded to</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Today's Schedule & Activity Feed */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Schedule */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Today&apos;s Schedule
                </h3>
                <span className="text-sm text-gray-500">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </span>
              </div>
              <div className="p-5">
                {appointments.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500 font-medium">No appointments scheduled for today</p>
                    <a href="/doctor/appointments/" className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-1 inline-block">
                      Schedule an appointment
                    </a>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {appointments.map((apt) => (
                      <div key={apt.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="w-16 text-center">
                          <p className="text-sm font-semibold text-gray-900">{formatTime(apt.time)}</p>
                          <p className="text-xs text-gray-500">{apt.duration}min</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{apt.patientName}</p>
                          <p className="text-xs text-gray-500 capitalize">{apt.type.replace('_', ' ')}</p>
                        </div>
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full capitalize ${
                          apt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                          apt.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          apt.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {apt.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity Feed */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Recent Activity
                </h3>
              </div>
              <div className="divide-y divide-gray-50">
                {activities.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm text-gray-500">No recent activity</p>
                  </div>
                ) : (
                  activities.map((activity) => (
                    <div key={activity.id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <ActivityIcon type={activity.type} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                          <p className="text-sm text-gray-500 truncate">{activity.description}</p>
                          <p className="text-xs text-gray-400 mt-1">{timeAgo(activity.timestamp)}</p>
                        </div>
                        {activity.link && (
                          <a href={activity.link} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                            View
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Profile Checklist, Earnings, Quick Info */}
          <div className="space-y-6">
            {/* Profile Completion Checklist */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Profile Checklist
                </h3>
              </div>
              <div className="p-4 space-y-3">
                {completion.items.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No checklist items</p>
                ) : (
                  completion.items.map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {item.completed ? (
                          <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        ) : (
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                            item.priority === 'high' ? 'bg-red-100' : item.priority === 'medium' ? 'bg-amber-100' : 'bg-gray-100'
                          }`}>
                            <span className={`text-[10px] font-bold ${
                              item.priority === 'high' ? 'text-red-600' : item.priority === 'medium' ? 'text-amber-600' : 'text-gray-500'
                            }`}>!</span>
                          </div>
                        )}
                        <span className={`text-sm ${item.completed ? 'text-gray-500 line-through' : 'text-gray-900 font-medium'}`}>
                          {item.label}
                        </span>
                      </div>
                      {!item.completed && (
                        <a href={item.link} className="text-xs text-blue-600 hover:text-blue-700 font-semibold whitespace-nowrap">
                          Add now
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Earnings Summary */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-blue-500/30">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Earnings Summary
                </h3>
              </div>
              <div className="p-5 space-y-4">
                {earningsLoading ? (
                  <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-8 bg-blue-500/30 rounded" />
                    ))}
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-xs text-blue-200">This Month</p>
                      <p className="text-2xl font-bold text-white">{formatCurrency(earnings?.thisMonth || data.earnings?.thisMonth || 0)}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/10 rounded-lg p-3">
                        <p className="text-[10px] text-blue-200 uppercase tracking-wider">Last Month</p>
                        <p className="text-sm font-semibold text-white">{formatCurrency(earnings?.lastMonth || data.earnings?.lastMonth || 0)}</p>
                      </div>
                      <div className="bg-white/10 rounded-lg p-3">
                        <p className="text-[10px] text-blue-200 uppercase tracking-wider">YTD</p>
                        <p className="text-sm font-semibold text-white">{formatCurrency(earnings?.ytd || data.earnings?.ytd || 0)}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-blue-500/30">
                      <span className="text-xs text-blue-200">Pending Balance</span>
                      <span className="text-sm font-semibold text-white">{formatCurrency(earnings?.pendingBalance || data.earnings?.pendingBalance || 0)}</span>
                    </div>
                    <a
                      href="/doctor/earnings/"
                      className="block w-full py-2.5 bg-white text-blue-700 rounded-lg text-sm font-semibold text-center hover:bg-blue-50 transition-colors"
                    >
                      View Details
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* Quick Stats - Specialties */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Your Specialties</h3>
              {profile.specialties.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.specialties.map((spec, i) => (
                    <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                      {spec}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No specialties added yet</p>
              )}
              <a href="/doctor/profile/" className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-3 inline-block">
                Edit specialties
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
