import { useState, useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../lib/react-query';
import { PortalCard, PortalButton, LoadingScreen, ErrorScreen } from './PortalUI';

interface Location {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  openingHours: string[] | null;
  isActive: boolean;
  createdAt: string;
}

interface LocationFormData {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  openingHours: string;
}

function LocationsContent() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState<LocationFormData>({
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    email: '',
    openingHours: '',
  });

  async function fetchLocations() {
    try {
      setLoading(true);
      const res = await fetch('/api/portal/locations');
      if (!res.ok) throw new Error('Failed to load locations');
      const data = await res.json();
      setLocations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);

    const payload = {
      name: form.name,
      address: form.address || null,
      city: form.city || null,
      state: form.state || null,
      zip: form.zip || null,
      phone: form.phone || null,
      email: form.email || null,
      openingHours: form.openingHours ? form.openingHours.split('\n').filter(Boolean) : [],
      isActive: true,
    };

    try {
      const url = editingId ? `/api/portal/locations?id=${editingId}` : '/api/portal/locations';
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Save failed');
      }

      resetForm();
      fetchLocations();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this location? This action cannot be undone.')) return;
    setDeletingId(id);

    try {
      const res = await fetch(`/api/portal/locations?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setLocations(prev => prev.filter(l => l.id !== id));
    } catch {
      alert('Failed to delete location');
    } finally {
      setDeletingId(null);
    }
  }

  function startEdit(loc: Location) {
    setEditingId(loc.id);
    setForm({
      name: loc.name || '',
      address: loc.address || '',
      city: loc.city || '',
      state: loc.state || '',
      zip: loc.zip || '',
      phone: loc.phone || '',
      email: loc.email || '',
      openingHours: loc.openingHours?.join('\n') || '',
    });
    setShowAdd(true);
  }

  function resetForm() {
    setForm({ name: '', address: '', city: '', state: '', zip: '', phone: '', email: '', openingHours: '' });
    setShowAdd(false);
    setEditingId(null);
  }

  // Fetch on mount
  useEffect(() => {
    fetchLocations();
  }, []);

  if (loading && locations.length === 0) {
    return <LoadingScreen message="Loading locations..." />;
  }

  if (error && locations.length === 0) {
    return <ErrorScreen message={error} onRetry={fetchLocations} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[var(--muted)] text-sm">{locations.length} location{locations.length !== 1 ? 's' : ''} configured</p>
        </div>
        <PortalButton variant="primary" size="sm" onClick={() => { resetForm(); setShowAdd(true); }}>
          + Add Location
        </PortalButton>
      </div>

      {/* Add/Edit Form */}
      {showAdd && (
        <PortalCard padding="lg">
          <h3 className="text-lg font-semibold text-[var(--ink)] mb-4">
            {editingId ? 'Edit Location' : 'Add New Location'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[var(--ink2)] mb-1">Location Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Downtown Clinic"
                className="w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[var(--ink2)] mb-1">Street Address</label>
              <input
                type="text"
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                placeholder="123 Main St, Suite 100"
                className="w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--ink2)] mb-1">City</label>
              <input
                type="text"
                value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                placeholder="Johannesburg"
                className="w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--ink2)] mb-1">State</label>
                <input
                  type="text"
                  value={form.state}
                  onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                  placeholder="Gauteng"
                  className="w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--ink2)] mb-1">Zip</label>
                <input
                  type="text"
                  value={form.zip}
                  onChange={e => setForm(f => ({ ...f, zip: e.target.value }))}
                  placeholder="2000"
                  className="w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--ink2)] mb-1">Phone</label>
              <input
                type="text"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+27 10 123 4567"
                className="w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--ink2)] mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="info@clinic.com"
                className="w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[var(--ink2)] mb-1">Opening Hours <span className="text-[var(--muted)]">(one per line)</span></label>
              <textarea
                value={form.openingHours}
                onChange={e => setForm(f => ({ ...f, openingHours: e.target.value }))}
                placeholder="Mon–Fri: 8:00 AM – 5:00 PM&#10;Sat: 9:00 AM – 1:00 PM"
                rows={3}
                className="w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <PortalButton variant="primary" onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Location'}
            </PortalButton>
            <PortalButton variant="secondary" onClick={resetForm}>Cancel</PortalButton>
          </div>
        </PortalCard>
      )}

      {/* Locations List */}
      {locations.length === 0 && !showAdd ? (
        <PortalCard padding="lg">
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-[var(--paper2)] rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
              </svg>
            </div>
            <p className="text-[var(--muted)] text-sm">No locations yet</p>
            <p className="text-[var(--muted)] text-xs mt-1">Add your clinic's locations to appear across multiple areas.</p>
          </div>
        </PortalCard>
      ) : (
        <div className="space-y-3">
          {locations.map(loc => (
            <PortalCard key={loc.id} padding="md">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-[var(--ink)]">{loc.name}</h4>
                  {loc.address && (
                    <p className="text-sm text-[var(--muted)] mt-1">
                      {[loc.address, loc.city, loc.state, loc.zip].filter(Boolean).join(', ')}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-[var(--muted)]">
                    {loc.phone && <span>{loc.phone}</span>}
                    {loc.email && <span>{loc.email}</span>}
                    {loc.openingHours?.length > 0 && (
                      <span className="text-[var(--ink2)]">{loc.openingHours.length} hours entries</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => startEdit(loc)}
                    className="p-2 text-xs text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(loc.id)}
                    disabled={deletingId === loc.id}
                    className="p-2 text-xs text-red-500 hover:text-red-600 transition-colors disabled:opacity-50"
                  >
                    {deletingId === loc.id ? '...' : 'Remove'}
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

export default function PortalLocations() {
  return (
    <QueryClientProvider client={queryClient}>
      <LocationsContent />
    </QueryClientProvider>
  );
}