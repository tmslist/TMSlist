import { useState, useEffect } from 'react';

interface AvailabilitySlot {
  id: string;
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface DoctorAvailabilityProps {
  doctorId?: string;
  initialSlots: AvailabilitySlot[];
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SLOT_COLORS: Record<string, string> = {
  available: 'bg-green-100 border-green-300 text-green-700',
  blocked: 'bg-gray-100 border-gray-300 text-gray-500',
};

function timeOptions() {
  const opts = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour = String(h).padStart(2, '0');
      const minute = String(m).padStart(2, '0');
      opts.push(`${hour}:${minute}`);
    }
  }
  return opts;
}

const TIMES = timeOptions();

export default function DoctorAvailability({ doctorId, initialSlots }: DoctorAvailabilityProps) {
  const [slots, setSlots] = useState<AvailabilitySlot[]>(initialSlots || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const slotsByDay = DAYS.map((_, dayIdx) => slots.filter(s => s.dayOfWeek === dayIdx && s.isActive));

  const addSlot = async (dayOfWeek: number) => {
    if (!doctorId) return;
    const slot = { id: `new-${Date.now()}`, doctorId, dayOfWeek, startTime: '09:00', endTime: '17:00', isActive: true };
    setSlots([...slots, slot]);
    try {
      const res = await fetch('/api/doctor/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayOfWeek, startTime: '09:00', endTime: '17:00' }),
      });
      if (res.ok) {
        const data = await res.json();
        setSlots(prev => prev.map(s => s.id === slot.id ? { ...s, id: data.id } : s));
      }
    } catch {
      setError('Failed to add slot');
    }
  };

  const updateSlot = (id: string, field: keyof AvailabilitySlot, value: unknown) => {
    setSlots(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const deleteSlot = async (id: string) => {
    setSlots(prev => prev.filter(s => s.id !== id));
    if (!id.startsWith('new-')) {
      try {
        await fetch(`/api/doctor/availability?id=${id}`, { method: 'DELETE' });
      } catch {
        setError('Failed to delete slot');
      }
    }
  };

  const saveAll = async () => {
    setSaving(true);
    setError('');
    try {
      for (const slot of slots) {
        if (!slot.id.startsWith('new-')) {
          await fetch('/api/doctor/availability', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: slot.id, startTime: slot.startTime, endTime: slot.endTime, isActive: slot.isActive }),
          });
        }
      }
    } catch {
      setError('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!doctorId) {
    return <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">No doctor account linked. Please contact an administrator.</div>;
  }

  return (
    <div>
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3 mb-6">
        {DAYS.map((day, dayIdx) => (
          <div key={day} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-900">{day.slice(0, 3)}</span>
              <button onClick={() => addSlot(dayIdx)} className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 text-lg leading-none flex items-center justify-center">+</button>
            </div>
            <div className="space-y-2">
              {slotsByDay[dayIdx].map(slot => (
                <div key={slot.id} className="bg-green-50 border border-green-200 rounded-lg p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-green-700">{slot.startTime} - {slot.endTime}</span>
                    <button onClick={() => deleteSlot(slot.id)} className="text-red-400 hover:text-red-600 text-xs">X</button>
                  </div>
                  <select
                    value={slot.startTime}
                    onChange={e => updateSlot(slot.id, 'startTime', e.target.value)}
                    className="w-full text-xs px-1 py-1 border border-green-200 rounded focus:outline-none focus:border-green-400 mb-1"
                  >
                    {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <select
                    value={slot.endTime}
                    onChange={e => updateSlot(slot.id, 'endTime', e.target.value)}
                    className="w-full text-xs px-1 py-1 border border-green-200 rounded focus:outline-none focus:border-green-400"
                  >
                    {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              ))}
              {slotsByDay[dayIdx].length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">No slots</p>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <button onClick={saveAll} disabled={saving} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Schedule'}
        </button>
      </div>
    </div>
  );
}
