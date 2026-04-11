import { useState, useEffect } from 'react';

interface MissingField {
  key: string;
  label: string;
  priority: 'high' | 'medium';
}

interface DashboardData {
  needsClaim?: boolean;
  clinic?: {
    id: string;
    name: string;
    city: string;
    state: string;
    verified: boolean;
  };
  stats?: {
    reviewCount: number;
    avgRating: number;
    leadCount: number;
  };
  profileCompletion?: {
    percentage: number;
    missingFields: MissingField[];
  };
  recentReviews?: Array<{
    id: string;
    userName: string;
    rating: number;
    title: string | null;
    body: string;
    approved: boolean;
    createdAt: string;
  }>;
  recentLeads?: Array<{
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    message: string | null;
    createdAt: string;
  }>;
}

export default function PortalDashboard({ userEmail, userId }: { userEmail: string; userId: string }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profilePromptDismissed, setProfilePromptDismissed] = useState(false);

  useEffect(() => {
    fetch('/api/portal/dashboard')
      .then((res) => res.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError('Failed to load dashboard'); setLoading(false); });
  }, []);

  async function handleSignOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/portal/login';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (data?.needsClaim) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Doctor Portal</h1>
          <button onClick={handleSignOut} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            Sign Out
          </button>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Claim Your Clinic</h2>
          <p className="text-gray-500 mb-6">You haven't linked a clinic to your account yet. Search for and claim your clinic to manage its listing.</p>
          <a
            href="/portal/claim"
            className="inline-flex items-center px-6 py-3 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all"
          >
            Find Your Clinic
          </a>
        </div>
      </div>
    );
  }

  const clinic = data?.clinic;
  const stats = data?.stats;
  const reviews = data?.recentReviews || [];
  const leads = data?.recentLeads || [];

  function renderStars(rating: number) {
    return Array.from({ length: 5 }, (_, i) => (
      <svg key={i} className={`w-4 h-4 ${i < rating ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">{clinic?.name || 'Dashboard'}</h1>
          <p className="text-gray-500 mt-1">
            {clinic?.city}, {clinic?.state}
            {clinic?.verified && (
              <span className="inline-flex items-center ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                Verified
              </span>
            )}
          </p>
        </div>
        <button onClick={handleSignOut} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
          Sign Out
        </button>
      </div>

      {/* Profile Completion Prompt */}
      {data?.profileCompletion && data.profileCompletion.percentage < 100 && !profilePromptDismissed && (
        <div className="mb-8 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-6 shadow-sm relative">
          <button
            onClick={() => setProfilePromptDismissed(true)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Complete Your Profile</h3>
              <p className="text-sm text-gray-600 mb-3">
                Your profile is <strong>{data.profileCompletion.percentage}%</strong> complete. Clinics with full profiles get up to 3x more patient enquiries.
              </p>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                <div
                  className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${data.profileCompletion.percentage}%` }}
                />
              </div>

              {/* Missing fields grouped by priority */}
              {data.profileCompletion.missingFields.filter(f => f.priority === 'high').length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1.5">Required</p>
                  <div className="flex flex-wrap gap-2">
                    {data.profileCompletion.missingFields.filter(f => f.priority === 'high').map(f => (
                      <span key={f.key} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        {f.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {data.profileCompletion.missingFields.filter(f => f.priority === 'medium').length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1.5">Recommended</p>
                  <div className="flex flex-wrap gap-2">
                    {data.profileCompletion.missingFields.filter(f => f.priority === 'medium').map(f => (
                      <span key={f.key} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        {f.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <a
                href="/portal/clinic"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-sm"
              >
                Complete Your Profile
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Reviews</p>
          <p className="text-3xl font-semibold text-gray-900 mt-2">{stats?.reviewCount || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Average Rating</p>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-3xl font-semibold text-gray-900">{stats?.avgRating ? Number(stats.avgRating).toFixed(1) : '0.0'}</p>
            <div className="flex">{renderStars(Math.round(stats?.avgRating || 0))}</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Enquiries</p>
          <p className="text-3xl font-semibold text-emerald-600 mt-2">{stats?.leadCount || 0}</p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <a href="/portal/clinic" className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors text-sm">Edit Clinic Profile</p>
              <p className="text-xs text-gray-500">Update your listing details</p>
            </div>
          </div>
        </a>
        <a href="/portal/reviews" className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0l-4.725 2.885a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900 group-hover:text-amber-600 transition-colors text-sm">View All Reviews</p>
              <p className="text-xs text-gray-500">See what patients say</p>
            </div>
          </div>
        </a>
        <a href="/portal/leads" className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm">View All Leads</p>
              <p className="text-xs text-gray-500">Browse patient enquiries</p>
            </div>
          </div>
        </a>
      </div>

      {/* Recent Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Reviews</h2>
          {reviews.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <p className="text-gray-500 text-sm">No reviews yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-900">{review.userName}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${review.approved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {review.approved ? 'Approved' : 'Pending'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex mb-1">{renderStars(review.rating)}</div>
                  {review.title && <p className="text-sm font-medium text-gray-800 mb-1">{review.title}</p>}
                  <p className="text-sm text-gray-600 line-clamp-2">{review.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Leads */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Enquiries</h2>
          {leads.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <p className="text-gray-500 text-sm">No enquiries yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leads.map((lead) => (
                <div key={lead.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm text-gray-900">{lead.name || 'Anonymous'}</span>
                    <span className="text-xs text-gray-400">{new Date(lead.createdAt).toLocaleDateString()}</span>
                  </div>
                  {lead.email && <p className="text-xs text-gray-500 mb-1">{lead.email}</p>}
                  {lead.phone && <p className="text-xs text-gray-500 mb-1">{lead.phone}</p>}
                  {lead.message && <p className="text-sm text-gray-600 line-clamp-2">{lead.message}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
