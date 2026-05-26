import { useEffect, useState } from 'react';

type Settings = Record<string, unknown>;

const FIELDS = {
  ga4Id: 'tracking_ga4_id',
  gtmId: 'tracking_gtm_id',
  metaPixelId: 'tracking_meta_pixel_id',
  googleSiteVerification: 'tracking_google_site_verification',
  bingSiteVerification: 'tracking_bing_site_verification',
  headCode: 'tracking_head_code',
  bodyOpenCode: 'tracking_body_open_code',
  bodyCloseCode: 'tracking_body_close_code',
} as const;

const VALIDATION: Record<string, RegExp> = {
  tracking_ga4_id: /^G-[A-Z0-9]+$/i,
  tracking_gtm_id: /^GTM-[A-Z0-9]+$/i,
  tracking_meta_pixel_id: /^[0-9]{6,20}$/,
};

const HINTS: Record<string, string> = {
  tracking_ga4_id: 'Format: G-XXXXXXXXXX (Google Analytics 4 measurement ID)',
  tracking_gtm_id: 'Format: GTM-XXXXXXX (Google Tag Manager container ID)',
  tracking_meta_pixel_id: 'Numeric Pixel ID (15–16 digits typically) from Meta Events Manager',
  tracking_google_site_verification:
    'The content="…" value from Google Search Console HTML tag verification',
  tracking_bing_site_verification: 'The content="…" value from Bing Webmaster Tools meta tag',
};

function formatActiveLabel(key: string, value: string) {
  if (!value.trim()) return null;
  const valid = VALIDATION[key]?.test(value.trim()) ?? true;
  return valid ? 'Active' : 'Invalid format';
}

export default function AdminTracking() {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(d => {
        setSettings(d.settings || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function get(key: string): string {
    const v = settings[key];
    return typeof v === 'string' ? v : '';
  }
  function set(key: string, value: string) {
    setSettings(prev => ({ ...prev, [key]: value }));
  }
  function getBool(key: string, defaultVal = true): boolean {
    const v = settings[key];
    return v === undefined ? defaultVal : Boolean(v);
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const payload: Settings = { tracking_enabled: getBool('tracking_enabled') };
      for (const k of Object.values(FIELDS)) payload[k] = get(k);
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: payload }),
      });
      if (!res.ok) throw new Error('Save failed');
      setMsg({ type: 'ok', text: 'Tracking codes saved. Reload site to verify.' });
      setEditing({});
    } catch (e) {
      setMsg({ type: 'err', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="text-sm text-[var(--muted)]">Loading tracking settings...</div>;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-[var(--ink)]">Tracking & Pixel Codes</h1>
        <p className="text-sm text-[var(--muted)] mt-1 max-w-3xl">
          Add Google Analytics, Tag Manager, Meta Pixel, search-console verification, and any
          custom &lt;head&gt;/&lt;body&gt; snippets. Changes apply site-wide on the next page
          render. Code is injected into the public marketing pages only — admin/portal/doctor
          dashboards are excluded.
        </p>
      </header>

      {msg && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            msg.type === 'ok'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {msg.text}
        </div>
      )}

      <Section
        title="Master Switch"
        description="Disable to suspend all tracking injection without losing your saved codes."
      >
        <Toggle
          label="Tracking enabled"
          checked={getBool('tracking_enabled')}
          onChange={v => setSettings(s => ({ ...s, tracking_enabled: v }))}
        />
      </Section>

      <Section
        title="Verification Codes"
        description="Used by search engines to verify site ownership."
      >
        <CodeRow
          label="Google Search Console"
          settingKey={FIELDS.googleSiteVerification}
          value={get(FIELDS.googleSiteVerification)}
          onChange={v => set(FIELDS.googleSiteVerification, v)}
          editing={editing[FIELDS.googleSiteVerification]}
          setEditing={v => setEditing(e => ({ ...e, [FIELDS.googleSiteVerification]: v }))}
          placeholder="abc123def456..."
          mono
        />
        <CodeRow
          label="Bing Webmaster Tools"
          settingKey={FIELDS.bingSiteVerification}
          value={get(FIELDS.bingSiteVerification)}
          onChange={v => set(FIELDS.bingSiteVerification, v)}
          editing={editing[FIELDS.bingSiteVerification]}
          setEditing={v => setEditing(e => ({ ...e, [FIELDS.bingSiteVerification]: v }))}
          placeholder="A1B2C3D4..."
          mono
        />
      </Section>

      <Section
        title="Analytics & Pixels"
        description="Paste only the tracking ID — the script tag is generated for you."
      >
        <CodeRow
          label="Google Analytics 4 (GA4)"
          settingKey={FIELDS.ga4Id}
          value={get(FIELDS.ga4Id)}
          onChange={v => set(FIELDS.ga4Id, v)}
          editing={editing[FIELDS.ga4Id]}
          setEditing={v => setEditing(e => ({ ...e, [FIELDS.ga4Id]: v }))}
          placeholder="G-XXXXXXXXXX"
        />
        <CodeRow
          label="Google Tag Manager"
          settingKey={FIELDS.gtmId}
          value={get(FIELDS.gtmId)}
          onChange={v => set(FIELDS.gtmId, v)}
          editing={editing[FIELDS.gtmId]}
          setEditing={v => setEditing(e => ({ ...e, [FIELDS.gtmId]: v }))}
          placeholder="GTM-XXXXXXX"
        />
        <CodeRow
          label="Meta (Facebook) Pixel"
          settingKey={FIELDS.metaPixelId}
          value={get(FIELDS.metaPixelId)}
          onChange={v => set(FIELDS.metaPixelId, v)}
          editing={editing[FIELDS.metaPixelId]}
          setEditing={v => setEditing(e => ({ ...e, [FIELDS.metaPixelId]: v }))}
          placeholder="1234567890123456"
        />
      </Section>

      <Section
        title="Custom Code Injection"
        description="Raw HTML/JS for tools without a built-in slot. Inserted exactly as written — be careful, this runs on every page."
      >
        <RawCodeRow
          label="Custom <head> code"
          hint="Goes inside <head>. Use for Hotjar, Clarity, LinkedIn Insight Tag, etc."
          settingKey={FIELDS.headCode}
          value={get(FIELDS.headCode)}
          onChange={v => set(FIELDS.headCode, v)}
          editing={editing[FIELDS.headCode]}
          setEditing={v => setEditing(e => ({ ...e, [FIELDS.headCode]: v }))}
        />
        <RawCodeRow
          label="Body — open tag"
          hint="Inserted immediately after <body> opens. Use for chat widgets that require early bootstrap."
          settingKey={FIELDS.bodyOpenCode}
          value={get(FIELDS.bodyOpenCode)}
          onChange={v => set(FIELDS.bodyOpenCode, v)}
          editing={editing[FIELDS.bodyOpenCode]}
          setEditing={v => setEditing(e => ({ ...e, [FIELDS.bodyOpenCode]: v }))}
        />
        <RawCodeRow
          label="Body — close tag"
          hint="Inserted right before </body>. Use for deferred trackers and post-render widgets."
          settingKey={FIELDS.bodyCloseCode}
          value={get(FIELDS.bodyCloseCode)}
          onChange={v => set(FIELDS.bodyCloseCode, v)}
          editing={editing[FIELDS.bodyCloseCode]}
          setEditing={v => setEditing(e => ({ ...e, [FIELDS.bodyCloseCode]: v }))}
        />
      </Section>

      <div className="flex justify-end sticky bottom-4 z-10">
        <button
          onClick={save}
          disabled={saving}
          className="px-6 py-2.5 bg-[var(--ink)] text-white text-sm font-semibold rounded-lg shadow-lg hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save All Tracking Codes'}
        </button>
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-[var(--line)] shadow-sm">
      <div className="px-6 py-5 border-b border-[var(--line)]">
        <h2 className="text-lg font-semibold text-[var(--ink)]">{title}</h2>
        <p className="text-sm text-[var(--muted)] mt-0.5">{description}</p>
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-[var(--ink)]">{label}</p>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          checked ? 'bg-emerald-600' : 'bg-[var(--line)]'
        }`}
        aria-pressed={checked}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600">
        Not configured
      </span>
    );
  }
  if (status === 'Active') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-700">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-700">
      {status}
    </span>
  );
}

function CodeRow({
  label,
  settingKey,
  value,
  onChange,
  editing,
  setEditing,
  placeholder,
  mono,
}: {
  label: string;
  settingKey: string;
  value: string;
  onChange: (v: string) => void;
  editing: boolean | undefined;
  setEditing: (v: boolean) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  const status = formatActiveLabel(settingKey, value);
  const trimmed = value.trim();

  return (
    <div className="border border-[var(--line)] rounded-lg p-4 bg-[var(--paper2)]">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-[var(--ink)]">{label}</p>
            <StatusBadge status={status} />
          </div>
          {HINTS[settingKey] && (
            <p className="text-xs text-[var(--muted)] mt-0.5">{HINTS[settingKey]}</p>
          )}
        </div>
        {trimmed && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs font-medium text-[var(--accent,#1E2A3B)] hover:underline shrink-0"
          >
            Edit
          </button>
        )}
      </div>

      {editing || !trimmed ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className={`flex-1 rounded-lg border border-[var(--line)] px-3 py-2 text-sm focus:ring-2 focus:ring-[#1E2A3B] focus:border-[var(--ink2)] bg-white ${
              mono ? 'font-mono' : ''
            }`}
          />
          {trimmed && editing && (
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-3 py-2 text-xs font-medium text-[var(--muted)] hover:text-[var(--ink)]"
            >
              Done
            </button>
          )}
        </div>
      ) : (
        <code className="block bg-white border border-[var(--line)] rounded px-3 py-2 text-xs font-mono text-[var(--ink2)] break-all">
          {trimmed}
        </code>
      )}
    </div>
  );
}

function RawCodeRow({
  label,
  hint,
  settingKey,
  value,
  onChange,
  editing,
  setEditing,
}: {
  label: string;
  hint: string;
  settingKey: string;
  value: string;
  onChange: (v: string) => void;
  editing: boolean | undefined;
  setEditing: (v: boolean) => void;
}) {
  const trimmed = value.trim();
  const status = trimmed ? 'Active' : null;
  return (
    <div className="border border-[var(--line)] rounded-lg p-4 bg-[var(--paper2)]">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-[var(--ink)]">{label}</p>
            <StatusBadge status={status} />
          </div>
          <p className="text-xs text-[var(--muted)] mt-0.5">{hint}</p>
        </div>
        {trimmed && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs font-medium text-[var(--accent,#1E2A3B)] hover:underline shrink-0"
          >
            Edit
          </button>
        )}
      </div>

      {editing || !trimmed ? (
        <>
          <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            rows={6}
            placeholder="<!-- paste full <script>...</script> or other HTML here -->"
            className="w-full rounded-lg border border-[var(--line)] px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-[#1E2A3B] focus:border-[var(--ink2)] bg-white"
            spellCheck={false}
          />
          {trimmed && editing && (
            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-3 py-1.5 text-xs font-medium text-[var(--muted)] hover:text-[var(--ink)]"
              >
                Done editing
              </button>
            </div>
          )}
        </>
      ) : (
        <pre className="bg-white border border-[var(--line)] rounded px-3 py-2 text-[11px] font-mono text-[var(--ink2)] overflow-auto max-h-48 whitespace-pre-wrap break-all">
          {trimmed}
        </pre>
      )}
    </div>
  );
}
