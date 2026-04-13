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
  hint,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
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
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
  placeholder,
  hint,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  hint?: string;
  rows?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 font-mono text-xs"
      />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

export default function AdminSettings() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Existing settings state
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

  // --- NEW: Branding & Identity ---
  const [brandingSiteName, setBrandingSiteName] = useState('');
  const [brandingTagline, setBrandingTagline] = useState('');
  const [brandingPrimaryColor, setBrandingPrimaryColor] = useState('#6366f1');
  const [brandingLogoUrl, setBrandingLogoUrl] = useState('');

  // --- NEW: Social Links ---
  const [socialTwitter, setSocialTwitter] = useState('');
  const [socialFacebook, setSocialFacebook] = useState('');
  const [socialLinkedIn, setSocialLinkedIn] = useState('');
  const [socialInstagram, setSocialInstagram] = useState('');
  const [socialYouTube, setSocialYouTube] = useState('');

  // --- NEW: Analytics & Tracking ---
  const [analyticsGa4, setAnalyticsGa4] = useState('');
  const [analyticsGsc, setAnalyticsGsc] = useState('');
  const [analyticsFbPixel, setAnalyticsFbPixel] = useState('');
  const [analyticsHotjar, setAnalyticsHotjar] = useState('');
  const [analyticsHubspot, setAnalyticsHubspot] = useState('');

  // --- NEW: SEO Defaults ---
  const [seoDefaultTitle, setSeoDefaultTitle] = useState('');
  const [seoDefaultDescription, setSeoDefaultDescription] = useState('');
  const [seoDefaultOgImage, setSeoDefaultOgImage] = useState('');
  const [seoCanonicalBase, setSeoCanonicalBase] = useState('');

  // --- NEW: Cookie & Privacy ---
  const [cookieBannerEnabled, setCookieBannerEnabled] = useState(false);
  const [cookieConsentText, setCookieConsentText] = useState('');
  const [cookiePrivacyUrl, setCookiePrivacyUrl] = useState('');

  // --- NEW: Sitemap & Crawling ---
  const [sitemapEnabled, setSitemapEnabled] = useState(true);
  const [robotsTxt, setRobotsTxt] = useState('');

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
        const s = d.settings || {};

        // Existing settings
        if (s.maintenance_mode !== undefined) setMaintenance(!!s.maintenance_mode);
        if (s.meta_title_template !== undefined) setMetaTitleTemplate(String(s.meta_title_template || ''));
        if (s.meta_description !== undefined) setMetaDescription(String(s.meta_description || ''));
        if (s.from_email !== undefined) setFromEmail(String(s.from_email || ''));
        if (s.reply_to_email !== undefined) setReplyToEmail(String(s.reply_to_email || ''));
        if (s.feature_flags !== undefined) {
          const f = s.feature_flags as Record<string, boolean>;
          setFlags((prev) => ({ ...prev, ...f }));
        }

        // --- NEW: Branding & Identity ---
        if (s.branding_site_name !== undefined) setBrandingSiteName(String(s.branding_site_name || ''));
        if (s.branding_tagline !== undefined) setBrandingTagline(String(s.branding_tagline || ''));
        if (s.branding_primary_color !== undefined) setBrandingPrimaryColor(String(s.branding_primary_color || '#6366f1'));
        if (s.branding_logo_url !== undefined) setBrandingLogoUrl(String(s.branding_logo_url || ''));

        // --- NEW: Social Links ---
        if (s.social_twitter_url !== undefined) setSocialTwitter(String(s.social_twitter_url || ''));
        if (s.social_facebook_url !== undefined) setSocialFacebook(String(s.social_facebook_url || ''));
        if (s.social_linkedin_url !== undefined) setSocialLinkedIn(String(s.social_linkedin_url || ''));
        if (s.social_instagram_url !== undefined) setSocialInstagram(String(s.social_instagram_url || ''));
        if (s.social_youtube_url !== undefined) setSocialYouTube(String(s.social_youtube_url || ''));

        // --- NEW: Analytics & Tracking ---
        if (s.analytics_ga4_id !== undefined) setAnalyticsGa4(String(s.analytics_ga4_id || ''));
        if (s.analytics_gsc_url !== undefined) setAnalyticsGsc(String(s.analytics_gsc_url || ''));
        if (s.analytics_fb_pixel_id !== undefined) setAnalyticsFbPixel(String(s.analytics_fb_pixel_id || ''));
        if (s.analytics_hotjar_id !== undefined) setAnalyticsHotjar(String(s.analytics_hotjar_id || ''));
        if (s.analytics_hubspot_embed !== undefined) setAnalyticsHubspot(String(s.analytics_hubspot_embed || ''));

        // --- NEW: SEO Defaults ---
        if (s.seo_default_title !== undefined) setSeoDefaultTitle(String(s.seo_default_title || ''));
        if (s.seo_default_description !== undefined) setSeoDefaultDescription(String(s.seo_default_description || ''));
        if (s.seo_default_og_image !== undefined) setSeoDefaultOgImage(String(s.seo_default_og_image || ''));
        if (s.seo_canonical_base_url !== undefined) setSeoCanonicalBase(String(s.seo_canonical_base_url || ''));

        // --- NEW: Cookie & Privacy ---
        if (s.cookie_banner_enabled !== undefined) setCookieBannerEnabled(!!s.cookie_banner_enabled);
        if (s.cookie_consent_text !== undefined) setCookieConsentText(String(s.cookie_consent_text || ''));
        if (s.cookie_privacy_url !== undefined) setCookiePrivacyUrl(String(s.cookie_privacy_url || ''));

        // --- NEW: Sitemap & Crawling ---
        if (s.sitemap_enabled !== undefined) setSitemapEnabled(!!s.sitemap_enabled);
        if (s.robots_txt !== undefined) setRobotsTxt(String(s.robots_txt || ''));
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
        await fetchData();
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

      {/* ============================================================
          NEW SECTION: Branding & Identity
          ============================================================ */}
      <Section
        title="Branding & Identity"
        description="Set your site's name, tagline, colors, and logo"
        onSave={() =>
          saveSettings('branding', {
            branding_site_name: brandingSiteName,
            branding_tagline: brandingTagline,
            branding_primary_color: brandingPrimaryColor,
            branding_logo_url: brandingLogoUrl,
          })
        }
        saving={savingSection === 'branding'}
      >
        <FieldInput
          label="Site Name"
          value={brandingSiteName}
          onChange={setBrandingSiteName}
          placeholder="TMS List"
        />
        <FieldInput
          label="Tagline"
          value={brandingTagline}
          onChange={setBrandingTagline}
          placeholder="Find the best TMS therapy clinics near you"
        />
        <FieldInput
          label="Primary Color"
          value={brandingPrimaryColor}
          onChange={setBrandingPrimaryColor}
          type="text"
          placeholder="#6366f1"
          hint="Enter a valid hex color code (e.g. #6366f1)"
        />
        <FieldInput
          label="Logo URL"
          value={brandingLogoUrl}
          onChange={setBrandingLogoUrl}
          type="url"
          placeholder="https://example.com/logo.png"
        />
      </Section>

      {/* ============================================================
          NEW SECTION: Social Links
          ============================================================ */}
      <Section
        title="Social Links"
        description="Your social media profile URLs"
        onSave={() =>
          saveSettings('social', {
            social_twitter_url: socialTwitter,
            social_facebook_url: socialFacebook,
            social_linkedin_url: socialLinkedIn,
            social_instagram_url: socialInstagram,
            social_youtube_url: socialYouTube,
          })
        }
        saving={savingSection === 'social'}
      >
        <FieldInput
          label="Twitter / X URL"
          value={socialTwitter}
          onChange={setSocialTwitter}
          type="url"
          placeholder="https://twitter.com/yourhandle"
        />
        <FieldInput
          label="Facebook URL"
          value={socialFacebook}
          onChange={setSocialFacebook}
          type="url"
          placeholder="https://facebook.com/yourpage"
        />
        <FieldInput
          label="LinkedIn URL"
          value={socialLinkedIn}
          onChange={setSocialLinkedIn}
          type="url"
          placeholder="https://linkedin.com/company/yourcompany"
        />
        <FieldInput
          label="Instagram URL"
          value={socialInstagram}
          onChange={setSocialInstagram}
          type="url"
          placeholder="https://instagram.com/yourhandle"
        />
        <FieldInput
          label="YouTube URL"
          value={socialYouTube}
          onChange={setSocialYouTube}
          type="url"
          placeholder="https://youtube.com/@yourchannel"
        />
      </Section>

      {/* ============================================================
          NEW SECTION: Analytics & Tracking
          ============================================================ */}
      <Section
        title="Analytics & Tracking"
        description="IDs and embed codes for analytics and tracking tools"
        onSave={() =>
          saveSettings('analytics', {
            analytics_ga4_id: analyticsGa4,
            analytics_gsc_url: analyticsGsc,
            analytics_fb_pixel_id: analyticsFbPixel,
            analytics_hotjar_id: analyticsHotjar,
            analytics_hubspot_embed: analyticsHubspot,
          })
        }
        saving={savingSection === 'analytics'}
      >
        <FieldInput
          label="Google Analytics 4 ID"
          value={analyticsGa4}
          onChange={setAnalyticsGa4}
          placeholder="G-XXXXXXXXXX"
          hint="Found in your GA4 admin panel under Data Streams"
        />
        <FieldInput
          label="Google Search Console URL"
          value={analyticsGsc}
          onChange={setAnalyticsGsc}
          type="url"
          placeholder="https://search.google.com/search-console"
          hint="Link to your Search Console property"
        />
        <FieldInput
          label="Facebook Pixel ID"
          value={analyticsFbPixel}
          onChange={setAnalyticsFbPixel}
          placeholder="XXXXXXXXXX"
          hint="Found in Meta Events Manager"
        />
        <FieldInput
          label="Hotjar Site ID"
          value={analyticsHotjar}
          onChange={setAnalyticsHotjar}
          placeholder="XXXXXXXX"
          hint="Found in your Hotjar account settings"
        />
        <Textarea
          label="HubSpot Embed Code"
          value={analyticsHubspot}
          onChange={setAnalyticsHubspot}
          placeholder='<script src="//js.hs-scripts.com/XXXXXXX.js"></script>'
          hint="Full HubSpot tracking embed script (not just the ID)"
          rows={3}
        />
      </Section>

      {/* ============================================================
          NEW SECTION: SEO Defaults
          ============================================================ */}
      <Section
        title="SEO Defaults"
        description="Default values used for page meta tags when no specific value is set"
        onSave={() =>
          saveSettings('seo-defaults', {
            seo_default_title: seoDefaultTitle,
            seo_default_description: seoDefaultDescription,
            seo_default_og_image: seoDefaultOgImage,
            seo_canonical_base_url: seoCanonicalBase,
          })
        }
        saving={savingSection === 'seo-defaults'}
      >
        <FieldInput
          label="Default Meta Title"
          value={seoDefaultTitle}
          onChange={setSeoDefaultTitle}
          placeholder="TMS Therapy Clinics Near You | TMS List"
        />
        <Textarea
          label="Default Meta Description"
          value={seoDefaultDescription}
          onChange={setSeoDefaultDescription}
          placeholder="Find verified TMS therapy clinics in your area. Browse reviews, compare treatments, and book a consultation today."
          rows={3}
        />
        <FieldInput
          label="Default OG Image URL"
          value={seoDefaultOgImage}
          onChange={setSeoDefaultOgImage}
          type="url"
          placeholder="https://example.com/og-default.png"
          hint="Used when a page has no specific OG image set"
        />
        <FieldInput
          label="Canonical Base URL"
          value={seoCanonicalBase}
          onChange={setSeoCanonicalBase}
          type="url"
          placeholder="https://www.tmslist.com"
          hint="Used to generate canonical URLs across the site"
        />
      </Section>

      {/* ============================================================
          NEW SECTION: Cookie & Privacy
          ============================================================ */}
      <Section
        title="Cookie & Privacy"
        description="Cookie banner and privacy policy configuration"
        onSave={() =>
          saveSettings('cookie', {
            cookie_banner_enabled: cookieBannerEnabled,
            cookie_consent_text: cookieConsentText,
            cookie_privacy_url: cookiePrivacyUrl,
          })
        }
        saving={savingSection === 'cookie'}
      >
        <Toggle
          label="Enable Cookie Banner"
          description="Show a cookie consent banner to new visitors"
          checked={cookieBannerEnabled}
          onChange={setCookieBannerEnabled}
        />
        <Textarea
          label="Cookie Consent Text"
          value={cookieConsentText}
          onChange={setCookieConsentText}
          placeholder="We use cookies to improve your experience. By continuing to browse, you agree to our use of cookies."
          rows={3}
        />
        <FieldInput
          label="Privacy Policy URL"
          value={cookiePrivacyUrl}
          onChange={setCookiePrivacyUrl}
          type="url"
          placeholder="https://www.tmslist.com/privacy"
        />
      </Section>

      {/* ============================================================
          NEW SECTION: Sitemap & Crawling
          ============================================================ */}
      <Section
        title="Sitemap & Crawling"
        description="Control how search engines index your site"
        onSave={() =>
          saveSettings('sitemap', {
            sitemap_enabled: sitemapEnabled,
            robots_txt: robotsTxt,
          })
        }
        saving={savingSection === 'sitemap'}
      >
        <Toggle
          label="Enable Sitemap Auto-Generation"
          description="Automatically generate and serve /sitemap.xml"
          checked={sitemapEnabled}
          onChange={setSitemapEnabled}
        />
        <Textarea
          label="robots.txt Content"
          value={robotsTxt}
          onChange={setRobotsTxt}
          placeholder="User-agent: *&#10;Allow: /&#10;Disallow: /admin/&#10;&#10;Sitemap: https://www.tmslist.com/sitemap.xml"
          hint="Controls which pages search engines may crawl. Leave empty for default."
          rows={6}
        />
      </Section>
    </div>
  );
}
