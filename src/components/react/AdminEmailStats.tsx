'use client';
import { useState, useEffect } from 'react';

interface EmailStats {
  total: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  recentSends: number;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  sentCount: number | null;
  failedCount: number | null;
  sentAt: string | null;
  createdAt: string;
}

function ProgressBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-700">{pct}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminEmailStats() {
  const [stats, setStats] = useState<EmailStats>({ total: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, recentSends: 0 });
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/email-stats')
      .then(r => {
        if (!r.ok) throw new Error('Failed to load email stats');
        return r.json();
      })
      .then(d => {
        setStats(d.stats || d);
        setCampaigns(d.campaigns || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Failed to load');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 text-sm">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-2 text-sm text-gray-800 font-medium hover:underline">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Email Stats</h1>
        <p className="text-gray-500 mt-1">Email delivery, open, click, and bounce tracking</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Total Sent', value: stats.total, color: 'text-gray-900', sub: null },
          { label: 'Delivered', value: stats.delivered, color: 'text-green-600', sub: stats.total > 0 ? Math.round(stats.delivered / stats.total * 100) : 0 },
          { label: 'Opened', value: stats.opened, color: 'text-blue-600', sub: stats.delivered > 0 ? Math.round(stats.opened / stats.delivered * 100) : 0 },
          { label: 'Clicked', value: stats.clicked, color: 'text-violet-600', sub: stats.delivered > 0 ? Math.round(stats.clicked / stats.delivered * 100) : 0 },
          { label: 'Bounced', value: stats.bounced, color: 'text-red-500', sub: stats.total > 0 ? Math.round(stats.bounced / stats.total * 100) : 0 },
        ].map(({ label, value, color, sub }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className={`text-2xl font-semibold mt-1 ${color}`}>{value.toLocaleString()}</p>
            {sub !== null && <p className="text-xs text-gray-400 mt-1">{sub}% rate</p>}
          </div>
        ))}
      </div>

      {/* Delivery rate bars */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-8">
        <h3 className="text-sm font-medium text-gray-700 mb-4">30-Day Performance</h3>
        <p className="text-xs text-gray-500 mb-4">{stats.recentSends.toLocaleString()} emails sent in last 30 days</p>
        <div className="space-y-4">
          <ProgressBar label="Delivery Rate" value={stats.delivered} max={Math.max(stats.total, 1)} color="bg-green-500" />
          <ProgressBar label="Open Rate" value={stats.opened} max={Math.max(stats.delivered, 1)} color="bg-blue-500" />
          <ProgressBar label="Click Rate" value={stats.clicked} max={Math.max(stats.delivered, 1)} color="bg-violet-500" />
          <ProgressBar label="Bounce Rate" value={stats.bounced} max={Math.max(stats.total, 1)} color="bg-red-500" />
        </div>
      </div>

      {/* Campaign table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-700">Email Campaigns</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sent</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Failed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">No campaigns yet</td>
                </tr>
              ) : campaigns.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{c.name}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      c.status === 'sent' ? 'bg-green-100 text-green-700' :
                      c.status === 'draft' ? 'bg-gray-100 text-gray-600' :
                      c.status === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 text-right">{c.sentCount ?? 0}</td>
                  <td className="px-6 py-4 text-sm text-red-600 text-right">{c.failedCount ?? 0}</td>
                  <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">{formatDate(c.sentAt ?? c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}