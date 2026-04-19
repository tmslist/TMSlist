import { useState, useCallback } from 'react';

interface AvailabilitySlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

interface AppointmentSlot {
  id: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

interface Booking {
  id: string;
  patientName: string;
  scheduledAt: string;
  durationMinutes: number;
  status: string;
  type: string;
}

interface DoctorSchedulingProps {
  doctorId?: string;
  initialSlots?: AvailabilitySlot[];
  initialBookings?: Booking[];
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = Math.floor(i / 2) + 8;
  const m = (i % 2) * 30;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
});

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${suffix}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

type ViewMode = 'week' | 'month';
type CalendarDay = {
  date: Date;
  slots: AvailabilitySlot[];
  bookings: Booking[];
};

export default function DoctorScheduling({ doctorId, initialSlots = [], initialBookings = [] }: DoctorSchedulingProps) {
  const [slots, setSlots] = useState<AvailabilitySlot[]>(initialSlots);
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [loading, setLoading] = useState(!doctorId);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [newSlot, setNewSlot] = useState({ dayOfWeek: 1, startTime: '09:00', endTime: '10:00' });

  const loadData = useCallback(async () => {
    if (!doctorId) { setLoading(false); return; }
    try {
      const [availRes, apptRes] = await Promise.all([
        fetch('/api/doctor/availability'),
        fetch('/api/doctor/appointments'),
      ]);
      if (availRes.ok && apptRes.ok) {
        const [availData, apptData] = await Promise.all([availRes.json(), apptRes.json()]);
        setSlots(availData.slots || []);
        setBookings((apptData.appointments || []).map((a: Booking) => ({
          id: a.id,
          patientName: a.patientName,
          scheduledAt: a.scheduledAt,
          durationMinutes: a.durationMinutes,
          status: a.status,
          type: a.appointmentType,
        })));
      } else {
        setError('Failed to load scheduling data');
      }
    } catch {
      setError('Failed to load scheduling data');
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  if (doctorId && !loading && slots.length === 0 && bookings.length === 0) {
    loadData();
  }

  const getWeekDays = useCallback(() => {
    const days: CalendarDay[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const daySlots = slots.filter(s => s.dayOfWeek === date.getDay());
      const dayBookings = bookings.filter(b => b.scheduledAt.startsWith(dateStr));
      days.push({ date, slots: daySlots, bookings: dayBookings });
    }
    return days;
  }, [currentWeekStart, slots, bookings]);

  const weekDays = getWeekDays();

  const navigateWeek = (dir: number) => {
    setCurrentWeekStart(prev => {
      const next = new Date(prev);
      next.setDate(next.getDate() + dir * 7);
      return next;
    });
  };

  const handleAddSlot = async () => {
    try {
      const res = await fetch('/api/doctor/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayOfWeek: newSlot.dayOfWeek,
          startTime: newSlot.startTime,
          endTime: newSlot.endTime,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const added: AvailabilitySlot = {
          id: data.id,
          dayOfWeek: newSlot.dayOfWeek,
          startTime: newSlot.startTime,
          endTime: newSlot.endTime,
          isAvailable: true,
        };
        setSlots(prev => [...prev, added]);
        setShowAddSlot(false);
        setNewSlot({ dayOfWeek: 1, startTime: '09:00', endTime: '10:00' });
        setMsg('Time slot added.');
        setTimeout(() => setMsg(''), 3000);
      } else {
        setError('Failed to add slot');
      }
    } catch {
      setError('Failed to add slot');
    }
  };

  const handleToggleSlot = async (id: string, isAvailable: boolean) => {
    try {
      const res = await fetch('/api/doctor/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isAvailable: !isAvailable }),
      });
      if (res.ok) {
        setSlots(prev => prev.map(s => s.id === id ? { ...s, isAvailable: !isAvailable } : s));
      }
    } catch {
      setError('Failed to update slot');
    }
  };

  const handleDeleteSlot = async (id: string) => {
    try {
      const res = await fetch(`/api/doctor/availability?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSlots(prev => prev.filter(s => s.id !== id));
        setMsg('Slot removed.');
        setTimeout(() => setMsg(''), 3000);
      }
    } catch {
      setError('Failed to delete slot');
    }
  };

  const handleBlockTime = async (date: Date, startTime: string, endTime: string) => {
    try {
      const res = await fetch('/api/doctor/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayOfWeek: date.getDay(), startTime, endTime }),
      });
      if (res.ok) {
        const data = await res.json();
        setSlots(prev => [...prev, {
          id: data.id,
          dayOfWeek: date.getDay(),
          startTime,
          endTime,
          isAvailable: false,
        }]);
        setMsg('Time blocked.');
        setTimeout(() => setMsg(''), 3000);
      }
    } catch {
      setError('Failed to block time');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigateWeek(-1)} className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-[200px] text-center">
            {weekDays[0]?.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} —{' '}
            {weekDays[6]?.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <button onClick={() => navigateWeek(1)} className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={() => {
              const d = new Date();
              d.setDate(d.getDate() - d.getDay());
              d.setHours(0, 0, 0, 0);
              setCurrentWeekStart(d);
            }}
            className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium"
          >
            Today
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button onClick={() => setViewMode('week')} className={`px-3 py-1.5 text-xs font-medium ${viewMode === 'week' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              Week
            </button>
            <button onClick={() => setViewMode('month')} className={`px-3 py-1.5 text-xs font-medium ${viewMode === 'month' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              Month
            </button>
          </div>
          <button
            onClick={() => setShowAddSlot(true)}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            + Add Slot
          </button>
        </div>
      </div>

      {msg && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">{msg}</div>}
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">{error}</div>}

      {/* Weekly Calendar Grid */}
      {viewMode === 'week' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-200">
            {weekDays.map((day, i) => {
              const isToday = day.date.toDateString() === new Date().toDateString();
              return (
                <div key={i} className={`px-3 py-3 text-center border-r border-gray-100 last:border-r-0 ${isToday ? 'bg-blue-50' : ''}`}>
                  <p className="text-xs text-gray-400 uppercase">{DAYS[day.date.getDay()].slice(0, 3)}</p>
                  <p className={`text-sm font-semibold mt-0.5 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                    {day.date.getDate()}
                  </p>
                </div>
              );
            })}
          </div>
          {/* Time slots */}
          <div className="grid grid-cols-7 min-h-[200px]">
            {weekDays.map((day, i) => {
              const isToday = day.date.toDateString() === new Date().toDateString();
              const availableSlots = day.slots.filter(s => s.isAvailable);
              const blockedSlots = day.slots.filter(s => !s.isAvailable);
              const dayBookings = day.bookings;
              return (
                <div key={i} className={`px-2 py-3 border-r border-gray-100 last:border-r-0 ${isToday ? 'bg-blue-50/30' : ''}`}>
                  {/* Available slots */}
                  {availableSlots.map(slot => (
                    <div key={slot.id} className="mb-2 p-2 bg-green-50 border border-green-200 rounded-lg text-xs group relative">
                      <p className="font-medium text-green-700">{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</p>
                      <p className="text-green-600">Available</p>
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                        <button onClick={() => handleToggleSlot(slot.id, true)} className="p-0.5 rounded bg-amber-100 text-amber-600" title="Block">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                        </button>
                        <button onClick={() => handleDeleteSlot(slot.id)} className="p-0.5 rounded bg-red-100 text-red-600" title="Delete">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                  {/* Blocked slots */}
                  {blockedSlots.map(slot => (
                    <div key={slot.id} className="mb-2 p-2 bg-gray-100 border border-gray-300 rounded-lg text-xs group relative">
                      <p className="font-medium text-gray-500">{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</p>
                      <p className="text-gray-400">Blocked</p>
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                        <button onClick={() => handleToggleSlot(slot.id, false)} className="p-0.5 rounded bg-green-100 text-green-600" title="Unblock">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        </button>
                        <button onClick={() => handleDeleteSlot(slot.id)} className="p-0.5 rounded bg-red-100 text-red-600" title="Delete">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                  {/* Bookings */}
                  {dayBookings.map(b => (
                    <div key={b.id} className="mb-2 p-2 bg-blue-100 border border-blue-200 rounded-lg text-xs">
                      <p className="font-medium text-blue-700">{b.patientName}</p>
                      <p className="text-blue-600 text-[10px]">{new Date(b.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  ))}
                  {/* Block time button */}
                  <button
                    onClick={() => {
                      const now = new Date();
                      const start = `${now.getHours().toString().padStart(2, '0')}:00`;
                      const end = `${(now.getHours() + 1).toString().padStart(2, '0')}:00`;
                      handleBlockTime(day.date, start, end);
                    }}
                    className="w-full text-[10px] py-1 rounded border border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors"
                  >
                    + Block time
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Monthly View (simplified) */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-4 mb-6">
          <p className="text-sm text-gray-500 text-center">Monthly view — use week view above for detailed slot management</p>
          <div className="grid grid-cols-7 gap-1 mt-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-xs font-medium text-gray-400 py-2">{d}</div>
            ))}
            {Array.from({ length: 35 }, (_, i) => {
              const d = new Date(currentWeekStart);
              d.setDate(d.getDate() - d.getDay() + i);
              const hasSlots = slots.some(s => s.dayOfWeek === d.getDay());
              const hasBookings = bookings.some(b => b.scheduledAt.startsWith(d.toISOString().split('T')[0]));
              return (
                <div key={i} className={`aspect-square flex flex-col items-center justify-center rounded text-xs ${d.toDateString() === new Date().toDateString() ? 'bg-blue-50 ring-1 ring-blue-400' : ''}`}>
                  <span className="font-medium text-gray-700">{d.getDate()}</span>
                  {hasSlots && <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-0.5" />}
                  {hasBookings && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-0.5" />}
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 justify-center">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="text-xs text-gray-500">Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-blue-400" />
              <span className="text-xs text-gray-500">Booked</span>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Appointments */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-4">Upcoming Appointments</h2>
        {bookings.filter(b => new Date(b.scheduledAt) >= new Date()).length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <p className="text-gray-500 text-sm">No upcoming appointments</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings
              .filter(b => new Date(b.scheduledAt) >= new Date())
              .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
              .map(b => (
                <div key={b.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                      b.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                      b.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {b.patientName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{b.patientName}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(b.scheduledAt)} at {new Date(b.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        {' · '}{b.durationMinutes}min · {b.type.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    b.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                    b.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    b.status === 'completed' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Add Slot Modal */}
      {showAddSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAddSlot(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <button onClick={() => setShowAddSlot(false)} className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Add Time Slot</h3>
            <p className="text-sm text-gray-500 mb-6">Define a recurring weekly availability slot.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Day of Week</label>
                <select
                  value={newSlot.dayOfWeek}
                  onChange={e => setNewSlot(prev => ({ ...prev, dayOfWeek: Number(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Time</label>
                  <select
                    value={newSlot.startTime}
                    onChange={e => setNewSlot(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {HOURS.map(h => <option key={h} value={h}>{formatTime(h)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">End Time</label>
                  <select
                    value={newSlot.endTime}
                    onChange={e => setNewSlot(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {HOURS.filter(h => h > newSlot.startTime).map(h => <option key={h} value={h}>{formatTime(h)}</option>)}
                  </select>
                </div>
              </div>
              <button
                onClick={handleAddSlot}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Add Slot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}