import { useState, useEffect } from 'react';
import { PortalCard, PortalButton, LoadingScreen, ErrorScreen } from './PortalUI';

interface PrefDefaults {
  new_lead: { email: boolean; in_app: boolean };
  new_review: { email: boolean; in_app: boolean };
  job_application: { email: boolean; in_app: boolean };
  billing_reminder: { email: boolean; in_app: boolean };
  system_announcement: { email: boolean; in_app: boolean };
}

const NOTIFICATION_TYPES = [
  {
    key: 'new_lead',
    label: 'New Lead Received',
    description: 'When a new patient enquiry or lead is submitted for your clinic',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    key: 'new_review',
    label: 'New Review Posted',
    description: 'When a patient submits a review for your clinic',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
  {
    key: 'job_application',
    label: 'Job Application Received',
    description: 'When someone applies to a job posting at your clinic',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3.875a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
      </svg>
    ),
  },
  {
    key: 'billing_reminder',
    label: 'Billing Reminder',
    description: 'Payment and subscription reminders',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    ),
  },
  {
    key: 'system_announcement',
    label: 'System Announcement',
    description: 'Platform updates, maintenance notices, and important announcements',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
      </svg>
    ),
  },
];

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-emerald-600' : 'bg-[var(--line)]'}`}
      title={label}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

function NotificationPrefsContent() {
  const [emailPrefs, setEmailPrefs] = useState<Record<string, boolean>>({});
  const [inAppPrefs, setInAppPrefs] = useState<Record<string, boolean>>({});
  const [defaults, setDefaults] = useState<PrefDefaults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/portal/notification-prefs')
      .then(async r => {
        if (!r.ok) throw new Error('Failed to load preferences');
        const d = await r.json();
        setEmailPrefs(d.email ?? {});
        setInAppPrefs(d.in_app ?? {});
        setDefaults(d.defaults ?? null);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  async function updatePref(key: string, channel: 'email' | 'in_app', enabled: boolean) {
    if (channel === 'email') setEmailPrefs(p => ({ ...p, [key]: enabled }));
    else setInAppPrefs(p => ({ ...p, [key]: enabled }));

    setSaving(`${key}:${channel}`);
    try {
      const res = await fetch('/api/portal/notification-prefs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferenceKey: key, channel, enabled }),
      });
      if (!res.ok) throw new Error('Save failed');
      setSaved(`${key}:${channel}`);
      setTimeout(() => setSaved(null), 2000);
    } catch {
      // revert
      if (channel === 'email') setEmailPrefs(p => ({ ...p, [key]: !enabled }));
      else setInAppPrefs(p => ({ ...p, [key]: !enabled }));
    } finally {
      setSaving(null);
    }
  }

  function getPref(key: string, channel: 'email' | 'in_app', defaults: PrefDefaults | null): boolean {
    const stored = channel === 'email' ? emailPrefs[key] : inAppPrefs[key];
    if (stored !== undefined) return stored;
    return defaults?.[key as keyof PrefDefaults]?.[channel] ?? false;
  }

  if (loading) return <LoadingScreen message="Loading preferences..." />;
  if (error) return <ErrorScreen message={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-[var(--line)] overflow-hidden">
        <div className="grid grid-cols-3 gap-4 px-5 py-3 border-b border-[var(--line)] bg-[var(--paper2)]">
          <div className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider col-span-2">Notification Type</div>
          <div className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider text-center">Email</div>
          <div />
          <div className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider text-center">In-App</div>
          <div />
        </div>

        {NOTIFICATION_TYPES.map(nt => {
          const emailEnabled = getPref(nt.key, 'email', defaults);
          const inAppEnabled = getPref(nt.key, 'in_app', defaults);
          const emailSaving = saving === `${nt.key}:email`;
          const inAppSaving = saving === `${nt.key}:in_app`;
          const emailSaved = saved === `${nt.key}:email`;
          const inAppSaved = saved === `${nt.key}:in_app`;

          return (
            <div key={nt.key} className="grid grid-cols-3 gap-4 px-5 py-4 border-b border-[var(--line)] last:border-0 items-center hover:bg-[var(--paper2)] transition-colors">
              <div className="col-span-2 flex items-center gap-3">
                <div className="w-8 h-8 bg-[var(--paper2)] rounded-lg flex items-center justify-center text-[var(--muted)] shrink-0">
                  {nt.icon}
                </div>
                <div>
                  <div className="text-sm font-medium text-[var(--ink)]">{nt.label}</div>
                  <div className="text-xs text-[var(--muted)] mt-0.5">{nt.description}</div>
                </div>
              </div>
              <div className="flex justify-center">
                <button
                  onClick={() => updatePref(nt.key, 'email', !emailEnabled)}
                  disabled={emailSaving}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${emailEnabled ? 'bg-emerald-600' : 'bg-[var(--line)]'} disabled:opacity-50`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${emailEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="flex justify-center">
                <button
                  onClick={() => updatePref(nt.key, 'in_app', !inAppEnabled)}
                  disabled={inAppSaving}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${inAppEnabled ? 'bg-emerald-600' : 'bg-[var(--line)]'} disabled:opacity-50`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${inAppEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-[var(--muted)] text-center">
        Changes are saved automatically. Use test notification to verify your settings.
      </p>
    </div>
  );
}

export default function PortalNotificationPrefs() {
  return <NotificationPrefsContent />;
}