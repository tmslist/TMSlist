import { useState, useEffect, useCallback } from 'react';

interface AiModel {
  id: string;
  name: string;
  provider: string;
  modelId: string;
  temperature: number;
  maxTokens: number;
  enabled: boolean;
  costPer1kTokens: number;
  avgLatencyMs: number;
}

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  prompt: string;
  modelId: string;
  variables: string[];
  createdAt: string;
}

interface UsageLog {
  id: string;
  modelId: string;
  modelName: string;
  inputTokens: number;
  outputTokens: number;
  costCents: number;
  latencyMs: number;
  userId: string | null;
  createdAt: string;
}

interface UsageSummary {
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostCents: number;
  periodStart: string;
  periodEnd: string;
}

const AVAILABLE_MODELS: Omit<AiModel, 'enabled' | avgLatencyMs | 'costPer1kTokens'>[] = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', modelId: 'gpt-4o', temperature: 0.7, maxTokens: 4096 },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', modelId: 'gpt-4o-mini', temperature: 0.7, maxTokens: 4096 },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI', modelId: 'gpt-4-turbo', temperature: 0.7, maxTokens: 8192 },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', modelId: 'claude-3-5-sonnet-latest', temperature: 0.7, maxTokens: 8192 },
  { id: 'claude-3-5-haiku', name: 'Claude 3.5 Haiku', provider: 'Anthropic', modelId: 'claude-3-5-haiku-latest', temperature: 0.7, maxTokens: 4096 },
  { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic', modelId: 'claude-3-opus-latest', temperature: 0.7, maxTokens: 8192 },
  { id: 'gemini-2-flash', name: 'Gemini 2.0 Flash', provider: 'Google', modelId: 'gemini-2.0-flash', temperature: 0.7, maxTokens: 8192 },
  { id: 'llama-3-1-70b', name: 'Llama 3.1 70B', provider: 'Meta', modelId: 'llama-3.1-70b-instruct', temperature: 0.7, maxTokens: 4096 },
];

const MODEL_PROVIDER_COLORS: Record<string, string> = {
  OpenAI: 'bg-green-100 text-green-700',
  Anthropic: 'bg-orange-100 text-orange-700',
  Google: 'bg-blue-100 text-blue-700',
  Meta: 'bg-sky-100 text-sky-700',
};

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
      <div className="px-6 py-5 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{description}</p>
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
    </div>
  );
}

function ModelCard({ model, onEdit }: { model: AiModel; onEdit: (m: AiModel) => void }) {
  const colorClass = MODEL_PROVIDER_COLORS[model.provider] ?? 'bg-gray-100 text-gray-700';
  return (
    <div className="border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{model.name}</h3>
          <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}>
            {model.provider}
          </span>
        </div>
        <button
          onClick={() => onEdit(model)}
          className="px-3 py-1 text-xs font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors"
        >
          Configure
        </button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-xs font-medium text-gray-500">Temperature</p>
          <p className="text-xs text-gray-700 mt-0.5 font-mono">{model.temperature}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500">Max Tokens</p>
          <p className="text-xs text-gray-700 mt-0.5 font-mono">{model.maxTokens.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500">Cost / 1K tok</p>
          <p className="text-xs text-gray-700 mt-0.5 font-mono">${model.costPer1kTokens.toFixed(4)}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${model.enabled ? 'bg-emerald-500' : 'bg-gray-300'}`} />
        <span className="text-xs text-gray-500">{model.enabled ? 'Enabled' : 'Disabled'}</span>
        {model.avgLatencyMs > 0 && (
          <span className="text-xs text-gray-400 ml-auto">~{model.avgLatencyMs}ms</span>
        )}
      </div>
    </div>
  );
}

function UsageChartRow({ log }: { log: UsageLog }) {
  const totalTokens = log.inputTokens + log.outputTokens;
  const costDisplay = (log.costCents / 100).toFixed(4);
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 text-xs text-gray-600">{new Date(log.createdAt).toLocaleString()}</td>
      <td className="px-4 py-3 text-xs font-medium text-gray-900">{log.modelName}</td>
      <td className="px-4 py-3 text-xs text-gray-600 font-mono">{log.inputTokens.toLocaleString()}</td>
      <td className="px-4 py-3 text-xs text-gray-600 font-mono">{log.outputTokens.toLocaleString()}</td>
      <td className="px-4 py-3 text-xs text-gray-600 font-mono">{totalTokens.toLocaleString()}</td>
      <td className="px-4 py-3 text-xs text-gray-600 font-mono">${costDisplay}</td>
      <td className="px-4 py-3 text-xs text-gray-600 font-mono">{log.latencyMs}ms</td>
    </tr>
  );
}

function PromptTemplateEditor({
  template,
  models,
  onSave,
  onCancel,
}: {
  template: PromptTemplate | null;
  models: AiModel[];
  onSave: (t: PromptTemplate) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(template?.name ?? '');
  const [description, setDescription] = useState(template?.description ?? '');
  const [prompt, setPrompt] = useState(template?.prompt ?? '');
  const [modelId, setModelId] = useState(template?.modelId ?? models[0]?.id ?? '');
  const [variables, setVariables] = useState<string[]>(template?.variables ?? []);
  const [newVar, setNewVar] = useState('');

  const addVar = () => {
    if (newVar.trim() && !variables.includes(newVar.trim())) {
      setVariables(prev => [...prev, newVar.trim()]);
      setNewVar('');
    }
  };

  const handleSave = () => {
    onSave({
      id: template?.id ?? crypto.randomUUID(),
      name,
      description,
      prompt,
      modelId,
      variables,
      createdAt: template?.createdAt ?? new Date().toISOString(),
    });
  };

  return (
    <div className="bg-white rounded-xl border border-violet-200 p-6 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900 mb-6">
        {template ? 'Edit Prompt Template' : 'New Prompt Template'}
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Clinic Description Generator"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Generates SEO-optimized clinic descriptions"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
          <select
            value={modelId}
            onChange={e => setModelId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
          >
            {models.filter(m => m.enabled).map(m => (
              <option key={m.id} value={m.id}>{m.name} ({m.provider})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prompt Template</label>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Write a compelling description for {{clinic_name}}, a {{provider_type}} in {{city}}, {{state}}."
            rows={6}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 font-mono text-xs"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Variables</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {variables.map(v => (
              <span key={v} className="px-2 py-1 bg-violet-50 text-violet-700 rounded text-xs font-mono flex items-center gap-1">
                {`{{${v}}}`}
                <button onClick={() => setVariables(prev => prev.filter(x => x !== v))} className="text-violet-400 hover:text-violet-600 ml-1">
                  x
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newVar}
              onChange={e => setNewVar(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addVar())}
              placeholder="clinic_name"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            />
            <button onClick={addVar} className="px-3 py-2 text-sm text-violet-600 hover:bg-violet-50 rounded-lg transition-colors">
              Add
            </button>
          </div>
        </div>
      </div>
      <div className="flex gap-3 mt-6">
        <button
          onClick={handleSave}
          disabled={!name || !prompt}
          className="px-5 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors"
        >
          Save Template
        </button>
        <button onClick={onCancel} className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function AdminAiSettings() {
  const [models, setModels] = useState<AiModel[]>([]);
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);
  const [usageSummary, setUsageSummary] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingModel, setEditingModel] = useState<AiModel | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
  const [activeTab, setActiveTab] = useState<'models' | 'templates' | 'usage'>('models');
  const [toast, setToast] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [mRes, tRes, uRes] = await Promise.all([
        fetch('/api/admin/ai-models'),
        fetch('/api/admin/ai-templates'),
        fetch('/api/admin/ai-usage-logs'),
      ]);
      if (mRes.ok) { const d = await mRes.json(); setModels(d.models ?? []); }
      if (tRes.ok) { const d = await tRes.json(); setTemplates(d.templates ?? []); }
      if (uRes.ok) { const d = await uRes.json(); setUsageLogs(d.logs ?? []); setUsageSummary(d.summary ?? null); }
    } catch (err) {
      console.error('Failed to load AI settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const toggleModel = async (model: AiModel) => {
    const updated = { ...model, enabled: !model.enabled };
    setModels(prev => prev.map(m => m.id === model.id ? updated : m));
    try {
      await fetch(`/api/admin/ai-models/${model.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: updated.enabled }),
      });
      showToast(`${model.name} ${updated.enabled ? 'enabled' : 'disabled'}`);
    } catch {
      setModels(prev => prev.map(m => m.id === model.id ? model : m));
    }
  };

  const saveModelSettings = async (model: AiModel) => {
    setModels(prev => prev.map(m => m.id === model.id ? model : m));
    try {
      await fetch(`/api/admin/ai-models/${model.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(model),
      });
      showToast('Model settings saved');
      setEditingModel(null);
    } catch {
      showToast('Failed to save model settings');
    }
  };

  const saveTemplate = async (template: PromptTemplate) => {
    try {
      const res = await fetch('/api/admin/ai-templates', {
        method: template.id && templates.find(t => t.id === template.id) ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });
      if (res.ok) {
        const d = await res.json();
        setTemplates(prev => {
          const exists = prev.find(t => t.id === template.id);
          if (exists) return prev.map(t => t.id === template.id ? d.template ?? template : t);
          return [...prev, template];
        });
        showToast('Template saved');
        setEditingTemplate(null);
      }
    } catch {
      showToast('Failed to save template');
    }
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
          <h1 className="text-2xl font-semibold text-gray-900">AI / ML Settings</h1>
          <p className="text-gray-500 mt-1">Model selection, prompt templates, and usage monitoring</p>
        </div>
        <button
          onClick={() => setEditingTemplate({ id: '', name: '', description: '', prompt: '', modelId: '', variables: [], createdAt: '' })}
          className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors"
        >
          + New Template
        </button>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {(['models', 'templates', 'usage'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'models' ? 'Models' : tab === 'templates' ? 'Prompt Templates' : 'Usage Logs'}
          </button>
        ))}
      </div>

      {activeTab === 'models' && (
        <div>
          {editingModel && (
            <div className="bg-white rounded-xl border border-violet-200 p-6 mb-6 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900 mb-6">Configure {editingModel.name}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
                  <input
                    type="range"
                    min={0}
                    max={2}
                    step={0.1}
                    value={editingModel.temperature}
                    onChange={e => setEditingModel({ ...editingModel, temperature: parseFloat(e.target.value) })}
                    className="w-full accent-violet-600"
                  />
                  <p className="text-xs text-gray-500 mt-1 text-center">{editingModel.temperature}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Tokens</label>
                  <input
                    type="number"
                    value={editingModel.maxTokens}
                    onChange={e => setEditingModel({ ...editingModel, maxTokens: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => saveModelSettings(editingModel)}
                  className="px-5 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-colors"
                >
                  Save
                </button>
                <button onClick={() => setEditingModel(null)} className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}
          <Section title="AI Models" description="Configure available AI models and their parameters">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {models.map(m => (
                <ModelCard key={m.id} model={m} onEdit={setEditingModel} />
              ))}
              {models.length === 0 && (
                <p className="col-span-3 text-sm text-gray-500 text-center py-8">No models configured. Add models via the API.</p>
              )}
            </div>
          </Section>
        </div>
      )}

      {activeTab === 'templates' && (
        <div>
          {editingTemplate && (
            <div className="mb-6">
              <PromptTemplateEditor template={editingTemplate} models={models} onSave={saveTemplate} onCancel={() => setEditingTemplate(null)} />
            </div>
          )}
          <Section title="Prompt Templates" description="Manage reusable prompt templates with variable substitution">
            {templates.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No templates yet. Create one above.</p>
            ) : (
              <div className="space-y-3">
                {templates.map(t => {
                  const model = models.find(m => m.id === t.modelId);
                  return (
                    <div key={t.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900">{t.name}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {t.variables.map(v => (
                              <span key={v} className="px-1.5 py-0.5 bg-violet-50 text-violet-700 text-xs rounded font-mono">{`{{${v}}}`}</span>
                            ))}
                            {model && (
                              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{model.name}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingTemplate(t)} className="px-3 py-1.5 text-xs font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors">
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>
        </div>
      )}

      {activeTab === 'usage' && (
        <div>
          {usageSummary && (
            <Section title="Usage Summary" description="Current billing period overview">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Requests</p>
                  <p className="text-xl font-semibold text-gray-900 mt-1">{usageSummary.totalRequests.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Input Tokens</p>
                  <p className="text-xl font-semibold text-gray-900 mt-1">{usageSummary.totalInputTokens.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Output Tokens</p>
                  <p className="text-xl font-semibold text-gray-900 mt-1">{usageSummary.totalOutputTokens.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Est. Cost</p>
                  <p className="text-xl font-semibold text-violet-600 mt-1">${(usageSummary.totalCostCents / 100).toFixed(2)}</p>
                </div>
              </div>
            </Section>
          )}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Recent Usage Logs</h3>
            </div>
            {usageLogs.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-gray-500">No usage logs yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Input</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Output</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Latency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {usageLogs.map(log => <UsageChartRow key={log.id} log={log} />)}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
