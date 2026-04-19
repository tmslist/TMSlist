import { useState, useEffect, useCallback } from 'react';

interface Insurer {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  website?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

interface Plan {
  id: string;
  insurerId: string;
  insurerName: string;
  name: string;
  type: 'HMO' | 'PPO' | 'EPO' | 'POS' | 'HDHP';
  metalLevel: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  state: string;
  coversTMS: boolean;
  priorAuthRequired: boolean;
  typicalCopay: number;
}

interface CoverageLookup {
  planName: string;
  treatmentType: string;
  estimatedCost: number;
  coverage: string;
  status: 'active' | 'inactive' | 'unknown';
}

type TabKey = 'insurers' | 'plans' | 'coverage_lookup';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'insurers', label: 'Insurers' },
  { key: 'plans', label: 'Plans' },
  { key: 'coverage_lookup', label: 'Coverage Lookup' },
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

export default function AdminInsuranceManager() {
  const [tab, setTab] = useState<TabKey>('insurers');
  const [insurers, setInsurers] = useState<Insurer[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [insurerSearch, setInsurerSearch] = useState('');
  const [planSearch, setPlanSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showInsurerModal, setShowInsurerModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingInsurer, setEditingInsurer] = useState<Insurer | null>(null);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [saving, setSaving] = useState(false);

  // Lookup state
  const [lookupPlan, setLookupPlan] = useState('');
  const [lookupTreatment, setLookupTreatment] = useState('TMS');
  const [lookupResult, setLookupResult] = useState<CoverageLookup | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  // Insurer form
  const [insurerName, setInsurerName] = useState('');
  const [insurerSlug, setInsurerSlug] = useState('');
  const [insurerLogo, setInsurerLogo] = useState('');
  const [insurerWebsite, setInsurerWebsite] = useState('');

  // Plan form
  const [planInsurerId, setPlanInsurerId] = useState('');
  const [planName, setPlanName] = useState('');
  const [planType, setPlanType] = useState<Plan['type']>('PPO');
  const [planMetal, setPlanMetal] = useState<Plan['metalLevel']>('Silver');
  const [planState, setPlanState] = useState('');
  const [planCoversTMS, setPlanCoversTMS] = useState(true);
  const [planPriorAuth, setPlanPriorAuth] = useState(false);
  const [planCopay, setPlanCopay] = useState('');

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/insurance');
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to fetch data');
      const json = await res.json();
      setInsurers(json.insurers || []);
      setPlans(json.plans || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function openInsurerModal(insurer?: Insurer) {
    if (insurer) {
      setEditingInsurer(insurer);
      setInsurerName(insurer.name);
      setInsurerSlug(insurer.slug);
      setInsurerLogo(insurer.logo || '');
      setInsurerWebsite(insurer.website || '');
    } else {
      setEditingInsurer(null);
      setInsurerName('');
      setInsurerSlug('');
      setInsurerLogo('');
      setInsurerWebsite('');
    }
    setShowInsurerModal(true);
  }

  function openPlanModal(plan?: Plan) {
    if (plan) {
      setEditingPlan(plan);
      setPlanInsurerId(plan.insurerId);
      setPlanName(plan.name);
      setPlanType(plan.type);
      setPlanMetal(plan.metalLevel);
      setPlanState(plan.state);
      setPlanCoversTMS(plan.coversTMS);
      setPlanPriorAuth(plan.priorAuthRequired);
      setPlanCopay(String(plan.typicalCopay));
    } else {
      setEditingPlan(null);
      setPlanInsurerId('');
      setPlanName('');
      setPlanType('PPO');
      setPlanMetal('Silver');
      setPlanState('');
      setPlanCoversTMS(true);
      setPlanPriorAuth(false);
      setPlanCopay('');
    }
    setShowPlanModal(true);
  }

  async function saveInsurer() {
    if (!insurerName || !insurerSlug) { showToast('error', 'Name and slug are required'); return; }

    setSaving(true);
    try {
      const body = { name: insurerName, slug: insurerSlug, logo: insurerLogo, website: insurerWebsite };
      const url = editingInsurer ? `/api/admin/insurance/insurer?id=${editingInsurer.id}` : '/api/admin/insurance/insurer';
      const method = editingInsurer ? 'PUT' : 'POST';

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Failed to save insurer');

      showToast('success', `Insurer ${editingInsurer ? 'updated' : 'created'}`);
      setShowInsurerModal(false);
      fetchData();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to save insurer');
    } finally {
      setSaving(false);
    }
  }

  async function savePlan() {
    if (!planInsurerId || !planName || !planState) { showToast('error', 'Insurer, name, and state are required'); return; }

    setSaving(true);
    try {
      const body = {
        insurerId: planInsurerId,
        name: planName,
        type: planType,
        metalLevel: planMetal,
        state: planState,
        coversTMS: planCoversTMS,
        priorAuthRequired: planPriorAuth,
        typicalCopay: Number(planCopay) || 0,
      };
      const url = editingPlan ? `/api/admin/insurance/plan?id=${editingPlan.id}` : '/api/admin/insurance/plan';
      const method = editingPlan ? 'PUT' : 'POST';

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Failed to save plan');

      showToast('success', `Plan ${editingPlan ? 'updated' : 'created'}`);
      setShowPlanModal(false);
      fetchData();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to save plan');
    } finally {
      setSaving(false);
    }
  }

  async function toggleInsurerStatus(insurer: Insurer) {
    try {
      const res = await fetch(`/api/admin/insurance/insurer?id=${insurer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...insurer, status: insurer.status === 'active' ? 'inactive' : 'active' }),
      });
      if (!res.ok) throw new Error('Failed to update insurer');
      setInsurers(insurers.map(i => i.id === insurer.id ? { ...i, status: i.status === 'active' ? 'inactive' : 'active' } : i));
      showToast('success', 'Status updated');
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to update');
    }
  }

  async function deleteInsurer(insurer: Insurer) {
    if (!confirm(`Delete insurer "${insurer.name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/insurance/insurer?id=${insurer.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete insurer');
      setInsurers(insurers.filter(i => i.id !== insurer.id));
      showToast('success', 'Insurer deleted');
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to delete');
    }
  }

  async function deletePlan(plan: Plan) {
    if (!confirm(`Delete plan "${plan.name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/insurance/plan?id=${plan.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete plan');
      setPlans(plans.filter(p => p.id !== plan.id));
      showToast('success', 'Plan deleted');
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to delete');
    }
  }

  async function lookupCoverage() {
    if (!lookupPlan) { showToast('error', 'Enter a plan name'); return; }

    setLookupLoading(true);
    try {
      const res = await fetch('/api/admin/insurance/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planName: lookupPlan, treatmentType: lookupTreatment }),
      });
      if (!res.ok) throw new Error('Lookup failed');
      const json = await res.json();
      setLookupResult(json.data);
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Lookup failed');
    } finally {
      setLookupLoading(false);
    }
  }

  const filteredInsurers = insurerSearch
    ? insurers.filter(i => i.name.toLowerCase().includes(insurerSearch.toLowerCase()))
    : insurers;

  const filteredPlans = planSearch
    ? plans.filter(p => p.name.toLowerCase().includes(planSearch.toLowerCase()) || p.insurerName.toLowerCase().includes(planSearch.toLowerCase()))
    : plans;

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
          <h2 className="text-xl font-semibold text-gray-900">Insurance Manager</h2>
          <p className="text-sm text-gray-500 mt-0.5">{insurers.length} insurers, {plans.length} plans</p>
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
          <nav className="flex gap-1 px-4">
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
          ) : tab === 'insurers' ? (
            <div>
              <div className="flex items-center justify-between gap-4 mb-4">
                <input type="text" value={insurerSearch} onChange={e => setInsurerSearch(e.target.value)} placeholder="Search insurers..." className="flex-1 max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                <button onClick={() => openInsurerModal()} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Insurer
                </button>
              </div>

              {filteredInsurers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No insurers found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Slug</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Added</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredInsurers.map(insurer => (
                        <tr key={insurer.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {insurer.logo && <img src={insurer.logo} alt="" className="w-8 h-8 rounded object-contain" />}
                              <span className="text-sm font-medium text-gray-900">{insurer.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 font-mono">{insurer.slug}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => toggleInsurerStatus(insurer)} className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${insurer.status === 'active' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                              {insurer.status === 'active' ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">{formatDate(insurer.createdAt)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button onClick={() => openInsurerModal(insurer)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button onClick={() => deleteInsurer(insurer)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
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
          ) : tab === 'plans' ? (
            <div>
              <div className="flex items-center justify-between gap-4 mb-4">
                <input type="text" value={planSearch} onChange={e => setPlanSearch(e.target.value)} placeholder="Search plans..." className="flex-1 max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                <button onClick={() => openPlanModal()} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Plan
                </button>
              </div>

              {filteredPlans.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No plans found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Plan</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Insurer</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Metal</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">State</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">TMS</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Prior Auth</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Copay</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredPlans.map(plan => (
                        <tr key={plan.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{plan.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{plan.insurerName}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">{plan.type}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{plan.metalLevel}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{plan.state}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${plan.coversTMS ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                              {plan.coversTMS ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${plan.priorAuthRequired ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                              {plan.priorAuthRequired ? 'Required' : 'None'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">${plan.typicalCopay}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button onClick={() => openPlanModal(plan)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button onClick={() => deletePlan(plan)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
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
          ) : tab === 'coverage_lookup' && (
            <div className="max-w-xl mx-auto space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Plan</label>
                  <input type="text" value={lookupPlan} onChange={e => setLookupPlan(e.target.value)} placeholder="Enter plan name..." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Type</label>
                  <select value={lookupTreatment} onChange={e => setLookupTreatment(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="TMS">TMS Treatment</option>
                    <option value="consultation">Consultation</option>
                    <option value="followup">Follow-up</option>
                  </select>
                </div>
                <button onClick={lookupCoverage} disabled={lookupLoading} className="w-full px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                  {lookupLoading ? 'Looking up...' : 'Check Coverage'}
                </button>
              </div>

              {lookupResult && (
                <div className="border border-gray-200 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-900">{lookupResult.planName}</h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${lookupResult.status === 'active' ? 'bg-emerald-100 text-emerald-700' : lookupResult.status === 'inactive' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                      {lookupResult.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Estimated Patient Cost</p>
                      <p className="text-lg font-bold text-gray-900">${lookupResult.estimatedCost}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Coverage Level</p>
                      <p className="text-sm font-medium text-gray-900">{lookupResult.coverage}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Insurer Modal */}
      <Modal open={showInsurerModal} onClose={() => setShowInsurerModal(false)} title={editingInsurer ? 'Edit Insurer' : 'Add Insurer'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input type="text" value={insurerName} onChange={e => setInsurerName(e.target.value)} placeholder="Blue Cross Blue Shield" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
            <input type="text" value={insurerSlug} onChange={e => setInsurerSlug(e.target.value)} placeholder="bcbs" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
            <input type="url" value={insurerLogo} onChange={e => setInsurerLogo(e.target.value)} placeholder="https://..." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
            <input type="url" value={insurerWebsite} onChange={e => setInsurerWebsite(e.target.value)} placeholder="https://..." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setShowInsurerModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={saveInsurer} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">{editingInsurer ? 'Update' : 'Create'}</button>
          </div>
        </div>
      </Modal>

      {/* Plan Modal */}
      <Modal open={showPlanModal} onClose={() => setShowPlanModal(false)} title={editingPlan ? 'Edit Plan' : 'Add Plan'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Insurer *</label>
            <select value={planInsurerId} onChange={e => setPlanInsurerId(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option value="">Select insurer...</option>
              {insurers.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name *</label>
            <input type="text" value={planName} onChange={e => setPlanName(e.target.value)} placeholder="PPO Gold 1000" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={planType} onChange={e => setPlanType(e.target.value as Plan['type'])} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                <option value="HMO">HMO</option>
                <option value="PPO">PPO</option>
                <option value="EPO">EPO</option>
                <option value="POS">POS</option>
                <option value="HDHP">HDHP</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Metal Level</label>
              <select value={planMetal} onChange={e => setPlanMetal(e.target.value as Plan['metalLevel'])} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                <option value="Bronze">Bronze</option>
                <option value="Silver">Silver</option>
                <option value="Gold">Gold</option>
                <option value="Platinum">Platinum</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
            <input type="text" value={planState} onChange={e => setPlanState(e.target.value)} placeholder="CA" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="coversTMS" checked={planCoversTMS} onChange={e => setPlanCoversTMS(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              <label htmlFor="coversTMS" className="text-sm text-gray-700">Covers TMS</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="priorAuth" checked={planPriorAuth} onChange={e => setPlanPriorAuth(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              <label htmlFor="priorAuth" className="text-sm text-gray-700">Prior Auth Required</label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Typical Copay ($)</label>
            <input type="number" value={planCopay} onChange={e => setPlanCopay(e.target.value)} placeholder="50" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setShowPlanModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={savePlan} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">{editingPlan ? 'Update' : 'Create'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
