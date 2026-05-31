'use client';
import { useState, useEffect } from 'react';

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  status: string;
  source: string | null;
  confirmedAt: string | null;
  createdAt: string;
}

interface Stats {
  total: number;
  subscribed: number;
  unsubscribed: number;
}

export default function AdminNewsletter() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, subscribed: 0, unsubscribed: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [importBanner, setImportBanner] = useState<{ show: boolean; msg: string; type: 'success' | 'error' }>({ show: false, msg: '', type: 'success' });

  useEffect(() => { fetchSubscribers(); }, [statusFilter]);

  async function fetchSubscribers() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      params.set('limit', '100');
      const res = await fetch(`/api/admin/newsletter?${params}`);
      const data = await res.json();
      if (res.ok) {
        setSubscribers(data.subscribers || []);
        setStats(data.stats || {});
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  async function toggleSub(email: string, action: 'unsubscribe' | 'resubscribe') {
    await fetch('/api/admin/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, email }),
    });
    fetchSubscribers();
  }

  async function addSubscriber(email: string, name: string, source: string) {
    const res = await fetch('/api/admin/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, source }),
    });
    if (res.ok) { setShowAdd(false); fetchSubscribers(); }
  }

  async function handleCsvImport(file: File) {
    setImportBanner({ show: true, msg: `Importing ${file.name}...`, type: 'success' });
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(l => l.trim());
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
      const emailIdx = headers.findIndex(h => h.includes('email'));
      const nameIdx = headers.findIndex(h => h.includes('name'));
      if (emailIdx < 0) { setImportBanner({ show: true, msg: 'CSV must have an "email" column', type: 'error' }); return; }
      let imported = 0, skipped = 0;
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        const email = cols[emailIdx];
        if (!email || !email.includes('@')) { skipped++; continue; }
        const name = nameIdx >= 0 ? cols[nameIdx] : '';
        await fetch('/api/admin/newsletter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name, source: 'csv_import' }),
        });
        imported++;
      }
      setImportBanner({ show: true, msg: `Done! ${imported} imported, ${skipped} skipped.`, type: 'success' });
      fetchSubscribers();
    } catch {
      setImportBanner({ show: true, msg: 'Import failed', type: 'error' });
    }
  }

  function exportCsv() {
    const headers = ['Email', 'Name', 'Status', 'Source', 'Subscribed Date', 'Created Date'];
    const rows = [headers.join(','),
      ...subscribers.map(s => [
        s.email, s.name ?? '', s.status, s.source ?? '',
        s.confirmedAt ? new Date(s.confirmedAt).toLocaleDateString() : '',
        new Date(s.createdAt).toLocaleDateString(),
      ].map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([rows], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `newsletter-subscribers-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  }

  const filtered = search
    ? subscribers.filter(s => s.email.toLowerCase().includes(search.toLowerCase()) || (s.name?.toLowerCase().includes(search.toLowerCase()) ?? false))
    : subscribers;

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Subscribed" value={stats.subscribed} color="text-emerald-600" />
        <StatCard label="Unsubscribed" value={stats.unsubscribed} color="text-red-500" />
        <StatCard label="Last 30 Days" value="—" />
      </div>

      {/* Import Banner */}
      {importBanner.show && (
        <div className={`mb-4 rounded-xl p-4 flex items-center justify-between ${
          importBanner.type === 'success' ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'
        }`}>
          <p className={`text-sm font-medium ${importBanner.type === 'success' ? 'text-emerald-800' : 'text-red-800'}`}>
            {importBanner.msg}
          </p>
          <button onClick={() => setImportBanner({ ...importBanner, show: false })} className="text-gray-400 hover:text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by email or name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 text-sm border border-[var(--line)] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 min-w-64"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-[var(--line)] rounded-lg bg-white focus:outline-none"
        >
          <option value="">All</option>
          <option value="subscribed">Subscribed</option>
          <option value="unsubscribed">Unsubscribed</option>
        </select>
        {statusFilter && (
          <button onClick={() => setStatusFilter('')} className="px-3 py-2 text-sm border border-[var(--line)] rounded-lg hover:bg-gray-50">
            Clear
          </button>
        )}
        <button onClick={exportCsv} className="px-4 py-2 text-sm border border-[var(--line)] rounded-lg hover:bg-gray-50">
          Export CSV
        </button>
        <label className="px-4 py-2 text-sm border border-[var(--line)] rounded-lg hover:bg-gray-50 cursor-pointer">
          Import CSV
          <input type="file" accept=".csv" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleCsvImport(f); }} />
        </label>
        <button onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700">
          + Add Subscriber
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[var(--line)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subscribed</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center text-gray-400">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center text-gray-400">No subscribers found</td></tr>
              ) : filtered.map(s => (
                <tr key={s.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{s.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{s.name || <span className="text-gray-400">—</span>}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      s.status === 'subscribed' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {s.status === 'subscribed' ? 'Subscribed' : 'Unsubscribed'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">{s.source || '—'}</td>
                  <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                    {s.confirmedAt ? new Date(s.confirmedAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {s.status === 'subscribed' ? (
                      <button onClick={() => toggleSub(s.email, 'unsubscribe')}
                        className="text-xs text-red-600 hover:text-red-800 px-2 py-1">Unsubscribe</button>
                    ) : (
                      <button onClick={() => toggleSub(s.email, 'resubscribe')}
                        className="text-xs text-emerald-600 hover:text-emerald-800 px-2 py-1">Resubscribe</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <AddSubscriberModal
          onAdd={addSubscriber}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, color = 'text-gray-900' }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-white rounded-xl border border-[var(--line)] p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={`text-2xl font-semibold mt-1 ${color}`}>{typeof value === 'number' ? value.toLocaleString() : value}</p>
    </div>
  );
}

function AddSubscriberModal({ onAdd, onClose }: { onAdd: (email: string, name: string, source: string) => void; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [source, setSource] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onAdd(email, name, source);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-[var(--ink)]">Add Subscriber</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full px-3 py-2 text-sm border rounded-lg" placeholder="user@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg" placeholder="Jane Smith" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
            <input type="text" value={source} onChange={e => setSource(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg" placeholder="website, referral, import" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50">
              {saving ? 'Adding...' : 'Add Subscriber'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}