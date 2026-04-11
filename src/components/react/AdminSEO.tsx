import { useState, useEffect, useCallback } from 'react';

interface SeoOverride {
  id: string;
  path: string;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: string | null;
  canonicalUrl: string | null;
  noIndex: boolean;
  structuredData: Record<string, unknown> | null;
  updatedAt: string;
}

interface FormData {
  id?: string;
  path: string;
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  canonicalUrl: string;
  noIndex: boolean;
}

const EMPTY_FORM: FormData = {
  path: '',
  metaTitle: '',
  metaDescription: '',
  ogImage: '',
  canonicalUrl: '',
  noIndex: false,
};

const COMMON_PATHS = [
  '/',
  '/us',
  '/blog',
  '/treatments',
  '/specialists',
  '/providers',
  '/questions',
  '/research',
  '/resources',
  '/near-me',
  '/compare',
  '/stories',
  '/alternative-treatments',
  '/au',
  '/ca',
  '/uk',
  '/de',
  '/in',
];

export default function AdminSEO() {
  const [overrides, setOverrides] = useState<SeoOverride[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [form, setForm] = useState<FormData | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const limit = 25;

  const fetchOverrides = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('limit', String(limit));
      params.set('offset', String(page * limit));

      const res = await fetch(`/api/admin/seo?${params}`);
      const json = await res.json();
      if (res.ok) {
        setOverrides(json.data || []);
        setTotal(json.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch overrides:', err);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchOverrides();
  }, [fetchOverrides]);

  const openNewForm = () => {
    setForm({ ...EMPTY_FORM });
    setError('');
  };

  const openEditForm = (override: SeoOverride) => {
    setForm({
      id: override.id,
      path: override.path,
      metaTitle: override.metaTitle || '',
      metaDescription: override.metaDescription || '',
      ogImage: override.ogImage || '',
      canonicalUrl: override.canonicalUrl || '',
      noIndex: override.noIndex,
    });
    setError('');
  };

  const handleSave = async () => {
    if (!form) return;
    if (!form.path) {
      setError('Path is required');
      return;
    }
    setError('');
    setSaving(true);

    try {
      const method = form.id ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/seo', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Save failed');
        return;
      }

      setForm(null);
      fetchOverrides();
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, path: string) => {
    if (!window.confirm(`Delete SEO override for "${path}"?`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/seo?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setOverrides(prev => prev.filter(o => o.id !== id));
        setTotal(prev => prev - 1);
      }
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleting(null);
    }
  };

  const updateForm = (field: keyof FormData, value: string | boolean) => {
    setForm(prev => prev ? { ...prev, [field]: value } : null);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">SEO Overrides</h1>
          <p className="text-gray-500 mt-1">Manage meta tags and SEO settings per page</p>
        </div>
        <button
          onClick={openNewForm}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Override
        </button>
      </div>

      {/* Form (inline) */}
      {form && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              {form.id ? 'Edit Override' : 'New Override'}
            </h2>
            <button
              onClick={() => setForm(null)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Path */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Path</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="/us/california"
                  value={form.path}
                  onChange={(e) => updateForm('path', e.target.value)}
                  disabled={!!form.id}
                  className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none disabled:bg-gray-50 disabled:text-gray-500"
                />
                {!form.id && (
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) updateForm('path', e.target.value);
                    }}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none bg-white text-gray-500"
                  >
                    <option value="">Common paths...</option>
                    {COMMON_PATHS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Meta Title */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-700">Meta Title</label>
                <span className={`text-xs ${form.metaTitle.length > 60 ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                  {form.metaTitle.length}/60
                </span>
              </div>
              <input
                type="text"
                placeholder="Page title for search engines"
                value={form.metaTitle}
                onChange={(e) => updateForm('metaTitle', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
              />
            </div>

            {/* Meta Description */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-700">Meta Description</label>
                <span className={`text-xs ${form.metaDescription.length > 160 ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                  {form.metaDescription.length}/160
                </span>
              </div>
              <textarea
                placeholder="Page description for search results"
                value={form.metaDescription}
                onChange={(e) => updateForm('metaDescription', e.target.value)}
                rows={3}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none resize-y"
              />
            </div>

            {/* OG Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">OG Image URL</label>
              <input
                type="url"
                placeholder="https://..."
                value={form.ogImage}
                onChange={(e) => updateForm('ogImage', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
              />
            </div>

            {/* Canonical URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Canonical URL</label>
              <input
                type="url"
                placeholder="https://..."
                value={form.canonicalUrl}
                onChange={(e) => updateForm('canonicalUrl', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
              />
            </div>

            {/* No Index */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={form.noIndex}
                    onChange={(e) => updateForm('noIndex', e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-10 h-6 rounded-full transition-colors ${form.noIndex ? 'bg-violet-600' : 'bg-gray-200'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm absolute top-1 transition-transform ${form.noIndex ? 'translate-x-5' : 'translate-x-1'}`} />
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">No Index</span>
                  <span className="text-xs text-gray-400 ml-2">Prevent search engines from indexing this page</span>
                </div>
              </label>
            </div>
          </div>

          {/* Save / Cancel */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={() => setForm(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.path}
              className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : form.id ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by path..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : overrides.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-gray-500">No SEO overrides yet</p>
            <button
              onClick={openNewForm}
              className="text-violet-600 hover:text-violet-700 text-sm font-medium mt-2 inline-block"
            >
              Add your first override
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Path</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Meta Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Meta Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flags</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {overrides.map(override => (
                  <tr key={override.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900 font-mono">{override.path}</span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-sm text-gray-600 line-clamp-1" title={override.metaTitle || ''}>
                        {override.metaTitle || <span className="text-gray-300">--</span>}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell max-w-xs">
                      <span className="text-sm text-gray-500 line-clamp-1" title={override.metaDescription || ''}>
                        {override.metaDescription || <span className="text-gray-300">--</span>}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {override.noIndex && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                          noindex
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditForm(override)}
                          className="p-1.5 text-gray-400 hover:text-violet-600 transition-colors rounded-lg hover:bg-violet-50"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(override.id, override.path)}
                          disabled={deleting === override.id}
                          className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 disabled:opacity-50"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {page * limit + 1}--{Math.min((page + 1) * limit, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
