import { useState, useEffect } from 'react';
import { PortalCard, PortalButton, PortalInput, PortalTextarea, LoadingScreen, ErrorScreen } from './PortalUI';

interface Service {
  id: string;
  type: 'machine' | 'specialty';
  name: string;
}

export default function PortalServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [machines, setMachines] = useState<string[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [newMachine, setNewMachine] = useState('');
  const [newSpecialty, setNewSpecialty] = useState('');

  useEffect(() => {
    fetch('/api/portal/services')
      .then(async r => {
        if (!r.ok) throw new Error('Failed to load services');
        const d = await r.json();
        setServices(d.data ?? []);
        setMachines((d.data ?? []).filter((s: Service) => s.type === 'machine').map((s: Service) => s.name));
        setSpecialties((d.data ?? []).filter((s: Service) => s.type === 'specialty').map((s: Service) => s.name));
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/api/portal/services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ machines, specialties }),
      });
      if (!res.ok) throw new Error('Save failed');
      setServices([
        ...machines.map(m => ({ id: `machine:${m}`, type: 'machine' as const, name: m })),
        ...specialties.map(s => ({ id: `specialty:${s}`, type: 'specialty' as const, name: s })),
      ]);
    } catch {
      alert('Failed to save services');
    } finally {
      setSaving(false);
    }
  }

  function addMachine() {
    if (!newMachine.trim() || machines.includes(newMachine.trim())) return;
    setMachines(prev => [...prev, newMachine.trim()]);
    setNewMachine('');
  }

  function addSpecialty() {
    if (!newSpecialty.trim() || specialties.includes(newSpecialty.trim())) return;
    setSpecialties(prev => [...prev, newSpecialty.trim()]);
    setNewSpecialty('');
  }

  function removeMachine(name: string) { setMachines(prev => prev.filter(m => m !== name)); }
  function removeSpecialty(name: string) { setSpecialties(prev => prev.filter(s => s !== name)); }

  if (loading) return <LoadingScreen message="Loading services..." />;
  if (error) return <ErrorScreen message={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="space-y-8">
      {/* TMS Machines */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--ink)] mb-3">TMS Machines & Devices</h3>
        <PortalCard padding="md">
          <div className="flex gap-3 mb-4">
            <PortalInput
              placeholder="e.g., NeuroStar, MagVenture, BrainsWay"
              value={newMachine}
              onChange={e => setNewMachine(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addMachine()}
              className="flex-1"
            />
            <PortalButton variant="primary" onClick={addMachine} disabled={!newMachine.trim()}>Add</PortalButton>
          </div>
          {machines.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No TMS machines added. Add the devices you use.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {machines.map(m => (
                <span key={m} className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-full text-sm font-medium">
                  {m}
                  <button onClick={() => removeMachine(m)} className="hover:text-blue-900 ml-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
        </PortalCard>
      </div>

      {/* Specialties */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--ink)] mb-3">Conditions & Specialties</h3>
        <PortalCard padding="md">
          <div className="flex gap-3 mb-4">
            <PortalInput
              placeholder="e.g., Depression, Anxiety, OCD, PTSD"
              value={newSpecialty}
              onChange={e => setNewSpecialty(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addSpecialty()}
              className="flex-1"
            />
            <PortalButton variant="primary" onClick={addSpecialty} disabled={!newSpecialty.trim()}>Add</PortalButton>
          </div>
          {specialties.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No specialties added. Add the conditions you treat.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {specialties.map(s => (
                <span key={s} className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-700 border border-violet-200 px-3 py-1.5 rounded-full text-sm font-medium">
                  {s}
                  <button onClick={() => removeSpecialty(s)} className="hover:text-violet-900 ml-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
        </PortalCard>
      </div>

      <PortalButton variant="primary" onClick={save} disabled={saving} loading={saving}>
        {saving ? 'Saving...' : 'Save Changes'}
      </PortalButton>
    </div>
  );
}