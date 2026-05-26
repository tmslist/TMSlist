import { useState, useEffect } from 'react';

interface Appointment {
  id: string;
  patientName: string;
  patientEmail: string | null;
  patientPhone: string | null;
  appointmentType: string;
  durationMinutes: number;
  scheduledAt: string;
  status: string;
  notes: string | null;
}

interface WaitlistEntry {
  id: string;
  patientName: string;
  patientEmail: string | null;
  patientPhone: string | null;
  createdAt: string;
}

interface DoctorAppointmentsProps {
  doctorId?: string;
}

type TabKey = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'waitlist';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending', confirmed: 'Confirmed', completed: 'Completed',
  cancelled: 'Cancelled', no_show: 'No-show',
};
const STATUS_BADGES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-[rgba(10,22,40,0.1)] text-[var(--ink)]',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  no_show: 'bg-[var(--paper2)] text-[var(--ink2)]',
};

const TABS: TabKey[] = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show', 'waitlist'];

export default function DoctorAppointments({ doctorId }: DoctorAppointmentsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('pending');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => {
    if (!doctorId) { setLoading(false); return; }
    fetch(`/api/doctor/appointments`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { setAppointments(d.appointments || []); setWaitlist(d.waitlist || []); setLoading(false); })
      .catch(() => { setError('Failed to load'); setLoading(false); });
  }, [doctorId]);

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/doctor/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
        setActionMsg(`Appointment ${status}`);
        setTimeout(() => setActionMsg(''), 3000);
      }
    } catch {
      setError('Failed to update');
    }
  };

  const filtered = activeTab === 'waitlist' ? [] : appointments.filter(a => a.status === activeTab);
  const waitlistFiltered = activeTab === 'waitlist' ? waitlist : [];

  if (loading) return <div className="flex items-center justify-center min-h-[40vh]"><div className="w-8 h-8 border-4 border-[var(--line)] border-t-blue-600 rounded-full animate-spin" /></div>;

  return (
    <div>
      {actionMsg && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">{actionMsg}</div>}
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">{error}</div>}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab ? 'bg-[var(--ink)] text-white' : 'bg-white text-[var(--ink2)] border border-[var(--line)] hover:bg-[var(--paper2)]'}`}>
            {tab === 'no_show' ? 'No-show' : STATUS_LABELS[tab] || tab}
            {tab !== 'waitlist' && <span className="ml-1.5 text-xs opacity-70">({appointments.filter(a => a.status === tab).length})</span>}
            {tab === 'waitlist' && <span className="ml-1.5 text-xs opacity-70">({waitlist.length})</span>}
          </button>
        ))}
      </div>

      {activeTab !== 'waitlist' ? (
        filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-[var(--line)] p-8 text-center">
            <p className="text-[var(--muted)] text-sm">No {STATUS_LABELS[activeTab].toLowerCase()} appointments</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[var(--line)] shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--paper2)] border-b border-[var(--line)]">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-[var(--ink2)]">Patient</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--ink2)]">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--ink2)]">Date/Time</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--ink2)]">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--ink2)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(apt => (
                  <tr key={apt.id} className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--paper2)]">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--ink)]">{apt.patientName}</p>
                      {apt.patientEmail && <p className="text-xs text-[var(--muted)]">{apt.patientEmail}</p>}
                      {apt.patientPhone && <p className="text-xs text-[var(--muted)]">{apt.patientPhone}</p>}
                    </td>
                    <td className="px-4 py-3 capitalize">{apt.appointmentType.replace('_', ' ')}</td>
                    <td className="px-4 py-3">{new Date(apt.scheduledAt).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_BADGES[apt.status]}`}>{STATUS_LABELS[apt.status]}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {apt.status === 'pending' && (
                          <>
                            <button onClick={() => handleStatusUpdate(apt.id, 'confirmed')} className="text-xs px-3 py-1 rounded-lg bg-[var(--paper2)] text-[var(--ink)] hover:bg-[rgba(10,22,40,0.1)] font-medium">Confirm</button>
                            <button onClick={() => handleStatusUpdate(apt.id, 'cancelled')} className="text-xs px-3 py-1 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 font-medium">Decline</button>
                          </>
                        )}
                        {apt.status === 'confirmed' && (
                          <>
                            <button onClick={() => handleStatusUpdate(apt.id, 'completed')} className="text-xs px-3 py-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 font-medium">Complete</button>
                            <button onClick={() => handleStatusUpdate(apt.id, 'no_show')} className="text-xs px-3 py-1 rounded-lg bg-[var(--paper2)] text-[var(--ink2)] hover:bg-[var(--paper2)] font-medium">No-show</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        waitlistFiltered.length === 0 ? (
          <div className="bg-white rounded-xl border border-[var(--line)] p-8 text-center">
            <p className="text-[var(--muted)] text-sm">No waitlist entries</p>
          </div>
        ) : (
          <div className="space-y-3">
            {waitlistFiltered.map((w, i) => (
              <div key={w.id} className="bg-white rounded-xl border border-[var(--line)] p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[var(--ink)]">{w.patientName}</p>
                    {w.patientEmail && <p className="text-xs text-[var(--muted)]">{w.patientEmail}</p>}
                    {w.patientPhone && <p className="text-xs text-[var(--muted)]">{w.patientPhone}</p>}
                    <p className="text-xs text-[var(--muted)] mt-1">#{i + 1} in queue &middot; {new Date(w.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[var(--ink)] hover:bg-[var(--ink)]">Notify</button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
