import { useState, useEffect, useCallback, useRef } from 'react';
import { PortalCard, PortalButton, PortalInput, PortalTextarea, PortalSelect, LoadingScreen, ErrorScreen, EmptyState, ProgressBar } from './PortalUI';

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

interface Section {
  id: string;
  label: string;
  description: string;
  icon: JSX.Element;
  completed: boolean;
  required: boolean;
}

export default function PortalClinicEditor({ userId }: { userId: string }) {
  const [clinic, setClinic] = useState<ClinicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [needsClaim, setNeedsClaim] = useState(false);
  const [activeSection, setActiveSection] = useState('basic');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Locations management state
  const [locations, setLocations] = useState<Array<{
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
    email: string;
  }>>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLocation, setNewLocation] = useState({ name: '', address: '', city: '', state: '', zip: '', phone: '', email: '' });
  const [addingLocation, setAddingLocation] = useState(false);

  // Define sections
  const sections: Section[] = [
    {
      id: 'basic',
      label: 'Basic Info',
      description: 'Name, description, contact details',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      completed: !!(clinic?.name && clinic?.description && clinic?.phone),
      required: true,
    },
    {
      id: 'media',
      label: 'Photos & Media',
      description: 'Logo, hero image, gallery',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
      completed: !!(clinic?.media?.logo_url && clinic?.media?.hero_image_url),
      required: true,
    },
    {
      id: 'services',
      label: 'Services',
      description: 'Machines, specialties, insurance',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>,
      completed: !!(clinic?.machines?.length && clinic?.specialties?.length),
      required: false,
    },
    {
      id: 'hours',
      label: 'Hours & Availability',
      description: 'Opening hours, patient availability',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      completed: !!(clinic?.openingHours?.length),
      required: false,
    },
    {
      id: 'pricing',
      label: 'Pricing',
      description: 'Session costs, payment options',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      completed: !!(clinic?.pricing?.price_range),
      required: false,
    },
    {
      id: 'locations',
      label: 'Locations',
      description: 'Manage clinic branches',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
      completed: true,
      required: false,
    },
  ];

  useEffect(() => {
    fetch('/api/portal/clinic')
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if ((res.status === 404 || res.status === 403) && data?.error === 'No clinic linked') {
          setNeedsClaim(true);
          setLoading(false);
          return;
        }
        if (!res.ok) {
          setError(data?.error || 'Failed to load clinic data');
          setLoading(false);
          return;
        }
        setClinic(data);
        setLoading(false);
      })
      .catch(() => { setError('Failed to load clinic data'); setLoading(false); });
  }, []);

  // Fetch locations when locations tab is active
  useEffect(() => {
    if (activeSection !== 'locations') return;
    setLocationsLoading(true);
    fetch('/api/portal/locations')
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to load locations');
        }
        const data = await res.json();
        setLocations(Array.isArray(data) ? data : []);
        setLocationError('');
      })
      .catch((err) => setLocationError(err.message))
      .finally(() => setLocationsLoading(false));
  }, [activeSection]);

  // URL validation helper
  function isValidUrl(value: string): boolean {
    if (!value) return true; // Empty is valid (optional fields)
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  // Autosave functionality - passes snapshot to avoid stale closure
  const scheduleAutoSave = useCallback((snapshot: ClinicData) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      handleSave(true, snapshot);
    }, 3000); // Auto-save after 3 seconds of inactivity
  }, []);

  function updateField(field: keyof ClinicData, value: unknown) {
    if (!clinic) return;
    const updated = { ...clinic, [field]: value };
    setClinic(updated);
    setSaveStatus('idle');
    scheduleAutoSave(updated);
  }

  function updateAvailability(field: string, value: unknown) {
    if (!clinic) return;
    const updated = { ...clinic, availability: { ...(clinic.availability ?? {}), [field]: value } };
    setClinic(updated);
    setSaveStatus('idle');
    scheduleAutoSave(updated);
  }

  function updatePricing(field: string, value: unknown) {
    if (!clinic) return;
    const updated = { ...clinic, pricing: { ...(clinic.pricing ?? {}), [field]: value } };
    setClinic(updated);
    setSaveStatus('idle');
    scheduleAutoSave(updated);
  }

  function updateMedia(field: string, value: unknown) {
    if (!clinic) return;
    const updated = { ...clinic, media: { ...(clinic.media ?? {}), [field]: value } };
    setClinic(updated);
    setSaveStatus('idle');
    scheduleAutoSave(updated);
  }

  function parseArrayField(value: string): string[] {
    return value.split(',').map((s) => s.trim()).filter(Boolean);
  }

  async function handleSave(isAutoSave = false, snapshot?: ClinicData) {
    const data = snapshot ?? clinic;
    if (!data) return;
    setSaving(true);
    setSaveStatus('saving');
    setError('');

    try {
      const res = await fetch('/api/portal/clinic', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const resData = await res.json();
        throw new Error(resData.error || 'Failed to save');
      }

      setSaveStatus('saved');
      setLastSaved(new Date());
      if (!isAutoSave) {
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (err: unknown) {
      setSaveStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingScreen message="Loading clinic data..." />;
  }

  if (needsClaim) {
    return (
      <EmptyState
        icon={
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        }
        title="No clinic linked"
        description="Link your account to a clinic to start managing your listing."
        action={{ label: 'Claim Your Clinic', href: '/portal/claim/' }}
      />
    );
  }

  if (!clinic) {
    return <ErrorScreen message="Failed to load clinic data" onRetry={() => window.location.reload()} />;
  }

  // Calculate profile completion
  const totalFields = 12;
  let completedFields = 0;
  if (clinic.name) completedFields++;
  if (clinic.description) completedFields++;
  if (clinic.phone) completedFields++;
  if (clinic.email) completedFields++;
  if (clinic.website) completedFields++;
  if (clinic.media?.logo_url) completedFields++;
  if (clinic.media?.hero_image_url) completedFields++;
  if (clinic.media?.gallery_urls?.length) completedFields++;
  if (clinic.machines?.length) completedFields++;
  if (clinic.specialties?.length) completedFields++;
  if (clinic.insurances?.length) completedFields++;
  if (clinic.openingHours?.length) completedFields++;
  const completionPct = Math.round((completedFields / totalFields) * 100);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header with save status */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <a href="/portal/dashboard/" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium mb-2 inline-block">
            &larr; Back to Dashboard
          </a>
          <h1 className="text-2xl font-semibold text-[var(--ink)]">Edit Clinic Profile</h1>
        </div>
        <div className="flex items-center gap-4">
          {saveStatus === 'saving' && (
            <span className="text-sm text-[var(--muted)]">Saving...</span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-sm text-emerald-600">Saved</span>
          )}
          {saveStatus === 'error' && (
            <span className="text-sm text-red-600">Save failed</span>
          )}
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Profile completion progress */}
      <PortalCard padding="md" className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-[var(--ink)]">Profile Completion</h3>
            <p className="text-sm text-[var(--muted)]">{completedFields} of {totalFields} fields completed</p>
          </div>
          <span className="text-2xl font-bold text-emerald-600">{completionPct}%</span>
        </div>
        <ProgressBar value={completionPct} variant={completionPct === 100 ? 'success' : 'default'} />
      </PortalCard>

      {/* Section navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeSection === section.id
                ? 'bg-emerald-600 text-white'
                : section.completed
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-white text-[var(--ink2)] border border-[var(--line)]'
            }`}
          >
            {section.icon}
            {section.label}
          </button>
        ))}
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">{error}</div>
      )}

      {/* Section: Basic Info */}
      {activeSection === 'basic' && (
        <PortalCard padding="lg">
          <h2 className="text-lg font-semibold text-[var(--ink)] mb-6">Basic Information</h2>
          <div className="space-y-6">
            <PortalInput
              label="Clinic Name"
              required
              value={clinic.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Enter clinic name"
            />
            <PortalTextarea
              label="Short Description"
              required
              value={clinic.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
              rows={3}
              placeholder="Brief overview of your clinic (2-3 sentences)"
              hint="This appears on search results and clinic cards"
            />
            <PortalTextarea
              label="Detailed Description"
              value={clinic.descriptionLong || ''}
              onChange={(e) => updateField('descriptionLong', e.target.value)}
              rows={6}
              placeholder="Comprehensive description of your services, expertise, and patient care philosophy"
              hint="Patients often read this before contacting you"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PortalInput
                label="Phone"
                required
                type="tel"
                value={clinic.phone || ''}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="(555) 123-4567"
              />
              <PortalInput
                label="Email"
                required
                type="email"
                value={clinic.email || ''}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="contact@clinic.com"
              />
              <PortalInput
                label="Website"
                type="url"
                value={clinic.website || ''}
                onChange={(e) => updateField('website', e.target.value)}
                placeholder="https://yourclinic.com"
                className="md:col-span-2"
              />
            </div>
          </div>
        </PortalCard>
      )}

      {/* Section: Media */}
      {activeSection === 'media' && (
        <PortalCard padding="lg">
          <h2 className="text-lg font-semibold text-[var(--ink)] mb-2">Photos & Media</h2>
          <p className="text-sm text-[var(--muted)] mb-6">Visual content builds trust with patients. Complete this section to stand out.</p>
          <div className="space-y-6">
            <div>
              <PortalInput
                label="Brand Logo URL"
                required
                type="url"
                value={clinic.media?.logo_url || ''}
                onChange={(e) => updateMedia('logo_url', e.target.value || undefined)}
                placeholder="https://example.com/your-logo.png"
              />
              {clinic.media?.logo_url && (
                <div className="mt-3 flex items-center gap-3 p-3 bg-[var(--paper2)] rounded-lg">
                  <img
                    src={clinic.media.logo_url}
                    alt="Logo preview"
                    className="w-16 h-16 rounded-lg object-contain border border-[var(--line)] bg-white"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <span className="text-xs text-emerald-600 font-medium">Preview loaded</span>
                </div>
              )}
            </div>
            <div>
              <PortalInput
                label="Hero / Cover Image URL"
                required
                type="url"
                value={clinic.media?.hero_image_url || ''}
                onChange={(e) => updateMedia('hero_image_url', e.target.value || undefined)}
                placeholder="https://example.com/clinic-front.jpg"
              />
              {clinic.media?.hero_image_url && (
                <div className="mt-3">
                  <img
                    src={clinic.media.hero_image_url}
                    alt="Hero preview"
                    className="w-full max-w-md h-40 rounded-lg object-cover border border-[var(--line)]"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}
            </div>
            <div>
              <PortalInput
                label="Clinic Gallery Photos"
                type="url"
                value={(clinic.media?.gallery_urls || []).join('\n')}
                onChange={(e) => updateMedia('gallery_urls', e.target.value.split('\n').map(s => s.trim()).filter(Boolean))}
                placeholder="Enter image URLs, one per line"
              />
              <p className="text-xs text-[var(--muted)] mt-1 mb-3">Show your treatment rooms, waiting area, and team.</p>
              {clinic.media?.gallery_urls && clinic.media.gallery_urls.length > 0 && (
                <div className="flex gap-3 flex-wrap">
                  {clinic.media.gallery_urls.slice(0, 6).map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`Gallery ${i + 1}`}
                      className="w-20 h-20 rounded-lg object-cover border border-[var(--line)]"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ))}
                  {clinic.media.gallery_urls.length > 6 && (
                    <div className="w-20 h-20 rounded-lg bg-[var(--paper2)] border border-[var(--line)] flex items-center justify-center text-sm text-[var(--muted)] font-medium">
                      +{clinic.media.gallery_urls.length - 6} more
                    </div>
                  )}
                </div>
              )}
            </div>
            <div>
              <PortalInput
                label="Video URL"
                type="url"
                value={clinic.media?.video_url || ''}
                onChange={(e) => updateMedia('video_url', e.target.value || undefined)}
                placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
              />
            </div>
          </div>
        </PortalCard>
      )}

      {/* Section: Services */}
      {activeSection === 'services' && (
        <PortalCard padding="lg">
          <h2 className="text-lg font-semibold text-[var(--ink)] mb-6">Services & Specialties</h2>
          <div className="space-y-6">
            <PortalInput
              label="TMS Machines"
              value={(clinic.machines || []).join(', ')}
              onChange={(e) => updateField('machines', parseArrayField(e.target.value))}
              placeholder="NeuroStar, BrainsWay, MagVenture"
              hint="Comma-separated list of TMS devices you use"
            />
            <PortalInput
              label="Specialties"
              value={(clinic.specialties || []).join(', ')}
              onChange={(e) => updateField('specialties', parseArrayField(e.target.value))}
              placeholder="Depression, Anxiety, OCD, PTSD"
              hint="Conditions you specialize in treating"
            />
            <PortalInput
              label="Insurance Accepted"
              value={(clinic.insurances || []).join(', ')}
              onChange={(e) => updateField('insurances', parseArrayField(e.target.value))}
              placeholder="Aetna, Blue Cross, Cigna, United"
              hint="Helps patients understand if they're covered"
            />
          </div>
        </PortalCard>
      )}

      {/* Section: Hours & Availability */}
      {activeSection === 'hours' && (
        <PortalCard padding="lg">
          <h2 className="text-lg font-semibold text-[var(--ink)] mb-6">Hours & Availability</h2>
          <div className="space-y-6">
            <PortalTextarea
              label="Opening Hours"
              value={(clinic.openingHours || []).join('\n')}
              onChange={(e) => updateField('openingHours', e.target.value.split('\n').filter(Boolean))}
              rows={7}
              placeholder={"Mon-Fri: 8:00 AM - 5:00 PM\nSat: 9:00 AM - 1:00 PM\nSun: Closed"}
            />

            <div>
              <h3 className="text-sm font-semibold text-[var(--ink)] mb-4">Availability Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'accepting_new_patients', label: 'Accepting New Patients' },
                  { key: 'same_week_available', label: 'Same Week Availability' },
                  { key: 'evening_hours', label: 'Evening Hours' },
                  { key: 'weekend_hours', label: 'Weekend Hours' },
                  { key: 'telehealth_consults', label: 'Telehealth Consults' },
                  { key: 'virtual_followups', label: 'Virtual Follow-ups' },
                  { key: 'home_visits', label: 'Home Visits Available' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 p-3 bg-[var(--paper2)] rounded-lg cursor-pointer hover:bg-[var(--paper)] transition-colors">
                    <input
                      type="checkbox"
                      checked={!!(clinic.availability as Record<string, unknown>)?.[key]}
                      onChange={(e) => updateAvailability(key, e.target.checked)}
                      className="w-4 h-4 rounded border-[var(--line)] text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-[var(--ink2)]">{label}</span>
                  </label>
                ))}
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-[var(--ink2)] mb-1.5">Wait Time (weeks)</label>
                <input
                  type="number"
                  min={0}
                  value={clinic.availability?.wait_time_weeks || ''}
                  onChange={(e) => updateAvailability('wait_time_weeks', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-32 rounded-lg border border-[var(--line)] px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </PortalCard>
      )}

      {/* Section: Pricing */}
      {activeSection === 'pricing' && (
        <PortalCard padding="lg">
          <h2 className="text-lg font-semibold text-[var(--ink)] mb-6">Pricing Information</h2>
          <div className="space-y-6">
            <PortalSelect
              label="Price Range"
              value={clinic.pricing?.price_range || ''}
              onChange={(e) => updatePricing('price_range', e.target.value || null)}
              options={[
                { value: '', label: 'Select price range...' },
                { value: 'budget', label: 'Budget — Lower cost options' },
                { value: 'moderate', label: 'Moderate — Standard pricing' },
                { value: 'premium', label: 'Premium — Higher-end services' },
              ]}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <PortalInput
                label="Session Price Min ($)"
                type="number"
                min={0}
                value={clinic.pricing?.session_price_min || ''}
                onChange={(e) => updatePricing('session_price_min', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="150"
              />
              <PortalInput
                label="Session Price Max ($)"
                type="number"
                min={0}
                value={clinic.pricing?.session_price_max || ''}
                onChange={(e) => updatePricing('session_price_max', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="300"
              />
              <PortalInput
                label="Full Course Price ($)"
                type="number"
                min={0}
                value={clinic.pricing?.full_course_price || ''}
                onChange={(e) => updatePricing('full_course_price', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="6000"
              />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--ink)] mb-4">Payment Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'free_consultation', label: 'Free Consultation' },
                  { key: 'payment_plans', label: 'Payment Plans Available' },
                  { key: 'accepts_insurance', label: 'Accepts Insurance' },
                  { key: 'cash_discount', label: 'Cash Discount Available' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 p-3 bg-[var(--paper2)] rounded-lg cursor-pointer hover:bg-[var(--paper)] transition-colors">
                    <input
                      type="checkbox"
                      checked={!!(clinic.pricing as Record<string, unknown>)?.[key]}
                      onChange={(e) => updatePricing(key, e.target.checked)}
                      className="w-4 h-4 rounded border-[var(--line)] text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-[var(--ink2)]">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </PortalCard>
      )}

      {/* Section: Locations */}
      {activeSection === 'locations' && (
        <PortalCard padding="lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-[var(--ink)]">Clinic Locations</h2>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Location
              </button>
            )}
          </div>

          {locationError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex items-start gap-2">
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {locationError}
            </div>
          )}

          {locationsLoading ? (
            <div className="text-center py-12">
              <svg className="animate-spin h-8 w-8 text-emerald-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-sm text-[var(--muted)]">Loading locations...</p>
            </div>
          ) : (
            <>
              {/* Existing locations */}
              {locations.length > 0 && (
                <div className="space-y-4 mb-6">
                  {locations.map((loc) => (
                    <div key={loc.id} className="p-4 bg-[var(--paper2)] rounded-xl border border-[var(--line)]">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-[var(--ink)]">{loc.name}</h3>
                          <p className="text-sm text-[var(--muted)] mt-1">
                            {[loc.address, loc.city, loc.state, loc.zip].filter(Boolean).join(', ')}
                          </p>
                          {loc.phone && <p className="text-sm text-[var(--muted)]">{loc.phone}</p>}
                          {loc.email && <p className="text-sm text-[var(--muted)]">{loc.email}</p>}
                        </div>
                        <button
                          onClick={async () => {
                            if (!confirm('Remove this location? This cannot be undone.')) return;
                            const res = await fetch(`/api/portal/locations?id=${loc.id}`, { method: 'DELETE' });
                            if (res.ok) {
                              setLocations(prev => prev.filter(l => l.id !== loc.id));
                            } else {
                              const data = await res.json().catch(() => ({}));
                              setLocationError(data.error || 'Failed to delete location');
                            }
                          }}
                          className="p-2 text-[var(--muted)] hover:text-red-600 transition-colors"
                          title="Remove location"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {locations.length === 0 && !showAddForm && (
                <div className="text-center py-12 bg-[var(--paper2)] rounded-xl border border-dashed border-[var(--line)]">
                  <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <p className="text-[var(--ink)] font-medium mb-1">No additional locations</p>
                  <p className="text-sm text-[var(--muted)] mb-4">Add branches to manage multiple clinic sites</p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all"
                  >
                    Add Your First Location
                  </button>
                </div>
              )}

              {/* Add location form */}
              {showAddForm && (
                <div className="bg-[var(--paper2)] rounded-xl p-6 border border-[var(--line)]">
                  <h3 className="font-semibold text-[var(--ink)] mb-4">Add New Location</h3>
                  <div className="space-y-4">
                    <PortalInput
                      label="Location Name"
                      value={newLocation.name}
                      onChange={(e) => setNewLocation(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Downtown Branch"
                      required
                    />
                    <PortalInput
                      label="Street Address"
                      value={newLocation.address}
                      onChange={(e) => setNewLocation(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="123 Main St"
                    />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="col-span-2">
                        <PortalInput
                          label="City"
                          value={newLocation.city}
                          onChange={(e) => setNewLocation(prev => ({ ...prev, city: e.target.value }))}
                          placeholder="Los Angeles"
                          required
                        />
                      </div>
                      <PortalInput
                        label="State"
                        value={newLocation.state}
                        onChange={(e) => setNewLocation(prev => ({ ...prev, state: e.target.value }))}
                        placeholder="CA"
                        required
                      />
                      <PortalInput
                        label="ZIP"
                        value={newLocation.zip}
                        onChange={(e) => setNewLocation(prev => ({ ...prev, zip: e.target.value }))}
                        placeholder="90210"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <PortalInput
                        label="Phone"
                        value={newLocation.phone}
                        onChange={(e) => setNewLocation(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="(555) 123-4567"
                      />
                      <PortalInput
                        label="Email"
                        type="email"
                        value={newLocation.email}
                        onChange={(e) => setNewLocation(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="downtown@clinic.com"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-6">
                    <button
                      onClick={async () => {
                        if (!newLocation.name || !newLocation.city || !newLocation.state) {
                          setLocationError('Name, city, and state are required');
                          return;
                        }
                        setAddingLocation(true);
                        setLocationError('');
                        try {
                          const res = await fetch('/api/portal/locations', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(newLocation),
                          });
                          const data = await res.json();
                          if (!res.ok) {
                            setLocationError(data.message || data.error || 'Failed to add location');
                            return;
                          }
                          setLocations(prev => [...prev, { ...newLocation, id: data.id }]);
                          setNewLocation({ name: '', address: '', city: '', state: '', zip: '', phone: '', email: '' });
                          setShowAddForm(false);
                        } catch {
                          setLocationError('Failed to add location');
                        } finally {
                          setAddingLocation(false);
                        }
                      }}
                      disabled={addingLocation}
                      className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all disabled:opacity-50"
                    >
                      {addingLocation ? 'Adding...' : 'Add Location'}
                    </button>
                    <button
                      onClick={() => {
                        setShowAddForm(false);
                        setNewLocation({ name: '', address: '', city: '', state: '', zip: '', phone: '', email: '' });
                        setLocationError('');
                      }}
                      className="px-6 py-2.5 rounded-lg text-sm font-medium text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </PortalCard>
      )}
    </div>
  );
}