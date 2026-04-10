import React, { useState, useEffect, useCallback } from 'react';

interface Doctor {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  credential: string;
  title: string;
  school: string;
  yearsExperience: number | null;
  specialties: string[];
  bio: string;
  imageUrl: string;
  clinicId: string;
  clinicName?: string;
}

interface ClinicOption {
  id: string;
  name: string;
}

const EMPTY_DOCTOR: Omit<Doctor, 'id'> = {
  name: '',
  firstName: '',
  lastName: '',
  credential: '',
  title: '',
  school: '',
  yearsExperience: null,
  specialties: [],
  bio: '',
  imageUrl: '',
  clinicId: '',
  clinicName: '',
};

function TagInput({
  tags,
  onChange,
  placeholder = 'Add tag...',
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState('');

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      const value = input.trim();
      if (!tags.includes(value)) {
        onChange([...tags, value]);
      }
      setInput('');
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5 p-2 border border-gray-300 rounded-lg bg-white min-h-[42px] focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-200 transition-colors">
      {tags.map((tag, i) => (
        <span
          key={`${tag}-${i}`}
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-50 text-violet-700 text-xs font-medium rounded-full"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(tags.filter((_, idx) => idx !== i))}
            className="text-violet-400 hover:text-violet-700"
            aria-label={`Remove ${tag}`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[120px] text-sm outline-none bg-transparent placeholder:text-gray-400"
      />
    </div>
  );
}

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [clinics, setClinics] = useState<ClinicOption[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [clinicFilter, setClinicFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Doctor>>({});
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDoctor, setNewDoctor] = useState<Omit<Doctor, 'id'>>(EMPTY_DOCTOR);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const limit = 25;

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: String(limit), offset: String(page * limit) });
      if (search) params.set('search', search);
      if (clinicFilter) params.set('clinicId', clinicFilter);

      const res = await fetch(`/api/admin/doctors?${params}`);
      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch doctors');
      const json = await res.json();
      setDoctors(json.data);
      setTotal(json.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [search, clinicFilter, page]);

  const fetchClinics = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/clinics?limit=500&offset=0');
      if (res.ok) {
        const json = await res.json();
        setClinics((json.data || []).map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })));
      }
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);
  useEffect(() => { fetchClinics(); }, [fetchClinics]);

  function handleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      setEditData({});
    } else {
      const doc = doctors.find((d) => d.id === id);
      if (doc) {
        setExpandedId(id);
        setEditData({ ...doc });
      }
    }
  }

  async function handleSaveEdit() {
    if (!expandedId) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/doctors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: expandedId, ...editData }),
      });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to update doctor');
      showToast('success', 'Doctor updated');
      setExpandedId(null);
      setEditData({});
      fetchDoctors();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreate() {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDoctor),
      });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to create doctor');
      showToast('success', 'Doctor created');
      setShowAddModal(false);
      setNewDoctor(EMPTY_DOCTOR);
      fetchDoctors();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch('/api/admin/doctors', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to delete doctor');
      showToast('success', 'Doctor deleted');
      setDeleteConfirm(null);
      setExpandedId(null);
      fetchDoctors();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : "An error occurred");
    }
  }

  const totalPages = Math.ceil(total / limit);

  function renderDoctorForm(
    data: Partial<Doctor> | Omit<Doctor, 'id'>,
    setData: (updates: Partial<typeof data>) => void,
    onSave: () => void,
    saveLabel: string
  ) {
    return (
      <div className="space-y-4 p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <input
              type="text"
              value={data.firstName || ''}
              onChange={(e) => setData({ firstName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            <input
              type="text"
              value={data.lastName || ''}
              onChange={(e) => setData({ lastName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
            <input
              type="text"
              value={data.name || ''}
              onChange={(e) => setData({ name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
              placeholder="Dr. John Smith"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Credential</label>
            <input
              type="text"
              value={data.credential || ''}
              onChange={(e) => setData({ credential: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
              placeholder="MD, DO, NP"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={data.title || ''}
              onChange={(e) => setData({ title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
              placeholder="Board-Certified Psychiatrist"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Years Experience</label>
            <input
              type="number"
              min={0}
              value={data.yearsExperience ?? ''}
              onChange={(e) => setData({ yearsExperience: e.target.value ? Number(e.target.value) : null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">School / Training</label>
            <input
              type="text"
              value={data.school || ''}
              onChange={(e) => setData({ school: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Clinic</label>
            <select
              value={data.clinicId || ''}
              onChange={(e) => setData({ clinicId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:border-violet-500"
            >
              <option value="">Select clinic...</option>
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Specialties</label>
          <TagInput
            tags={data.specialties || []}
            onChange={(tags) => setData({ specialties: tags })}
            placeholder="Add specialty..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
          <input
            type="url"
            value={data.imageUrl || ''}
            onChange={(e) => setData({ imageUrl: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
            placeholder="https://..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
          <textarea
            value={data.bio || ''}
            onChange={(e) => setData({ bio: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
            placeholder="Doctor's biography..."
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : saveLabel}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Doctors</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          + Add Doctor
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name or credential..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-violet-500 focus:ring-violet-200"
          />
        </div>
        <select
          value={clinicFilter}
          onChange={(e) => { setClinicFilter(e.target.value); setPage(0); }}
          className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:border-violet-500"
        >
          <option value="">All Clinics</option>
          {clinics.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-800">
          {error}
          <button onClick={() => setError('')} className="ml-3 text-red-500 hover:text-red-700 text-xs font-medium">Dismiss</button>
        </div>
      )}

      <div className="text-sm text-gray-500">{total} doctor{total !== 1 ? 's' : ''} found</div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Credential</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Clinic</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Specialties</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400"><div class="inline-block w-5 h-5 border-2 border-gray-300 border-t-violet-600 rounded-full animate-spin mb-2"></div><br/>Loading</td></tr>
              ) : doctors.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No doctors found.</td></tr>
              ) : doctors.map((doc) => (
                <React.Fragment key={doc.id}>
                  <tr
                    className={`hover:bg-gray-50 transition-colors cursor-pointer ${expandedId === doc.id ? 'bg-violet-50/50' : ''}`}
                    onClick={() => handleExpand(doc.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {doc.imageUrl ? (
                          <img src={doc.imageUrl} alt={doc.name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 text-xs font-bold">
                            {(doc.firstName?.[0] || doc.name?.[0] || '?').toUpperCase()}
                          </div>
                        )}
                        <span className="text-sm font-semibold text-gray-900">{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{doc.credential || '--'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{doc.clinicName || '--'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(doc.specialties || []).slice(0, 3).map((s) => (
                          <span key={s} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{s}</span>
                        ))}
                        {(doc.specialties || []).length > 3 && (
                          <span className="text-xs text-gray-400">+{doc.specialties.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleExpand(doc.id)}
                          className="px-3 py-1.5 bg-violet-50 text-violet-700 text-xs font-medium rounded-lg hover:bg-violet-100 transition-colors"
                        >
                          {expandedId === doc.id ? 'Close' : 'Edit'}
                        </button>
                        {deleteConfirm === doc.id ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleDelete(doc.id)}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(doc.id)}
                            className="px-3 py-1.5 bg-red-50 text-red-700 text-xs font-medium rounded-lg hover:bg-red-100 transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedId === doc.id && (
                    <tr>
                      <td colSpan={5} className="bg-gray-50 border-t border-gray-200">
                        {renderDoctorForm(
                          editData,
                          (updates) => setEditData((prev) => ({ ...prev, ...updates })),
                          handleSaveEdit,
                          'Save Changes'
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-500">Page {page + 1} of {totalPages}</div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Doctor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add New Doctor</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {renderDoctorForm(
              newDoctor,
              (updates) => setNewDoctor((prev) => ({ ...prev, ...updates } as Omit<Doctor, 'id'>)),
              handleCreate,
              'Create Doctor'
            )}
          </div>
        </div>
      )}
    </div>
  );
}
