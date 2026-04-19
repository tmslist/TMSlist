import { useState } from 'react';

interface DoctorSettingsProps {
  userEmail: string;
  userId: string;
}

interface NotificationPrefs {
  newLead: boolean;
  newReview: boolean;
  appointmentRequest: boolean;
  weeklyDigest: boolean;
}

export default function DoctorSettings({ userEmail, userId }: DoctorSettingsProps) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [prefs, setPrefs] = useState<NotificationPrefs>({ newLead: true, newReview: true, appointmentRequest: true, weeklyDigest: false });
  const [emailSig, setEmailSig] = useState('');
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdError, setPwdError] = useState('');

  const togglePref = (key: keyof NotificationPrefs) => setPrefs(p => ({ ...p, [key]: !p[key] }));

  const saveProfile = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/portal/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error('Save failed');
      setSuccess('Profile saved');
    } catch {
      setError('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    setPwdError('');
    if (!currentPwd) { setPwdError('Current password required'); return; }
    if (newPwd.length < 8) { setPwdError('Password must be at least 8 characters'); return; }
    if (newPwd !== confirmPwd) { setPwdError('Passwords do not match'); return; }
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
      });
      if (!res.ok) { const d = await res.json(); setPwdError(d.error || 'Failed'); return; }
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
      setSuccess('Password changed');
    } catch {
      setPwdError('Failed to change password');
    }
  };

  const T = ({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) => (
    <label className="flex items-center justify-between py-2 cursor-pointer">
      <span className="text-sm text-gray-700">{label}</span>
      <button onClick={onChange} role="switch" aria-checked={checked}
        className={`relative w-10 h-6 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-200'}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-4' : ''}`} />
      </button>
    </label>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      {success && <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">{success}</div>}
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">{error}</div>}

      {/* Profile */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile</h2>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input value={userEmail} disabled className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500" />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
        </div>
        <button onClick={saveProfile} disabled={saving} className="px-6 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">Save</button>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h2>
        <div className="divide-y divide-gray-100">
          <T checked={prefs.newLead} onChange={() => togglePref('newLead')} label="New patient enquiries" />
          <T checked={prefs.newReview} onChange={() => togglePref('newReview')} label="New reviews" />
          <T checked={prefs.appointmentRequest} onChange={() => togglePref('appointmentRequest')} label="Appointment requests" />
          <T checked={prefs.weeklyDigest} onChange={() => togglePref('weeklyDigest')} label="Weekly digest email" />
        </div>
      </div>

      {/* Email Signature */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Email Signature</h2>
        <textarea value={emailSig} onChange={e => setEmailSig(e.target.value)} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="Your professional email signature..." />
        <button onClick={() => {}} className="mt-3 px-6 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700">Save Signature</button>
      </div>

      {/* Password Change */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>
        {pwdError && <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">{pwdError}</div>}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </div>
          <button onClick={changePassword} className="px-6 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700">Update Password</button>
        </div>
      </div>
    </div>
  );
}
