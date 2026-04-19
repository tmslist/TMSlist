import { useState, useEffect, useCallback } from 'react';

interface WorkflowAutomation {
  id: string;
  name: string;
  description: string;
  triggerType: string;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  enabled: boolean;
  runCount: number;
  lastRunAt: string | null;
  createdAt: string;
}

interface WorkflowCondition {
  field: string;
  operator: string;
  value: string;
}

interface WorkflowAction {
  type: string;
  config: Record<string, unknown>;
}

interface ExecutionLog {
  id: string;
  workflowId: string;
  status: 'success' | 'failed' | 'running';
  triggeredAt: string;
  durationMs: number;
  errorMessage?: string;
  inputPayload: Record<string, unknown>;
  outputPayload: Record<string, unknown>;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  triggerType: string;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
}

const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'welcome-email',
    name: 'Welcome Email Sequence',
    description: 'Send welcome email when new user signs up',
    triggerType: 'user.signup',
    conditions: [{ field: 'source', operator: 'equals', value: 'organic' }],
    actions: [{ type: 'send_email', config: { template: 'welcome', delay: 0 } }],
  },
  {
    id: 'clinic-verified-alert',
    name: 'Clinic Verified Alert',
    description: 'Notify admins when a clinic gets verified',
    triggerType: 'clinic.verified',
    conditions: [],
    actions: [
      { type: 'send_notification', config: { channel: 'slack', message: 'New clinic verified!' } },
      { type: 'send_email', config: { to: 'admin@tmslist.com', subject: 'Clinic Verified' } },
    ],
  },
  {
    id: 'lead-assignment',
    name: 'Auto Lead Assignment',
    description: 'Route leads to clinics based on location',
    triggerType: 'lead.created',
    conditions: [{ field: 'type', operator: 'equals', value: 'appointment_request' }],
    actions: [{ type: 'route_lead', config: { method: 'round_robin' } }],
  },
  {
    id: 'review-moderation',
    name: 'Review Moderation Filter',
    description: 'Flag reviews with negative sentiment for review',
    triggerType: 'review.created',
    conditions: [{ field: 'rating', operator: 'less_than', value: '3' }],
    actions: [{ type: 'send_notification', config: { channel: 'slack', message: 'Low rating review needs review' } }],
  },
  {
    id: 'churn-risk-alert',
    name: 'Churn Risk Alert',
    description: 'Alert when user shows inactivity signals',
    triggerType: 'user.inactive',
    conditions: [{ field: 'days_inactive', operator: 'greater_than', value: '30' }],
    actions: [{ type: 'send_email', config: { template: 're-engagement' } }],
  },
];

const TRIGGER_TYPES = [
  { value: 'user.signup', label: 'User Signs Up' },
  { value: 'user.inactive', label: 'User Becomes Inactive' },
  { value: 'lead.created', label: 'New Lead Created' },
  { value: 'clinic.verified', label: 'Clinic Verified' },
  { value: 'clinic.submitted', label: 'Clinic Submitted' },
  { value: 'review.created', label: 'New Review Submitted' },
  { value: 'subscription.activated', label: 'Subscription Activated' },
  { value: 'subscription.cancelled', label: 'Subscription Cancelled' },
  { value: 'job.created', label: 'New Job Posted' },
  { value: 'schedule', label: 'Scheduled (Cron)' },
];

const CONDITION_OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does Not Contain' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'is_empty', label: 'Is Empty' },
  { value: 'is_not_empty', label: 'Is Not Empty' },
];

const ACTION_TYPES = [
  { value: 'send_email', label: 'Send Email' },
  { value: 'send_notification', label: 'Send Notification' },
  { value: 'route_lead', label: 'Route Lead' },
  { value: 'update_clinic', label: 'Update Clinic' },
  { value: 'create_task', label: 'Create Task' },
  { value: 'webhook', label: 'Trigger Webhook' },
  { value: 'tag_user', label: 'Tag User' },
  { value: 'flag_entity', label: 'Flag Entity' },
];

function WorkflowCard({ workflow, onToggle, onEdit }: { workflow: WorkflowAutomation; onToggle: (w: WorkflowAutomation) => void; onEdit: (w: WorkflowAutomation) => void }) {
  const trigger = TRIGGER_TYPES.find(t => t.value === workflow.triggerType);
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${workflow.enabled ? 'bg-emerald-500' : 'bg-gray-300'}`} />
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{workflow.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{workflow.description}</p>
          </div>
        </div>
        <button
          onClick={() => onToggle(workflow)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            workflow.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {workflow.enabled ? 'Active' : 'Disabled'}
        </button>
      </div>

      <div className="flex flex-wrap gap-4 mb-4">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Trigger</p>
          <p className="text-xs text-gray-700 mt-0.5 font-mono bg-gray-50 px-2 py-1 rounded">
            {trigger?.label ?? workflow.triggerType}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Conditions</p>
          <p className="text-xs text-gray-700 mt-0.5">{workflow.conditions.length}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</p>
          <p className="text-xs text-gray-700 mt-0.5">{workflow.actions.length}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Runs</p>
          <p className="text-xs text-gray-700 mt-0.5">{workflow.runCount.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onEdit(workflow)}
          className="px-3 py-1.5 text-xs font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => onToggle(workflow)}
          className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {workflow.enabled ? 'Disable' : 'Enable'}
        </button>
      </div>
    </div>
  );
}

function WorkflowEditor({
  workflow,
  onSave,
  onCancel,
}: {
  workflow: WorkflowAutomation | null;
  onSave: (w: WorkflowAutomation) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(workflow?.name ?? '');
  const [description, setDescription] = useState(workflow?.description ?? '');
  const [triggerType, setTriggerType] = useState(workflow?.triggerType ?? 'lead.created');
  const [conditions, setConditions] = useState<WorkflowCondition[]>(workflow?.conditions ?? []);
  const [actions, setActions] = useState<WorkflowAction[]>(workflow?.actions ?? []);
  const [saving, setSaving] = useState(false);

  const addCondition = () => setConditions(prev => [...prev, { field: '', operator: 'equals', value: '' }]);
  const removeCondition = (i: number) => setConditions(prev => prev.filter((_, idx) => idx !== i));
  const updateCondition = (i: number, updates: Partial<WorkflowCondition>) =>
    setConditions(prev => prev.map((c, idx) => (idx === i ? { ...c, ...updates } : c)));

  const addAction = () => setActions(prev => [...prev, { type: 'send_email', config: {} }]);
  const removeAction = (i: number) => setActions(prev => prev.filter((_, idx) => idx !== i));
  const updateAction = (i: number, updates: Partial<WorkflowAction>) =>
    setActions(prev => prev.map((a, idx) => (idx === i ? { ...a, ...updates } : a)));

  const handleSave = async () => {
    setSaving(true);
    const w: WorkflowAutomation = {
      id: workflow?.id ?? crypto.randomUUID(),
      name,
      description,
      triggerType,
      conditions,
      actions,
      enabled: workflow?.enabled ?? false,
      runCount: workflow?.runCount ?? 0,
      lastRunAt: workflow?.lastRunAt ?? null,
      createdAt: workflow?.createdAt ?? new Date().toISOString(),
    };
    onSave(w);
    setSaving(false);
  };

  return (
    <div className="bg-white rounded-xl border border-violet-200 p-6 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900 mb-6">
        {workflow ? 'Edit Workflow' : 'Create Workflow'}
      </h3>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Workflow Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="New Workflow"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What does this workflow do?"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Trigger</label>
          <select
            value={triggerType}
            onChange={e => setTriggerType(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
          >
            {TRIGGER_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Conditions</label>
            <button onClick={addCondition} className="text-xs text-violet-600 hover:text-violet-700 font-medium">
              + Add Condition
            </button>
          </div>
          {conditions.length === 0 ? (
            <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">No conditions — always runs</p>
          ) : (
            <div className="space-y-2">
              {conditions.map((c, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={c.field}
                    onChange={e => updateCondition(i, { field: e.target.value })}
                    placeholder="field"
                    className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  />
                  <select
                    value={c.operator}
                    onChange={e => updateCondition(i, { operator: e.target.value })}
                    className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  >
                    {CONDITION_OPERATORS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={c.value}
                    onChange={e => updateCondition(i, { value: e.target.value })}
                    placeholder="value"
                    className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  />
                  <button onClick={() => removeCondition(i)} className="text-red-500 hover:text-red-600 text-xs px-1">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Actions</label>
            <button onClick={addAction} className="text-xs text-violet-600 hover:text-violet-700 font-medium">
              + Add Action
            </button>
          </div>
          <div className="space-y-2">
            {actions.map((a, i) => (
              <div key={i} className="flex gap-2 items-center bg-violet-50 rounded-lg px-3 py-2">
                <select
                  value={a.type}
                  onChange={e => updateAction(i, { type: e.target.value })}
                  className="flex-1 rounded-lg border border-violet-200 bg-white px-2 py-1.5 text-xs focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                >
                  {ACTION_TYPES.map(at => (
                    <option key={at.value} value={at.value}>{at.label}</option>
                  ))}
                </select>
                <button onClick={() => removeAction(i)} className="text-red-500 hover:text-red-600 text-xs">
                  Remove
                </button>
              </div>
            ))}
            {actions.length === 0 && (
              <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">No actions defined</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={handleSave}
          disabled={saving || !name}
          className="px-5 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Workflow'}
        </button>
        <button onClick={onCancel} className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

function ExecutionLogTable({ logs }: { logs: ExecutionLog[] }) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        No execution history yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Triggered</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Input</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Output</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {logs.map(log => (
            <tr key={log.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  log.status === 'success' ? 'bg-emerald-100 text-emerald-700' :
                  log.status === 'failed' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {log.status}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-gray-600">
                {new Date(log.triggeredAt).toLocaleString()}
              </td>
              <td className="px-4 py-3 text-xs text-gray-600 font-mono">
                {log.durationMs}ms
              </td>
              <td className="px-4 py-3 text-xs text-gray-500 max-w-32 truncate font-mono">
                {JSON.stringify(log.inputPayload)}
              </td>
              <td className="px-4 py-3 text-xs text-gray-500 max-w-32 truncate font-mono">
                {JSON.stringify(log.outputPayload)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminAutomationWorkflows() {
  const [workflows, setWorkflows] = useState<WorkflowAutomation[]>([]);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<WorkflowAutomation | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [activeTab, setActiveTab] = useState<'workflows' | 'history'>('workflows');
  const [toast, setToast] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [wfRes, logRes] = await Promise.all([
        fetch('/api/admin/automation-workflows'),
        fetch('/api/admin/automation-workflows/logs'),
      ]);
      if (wfRes.ok) {
        const d = await wfRes.json();
        setWorkflows(d.workflows ?? []);
      }
      if (logRes.ok) {
        const d = await logRes.json();
        setLogs(d.logs ?? []);
      }
    } catch (err) {
      console.error('Failed to load automation data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const toggleWorkflow = async (workflow: WorkflowAutomation) => {
    const updated = { ...workflow, enabled: !workflow.enabled };
    setWorkflows(prev => prev.map(w => w.id === workflow.id ? updated : w));
    try {
      await fetch(`/api/admin/automation-workflows/${workflow.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: updated.enabled }),
      });
      showToast(`Workflow ${updated.enabled ? 'enabled' : 'disabled'}`);
    } catch {
      setWorkflows(prev => prev.map(w => w.id === workflow.id ? workflow : w));
    }
  };

  const saveWorkflow = async (workflow: WorkflowAutomation) => {
    try {
      const res = await fetch('/api/admin/automation-workflows', {
        method: workflow.id && workflows.find(w => w.id === workflow.id) ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflow),
      });
      if (res.ok) {
        const d = await res.json();
        setWorkflows(prev => {
          const exists = prev.find(w => w.id === workflow.id);
          if (exists) return prev.map(w => w.id === workflow.id ? d.workflow ?? workflow : w);
          return [...prev, workflow];
        });
        showToast('Workflow saved');
        setEditing(null);
      }
    } catch {
      showToast('Failed to save workflow');
    }
  };

  const applyTemplate = (template: WorkflowTemplate) => {
    const workflow: WorkflowAutomation = {
      id: crypto.randomUUID(),
      name: template.name,
      description: template.description,
      triggerType: template.triggerType,
      conditions: template.conditions,
      actions: template.actions,
      enabled: false,
      runCount: 0,
      lastRunAt: null,
      createdAt: new Date().toISOString(),
    };
    setEditing(workflow);
    setShowTemplates(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-lg shadow-lg text-sm animate-in fade-in">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Automation Workflows</h1>
          <p className="text-gray-500 mt-1">Visual workflow builder — trigger, conditions, actions</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTemplates(true)}
            className="px-4 py-2 text-sm font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors"
          >
            Templates
          </button>
          <button
            onClick={() => setEditing({ id: '', name: '', description: '', triggerType: 'lead.created', conditions: [], actions: [], enabled: false, runCount: 0, lastRunAt: null, createdAt: '' })}
            className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors"
          >
            + New Workflow
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {(['workflows', 'history'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'workflows' ? 'Workflows' : 'Execution History'}
            {tab === 'workflows' && (
              <span className="ml-2 px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded text-xs">{workflows.length}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'workflows' ? (
        <div>
          {editing && (
            <div className="mb-6">
              <WorkflowEditor workflow={editing} onSave={saveWorkflow} onCancel={() => setEditing(null)} />
            </div>
          )}

          {showTemplates && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900">Pre-built Templates</h3>
                <button onClick={() => setShowTemplates(false)} className="text-gray-400 hover:text-gray-600">
                  Close
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {WORKFLOW_TEMPLATES.map(t => (
                  <div key={t.id} className="border border-gray-200 rounded-lg p-4 hover:border-violet-300 transition-colors">
                    <h4 className="text-sm font-semibold text-gray-900">{t.name}</h4>
                    <p className="text-xs text-gray-500 mt-1 mb-3">{t.description}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      <span className="px-2 py-0.5 bg-violet-50 text-violet-700 text-xs rounded font-mono">
                        {t.triggerType}
                      </span>
                    </div>
                    <button
                      onClick={() => applyTemplate(t)}
                      className="w-full px-3 py-2 text-xs font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors"
                    >
                      Use Template
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workflows.map(w => (
              <WorkflowCard key={w.id} workflow={w} onToggle={toggleWorkflow} onEdit={setEditing} />
            ))}
            {workflows.length === 0 && (
              <div className="col-span-2 text-center py-16 text-gray-500">
                <p className="text-lg font-medium">No workflows yet</p>
                <p className="text-sm mt-1">Create one from scratch or start with a template.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Execution History</h3>
          </div>
          <ExecutionLogTable logs={logs} />
        </div>
      )}
    </div>
  );
}
