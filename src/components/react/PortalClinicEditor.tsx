import { useState, useEffect } from 'react';

interface ClinicData {
  id: string;
  name: string;
  description: string | null;
  descriptionLong: string | null;
  phone: string | null;
  website: string | null;
  email: string | null;
  machines: string[] | null;
  specialties: string[] | null;
  insurances: string[] | null;
  openingHours: string[] | null;
  availability: {
    accepting_new_patients?: boolean;
    wait_time_weeks?: number;
    same_week_available?: boolean;
    evening_hours?: boolean;
    weekend_hours?: boolean;
    telehealth_consults?: boolean;
    virtual_followups?: boolean;
    home_visits?: boolean;
  } | null;
  pricing: {
    price_range?: 'budget' | 'moderate' | 'premium';
    session_price_min?: number;
    session_price_max?: number;
    full_course_price?: number;
    free_consultation?: boolean;
    payment_plans?: boolean;
    accepts_insurance?: boolean;
    cash_discount?: boolean;
  } | null;
  media: {
    hero_image_url?: string;
    logo_url?: string;
    gallery_urls?: string[];
    video_url?: string;
  } | null;
}

export default function PortalClinicEditor({ userId }: { userId: string }) {
  const [clinic, setClinic] = useState<ClinicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetch('/api/portal/clinic')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load');
        return res.json();
      })
      .then((data) => { setClinic(data); setLoading(false); })
      .catch(() => { setError('Failed to load clinic data'); setLoading(false); });
  }, []);

  function updateField(field: keyof ClinicData, value: unknown) {
    if (!clinic) return;
    setClinic({ ...clinic, [field]: value });
  }

  function updateAvailability(field: string, value: unknown) {
    if (!clinic) return;
    setClinic({
      ...clinic,
      availability: { ...clinic.availability, [field]: value },
    });
  }

  function updatePricing(field: string, value: unknown) {
    if (!clinic) return;
    setClinic({
      ...clinic,
      pricing: { ...clinic.pricing, [field]: value },
    });
  }

  function updateMedia(field: string, value: unknown) {
    if (!clinic) return;
    setClinic({
      ...clinic,
      media: { ...clinic.media, [field]: value },
    });
  }

  function parseArrayField(value: string): string[] {
    return value.split(',').map((s) => s.trim()).filter(Boolean);
  }

  async function handleSave() {
    if (!clinic) return;
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/portal/clinic', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clinic),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      setSuccess('Clinic profile updated successfully');
      setTimeout(() => setSuccess(''), 6000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No clinic linked to your account.</p>
        <a href="/portal/claim/" className="text-emerald-600 hover:text-emerald-700 font-medium mt-2 inline-block">
          Claim your clinic
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <a href="/portal/dashboard/" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium mb-2 inline-block">
            &larr; Back to Dashboard
          </a>
          <h1 className="text-2xl font-semibold text-gray-900">Edit Clinic Profile</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">{error}</div>
      )}
      {success && (
        <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm">{success}</div>
      )}

      <div className="space-y-8">
        {/* Basic Info */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Clinic Name</label>
              <input
                type="text"
                value={clinic.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
              <textarea
                value={clinic.description || ''}
                onChange={(e) => updateField('description', e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Description</label>
              <textarea
                value={clinic.descriptionLong || ''}
                onChange={(e) => updateField('descriptionLong', e.target.value)}
                rows={6}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>
          </div>
        </section>

        {/* Branding & Media */}
        <section className="bg-white rounded-xl border border-emerald-200 p-6 shadow-sm ring-1 ring-emerald-100">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Branding & Media</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4 ml-11">Your logo and clinic photos are shown on your public listing. Complete this section to build trust with patients.</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand Logo URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={clinic.media?.logo_url || ''}
                onChange={(e) => updateMedia('logo_url', e.target.value || undefined)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                placeholder="https://example.com/your-logo.png"
              />
              {clinic.media?.logo_url && (
                <div className="mt-2 flex items-center gap-3">
                  <img src={clinic.media.logo_url} alt="Logo preview" className="w-12 h-12 rounded-lg object-contain border border-gray-200 bg-white" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <span className="text-xs text-emerald-600 font-medium">Preview loaded</span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hero / Cover Image URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={clinic.media?.hero_image_url || ''}
                onChange={(e) => updateMedia('hero_image_url', e.target.value || undefined)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                placeholder="https://example.com/clinic-front.jpg"
              />
              {clinic.media?.hero_image_url && (
                <div className="mt-2">
                  <img src={clinic.media.hero_image_url} alt="Hero preview" className="w-full max-w-xs h-32 rounded-lg object-cover border border-gray-200" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Clinic Gallery Photos <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-1.5">Add image URLs, one per line. Show your treatment rooms, waiting area, and team.</p>
              <textarea
                value={(clinic.media?.gallery_urls || []).join('\n')}
                onChange={(e) => updateMedia('gallery_urls', e.target.value.split('\n').map(s => s.trim()).filter(Boolean))}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-emerald-500 font-mono"
                placeholder={"https://example.com/room-1.jpg\nhttps://example.com/waiting-area.jpg\nhttps://example.com/team-photo.jpg"}
              />
              {clinic.media?.gallery_urls && clinic.media.gallery_urls.length > 0 && (
                <div className="mt-2 flex gap-2 flex-wrap">
                  {clinic.media.gallery_urls.slice(0, 6).map((url, i) => (
                    <img key={i} src={url} alt={`Gallery ${i + 1}`} className="w-16 h-16 rounded-lg object-cover border border-gray-200" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ))}
                  {clinic.media.gallery_urls.length > 6 && (
                    <div className="w-16 h-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-xs text-gray-500 font-medium">
                      +{clinic.media.gallery_urls.length - 6}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Video URL</label>
              <input
                type="url"
                value={clinic.media?.video_url || ''}
                onChange={(e) => updateMedia('video_url', e.target.value || undefined)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
              />
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={clinic.phone || ''}
                onChange={(e) => updateField('phone', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={clinic.email || ''}
                onChange={(e) => updateField('email', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                type="url"
                value={clinic.website || ''}
                onChange={(e) => updateField('website', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                placeholder="https://"
              />
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Services</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">TMS Machines (comma-separated)</label>
              <input
                type="text"
                value={(clinic.machines || []).join(', ')}
                onChange={(e) => updateField('machines', parseArrayField(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                placeholder="NeuroStar, BrainsWay, MagVenture"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specialties (comma-separated)</label>
              <input
                type="text"
                value={(clinic.specialties || []).join(', ')}
                onChange={(e) => updateField('specialties', parseArrayField(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                placeholder="Depression, Anxiety, OCD"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Accepted (comma-separated)</label>
              <input
                type="text"
                value={(clinic.insurances || []).join(', ')}
                onChange={(e) => updateField('insurances', parseArrayField(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                placeholder="Aetna, Blue Cross, Cigna"
              />
            </div>
          </div>
        </section>

        {/* Hours */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Opening Hours</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hours (one per line)</label>
            <textarea
              value={(clinic.openingHours || []).join('\n')}
              onChange={(e) => updateField('openingHours', e.target.value.split('\n').filter(Boolean))}
              rows={7}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-emerald-500 font-mono"
              placeholder={"Mon-Fri: 8:00 AM - 5:00 PM\nSat: 9:00 AM - 1:00 PM\nSun: Closed"}
            />
          </div>
        </section>

        {/* Availability */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Availability</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'accepting_new_patients', label: 'Accepting New Patients' },
              { key: 'same_week_available', label: 'Same Week Availability' },
              { key: 'evening_hours', label: 'Evening Hours' },
              { key: 'weekend_hours', label: 'Weekend Hours' },
              { key: 'telehealth_consults', label: 'Telehealth Consults' },
              { key: 'virtual_followups', label: 'Virtual Follow-ups' },
              { key: 'home_visits', label: 'Home Visits' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!(clinic.availability as Record<string, unknown>)?.[key]}
                  onChange={(e) => updateAvailability(key, e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wait Time (weeks)</label>
              <input
                type="number"
                min={0}
                value={clinic.availability?.wait_time_weeks || ''}
                onChange={(e) => updateAvailability('wait_time_weeks', e.target.value ? parseInt(e.target.value) : null)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
              <select
                value={clinic.pricing?.price_range || ''}
                onChange={(e) => updatePricing('price_range', e.target.value || null)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
              >
                <option value="">Select...</option>
                <option value="budget">Budget</option>
                <option value="moderate">Moderate</option>
                <option value="premium">Premium</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Session Price Min ($)</label>
                <input
                  type="number"
                  min={0}
                  value={clinic.pricing?.session_price_min || ''}
                  onChange={(e) => updatePricing('session_price_min', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Session Price Max ($)</label>
                <input
                  type="number"
                  min={0}
                  value={clinic.pricing?.session_price_max || ''}
                  onChange={(e) => updatePricing('session_price_max', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Course Price ($)</label>
              <input
                type="number"
                min={0}
                value={clinic.pricing?.full_course_price || ''}
                onChange={(e) => updatePricing('full_course_price', e.target.value ? parseInt(e.target.value) : null)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'free_consultation', label: 'Free Consultation' },
                { key: 'payment_plans', label: 'Payment Plans' },
                { key: 'accepts_insurance', label: 'Accepts Insurance' },
                { key: 'cash_discount', label: 'Cash Discount' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!(clinic.pricing as Record<string, unknown>)?.[key]}
                    onChange={(e) => updatePricing(key, e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* Save Button */}
        <div className="flex justify-end pb-8">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
