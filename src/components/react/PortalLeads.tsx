import { useState, useEffect } from 'react';

interface Lead {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  type: string;
  createdAt: string;
}

export default function PortalLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/portal/leads')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load');
        return res.json();
      })
      .then((data) => { setLeads(data.leads || []); setLoading(false); })
      .catch(() => { setError('Failed to load enquiries'); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <a href="/portal/dashboard/" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium mb-2 inline-block">
          &larr; Back to Dashboard
        </a>
        <h1 className="text-2xl font-semibold text-gray-900">Enquiries</h1>
        <p className="text-gray-500 text-sm mt-1">{leads.length} enquir{leads.length !== 1 ? 'ies' : 'y'} total</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">{error}</div>
      )}

      {leads.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No enquiries yet for your clinic.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{lead.name || 'Anonymous'}</p>
                  </td>
                  <td className="px-6 py-4">
                    {lead.email ? (
                      <a href={`mailto:${lead.email}`} className="text-sm text-emerald-600 hover:text-emerald-700">{lead.email}</a>
                    ) : (
                      <span className="text-sm text-gray-400">--</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {lead.phone ? (
                      <a href={`tel:${lead.phone}`} className="text-sm text-gray-600">{lead.phone}</a>
                    ) : (
                      <span className="text-sm text-gray-400">--</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600 max-w-xs truncate">{lead.message || '--'}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
