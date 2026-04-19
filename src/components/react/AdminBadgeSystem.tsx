import { useState, useEffect, useCallback } from 'react';

interface ClinicBadge {
  id: string;
  clinicId: string;
  clinicName: string;
  badgeType: string;
  awardedAt: string;
}

interface DoctorBadge {
  id: string;
  doctorId: string;
  doctorName: string;
  badgeType: string;
  awardedAt: string;
}

interface LeaderboardEntry {
  rank: number;
  entityId: string;
  entityName: string;
  score: number;
}

interface Reward {
  id: string;
  name: string;
  pointsCost: number;
  type: string;
  stock?: number;
}

interface RedeemRequest {
  id: string;
  userId: string;
  userName: string;
  rewardName: string;
  pointsSpent: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

type TabKey = 'clinic_badges' | 'doctor_badges' | 'leaderboards' | 'points_store';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'clinic_badges', label: 'Clinic Badges' },
  { key: 'doctor_badges', label: 'Doctor Badges' },
  { key: 'leaderboards', label: 'Leaderboards' },
  { key: 'points_store', label: 'Points Store' },
];

const CLINIC_BADGE_TYPES = [
  { key: 'early_adopter', label: 'Early Adopter' },
  { key: 'top_rated', label: 'Top Rated' },
  { key: 'fast_responder', label: 'Fast Responder' },
  { key: '100_reviews', label: '100 Reviews' },
  { key: 'champion', label: 'Champion' },
];

const DOCTOR_BADGE_TYPES = [
  { key: 'npi_verified', label: 'NPI Verified' },
  { key: '100_plus_sessions', label: '100+ Sessions' },
  { key: 'rising_star', label: 'Rising Star' },
  { key: 'patients_choice', label: "Patient's Choice" },
  { key: 'top_contributor', label: 'Top Contributor' },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function AdminBadgeSystem() {
  const [tab, setTab] = useState<TabKey>('clinic_badges');
  const [clinicBadges, setClinicBadges] = useState<ClinicBadge[]>([]);
  const [doctorBadges, setDoctorBadges] = useState<DoctorBadge[]>([]);
  const [leaderboards, setLeaderboards] = useState<{ type: string; period: string; entries: LeaderboardEntry[] }[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redeemRequests, setRedeemRequests] = useState<RedeemRequest[]>([]);
  const [clinics, setClinics] = useState<{ id: string; name: string }[]>([]);
  const [doctors, setDoctors] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [saving, setSaving] = useState(false);

  // Award form state
  const [awardEntityId, setAwardEntityId] = useState('');
  const [awardBadgeType, setAwardBadgeType] = useState('');
  const [bulkCity, setBulkCity] = useState('');
  const [bulkState, setBulkState] = useState('');

  // Reward form state
  const [rewardName, setRewardName] = useState('');
  const [rewardPoints, setRewardPoints] = useState('');
  const [rewardType, setRewardType] = useState('');
  const [rewardStock, setRewardStock] = useState('');

  // Leaderboard state
  const [lbType, setLbType] = useState('leads');
  const [lbPeriod, setLbPeriod] = useState('monthly');

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const endpoint = tab === 'clinic_badges' || tab === 'doctor_badges' ? '/api/admin/badges'
        : tab === 'leaderboards' ? '/api/admin/leaderboards'
        : '/api/admin/rewards';

      const res = await fetch(endpoint);
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to fetch data');

      const json = await res.json();
      if (tab === 'clinic_badges') setClinicBadges(json.data?.clinic || []);
      else if (tab === 'doctor_badges') setDoctorBadges(json.data?.doctor || []);
      else if (tab === 'leaderboards') setLeaderboards(json.data || []);
      else {
        setRewards(json.data?.rewards || []);
        setRedeemRequests(json.data?.redeems || []);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  const fetchEntities = useCallback(async () => {
    try {
      const [clinicsRes, doctorsRes] = await Promise.all([
        fetch('/api/admin/clinics?limit=1000'),
        fetch('/api/admin/doctors?limit=1000'),
      ]);
      if (clinicsRes.ok) {
        const json = await clinicsRes.json();
        setClinics(json.data || []);
      }
      if (doctorsRes.ok) {
        const json = await doctorsRes.json();
        setDoctors(json.data || []);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchData(); fetchEntities(); }, [fetchData, fetchEntities]);

  async function awardBadge() {
    if (!awardEntityId || !awardBadgeType) { showToast('error', 'Entity and badge type are required'); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/badges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityId: awardEntityId, entityType: tab === 'clinic_badges' ? 'clinic' : 'doctor', badgeType: awardBadgeType }),
      });
      if (!res.ok) throw new Error('Failed to award badge');

      showToast('success', 'Badge awarded');
      setShowAwardModal(false);
      setAwardEntityId('');
      setAwardBadgeType('');
      fetchData();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to award badge');
    } finally {
      setSaving(false);
    }
  }

  async function bulkAward() {
    if (!awardBadgeType) { showToast('error', 'Badge type is required'); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/badges/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ badgeType: awardBadgeType, entityType: tab === 'clinic_badges' ? 'clinic' : 'doctor', city: bulkCity, state: bulkState }),
      });
      if (!res.ok) throw new Error('Bulk award failed');

      const json = await res.json();
      showToast('success', `Awarded badge to ${json.awarded || 0} entities`);
      setShowAwardModal(false);
      fetchData();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Bulk award failed');
    } finally {
      setSaving(false);
    }
  }

  async function generateLeaderboard() {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/leaderboards/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: lbType, period: lbPeriod }),
      });
      if (!res.ok) throw new Error('Generation failed');
      showToast('success', 'Leaderboard generated');
      fetchData();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setSaving(false);
    }
  }

  function openRewardModal(reward?: Reward) {
    if (reward) {
      setEditingReward(reward);
      setRewardName(reward.name);
      setRewardPoints(String(reward.pointsCost));
      setRewardType(reward.type);
      setRewardStock(reward.stock !== undefined ? String(reward.stock) : '');
    } else {
      setEditingReward(null);
      setRewardName('');
      setRewardPoints('');
      setRewardType('');
      setRewardStock('');
    }
    setShowRewardModal(true);
  }

  async function saveReward() {
    if (!rewardName || !rewardPoints || !rewardType) { showToast('error', 'All fields are required'); return; }

    setSaving(true);
    try {
      const body = { name: rewardName, pointsCost: Number(rewardPoints), type: rewardType, stock: rewardStock ? Number(rewardStock) : undefined };
      const url = editingReward ? `/api/admin/rewards?id=${editingReward.id}` : '/api/admin/rewards';
      const method = editingReward ? 'PUT' : 'POST';

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Failed to save reward');

      showToast('success', `Reward ${editingReward ? 'updated' : 'created'}`);
      setShowRewardModal(false);
      fetchData();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to save reward');
    } finally {
      setSaving(false);
    }
  }

  async function handleRedeemAction(id: string, status: 'approved' | 'rejected') {
    try {
      const res = await fetch('/api/admin/rewards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error('Action failed');
      showToast('success', `Request ${status}`);
      fetchData();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Action failed');
    }
  }

  const currentLeaderboard = leaderboards.find(l => l.type === lbType && l.period === lbPeriod);

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.message}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-800 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700 text-xs font-medium ml-3">Dismiss</button>
        </div>
      )}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Badge System</h2>
          <p className="text-sm text-gray-500 mt-0.5">Gamification and rewards management</p>
        </div>
        <button onClick={fetchData} className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex gap-1 px-4 flex-wrap">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="inline-block w-8 h-8 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : tab === 'clinic_badges' || tab === 'doctor_badges' ? (
            <div>
              <div className="flex justify-end mb-4 gap-2">
                <button onClick={() => { setAwardBadgeType(''); setAwardEntityId(''); setBulkCity(''); setBulkState(''); setShowAwardModal(true); }} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Award Badge
                </button>
              </div>
              {(tab === 'clinic_badges' ? clinicBadges : doctorBadges).length === 0 ? (
                <div className="text-center py-12 text-gray-500">No badges awarded yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{tab === 'clinic_badges' ? 'Clinic' : 'Doctor'}</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Badge</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Awarded</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(tab === 'clinic_badges' ? clinicBadges : doctorBadges).map(badge => (
                        <tr key={badge.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{tab === 'clinic_badges' ? (badge as ClinicBadge).clinicName : (badge as DoctorBadge).doctorName}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">{badge.badgeType.replace(/_/g, ' ')}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">{formatDate(badge.awardedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : tab === 'leaderboards' ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4 flex-wrap">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Type</label>
                  <select value={lbType} onChange={e => setLbType(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="leads">Leads Generated</option>
                    <option value="rating">Highest Rating</option>
                    <option value="fast_responder">Fastest Response</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Period</label>
                  <select value={lbPeriod} onChange={e => setLbPeriod(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div className="pt-5">
                  <button onClick={generateLeaderboard} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                    {saving ? 'Generating...' : 'Generate'}
                  </button>
                </div>
              </div>
              {currentLeaderboard?.entries && currentLeaderboard.entries.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Rank</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {currentLeaderboard.entries.map(entry => (
                        <tr key={entry.entityId} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <span className={`w-6 h-6 rounded-full text-xs font-medium flex items-center justify-center ${entry.rank === 1 ? 'bg-yellow-400 text-yellow-900' : entry.rank === 2 ? 'bg-gray-300 text-gray-800' : entry.rank === 3 ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                              {entry.rank}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{entry.entityName}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{entry.score.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">No leaderboard data. Click Generate to create one.</div>
              )}
            </div>
          ) : tab === 'points_store' ? (
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-semibold text-gray-900">Reward Items</h4>
                  <button onClick={() => openRewardModal()} className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors">Add Reward</button>
                </div>
                {rewards.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No rewards configured.</div>
                ) : (
                  <div className="space-y-2">
                    {rewards.map(reward => (
                      <div key={reward.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{reward.name}</p>
                          <p className="text-xs text-gray-500">{reward.pointsCost} points - {reward.type}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {reward.stock !== undefined && <span className="text-xs text-gray-500">Stock: {reward.stock}</span>}
                          <button onClick={() => openRewardModal(reward)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Redeem Requests</h4>
                {redeemRequests.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No pending requests.</div>
                ) : (
                  <div className="space-y-2">
                    {redeemRequests.map(req => (
                      <div key={req.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{req.userName}</p>
                          <p className="text-xs text-gray-500">{req.rewardName} ({req.pointsSpent} points)</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${req.status === 'pending' ? 'bg-amber-100 text-amber-700' : req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {req.status}
                          </span>
                          {req.status === 'pending' && (
                            <>
                              <button onClick={() => handleRedeemAction(req.id, 'approved')} className="px-2 py-1 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700">Approve</button>
                              <button onClick={() => handleRedeemAction(req.id, 'rejected')} className="px-2 py-1 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700">Reject</button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Award Badge Modal */}
      <Modal open={showAwardModal} onClose={() => setShowAwardModal(false)} title="Award Badge">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Badge Type *</label>
            <select value={awardBadgeType} onChange={e => setAwardBadgeType(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option value="">Select badge...</option>
              {(tab === 'clinic_badges' ? CLINIC_BADGE_TYPES : DOCTOR_BADGE_TYPES).map(b => (
                <option key={b.key} value={b.key}>{b.label}</option>
              ))}
            </select>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-medium text-gray-500 uppercase mb-3">Single Award</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{tab === 'clinic_badges' ? 'Clinic' : 'Doctor'} *</label>
              <select value={awardEntityId} onChange={e => setAwardEntityId(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                <option value="">Select...</option>
                {(tab === 'clinic_badges' ? clinics : doctors).map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>
            <button onClick={awardBadge} disabled={saving || !awardEntityId || !awardBadgeType} className="mt-3 w-full px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {saving ? 'Awarding...' : 'Award Badge'}
            </button>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-medium text-gray-500 uppercase mb-3">Bulk Award</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">City (optional)</label>
                <input type="text" value={bulkCity} onChange={e => setBulkCity(e.target.value)} placeholder="Any" className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">State (optional)</label>
                <input type="text" value={bulkState} onChange={e => setBulkState(e.target.value)} placeholder="Any" className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
            </div>
            <button onClick={bulkAward} disabled={saving || !awardBadgeType} className="w-full px-4 py-2 border border-indigo-600 text-indigo-600 text-sm font-medium rounded-lg hover:bg-indigo-50 disabled:opacity-50 transition-colors">
              {saving ? 'Awarding...' : 'Bulk Award'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Reward Modal */}
      <Modal open={showRewardModal} onClose={() => setShowRewardModal(false)} title={editingReward ? 'Edit Reward' : 'Add Reward'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input type="text" value={rewardName} onChange={e => setRewardName(e.target.value)} placeholder="Premium Badge" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Points Cost *</label>
              <input type="number" value={rewardPoints} onChange={e => setRewardPoints(e.target.value)} placeholder="100" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <input type="text" value={rewardType} onChange={e => setRewardType(e.target.value)} placeholder="badge/perk/discount" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock (optional)</label>
            <input type="number" value={rewardStock} onChange={e => setRewardStock(e.target.value)} placeholder="Unlimited" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setShowRewardModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={saveReward} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">{editingReward ? 'Update' : 'Create'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
