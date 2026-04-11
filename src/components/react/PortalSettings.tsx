import { useState, useEffect } from 'react';

interface UserProfile {
  email: string;
  name: string;
  role: string;
  clinicId: string | null;
  clinicName: string | null;
  lastLoginAt: string | null;
  createdAt: string | null;
}

export default function PortalSettings({ userEmail, userId }: { userEmail: string; userId: string }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/portal/settings')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load');
        return res.json();
      })
      .then(data => {
        setProfile(data);
        setName(data.name || '');
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load account settings');
        setLoading(false);
      });
  }, []);

  async function handleSave() {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/portal/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setSuccess('Settings updated successfully');
      setTimeout(() => setSuccess(''), 5000);
    } catch {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/portal/login';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <a href="/portal/dashboard/" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium mb-2 inline-block">
            &larr; Back to Dashboard
          </a>
          <h1 className="text-2xl font-semibold text-gray-900">Account Settings</h1>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">{error}</div>
      )}
      {success && (
        <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm">{success}</div>
      )}

      <div className="space-y-6">
        {/* Account Info */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={userEmail}
                disabled
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed. Contact support if needed.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 capitalize">
                  {profile?.role?.replace('_', ' ') || 'Clinic Owner'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
                <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </section>

        {/* Linked Clinic */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Linked Clinic</h2>
          {profile?.clinicName ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{profile.clinicName}</p>
                <p className="text-sm text-gray-500">Clinic ID: {profile.clinicId}</p>
              </div>
              <a href="/portal/clinic/" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                Edit Clinic &rarr;
              </a>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 text-sm mb-3">No clinic linked to your account.</p>
              <a href="/portal/claim/" className="text-sm text-emerald-600 hover:text-emerald-700 font-semibold">
                Claim Your Clinic &rarr;
              </a>
            </div>
          )}
        </section>

        {/* Session */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Session</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                Last login: {profile?.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString() : 'N/A'}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-white rounded-xl border border-red-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-red-700 mb-2">Danger Zone</h2>
          <p className="text-sm text-gray-500 mb-4">
            To delete your account or transfer clinic ownership, please contact support at{' '}
            <a href="mailto:support@tmslist.com" className="text-emerald-600 hover:underline">support@tmslist.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
