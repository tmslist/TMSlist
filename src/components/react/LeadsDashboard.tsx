import { useState, useEffect, useCallback } from 'react';

interface Lead {
  id: string;
  type: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  clinicId: string | null;
  doctorName: string | null;
  clinicName: string | null;
  sourceUrl: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface Stats {
  total: number;
  specialist_enquiry?: number;
  lead_magnet?: number;
  newsletter?: number;
  quiz_lead?: number;
}

const TYPE_COLORS: Record<string, string> = {
  specialist_enquiry: 'bg-indigo-100 text-indigo-700',
  lead_magnet: 'bg-blue-100 text-blue-700',
  newsletter: 'bg-cyan-100 text-cyan-700',
  quiz_lead: 'bg-purple-100 text-purple-700',
};

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'specialist_enquiry', label: 'Specialist Enquiries' },
  { key: 'lead_magnet', label: 'Lead Magnets' },
  { key: 'newsletter', label: 'Newsletter' },
  { key: 'quiz_lead', label: 'Quiz Leads' },
] as const;

function formatType(type: string) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatSource(url: string | null) {
  if (!url) return '-';
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

export default function LeadsDashboard({ userEmail }: { userEmail: string }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0 });
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLeads = useCallback(async (type?: string) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: '100', offset: '0' });
      if (type && type !== 'all') params.set('type', type);
      const res = await fetch(`/api/admin/leads?${params}`);
      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch leads');
      const json = await res.json();
      setLeads(json.data);
      setStats(json.stats);
    } catch (err: any) {
      setError(err.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads(filter);
  }, [filter, fetchLeads]);

  function exportCSV() {
    const headers = ['Date', 'Type', 'Name', 'Email', 'Phone', 'Doctor', 'Clinic', 'Message', 'Source'];
    const rows = leads.map(lead => [
      new Date(lead.createdAt).toLocaleDateString(),
      lead.type,
      lead.name || '',
      lead.email || '',
      lead.phone || '',
      lead.doctorName || '',
      lead.clinicName || '',
      (lead.message || '').replace(/"/g, '""'),
      lead.sourceUrl || '',
    ].map(v => `"${v}"`).join(','));

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container mx-auto px-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Enquiry Tracker</h1>
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-full">
                {userEmail}
              </span>
            </div>
            <p className="text-gray-600 mt-1">Manage and track all form submissions</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => fetchLeads(filter)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button
              onClick={exportCSV}
              disabled={leads.length === 0}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
            <a
              href="/admin/dashboard"
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Dashboard
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="text-gray-500 text-sm font-medium mb-1">Total Leads</div>
            <div className="text-3xl font-semibold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="text-gray-500 text-sm font-medium mb-1">Specialist Enquiries</div>
            <div className="text-3xl font-semibold text-indigo-600">{stats.specialist_enquiry || 0}</div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="text-gray-500 text-sm font-medium mb-1">Lead Magnets</div>
            <div className="text-3xl font-semibold text-blue-600">{stats.lead_magnet || 0}</div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="text-gray-500 text-sm font-medium mb-1">Newsletter</div>
            <div className="text-3xl font-semibold text-cyan-600">{stats.newsletter || 0}</div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Filters */}
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-4 overflow-x-auto">
            <span className="text-sm font-semibold text-gray-500 shrink-0">Filter:</span>
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === f.key
                    ? 'bg-gray-200 text-gray-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Table content */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Details</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Loading data...
                    </td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No submissions found.
                    </td>
                  </tr>
                ) : (
                  leads.map(lead => (
                    <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(lead.createdAt).toLocaleDateString()}
                        <span className="block text-xs text-gray-400">
                          {new Date(lead.createdAt).toLocaleTimeString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${TYPE_COLORS[lead.type] || 'bg-gray-100 text-gray-700'}`}>
                          {formatType(lead.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">{lead.name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{lead.email || 'No email'}</div>
                        {lead.phone && <div className="text-xs text-gray-400 mt-0.5">{lead.phone}</div>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                        {lead.doctorName && (
                          <div className="font-medium text-gray-900">{lead.doctorName}</div>
                        )}
                        {lead.clinicName && (
                          <div className="text-xs text-gray-500">{lead.clinicName}</div>
                        )}
                        {lead.message && (
                          <p className="line-clamp-2 mt-1">{lead.message}</p>
                        )}
                        {!lead.doctorName && !lead.clinicName && !lead.message && (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400 max-w-[200px] truncate" title={lead.sourceUrl || ''}>
                        {formatSource(lead.sourceUrl)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
