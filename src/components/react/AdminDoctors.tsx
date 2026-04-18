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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
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

  // Clear selection on page/filter change
  useEffect(() => {
    setSelected(new Set());
  }, [page, search, clinicFilter]);

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
      setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
      fetchDoctors();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : "An error occurred");
    }
  }

  // ---- Bulk selection ----
  function toggleAll() {
    if (selected.size === doctors.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(doctors.map(d => d.id)));
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
        const res = await fetch('/api/admin/doctors', {
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
    setShowBulkDeleteModal(false);
    setBulkDeleting(false);
    if (failed === 0) {
      showToast('success', `${deleted} doctor${deleted !== 1 ? 's' : ''} deleted`);
      fetchDoctors();
    } else {
      showToast('error', `${deleted} deleted, ${failed} failed.`);
    }
  }

  // ---- CSV export ----
  function exportCSV() {
    const rows = selected.size > 0
      ? doctors.filter(d => selected.has(d.id))
      : doctors;
    const header = ['Name', 'Credential', 'Clinic', 'Specialties', 'Bio Status'];
    const lines = rows.map(d => [
      `"${(d.name || '').replace(/"/g, '""')}"`,
      `"${(d.credential || '').replace(/"/g, '""')}"`,
      `"${(d.clinicName || '').replace(/"/g, '""')}"`,
      `"${(d.specialties || []).join('; ').replace(/"/g, '""')}"`,
      d.bio ? 'Has bio' : 'No bio',
    ].join(','));
    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `doctors-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalPages = Math.ceil(total / limit);
  const allSelected = doctors.length > 0 && selected.size === doctors.length;
  const someSelected = selected.size > 0 && !allSelected;

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
          <label className="block text-sm font-medium text-gray-700 mb-1">Profile Photo</label>

          {/* Preview */}
          {data.imageUrl && (
            <div className="mb-3 relative inline-block">
              <img
                src={data.imageUrl}
                alt="Doctor preview"
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <button
                type="button"
                onClick={() => setData({ imageUrl: '' })}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                title="Remove image"
              >
                ×
              </button>
            </div>
          )}

          {/* Upload button */}
          <div className="flex items-center gap-3 flex-wrap">
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-violet-50 border border-violet-200 text-violet-700 text-sm font-medium rounded-lg cursor-pointer hover:bg-violet-100 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Upload Photo
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 2 * 1024 * 1024) {
                    alert('File too large. Maximum size is 2 MB.');
                    return;
                  }
                  // Show local preview immediately
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    setData({ imageUrl: ev.target?.result as string });
                  };
                  reader.readAsDataURL(file);
                  // Upload to Cloudinary
                  const formData = new FormData();
                  formData.append('file', file);
                  formData.append('slug', data.name?.toLowerCase().replace(/\s+/g, '-') || 'doctor');
                  try {
                    const res = await fetch('/api/admin/upload-doctor-image', {
                      method: 'POST',
                      body: formData,
                    });
                    const json = await res.json();
                    if (res.ok && json.url) {
                      setData({ imageUrl: json.url });
                    } else {
                      alert('Upload failed: ' + (json.error || 'Unknown error'));
                    }
                  } catch {
                    alert('Upload failed. You can still use a URL below.');
                  }
                  // Reset file input
                  e.target.value = '';
                }}
              />
            </label>
            <span className="text-xs text-gray-400">JPG, PNG, WebP — max 2 MB</span>
          </div>

          {/* URL fallback */}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-gray-400 whitespace-nowrap">or paste URL:</span>
            <input
              type="url"
              value={data.imageUrl || ''}
              onChange={(e) => setData({ imageUrl: e.target.value })}
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
              placeholder="https://..."
            />
          </div>
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
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-800 flex items-center justify-between">
          {error}
          <button onClick={() => setError('')} className="ml-3 text-red-500 hover:text-red-700 text-xs font-medium">Dismiss</button>
        </div>
      )}

      <div className="text-sm text-gray-500">
        {total} doctor{total !== 1 ? 's' : ''} found
        {selected.size > 0 && <span className="ml-2 font-medium text-violet-600">{selected.size} selected</span>}
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
                    className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Credential</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Clinic</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Specialties</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400"><div className="inline-block w-5 h-5 border-2 border-gray-300 border-t-violet-600 rounded-full animate-spin mb-2"></div><br/>Loading</td></tr>
              ) : doctors.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No doctors found.</td></tr>
              ) : doctors.map((doc) => (
                <React.Fragment key={doc.id}>
                  <tr
                    className={`hover:bg-gray-50 transition-colors cursor-pointer ${selected.has(doc.id) ? 'bg-violet-50/40' : ''} ${expandedId === doc.id ? 'bg-violet-50/50' : ''}`}
                    onClick={() => handleExpand(doc.id)}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(doc.id)}
                        onChange={() => toggleOne(doc.id)}
                        className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                      />
                    </td>
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
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
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
                      <td colSpan={6} className="bg-gray-50 border-t border-gray-200">
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
            onClick={() => setShowBulkDeleteModal(true)}
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

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !bulkDeleting && setShowBulkDeleteModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete {selected.size} {selected.size === 1 ? 'doctor' : 'doctors'}?</h3>
                <p className="text-sm text-gray-500 mt-0.5">This cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
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
