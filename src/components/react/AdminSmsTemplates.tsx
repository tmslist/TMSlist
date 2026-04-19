import { useState, useEffect, useCallback } from 'react';

interface SmsTemplate {
  id: string;
  name: string;
  body: string;
  type: string;
  characterCount: number;
  segment: string;
  carrierRouting: string;
  createdAt: string;
  updatedAt: string;
}

const VARIABLES = ['{{name}}', '{{clinicName}}', '{{date}}', '{{appointmentTime}}', '{{clinicPhone}}', '{{link}}'];

const SMS_TYPES = ['reminder', 'confirmation', 'cancellation', 'follow_up', 'promotion', 'alert'];
const CARRIER_ROUTING_OPTIONS = ['default', 'att', 'verizon', 'tmobile', 'sprint', 'multi_carrier'];
const SEGMENTS = ['all_patients', 'new_patients', 'follow_up_due', 'appointment_today', 'lapsed'];

const MAX_CHARS = 160;
const MAX_MULTI_PART = 306;

function CharacterCount({ count }: { count: number }) {
  const isOver = count > MAX_CHARS;
  const isMulti = count > MAX_CHARS && count <= MAX_MULTI_PART;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isOver ? 'bg-red-500' : count > MAX_CHARS * 0.8 ? 'bg-amber-400' : 'bg-emerald-400'
          }`}
          style={{ width: `${Math.min((count / MAX_MULTI_PART) * 100, 100)}%` }}
        />
      </div>
      <span className={`text-[11px] font-medium ${isOver ? 'text-red-600' : 'text-gray-500'}`}>
        {count}/{MAX_CHARS}{isMulti ? ` (${Math.ceil(count / MAX_CHARS)} SMS)` : ''}
      </span>
    </div>
  );
}

function VariableChip({ variable, onClick }: { variable: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-2 py-0.5 bg-violet-50 text-violet-700 text-[11px] font-mono rounded hover:bg-violet-100 transition-colors"
    >
      {variable}
    </button>
  );
}

export default function AdminSmsTemplates() {
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SmsTemplate | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/sms-templates');
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      const json = await res.json();
      if (res.ok) setTemplates(json.templates ?? []);
      else setTemplates([]);
    } catch {
      showToast('error', 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  function startEdit(t: SmsTemplate) {
    setEditing(t);
    setShowForm(true);
  }

  function startNew() {
    setEditing({
      id: '',
      name: '',
      body: '',
      type: 'reminder',
      characterCount: 0,
      segment: 'all_patients',
      carrierRouting: 'default',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!editing) return;
    if (!editing.name.trim() || !editing.body.trim()) {
      showToast('error', 'Name and body are required');
      return;
    }
    setSaving(true);
    try {
      const method = editing.id ? 'PUT' : 'POST';
      const url = editing.id ? `/api/admin/sms-templates/${editing.id}` : '/api/admin/sms-templates';
      const payload = { ...editing, characterCount: editing.body.length };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (res.ok) {
        showToast('success', editing.id ? 'Template updated' : 'Template created');
        setShowForm(false);
        setEditing(null);
        fetchTemplates();
      } else {
        showToast('error', 'Failed to save template');
      }
    } catch {
      showToast('error', 'Failed to save template');
    } finally {
      setSaving(false);
    }
  }

  function insertVariable() {
    if (editing) setEditing((v) => v ? { ...v, body: v.body + '{{variable}}' } : v);
  }

  const filtered = filter ? templates.filter((t) => t.type === filter) : templates;

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">SMS Templates</h2>
          <p className="text-sm text-gray-500 mt-0.5">{templates.length} template{templates.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={startNew}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          + New Template
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            !filter ? 'bg-violet-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >All</button>
        {SMS_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize ${
              filter === t ? 'bg-violet-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >{t.replace('_', ' ')}</button>
        ))}
      </div>

      {/* Editor panel */}
      {showForm && editing && (
        <div className="bg-white rounded-xl border border-violet-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 bg-violet-50 border-b border-violet-200">
            <span className="text-sm font-semibold text-violet-700">
              {editing.id ? 'Edit Template' : 'New Template'}
            </span>
            <button
              onClick={() => { setShowForm(false); setEditing(null); }}
              className="text-violet-400 hover:text-violet-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Template Name *</label>
                <input
                  type="text"
                  value={editing.name}
                  onChange={(e) => setEditing((v) => v ? { ...v, name: e.target.value } : v)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                  placeholder="e.g. Appointment Reminder"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                <select
                  value={editing.type}
                  onChange={(e) => setEditing((v) => v ? { ...v, type: e.target.value } : v)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                >
                  {SMS_TYPES.map((t) => (
                    <option key={t} value={t} className="capitalize">{t.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Segment</label>
                <select
                  value={editing.segment}
                  onChange={(e) => setEditing((v) => v ? { ...v, segment: e.target.value } : v)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                >
                  {SEGMENTS.map((s) => (
                    <option key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Carrier Routing</label>
                <select
                  value={editing.carrierRouting}
                  onChange={(e) => setEditing((v) => v ? { ...v, carrierRouting: e.target.value } : v)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                >
                  {CARRIER_ROUTING_OPTIONS.map((c) => (
                    <option key={c} value={c} className="capitalize">{c.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Variables</label>
              <div className="flex gap-2 flex-wrap">
                {VARIABLES.map((v) => (
                  <VariableChip key={v} variable={v} onClick={insertVariable} />
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-gray-600">Message Body *</label>
                <span className="text-[11px] text-gray-400">Supports {{variables}}</span>
              </div>
              <textarea
                value={editing.body}
                onChange={(e) => setEditing((v) => v ? { ...v, body: e.target.value, characterCount: e.target.value.length } : v)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200 resize-y font-mono"
                placeholder="Enter SMS message..."
              />
              <div className="mt-2">
                <CharacterCount count={editing.body.length} />
              </div>
            </div>

            {editing.body && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-[11px] font-semibold text-gray-400 uppercase mb-2">Preview</p>
                <p className="text-sm text-gray-700">{editing.body}</p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
            <button
              onClick={() => { setShowForm(false); setEditing(null); }}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </div>
      )}

      {/* Templates list */}
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block w-5 h-5 border-2 border-gray-300 border-t-violet-600 rounded-full animate-spin mb-2" />
          <p className="text-gray-400 text-sm">Loading templates...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <h4 className="text-sm font-medium text-gray-700 mb-1">No SMS templates yet</h4>
          <p className="text-sm text-gray-500">Create your first SMS template.</p>
          <button onClick={startNew} className="mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors">
            + Create Template
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filtered.map((t) => (
              <div key={t.id} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-semibold rounded uppercase">
                      {t.type.replace('_', ' ')}
                    </span>
                    {t.carrierRouting !== 'default' && (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-semibold rounded uppercase">
                        {t.carrierRouting}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">{t.name}</h4>
                  <p className="text-xs text-gray-600 mb-2">{t.body}</p>
                  <CharacterCount count={t.characterCount} />
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => startEdit(t)}
                    className="px-3 py-1.5 bg-violet-50 text-violet-700 text-xs font-medium rounded-lg hover:bg-violet-100 transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
