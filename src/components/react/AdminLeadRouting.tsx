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

// ── Smart Routing Tab ─────────────────────────────────────────────────────────

function SmartRoutingTab() {
  const [coldLeads, setColdLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [routingMode, setRoutingMode] = useState<'auto' | 'manual'>('auto');
  const [expandedLead, setExpandedLead] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/intelligent-routing/cold-leads?hours=24')
      .then((r) => r.ok ? r.json() : Promise.resolve({ coldLeads: [] }))
      .then((d) => { setColdLeads(d.coldLeads || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleManualRoute(leadId: string, clinicId: string) {
    try {
      await fetch('/api/admin/intelligent-routing/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, clinicId, reason: 'Manual escalation from cold leads queue' }),
      });
      setColdLeads((prev) => prev.filter((l) => l.lead?.id !== leadId));
    } catch (err) {
      console.error('Routing failed:', err);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[rgba(10,22,40,0.15)] border-t-[#0A1628] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-[var(--ink)]">Intelligent Lead Routing</h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            AI-powered routing based on specialty match, availability, and conversion history
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--muted)]">Routing mode:</span>
          <button
            onClick={() => setRoutingMode(routingMode === 'auto' ? 'manual' : 'auto')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              routingMode === 'auto'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            {routingMode === 'auto' ? 'Auto-Route Enabled' : 'Manual Approval'}
          </button>
        </div>
      </div>

      {/* Cold Leads Queue */}
      <div className="bg-white rounded-xl border border-[var(--line)] overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-[var(--line)] bg-amber-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-amber-900">Cold Leads Queue</h3>
              <p className="text-xs text-amber-700 mt-0.5">
                Leads with no response in 24+ hours — require immediate attention
              </p>
            </div>
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-200 text-amber-800 text-sm font-bold">
              {coldLeads.length}
            </span>
          </div>
        </div>

        {coldLeads.length === 0 ? (
          <div className="px-6 py-8 text-center text-[var(--muted)]">
            No cold leads — all caught up! ✓
          </div>
        ) : (
          <div className="divide-y divide-[var(--line)]">
            {coldLeads.map(({ lead, hoursSinceCreated }) => (
              <div key={lead.id} className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-sm font-medium text-[var(--ink)]">{lead.name || 'Unknown Lead'}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        hoursSinceCreated > 48 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {hoursSinceCreated}h old
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {lead.type}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--muted)]">
                      {lead.email && `${lead.email} · `}{lead.city && ` ${lead.city},`} {lead.state}
                    </p>
                    {lead.message && (
                      <p className="text-sm text-[var(--ink2)] mt-2 bg-[var(--paper2)] rounded-lg p-3">
                        "{lead.message.length > 100 ? lead.message.slice(0, 100) + '...' : lead.message}"
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleManualRoute(lead.id, 'auto')}
                    className="ml-4 px-4 py-2 bg-[var(--ink)] text-white text-sm font-medium rounded-lg hover:bg-[var(--ink2)] transition-colors"
                  >
                    Route Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* How It Works */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6">
        <h3 className="text-sm font-semibold text-blue-900 mb-4">How Smart Routing Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { icon: '🎯', title: 'Specialty Match', desc: 'Depression → TMS centers, not psychiatrists' },
            { icon: '📅', title: 'Availability', desc: 'Routes only to clinics with open slots' },
            { icon: '📊', title: 'Conversion Rate', desc: 'Weighted by historical lead→appt rate' },
            { icon: '⚡', title: 'Response Time', desc: 'Deprioritizes clinics >48h avg response' },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <p className="text-sm font-semibold text-blue-900">{item.title}</p>
                <p className="text-xs text-blue-700 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminLeadRouting() {
  const [routes, setRoutes] = useState<LeadRoute[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'rules' | 'doctors' | 'analytics' | 'smart'>('rules');
  const [editingRoute, setEditingRoute] = useState<LeadRoute | null>(null);
  const [coldLeads, setColdLeads] = useState<any[]>([]);
  const [smartLoading, setSmartLoading] = useState(false);

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
        <div className="w-8 h-8 border-4 border-[rgba(10,22,40,0.15)] border-t-[#0A1628] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--ink)]">Lead Routing</h1>
          <p className="text-[var(--muted)] mt-1">Configure automatic lead distribution rules</p>
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
          className="px-4 py-2 bg-[var(--ink)] text-white text-sm font-medium rounded-lg hover:bg-[var(--ink)] transition-colors"
        >
          + Add Route
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--paper2)] rounded-xl p-1 mb-8 w-fit">
        {(['rules', 'doctors', 'analytics', 'smart'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
              activeTab === t ? 'bg-white text-[var(--ink)] shadow-sm' : 'text-[var(--ink2)] hover:text-[var(--ink)]'
            }`}
          >
            {t === 'smart' ? 'Smart Routing' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'rules' && (
        <div className="space-y-4">
          {/* Route editor */}
          {editingRoute && (
            <div className="bg-white rounded-xl border border-[rgba(10,22,40,0.15)] p-6 shadow-sm ring-1 ring-[rgba(10,22,40,0.1)] mb-6">
              <h3 className="text-base font-semibold text-[var(--ink)] mb-4">Edit Route</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--ink2)] mb-1">Route Name</label>
                  <input
                    type="text"
                    value={editingRoute.name}
                    onChange={(e) => setEditingRoute({ ...editingRoute, name: e.target.value })}
                    className="w-full rounded-lg border border-[var(--line)] px-4 py-2.5 text-sm focus:border-[var(--ink2)] focus:ring-[#1E2A3B]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--ink2)] mb-1">Action Type</label>
                  <select
                    value={editingRoute.action.type}
                    onChange={(e) => setEditingRoute({ ...editingRoute, action: { ...editingRoute.action, type: e.target.value as LeadRoute['action']['type'] } })}
                    className="w-full rounded-lg border border-[var(--line)] px-4 py-2.5 text-sm focus:border-[var(--ink2)] focus:ring-[#1E2A3B]"
                  >
                    {actionTypes.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--ink2)] mb-1">Action Value / Doctor</label>
                  {editingRoute.action.type === 'assign' ? (
                    <select
                      value={editingRoute.action.value}
                      onChange={(e) => setEditingRoute({ ...editingRoute, action: { ...editingRoute.action, value: e.target.value } })}
                      className="w-full rounded-lg border border-[var(--line)] px-4 py-2.5 text-sm focus:border-[var(--ink2)] focus:ring-[#1E2A3B]"
                    >
                      <option value="">Select doctor...</option>
                      {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={editingRoute.action.value}
                      onChange={(e) => setEditingRoute({ ...editingRoute, action: { ...editingRoute.action, value: e.target.value } })}
                      className="w-full rounded-lg border border-[var(--line)] px-4 py-2.5 text-sm focus:border-[var(--ink2)] focus:ring-[#1E2A3B]"
                    />
                  )}
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-[var(--ink2)]">Rules (all must match)</label>
                  <button onClick={() => addRule(editingRoute)} className="text-xs font-medium text-[var(--ink)] hover:text-[var(--ink)]">
                    + Add Rule
                  </button>
                </div>
                {editingRoute.rules.length === 0 && (
                  <p className="text-sm text-[var(--muted)] italic">No rules — this route will always match</p>
                )}
                <div className="space-y-2">
                  {editingRoute.rules.map((rule, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {i > 0 && <span className="text-xs text-[var(--muted)] font-medium">AND</span>}
                      <select
                        value={rule.field}
                        onChange={(e) => {
                          const rules = [...editingRoute.rules];
                          rules[i] = { ...rules[i], field: e.target.value };
                          setEditingRoute({ ...editingRoute, rules });
                        }}
                        className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm focus:border-[var(--ink2)] focus:ring-[#1E2A3B]"
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
                        className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm focus:border-[var(--ink2)] focus:ring-[#1E2A3B]"
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
                        className="flex-1 rounded-lg border border-[var(--line)] px-3 py-2 text-sm focus:border-[var(--ink2)] focus:ring-[#1E2A3B]"
                      />
                      <button onClick={() => removeRule(editingRoute, i)} className="text-[var(--muted)] hover:text-red-500 transition-colors">
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
                  className="px-4 py-2 bg-[var(--ink)] text-white text-sm font-medium rounded-lg hover:bg-[var(--ink)] disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Route'}
                </button>
                <button onClick={() => setEditingRoute(null)} className="px-4 py-2 text-sm font-medium text-[var(--ink2)] hover:bg-[var(--paper2)] rounded-lg transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Route list */}
          {routes.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-[var(--line)]">
              <p className="text-[var(--muted)]">No routing rules configured. Create your first rule.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[var(--line)] overflow-hidden">
              <table className="min-w-full divide-y divide-[var(--line)]">
                <thead className="bg-[var(--paper2)]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase">Rules</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase">Status</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {routes.map((route) => (
                    <tr key={route.id} className="hover:bg-[var(--paper2)]">
                      <td className="px-6 py-4 text-sm font-semibold text-[var(--ink)]">{route.name}</td>
                      <td className="px-6 py-4 text-sm text-[var(--ink2)]">{route.rules.length} rule(s)</td>
                      <td className="px-6 py-4 text-sm text-[var(--ink2)]">{route.action.type} → {route.action.value || '—'}</td>
                      <td className="px-6 py-4 text-sm text-[var(--ink2)]">{route.priority}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleActive(route)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            route.active ? 'bg-emerald-100 text-emerald-700' : 'bg-[var(--paper2)] text-[var(--muted)]'
                          }`}
                        >
                          {route.active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setEditingRoute(route)}
                          className="text-xs font-medium text-[var(--ink)] hover:text-[var(--ink)]"
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
        <div className="bg-white rounded-xl border border-[var(--line)] overflow-hidden">
          <table className="min-w-full divide-y divide-[var(--line)]">
            <thead className="bg-[var(--paper2)]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase">Doctor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase">Specialty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase">Capacity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase">Assigned Leads</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {doctors.map((d) => (
                <tr key={d.id} className="hover:bg-[var(--paper2)]">
                  <td className="px-6 py-4 text-sm font-medium text-[var(--ink)]">{d.name}</td>
                  <td className="px-6 py-4 text-sm text-[var(--ink2)]">{d.specialty}</td>
                  <td className="px-6 py-4 text-sm text-[var(--ink2)]">{d.capacity}</td>
                  <td className="px-6 py-4 text-sm text-[var(--ink2)]">—</td>
                </tr>
              ))}
              {doctors.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-[var(--muted)]">No doctors found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-[var(--line)] p-6">
            <p className="text-sm font-medium text-[var(--muted)]">Total Leads (30d)</p>
            <p className="text-3xl font-semibold text-[var(--ink)] mt-2">247</p>
            <p className="text-xs text-emerald-600 mt-1">+12% vs prev month</p>
          </div>
          <div className="bg-white rounded-xl border border-[var(--line)] p-6">
            <p className="text-sm font-medium text-[var(--muted)]">Auto-Routed</p>
            <p className="text-3xl font-semibold text-[var(--ink)] mt-2">89%</p>
            <p className="text-xs text-[var(--muted)] mt-1">of all leads</p>
          </div>
          <div className="bg-white rounded-xl border border-[var(--line)] p-6">
            <p className="text-sm font-medium text-[var(--muted)]">Avg Response Time</p>
            <p className="text-3xl font-semibold text-[var(--ink)] mt-2">2.3h</p>
            <p className="text-xs text-emerald-600 mt-1">-18min vs prev month</p>
          </div>
        </div>
      )}

      {activeTab === 'smart' && <SmartRoutingTab />}
    </div>
  );
}