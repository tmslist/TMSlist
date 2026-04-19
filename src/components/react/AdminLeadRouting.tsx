import { useState, useEffect } from 'react';

interface LeadRoute {
  id: string;
  name: string;
  rules: Array<{ field: string; operator: string; value: string }>;
  action: { type: 'assign' | 'notify' | 'priority' | 'route'; value: string };
  priority: number;
  active: boolean;
}

interface Doctor {
  id: string;
  name: string;
  email: string;
  specialty: string;
  capacity: number;
}

export default function AdminLeadRouting() {
  const [routes, setRoutes] = useState<LeadRoute[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'rules' | 'doctors' | 'analytics'>('rules');
  const [editingRoute, setEditingRoute] = useState<LeadRoute | null>(null);

  useEffect(() => {
    fetch('/api/admin/lead-routing')
      .then((r) => r.ok ? r.json() : Promise.resolve({ routes: [], doctors: [] }))
      .then((d) => { setRoutes(d.routes || []); setDoctors(d.doctors || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function saveRoute(route: LeadRoute) {
    setSaving(true);
    try {
      await fetch('/api/admin/lead-routing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(route),
      });
      setRoutes((prev) => {
        const idx = prev.findIndex((r) => r.id === route.id);
        return idx >= 0 ? prev.map((r) => (r.id === route.id ? route : r)) : [...prev, route];
      });
      setEditingRoute(null);
    } catch { /* handle */ }
    setSaving(false);
  }

  function addRule(route: LeadRoute) {
    setEditingRoute({
      ...route,
      rules: [...route.rules, { field: 'city', operator: 'equals', value: '' }],
    });
  }

  function removeRule(route: LeadRoute, index: number) {
    setEditingRoute({ ...route, rules: route.rules.filter((_, i) => i !== index) });
  }

  function toggleActive(route: LeadRoute) {
    setRoutes((prev) => prev.map((r) => (r.id === route.id ? { ...r, active: !r.active } : r)));
    fetch(`/api/admin/lead-routing/${route.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !route.active }) }).catch(() => {});
  }

  const actionTypes = [
    { value: 'assign', label: 'Assign to Doctor' },
    { value: 'notify', label: 'Send Notification' },
    { value: 'priority', label: 'Set Priority Level' },
    { value: 'route', label: 'Route to Pool' },
  ];

  const fieldOptions = [
    { value: 'city', label: 'City' },
    { value: 'state', label: 'State' },
    { value: 'specialty', label: 'Specialty' },
    { value: 'message', label: 'Message Contains' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'source', label: 'UTM Source' },
  ];

  const operators = [
    { value: 'equals', label: 'equals' },
    { value: 'contains', label: 'contains' },
    { value: 'starts_with', label: 'starts with' },
    { value: 'greater_than', label: 'greater than' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Lead Routing</h1>
          <p className="text-gray-500 mt-1">Configure automatic lead distribution rules</p>
        </div>
        <button
          onClick={() =>
            setEditingRoute({
              id: `new-${Date.now()}`,
              name: 'New Route',
              rules: [],
              action: { type: 'assign', value: '' },
              priority: routes.length + 1,
              active: true,
            })
          }
          className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors"
        >
          + Add Route
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-8 w-fit">
        {(['rules', 'doctors', 'analytics'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
              activeTab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === 'rules' && (
        <div className="space-y-4">
          {/* Route editor */}
          {editingRoute && (
            <div className="bg-white rounded-xl border border-violet-200 p-6 shadow-sm ring-1 ring-violet-100 mb-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Edit Route</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Route Name</label>
                  <input
                    type="text"
                    value={editingRoute.name}
                    onChange={(e) => setEditingRoute({ ...editingRoute, name: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Action Type</label>
                  <select
                    value={editingRoute.action.type}
                    onChange={(e) => setEditingRoute({ ...editingRoute, action: { ...editingRoute.action, type: e.target.value as LeadRoute['action']['type'] } })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500"
                  >
                    {actionTypes.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Action Value / Doctor</label>
                  {editingRoute.action.type === 'assign' ? (
                    <select
                      value={editingRoute.action.value}
                      onChange={(e) => setEditingRoute({ ...editingRoute, action: { ...editingRoute.action, value: e.target.value } })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500"
                    >
                      <option value="">Select doctor...</option>
                      {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={editingRoute.action.value}
                      onChange={(e) => setEditingRoute({ ...editingRoute, action: { ...editingRoute.action, value: e.target.value } })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500"
                    />
                  )}
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Rules (all must match)</label>
                  <button onClick={() => addRule(editingRoute)} className="text-xs font-medium text-violet-600 hover:text-violet-700">
                    + Add Rule
                  </button>
                </div>
                {editingRoute.rules.length === 0 && (
                  <p className="text-sm text-gray-400 italic">No rules — this route will always match</p>
                )}
                <div className="space-y-2">
                  {editingRoute.rules.map((rule, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {i > 0 && <span className="text-xs text-gray-400 font-medium">AND</span>}
                      <select
                        value={rule.field}
                        onChange={(e) => {
                          const rules = [...editingRoute.rules];
                          rules[i] = { ...rules[i], field: e.target.value };
                          setEditingRoute({ ...editingRoute, rules });
                        }}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:ring-violet-500"
                      >
                        {fieldOptions.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                      </select>
                      <select
                        value={rule.operator}
                        onChange={(e) => {
                          const rules = [...editingRoute.rules];
                          rules[i] = { ...rules[i], operator: e.target.value };
                          setEditingRoute({ ...editingRoute, rules });
                        }}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:ring-violet-500"
                      >
                        {operators.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <input
                        type="text"
                        value={rule.value}
                        onChange={(e) => {
                          const rules = [...editingRoute.rules];
                          rules[i] = { ...rules[i], value: e.target.value };
                          setEditingRoute({ ...editingRoute, rules });
                        }}
                        placeholder="value"
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:ring-violet-500"
                      />
                      <button onClick={() => removeRule(editingRoute, i)} className="text-gray-400 hover:text-red-500 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => saveRoute(editingRoute)}
                  disabled={saving}
                  className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Route'}
                </button>
                <button onClick={() => setEditingRoute(null)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Route list */}
          {routes.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-500">No routing rules configured. Create your first rule.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rules</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {routes.map((route) => (
                    <tr key={route.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{route.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{route.rules.length} rule(s)</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{route.action.type} → {route.action.value || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{route.priority}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleActive(route)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            route.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {route.active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setEditingRoute(route)}
                          className="text-xs font-medium text-violet-600 hover:text-violet-700"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'doctors' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Specialty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned Leads</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {doctors.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{d.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{d.specialty}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{d.capacity}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">—</td>
                </tr>
              ))}
              {doctors.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No doctors found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-500">Total Leads (30d)</p>
            <p className="text-3xl font-semibold text-gray-900 mt-2">247</p>
            <p className="text-xs text-emerald-600 mt-1">+12% vs prev month</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-500">Auto-Routed</p>
            <p className="text-3xl font-semibold text-gray-900 mt-2">89%</p>
            <p className="text-xs text-gray-400 mt-1">of all leads</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-500">Avg Response Time</p>
            <p className="text-3xl font-semibold text-gray-900 mt-2">2.3h</p>
            <p className="text-xs text-emerald-600 mt-1">-18min vs prev month</p>
          </div>
        </div>
      )}
    </div>
  );
}