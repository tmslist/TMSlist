import { useState, useEffect, useCallback } from 'react';

interface Referral {
  id: string;
  referringDoctorId: string;
  referredDoctorId: string;
  patientId: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
}

interface DoctorReferralsProps {
  doctorId?: string;
  clinicId?: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  accepted: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  sent: 'bg-blue-100 text-blue-700',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  completed: 'Completed',
  rejected: 'Rejected',
  sent: 'Sent',
};

export default function DoctorReferrals({ doctorId, clinicId }: DoctorReferralsProps) {
  const [given, setGiven] = useState<Referral[]>([]);
  const [received, setReceived] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'given' | 'received'>('given');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newNotes, setNewNotes] = useState('');
  const [newStatus, setNewStatus] = useState('pending');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchReferrals = useCallback(async () => {
    if (!doctorId && !clinicId) { setLoading(false); return; }
    try {
      const res = await fetch(`/api/doctor/referrals?clinicId=${clinicId || ''}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      const all: Referral[] = data.referrals || [];
      // given = referringDoctorId === doctorId
      const myId = data.doctorId || doctorId;
      setGiven(all.filter((r: Referral) => r.referringDoctorId === myId));
      setReceived(all.filter((r: Referral) => r.referredDoctorId === myId));
    } catch {
      setError('Failed to load referrals');
    } finally {
      setLoading(false);
    }
  }, [doctorId, clinicId]);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  const createReferral = async () => {
    setUpdating(true);
    try {
      const res = await fetch('/api/doctor/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: newNotes, status: newStatus }),
      });
      if (res.ok) {
        setShowNewModal(false);
        setNewNotes('');
        setNewStatus('pending');
        fetchReferrals();
      }
    } catch {
      setError('Failed to create referral');
    } finally {
      setUpdating(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    setUpdating(true);
    try {
      const res = await fetch('/api/doctor/referrals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) fetchReferrals();
    } catch {
      setError('Failed to update referral');
    } finally {
      setUpdating(false);
    }
  };

  const startEdit = (ref: Referral) => {
    setEditingId(ref.id);
    setEditNotes(ref.notes || '');
  };

  const saveEdit = async (id: string) => {
    setUpdating(true);
    try {
      const res = await fetch('/api/doctor/referrals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, notes: editNotes }),
      });
      if (res.ok) {
        setEditingId(null);
        fetchReferrals();
      }
    } catch {
      setError('Failed to update notes');
    } finally {
      setUpdating(false);
    }
  };

  const currentList = activeTab === 'given' ? given : received;

  if (loading) return <div className="flex items-center justify-center min-h-[40vh]"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div>;

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">{error}</div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Given', count: given.length, color: 'text-blue-600' },
          { label: 'Received', count: received.length, color: 'text-purple-600' },
          { label: 'Pending', count: given.filter(r => r.status === 'pending').length + received.filter(r => r.status === 'pending').length, color: 'text-amber-600' },
          { label: 'Completed', count: given.filter(r => r.status === 'completed').length + received.filter(r => r.status === 'completed').length, color: 'text-green-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.count}</p>
          </div>
        ))}
      </div>

      {/* Tabs + action */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(['given', 'received'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'given' ? 'Referrals Given' : 'Referrals Received'}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          + New Referral
        </button>
      </div>

      {/* Referral list */}
      {currentList.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500 text-sm">No {activeTab === 'given' ? 'referrals given' : 'referrals received'} yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {currentList.map(ref => (
            <div key={ref.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                    activeTab === 'given' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {activeTab === 'given' ? '→' : '←'}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Referral</p>
                    <p className="text-sm font-medium text-gray-900">{ref.referredDoctorId ? `Doctor ID: ${ref.referredDoctorId.slice(0, 8)}...` : 'No doctor specified'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${STATUS_COLORS[ref.status] || 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABELS[ref.status] || ref.status}
                  </span>
                  <span className="text-xs text-gray-400">{new Date(ref.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {ref.notes && (
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Notes</p>
                  <p className="text-sm text-gray-700">{ref.notes}</p>
                </div>
              )}

              {/* Edit notes */}
              {editingId === ref.id ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <textarea
                    value={editNotes}
                    onChange={e => setEditNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 mb-2"
                    placeholder="Add referral notes..."
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(ref.id)}
                      disabled={updating}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    >
                      Save Notes
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="flex gap-2 mt-3">
                {ref.status === 'pending' && (
                  <>
                    <button
                      onClick={() => updateStatus(ref.id, 'accepted')}
                      disabled={updating}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    >
                      Mark Accepted
                    </button>
                    <button
                      onClick={() => updateStatus(ref.id, 'completed')}
                      disabled={updating}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    >
                      Mark Completed
                    </button>
                    <button
                      onClick={() => updateStatus(ref.id, 'rejected')}
                      disabled={updating}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </>
                )}
                {ref.status === 'accepted' && (
                  <button
                    onClick={() => updateStatus(ref.id, 'completed')}
                    disabled={updating}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    Mark Completed
                  </button>
                )}
                <button
                  onClick={() => startEdit(ref)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 ml-auto"
                >
                  Edit Notes
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New referral modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowNewModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">New Referral</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Referral details, patient info, reason for referral..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Status</label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="pending">Pending</option>
                  <option value="sent">Sent</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={createReferral}
                disabled={updating}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                Create Referral
              </button>
              <button
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
