import { useState, useEffect, useCallback } from 'react';

interface InsurancePlan {
  id: string;
  insurerId: string;
  insurerName: string;
  name: string;
  planType: string;
  coveragePercent: number;
  metalLevel: string;
  active: boolean;
  createdAt: string;
}

interface Insurer {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  website: string | null;
  active: boolean;
  createdAt: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminInsurancePlans() {
  const [plans, setPlans] = useState<InsurancePlan[]>([]);
  const [insurers, setInsurers] = useState<Insurer[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [tab, setTab] = useState<'plans' | 'insurers'>('plans');
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showInsurerModal, setShowInsurerModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<InsurancePlan | null>(null);
  const [editingInsurer, setEditingInsurer] = useState<Insurer | null>(null);
  const [saving, setSaving] = useState(false);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/insurance');
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error();
      const json = await res.json();
      setPlans(json.data.plans || []);
      setInsurers(json.data.insurers || []);
    } catch { showToast('error', 'Failed to load data'); }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSavePlan = async (data: Partial<InsurancePlan> & { insurerId: string; name: string; planType: string }) => {
    setSaving(true);
    try {
      const isEdit = !!editingPlan;
      const res = await fetch('/api/admin/insurance', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, type: 'plan', id: editingPlan?.id }),
      });
      if (!res.ok) throw new Error();
      showToast('success', isEdit ? 'Plan updated' : 'Plan created');
      setShowPlanModal(false); setEditingPlan(null);
      fetchData();
    } catch { showToast('error', 'Failed to save plan'); }
    finally { setSaving(false); }
  };

  const handleSaveInsurer = async (data: Partial<Insurer> & { name: string; slug: string }) => {
    setSaving(true);
    try {
      const isEdit = !!editingInsurer;
      const res = await fetch('/api/admin/insurance', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, type: 'insurer', id: editingInsurer?.id }),
      });
      if (!res.ok) throw new Error();
      showToast('success', isEdit ? 'Insurer updated' : 'Insurer created');
      setShowInsurerModal(false); setEditingInsurer(null);
      fetchData();
    } catch { showToast('error', 'Failed to save insurer'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">Insurance Plans</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Manage insurers, plans, and coverage tiers</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setEditingInsurer(null); setShowInsurerModal(true); }} className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            + Add Insurer
          </button>
          <button onClick={() => { setEditingPlan(null); setShowPlanModal(true); }} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors">
            + Add Plan
          </button>
        </div>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex gap-0">
          {(['plans', 'insurers'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-violet-600 text-violet-700 dark:text-violet-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
              {t === 'plans' ? `Plans (${plans.length})` : `Insurers (${insurers.length})`}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-16 text-center">
          <div className="inline-block w-6 h-6 border-2 border-gray-200 border-t-violet-600 rounded-full animate-spin mb-3" />
        </div>
      ) : tab === 'plans' ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Plan</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Insurer</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Coverage</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {plans.map(plan => (
                <tr key={plan.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                  <td className="px-5 py-3.5 text-sm font-medium text-gray-900 dark:text-gray-100">{plan.name}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-400">{plan.insurerName}</td>
                  <td className="px-5 py-3.5"><span className="px-2 py-1 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-xs font-semibold rounded">{plan.planType || 'PPO'}</span></td>
                  <td className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-400">{plan.coveragePercent || '-'}%</td>
                  <td className="px-5 py-3.5">{plan.active ? <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold rounded">Active</span> : <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 text-xs font-semibold rounded">Inactive</span>}</td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => { setEditingPlan(plan); setShowPlanModal(true); }} className="text-xs text-violet-600 dark:text-violet-400 hover:underline">Edit</button>
                  </td>
                </tr>
              ))}
              {plans.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-500 dark:text-gray-400">No plans found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Insurer</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Slug</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Website</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {insurers.map(insurer => (
                <tr key={insurer.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                  <td className="px-5 py-3.5 text-sm font-medium text-gray-900 dark:text-gray-100">{insurer.name}</td>
                  <td className="px-5 py-3.5 text-xs font-mono text-gray-500 dark:text-gray-400">{insurer.slug}</td>
                  <td className="px-5 py-3.5 text-xs text-violet-600 dark:text-violet-400">{insurer.website || '-'}</td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => { setEditingInsurer(insurer); setShowInsurerModal(true); }} className="text-xs text-violet-600 dark:text-violet-400 hover:underline">Edit</button>
                  </td>
                </tr>
              ))}
              {insurers.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-12 text-center text-gray-500 dark:text-gray-400">No insurers found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Plan Modal */}
      {showPlanModal && (
        <PlanModal
          plan={editingPlan}
          insurers={insurers}
          onSave={handleSavePlan}
          onClose={() => { setShowPlanModal(false); setEditingPlan(null); }}
          saving={saving}
        />
      )}

      {/* Insurer Modal */}
      {showInsurerModal && (
        <InsurerModal
          insurer={editingInsurer}
          onSave={handleSaveInsurer}
          onClose={() => { setShowInsurerModal(false); setEditingInsurer(null); }}
          saving={saving}
        />
      )}
    </div>
  );
}

function PlanModal({ plan, insurers, onSave, onClose, saving }: {
  plan: InsurancePlan | null;
  insurers: Insurer[];
  onSave: (data: any) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    insurerId: plan?.insurerId || '',
    name: plan?.name || '',
    planType: plan?.planType || 'PPO',
    coveragePercent: plan?.coveragePercent || '',
    metalLevel: plan?.metalLevel || '',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{plan ? 'Edit Plan' : 'New Plan'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Insurer</label>
            <select value={form.insurerId} onChange={e => setForm({ ...form, insurerId: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
              <option value="">Select insurer...</option>
              {insurers.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plan Name</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
              <select value={form.planType} onChange={e => setForm({ ...form, planType: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                {['PPO', 'HMO', 'EPO', 'POS', 'HDHP'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Coverage %</label>
              <input type="number" value={form.coveragePercent} onChange={e => setForm({ ...form, coveragePercent: Number(e.target.value) })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg">Cancel</button>
            <button onClick={() => onSave(form)} disabled={saving || !form.name || !form.insurerId} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InsurerModal({ insurer, onSave, onClose, saving }: {
  insurer: Insurer | null;
  onSave: (data: any) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({ name: insurer?.name || '', slug: insurer?.slug || '', website: insurer?.website || '' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{insurer ? 'Edit Insurer' : 'New Insurer'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Slug</label>
            <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Website</label>
            <input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="https://..." className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg">Cancel</button>
            <button onClick={() => onSave(form)} disabled={saving || !form.name || !form.slug} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
