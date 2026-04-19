'use client';
import { useState, useCallback } from 'react';

interface WaitlistEntry {
  id: string;
  position: number;
  email: string;
  patientName: string;
  status: 'waiting' | 'notified' | 'enrolled';
  joinedAt: string;
  notifiedAt?: string;
}

interface DoctorWaitlistProps {
  initialEntries?: WaitlistEntry[];
  doctorId?: string;
}

export default function DoctorWaitlist({ initialEntries = [], doctorId }: DoctorWaitlistProps) {
  const [entries, setEntries] = useState<WaitlistEntry[]>(initialEntries.length > 0 ? initialEntries : [
    { id: '1', position: 1, email: 'patient1@example.com', patientName: 'Sarah M.', status: 'waiting', joinedAt: '2024-04-15T10:00:00Z' },
    { id: '2', position: 2, email: 'patient2@example.com', patientName: 'John D.', status: 'notified', joinedAt: '2024-04-14T14:30:00Z', notifiedAt: '2024-04-18T09:00:00Z' },
    { id: '3', position: 3, email: 'patient3@example.com', patientName: 'Emily R.', status: 'waiting', joinedAt: '2024-04-12T08:00:00Z' },
    { id: '4', position: 4, email: 'patient4@example.com', patientName: 'Michael T.', status: 'waiting', joinedAt: '2024-04-10T16:00:00Z' },
    { id: '5', position: 5, email: 'patient5@example.com', patientName: 'Lisa K.', status: 'enrolled', joinedAt: '2024-04-08T11:00:00Z' },
  ]);

  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<WaitlistEntry | null>(null);

  const waitingCount = entries.filter(e => e.status === 'waiting').length;
  const notifiedCount = entries.filter(e => e.status === 'notified').length;

  const handleNotify = useCallback(async (entryId: string) => {
    setEntries(prev => prev.map(e =>
      e.id === entryId
        ? { ...e, status: 'notified' as const, notifiedAt: new Date().toISOString() }
        : e
    ));
  }, []);

  const handleEnroll = useCallback(async (entryId: string) => {
    setEntries(prev => prev.map(e =>
      e.id === entryId ? { ...e, status: 'enrolled' as const } : e
    ));
  }, []);

  const handleRemove = useCallback(async (entryId: string) => {
    setEntries(prev => prev.filter(e => e.id !== entryId).map((e, idx) => ({
      ...e,
      position: idx + 1,
    })));
  }, []);

  const handleAddEntry = useCallback((email: string, name: string) => {
    const newEntry: WaitlistEntry = {
      id: Date.now().toString(),
      position: entries.length + 1,
      email,
      patientName: name,
      status: 'waiting',
      joinedAt: new Date().toISOString(),
    };
    setEntries(prev => [...prev, newEntry]);
    setShowAddModal(false);
  }, [entries.length]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Patient Waitlist</h2>
          <p className="text-sm text-gray-500 mt-1">Manage patients waiting for appointment openings</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Patient
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Waitlist</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{entries.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Waiting</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{waitingCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Notified</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{notifiedCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Enrolled</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{entries.filter(e => e.status === 'enrolled').length}</p>
        </div>
      </div>

      {/* Waitlist Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Waitlist Queue</h3>
          {entries.length > 0 && (
            <p className="text-xs text-gray-500">Position 1 is next to be notified</p>
          )}
        </div>
        {entries.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">No patients on the waitlist yet.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Add the first patient
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Position</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Patient</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Email</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Joined</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Status</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          entry.position === 1 ? 'bg-blue-600 text-white' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {entry.position}
                        </span>
                        {entry.position === 1 && (
                          <span className="text-xs text-blue-600 font-medium">Next</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-medium text-gray-900">{entry.patientName}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-600">{entry.email}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-500">
                        {new Date(entry.joinedAt).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        entry.status === 'enrolled' ? 'bg-emerald-100 text-emerald-700' :
                        entry.status === 'notified' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {entry.status === 'enrolled' ? 'Enrolled' :
                         entry.status === 'notified' ? 'Notified' :
                         'Waiting'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {entry.status === 'waiting' && (
                          <button
                            onClick={() => handleNotify(entry.id)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap"
                          >
                            Notify
                          </button>
                        )}
                        {entry.status === 'notified' && (
                          <button
                            onClick={() => handleEnroll(entry.id)}
                            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium whitespace-nowrap"
                          >
                            Enroll
                          </button>
                        )}
                        <button
                          onClick={() => handleRemove(entry.id)}
                          className="text-xs text-red-600 hover:text-red-700 font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <AddPatientModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddEntry}
        />
      )}
    </div>
  );
}

function AddPatientModal({ onClose, onAdd }: { onClose: () => void; onAdd: (email: string, name: string) => void }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && name) {
      onAdd(email, name);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 z-10">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Patient to Waitlist</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Jane Smith"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="patient@example.com"
              required
            />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add to Waitlist
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}