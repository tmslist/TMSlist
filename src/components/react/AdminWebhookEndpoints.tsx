import { useState, useCallback, useMemo } from 'react';

interface WebhookLog {
  id: string;
  endpoint: string;
  event: string;
  status: 'delivered' | 'failed' | 'pending' | 'retrying';
  httpStatus: number | null;
  attemptCount: number;
  payload: Record<string, unknown>;
  response: string | null;
  createdAt: string;
  deliveredAt: string | null;
  errorMessage: string | null;
  signatureValid: boolean;
}

const EVENT_TYPES = [
  'clinic.created', 'clinic.updated', 'clinic.deleted',
  'review.created', 'review.moderated',
  'lead.created', 'lead.assigned',
  'user.registered', 'user.updated',
  'appointment.booked', 'appointment.cancelled',
];

export default function AdminWebhookEndpoints() {
  const [logs, setLogs] = useState<WebhookLog[]>([
    {
      id: 'wh_1a2b3c',
      endpoint: 'https://neurocare.io/webhooks/tms',
      event: 'lead.created',
      status: 'delivered',
      httpStatus: 200,
      attemptCount: 1,
      payload: {
        event: 'lead.created',
        timestamp: '2026-04-18T14:23:11Z',
        data: {
          id: 'lead_xyz789',
          clinic_id: 'clinic_abc123',
          name: 'John Smith',
          email: 'john@example.com',
          phone: '+1-555-0123',
          insurance: 'Aetna',
        },
      },
      response: '{"status":"ok","received":true}',
      createdAt: '2026-04-18T14:23:11Z',
      deliveredAt: '2026-04-18T14:23:12Z',
      errorMessage: null,
      signatureValid: true,
    },
    {
      id: 'wh_4d5e6f',
      endpoint: 'https://medconnect.com/webhooks/tmslist',
      event: 'clinic.updated',
      status: 'failed',
      httpStatus: 500,
      attemptCount: 3,
      payload: {
        event: 'clinic.updated',
        timestamp: '2026-04-18T13:45:00Z',
        data: {
          id: 'clinic_abc123',
          name: 'Bay Area TMS Center',
          changes: ['address', 'hours'],
        },
      },
      response: '{"error":"Internal Server Error"}',
      createdAt: '2026-04-18T13:45:00Z',
      deliveredAt: null,
      errorMessage: 'HTTP 500: Internal Server Error',
      signatureValid: true,
    },
    {
      id: 'wh_7g8h9i',
      endpoint: 'https://wellnessapp.co/api/webhook',
      event: 'review.created',
      status: 'pending',
      httpStatus: null,
      attemptCount: 0,
      payload: {
        event: 'review.created',
        timestamp: '2026-04-18T14:25:00Z',
        data: {
          id: 'rev_new_001',
          clinic_id: 'clinic_abc123',
          rating: 5,
          title: 'Excellent care',
        },
      },
      response: null,
      createdAt: '2026-04-18T14:25:00Z',
      deliveredAt: null,
      errorMessage: null,
      signatureValid: true,
    },
    {
      id: 'wh_0j1k2l',
      endpoint: 'https://clinicfinderpro.com/webhooks',
      event: 'appointment.booked',
      status: 'retrying',
      httpStatus: 503,
      attemptCount: 2,
      payload: {
        event: 'appointment.booked',
        timestamp: '2026-04-18T12:10:00Z',
        data: {
          id: 'apt_123456',
          clinic_id: 'clinic_abc123',
          patient_name: 'Jane Doe',
          scheduled_at: '2026-04-20T09:00:00Z',
        },
      },
      response: '{"error":"Service Unavailable"}',
      createdAt: '2026-04-18T12:10:00Z',
      deliveredAt: null,
      errorMessage: 'HTTP 503: Service Unavailable (attempt 2/5)',
      signatureValid: true,
    },
    {
      id: 'wh_3m4n5o',
      endpoint: 'https://htsolutions.net/tms-webhook',
      event: 'user.registered',
      status: 'delivered',
      httpStatus: 200,
      attemptCount: 1,
      payload: {
        event: 'user.registered',
        timestamp: '2026-04-17T09:30:00Z',
        data: {
          id: 'user_new_42',
          email: 'newuser@example.com',
          source: 'organic',
        },
      },
      response: '{"received":true}',
      createdAt: '2026-04-17T09:30:00Z',
      deliveredAt: '2026-04-17T09:30:01Z',
      errorMessage: null,
      signatureValid: false,
    },
    {
      id: 'wh_6p7q8r',
      endpoint: 'https://neurocare.io/webhooks/tms',
      event: 'clinic.created',
      status: 'delivered',
      httpStatus: 200,
      attemptCount: 1,
      payload: {
        event: 'clinic.created',
        timestamp: '2026-04-16T16:00:00Z',
        data: {
          id: 'clinic_new_999',
          name: 'New TMS Clinic',
          state: 'NY',
        },
      },
      response: '{"ok":true}',
      createdAt: '2026-04-16T16:00:00Z',
      deliveredAt: '2026-04-16T16:00:01Z',
      errorMessage: null,
      signatureValid: true,
    },
  ]);

  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterEvent, setFilterEvent] = useState<string>('all');
  const [filterSignature, setFilterSignature] = useState<string>('all');
  const [searchEndpoint, setSearchEndpoint] = useState('');
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      if (filterStatus !== 'all' && l.status !== filterStatus) return false;
      if (filterEvent !== 'all' && l.event !== filterEvent) return false;
      if (filterSignature === 'valid' && !l.signatureValid) return false;
      if (filterSignature === 'invalid' && l.signatureValid) return false;
      if (searchEndpoint && !l.endpoint.toLowerCase().includes(searchEndpoint.toLowerCase())) return false;
      return true;
    });
  }, [logs, filterStatus, filterEvent, filterSignature, searchEndpoint]);

  const stats = useMemo(() => {
    const total = logs.length;
    const delivered = logs.filter(l => l.status === 'delivered').length;
    const failed = logs.filter(l => l.status === 'failed').length;
    const pending = logs.filter(l => l.status === 'pending' || l.status === 'retrying').length;
    const signatureIssues = logs.filter(l => !l.signatureValid).length;
    return { total, delivered, failed, pending, signatureIssues, successRate: total > 0 ? Math.round((delivered / total) * 100) : 0 };
  }, [logs]);

  const handleRetry = useCallback(async (logId: string) => {
    setRetryingId(logId);
    setTimeout(() => {
      setLogs(prev => prev.map(l => l.id === logId ? {
        ...l,
        status: 'pending' as const,
        attemptCount: 0,
        errorMessage: null,
      } : l));
      setRetryingId(null);
    }, 1200);
  }, []);

  const STATUS_COLORS: Record<string, string> = {
    delivered: 'bg-emerald-100 text-emerald-700',
    failed: 'bg-red-100 text-red-700',
    pending: 'bg-amber-100 text-amber-700',
    retrying: 'bg-orange-100 text-orange-700',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Webhook Endpoints</h1>
          <p className="text-gray-500 mt-1">Monitor incoming webhooks, inspect payloads, and manage retries</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase">Total Events</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase">Delivered</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.delivered}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase">Failed</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.failed}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase">Success Rate</p>
          <p className="text-2xl font-bold text-violet-600 mt-1">{stats.successRate}%</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase">Signature Issues</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{stats.signatureIssues}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-48">
            <input
              type="text"
              placeholder="Search endpoint URL..."
              value={searchEndpoint}
              onChange={e => setSearchEndpoint(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-mono focus:border-violet-500 focus:ring-violet-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500"
          >
            <option value="all">All Status</option>
            <option value="delivered">Delivered</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
            <option value="retrying">Retrying</option>
          </select>
          <select
            value={filterEvent}
            onChange={e => setFilterEvent(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500"
          >
            <option value="all">All Events</option>
            {EVENT_TYPES.map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
          <select
            value={filterSignature}
            onChange={e => setFilterSignature(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500"
          >
            <option value="all">All Signatures</option>
            <option value="valid">Valid</option>
            <option value="invalid">Invalid</option>
          </select>
        </div>
      </div>

      {/* Logs table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Endpoint</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">HTTP</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attempts</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Signature</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredLogs.map(log => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <code className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-1 rounded">{log.event}</code>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-mono text-gray-900 truncate max-w-xs">{log.endpoint}</p>
                  <p className="text-xs text-gray-400 font-mono">{log.id}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${STATUS_COLORS[log.status]}`}>
                    {log.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {log.httpStatus ? (
                    <span className={`text-sm font-mono font-semibold ${
                      log.httpStatus >= 200 && log.httpStatus < 300 ? 'text-emerald-600' :
                      log.httpStatus >= 500 ? 'text-red-600' : 'text-amber-600'
                    }`}>
                      {log.httpStatus}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">{log.attemptCount}x</span>
                </td>
                <td className="px-6 py-4">
                  {log.signatureValid ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Valid
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Invalid
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-xs text-gray-500">
                  {new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  <br />
                  {new Date(log.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="text-xs font-medium text-violet-600 hover:text-violet-700"
                    >
                      Inspect
                    </button>
                    {(log.status === 'failed' || log.status === 'retrying') && (
                      <button
                        onClick={() => handleRetry(log.id)}
                        disabled={retryingId === log.id}
                        className="text-xs font-medium text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
                      >
                        {retryingId === log.id ? 'Retrying...' : 'Retry'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredLogs.length === 0 && (
              <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">No webhook logs match your filters</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Payload Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl my-8">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-700">{selectedLog.event}</code>
                  <h2 className="text-lg font-semibold text-gray-900 mt-2">Webhook Payload</h2>
                  <p className="text-xs text-gray-500 font-mono mt-1">{selectedLog.id}</p>
                </div>
                <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Meta info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Endpoint</p>
                  <p className="text-xs font-mono text-gray-900 mt-0.5 truncate">{selectedLog.endpoint}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Status</p>
                  <span className={`inline-block mt-0.5 px-2.5 py-0.5 text-xs font-semibold rounded-full ${STATUS_COLORS[selectedLog.status]}`}>
                    {selectedLog.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">HTTP Status</p>
                  <p className={`text-sm font-mono font-semibold mt-0.5 ${
                    selectedLog.httpStatus && selectedLog.httpStatus >= 200 && selectedLog.httpStatus < 300 ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {selectedLog.httpStatus || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Attempts</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{selectedLog.attemptCount}</p>
                </div>
              </div>

              {/* Signature status */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Signature Verification</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {selectedLog.signatureValid
                        ? 'HMAC-SHA256 signature matched successfully'
                        : 'Warning: Signature verification failed or not present'
                      }
                    </p>
                  </div>
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    selectedLog.signatureValid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {selectedLog.signatureValid ? 'Valid' : 'Invalid'}
                  </div>
                </div>
                <div className="mt-3 bg-white rounded border border-gray-200 p-3">
                  <p className="text-xs text-gray-500 mb-1">Expected Header</p>
                  <code className="text-xs font-mono text-gray-700">
                    X-TMSList-Signature: sha256=<span className="text-violet-600">{'{'{'}}payload_hash{'}'}'}</span>
                  </code>
                </div>
              </div>

              {/* Request payload */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">Request Payload</h3>
                  <button className="text-xs font-medium text-violet-600 hover:text-violet-700">Copy</button>
                </div>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto max-h-64">
                  <pre className="text-xs text-green-400 font-mono">
                    {JSON.stringify(selectedLog.payload, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Response */}
              {selectedLog.response && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900">Response</h3>
                    <span className="text-xs text-gray-400">HTTP {selectedLog.httpStatus}</span>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-xs text-gray-300 font-mono">{selectedLog.response}</pre>
                  </div>
                </div>
              )}

              {/* Error message */}
              {selectedLog.errorMessage && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                  <p className="text-sm font-semibold text-red-700">Error</p>
                  <p className="text-xs text-red-600 mt-1">{selectedLog.errorMessage}</p>
                </div>
              )}

              {/* Retry button */}
              {(selectedLog.status === 'failed' || selectedLog.status === 'retrying') && (
                <div className="flex gap-3">
                  <button
                    onClick={() => { handleRetry(selectedLog.id); setSelectedLog(null); }}
                    disabled={retryingId === selectedLog.id}
                    className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                  >
                    {retryingId === selectedLog.id ? 'Retrying...' : 'Retry Delivery'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
