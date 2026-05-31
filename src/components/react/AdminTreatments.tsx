'use client';
import { useState, useEffect } from 'react';

interface Treatment {
  id: string;
  slug: string;
  name: string;
  fullName: string | null;
  description: string | null;
  fdaApproved: boolean;
  conditions: string[] | null;
  howItWorks: string | null;
  sessionDuration: string | null;
  treatmentCourse: string | null;
  insuranceCoverage: string | null;
  createdAt: string;
}

export default function AdminTreatments() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Treatment | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { fetchTreatments(); }, []);

  async function fetchTreatments() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('limit', '100');
      const res = await fetch(`/api/admin/treatments?${params}`);
      const data = await res.json();
      if (res.ok) setTreatments(data.treatments || []);
      else setError(data.error || 'Failed to load');
    } catch { setError('Failed to load treatments'); }
    finally { setLoading(false); }
  }

  async function saveTreatment(t: Partial<Treatment>) {
    const method = t.id ? 'PUT' : 'POST';
    const res = await fetch('/api/admin/treatments', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(t),
    });
    if (res.ok) { fetchTreatments(); setEditing(null); setShowAdd(false); }
  }

  async function deleteTreatment(id: string) {
    if (!confirm('Delete this treatment?')) return;
    const res = await fetch(`/api/admin/treatments?id=${id}`, { method: 'DELETE' });
    if (res.ok) setTreatments(prev => prev.filter(t => t.id !== id));
  }

  const filtered = search
    ? treatments.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        (t.description?.toLowerCase().includes(search.toLowerCase()) ?? false)
      )
    : treatments;

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search treatments..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 text-sm border border-[var(--line)] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 min-w-64"
        />
        <button
          onClick={() => {
            setShowAdd(true);
            setEditing({
              id: '', slug: '', name: '', fullName: null, description: null,
              fdaApproved: false, conditions: null, howItWorks: null,
              sessionDuration: null, treatmentCourse: null, insuranceCoverage: null, createdAt: ''
            });
          }}
          className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700"
        >
          + Add Treatment
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[var(--line)] overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">FDA</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sessions</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conditions</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-16 text-center text-gray-400">Loading...</td></tr>
            ) : error ? (
              <tr><td colSpan={5} className="px-6 py-16 text-center text-red-500">{error}</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-16 text-center text-gray-400">No treatments found</td></tr>
            ) : filtered.map(t => (
              <tr key={t.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4">
                  <p className="text-sm font-semibold text-[var(--ink)]">{t.name}</p>
                  {t.fullName && <p className="text-xs text-[var(--muted)]">{t.fullName}</p>}
                </td>
                <td className="px-6 py-4">
                  {t.fdaApproved ? (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">FDA Approved</span>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{t.sessionDuration ?? '—'}</td>
                <td className="px-6 py-4">
                  {t.conditions?.length ? (
                    <div className="flex flex-wrap gap-1">
                      {t.conditions.slice(0, 2).map(c => (
                        <span key={c} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded">{c}</span>
                      ))}
                      {t.conditions.length > 2 && <span className="text-xs text-gray-400">+{t.conditions.length - 2}</span>}
                    </div>
                  ) : <span className="text-xs text-gray-400">—</span>}
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => setEditing(t)} className="text-xs text-violet-600 hover:underline mr-3">Edit</button>
                  <button onClick={() => deleteTreatment(t.id)} className="text-xs text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(editing || showAdd) && (
        <TreatmentModal
          treatment={editing!}
          onSave={saveTreatment}
          onClose={() => { setEditing(null); setShowAdd(false); }}
        />
      )}
    </div>
  );
}

function TreatmentModal({ treatment, onSave, onClose }: {
  treatment: Treatment;
  onSave: (t: Partial<Treatment>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState(treatment);
  const [saving, setSaving] = useState(false);
  const [conditionsText, setConditionsText] = useState(treatment.conditions?.join(', ') ?? '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const conditions = conditionsText ? conditionsText.split(',').map(s => s.trim()).filter(Boolean) : null;
    onSave({ ...form, conditions });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-[var(--ink)]">
            {form.id ? 'Edit Treatment' : 'Add Treatment'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
              <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} required
                className="w-full px-3 py-2 text-sm border rounded-lg" placeholder="tms" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                className="w-full px-3 py-2 text-sm border rounded-lg" placeholder="TMS Therapy" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input value={form.fullName ?? ''} onChange={e => setForm({ ...form, fullName: e.target.value })}
              className="w-full px-3 py-2 text-sm border rounded-lg" placeholder="Transcranial Magnetic Stimulation" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description ?? ''} onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3} className="w-full px-3 py-2 text-sm border rounded-lg" placeholder="Brief description of the treatment..." />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="fdaApproved" checked={form.fdaApproved}
              onChange={e => setForm({ ...form, fdaApproved: e.target.checked })}
              className="w-4 h-4" />
            <label htmlFor="fdaApproved" className="text-sm font-medium text-gray-700">FDA Approved</label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session Duration</label>
              <input value={form.sessionDuration ?? ''} onChange={e => setForm({ ...form, sessionDuration: e.target.value })}
                className="w-full px-3 py-2 text-sm border rounded-lg" placeholder="30-60 min" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Course</label>
              <input value={form.treatmentCourse ?? ''} onChange={e => setForm({ ...form, treatmentCourse: e.target.value })}
                className="w-full px-3 py-2 text-sm border rounded-lg" placeholder="4-6 weeks" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Conditions (comma-separated)</label>
            <input value={conditionsText} onChange={e => setConditionsText(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg" placeholder="depression, anxiety, ocd" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">How It Works</label>
            <textarea value={form.howItWorks ?? ''} onChange={e => setForm({ ...form, howItWorks: e.target.value })}
              rows={2} className="w-full px-3 py-2 text-sm border rounded-lg" placeholder="Brief explanation of the mechanism..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Treatment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}