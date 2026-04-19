import { useState, useEffect, useCallback } from 'react';

interface ZapierTrigger {
  id: string;
  name: string;
  description: string;
  event: string;
  samplePayload: Record<string, unknown>;
}

interface ZapierAction {
  id: string;
  name: string;
  description: string;
  configFields: { name: string; label: string; required: boolean }[];
}

interface ZapierConfig {
  apiKey: string;
  webhookUrl: string;
  enabled: boolean;
  connectedAt: string | null;
}

const ZAPIER_TRIGGERS: ZapierTrigger[] = [
  {
    id: 'new-clinic',
    name: 'New Clinic Added',
    description: 'Fires when a new clinic is submitted or created',
    event: 'clinic.created',
    samplePayload: {
      id: 'clinic_abc123',
      name: 'NeuroWell TMS Center',
      city: 'Los Angeles',
      state: 'CA',
      providerType: 'tms_center',
      verified: false,
    },
  },
  {
    id: 'clinic-verified',
    name: 'Clinic Verified',
    description: 'Fires when an admin verifies a clinic',
    event: 'clinic.verified',
    samplePayload: {
      id: 'clinic_abc123',
      name: 'NeuroWell TMS Center',
      city: 'Los Angeles',
      state: 'CA',
      verifiedAt: '2024-03-15T10:30:00Z',
    },
  },
  {
    id: 'new-lead',
    name: 'New Lead Created',
    description: 'Fires when a visitor submits a lead form',
    event: 'lead.created',
    samplePayload: {
      id: 'lead_xyz789',
      type: 'appointment_request',
      name: 'Jane Smith',
      email: 'jane@example.com',
      clinicId: 'clinic_abc123',
      message: 'Interested in TMS therapy for depression.',
    },
  },
  {
    id: 'new-review',
    name: 'New Review Submitted',
    description: 'Fires when a patient submits a clinic review',
    event: 'review.created',
    samplePayload: {
      id: 'review_xyz123',
      clinicId: 'clinic_abc123',
      rating: 5,
      title: 'Life-changing treatment',
      body: 'The staff were incredibly supportive...',
    },
  },
  {
    id: 'new-subscription',
    name: 'Subscription Activated',
    description: 'Fires when a clinic subscribes to a paid plan',
    event: 'subscription.activated',
    samplePayload: {
      id: 'sub_xyz123',
      clinicId: 'clinic_abc123',
      plan: 'pro',
      status: 'active',
    },
  },
  {
    id: 'user-signup',
    name: 'New User Signup',
    description: 'Fires when a new user registers on the platform',
    event: 'user.signup',
    samplePayload: {
      id: 'user_xyz123',
      email: 'newuser@example.com',
      role: 'patient',
      createdAt: '2024-03-15T10:30:00Z',
    },
  },
];

const ZAPIER_ACTIONS: ZapierAction[] = [
  {
    id: 'create-lead',
    name: 'Create Lead',
    description: 'Programmatically create a lead in TMSList',
    configFields: [
      { name: 'type', label: 'Lead Type', required: true },
      { name: 'name', label: 'Name', required: true },
      { name: 'email', label: 'Email', required: true },
      { name: 'clinic_id', label: 'Clinic ID', required: false },
    ],
  },
  {
    id: 'update-clinic',
    name: 'Update Clinic',
    description: 'Update clinic information from external data',
    configFields: [
      { name: 'clinic_id', label: 'Clinic ID', required: true },
      { name: 'field', label: 'Field to Update', required: true },
      { name: 'value', label: 'New Value', required: true },
    ],
  },
  {
    id: 'send-notification',
    name: 'Send Admin Notification',
    description: 'Trigger an admin notification from a Zap',
    configFields: [
      { name: 'title', label: 'Title', required: true },
      { name: 'message', label: 'Message', required: true },
      { name: 'priority', label: 'Priority (low/normal/high)', required: false },
    ],
  },
  {
    id: 'tag-entity',
    name: 'Tag Entity',
    description: 'Add a tag to a clinic, doctor, or user',
    configFields: [
      { name: 'entity_type', label: 'Entity Type (clinic/doctor/user)', required: true },
      { name: 'entity_id', label: 'Entity ID', required: true },
      { name: 'tag', label: 'Tag', required: true },
    ],
  },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function TriggerCard({ trigger }: { trigger: ZapierTrigger }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-gray-900">{trigger.name}</h4>
          <p className="text-xs text-gray-500 mt-0.5">{trigger.description}</p>
          <span className="inline-block mt-1 px-2 py-0.5 bg-violet-50 text-violet-700 text-xs rounded font-mono">
            {trigger.event}
          </span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-3 px-2 py-1 text-xs text-gray-400 hover:text-gray-600"
        >
          {expanded ? 'Hide' : 'Payload'}
        </button>
      </div>
      {expanded && (
        <div className="mt-3 bg-slate-900 rounded-lg p-3">
          <pre className="text-xs font-mono text-gray-300 overflow-auto max-h-48">
            {JSON.stringify(trigger.samplePayload, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function ActionCard({ action }: { action: ZapierAction }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <h4 className="text-sm font-semibold text-gray-900">{action.name}</h4>
      <p className="text-xs text-gray-500 mt-0.5 mb-3">{action.description}</p>
      <div className="space-y-1">
        {action.configFields.map(f => (
          <div key={f.name} className="flex items-center gap-1">
            <span className="text-xs text-gray-600 font-mono">
              {f.label}
              {f.required && <span className="text-red-500 ml-0.5">*</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminZapierIntegration() {
  const [config, setConfig] = useState<ZapierConfig | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const webhookUrl = `https://tmslist.com/api/zapier/webhook`;

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/zapier');
      if (res.ok) {
        const d = await res.json();
        setConfig(d.config ?? { apiKey: '', webhookUrl: '', enabled: false, connectedAt: null });
        setApiKey(d.config?.apiKey ?? '');
      }
    } catch (err) {
      console.error('Failed to load Zapier config:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/zapier', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, apiKey }),
      });
      if (res.ok) {
        const d = await res.json();
        setConfig(d.config ?? { ...config!, apiKey, connectedAt: new Date().toISOString() });
        showToast('Zapier configuration saved');
      }
    } catch {
      showToast('Failed to save configuration');
    }
    setSaving(false);
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/zapier/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });
      const data = await res.json();
      setTestResult(data.success ? 'Connection successful! Zapier can reach TMSList.' : `Error: ${data.error}`);
    } catch {
      setTestResult('Connection test failed.');
    }
    setTesting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-lg shadow-lg text-sm animate-in fade-in">
          {toast}
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Zapier Integration</h1>
        <p className="text-gray-500 mt-1">Connect TMSList to 5,000+ apps via Zapier</p>
      </div>

      {/* Zapier App Info */}
      <Section title="Zapier App Information">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
            <span className="text-emerald-700 font-bold text-xl">Z</span>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">TMSList on Zapier</h3>
            <p className="text-sm text-gray-500 mt-1">
              Connect TMSList to 5,000+ apps without writing code. Use our triggers to start workflows
              and our actions to push data back into TMSList.
            </p>
            <a
              href="https://zapier.com/apps/tmslist"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Open on Zapier
            </a>
          </div>
        </div>
      </Section>

      {/* API Key & Webhook URL */}
      <Section title="API Configuration">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zapier API Key</label>
            <div className="flex gap-2">
              <input
                type={revealed ? 'text' : 'password'}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="zapier_api_key_..."
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 font-mono text-xs"
              />
              <button
                onClick={() => setRevealed(!revealed)}
                className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {revealed ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Find your API key in your Zapier account settings under "My Integration"
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL (incoming)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={webhookUrl}
                readOnly
                className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-mono text-xs text-gray-500"
              />
              <button
                onClick={() => navigator.clipboard.writeText(webhookUrl)}
                className="px-3 py-2 text-sm text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Use this URL as the webhook URL in your Zapier action steps
            </p>
          </div>

          {testResult && (
            <div className={`p-3 rounded-lg text-sm ${testResult.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
              {testResult}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={saveConfig}
              disabled={saving}
              className="px-5 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
            <button
              onClick={testConnection}
              disabled={testing}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
          </div>
        </div>
      </Section>

      {/* Available Triggers */}
      <Section title="Available Triggers">
        <p className="text-sm text-gray-500 mb-4">
          These events in TMSList can start a Zapier workflow:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ZAPIER_TRIGGERS.map(t => <TriggerCard key={t.id} trigger={t} />)}
        </div>
      </Section>

      {/* Available Actions */}
      <Section title="Available Actions">
        <p className="text-sm text-gray-500 mb-4">
          These actions can be performed in TMSList from a Zap:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ZAPIER_ACTIONS.map(a => <ActionCard key={a.id} action={a} />)}
        </div>
      </Section>

      {/* API Endpoint Reference */}
      <Section title="API Endpoint Reference">
        <div className="space-y-2">
          {[
            { method: 'GET', endpoint: '/api/zapier/triggers', desc: 'List available triggers' },
            { method: 'POST', endpoint: '/api/zapier/triggers/:id', desc: 'Get trigger samples' },
            { method: 'POST', endpoint: '/api/zapier/actions/:id', desc: 'Perform an action' },
            { method: 'POST', endpoint: '/api/zapier/webhook', desc: 'Incoming webhook from Zapier' },
          ].map(api => (
            <div key={api.endpoint} className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3">
              <span className={`px-2 py-1 rounded text-xs font-bold ${
                api.method === 'GET' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {api.method}
              </span>
              <span className="text-sm font-mono text-gray-800">{api.endpoint}</span>
              <span className="text-xs text-gray-500 ml-auto">{api.desc}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
