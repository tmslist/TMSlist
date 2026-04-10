import { useState, useEffect, useCallback } from 'react';

interface AdminClinicEditorProps {
  clinicId: string;
}

interface FAQ {
  question: string;
  answer: string;
}

interface OpeningHour {
  day: string;
  open: string;
  close: string;
}

interface ClinicData {
  id: string;
  name: string;
  slug: string;
  providerType: string;
  description: string;
  descriptionLong: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  lat: number | null;
  lng: number | null;
  phone: string;
  website: string;
  email: string;
  machines: string[];
  specialties: string[];
  insurances: string[];
  openingHours: OpeningHour[];
  media: {
    hero_image_url: string;
    logo_url: string;
    gallery_urls: string[];
    video_url: string;
  };
  googleProfile: {
    place_id: string;
    embed_url: string;
    reviews_url: string;
  };
  pricing: {
    price_range: string;
    session_price_min: number | null;
    session_price_max: number | null;
    full_course_price: number | null;
    free_consultation: boolean;
    payment_plans: boolean;
    accepts_insurance: boolean;
    cash_discount: boolean;
  };
  accessibility: {
    wheelchair_accessible: boolean;
    lgbtq_friendly: boolean;
    lgbtq_owned: boolean;
    bipoc_owned: boolean;
    veteran_friendly: boolean;
    spanish_speaking: boolean;
    multilingual: boolean;
    languages_spoken: string[];
    sensory_friendly: boolean;
    trauma_informed: boolean;
  };
  availability: {
    accepting_new_patients: boolean;
    wait_time_weeks: number | null;
    same_week_available: boolean;
    evening_hours: boolean;
    weekend_hours: boolean;
    telehealth_consults: boolean;
    virtual_followups: boolean;
    home_visits: boolean;
  };
  faqs: FAQ[];
  verified: boolean;
  isFeatured: boolean;
}

const PROVIDER_TYPES = [
  { value: 'psychiatrist', label: 'Psychiatrist' },
  { value: 'tms_center', label: 'TMS Center' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'neurologist', label: 'Neurologist' },
  { value: 'mental_health_clinic', label: 'Mental Health Clinic' },
  { value: 'primary_care', label: 'Primary Care' },
  { value: 'nurse_practitioner', label: 'Nurse Practitioner' },
];

const PRICE_RANGES = ['$', '$$', '$$$', '$$$$'];

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const TABS = [
  { key: 'basic', label: 'Basic Info' },
  { key: 'location', label: 'Location' },
  { key: 'contact', label: 'Contact' },
  { key: 'services', label: 'Services' },
  { key: 'hours', label: 'Hours' },
  { key: 'media', label: 'Media' },
  { key: 'google', label: 'Google' },
  { key: 'pricing', label: 'Pricing' },
  { key: 'accessibility', label: 'Accessibility' },
  { key: 'availability', label: 'Availability' },
  { key: 'faqs', label: 'FAQs' },
  { key: 'status', label: 'Status' },
];

function emptyClinic(): ClinicData {
  return {
    id: '',
    name: '',
    slug: '',
    providerType: 'tms_center',
    description: '',
    descriptionLong: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    lat: null,
    lng: null,
    phone: '',
    website: '',
    email: '',
    machines: [],
    specialties: [],
    insurances: [],
    openingHours: [],
    media: { hero_image_url: '', logo_url: '', gallery_urls: [], video_url: '' },
    googleProfile: { place_id: '', embed_url: '', reviews_url: '' },
    pricing: {
      price_range: '',
      session_price_min: null,
      session_price_max: null,
      full_course_price: null,
      free_consultation: false,
      payment_plans: false,
      accepts_insurance: false,
      cash_discount: false,
    },
    accessibility: {
      wheelchair_accessible: false,
      lgbtq_friendly: false,
      lgbtq_owned: false,
      bipoc_owned: false,
      veteran_friendly: false,
      spanish_speaking: false,
      multilingual: false,
      languages_spoken: [],
      sensory_friendly: false,
      trauma_informed: false,
    },
    availability: {
      accepting_new_patients: false,
      wait_time_weeks: null,
      same_week_available: false,
      evening_hours: false,
      weekend_hours: false,
      telehealth_consults: false,
      virtual_followups: false,
      home_visits: false,
    },
    faqs: [],
    verified: false,
    isFeatured: false,
  };
}

// ---- Reusable sub-components ----

function TagInput({
  tags,
  onChange,
  placeholder = 'Add tag...',
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState('');

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      const value = input.trim();
      if (!tags.includes(value)) {
        onChange([...tags, value]);
      }
      setInput('');
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  }

  function removeTag(index: number) {
    onChange(tags.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-wrap gap-1.5 p-2 border border-gray-300 rounded-lg bg-white min-h-[42px] focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-200 transition-colors">
      {tags.map((tag, i) => (
        <span
          key={`${tag}-${i}`}
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-50 text-violet-700 text-xs font-medium rounded-full"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(i)}
            className="text-violet-400 hover:text-violet-700 transition-colors"
            aria-label={`Remove ${tag}`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[120px] text-sm outline-none bg-transparent placeholder:text-gray-400"
      />
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-violet-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ${
            checked ? 'translate-x-[22px]' : 'translate-x-0.5'
          }`}
        />
      </button>
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}

// ---- Main Component ----

export default function AdminClinicEditor({ clinicId }: AdminClinicEditorProps) {
  const [clinic, setClinic] = useState<ClinicData>(emptyClinic());
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [error, setError] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Warn on unsaved changes before leaving
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) { e.preventDefault(); }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    async function fetchClinic() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/admin/clinics?id=${clinicId}`);
        if (res.status === 401) {
          window.location.href = '/admin/login';
          return;
        }
        if (!res.ok) throw new Error('Failed to fetch clinic');
        const json = await res.json();
        const d = json.data || json;
        setClinic({
          ...emptyClinic(),
          ...d,
          machines: d.machines || [],
          specialties: d.specialties || [],
          insurances: d.insurances || [],
          openingHours: d.openingHours || [],
          media: { ...emptyClinic().media, ...(d.media || {}) },
          googleProfile: { ...emptyClinic().googleProfile, ...(d.googleProfile || {}) },
          pricing: { ...emptyClinic().pricing, ...(d.pricing || {}) },
          accessibility: { ...emptyClinic().accessibility, ...(d.accessibility || {}) },
          availability: { ...emptyClinic().availability, ...(d.availability || {}) },
          faqs: d.faqs || [],
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load clinic');
      } finally {
        setLoading(false);
      }
    }
    fetchClinic();
  }, [clinicId]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/clinics', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clinic),
      });
      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save clinic');
      }
      showToast('success', 'Clinic saved successfully');
      setHasUnsavedChanges(false);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }, [clinic, showToast]);

  function updateField<K extends keyof ClinicData>(key: K, value: ClinicData[K]) {
    setClinic((prev) => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  }

  function updateNested<P extends 'media' | 'googleProfile' | 'pricing' | 'accessibility' | 'availability'>(
    parent: P,
    key: string,
    value: unknown
  ) {
    setClinic((prev) => ({
      ...prev,
      [parent]: { ...prev[parent], [key]: value },
    }));
    setHasUnsavedChanges(true);
  }

  // ---- Hours helpers ----
  function addHour() {
    const usedDays = new Set(clinic.openingHours.map((h) => h.day));
    const nextDay = DAYS_OF_WEEK.find((d) => !usedDays.has(d)) || 'Monday';
    updateField('openingHours', [...clinic.openingHours, { day: nextDay, open: '09:00', close: '17:00' }]);
  }

  function updateHour(index: number, field: keyof OpeningHour, value: string) {
    const updated = clinic.openingHours.map((h, i) => (i === index ? { ...h, [field]: value } : h));
    updateField('openingHours', updated);
  }

  function removeHour(index: number) {
    updateField(
      'openingHours',
      clinic.openingHours.filter((_, i) => i !== index)
    );
  }

  // ---- FAQ helpers ----
  function addFaq() {
    updateField('faqs', [...clinic.faqs, { question: '', answer: '' }]);
  }

  function updateFaq(index: number, field: keyof FAQ, value: string) {
    const updated = clinic.faqs.map((f, i) => (i === index ? { ...f, [field]: value } : f));
    updateField('faqs', updated);
  }

  function removeFaq(index: number) {
    updateField(
      'faqs',
      clinic.faqs.filter((_, i) => i !== index)
    );
  }

  // ---- Gallery helpers ----
  function addGalleryUrl() {
    updateNested('media', 'gallery_urls', [...(clinic.media.gallery_urls || []), '']);
  }

  function updateGalleryUrl(index: number, value: string) {
    const updated = [...(clinic.media.gallery_urls || [])];
    updated[index] = value;
    updateNested('media', 'gallery_urls', updated);
  }

  function removeGalleryUrl(index: number) {
    updateNested(
      'media',
      'gallery_urls',
      (clinic.media.gallery_urls || []).filter((_: string, i: number) => i !== index)
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
        <span className="ml-3 text-gray-500">Loading clinic...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-800 font-medium">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-3 text-sm text-red-600 hover:underline">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{clinic.name || 'New Clinic'}</h2>
          <p className="text-sm text-gray-500 mt-0.5">ID: {clinic.id}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {saving && (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <div className="flex gap-0 min-w-max">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-violet-600 text-violet-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        {/* Basic Info */}
        {activeTab === 'basic' && (
          <div className="space-y-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Clinic Name</label>
                <input
                  type="text"
                  value={clinic.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                  placeholder="e.g. TMS Health Solutions"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  value={clinic.slug}
                  onChange={(e) => updateField('slug', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                  placeholder="tms-health-solutions"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provider Type</label>
              <select
                value={clinic.providerType}
                onChange={(e) => updateField('providerType', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200 bg-white"
              >
                {PROVIDER_TYPES.map((pt) => (
                  <option key={pt.value} value={pt.value}>
                    {pt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
              <textarea
                value={clinic.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                placeholder="Brief description of the clinic..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Long Description</label>
              <textarea
                value={clinic.descriptionLong}
                onChange={(e) => updateField('descriptionLong', e.target.value)}
                rows={6}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                placeholder="Detailed description..."
              />
            </div>
          </div>
        )}

        {/* Location */}
        {activeTab === 'location' && (
          <div className="space-y-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Location</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
              <input
                type="text"
                value={clinic.address}
                onChange={(e) => updateField('address', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                placeholder="123 Main St, Suite 100"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={clinic.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  value={clinic.state}
                  onChange={(e) => updateField('state', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                <input
                  type="text"
                  value={clinic.zip}
                  onChange={(e) => updateField('zip', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input
                  type="text"
                  value={clinic.country}
                  onChange={(e) => updateField('country', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                  placeholder="US"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={clinic.lat ?? ''}
                  onChange={(e) => updateField('lat', e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                  placeholder="40.7128"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={clinic.lng ?? ''}
                  onChange={(e) => updateField('lng', e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                  placeholder="-74.0060"
                />
              </div>
            </div>
          </div>
        )}

        {/* Contact */}
        {activeTab === 'contact' && (
          <div className="space-y-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={clinic.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={clinic.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                  placeholder="info@clinic.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                type="url"
                value={clinic.website}
                onChange={(e) => updateField('website', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                placeholder="https://www.clinic.com"
              />
            </div>
          </div>
        )}

        {/* Services */}
        {activeTab === 'services' && (
          <div className="space-y-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Services &amp; Equipment</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">TMS Machines</label>
              <TagInput
                tags={clinic.machines}
                onChange={(tags) => updateField('machines', tags)}
                placeholder="Add machine (e.g. NeuroStar, BrainsWay)..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specialties</label>
              <TagInput
                tags={clinic.specialties}
                onChange={(tags) => updateField('specialties', tags)}
                placeholder="Add specialty (e.g. Depression, OCD, PTSD)..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Accepted</label>
              <TagInput
                tags={clinic.insurances}
                onChange={(tags) => updateField('insurances', tags)}
                placeholder="Add insurance (e.g. Aetna, BCBS, UnitedHealthcare)..."
              />
            </div>
          </div>
        )}

        {/* Hours */}
        {activeTab === 'hours' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">Opening Hours</h3>
              <button
                type="button"
                onClick={addHour}
                className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium rounded-lg transition-colors"
              >
                + Add Hours
              </button>
            </div>
            {clinic.openingHours.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No hours set. Click "Add Hours" to begin.</p>
            ) : (
              <div className="space-y-3">
                {clinic.openingHours.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                    <select
                      value={h.day}
                      onChange={(e) => updateHour(i, 'day', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:border-violet-500"
                    >
                      {DAYS_OF_WEEK.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    <input
                      type="time"
                      value={h.open}
                      onChange={(e) => updateHour(i, 'open', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-violet-500"
                    />
                    <span className="text-sm text-gray-400">to</span>
                    <input
                      type="time"
                      value={h.close}
                      onChange={(e) => updateHour(i, 'close', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-violet-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeHour(i)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="Remove"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Media */}
        {activeTab === 'media' && (
          <div className="space-y-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Media</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hero Image URL</label>
                <input
                  type="url"
                  value={clinic.media.hero_image_url}
                  onChange={(e) => updateNested('media', 'hero_image_url', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                <input
                  type="url"
                  value={clinic.media.logo_url}
                  onChange={(e) => updateNested('media', 'logo_url', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                  placeholder="https://..."
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Video URL</label>
              <input
                type="url"
                value={clinic.media.video_url}
                onChange={(e) => updateNested('media', 'video_url', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                placeholder="https://youtube.com/..."
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Gallery URLs</label>
                <button
                  type="button"
                  onClick={addGalleryUrl}
                  className="text-xs font-medium text-violet-600 hover:text-violet-700"
                >
                  + Add Image
                </button>
              </div>
              {(clinic.media.gallery_urls || []).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No gallery images.</p>
              ) : (
                <div className="space-y-2">
                  {(clinic.media.gallery_urls || []).map((url: string, i: number) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => updateGalleryUrl(i, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-violet-500"
                        placeholder="https://..."
                      />
                      <button
                        type="button"
                        onClick={() => removeGalleryUrl(i)}
                        className="px-2 text-red-400 hover:text-red-600"
                        aria-label="Remove image"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Google */}
        {activeTab === 'google' && (
          <div className="space-y-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Google Profile</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Place ID</label>
              <input
                type="text"
                value={clinic.googleProfile.place_id}
                onChange={(e) => updateNested('googleProfile', 'place_id', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                placeholder="ChIJ..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Google Maps Embed URL</label>
              <input
                type="url"
                value={clinic.googleProfile.embed_url}
                onChange={(e) => updateNested('googleProfile', 'embed_url', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                placeholder="https://www.google.com/maps/embed?..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Google Reviews URL</label>
              <input
                type="url"
                value={clinic.googleProfile.reviews_url}
                onChange={(e) => updateNested('googleProfile', 'reviews_url', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                placeholder="https://www.google.com/maps/place/..."
              />
            </div>
          </div>
        )}

        {/* Pricing */}
        {activeTab === 'pricing' && (
          <div className="space-y-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Pricing</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
                <select
                  value={clinic.pricing.price_range}
                  onChange={(e) => updateNested('pricing', 'price_range', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:border-violet-500"
                >
                  <option value="">Select...</option>
                  {PRICE_RANGES.map((pr) => (
                    <option key={pr} value={pr}>{pr}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Course Price ($)</label>
                <input
                  type="number"
                  value={clinic.pricing.full_course_price ?? ''}
                  onChange={(e) => updateNested('pricing', 'full_course_price', e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                  placeholder="e.g. 12000"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Session Price Min ($)</label>
                <input
                  type="number"
                  value={clinic.pricing.session_price_min ?? ''}
                  onChange={(e) => updateNested('pricing', 'session_price_min', e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                  placeholder="e.g. 200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Session Price Max ($)</label>
                <input
                  type="number"
                  value={clinic.pricing.session_price_max ?? ''}
                  onChange={(e) => updateNested('pricing', 'session_price_max', e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                  placeholder="e.g. 400"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <Toggle
                checked={clinic.pricing.free_consultation}
                onChange={(v) => updateNested('pricing', 'free_consultation', v)}
                label="Free Consultation"
              />
              <Toggle
                checked={clinic.pricing.payment_plans}
                onChange={(v) => updateNested('pricing', 'payment_plans', v)}
                label="Payment Plans"
              />
              <Toggle
                checked={clinic.pricing.accepts_insurance}
                onChange={(v) => updateNested('pricing', 'accepts_insurance', v)}
                label="Accepts Insurance"
              />
              <Toggle
                checked={clinic.pricing.cash_discount}
                onChange={(v) => updateNested('pricing', 'cash_discount', v)}
                label="Cash Discount"
              />
            </div>
          </div>
        )}

        {/* Accessibility */}
        {activeTab === 'accessibility' && (
          <div className="space-y-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Accessibility &amp; Inclusivity</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <Toggle
                checked={clinic.accessibility.wheelchair_accessible}
                onChange={(v) => updateNested('accessibility', 'wheelchair_accessible', v)}
                label="Wheelchair Accessible"
              />
              <Toggle
                checked={clinic.accessibility.lgbtq_friendly}
                onChange={(v) => updateNested('accessibility', 'lgbtq_friendly', v)}
                label="LGBTQ+ Friendly"
              />
              <Toggle
                checked={clinic.accessibility.lgbtq_owned}
                onChange={(v) => updateNested('accessibility', 'lgbtq_owned', v)}
                label="LGBTQ+ Owned"
              />
              <Toggle
                checked={clinic.accessibility.bipoc_owned}
                onChange={(v) => updateNested('accessibility', 'bipoc_owned', v)}
                label="BIPOC Owned"
              />
              <Toggle
                checked={clinic.accessibility.veteran_friendly}
                onChange={(v) => updateNested('accessibility', 'veteran_friendly', v)}
                label="Veteran Friendly"
              />
              <Toggle
                checked={clinic.accessibility.spanish_speaking}
                onChange={(v) => updateNested('accessibility', 'spanish_speaking', v)}
                label="Spanish Speaking"
              />
              <Toggle
                checked={clinic.accessibility.multilingual}
                onChange={(v) => updateNested('accessibility', 'multilingual', v)}
                label="Multilingual"
              />
              <Toggle
                checked={clinic.accessibility.sensory_friendly}
                onChange={(v) => updateNested('accessibility', 'sensory_friendly', v)}
                label="Sensory Friendly"
              />
              <Toggle
                checked={clinic.accessibility.trauma_informed}
                onChange={(v) => updateNested('accessibility', 'trauma_informed', v)}
                label="Trauma Informed"
              />
            </div>
            <div className="pt-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Languages Spoken</label>
              <TagInput
                tags={clinic.accessibility.languages_spoken}
                onChange={(tags) => updateNested('accessibility', 'languages_spoken', tags)}
                placeholder="Add language (e.g. English, Spanish, Mandarin)..."
              />
            </div>
          </div>
        )}

        {/* Availability */}
        {activeTab === 'availability' && (
          <div className="space-y-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Availability</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <Toggle
                checked={clinic.availability.accepting_new_patients}
                onChange={(v) => updateNested('availability', 'accepting_new_patients', v)}
                label="Accepting New Patients"
              />
              <Toggle
                checked={clinic.availability.same_week_available}
                onChange={(v) => updateNested('availability', 'same_week_available', v)}
                label="Same Week Available"
              />
              <Toggle
                checked={clinic.availability.evening_hours}
                onChange={(v) => updateNested('availability', 'evening_hours', v)}
                label="Evening Hours"
              />
              <Toggle
                checked={clinic.availability.weekend_hours}
                onChange={(v) => updateNested('availability', 'weekend_hours', v)}
                label="Weekend Hours"
              />
              <Toggle
                checked={clinic.availability.telehealth_consults}
                onChange={(v) => updateNested('availability', 'telehealth_consults', v)}
                label="Telehealth Consults"
              />
              <Toggle
                checked={clinic.availability.virtual_followups}
                onChange={(v) => updateNested('availability', 'virtual_followups', v)}
                label="Virtual Follow-ups"
              />
              <Toggle
                checked={clinic.availability.home_visits}
                onChange={(v) => updateNested('availability', 'home_visits', v)}
                label="Home Visits"
              />
            </div>
            <div className="pt-2 max-w-xs">
              <label className="block text-sm font-medium text-gray-700 mb-1">Wait Time (weeks)</label>
              <input
                type="number"
                min={0}
                value={clinic.availability.wait_time_weeks ?? ''}
                onChange={(e) => updateNested('availability', 'wait_time_weeks', e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                placeholder="e.g. 2"
              />
            </div>
          </div>
        )}

        {/* FAQs */}
        {activeTab === 'faqs' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">FAQs</h3>
              <button
                type="button"
                onClick={addFaq}
                className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium rounded-lg transition-colors"
              >
                + Add FAQ
              </button>
            </div>
            {clinic.faqs.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No FAQs. Click "Add FAQ" to create one.</p>
            ) : (
              <div className="space-y-4">
                {clinic.faqs.map((faq, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold text-gray-400 mt-2">Q{i + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeFaq(i)}
                        className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        aria-label="Remove FAQ"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={faq.question}
                      onChange={(e) => updateFaq(i, 'question', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-violet-500"
                      placeholder="Question..."
                    />
                    <textarea
                      value={faq.answer}
                      onChange={(e) => updateFaq(i, 'answer', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-violet-500"
                      placeholder="Answer..."
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Status */}
        {activeTab === 'status' && (
          <div className="space-y-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Status &amp; Visibility</h3>
            <div className="space-y-4">
              <Toggle
                checked={clinic.verified}
                onChange={(v) => updateField('verified', v)}
                label="Verified Clinic"
              />
              <Toggle
                checked={clinic.isFeatured}
                onChange={(v) => updateField('isFeatured', v)}
                label="Featured Listing"
              />
            </div>
            <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-500">
              <p><span className="font-medium text-gray-700">Verified</span> clinics appear with a badge and are prioritized in search results.</p>
              <p className="mt-1"><span className="font-medium text-gray-700">Featured</span> clinics are highlighted on the homepage and city pages.</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Save */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {saving && (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
