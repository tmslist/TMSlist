import { useState, useEffect, useCallback } from 'react';

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  enabled: boolean;
  authHeader: string;
  retryPolicy: {
    maxRetries: number;
    retryDelaySec: number;
  };
  createdAt: string;
}

interface DeliveryLog {
  id: string;
  webhookId: string;
  event: string;
  status: 'delivered' | 'failed' | 'retrying' | 'pending';
  statusCode: number | null;
  attemptNumber: number;
  deliveredAt: string | null;
  durationMs: number | null;
  requestPayload: Record<string, unknown>;
  responseBody: string | null;
  errorMessage: string | null;
  createdAt: string;
}

const EVENT_TYPES = [
  { value: 'clinic.created', label: 'Clinic Created' },
  { value: 'clinic.verified', label: 'Clinic Verified' },
  { value: 'clinic.updated', label: 'Clinic Updated' },
  { value: 'lead.created', label: 'Lead Created' },
  { value: 'review.created', label: 'Review Created' },
  { value: 'user.signup', label: 'User Signup' },
  { value: 'subscription.activated', label: 'Subscription Activated' },
  { value: 'subscription.cancelled', label: 'Subscription Cancelled' },
  { value: 'job.created', label: 'Job Created' },
  { value: '*', label: 'All Events' },
];

function StatusBadge({ status }: { status: DeliveryLog['status'] }) {
  const styles: Record<string, string> = {
    delivered: 'bg-emerald-100 text-emerald-700',
    failed: 'bg-red-100 text-red-700',
    retrying: 'bg-amber-100 text-amber-700',
    pending: 'bg-gray-100 text-gray-600',
  };
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] ?? 'bg-gray-100 text-gray-600'}`}>{status}</span>;
}

function PayloadPreview({ payload }: { payload: Record<string, unknown> }) {
  const [expanded, setExpanded] = useState(false);
  const preview = JSON.stringify(payload).slice(0, 120);
  return (
    <div className="bg-slate-900 rounded-lg p-3 text-xs font-mono text-gray-300">
      <button onClick={() => setExpanded(!expanded)} className="text-slate-400 hover:text-white mb-1 text-left">
        {expanded ? '▼ Collapse' : '▶ Expand'}
      </button>
      <pre className={`overflow-hidden ${expanded ? '' : 'max-h-16'}`}>
        {expanded ? JSON.stringify(payload, null, 2) : preview + (preview.length >= 120 ? '...' : '')}
      </pre>
    </div>
  );
}

function WebhookRow({ webhook, onEdit, onToggle }: { webhook: Webhook; onEdit: (w: Webhook) => void; onToggle: (w: Webhook) => void }) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${webhook.enabled ? 'bg-emerald-500' : 'bg-gray-300'}`} />
          <span className="text-sm font-semibold text-gray-900">{webhook.name}</span>
        </div>
      </td>
      <td className="px-6 py-4 font-mono text-xs text-gray-600 max-w-48 truncate">{webhook.url}</td>
      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-1">
          {webhook.events.slice(0, 3).map(e => (
            <span key={e} className="px-2 py-0.5 bg-violet-50 text-violet-700 text-xs rounded font-mono">{e}</span>
          ))}
          {webhook.events.length > 3 && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">+{webhook.events.length - 3}</span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">
        Retry {webhook.retryPolicy.maxRetries}x / {webhook.retryPolicy.retryDelaySec}s
      </td>
      <td className="px-6 py-4">
        <button
          onClick={() => onToggle(webhook)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            webhook.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {webhook.enabled ? 'Active' : 'Disabled'}
        </button>
      </td>
      <td className="px-6 py-4 flex gap-2">
        <button onClick={() => onEdit(webhook)} className="text-xs font-medium text-violet-600 hover:text-violet-700">Edit</button>
        <button onClick={() => onToggle(webhook)} className="text-xs font-medium text-gray-600 hover:text-gray-700">
          {webhook.enabled ? 'Pause' : 'Resume'}
        </button>
      </td>
    </tr>
  );
}

function DeliveryLogRow({ log }: { log: DeliveryLog }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <StatusBadge status={log.status} />
      </td>
      <td className="px-6 py-4 text-xs font-mono text-gray-600">{log.event}</td>
      <td className="px-6 py-4 text-xs text-gray-600">
        {log.deliveredAt ? new Date(log.deliveredAt).toLocaleString() : new Date(log.createdAt).toLocaleString()}
      </td>
      <td className="px-6 py-4 text-xs text-gray-600 font-mono">
        {log.statusCode ? `${log.statusCode}` : '-'}
      </td>
      <td className="px-6 py-4 text-xs text-gray-600 font-mono">
        {log.durationMs ? `${log.durationMs}ms` : '-'}
      </td>
      <td className="px-6 py-4 text-xs text-gray-400">
        Attempt {log.attemptNumber}
        {log.retryPolicy && <span className="ml-1">/ {log.retryPolicy.maxRetries}</span>}
      </td>
      <td className="px-6 py-4">
        <button onClick={() => setExpanded(!expanded)} className="text-xs text-violet-600 hover:text-violet-700">
          {expanded ? 'Hide' : 'Details'}
        </button>
      </td>
    </tr>
  );
}

function WebhookEditor({
  webhook,
  onSave,
  onCancel,
}: {
  webhook: Webhook | null;
  onSave: (w: Webhook) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(webhook?.name ?? '');
  const [url, setUrl] = useState(webhook?.url ?? '');
  const [events, setEvents] = useState<string[]>(webhook?.events ?? []);
  const [authHeader, setAuthHeader] = useState(webhook?.authHeader ?? '');
  const [maxRetries, setMaxRetries] = useState(webhook?.retryPolicy?.maxRetries ?? 3);
  const [retryDelaySec, setRetryDelaySec] = useState(webhook?.retryPolicy?.retryDelaySec ?? 60);
  const [saving, setSaving] = useState(false);

  const toggleEvent = (event: string) => {
    setEvents(prev =>
      prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    onSave({
      id: webhook?.id ?? crypto.randomUUID(),
      name,
      url,
      events,
      secret: webhook?.secret ?? crypto.randomUUID(),
      enabled: webhook?.enabled ?? true,
      authHeader,
      retryPolicy: { maxRetries, retryDelaySec },
      createdAt: webhook?.createdAt ?? new Date().toISOString(),
    });
    setSaving(false);
  };

  return (
    <div className="bg-white rounded-xl border border-violet-200 p-6 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900 mb-6">
        {webhook ? 'Edit Webhook' : 'New Webhook Endpoint'}
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="My Webhook"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint URL</label>
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://myapp.com/webhooks/tmslist"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 font-mono"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Event Subscriptions</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {EVENT_TYPES.map(e => (
              <label key={e.value} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={events.includes(e.value)}
                  onChange={() => toggleEvent(e.value)}
                  className="w-4 h-4 rounded border-gray-300 text-violet-600"
                />
                <span className="text-gray-700 text-xs">{e.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Auth Header (optional)</label>
          <input
            type="text"
            value={authHeader}
            onChange={e => setAuthHeader(e.target.value)}
            placeholder="Authorization: Bearer YOUR_TOKEN"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 font-mono text-xs"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Retries</label>
            <input
              type="number"
              min={0}
              max={10}
              value={maxRetries}
              onChange={e => setMaxRetries(parseInt(e.target.value) || 0)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Retry Delay (seconds)</label>
            <input
              type="number"
              min={10}
              value={retryDelaySec}
              onChange={e => setRetryDelaySec(parseInt(e.target.value) || 60)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            />
          </div>
        </div>
      </div>
      <div className="flex gap-3 mt-6">
        <button
          onClick={handleSave}
          disabled={saving || !name || !url || events.length === 0}
          className="px-5 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Webhook'}
        </button>
        <button onClick={onCancel} className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function AdminWebhookManager() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [deliveryLogs, setDeliveryLogs] = useState<DeliveryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Webhook | null>(null);
  const [activeTab, setActiveTab] = useState<'endpoints' | 'deliveries'>('endpoints');
  const [selectedLog, setSelectedLog] = useState<DeliveryLog | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [whRes, dlRes] = await Promise.all([
        fetch('/api/admin/webhooks'),
        fetch('/api/admin/webhooks/delivery-logs'),
      ]);
      if (whRes.ok) { const d = await whRes.json(); setWebhooks(d.webhooks ?? []); }
      if (dlRes.ok) { const d = await dlRes.json(); setDeliveryLogs(d.logs ?? []); }
    } catch (err) {
      console.error('Failed to load webhook data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const toggleWebhook = async (webhook: Webhook) => {
    const updated = { ...webhook, enabled: !webhook.enabled };
    setWebhooks(prev => prev.map(w => w.id === webhook.id ? updated : w));
    try {
      await fetch(`/api/admin/webhooks/${webhook.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: updated.enabled }),
      });
      showToast(`Webhook ${updated.enabled ? 'resumed' : 'paused'}`);
    } catch {
      setWebhooks(prev => prev.map(w => w.id === webhook.id ? webhook : w));
    }
  };

  const saveWebhook = async (webhook: Webhook) => {
    try {
      const res = await fetch('/api/admin/webhooks', {
        method: webhook.id && webhooks.find(w => w.id === webhook.id) ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhook),
      });
      if (res.ok) {
        const d = await res.json();
        setWebhooks(prev => {
          const exists = prev.find(w => w.id === webhook.id);
          if (exists) return prev.map(w => w.id === webhook.id ? d.webhook ?? webhook : w);
          return [...prev, webhook];
        });
        showToast('Webhook saved');
        setEditing(null);
      }
    } catch {
      showToast('Failed to save webhook');
    }
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

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Webhook Manager</h1>
          <p className="text-gray-500 mt-1">Manage webhook endpoints, event subscriptions, and delivery logs</p>
        </div>
        <button
          onClick={() => setEditing({ id: '', name: '', url: '', events: [], secret: '', enabled: true, authHeader: '', retryPolicy: { maxRetries: 3, retryDelaySec: 60 }, createdAt: '' })}
          className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors"
        >
          + New Webhook
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {(['endpoints', 'deliveries'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'endpoints' ? 'Endpoints' : 'Delivery Logs'}
          </button>
        ))}
      </div>

      {activeTab === 'endpoints' ? (
        <div>
          {editing && (
            <div className="mb-6">
              <WebhookEditor webhook={editing} onSave={saveWebhook} onCancel={() => setEditing(null)} />
            </div>
          )}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">URL</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Events</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Retry Policy</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {webhooks.map(w => (
                  <WebhookRow key={w.id} webhook={w} onEdit={setEditing} onToggle={toggleWebhook} />
                ))}
                {webhooks.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 text-sm">
                      No webhooks yet. Create one above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivered At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attempts</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {deliveryLogs.map(log => (
                <>
                  <DeliveryLogRow key={log.id} log={log} />
                  {selectedLog?.id === log.id && (
                    <tr key={`${log.id}-details`}>
                      <td colSpan={7} className="px-6 py-4 bg-slate-50">
                        <PayloadPreview payload={log.requestPayload} />
                        {log.errorMessage && (
                          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-xs font-medium text-red-700">Error:</p>
                            <p className="text-xs text-red-600 font-mono mt-1">{log.errorMessage}</p>
                          </div>
                        )}
                        {log.responseBody && (
                          <div className="mt-2 p-3 bg-white border border-gray-200 rounded-lg">
                            <p className="text-xs font-medium text-gray-500 mb-1">Response:</p>
                            <pre className="text-xs font-mono text-gray-600 max-h-32 overflow-auto">{log.responseBody}</pre>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {deliveryLogs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 text-sm">
                    No delivery logs yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
