import { useState, useEffect } from 'react';
import { PortalCard, PortalButton, PortalInput, PortalTextarea, LoadingScreen, ErrorScreen } from './PortalUI';

interface Doctor {
  id: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  credential?: string | null;
  title?: string | null;
  school?: string | null;
  yearsExperience?: number | null;
  specialties?: string[] | null;
  bio?: string | null;
  imageUrl?: string | null;
  createdAt: string;
}

interface DoctorFormData {
  name: string;
  firstName: string;
  lastName: string;
  credential: string;
  title: string;
  school: string;
  yearsExperience: string;
  specialties: string;
  bio: string;
  imageUrl: string;
}

function TeamContent() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const blank: DoctorFormData = {
    name: '', firstName: '', lastName: '', credential: '', title: '',
    school: '', yearsExperience: '', specialties: '', bio: '', imageUrl: '',
  };
  const [form, setForm] = useState<DoctorFormData>(blank);

  async function fetchTeam() {
    try {
      setLoading(true);
      const res = await fetch('/api/portal/team');
      if (!res.ok) throw new Error('Failed to load team');
      const data = await res.json();
      setDoctors(data.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchTeam(); }, []);

  function set(field: keyof DoctorFormData, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        firstName: form.firstName || null,
        lastName: form.lastName || null,
        credential: form.credential || null,
        title: form.title || null,
        school: form.school || null,
        yearsExperience: form.yearsExperience ? parseInt(form.yearsExperience) : null,
        specialties: form.specialties ? form.specialties.split(',').map(s => s.trim()).filter(Boolean) : [],
        bio: form.bio || null,
        imageUrl: form.imageUrl || null,
      };
      const url = editingId ? `/api/portal/team?id=${editingId}` : '/api/portal/team';
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Save failed');
      }
      resetForm();
      fetchTeam();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this team member? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/portal/team?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setDoctors(prev => prev.filter(d => d.id !== id));
    } catch {
      alert('Failed to remove team member');
    } finally {
      setDeletingId(null);
    }
  }

  function startEdit(doc: Doctor) {
    setEditingId(doc.id);
    setForm({
      name: doc.name ?? '',
      firstName: doc.firstName ?? '',
      lastName: doc.lastName ?? '',
      credential: doc.credential ?? '',
      title: doc.title ?? '',
      school: doc.school ?? '',
      yearsExperience: doc.yearsExperience ? String(doc.yearsExperience) : '',
      specialties: (doc.specialties ?? []).join(', '),
      bio: doc.bio ?? '',
      imageUrl: doc.imageUrl ?? '',
    });
    setShowAdd(true);
  }

  function resetForm() {
    setForm(blank);
    setShowAdd(false);
    setEditingId(null);
  }

  if (loading && doctors.length === 0) return <LoadingScreen message="Loading team..." />;
  if (error && doctors.length === 0) return <ErrorScreen message={error} onRetry={fetchTeam} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--muted)]">{doctors.length} team member{doctors.length !== 1 ? 's' : ''}</p>
        <PortalButton variant="primary" size="sm" onClick={() => { resetForm(); setShowAdd(true); }}>
          + Add Team Member
        </PortalButton>
      </div>

      {showAdd && (
        <PortalCard padding="lg">
          <h3 className="text-lg font-semibold text-[var(--ink)] mb-4">
            {editingId ? 'Edit Team Member' : 'Add Team Member'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <PortalInput label="Full Name *" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Dr. Jane Smith" required />
            </div>
            <PortalInput label="First Name" value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="Jane" />
            <PortalInput label="Last Name" value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Smith" />
            <PortalInput label="Credentials" value={form.credential} onChange={e => set('credential', e.target.value)} placeholder="MD, PhD" />
            <PortalInput label="Title" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Lead TMS Physician" />
            <PortalInput label="Medical School" value={form.school} onChange={e => set('school', e.target.value)} placeholder="Harvard Medical School" />
            <PortalInput label="Years of Experience" type="number" value={form.yearsExperience} onChange={e => set('yearsExperience', e.target.value)} placeholder="12" />
            <div className="md:col-span-2">
              <PortalInput label="Specialties" value={form.specialties} onChange={e => set('specialties', e.target.value)} placeholder="Depression, Anxiety, OCD" hint="Comma-separated list" />
            </div>
            <div className="md:col-span-2">
              <PortalInput label="Photo URL" type="url" value={form.imageUrl} onChange={e => set('imageUrl', e.target.value)} placeholder="https://example.com/photo.jpg" />
              {form.imageUrl && (
                <img src={form.imageUrl} alt="Preview" className="mt-2 w-20 h-20 rounded-full object-cover border border-[var(--line)]" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              )}
            </div>
            <div className="md:col-span-2">
              <PortalTextarea label="Bio" value={form.bio} onChange={e => set('bio', e.target.value)} rows={3} placeholder="Brief professional bio..." />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <PortalButton variant="primary" onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Member'}
            </PortalButton>
            <PortalButton variant="secondary" onClick={resetForm}>Cancel</PortalButton>
          </div>
        </PortalCard>
      )}

      {doctors.length === 0 && !showAdd ? (
        <PortalCard padding="lg">
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-[var(--paper2)] rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-[var(--muted)] text-sm">No team members added yet</p>
            <p className="text-[var(--muted)] text-xs mt-1">Add doctors, TMS technicians, and other staff.</p>
          </div>
        </PortalCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {doctors.map(doc => (
            <PortalCard key={doc.id} padding="md">
              <div className="flex items-start gap-4">
                {doc.imageUrl ? (
                  <img src={doc.imageUrl} alt={doc.name} className="w-14 h-14 rounded-full object-cover shrink-0 border border-[var(--line)]"
                    onError={e => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/56?text=Dr'; }} />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-[var(--paper2)] border border-[var(--line)] shrink-0 flex items-center justify-center text-[var(--muted)]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-[var(--ink)]">{doc.name}</h4>
                  {doc.credential && <p className="text-xs text-[var(--muted)] mt-0.5">{doc.credential}</p>}
                  {doc.title && <p className="text-sm text-[var(--ink2)] mt-1">{doc.title}</p>}
                  {doc.yearsExperience && <p className="text-xs text-[var(--muted)] mt-1">{doc.yearsExperience} years experience</p>}
                  {doc.specialties?.length ? (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {doc.specialties.slice(0, 3).map(s => (
                        <span key={s} className="text-xs bg-[var(--paper2)] text-[var(--ink2)] px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => startEdit(doc)} className="p-2 text-xs text-[var(--muted)] hover:text-[var(--ink)] transition-colors">Edit</button>
                  <button onClick={() => handleDelete(doc.id)} disabled={deletingId === doc.id} className="p-2 text-xs text-red-500 hover:text-red-600 transition-colors disabled:opacity-50">
                    {deletingId === doc.id ? '...' : 'Remove'}
                  </button>
                </div>
              </div>
            </PortalCard>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PortalTeamManager() {
  return <TeamContent />;
}