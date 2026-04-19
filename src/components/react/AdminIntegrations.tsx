import { useState, useEffect, useCallback } from 'react';

interface Integration {
  id: string;
  name: string;
  provider: string;
  description: string;
  logoUrl: string;
  status: 'connected' | 'disconnected' | 'error';
  connectedAt: string | null;
  lastSyncAt: string | null;
  apiKeyConfigured: boolean;
  features: string[];
  config: Record<string, unknown>;
}

interface SyncLog {
  id: string;
  integrationId: string;
  direction: 'import' | 'export';
  entityType: string;
  recordsCount: number;
  status: 'success' | 'failed' | 'partial';
  startedAt: string;
  completedAt: string | null;
  errorMessage: string | null;
}

const AVAILABLE_INTEGRATIONS: Omit<Integration, 'status' | 'connectedAt' | 'lastSyncAt' | 'config'>[] = [
  {
    id: 'salesforce',
    name: 'Salesforce',
    provider: 'salesforce.com',
    description: 'Sync clinic and lead data with your Salesforce CRM',
    logoUrl: '',
    apiKeyConfigured: false,
    features: ['CRM sync', 'Lead routing', 'Contact management'],
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    provider: 'hubspot.com',
    description: 'Bi-directional sync with HubSpot CRM and marketing',
    logoUrl: '',
    apiKeyConfigured: false,
    features: ['CRM sync', 'Email campaigns', 'Form integration'],
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    provider: 'mailchimp.com',
    description: 'Sync newsletter subscribers and campaign data',
    logoUrl: '',
    apiKeyConfigured: false,
    features: ['Email newsletters', 'Subscriber sync', 'Campaign analytics'],
  },
  {
    id: 'zapier',
    name: 'Zapier',
    provider: 'zapier.com',
    description: 'Connect to 5,000+ apps via Zapier workflows',
    logoUrl: '',
    apiKeyConfigured: false,
    features: ['5,000+ app integrations', 'Workflow automation', 'No-code'],
  },
  {
    id: 'stripe',
    name: 'Stripe',
    provider: 'stripe.com',
    description: 'Payment and subscription data sync',
    logoUrl: '',
    apiKeyConfigured: false,
    features: ['Subscription billing', 'Payment events', 'Customer data'],
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    provider: 'quickbooks.intuit.com',
    description: 'Sync billing and invoice data with QuickBooks Online',
    logoUrl: '',
    apiKeyConfigured: false,
    features: ['Invoice sync', 'Revenue reports', 'Accounting'],
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    provider: 'sendgrid.com',
    description: 'Transactional and marketing email delivery',
    logoUrl: '',
    apiKeyConfigured: false,
    features: ['Transactional email', 'Email templates', 'Bounce handling'],
  },
  {
    id: 'twilio',
    name: 'Twilio',
    provider: 'twilio.com',
    description: 'SMS notifications and appointment reminders',
    logoUrl: '',
    apiKeyConfigured: false,
    features: ['SMS notifications', 'Appointment reminders', 'WhatsApp messaging'],
  },
  {
    id: 'slack',
    name: 'Slack',
    provider: 'slack.com',
    description: 'Send notifications and alerts to Slack channels',
    logoUrl: '',
    apiKeyConfigured: false,
    features: ['Team notifications', 'Lead alerts', 'Daily digests'],
  },
];

const INTEGRATION_COLORS: Record<string, string> = {
  salesforce: 'bg-blue-100 text-blue-700',
  hubspot: 'bg-orange-100 text-orange-700',
  mailchimp: 'bg-amber-100 text-amber-700',
  zapier: 'bg-emerald-100 text-emerald-700',
  stripe: 'bg-purple-100 text-purple-700',
  quickbooks: 'bg-green-100 text-green-700',
  sendgrid: 'bg-teal-100 text-teal-700',
  twilio: 'bg-red-100 text-red-700',
  slack: 'bg-pink-100 text-pink-700',
};

const INTEGRATION_LOGOS: Record<string, string> = {
  salesforce: 'SF',
  hubspot: 'HS',
  mailchimp: 'MC',
  zapier: 'Zp',
  stripe: 'St',
  quickbooks: 'QB',
  sendgrid: 'SG',
  twilio: 'Tw',
  slack: 'Sl',
};

function IntegrationCard({ integration, onConfigure }: { integration: Integration; onConfigure: (i: Integration) => void }) {
  const colorClass = INTEGRATION_COLORS[integration.id] ?? 'bg-gray-100 text-gray-700';
  const initials = INTEGRATION_LOGOS[integration.id] ?? integration.name.slice(0, 2).toUpperCase();

  return (
    <div className="border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${colorClass}`}>
            {initials}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{integration.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{integration.provider}</p>
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          integration.status === 'connected' ? 'bg-emerald-100 text-emerald-700' :
          integration.status === 'error' ? 'bg-red-100 text-red-700' :
          'bg-gray-100 text-gray-500'
        }`}>
          {integration.status === 'connected' ? 'Connected' : integration.status === 'error' ? 'Error' : 'Disconnected'}
        </span>
      </div>

      <p className="text-xs text-gray-500 mb-3">{integration.description}</p>

      <div className="flex flex-wrap gap-1 mb-3">
        {integration.features.slice(0, 2).map(f => (
          <span key={f} className="px-2 py-0.5 bg-gray-50 text-gray-600 text-xs rounded">{f}</span>
        ))}
        {integration.features.length > 2 && (
          <span className="px-2 py-0.5 bg-gray-50 text-gray-600 text-xs rounded">+{integration.features.length - 2}</span>
        )}
      </div>

      {integration.connectedAt && (
        <p className="text-xs text-gray-400 mb-3">
          Connected {new Date(integration.connectedAt).toLocaleDateString()}
          {integration.lastSyncAt && ` · Synced ${new Date(integration.lastSyncAt).toLocaleDateString()}`}
        </p>
      )}

      <button
        onClick={() => onConfigure(integration)}
        className={`w-full px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
          integration.status === 'connected'
            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            : 'bg-violet-50 text-violet-700 hover:bg-violet-100'
        }`}
      >
        {integration.status === 'connected' ? 'Configure' : integration.status === 'error' ? 'Reconnect' : 'Connect'}
      </button>
    </div>
  );
}

function ApiKeyField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex gap-2">
        <input
          type={revealed ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={`Enter ${label}`}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 font-mono text-xs"
        />
        <button
          onClick={() => setRevealed(!revealed)}
          className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {revealed ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  );
}

function IntegrationConfigPanel({
  integration,
  onSave,
  onDisconnect,
  onCancel,
}: {
  integration: Integration;
  onSave: (i: Integration) => void;
  onDisconnect: (i: Integration) => void;
  onCancel: () => void;
}) {
  const [apiKey, setApiKey] = useState(String(integration.config?.apiKey ?? ''));
  const [apiSecret, setApiSecret] = useState(String(integration.config?.apiSecret ?? ''));
  const [webhookUrl, setWebhookUrl] = useState(String(integration.config?.webhookUrl ?? ''));
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const needsApiKey = !['slack'].includes(integration.id);
  const needsWebhook = ['stripe', 'twilio'].includes(integration.id);

  const handleSave = async () => {
    setSaving(true);
    onSave({
      ...integration,
      config: { ...integration.config, apiKey, apiSecret, webhookUrl },
    });
    setSaving(false);
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`/api/admin/integrations/${integration.id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, apiSecret, webhookUrl }),
      });
      const data = await res.json();
      setTestResult(data.success ? 'Connection successful!' : `Error: ${data.error}`);
    } catch {
      setTestResult('Connection test failed. Check your credentials.');
    }
    setTesting(false);
  };

  return (
    <div className="bg-white rounded-xl border border-violet-200 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${INTEGRATION_COLORS[integration.id] ?? 'bg-gray-100'}`}>
          {INTEGRATION_LOGOS[integration.id] ?? integration.name.slice(0, 2)}
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900">{integration.name} Configuration</h3>
          <p className="text-xs text-gray-500">{integration.description}</p>
        </div>
      </div>

      <div className="space-y-4">
        {needsApiKey && (
          <>
            <ApiKeyField label="API Key" value={apiKey} onChange={setApiKey} />
            {['salesforce', 'hubspot', 'quickbooks'].includes(integration.id) && (
              <ApiKeyField label="API Secret" value={apiSecret} onChange={setApiSecret} />
            )}
          </>
        )}

        {integration.id === 'slack' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slack Webhook URL</label>
            <input
              type="url"
              value={webhookUrl}
              onChange={e => setWebhookUrl(e.target.value)}
              placeholder="https://hooks.slack.com/services/..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 font-mono text-xs"
            />
            <p className="text-xs text-gray-400 mt-1">
              Get your incoming webhook URL from Slack Apps → Incoming Webhooks
            </p>
          </div>
        )}

        {needsWebhook && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL (from TMSList)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={`https://tmslist.com/api/webhooks/${integration.id}`}
                readOnly
                className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-mono text-xs text-gray-500"
              />
              <button
                onClick={() => navigator.clipboard.writeText(`https://tmslist.com/api/webhooks/${integration.id}`)}
                className="px-3 py-2 text-sm text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
        )}

        {testResult && (
          <div className={`p-3 rounded-lg text-sm ${
            testResult.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
          }`}>
            {testResult}
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={handleSave}
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
        {integration.status === 'connected' && (
          <button
            onClick={() => onDisconnect(integration)}
            className="px-5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors ml-auto"
          >
            Disconnect
          </button>
        )}
        <button onClick={onCancel} className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function AdminIntegrations() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [configuring, setConfiguring] = useState<Integration | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'connected' | 'available'>('all');
  const [toast, setToast] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [iRes, sRes] = await Promise.all([
        fetch('/api/admin/integrations'),
        fetch('/api/admin/integrations/sync-logs'),
      ]);
      if (iRes.ok) {
        const d = await iRes.json();
        setIntegrations(d.integrations ?? []);
      }
      if (sRes.ok) {
        const d = await sRes.json();
        setSyncLogs(d.logs ?? []);
      }
    } catch (err) {
      console.error('Failed to load integrations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const saveConfig = async (integration: Integration) => {
    try {
      const res = await fetch(`/api/admin/integrations/${integration.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(integration),
      });
      if (res.ok) {
        const d = await res.json();
        setIntegrations(prev => {
          const exists = prev.find(i => i.id === integration.id);
          if (exists) return prev.map(i => i.id === integration.id ? d.integration ?? { ...integration, status: 'connected', connectedAt: new Date().toISOString() } : i);
          return [...prev, { ...integration, status: 'connected', connectedAt: new Date().toISOString() }];
        });
        showToast(`${integration.name} configuration saved`);
        setConfiguring(null);
      }
    } catch {
      showToast('Failed to save configuration');
    }
  };

  const disconnectIntegration = async (integration: Integration) => {
    try {
      await fetch(`/api/admin/integrations/${integration.id}`, { method: 'DELETE' });
      setIntegrations(prev => prev.map(i => i.id === integration.id ? { ...i, status: 'disconnected', connectedAt: null, lastSyncAt: null } : i));
      showToast(`${integration.name} disconnected`);
      setConfiguring(null);
    } catch {
      showToast('Failed to disconnect');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  const filtered = integrations.filter(i => {
    if (activeTab === 'connected') return i.status === 'connected';
    if (activeTab === 'available') return i.status !== 'connected';
    return true;
  });

  return (
    <div>
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-lg shadow-lg text-sm animate-in fade-in">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Integrations</h1>
          <p className="text-gray-500 mt-1">Third-party integrations and API connections</p>
        </div>
        <div className="flex gap-2">
          {integrations.filter(i => i.status === 'connected').length > 0 && (
            <span className="px-3 py-2 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-lg">
              {integrations.filter(i => i.status === 'connected').length} Connected
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {(['all', 'connected', 'available'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'all' ? 'All' : tab === 'connected' ? 'Connected' : 'Available'}
          </button>
        ))}
      </div>

      {configuring && (
        <div className="mb-6">
          <IntegrationConfigPanel
            integration={configuring}
            onSave={saveConfig}
            onDisconnect={disconnectIntegration}
            onCancel={() => setConfiguring(null)}
          />
        </div>
      )}

      {activeTab !== 'connected' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {filtered.length > 0 ? filtered.map(i => (
            <IntegrationCard key={i.id} integration={i} onConfigure={setConfiguring} />
          )) : (
            <p className="col-span-3 text-sm text-gray-500 text-center py-8">No integrations found.</p>
          )}
        </div>
      )}

      {activeTab === 'connected' && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg font-medium">No connected integrations</p>
          <p className="text-sm mt-1">Browse available integrations to get started.</p>
        </div>
      )}

      {syncLogs.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 mt-8">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Recent Sync Activity</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {syncLogs.slice(0, 10).map(log => (
              <div key={log.id} className="px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    log.direction === 'import' ? 'bg-blue-50 text-blue-700' : 'bg-violet-50 text-violet-700'
                  }`}>
                    {log.direction}
                  </span>
                  <span className="text-sm text-gray-700">{log.entityType}</span>
                  <span className="text-xs text-gray-400">{log.recordsCount} records</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    log.status === 'success' ? 'bg-emerald-100 text-emerald-700' :
                    log.status === 'failed' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {log.status}
                  </span>
                  <span className="text-xs text-gray-400">
                    {log.completedAt ? new Date(log.completedAt).toLocaleString() : new Date(log.startedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
