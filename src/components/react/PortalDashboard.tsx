import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../lib/react-query';
import { usePortalDashboard } from '../../hooks/usePortal';
import { PortalCard, PortalBadge, PortalButton, ProgressBar, Stars, StatCard, SectionHeader, LoadingScreen, ErrorScreen, EmptyState } from './PortalUI';
import OnboardingWizard from './PortalOnboardingWizard';
import PortalClaimClinic from './PortalClaimClinic';

function DashboardContent({ userEmail }: { userEmail: string }) {
  const { data, isLoading, error, refetch } = usePortalDashboard();
  const [profilePromptDismissed, setProfilePromptDismissed] = useState(false);

  async function handleSignOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/portal/login';
  }

  // No clinic linked — show claim flow
  if (data?.needsClaim) {
    return (
      <div className="max-w-lg mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold text-[var(--ink)]">Doctor Portal</h1>
          <button onClick={handleSignOut} className="px-4 py-2 text-sm font-medium text-[var(--ink2)] bg-white border border-[var(--line)] rounded-lg hover:bg-[var(--paper2)]">
            Sign Out
          </button>
        </div>
        <PortalClaimClinic userId={userEmail} userEmail={userEmail} />
      </div>
    );
  }

  // Clinic linked but onboarding not complete — show onboarding wizard
  if (data?.showOnboarding) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-[var(--ink)]">Doctor Portal</h1>
          <button onClick={handleSignOut} className="px-4 py-2 text-sm font-medium text-[var(--ink2)] bg-white border border-[var(--line)] rounded-lg hover:bg-[var(--paper2)]">
            Sign Out
          </button>
        </div>
        <OnboardingWizard
          userId={userEmail}
          userEmail={userEmail}
          onComplete={() => refetch()}
        />
      </div>
    );
  }

  if (isLoading) {
    return <LoadingScreen message="Loading your dashboard..." />;
  }

  if (error) {
    return <ErrorScreen message={error.message} onRetry={() => refetch()} />;
  }

  const clinic = data?.clinic;
  const stats = data?.stats;
  const reviews = data?.recentReviews || [];
  const leads = data?.recentLeads || [];
  const completion = data?.profileCompletion;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-[var(--ink)]">{clinic?.name || 'Dashboard'}</h1>
          <p className="text-[var(--muted)] mt-1">
            {clinic?.city}, {clinic?.state}
            {clinic?.verified && (
              <span className="inline-flex items-center ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                Verified
              </span>
            )}
          </p>
        </div>
        <button onClick={handleSignOut} className="px-4 py-2 text-sm font-medium text-[var(--ink2)] bg-white border border-[var(--line)] rounded-lg hover:bg-[var(--paper2)]">
          Sign Out
        </button>
      </div>

      {/* Profile Completion Prompt */}
      {completion && completion.percentage < 100 && !profilePromptDismissed && (
        <PortalCard padding="md" className="mb-8 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--ink)] mb-1">Complete Your Profile</h3>
                  <p className="text-sm text-[var(--ink2)]">
                    Your profile is <strong>{completion.percentage}%</strong> complete. Clinics with full profiles get up to 3x more patient enquiries.
                  </p>
                </div>
                <button onClick={() => setProfilePromptDismissed(true)} className="text-[var(--muted)] hover:text-[var(--ink2)] transition-colors p-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mt-4">
                <ProgressBar value={completion.percentage} showValue />
              </div>

              {completion.missingFields.filter(f => f.priority === 'high').length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {completion.missingFields.filter(f => f.priority === 'high').slice(0, 3).map(f => (
                    <span key={f.key} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      {f.label}
                    </span>
                  ))}
                  {completion.missingFields.filter(f => f.priority === 'high').length > 3 && (
                    <span className="text-xs text-[var(--muted)]">+{completion.missingFields.filter(f => f.priority === 'high').length - 3} more</span>
                  )}
                </div>
              )}

              <a href="/portal/clinic/" className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-sm">
                Complete Your Profile
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </a>
            </div>
          </div>
        </PortalCard>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          label="Total Reviews"
          value={stats?.reviewCount?.toLocaleString() || '0'}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          }
        />
        <StatCard
          label="Average Rating"
          value={stats?.avgRating ? Number(stats.avgRating).toFixed(1) : '0.0'}
          icon={
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          }
        />
        <StatCard
          label="Total Enquiries"
          value={stats?.leadCount?.toLocaleString() || '0'}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          }
        />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <PortalCard hover padding="sm" onClick={() => window.location.href = '/portal/clinic/'}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-[var(--ink)] text-sm">Edit Clinic Profile</p>
              <p className="text-xs text-[var(--muted)]">Update your listing details</p>
            </div>
          </div>
        </PortalCard>
        <PortalCard hover padding="sm" onClick={() => window.location.href = '/portal/reviews/'}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-[var(--ink)] text-sm">View All Reviews</p>
              <p className="text-xs text-[var(--muted)]">See what patients say</p>
            </div>
          </div>
        </PortalCard>
        <PortalCard hover padding="sm" onClick={() => window.location.href = '/portal/leads/'}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[rgba(10,22,40,0.1)] rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-[var(--ink)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-[var(--ink)] text-sm">View All Leads</p>
              <p className="text-xs text-[var(--muted)]">Browse patient enquiries</p>
            </div>
          </div>
        </PortalCard>
      </div>

      {/* Recent Reviews & Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <SectionHeader
            title="Recent Reviews"
            action={{ label: 'View All', href: '/portal/reviews/' }}
          />
          {reviews.length === 0 ? (
            <PortalCard padding="md">
              <p className="text-[var(--muted)] text-sm text-center">No reviews yet</p>
            </PortalCard>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <PortalCard key={review.id} padding="sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-[var(--ink)]">{review.userName}</span>
                      <PortalBadge variant={review.approved ? 'success' : 'warning'} size="sm">
                        {review.approved ? 'Approved' : 'Pending'}
                      </PortalBadge>
                    </div>
                    <span className="text-xs text-[var(--muted)]">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                  <Stars rating={review.rating} size="sm" />
                  {review.title && <p className="text-sm font-medium text-[var(--ink)] mt-1">{review.title}</p>}
                  <p className="text-sm text-[var(--ink2)] line-clamp-2 mt-1">{review.body}</p>
                </PortalCard>
              ))}
            </div>
          )}
        </div>

        <div>
          <SectionHeader
            title="Recent Enquiries"
            action={{ label: 'View All', href: '/portal/leads/' }}
          />
          {leads.length === 0 ? (
            <PortalCard padding="md">
              <p className="text-[var(--muted)] text-sm text-center">No enquiries yet</p>
            </PortalCard>
          ) : (
            <div className="space-y-3">
              {leads.map((lead) => (
                <PortalCard key={lead.id} padding="sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm text-[var(--ink)]">{lead.name || 'Anonymous'}</span>
                    <span className="text-xs text-[var(--muted)]">{new Date(lead.createdAt).toLocaleDateString()}</span>
                  </div>
                  {lead.email && <p className="text-xs text-[var(--muted)] mb-1">{lead.email}</p>}
                  {lead.phone && <p className="text-xs text-[var(--muted)] mb-1">{lead.phone}</p>}
                  {lead.message && <p className="text-sm text-[var(--ink2)] line-clamp-2">{lead.message}</p>}
                </PortalCard>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface PortalDashboardProps {
  userEmail: string;
  userId: string;
}

export default function PortalDashboard({ userEmail, userId }: PortalDashboardProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardContent userEmail={userEmail} />
    </QueryClientProvider>
  );
}