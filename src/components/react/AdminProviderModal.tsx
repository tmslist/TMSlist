'use client';
import { useState } from 'react';

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

interface ProviderModalProps {
  provider: Provider | null;
  clinics: { id: string; name: string; city: string }[];
  onClose: () => void;
  onSave: () => void;
}

const PLAN_LABELS: Record<string, string> = {
  featured: 'Featured', premium: 'Premium', verified: 'Verified', pro: 'Pro', enterprise: 'Enterprise',
};

export default function ProviderModal({ provider, clinics, onClose, onSave }: ProviderModalProps) {
  const [tab, setTab] = useState<'info' | 'account' | 'plan' | 'clinic'>('info');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState(provider?.doctor?.name || '');
  const [firstName, setFirstName] = useState(provider?.doctor?.firstName || '');
  const [lastName, setLastName] = useState(provider?.doctor?.lastName || '');
  const [credential, setCredential] = useState(provider?.doctor?.credential || '');
  const [title, setTitle] = useState(provider?.doctor?.title || '');
  const [school, setSchool] = useState(provider?.doctor?.school || '');
  const [yearsExperience, setYearsExperience] = useState(provider?.doctor?.yearsExperience?.toString() || '');
  const [specialties, setSpecialties] = useState(provider?.doctor?.specialties?.join(', ') || '');
  const [bio, setBio] = useState(provider?.doctor?.bio || '');
  const [imageUrl, setImageUrl] = useState(provider?.doctor?.imageUrl || '');

  const [email, setEmail] = useState(provider?.user?.email || '');
  const [role, setRole] = useState(provider?.user?.role || 'clinic_owner');
  const [npiNumber, setNpiNumber] = useState(provider?.user?.npiNumber || '');

  const [clinicId, setClinicId] = useState(provider?.clinic?.id || '');
  const [newClinicName, setNewClinicName] = useState('');
  const [newClinicCity, setNewClinicCity] = useState('');
  const [newClinicState, setNewClinicState] = useState('');

  const [plan, setPlan] = useState(provider?.subscription?.plan || 'verified');
  const [subStatus, setSubStatus] = useState(provider?.subscription?.status || 'active');

  const isEdit = !!provider?.doctor;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        name, firstName: firstName || null, lastName: lastName || null,
        credential: credential || null, title: title || null, school: school || null,
        yearsExperience: yearsExperience ? parseInt(yearsExperience) : null,
        specialties: specialties ? specialties.split(',').map(s => s.trim()).filter(Boolean) : [],
        bio: bio || null, imageUrl: imageUrl || null,
        email, role, npiNumber: npiNumber || null,
        clinicId: clinicId || null,
        plan, status: subStatus,
      };
      if (!clinicId && newClinicName) {
        payload.newClinicName = newClinicName;
        payload.newClinicCity = newClinicCity;
        payload.newClinicState = newClinicState;
      }
      if (isEdit) {
        payload.doctorId = provider.doctor!.id;
        if (provider.user) payload.userId = provider.user.id;
        if (provider.subscription) payload.subscriptionId = provider.subscription.id;
        const res = await fetch('/api/admin/providers', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Update failed');
      } else {
        const res = await fetch('/api/admin/providers', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Create failed');
      }
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setLoading(false);
    }
  }

  const tabs = [
    { key: 'info', label: 'Doctor Info' },
    { key: 'account', label: 'Account' },
    { key: 'plan', label: 'Plan & Billing' },
    { key: 'clinic', label: 'Clinic' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{isEdit ? 'Edit Provider' : 'Add Provider'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex border-b border-gray-200 px-6">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.key ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mx-6 mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="p-6 space-y-4">
            {tab === 'info' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
                  <input value={name} onChange={e => setName(e.target.value)} required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">First Name</label>
                  <input value={firstName} onChange={e => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Last Name</label>
                  <input value={lastName} onChange={e => setLastName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Credential</label>
                  <input value={credential} onChange={e => setCredential(e.target.value)} placeholder="MD, DO, PhD..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                  <input value={title} onChange={e => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Medical School</label>
                  <input value={school} onChange={e => setSchool(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Years Experience</label>
                  <input type="number" value={yearsExperience} onChange={e => setYearsExperience(e.target.value)} min="0"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Specialties (comma-separated)</label>
                  <input value={specialties} onChange={e => setSpecialties(e.target.value)} placeholder="TMS, Depression, Anxiety..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Bio</label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Image URL</label>
                  <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} type="url"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
                </div>
              </div>
            )}

            {tab === 'account' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                  <input value={email} onChange={e => setEmail(e.target.value)} required type="email"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
                  <select value={role} onChange={e => setRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]">
                    {['admin', 'editor', 'clinic_owner', 'viewer', 'patient'].map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">NPI Number</label>
                  <input value={npiNumber} onChange={e => setNpiNumber(e.target.value)} placeholder="10-digit NPI"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
                </div>
                {provider?.user && (
                  <div className="bg-gray-50 rounded-lg p-4 text-xs space-y-1">
                    <p><span className="font-medium">Failed login attempts:</span> {provider.user.failedLoginAttempts}</p>
                    <p><span className="font-medium">Locked until:</span> {provider.user.lockedUntil ? new Date(provider.user.lockedUntil).toLocaleString() : 'Not locked'}</p>
                    <p><span className="font-medium">Email verified:</span> {provider.user.emailVerified ? 'Yes' : 'No'}</p>
                    <p><span className="font-medium">Created:</span> {new Date(provider.user.createdAt).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            )}

            {tab === 'plan' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Subscription Plan</label>
                  <select value={plan} onChange={e => setPlan(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]">
                    {['featured', 'premium', 'verified', 'pro', 'enterprise'].map(p => (
                      <option key={p} value={p}>{PLAN_LABELS[p] || p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                  <select value={subStatus} onChange={e => setSubStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]">
                    <option value="active">Active</option>
                    <option value="canceled">Canceled</option>
                    <option value="past_due">Past Due</option>
                  </select>
                </div>
                {provider?.subscription && (
                  <div className="bg-gray-50 rounded-lg p-4 text-xs space-y-1">
                    <p><span className="font-medium">Stripe Customer:</span> {provider.subscription.stripeCustomerId || '—'}</p>
                    <p><span className="font-medium">Subscription ID:</span> {provider.subscription.stripeSubscriptionId || '—'}</p>
                    <p><span className="font-medium">Period ends:</span> {provider.subscription.currentPeriodEnd ? new Date(provider.subscription.currentPeriodEnd).toLocaleDateString() : '—'}</p>
                  </div>
                )}
              </div>
            )}

            {tab === 'clinic' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Assign to Clinic</label>
                  <select value={clinicId} onChange={e => setClinicId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]">
                    <option value="">— Unassigned —</option>
                    {clinics.map(c => (
                      <option key={c.id} value={c.id}>{c.name}{c.city ? ` (${c.city})` : ''}</option>
                    ))}
                  </select>
                </div>
                <div className="border-t pt-4">
                  <p className="text-xs font-medium text-gray-600 mb-3">Or create a new clinic</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Clinic Name</label>
                      <input value={newClinicName} onChange={e => setNewClinicName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
                      <input value={newClinicCity} onChange={e => setNewClinicCity(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">State</label>
                      <input value={newClinicState} onChange={e => setNewClinicState(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
                    </div>
                  </div>
                </div>
                {provider?.clinic && (
                  <div className="bg-gray-50 rounded-lg p-4 text-xs">
                    <p><span className="font-medium">Current:</span> {provider.clinic.name}</p>
                    <p><span className="font-medium">Verified:</span> {provider.clinic.verified ? 'Yes' : 'No'}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={loading}
              className="px-4 py-2 bg-[var(--accent)] text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50">
              {loading ? 'Saving...' : isEdit ? 'Update Provider' : 'Create Provider'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
