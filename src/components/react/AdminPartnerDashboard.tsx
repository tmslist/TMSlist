import { useState, useCallback, useMemo } from 'react';

interface Partner {
  id: string;
  name: string;
  company: string;
  email: string;
  apiKey: string;
  status: 'active' | 'suspended' | 'pending' | 'inactive';
  plan: 'starter' | 'professional' | 'enterprise';
  quotaLimit: number;
  quotaUsed: number;
  endpoints: number;
  lastActive: string;
  createdAt: string;
  website: string;
  description: string;
}

interface ApiUsageEntry {
  partnerId: string;
  date: string;
  requests: number;
  errors: number;
  latencyP50: number;
  latencyP99: number;
}

export default function AdminPartnerDashboard() {
  const [partners, setPartners] = useState<Partner[]>([
    {
      id: '1',
      name: 'Alex Chen',
      company: 'NeuroCare Systems',
      email: 'alex.chen@neurocare.io',
      apiKey: 'tms_sk_live_8f3k2m5n9p1',
      status: 'active',
      plan: 'enterprise',
      quotaLimit: 50000,
      quotaUsed: 34200,
      endpoints: 8,
      lastActive: '2026-04-18T14:23:00Z',
      createdAt: '2025-06-15',
      website: 'https://neurocare.io',
      description: 'Mental health platform integrating TMS provider discovery',
    },
    {
      id: '2',
      name: 'Jordan Rivera',
      company: 'MedConnect API',
      email: 'j.rivera@medconnect.com',
      apiKey: 'tms_sk_live_3x7v9c2m5k8',
      status: 'active',
      plan: 'professional',
      quotaLimit: 10000,
      quotaUsed: 7800,
      endpoints: 5,
      lastActive: '2026-04-17T09:15:00Z',
      createdAt: '2025-09-22',
      website: 'https://medconnect.com',
      description: 'Healthcare data aggregation service',
    },
    {
      id: '3',
      name: 'Taylor Brooks',
      company: 'WellnessApp Inc',
      email: 'taylor@wellnessapp.co',
      apiKey: 'tms_sk_test_1a2b3c4d5e6f',
      status: 'pending',
      plan: 'starter',
      quotaLimit: 1000,
      quotaUsed: 0,
      endpoints: 3,
      lastActive: '',
      createdAt: '2026-04-10',
      website: 'https://wellnessapp.co',
      description: 'Mobile wellness app for mental health tracking',
    },
    {
      id: '4',
      name: 'Sam Patel',
      company: 'HealthTech Solutions',
      email: 'sam.patel@htsolutions.net',
      apiKey: 'tms_sk_live_9p8n7m5k3j1',
      status: 'suspended',
      plan: 'professional',
      quotaLimit: 10000,
      quotaUsed: 12400,
      endpoints: 5,
      lastActive: '2026-03-28T16:44:00Z',
      createdAt: '2025-11-08',
      website: 'https://htsolutions.net',
      description: 'Medical practice management software',
    },
    {
      id: '5',
      name: 'Casey Morgan',
      company: 'ClinicFinder Pro',
      email: 'casey@clinicfinderpro.com',
      apiKey: 'tms_sk_live_2m4n6p8q0r2',
      status: 'active',
      plan: 'enterprise',
      quotaLimit: 100000,
      quotaUsed: 67800,
      endpoints: 12,
      lastActive: '2026-04-18T11:05:00Z',
      createdAt: '2025-03-01',
      website: 'https://clinicfinderpro.com',
      description: 'Clinic locator and appointment booking platform',
    },
  ]);

  const [usageData] = useState<ApiUsageEntry[]>(Array.from({ length: 30 }, (_, i) => ({
    partnerId: '1',
    date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0],
    requests: Math.floor(Math.random() * 3000) + 500,
    errors: Math.floor(Math.random() * 50),
    latencyP50: Math.floor(Math.random() * 200) + 50,
    latencyP99: Math.floor(Math.random() * 800) + 200,
  })));

  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [showOnboard, setShowOnboard] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [newPartner, setNewPartner] = useState({ name: '', company: '', email: '', plan: 'starter' as Partner['plan'], quotaLimit: 1000, description: '', website: '' });
  const [saving, setSaving] = useState(false);

  const filteredPartners = useMemo(() => {
    return partners.filter(p => {
      if (filterStatus !== 'all' && p.status !== filterStatus) return false;
      if (filterPlan !== 'all' && p.plan !== filterPlan) return false;
      return true;
    });
  }, [partners, filterStatus, filterPlan]);

  const stats = useMemo(() => {
    const totalPartners = partners.length;
    const activePartners = partners.filter(p => p.status === 'active').length;
    const totalRequests = partners.reduce((sum, p) => sum + p.quotaUsed, 0);
    const totalQuota = partners.reduce((sum, p) => sum + p.quotaLimit, 0);
    return { totalPartners, activePartners, totalRequests, totalQuota };
  }, [partners]);

  const handleOnboard = useCallback(() => {
    setSaving(true);
    setTimeout(() => {
      const partner: Partner = {
        id: `new-${Date.now()}`,
        name: newPartner.name,
        company: newPartner.company,
        email: newPartner.email,
        apiKey: `tms_sk_live_${Math.random().toString(36).slice(2, 14)}`,
        status: 'pending',
        plan: newPartner.plan,
        quotaLimit: newPartner.quotaLimit,
        quotaUsed: 0,
        endpoints: 0,
        lastActive: '',
        createdAt: new Date().toISOString().split('T')[0],
        website: newPartner.website,
        description: newPartner.description,
      };
      setPartners(prev => [...prev, partner]);
      setNewPartner({ name: '', company: '', email: '', plan: 'starter', quotaLimit: 1000, description: '', website: '' });
      setShowOnboard(false);
      setSaving(false);
    }, 700);
  }, [newPartner]);

  const handleToggleStatus = useCallback((partner: Partner) => {
    const newStatus = partner.status === 'active' ? 'suspended' : 'active';
    setPartners(prev => prev.map(p => p.id === partner.id ? { ...p, status: newStatus } : p));
  }, []);

  const STATUS_COLORS: Record<Partner['status'], string> = {
    active: 'bg-emerald-100 text-emerald-700',
    suspended: 'bg-red-100 text-red-700',
    pending: 'bg-amber-100 text-amber-700',
    inactive: 'bg-gray-100 text-gray-500',
  };

  const PLAN_COLORS: Record<Partner['plan'], string> = {
    starter: 'bg-gray-100 text-gray-700',
    professional: 'bg-violet-100 text-violet-700',
    enterprise: 'bg-amber-100 text-amber-700',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Partner Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage API partners, quotas, and integrations</p>
        </div>
        <button
          onClick={() => setShowOnboard(true)}
          className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors"
        >
          + Onboard Partner
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase">Total Partners</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalPartners}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase">Active Partners</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.activePartners}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase">Total API Calls</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalRequests.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase">Quota Usage</p>
          <p className="text-2xl font-bold text-violet-600 mt-1">{Math.round((stats.totalRequests / stats.totalQuota) * 100)}%</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={filterPlan}
            onChange={e => setFilterPlan(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500"
          >
            <option value="all">All Plans</option>
            <option value="starter">Starter</option>
            <option value="professional">Professional</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
      </div>

      {/* Partner list */}
      <div className="space-y-4">
        {filteredPartners.map(partner => (
          <div key={partner.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-violet-200 transition-colors">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
                  <span className="text-sm font-bold text-violet-600">{partner.company.charAt(0)}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-sm font-semibold text-gray-900">{partner.company}</span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[partner.status]}`}>
                    {partner.status.charAt(0).toUpperCase() + partner.status.slice(1)}
                  </span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${PLAN_COLORS[partner.plan]}`}>
                    {partner.plan.charAt(0).toUpperCase() + partner.plan.slice(1)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-1">{partner.email} &middot; {partner.name}</p>
                <p className="text-xs text-gray-400 mb-3">{partner.description}</p>

                {/* Quota bar */}
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>API Quota</span>
                      <span>{partner.quotaUsed.toLocaleString()} / {partner.quotaLimit.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${partner.quotaUsed >= partner.quotaLimit ? 'bg-red-500' : partner.quotaUsed > partner.quotaLimit * 0.8 ? 'bg-amber-500' : 'bg-violet-500'}`}
                        style={{ width: `${Math.min(100, (partner.quotaUsed / partner.quotaLimit) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{partner.endpoints} endpoints</p>
                    <p className="text-xs text-gray-400">
                      {partner.lastActive ? `Active ${new Date(partner.lastActive).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'Never'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0">
                <button
                  onClick={() => setSelectedPartner(partner)}
                  className="px-4 py-2 text-xs font-medium text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                >
                  Manage
                </button>
                <button
                  onClick={() => handleToggleStatus(partner)}
                  className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
                    partner.status === 'active'
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-emerald-600 hover:bg-emerald-50'
                  }`}
                >
                  {partner.status === 'active' ? 'Suspend' : 'Activate'}
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredPartners.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-500">No partners match your filters</p>
          </div>
        )}
      </div>

      {/* Usage chart */}
      {selectedPartner && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">
              API Usage — {selectedPartner.company}
            </h3>
            <button onClick={() => setSelectedPartner(null)} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Requests Today</p>
              <p className="text-lg font-bold text-gray-900">{usageData[usageData.length - 1]?.requests.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Error Rate</p>
              <p className="text-lg font-bold text-red-600">{Math.round((usageData[usageData.length - 1]?.errors / usageData[usageData.length - 1]?.requests) * 100)}%</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">P50 Latency</p>
              <p className="text-lg font-bold text-gray-900">{usageData[usageData.length - 1]?.latencyP50}ms</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">P99 Latency</p>
              <p className="text-lg font-bold text-amber-600">{usageData[usageData.length - 1]?.latencyP99}ms</p>
            </div>
          </div>
          <div className="flex items-end gap-1 h-40">
            {usageData.map((d, i) => (
              <div key={i} className="flex-1 group relative">
                <div
                  className="bg-violet-200 hover:bg-violet-400 rounded-t transition-colors"
                  style={{ height: `${(d.requests / 3500) * 100}%` }}
                />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                  {d.date}: {d.requests.toLocaleString()} req
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>{usageData[0]?.date}</span>
            <span>{usageData[usageData.length - 1]?.date}</span>
          </div>
        </div>
      )}

      {/* Onboard modal */}
      {showOnboard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Onboard New Partner</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                <input
                  type="text"
                  value={newPartner.name}
                  onChange={e => setNewPartner({ ...newPartner, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={newPartner.company}
                  onChange={e => setNewPartner({ ...newPartner, company: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newPartner.email}
                  onChange={e => setNewPartner({ ...newPartner, email: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                  <select
                    value={newPartner.plan}
                    onChange={e => setNewPartner({ ...newPartner, plan: e.target.value as Partner['plan'], quotaLimit: e.target.value === 'starter' ? 1000 : e.target.value === 'professional' ? 10000 : 50000 })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500"
                  >
                    <option value="starter">Starter</option>
                    <option value="professional">Professional</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quota Limit</label>
                  <input
                    type="number"
                    value={newPartner.quotaLimit}
                    onChange={e => setNewPartner({ ...newPartner, quotaLimit: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input
                  type="url"
                  value={newPartner.website}
                  onChange={e => setNewPartner({ ...newPartner, website: e.target.value })}
                  placeholder="https://"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newPartner.description}
                  onChange={e => setNewPartner({ ...newPartner, description: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleOnboard}
                disabled={saving || !newPartner.name || !newPartner.email || !newPartner.company}
                className="px-5 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Creating...' : 'Create Partner'}
              </button>
              <button
                onClick={() => setShowOnboard(false)}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
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
