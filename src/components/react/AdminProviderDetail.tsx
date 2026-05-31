'use client';
import { useState, useEffect } from 'react';
import ProviderModal from './AdminProviderModal';

interface Provider {
  doctor: {
    id: string;
    clinicId: string;
    name: string;
    firstName: string | null;
    lastName: string | null;
    credential: string | null;
    title: string | null;
    school: string | null;
    yearsExperience: number | null;
    specialties: string[] | null;
    bio: string | null;
    imageUrl: string | null;
    createdAt: string;
  } | null;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    clinicId: string | null;
    emailVerified: boolean;
    npiNumber: string | null;
    failedLoginAttempts: number;
    lockedUntil: string | null;
    lastLoginAt: string | null;
    createdAt: string;
  } | null;
  clinic: {
    id: string;
    name: string;
    city: string;
    state: string;
    verified: boolean;
  } | null;
  subscription: {
    id: string;
    plan: string;
    status: string;
    currentPeriodEnd: string | null;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
  } | null;
}

interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

const PLAN_LABELS: Record<string, string> = {
  featured: 'Featured', premium: 'Premium', verified: 'Verified', pro: 'Pro', enterprise: 'Enterprise',
};

const PLAN_STYLES: Record<string, string> = {
  featured: 'bg-amber-50 text-amber-700',
  premium: 'bg-purple-50 text-purple-700',
  pro: 'bg-blue-50 text-blue-700',
  enterprise: 'bg-gray-900 text-white',
  verified: 'bg-emerald-50 text-emerald-700',
};

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700',
  canceled: 'bg-gray-100 text-gray-600',
  past_due: 'bg-red-50 text-red-700',
};

interface Props {
  providerId: string;
}

export default function AdminProviderDetail({ providerId }: Props) {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [clinics, setClinics] = useState<{ id: string; name: string; city: string }[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'overview' | 'edit' | 'security' | 'billing' | 'activity'>('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [actionLoading, setActionLoading] = useState('');

  useEffect(() => {
    fetchProvider();
    fetchClinics();
  }, [providerId]);

  async function fetchProvider() {
    try {
      const res = await fetch(`/api/admin/providers?id=${providerId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load provider');
      setProvider(json.provider);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  async function fetchClinics() {
    try {
      const res = await fetch('/api/admin/providers?limit=200');
      const json = await res.json();
      if (json.clinics) setClinics(json.clinics);
    } catch {}
  }

  async function fetchActivity() {
    if (!provider?.user?.id) return;
    try {
      const res = await fetch(`/api/admin/providers?activity=${provider.user.id}`);
      const json = await res.json();
      if (json.logs) setLogs(json.logs);
    } catch {}
  }

  useEffect(() => {
    if (tab === 'activity') fetchActivity();
  }, [tab]);

  async function handleAction(action: string, data: Record<string, unknown>) {
    setActionLoading(action);
    try {
      const res = await fetch('/api/admin/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Action failed');
      alert(json.message || 'Done');
      fetchProvider();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading('');
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full" />
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
  );

  if (!provider?.doctor) return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">Provider not found</div>
  );

  const { doctor, user, clinic, subscription } = provider;
  const isLocked = user?.lockedUntil && new Date(user.lockedUntil) > new Date();

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => history.back()} className="p-2 rounded-lg hover:bg-gray-200 text-gray-500">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{doctor.name}</h1>
          <p className="text-sm text-gray-500">{user?.email} · {clinic?.name || 'No clinic'}</p>
        </div>
        <div className="flex items-center gap-2">
          {subscription && (
            <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${PLAN_STYLES[subscription.plan] || 'bg-gray-100 text-gray-600'}`}>
              {PLAN_LABELS[subscription.plan] || subscription.plan}
            </span>
          )}
          {user && (
            <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${isLocked ? 'bg-red-50 text-red-700' : STATUS_STYLES[user.emailVerified ? 'active' : 'canceled']}`}>
              {isLocked ? 'Locked' : user.emailVerified ? 'Active' : 'Unverified'}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'edit', label: 'Edit' },
          { key: 'security', label: 'Security' },
          { key: 'billing', label: 'Billing' },
          { key: 'activity', label: 'Activity' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Doctor Info</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Full Name</dt>
                <dd className="font-medium text-gray-900">{doctor.name}</dd>
              </div>
              {doctor.credential && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Credential</dt>
                  <dd className="font-medium text-gray-900">{doctor.credential}</dd>
                </div>
              )}
              {doctor.title && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Title</dt>
                  <dd className="font-medium text-gray-900">{doctor.title}</dd>
                </div>
              )}
              {doctor.school && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Medical School</dt>
                  <dd className="font-medium text-gray-900">{doctor.school}</dd>
                </div>
              )}
              {doctor.yearsExperience != null && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Experience</dt>
                  <dd className="font-medium text-gray-900">{doctor.yearsExperience} years</dd>
                </div>
              )}
              {doctor.specialties?.length > 0 && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Specialties</dt>
                  <dd className="font-medium text-gray-900 text-right">{doctor.specialties.join(', ')}</dd>
                </div>
              )}
              {doctor.bio && (
                <div>
                  <dt className="text-gray-500 mb-1">Bio</dt>
                  <dd className="text-gray-900 text-xs leading-relaxed">{doctor.bio}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Account</h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Email</dt>
                  <dd className="font-medium text-gray-900">{user?.email}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Role</dt>
                  <dd className="font-medium text-gray-900">{user?.role}</dd>
                </div>
                {user?.npiNumber && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">NPI</dt>
                    <dd className="font-medium text-gray-900">{user.npiNumber}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-gray-500">Email Verified</dt>
                  <dd className="font-medium text-gray-900">{user?.emailVerified ? 'Yes' : 'No'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Last Login</dt>
                  <dd className="font-medium text-gray-900">{user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Failed Logins</dt>
                  <dd className="font-medium text-gray-900">{user?.failedLoginAttempts ?? 0}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Status</dt>
                  <dd className="font-medium text-gray-900">{isLocked ? 'Locked' : 'Active'}</dd>
                </div>
              </dl>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Clinic</h3>
              {clinic ? (
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Name</dt>
                    <dd className="font-medium text-gray-900">{clinic.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Location</dt>
                    <dd className="font-medium text-gray-900">{[clinic.city, clinic.state].filter(Boolean).join(', ')}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Verified</dt>
                    <dd className="font-medium text-gray-900">{clinic.verified ? 'Yes' : 'No'}</dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-gray-500">No clinic assigned</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit */}
      {tab === 'edit' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Edit Provider</h3>
            <button onClick={() => setShowEditModal(true)}
              className="px-4 py-2 bg-[var(--accent)] text-white text-sm font-medium rounded-lg hover:opacity-90">
              Open Edit Form
            </button>
          </div>
          <p className="text-sm text-gray-500">Click the button above to open the full edit form with all tabs.</p>
        </div>
      )}

      {/* Security */}
      {tab === 'security' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Security Actions</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Reset Password</p>
                <p className="text-xs text-gray-500">Send a magic link to {user?.email}</p>
              </div>
              <button onClick={() => user?.email && handleAction('reset-password', { email: user.email })}
                disabled={actionLoading === 'reset-password' || !user?.email}
                className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:opacity-90 disabled:opacity-50">
                {actionLoading === 'reset-password' ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{isLocked ? 'Unlock Account' : 'Lock Account'}</p>
                <p className="text-xs text-gray-500">
                  {isLocked ? `Locked until ${new Date(user!.lockedUntil!).toLocaleString()}` : 'Temporarily lock for 15 minutes'}
                </p>
              </div>
              <button onClick={() => user?.id && handleAction('toggle-lock', { userId: user.id })}
                disabled={actionLoading === 'toggle-lock' || !user?.id}
                className={`px-4 py-2 text-white text-sm rounded-lg hover:opacity-90 disabled:opacity-50 ${isLocked ? 'bg-emerald-600' : 'bg-amber-600'}`}>
                {actionLoading === 'toggle-lock' ? 'Processing...' : isLocked ? 'Unlock' : 'Lock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Billing */}
      {tab === 'billing' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Subscription & Billing</h3>
          {subscription ? (
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Plan</dt>
                <dd>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${PLAN_STYLES[subscription.plan] || 'bg-gray-100 text-gray-600'}`}>
                    {PLAN_LABELS[subscription.plan] || subscription.plan}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Status</dt>
                <dd>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[subscription.status] || 'bg-gray-100 text-gray-600'}`}>
                    {subscription.status}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Period Ends</dt>
                <dd className="font-medium text-gray-900">
                  {subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : '—'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Stripe Customer</dt>
                <dd className="font-medium text-gray-900 font-mono text-xs">{subscription.stripeCustomerId || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Stripe Subscription</dt>
                <dd className="font-medium text-gray-900 font-mono text-xs">{subscription.stripeSubscriptionId || '—'}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-gray-500">No subscription found</p>
          )}
        </div>
      )}

      {/* Activity */}
      {tab === 'activity' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Recent Activity</h3>
          {logs.length === 0 ? (
            <p className="text-sm text-gray-500">No activity recorded</p>
          ) : (
            <div className="space-y-3">
              {logs.map(log => (
                <div key={log.id} className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-[var(--accent)] flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{log.action}</p>
                    <p className="text-xs text-gray-500">
                      {log.entityType}{log.entityId ? ` · ${log.entityId}` : ''}
                      {log.ipAddress ? ` · ${log.ipAddress}` : ''}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <ProviderModal
          provider={provider}
          clinics={clinics}
          onClose={() => setShowEditModal(false)}
          onSave={() => { setShowEditModal(false); fetchProvider(); }}
        />
      )}
    </div>
  );
}
