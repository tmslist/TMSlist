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

type SortOption = 'newest' | 'rating' | 'review_count' | 'name';

export default function AdminClinics() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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
      if (sortBy) params.set('sort', sortBy);

      const res = await fetch(`/api/admin/clinics?${params}`);
      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch clinics');
      const json = await res.json();
      setClinics(json.data);
      setTotal(json.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred" || 'Failed to load clinics');
    } finally {
      setLoading(false);
    }
  }, [search, verifiedFilter, sortBy, page]);

  useEffect(() => { fetchClinics(); }, [fetchClinics]);

  // Clear selection when page/filter changes
  useEffect(() => {
    setSelected(new Set());
  }, [page, search, verifiedFilter, sortBy]);

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

  // ---- Bulk selection ----
  function toggleAll() {
    if (selected.size === clinics.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(clinics.map(c => c.id)));
    }
  }

  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // ---- Bulk delete ----
  async function bulkDelete() {
    const ids = Array.from(selected);
    setBulkDeleting(true);
    let deleted = 0;
    let failed = 0;
    for (const id of ids) {
      try {
        const res = await fetch('/api/admin/clinics', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        });
        if (res.ok) deleted++;
        else failed++;
      } catch {
        failed++;
      }
    }
    setSelected(new Set());
    setShowDeleteModal(false);
    setBulkDeleting(false);
    if (failed === 0) {
      setError('');
      fetchClinics();
    } else {
      setError(`${deleted} deleted, ${failed} failed.`);
    }
  }

  // ---- CSV export ----
  function exportCSV() {
    const rows = selected.size > 0
      ? clinics.filter(c => selected.has(c.id))
      : clinics;
    const header = ['Name', 'City', 'State', 'Verified', 'Rating', 'Review Count', 'Phone', 'Email'];
    const lines = rows.map(c => [
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${(c.city || '').replace(/"/g, '""')}"`,
      `"${(c.state || '').replace(/"/g, '""')}"`,
      c.verified ? 'Yes' : 'No',
      c.ratingAvg || '',
      c.reviewCount,
      `"${(c.phone || '').replace(/"/g, '""')}"`,
      `"${(c.email || '').replace(/"/g, '""')}"`,
    ].join(','));
    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clinics-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalPages = Math.ceil(total / limit);
  const allSelected = clinics.length > 0 && selected.size === clinics.length;
  const someSelected = selected.size > 0 && !allSelected;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <input
            type="text"
            placeholder="Search by name, city, or email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        {/* Verified filter */}
        <div className="flex gap-2">
          {[['all', 'All'], ['true', 'Verified'], ['false', 'Unverified']].map(([v, label]) => (
            <button
              key={v}
              onClick={() => { setVerifiedFilter(v); setPage(0); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                verifiedFilter === v
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {/* Sort dropdown */}
        <select
          value={sortBy}
          onChange={e => { setSortBy(e.target.value as SortOption); setPage(0); }}
          className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="newest">Sort: Newest</option>
          <option value="rating">Sort: Rating</option>
          <option value="review_count">Sort: Review Count</option>
          <option value="name">Sort: Name A-Z</option>
        </select>
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
        {selected.size > 0 && <span className="ml-2 font-medium text-indigo-600">{selected.size} selected</span>}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={el => { if (el) el.indeterminate = someSelected; }}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
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
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400"><div className="inline-block w-5 h-5 border-2 border-gray-300 border-t-violet-600 rounded-full animate-spin mb-2"></div><br/>Loading</td></tr>
              ) : clinics.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No clinics found.</td></tr>
              ) : clinics.map(clinic => (
                <tr key={clinic.id} className={`hover:bg-gray-50 transition-colors ${selected.has(clinic.id) ? 'bg-indigo-50/40' : ''}`}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(clinic.id)}
                      onChange={() => toggleOne(clinic.id)}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </td>
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
                      <a
                        href={`/admin/clinics/${clinic.id}`}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors"
                      >
                        Edit
                      </a>
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

      {/* Bulk Action Bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl">
          <span className="text-sm font-medium">
            {selected.size} selected
          </span>
          <div className="w-px h-5 bg-gray-600" />
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 text-sm text-gray-200 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Selected
          </button>
          <div className="w-px h-5 bg-gray-600" />
          <button
            onClick={() => setSelected(new Set())}
            className="text-sm text-gray-400 hover:text-white transition-colors"
            aria-label="Clear selection"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !bulkDeleting && setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete {selected.size} {selected.size === 1 ? 'clinic' : 'clinics'}?</h3>
                <p className="text-sm text-gray-500 mt-0.5">This cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={bulkDeleting}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={bulkDelete}
                disabled={bulkDeleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {bulkDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
