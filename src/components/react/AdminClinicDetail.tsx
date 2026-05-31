import { useState, useEffect } from 'react';

interface Clinic {
  id: string;
  slug: string;
  name: string;
  city: string;
  state: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  verified: boolean;
  isFeatured: boolean;
  ratingAvg: string | null;
  reviewCount: number;
  machines: string[] | null;
  description: string | null;
  descriptionLong: string | null;
  specialties: string[] | null;
  insurances: string[] | null;
  openingHours: string[] | null;
  address: string | null;
  zip: string | null;
  country: string | null;
  lat: string | null;
  lng: string | null;
  providerType: string | null;
  accessibility: Record<string, unknown> | null;
  availability: Record<string, unknown> | null;
  pricing: Record<string, unknown> | null;
  media: Record<string, unknown> | null;
  googleProfile: Record<string, unknown> | null;
  faqs: { question: string; answer: string }[] | null;
  statusReason: string | null;
  createdAt: string;
  updatedAt: string;
  ownerUserId: string | null;
  ownerEmail: string | null;
  ownerName: string | null;
}

interface Doctor {
  id: string;
  name: string;
  npi: string | null;
  specialty: string | null;
  clinicName: string | null;
  ratingAvg: string | null;
  reviewCount: number;
  createdAt: string;
}

interface Stats {
  doctors: number;
  reviews: number;
  approvedReviews: number;
  leads: number;
  savedByUsers: number;
  locations: number;
}

interface Subscription {
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  billingCurrency: string | null;
  createdAt: string;
}

interface Props {
  clinicId: string;
}

export default function AdminClinicDetail({ clinicId }: Props) {
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'doctors' | 'subscription' | 'leads'>('overview');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchClinic();
  }, [clinicId]);

  async function fetchClinic() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/clinics?id=${encodeURIComponent(clinicId)}`);
      if (res.status === 404) {
        setError('Clinic not found.');
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error('Failed to load');
      const json = await res.json();
      setClinic(json.data);

      // Fetch doctors, stats, subscription in parallel
      const [doctorsRes, statsRes, subRes] = await Promise.allSettled([
        fetch(`/api/admin/doctors?clinicId=${encodeURIComponent(clinicId)}`),
        fetch(`/api/admin/clinics/statistics?clinicId=${encodeURIComponent(clinicId)}`),
        fetch(`/api/admin/clinics/subscription?clinicId=${encodeURIComponent(clinicId)}`),
      ]);

      if (doctorsRes.status === 'fulfilled' && doctorsRes.value.ok) {
        const d = await doctorsRes.value.json();
        setDoctors(d.data || []);
      }
      if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
        const s = await statsRes.value.json();
        setStats(s.data || null);
      }
      if (subRes.status === 'fulfilled' && subRes.value.ok) {
        const sub = await subRes.value.json();
        setSubscription(sub.data || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load clinic');
    } finally {
      setLoading(false);
    }
  }

  async function toggleField(field: 'verified' | 'isFeatured', value: boolean) {
    if (!clinic) return;
    setUpdating(true);
    try {
      const res = await fetch('/api/admin/clinics', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: clinic.id, [field]: value }),
      });
      if (res.ok) {
        setClinic(prev => prev ? { ...prev, [field]: value } : prev);
      }
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="inline-block w-8 h-8 border-3 border-[var(--line)] border-t-[var(--ink)] rounded-full animate-spin" />
        <span className="ml-3 text-[var(--muted)]">Loading clinic...</span>
      </div>
    );
  }

  if (error || !clinic) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-700 font-medium">{error || 'Clinic not found'}</p>
        <a href="/admin/clinics/" className="text-sm text-red-600 hover:underline mt-2 inline-block">
          Back to clinics
        </a>
      </div>
    );
  }

  const planLabels: Record<string, string> = {
    free: 'Free',
    starter: 'Starter',
    pro: 'Pro',
    premium: 'Premium',
    enterprise: 'Enterprise',
  };
  const statusColors: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    trialing: 'bg-blue-100 text-blue-700',
    past_due: 'bg-red-100 text-red-700',
    canceled: 'bg-gray-100 text-gray-700',
    paused: 'bg-amber-100 text-amber-700',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-[var(--line)] p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-[var(--ink)]">{clinic.name}</h1>
              {clinic.verified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Verified
                </span>
              )}
              {clinic.isFeatured && (
                <span className="inline-flex items-center px-2.5 py-1 bg-[rgba(201,101,74,0.1)] text-[var(--warm)] text-xs font-semibold rounded-full">
                  Featured
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
              <span>{clinic.city}, {clinic.state}</span>
              {clinic.address && <><span>&#8226;</span><span>{clinic.address}</span></>}
              {clinic.zip && <><span>&#8226;</span><span>{clinic.zip}</span></>}
            </div>
            {clinic.website && (
              <a href={clinic.website} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--warm)] hover:underline mt-1 inline-block">
                {clinic.website.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            {clinic.slug && (
              <a
                href={`/clinic/${clinic.slug}/`}
                target="_blank"
                className="px-4 py-2 bg-[var(--paper2)] text-[var(--ink2)] text-sm font-medium rounded-lg hover:bg-[var(--line)] transition-colors"
              >
                View Public Page
              </a>
            )}
            <a
              href={`/admin/clinics/${clinic.id}/edit`}
              className="px-4 py-2 bg-[var(--ink)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--ink)] transition-colors"
            >
              Edit Clinic
            </a>
          </div>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[var(--line)]">
          <div>
            <div className="text-2xl font-bold text-[var(--ink)]">{clinic.ratingAvg ? Number(clinic.ratingAvg).toFixed(1) : '--'}</div>
            <div className="text-xs text-[var(--muted)]">Rating</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[var(--ink)]">{clinic.reviewCount}</div>
            <div className="text-xs text-[var(--muted)]">Reviews</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[var(--ink)]">{clinic.doctors?.length ?? stats?.doctors ?? '--'}</div>
            <div className="text-xs text-[var(--muted)]">Doctors</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[var(--ink)]">{clinic.machines?.length ?? 0}</div>
            <div className="text-xs text-[var(--muted)]">Device Types</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--line)]">
        {(['overview', 'doctors', 'subscription'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${
              activeTab === tab
                ? 'border-[var(--warm)] text-[var(--warm)]'
                : 'border-transparent text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contact & Location */}
          <div className="bg-white rounded-xl shadow-sm border border-[var(--line)] p-6">
            <h2 className="text-base font-semibold text-[var(--ink)] mb-4">Contact & Location</h2>
            <dl className="space-y-3">
              {clinic.phone && (
                <>
                  <div className="flex justify-between"><dt className="text-sm text-[var(--muted)]">Phone</dt><dd className="text-sm font-medium text-[var(--ink)]">{clinic.phone}</dd></div>
                </>
              )}
              {clinic.email && (
                <>
                  <div className="flex justify-between"><dt className="text-sm text-[var(--muted)]">Email</dt><dd className="text-sm font-medium text-[var(--ink)]">{clinic.email}</dd></div>
                </>
              )}
              {clinic.website && (
                <>
                  <div className="flex justify-between"><dt className="text-sm text-[var(--muted)]">Website</dt><dd className="text-sm font-medium text-[var(--warm)]">{clinic.website}</dd></div>
                </>
              )}
              <div className="flex justify-between"><dt className="text-sm text-[var(--muted)]">City</dt><dd className="text-sm font-medium text-[var(--ink)]">{clinic.city}</dd></div>
              <div className="flex justify-between"><dt className="text-sm text-[var(--muted)]">State</dt><dd className="text-sm font-medium text-[var(--ink)]">{clinic.state}</dd></div>
              {clinic.zip && <div className="flex justify-between"><dt className="text-sm text-[var(--muted)]">ZIP</dt><dd className="text-sm font-medium text-[var(--ink)]">{clinic.zip}</dd></div>}
              {clinic.providerType && <div className="flex justify-between"><dt className="text-sm text-[var(--muted)]">Provider Type</dt><dd className="text-sm font-medium text-[var(--ink)]">{clinic.providerType}</dd></div>}
              {clinic.ownerEmail && (
                <div className="flex justify-between"><dt className="text-sm text-[var(--muted)]">Owner</dt><dd className="text-sm font-medium text-[var(--ink)]">{clinic.ownerName || clinic.ownerEmail}</dd></div>
              )}
              <div className="flex justify-between"><dt className="text-sm text-[var(--muted)]">Created</dt><dd className="text-sm font-medium text-[var(--ink)]">{new Date(clinic.createdAt).toLocaleDateString()}</dd></div>
              <div className="flex justify-between"><dt className="text-sm text-[var(--muted)]">Updated</dt><dd className="text-sm font-medium text-[var(--ink)]">{new Date(clinic.updatedAt).toLocaleDateString()}</dd></div>
            </dl>
          </div>

          {/* Devices & Specialties */}
          <div className="bg-white rounded-xl shadow-sm border border-[var(--line)] p-6">
            <h2 className="text-base font-semibold text-[var(--ink)] mb-4">Devices & Specialties</h2>
            {clinic.machines && clinic.machines.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-4">
                {clinic.machines.map(m => (
                  <span key={m} className="px-3 py-1.5 bg-[var(--paper2)] text-[var(--ink2)] text-sm rounded-lg font-medium">{m}</span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--muted)] mb-4">No devices listed</p>
            )}
            {clinic.specialties && clinic.specialties.length > 0 && (
              <>
                <h3 className="text-xs font-semibold text-[var(--muted)] uppercase mb-2">Specialties</h3>
                <div className="flex flex-wrap gap-2">
                  {clinic.specialties.map(s => (
                    <span key={s} className="px-3 py-1.5 bg-[rgba(201,101,74,0.06)] text-[var(--warm)] text-sm rounded-lg font-medium">{s}</span>
                  ))}
                </div>
              </>
            )}
            {clinic.insurances && clinic.insurances.length > 0 && (
              <>
                <h3 className="text-xs font-semibold text-[var(--muted)] uppercase mb-2 mt-4">Insurance</h3>
                <div className="flex flex-wrap gap-2">
                  {clinic.insurances.map(i => (
                    <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-lg font-medium">{i}</span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Description */}
          {clinic.description && (
            <div className="bg-white rounded-xl shadow-sm border border-[var(--line)] p-6 lg:col-span-2">
              <h2 className="text-base font-semibold text-[var(--ink)] mb-3">Description</h2>
              <p className="text-sm text-[var(--ink2)] leading-relaxed whitespace-pre-wrap">{clinic.description}</p>
              {clinic.descriptionLong && (
                <>
                  <h3 className="text-sm font-semibold text-[var(--ink)] mt-4 mb-2">Long Description</h3>
                  <p className="text-sm text-[var(--ink2)] leading-relaxed whitespace-pre-wrap">{clinic.descriptionLong}</p>
                </>
              )}
            </div>
          )}

          {/* Opening Hours */}
          {clinic.openingHours && clinic.openingHours.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-[var(--line)] p-6">
              <h2 className="text-base font-semibold text-[var(--ink)] mb-3">Opening Hours</h2>
              <div className="space-y-1">
                {clinic.openingHours.map((hour, i) => (
                  <div key={i} className="text-sm text-[var(--ink2)] font-mono">{hour}</div>
                ))}
              </div>
            </div>
          )}

          {/* FAQs */}
          {clinic.faqs && clinic.faqs.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-[var(--line)] p-6">
              <h2 className="text-base font-semibold text-[var(--ink)] mb-3">FAQs ({clinic.faqs.length})</h2>
              <div className="space-y-4">
                {clinic.faqs.map((faq, i) => (
                  <div key={i} className="border-b border-[var(--line)] pb-4 last:border-0 last:pb-0">
                    <dt className="text-sm font-semibold text-[var(--ink)] mb-1">{faq.question}</dt>
                    <dd className="text-sm text-[var(--ink2)]">{faq.answer}</dd>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Toggle controls */}
          <div className="bg-white rounded-xl shadow-sm border border-[var(--line)] p-6">
            <h2 className="text-base font-semibold text-[var(--ink)] mb-4">Status Controls</h2>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--ink2)]">Verified status</span>
                <button
                  onClick={() => toggleField('verified', !clinic.verified)}
                  disabled={updating}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
                    clinic.verified
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-red-100'
                      : 'bg-amber-100 text-amber-700 hover:bg-emerald-100'
                  }`}
                >
                  {clinic.verified ? 'Unverify' : 'Verify'}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--ink2)]">Featured listing</span>
                <button
                  onClick={() => toggleField('isFeatured', !clinic.isFeatured)}
                  disabled={updating}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
                    clinic.isFeatured
                      ? 'bg-[var(--paper2)] text-[var(--ink2)] hover:bg-[rgba(201,101,74,0.06)]'
                      : 'bg-[rgba(201,101,74,0.06)] text-[var(--warm)] hover:bg-[var(--paper2)]'
                  }`}
                >
                  {clinic.isFeatured ? 'Unfeature' : 'Feature'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'doctors' && (
        <div className="bg-white rounded-xl shadow-sm border border-[var(--line)] overflow-hidden">
          {doctors.length === 0 ? (
            <div className="py-12 text-center text-[var(--muted)]">
              No doctors linked to this clinic.
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[var(--paper2)] border-b border-[var(--line)]">
                  <th className="px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase">Name</th>
                  <th className="px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase">NPI</th>
                  <th className="px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase">Specialty</th>
                  <th className="px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase">Rating</th>
                  <th className="px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase">Reviews</th>
                  <th className="px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase">Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {doctors.map(doc => (
                  <tr key={doc.id} className="hover:bg-[var(--paper2)]">
                    <td className="px-4 py-3 text-sm font-semibold text-[var(--ink)]">{doc.name}</td>
                    <td className="px-4 py-3 text-sm text-[var(--muted)] font-mono">{doc.npi || '--'}</td>
                    <td className="px-4 py-3 text-sm text-[var(--ink2)]">{doc.specialty || '--'}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-[var(--ink)]">
                      {doc.ratingAvg ? `${Number(doc.ratingAvg).toFixed(1)} ★` : '--'}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--ink2)]">{doc.reviewCount}</td>
                    <td className="px-4 py-3 text-sm text-[var(--muted)]">{new Date(doc.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'subscription' && (
        <div className="bg-white rounded-xl shadow-sm border border-[var(--line)] p-6">
          {subscription ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h2 className="text-sm font-semibold text-[var(--muted)] uppercase mb-1">Plan</h2>
                <p className="text-2xl font-bold text-[var(--ink)]">{planLabels[subscription.plan] || subscription.plan}</p>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[var(--muted)] uppercase mb-1">Status</h2>
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${statusColors[subscription.status] || 'bg-gray-100 text-gray-700'}`}>
                  {subscription.status}
                </span>
              </div>
              {subscription.currentPeriodEnd && (
                <div>
                  <h2 className="text-sm font-semibold text-[var(--muted)] uppercase mb-1">Renews</h2>
                  <p className="text-base font-medium text-[var(--ink)]">{new Date(subscription.currentPeriodEnd).toLocaleDateString()}</p>
                </div>
              )}
              {subscription.stripeCustomerId && (
                <div>
                  <h2 className="text-sm font-semibold text-[var(--muted)] uppercase mb-1">Stripe Customer</h2>
                  <p className="text-sm font-mono text-[var(--ink2)]">{subscription.stripeCustomerId}</p>
                </div>
              )}
              <div>
                <h2 className="text-sm font-semibold text-[var(--muted)] uppercase mb-1">Started</h2>
                <p className="text-base font-medium text-[var(--ink)]">{new Date(subscription.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[var(--muted)] uppercase mb-1">Currency</h2>
                <p className="text-base font-medium text-[var(--ink)] uppercase">{subscription.billingCurrency || 'USD'}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-[var(--muted)]">
              <p>No active subscription found for this clinic.</p>
              <p className="text-sm mt-1">The clinic may be on the free plan.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}