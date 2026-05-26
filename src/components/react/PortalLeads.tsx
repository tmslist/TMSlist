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
  const [needsClaim, setNeedsClaim] = useState(false);

  useEffect(() => {
    fetch('/api/portal/leads')
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.status === 403 || data?.error === 'No clinic linked') {
          setNeedsClaim(true);
          setLoading(false);
          return;
        }
        if (!res.ok) {
          setError(data?.error || 'Failed to load enquiries');
          setLoading(false);
          return;
        }
        setLeads(data.leads || []);
        setLoading(false);
      })
      .catch(() => { setError('Failed to load enquiries'); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (needsClaim) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <a href="/portal/dashboard/" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium mb-2 inline-block">
            &larr; Back to Dashboard
          </a>
          <h1 className="text-2xl font-semibold text-[var(--ink)]">Enquiries</h1>
        </div>
        <div className="bg-white rounded-xl border border-[var(--line)] p-8 text-center">
          <h2 className="text-lg font-semibold text-[var(--ink)] mb-2">Claim your clinic first</h2>
          <p className="text-[var(--muted)] text-sm mb-6">
            Enquiries are tied to a clinic listing. Link your account to your clinic to view incoming leads.
          </p>
          <a
            href="/portal/claim/"
            className="inline-flex items-center px-6 py-3 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all"
          >
            Claim Your Clinic
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <a href="/portal/dashboard/" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium mb-2 inline-block">
          &larr; Back to Dashboard
        </a>
        <h1 className="text-2xl font-semibold text-[var(--ink)]">Enquiries</h1>
        <p className="text-[var(--muted)] text-sm mt-1">{leads.length} enquir{leads.length !== 1 ? 'ies' : 'y'} total</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">{error}</div>
      )}

      {leads.length === 0 ? (
        <div className="bg-white rounded-xl border border-[var(--line)] p-8 text-center">
          <p className="text-[var(--muted)]">No enquiries yet for your clinic.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[var(--line)] shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-[var(--line)]">
            <thead className="bg-[var(--paper2)]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase">Message</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-[var(--paper2)]">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-[var(--ink)]">{lead.name || 'Anonymous'}</p>
                  </td>
                  <td className="px-6 py-4">
                    {lead.email ? (
                      <a href={`mailto:${lead.email}`} className="text-sm text-emerald-600 hover:text-emerald-700">{lead.email}</a>
                    ) : (
                      <span className="text-sm text-[var(--muted)]">--</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {lead.phone ? (
                      <a href={`tel:${lead.phone}`} className="text-sm text-[var(--ink2)]">{lead.phone}</a>
                    ) : (
                      <span className="text-sm text-[var(--muted)]">--</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-[var(--ink2)] max-w-xs truncate">{lead.message || '--'}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--muted)] whitespace-nowrap">
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
