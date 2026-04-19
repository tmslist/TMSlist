import { useState, useEffect, useCallback } from 'react';

interface HospitalPrivilege {
  id: string;
  doctorId: string;
  hospitalName: string;
  department: string | null;
  privilegesType: string | null;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  createdAt: string;
}

interface DoctorHospitalPrivilegesProps {
  doctorId?: string;
  clinicId?: string;
}

const STATUS_CONFIG = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  expired: { label: 'Expired', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
};

function getStatus(priv: HospitalPrivilege): 'active' | 'expired' | 'pending' {
  if (!priv.isActive) return 'expired';
  if (priv.endDate) {
    const end = new Date(priv.endDate);
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (end < now) return 'expired';
    if (end < thirtyDays) return 'pending';
  }
  return 'active';
}

function daysUntilExpiry(endDate: string | null): number | null {
  if (!endDate) return null;
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

export default function DoctorHospitalPrivileges({ doctorId, clinicId }: DoctorHospitalPrivilegesProps) {
  const [privileges, setPrivileges] = useState<HospitalPrivilege[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    hospitalName: '',
    department: '',
    privilegesType: '',
    startDate: '',
    endDate: '',
  });
  const [updating, setUpdating] = useState(false);

  const fetchPrivileges = useCallback(async () => {
    if (!doctorId && !clinicId) { setLoading(false); return; }
    try {
      const res = await fetch(`/api/doctor/hospital-privileges?clinicId=${clinicId || ''}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setPrivileges(data.privileges || []);
    } catch {
      setError('Failed to load hospital privileges');
    } finally {
      setLoading(false);
    }
  }, [doctorId, clinicId]);

  useEffect(() => {
    fetchPrivileges();
  }, [fetchPrivileges]);

  const createPrivilege = async () => {
    if (!form.hospitalName.trim()) return;
    setUpdating(true);
    try {
      const res = await fetch('/api/doctor/hospital-privileges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospitalName: form.hospitalName,
          department: form.department || undefined,
          privilegesType: form.privilegesType || undefined,
        }),
      });
      if (res.ok) {
        setShowModal(false);
        resetForm();
        fetchPrivileges();
      }
    } catch {
      setError('Failed to add hospital privilege');
    } finally {
      setUpdating(false);
    }
  };

  const updatePrivilege = async (id: string) => {
    setUpdating(true);
    try {
      const res = await fetch('/api/doctor/hospital-privileges', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          hospitalName: form.hospitalName,
          department: form.department || undefined,
          privilegesType: form.privilegesType || undefined,
        }),
      });
      if (res.ok) {
        setEditingId(null);
        resetForm();
        fetchPrivileges();
      }
    } catch {
      setError('Failed to update hospital privilege');
    } finally {
      setUpdating(false);
    }
  };

  const deletePrivilege = async (id: string) => {
    if (!confirm('Remove this hospital affiliation?')) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/doctor/hospital-privileges?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchPrivileges();
    } catch {
      setError('Failed to delete hospital privilege');
    } finally {
      setUpdating(false);
    }
  };

  const toggleActive = async (priv: HospitalPrivilege) => {
    setUpdating(true);
    try {
      const res = await fetch('/api/doctor/hospital-privileges', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: priv.id, verified: !priv.isActive }),
      });
      if (res.ok) fetchPrivileges();
    } catch {
      setError('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const startEdit = (priv: HospitalPrivilege) => {
    setEditingId(priv.id);
    setForm({
      hospitalName: priv.hospitalName,
      department: priv.department || '',
      privilegesType: priv.privilegesType || '',
      startDate: priv.startDate ? priv.startDate.split('T')[0] : '',
      endDate: priv.endDate ? priv.endDate.split('T')[0] : '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setForm({ hospitalName: '', department: '', privilegesType: '', startDate: '', endDate: '' });
  };

  const openNewModal = () => {
    resetForm();
    setEditingId(null);
    setShowModal(true);
  };

  const stats = {
    total: privileges.length,
    active: privileges.filter(p => getStatus(p) === 'active').length,
    pending: privileges.filter(p => getStatus(p) === 'pending').length,
    expired: privileges.filter(p => getStatus(p) === 'expired').length,
  };

  if (loading) return <div className="flex items-center justify-center min-h-[40vh]"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div>;

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">{error}</div>
      )}

      {/* Expiration alerts */}
      {privileges.filter(p => getStatus(p) === 'pending').length > 0 && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm font-semibold text-amber-800">Expiration Alerts</p>
          </div>
          {privileges.filter(p => getStatus(p) === 'pending').map(p => {
            const days = daysUntilExpiry(p.endDate);
            return (
              <p key={p.id} className="text-sm text-amber-700 ml-7">
                <span className="font-medium">{p.hospitalName}</span>
                {p.endDate && ` expires in ${days} day${days === 1 ? '' : 's'}`}
              </p>
            );
          })}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Affiliations', count: stats.total, color: 'text-gray-900' },
          { label: 'Active', count: stats.active, color: 'text-green-600' },
          { label: 'Expiring Soon', count: stats.pending, color: 'text-amber-600' },
          { label: 'Expired', count: stats.expired, color: 'text-red-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.count}</p>
          </div>
        ))}
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-900">Hospital Affiliations</h2>
        <button
          onClick={openNewModal}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          + Add Affiliation
        </button>
      </div>

      {/* Privileges list */}
      {privileges.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500 text-sm">No hospital affiliations added yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {privileges.map(priv => {
            const status = getStatus(priv);
            const cfg = STATUS_CONFIG[status];
            const days = daysUntilExpiry(priv.endDate);
            return (
              <div key={priv.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      status === 'active' ? 'bg-green-100' : status === 'pending' ? 'bg-amber-100' : 'bg-red-100'
                    }`}>
                      <svg className={`w-5 h-5 ${
                        status === 'active' ? 'text-green-600' : status === 'pending' ? 'text-amber-600' : 'text-red-600'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{priv.hospitalName}</p>
                      <p className="text-xs text-gray-500">{priv.department || 'General'}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${cfg.color}`}>
                    <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${cfg.dot}`} />
                    {cfg.label}
                  </span>
                </div>

                <div className="space-y-1.5 mb-4">
                  {priv.privilegesType && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      {priv.privilegesType}
                    </div>
                  )}
                  {priv.startDate && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Started {new Date(priv.startDate).toLocaleDateString()}
                    </div>
                  )}
                  {priv.endDate && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {status === 'expired' ? (
                        <span className="text-red-600">Expired {new Date(priv.endDate).toLocaleDateString()}</span>
                      ) : status === 'pending' ? (
                        <span className="text-amber-600">Expires in {days} day{days === 1 ? '' : 's'} ({new Date(priv.endDate).toLocaleDateString()})</span>
                      ) : (
                        <span>Expires {new Date(priv.endDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => toggleActive(priv)}
                    disabled={updating}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                      priv.isActive
                        ? 'text-gray-600 border border-gray-300 hover:bg-gray-50'
                        : 'text-white bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {priv.isActive ? 'Deactivate' : 'Reactivate'}
                  </button>
                  <button
                    onClick={() => startEdit(priv)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 border border-gray-300 hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deletePrivilege(priv.id)}
                    disabled={updating}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 ml-auto disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingId ? 'Edit Hospital Affiliation' : 'Add Hospital Affiliation'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Name *</label>
                <input
                  type="text"
                  value={form.hospitalName}
                  onChange={e => setForm(f => ({ ...f, hospitalName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="e.g. Memorial Hospital"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input
                  type="text"
                  value={form.department}
                  onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="e.g. Psychiatry, Neurology"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Privilege Type</label>
                <select
                  value={form.privilegesType}
                  onChange={e => setForm(f => ({ ...f, privilegesType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select type...</option>
                  <option value="Active Staff">Active Staff</option>
                  <option value="Courtesy Staff">Courtesy Staff</option>
                  <option value="Consulting Staff">Consulting Staff</option>
                  <option value="Admitting Privileges">Admitting Privileges</option>
                  <option value="Surgical Privileges">Surgical Privileges</option>
                  <option value="Telehealth Privileges">Telehealth Privileges</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => editingId ? updatePrivilege(editingId) : createPrivilege()}
                disabled={updating || !form.hospitalName.trim()}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {editingId ? 'Save Changes' : 'Add Affiliation'}
              </button>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
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
