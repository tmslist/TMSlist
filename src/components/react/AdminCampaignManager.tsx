import { useState, useEffect, useCallback } from 'react';

interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'sms';
  subject?: string;
  message?: string;
  targetType: 'clinic_owners' | 'all_users' | 'filtered';
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  sentCount: number;
  deliveredCount: number;
  openCount: number;
  createdAt: string;
  filterCriteria?: Record<string, unknown>;
}

interface FilterCriteria {
  city?: string;
  state?: string;
  country?: string;
  verifiedOnly?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  scheduled: 'bg-blue-100 text-blue-700',
  sending: 'bg-amber-100 text-amber-700',
  sent: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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

export default function AdminCampaignManager() {
  const [tab, setTab] = useState<'email' | 'sms'>('email');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<{ count: number; sample: string } | null>(null);
  const [sending, setSending] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [targetType, setTargetType] = useState<'clinic_owners' | 'all_users' | 'filtered'>('all_users');
  const [filterCity, setFilterCity] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterVerified, setFilterVerified] = useState(false);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/bulk-campaigns');
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to fetch campaigns');
      const json = await res.json();
      setCampaigns(json.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const filteredCampaigns = campaigns.filter(c => c.type === tab);

  async function handlePreview() {
    const criteria: FilterCriteria = { verifiedOnly: filterVerified };
    if (filterCity) criteria.city = filterCity;
    if (filterState) criteria.state = filterState;
    if (filterCountry) criteria.country = filterCountry;

    try {
      const res = await fetch('/api/admin/bulk-campaigns/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType, filterCriteria: criteria }),
      });
      if (!res.ok) throw new Error('Preview failed');
      const json = await res.json();
      setPreviewData({ count: json.count, sample: json.sample || 'No sample available' });
      setShowPreview(true);
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Preview failed');
    }
  }

  async function handleSend() {
    if (!name) { showToast('error', 'Campaign name is required'); return; }
    if (tab === 'email' && !subject) { showToast('error', 'Subject is required for email campaigns'); return; }
    if (tab === 'sms' && !message) { showToast('error', 'Message is required for SMS campaigns'); return; }

    setSending(true);
    try {
      const criteria: FilterCriteria = { verifiedOnly: filterVerified };
      if (filterCity) criteria.city = filterCity;
      if (filterState) criteria.state = filterState;
      if (filterCountry) criteria.country = filterCountry;

      const res = await fetch('/api/admin/bulk-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type: tab,
          subject: tab === 'email' ? subject : undefined,
          message: tab === 'sms' ? message : undefined,
          targetType,
          filterCriteria: targetType === 'filtered' ? criteria : undefined,
          action: 'send',
        }),
      });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to send campaign');

      showToast('success', 'Campaign queued for sending');
      setShowModal(false);
      resetForm();
      fetchCampaigns();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to send campaign');
    } finally {
      setSending(false);
    }
  }

  function resetForm() {
    setName('');
    setSubject('');
    setMessage('');
    setTargetType('all_users');
    setFilterCity('');
    setFilterState('');
    setFilterCountry('');
    setFilterVerified(false);
  }

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
          <h2 className="text-xl font-semibold text-gray-900">Campaign Manager</h2>
          <p className="text-sm text-gray-500 mt-0.5">{filteredCampaigns.length} {tab} campaign{filteredCampaigns.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchCampaigns} className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button onClick={() => { resetForm(); setShowModal(true); }} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Campaign
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex gap-1 px-4">
            {(['email', 'sms'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {t === 'email' ? 'Email Campaigns' : 'SMS Campaigns'}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="inline-block w-8 h-8 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No {tab} campaigns yet.</p>
              <button onClick={() => { resetForm(); setShowModal(true); }} className="mt-3 text-indigo-600 hover:text-indigo-700 text-sm font-medium">Create your first campaign</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{tab === 'email' ? 'Subject' : 'Message'}</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Target</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Sent</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{tab === 'email' ? 'Opens' : 'Delivered'}</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCampaigns.map(campaign => (
                    <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{campaign.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                        {tab === 'email' ? campaign.subject : campaign.message?.slice(0, 50)}
                        {(campaign.message?.length || 0) > 50 ? '...' : ''}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          {campaign.targetType.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${STATUS_COLORS[campaign.status]}`}>
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{campaign.sentCount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {tab === 'email' ? campaign.openCount.toLocaleString() : campaign.deliveredCount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatDate(campaign.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* New Campaign Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={`New ${tab === 'email' ? 'Email' : 'SMS'} Campaign`}>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Spring Promotion 2024" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>

          {tab === 'email' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject Line *</label>
              <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Exclusive TMS Treatment Offer" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
          )}

          {tab === 'sms' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
              <div className="relative">
                <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} placeholder="Hi! Check out our new TMS treatment options..." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none" />
                <span className={`absolute bottom-2 right-3 text-xs ${message.length > 160 ? 'text-red-500' : 'text-gray-400'}`}>
                  {message.length}/160
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
            <select value={targetType} onChange={e => setTargetType(e.target.value as typeof targetType)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white">
              <option value="all_users">All Users</option>
              <option value="clinic_owners">Clinic Owners</option>
              <option value="filtered">Filtered</option>
            </select>
          </div>

          {targetType === 'filtered' && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <p className="text-xs font-medium text-gray-500 uppercase">Filter Criteria</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">City</label>
                  <input type="text" value={filterCity} onChange={e => setFilterCity(e.target.value)} placeholder="Los Angeles" className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">State</label>
                  <input type="text" value={filterState} onChange={e => setFilterState(e.target.value)} placeholder="CA" className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Country</label>
                  <input type="text" value={filterCountry} onChange={e => setFilterCountry(e.target.value)} placeholder="USA" className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={filterVerified} onChange={e => setFilterVerified(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    Verified only
                  </label>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={handlePreview} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Preview Recipients
            </button>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button onClick={handleSend} disabled={sending} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {sending ? 'Sending...' : 'Send Campaign'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal open={showPreview} onClose={() => setShowPreview(false)} title="Campaign Preview">
        {previewData && (
          <div className="space-y-4">
            <div className="bg-indigo-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-indigo-600">{previewData.count.toLocaleString()}</p>
              <p className="text-sm text-indigo-500 mt-1">Estimated Recipients</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Sample Preview</p>
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 font-mono whitespace-pre-wrap">
                {previewData.sample}
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={() => setShowPreview(false)} className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
