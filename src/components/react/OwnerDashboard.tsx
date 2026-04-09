import { useState, useEffect, useCallback } from 'react';
import AnalyticsDashboard from './AnalyticsDashboard';
import HealthScoreBadge from './HealthScoreBadge';

interface ClinicData {
  id: string;
  slug: string;
  name: string;
  phone: string | null;
  website: string | null;
  email: string | null;
  city: string;
  state: string;
  country: string;
  description: string | null;
  descriptionLong: string | null;
  machines: string[] | null;
  specialties: string[] | null;
  insurances: string[] | null;
  openingHours: string[] | null;
  verified: boolean;
  isFeatured: boolean;
  ratingAvg: string;
  reviewCount: number;
  availability: {
    accepting_new_patients?: boolean;
    evening_hours?: boolean;
    weekend_hours?: boolean;
    telehealth_consults?: boolean;
  } | null;
}

interface Review {
  id: string;
  userName: string;
  rating: number;
  title: string | null;
  body: string;
  createdAt: string;
}

interface LeadStats {
  total: number;
  thisMonth: number;
  thisWeek: number;
}

type Tab = 'overview' | 'analytics' | 'edit' | 'reviews';

export default function OwnerDashboard() {
  const [clinic, setClinic] = useState<ClinicData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [leadStats, setLeadStats] = useState<LeadStats>({ total: 0, thisMonth: 0, thisWeek: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Edit state
  const [editPhone, setEditPhone] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editMachines, setEditMachines] = useState('');
  const [editSpecialties, setEditSpecialties] = useState('');
  const [editInsurances, setEditInsurances] = useState('');
  const [editHours, setEditHours] = useState('');
  const [editAcceptingPatients, setEditAcceptingPatients] = useState(true);
  const [editEveningHours, setEditEveningHours] = useState(false);
  const [editWeekendHours, setEditWeekendHours] = useState(false);
  const [editTelehealth, setEditTelehealth] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/owner/clinic');
      if (res.status === 401) {
        window.location.href = '/admin/login?redirect=/owner/dashboard';
        return;
      }
      if (!res.ok) {
        const { error } = await res.json();
        setError(error || 'Failed to load clinic data');
        return;
      }
      const data = await res.json();
      setClinic(data.clinic);
      setReviews(data.reviews);
      setLeadStats(data.leadStats);

      // Populate edit fields
      setEditPhone(data.clinic.phone || '');
      setEditWebsite(data.clinic.website || '');
      setEditEmail(data.clinic.email || '');
      setEditDescription(data.clinic.descriptionLong || data.clinic.description || '');
      setEditMachines((data.clinic.machines || []).join(', '));
      setEditSpecialties((data.clinic.specialties || []).join(', '));
      setEditInsurances((data.clinic.insurances || []).join(', '));
      setEditHours((data.clinic.openingHours || []).join('\n'));
      setEditAcceptingPatients(data.clinic.availability?.accepting_new_patients ?? true);
      setEditEveningHours(data.clinic.availability?.evening_hours ?? false);
      setEditWeekendHours(data.clinic.availability?.weekend_hours ?? false);
      setEditTelehealth(data.clinic.availability?.telehealth_consults ?? false);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage('');
    try {
      const res = await fetch('/api/owner/clinic', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: editPhone,
          website: editWebsite,
          email: editEmail,
          descriptionLong: editDescription,
          machines: editMachines.split(',').map(s => s.trim()).filter(Boolean),
          specialties: editSpecialties.split(',').map(s => s.trim()).filter(Boolean),
          insurances: editInsurances.split(',').map(s => s.trim()).filter(Boolean),
          openingHours: editHours.split('\n').map(s => s.trim()).filter(Boolean),
          availability: {
            accepting_new_patients: editAcceptingPatients,
            evening_hours: editEveningHours,
            weekend_hours: editWeekendHours,
            telehealth_consults: editTelehealth,
          },
        }),
      });
      if (res.ok) {
        setSaveMessage('Changes saved successfully!');
        fetchData();
      } else {
        const { error } = await res.json();
        setSaveMessage(`Error: ${error}`);
      }
    } catch {
      setSaveMessage('Network error — please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-3 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
          <p className="text-red-700 font-medium">{error}</p>
          <a href="/admin/login?redirect=/owner/dashboard" className="inline-block mt-4 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold">
            Log In
          </a>
        </div>
      </div>
    );
  }

  if (!clinic) return null;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'edit', label: 'Edit Profile' },
    { id: 'reviews', label: `Reviews (${reviews.length})` },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{clinic.name}</h1>
          <p className="text-slate-500 mt-1">{clinic.city}, {clinic.state}</p>
        </div>
        <div className="flex items-center gap-3">
          {clinic.verified && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-sm font-semibold rounded-full border border-emerald-100">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Verified
            </span>
          )}
          <a href={`/clinic/${clinic.slug}`} target="_blank" className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors">
            View Public Page
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-3xl font-bold text-slate-900">{Number(clinic.ratingAvg || 0).toFixed(1)}</p>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Avg Rating</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-3xl font-bold text-slate-900">{clinic.reviewCount}</p>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Total Reviews</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-3xl font-bold text-blue-600">{leadStats.thisMonth}</p>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Leads This Month</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-3xl font-bold text-emerald-600">{leadStats.thisWeek}</p>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Leads This Week</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all ${
              activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Clinic Details</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone</dt>
                <dd className="text-sm text-slate-900 mt-1">{clinic.phone || 'Not set'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Website</dt>
                <dd className="text-sm text-slate-900 mt-1 truncate">{clinic.website || 'Not set'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</dt>
                <dd className="text-sm text-slate-900 mt-1">{clinic.email || 'Not set'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider">TMS Devices</dt>
                <dd className="text-sm text-slate-900 mt-1">{(clinic.machines || []).join(', ') || 'Not set'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Specialties</dt>
                <dd className="text-sm text-slate-900 mt-1">{(clinic.specialties || []).join(', ') || 'Not set'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Insurance</dt>
                <dd className="text-sm text-slate-900 mt-1">{(clinic.insurances || []).join(', ') || 'Not set'}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-blue-900 mb-2">Lead Summary</h3>
            <p className="text-sm text-blue-700">
              You've received <strong>{leadStats.total}</strong> total enquiries,
              with <strong>{leadStats.thisMonth}</strong> in the last 30 days
              and <strong>{leadStats.thisWeek}</strong> in the last 7 days.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <AnalyticsDashboard />
          <HealthScoreBadge clinicId={clinic.id} size="lg" showBreakdown={true} />
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a href="/owner/review-qr" className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 text-sm">QR</div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Review QR Code</p>
                  <p className="text-xs text-slate-400">Print for your waiting room</p>
                </div>
              </a>
              <a href="/pricing" className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 text-sm font-bold">$</div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Upgrade Plan</p>
                  <p className="text-xs text-slate-400">Get more leads & features</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'edit' && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
          {saveMessage && (
            <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
              saveMessage.startsWith('Error') ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
            }`}>
              {saveMessage}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Phone</label>
              <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Website</label>
              <input type="url" value={editWebsite} onChange={(e) => setEditWebsite(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
              <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Description</label>
            <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={5}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-y" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">TMS Devices (comma-separated)</label>
            <input type="text" value={editMachines} onChange={(e) => setEditMachines(e.target.value)}
              placeholder="NeuroStar, BrainsWay, MagVenture"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Conditions Treated (comma-separated)</label>
            <input type="text" value={editSpecialties} onChange={(e) => setEditSpecialties(e.target.value)}
              placeholder="Depression, OCD, Anxiety, PTSD"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Insurance Accepted (comma-separated)</label>
            <input type="text" value={editInsurances} onChange={(e) => setEditInsurances(e.target.value)}
              placeholder="UnitedHealthcare, Aetna, Blue Cross Blue Shield"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Hours (one per line)</label>
            <textarea value={editHours} onChange={(e) => setEditHours(e.target.value)} rows={3}
              placeholder="Mon-Fri 09:00-17:00&#10;Sat 10:00-14:00&#10;Sun Closed"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-y" />
          </div>

          {/* Availability toggles */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Availability</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: 'Accepting New Patients', value: editAcceptingPatients, setter: setEditAcceptingPatients },
                { label: 'Evening Hours', value: editEveningHours, setter: setEditEveningHours },
                { label: 'Weekend Hours', value: editWeekendHours, setter: setEditWeekendHours },
                { label: 'Telehealth Consults', value: editTelehealth, setter: setEditTelehealth },
              ].map(({ label, value, setter }) => (
                <label key={label} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input type="checkbox" checked={value} onChange={(e) => setter(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-slate-700 font-medium">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button onClick={handleSave} disabled={saving}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all shadow-sm">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
              <p className="text-slate-400 font-medium">No approved reviews yet.</p>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{review.userName}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg key={i} className={`w-4 h-4 ${i < review.rating ? 'text-amber-400' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                {review.title && <p className="font-semibold text-sm text-slate-800 mb-1">{review.title}</p>}
                <p className="text-sm text-slate-600 leading-relaxed">{review.body}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
