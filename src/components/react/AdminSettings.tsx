import { useState, useEffect, useCallback } from 'react';

interface SiteStats {
  clinics: number;
  verifiedClinics: number;
  doctors: number;
  reviews: number;
  pendingReviews: number;
  leads: number;
  questions: number;
  treatments: number;
  users: number;
}

interface SettingsData {
  stats: SiteStats;
  settings: Record<string, unknown>;
}

function Section({
  title,
  description,
  children,
  onSave,
  saving,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  onSave?: () => void;
  saving?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
      <div className="px-6 py-5 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{description}</p>
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
      {onSave && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-xl flex justify-end">
          <button
            onClick={onSave}
            disabled={saving}
            className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-violet-600' : 'bg-gray-300'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
    </div>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
      />
    </div>
  );
}

export default function AdminSettings() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Settings state
  const [maintenance, setMaintenance] = useState(false);
  const [metaTitleTemplate, setMetaTitleTemplate] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [replyToEmail, setReplyToEmail] = useState('');
  const [flags, setFlags] = useState({
    ai_chatbot: false,
    newsletter_popup: false,
    review_submissions: true,
    clinic_submissions: true,
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const d = await res.json();
        setData(d);
        // Populate from saved settings
        const s = d.settings || {};
        if (s.maintenance_mode !== undefined) setMaintenance(!!s.maintenance_mode);
        if (s.meta_title_template !== undefined) setMetaTitleTemplate(String(s.meta_title_template || ''));
        if (s.meta_description !== undefined) setMetaDescription(String(s.meta_description || ''));
        if (s.from_email !== undefined) setFromEmail(String(s.from_email || ''));
        if (s.reply_to_email !== undefined) setReplyToEmail(String(s.reply_to_email || ''));
        if (s.feature_flags !== undefined) {
          const f = s.feature_flags as Record<string, boolean>;
          setFlags((prev) => ({ ...prev, ...f }));
        }
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const saveSettings = async (section: string, settings: Record<string, unknown>) => {
    setSavingSection(section);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      if (res.ok) {
        showToast('Settings saved successfully');
      } else {
        showToast('Failed to save settings');
      }
    } catch {
      showToast('Error saving settings');
    } finally {
      setSavingSection(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-gray-300 border-t-violet-600 rounded-full animate-spin mb-4" />
          <p className="text-gray-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-lg shadow-lg text-sm animate-in fade-in">
          {toast}
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage site configuration</p>
      </div>

      {/* Site Info (read-only) */}
      <Section title="Site Information" description="Overview of your site and database">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs font-medium text-gray-500">Total Clinics</p>
            <p className="text-xl font-semibold text-gray-900">{data?.stats.clinics ?? 0}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Verified</p>
            <p className="text-xl font-semibold text-green-600">{data?.stats.verifiedClinics ?? 0}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Doctors</p>
            <p className="text-xl font-semibold text-gray-900">{data?.stats.doctors ?? 0}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Reviews</p>
            <p className="text-xl font-semibold text-gray-900">{data?.stats.reviews ?? 0}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Pending Reviews</p>
            <p className="text-xl font-semibold text-amber-600">{data?.stats.pendingReviews ?? 0}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Total Leads</p>
            <p className="text-xl font-semibold text-violet-600">{data?.stats.leads ?? 0}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Users</p>
            <p className="text-xl font-semibold text-gray-900">{data?.stats.users ?? 0}</p>
          </div>
        </div>
      </Section>

      {/* Maintenance Mode */}
      <Section
        title="Maintenance Mode"
        description="Enable to show a maintenance page to visitors"
        onSave={() => saveSettings('maintenance', { maintenance_mode: maintenance })}
        saving={savingSection === 'maintenance'}
      >
        <Toggle
          label="Maintenance Mode"
          description="When enabled, visitors see a maintenance page instead of the site"
          checked={maintenance}
          onChange={setMaintenance}
        />
      </Section>

      {/* Default SEO */}
      <Section
        title="Default SEO"
        description="Default meta tags applied across the site"
        onSave={() => saveSettings('seo', { meta_title_template: metaTitleTemplate, meta_description: metaDescription })}
        saving={savingSection === 'seo'}
      >
        <FieldInput
          label="Meta Title Template"
          value={metaTitleTemplate}
          onChange={setMetaTitleTemplate}
          placeholder="e.g. %s | TMS List"
        />
        <FieldInput
          label="Default Meta Description"
          value={metaDescription}
          onChange={setMetaDescription}
          placeholder="Find the best TMS therapy clinics near you..."
        />
      </Section>

      {/* Email Settings */}
      <Section
        title="Email Settings"
        description="Configure email sender information"
        onSave={() => saveSettings('email', { from_email: fromEmail, reply_to_email: replyToEmail })}
        saving={savingSection === 'email'}
      >
        <FieldInput
          label="From Email Address"
          value={fromEmail}
          onChange={setFromEmail}
          type="email"
          placeholder="noreply@tmslist.com"
        />
        <FieldInput
          label="Reply-To Email Address"
          value={replyToEmail}
          onChange={setReplyToEmail}
          type="email"
          placeholder="support@tmslist.com"
        />
      </Section>

      {/* Feature Flags */}
      <Section
        title="Feature Flags"
        description="Toggle site features on or off"
        onSave={() => saveSettings('flags', { feature_flags: flags })}
        saving={savingSection === 'flags'}
      >
        <Toggle
          label="AI Chatbot"
          description="Show the AI chatbot widget on the site"
          checked={flags.ai_chatbot}
          onChange={(v) => setFlags((f) => ({ ...f, ai_chatbot: v }))}
        />
        <Toggle
          label="Newsletter Popup"
          description="Show the newsletter signup popup to visitors"
          checked={flags.newsletter_popup}
          onChange={(v) => setFlags((f) => ({ ...f, newsletter_popup: v }))}
        />
        <Toggle
          label="Review Submissions"
          description="Allow visitors to submit clinic reviews"
          checked={flags.review_submissions}
          onChange={(v) => setFlags((f) => ({ ...f, review_submissions: v }))}
        />
        <Toggle
          label="Clinic Submissions"
          description="Allow visitors to submit new clinic listings"
          checked={flags.clinic_submissions}
          onChange={(v) => setFlags((f) => ({ ...f, clinic_submissions: v }))}
        />
      </Section>
    </div>
  );
}
