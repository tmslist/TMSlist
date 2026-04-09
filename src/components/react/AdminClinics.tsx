import { useState, useEffect, useCallback } from 'react';

interface Clinic {
  id: string;
  slug: string;
  name: string;
  city: string;
  state: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  verified: boolean;
  isFeatured: boolean;
  ratingAvg: string | null;
  reviewCount: number;
  machines: string[] | null;
  createdAt: string;
}

export default function AdminClinics() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState('');
  const limit = 25;

  const fetchClinics = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(page * limit),
      });
      if (search) params.set('search', search);
      if (verifiedFilter !== 'all') params.set('verified', verifiedFilter);

      const res = await fetch(`/api/admin/clinics?${params}`);
      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch clinics');
      const json = await res.json();
      setClinics(json.data);
      setTotal(json.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load clinics');
    } finally {
      setLoading(false);
    }
  }, [search, verifiedFilter, page]);

  useEffect(() => { fetchClinics(); }, [fetchClinics]);

  async function toggleField(id: string, field: 'verified' | 'isFeatured', value: boolean) {
    setUpdating(id);
    try {
      const res = await fetch('/api/admin/clinics', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, [field]: value }),
      });
      if (res.ok) {
        setClinics(prev => prev.map(c =>
          c.id === id ? { ...c, [field]: value } : c
        ));
        setError('');
      } else {
        setError('Failed to update clinic. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setUpdating(null);
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name, city, or email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'true', 'false'].map(v => (
            <button
              key={v}
              onClick={() => { setVerifiedFilter(v); setPage(0); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                verifiedFilter === v
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {v === 'all' ? 'All' : v === 'true' ? 'Verified' : 'Unverified'}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-800 flex items-center justify-between">
          {error}
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700 text-xs font-medium">Dismiss</button>
        </div>
      )}

      {/* Count */}
      <div className="text-sm text-gray-500">
        {total} clinic{total !== 1 ? 's' : ''} found
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Clinic</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Location</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Rating</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Devices</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
              ) : clinics.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No clinics found.</td></tr>
              ) : clinics.map(clinic => (
                <tr key={clinic.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <a href={`/clinic/${clinic.slug}/`} target="_blank" className="text-sm font-semibold text-gray-900 hover:text-indigo-600">
                      {clinic.name}
                    </a>
                    {clinic.email && <div className="text-xs text-gray-400 mt-0.5">{clinic.email}</div>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {clinic.city}, {clinic.state}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {Number(clinic.ratingAvg) > 0 ? (
                      <span className="font-semibold text-gray-900">
                        {Number(clinic.ratingAvg).toFixed(1)} <span className="text-yellow-500">&#9733;</span>
                        <span className="text-xs text-gray-400 ml-1">({clinic.reviewCount})</span>
                      </span>
                    ) : (
                      <span className="text-gray-400">--</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {clinic.machines?.slice(0, 2).map(m => (
                        <span key={m} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{m}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        clinic.verified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {clinic.verified ? 'Verified' : 'Pending'}
                      </span>
                      {clinic.isFeatured && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                          Featured
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleField(clinic.id, 'verified', !clinic.verified)}
                        disabled={updating === clinic.id}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                          clinic.verified
                            ? 'bg-red-50 text-red-700 hover:bg-red-100'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {clinic.verified ? 'Unverify' : 'Verify'}
                      </button>
                      <button
                        onClick={() => toggleField(clinic.id, 'isFeatured', !clinic.isFeatured)}
                        disabled={updating === clinic.id}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                          clinic.isFeatured
                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                        }`}
                      >
                        {clinic.isFeatured ? 'Unfeature' : 'Feature'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Page {page + 1} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
