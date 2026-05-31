'use client';
import { useState, useEffect, useCallback } from 'react';

interface EmailStats {
  total: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
  recentSends: number;
}

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  sentCount: number | null;
  failedCount: number | null;
  openedCount: number | null;
  clickedCount: number | null;
  bouncedCount: number | null;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
}

interface EmailLog {
  id: string;
  campaignName: string | null;
  recipientEmail: string;
  subject: string;
  status: string;
  sentAt: string | null;
  deliveredAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  bouncedAt: string | null;
  errorMessage: string | null;
}

type TabKey = 'overview' | 'campaigns' | 'logs' | 'webhooks';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'campaigns', label: 'Campaigns' },
  { key: 'logs', label: 'Live Logs' },
  { key: 'webhooks', label: 'Webhook Status' },
];

const STATUS_COLORS: Record<string, string> = {
  sent: 'bg-blue-100 text-blue-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  opened: 'bg-indigo-100 text-indigo-700',
  clicked: 'bg-purple-100 text-purple-700',
  bounced: 'bg-red-100 text-red-700',
  complained: 'bg-amber-100 text-amber-700',
  unsubscribed: 'bg-gray-100 text-gray-600',
};

function CardMetric({ label, value, sub, color }: { label: string; value: number; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-[var(--line)] p-5 shadow-sm">
      <p className="text-xs font-medium text-[var(--muted)] uppercase">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value.toLocaleString()}</p>
      {sub && <p className="text-xs text-[var(--muted)] mt-0.5">{sub}</p>}
    </div>
  );
}

function ProgressBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-[var(--ink2)]">{label}</span>
        <span className="font-medium text-[var(--ink)]">{pct}%</span>
      </div>
      <div className="h-2 bg-[var(--paper2)] rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLORS[status] || 'bg-[var(--paper2)] text-[var(--ink2)]';
  return <span className={`px-2 py-0.5 text-xs font-semibold rounded uppercase ${cls}`}>{status}</span>;
}

export default function AdminEmailStats() {
  const [tab, setTab] = useState<TabKey>('overview');
  const [stats, setStats] = useState<EmailStats>({ total: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, complained: 0, recentSends: 0 });
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchAll = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/admin/email-stats');
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to load data');
      const json = await res.json();
      setStats({
        total: json.stats?.total ?? 0,
        delivered: json.stats?.delivered ?? 0,
        opened: json.stats?.opened ?? 0,
        clicked: json.stats?.clicked ?? 0,
        bounced: json.stats?.bounced ?? 0,
        complained: json.stats?.complained ?? 0,
        recentSends: json.stats?.recentSends ?? 0,
      });
      setCampaigns((json.campaigns || []).map((c: any) => ({
        ...c,
        openedCount: c.openedCount ?? null,
        clickedCount: c.clickedCount ?? null,
        bouncedCount: c.bouncedCount ?? null,
      })));
      setLogs(json.logs || []);
      setError('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const deliveryRate = stats.total > 0 ? Math.round((stats.delivered / stats.total) * 100) : 0;
  const openRate = stats.delivered > 0 ? Math.round((stats.opened / stats.delivered) * 100) : 0;
  const clickRate = stats.delivered > 0 ? Math.round((stats.clicked / stats.delivered) * 100) : 0;
  const bounceRate = stats.total > 0 ? Math.round((stats.bounced / stats.total) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[var(--line)] border-t-[var(--ink)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[var(--ink)]">Email Monitor</h2>
          <p className="text-sm text-[var(--muted)] mt-0.5">
            {stats.total > 0 ? `${stats.total.toLocaleString()} total emails sent via Resend` : 'Connect Resend webhook to track email events'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchAll}
            disabled={refreshing}
            className="px-3 py-2 bg-white border border-[var(--line)] rounded-lg text-sm font-medium text-[var(--ink2)] hover:bg-[var(--paper2)] transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-[var(--line)] shadow-sm">
        <div className="border-b border-[var(--line)]">
          <nav className="flex gap-1 px-4">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  tab === t.key ? 'border-[rgba(201,101,74,0.2)] text-[var(--warm)]' : 'border-transparent text-[var(--muted)] hover:text-[var(--ink2)]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* ── OVERVIEW ── */}
          {tab === 'overview' && (
            <div className="space-y-6">
              {/* Stats grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <CardMetric label="Total Sent" value={stats.total} sub={deliveryRate ? `↘ ${deliveryRate}% delivered` : undefined} color="text-[var(--ink)]" />
                <CardMetric label="Delivered" value={stats.delivered} sub={stats.total > 0 ? `${deliveryRate}% delivery rate` : undefined} color="text-emerald-600" />
                <CardMetric label="Opened" value={stats.opened} sub={stats.delivered > 0 ? `${openRate}% open rate` : undefined} color="text-blue-600" />
                <CardMetric label="Clicked" value={stats.clicked} sub={stats.delivered > 0 ? `${clickRate}% click rate` : undefined} color="text-purple-600" />
                <CardMetric label="Bounced" value={stats.bounced} sub={bounceRate > 0 ? `${bounceRate}% bounce rate` : undefined} color="text-red-500" />
                <CardMetric label="Complained" value={stats.complained} color="text-amber-600" />
              </div>

              {/* Funnel */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[var(--paper2)] rounded-xl p-5">
                  <h4 className="text-sm font-semibold text-[var(--ink)] mb-4">Delivery Funnel</h4>
                  <div className="space-y-4">
                    <ProgressBar label="Delivery" value={stats.delivered} max={Math.max(stats.total, 1)} color="bg-emerald-500" />
                    <ProgressBar label="Open Rate" value={stats.opened} max={Math.max(stats.delivered, 1)} color="bg-blue-500" />
                    <ProgressBar label="Click Rate" value={stats.clicked} max={Math.max(stats.delivered, 1)} color="bg-purple-500" />
                    <ProgressBar label="Bounce Rate" value={stats.bounced} max={Math.max(stats.total, 1)} color="bg-red-500" />
                  </div>
                </div>

                <div className="bg-[var(--paper2)] rounded-xl p-5">
                  <h4 className="text-sm font-semibold text-[var(--ink)] mb-4">Quick Health</h4>
                  <dl className="space-y-3">
                    <div className="flex justify-between items-center">
                      <dt className="text-sm text-[var(--muted)]">Last 30 days sent</dt>
                      <dd className="text-sm font-semibold text-[var(--ink)]">{stats.recentSends.toLocaleString()}</dd>
                    </div>
                    <div className="flex justify-between items-center">
                      <dt className="text-sm text-[var(--muted)]">Campaigns created</dt>
                      <dd className="text-sm font-semibold text-[var(--ink)]">{campaigns.length}</dd>
                    </div>
                    <div className="flex justify-between items-center">
                      <dt className="text-sm text-[var(--muted)]">Success rate</dt>
                      <dd className={`text-sm font-semibold ${bounceRate < 5 ? 'text-emerald-600' : bounceRate < 10 ? 'text-amber-600' : 'text-red-500'}`}>
                        {100 - bounceRate}%
                      </dd>
                    </div>
                    <div className="flex justify-between items-center">
                      <dt className="text-sm text-[var(--muted)]">Resend webhook</dt>
                      <dd className="text-xs">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded uppercase">Connected</span>
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          )}

          {/* ── CAMPAIGNS ── */}
          {tab === 'campaigns' && (
            <div>
              {campaigns.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-12 h-12 bg-[var(--paper2)] rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-medium text-[var(--ink2)] mb-1">No campaigns yet</h4>
                  <p className="text-sm text-[var(--muted)]">Create your first email campaign in Resend to see stats here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-[var(--paper2)] border-b border-[var(--line)]">
                        <th className="px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase">Campaign</th>
                        <th className="px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase">Status</th>
                        <th className="px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase text-right">Sent</th>
                        <th className="px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase text-right">Opened</th>
                        <th className="px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase text-right">Clicked</th>
                        <th className="px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase text-right">Bounced</th>
                        <th className="px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase">Sent Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--line)]">
                      {campaigns.map(c => (
                        <tr key={c.id} className="hover:bg-[var(--paper2)] transition-colors">
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-[var(--ink)]">{c.name}</p>
                            <p className="text-xs text-[var(--muted)] mt-0.5 truncate max-w-xs">{c.subject}</p>
                          </td>
                          <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                          <td className="px-4 py-3 text-sm text-[var(--ink2)] text-right font-mono">{c.sentCount ?? 0}</td>
                          <td className="px-4 py-3 text-sm text-blue-600 text-right font-mono">{c.openedCount ?? 0}</td>
                          <td className="px-4 py-3 text-sm text-purple-600 text-right font-mono">{c.clickedCount ?? 0}</td>
                          <td className="px-4 py-3 text-sm text-red-500 text-right font-mono">{c.bouncedCount ?? 0}</td>
                          <td className="px-4 py-3 text-xs text-[var(--muted)] whitespace-nowrap">{formatDate(c.sentAt ?? c.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── LOGS ── */}
          {tab === 'logs' && (
            <div>
              {logs.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-12 h-12 bg-[var(--paper2)] rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-medium text-[var(--ink2)] mb-1">No email logs yet</h4>
                  <p className="text-sm text-[var(--muted)]">Logs appear here once Resend webhook is connected and emails are tracked.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-[var(--paper2)] border-b border-[var(--line)]">
                        <th className="px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase">Recipient</th>
                        <th className="px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase">Subject</th>
                        <th className="px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase">Status</th>
                        <th className="px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase">Sent At</th>
                        <th className="px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase">Delivered</th>
                        <th className="px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase">Error</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--line)]">
                      {logs.slice(0, 50).map(log => (
                        <tr key={log.id} className="hover:bg-[var(--paper2)] transition-colors">
                          <td className="px-4 py-3 text-sm font-mono text-[var(--ink2)]">{log.recipientEmail}</td>
                          <td className="px-4 py-3 text-sm text-[var(--ink)] max-w-xs truncate">{log.subject}</td>
                          <td className="px-4 py-3"><StatusBadge status={log.status} /></td>
                          <td className="px-4 py-3 text-xs text-[var(--muted)]">{formatDateTime(log.sentAt)}</td>
                          <td className="px-4 py-3 text-xs text-[var(--muted)]">{formatDateTime(log.deliveredAt)}</td>
                          <td className="px-4 py-3 text-xs text-red-500 max-w-xs truncate">{log.errorMessage || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── WEBHOOKS ── */}
          {tab === 'webhooks' && (
            <div className="space-y-6">
              <div className="bg-[var(--paper2)] rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[var(--ink)]">Resend Webhook Endpoint</h4>
                    <p className="text-xs text-[var(--muted)] mt-1">Configure in Resend dashboard → Webhooks → Add endpoint</p>
                    <code className="mt-2 block text-xs font-mono bg-white border border-[var(--line)] rounded px-3 py-2 text-[var(--ink2)]">
                      {typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/resend
                    </code>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { event: 'email.sent', desc: 'Email accepted by Resend', color: 'text-blue-600' },
                  { event: 'email.delivered', desc: 'Successfully delivered to inbox', color: 'text-emerald-600' },
                  { event: 'email.opened', desc: 'Recipient opened email', color: 'text-indigo-600' },
                  { event: 'email.clicked', desc: 'Recipient clicked a link', color: 'text-purple-600' },
                  { event: 'email.bounced', desc: 'Delivery failed permanently', color: 'text-red-500' },
                  { event: 'email.complained', desc: 'Marked as spam', color: 'text-amber-600' },
                ].map(e => (
                  <div key={e.event} className="bg-white border border-[var(--line)] rounded-xl p-4">
                    <code className={`text-xs font-mono font-semibold ${e.color}`}>{e.event}</code>
                    <p className="text-xs text-[var(--muted)] mt-1">{e.desc}</p>
                  </div>
                ))}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-amber-800">Resend webhook not yet configured</p>
                    <p className="text-xs text-amber-700 mt-1">Add <code className="font-mono">/api/webhooks/resend</code> as your Resend webhook URL to start tracking open, click, bounce, and complaint events automatically.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}