import { useState, useEffect, useCallback } from 'react';

interface EmailTemplate {
  id: string;
  key: string;
  name: string;
  subject: string;
  body: string;
  type: string;
  variables: string[];
  variantA?: string;
  variantB?: string;
  abTestEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TemplateInput {
  key: string;
  name: string;
  subject: string;
  body: string;
  type: string;
  variables: string[];
  variantA: string;
  variantB: string;
  abTestEnabled: boolean;
}

const VARIABLE_HINTS = [
  { var: '{{name}}', desc: 'Recipient first name' },
  { var: '{{clinicName}}', desc: 'Clinic/business name' },
  { var: '{{email}}', desc: 'Recipient email' },
  { var: '{{date}}', desc: 'Current date' },
  { var: '{{link}}', desc: 'Action/link URL' },
  { var: '{{unsubscribe}}', desc: 'Unsubscribe link' },
];

const EMAIL_TYPES = ['welcome', 'appointment', 'reminder', 'newsletter', 'alert', 'notification', 'marketing'];

function VariableChips({ onInsert }: { onInsert: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {VARIABLE_HINTS.map(({ var: v, desc }) => (
        <button
          key={v}
          type="button"
          onClick={() => onInsert(v)}
          title={desc}
          className="px-2 py-0.5 bg-[rgba(10,22,40,0.08)] text-[var(--ink)] text-[11px] font-mono rounded hover:bg-[rgba(10,22,40,0.08)] transition-colors"
        >
          {v}
        </button>
      ))}
    </div>
  );
}

function TemplateCard({
  template,
  onEdit,
}: {
  template: EmailTemplate;
  onEdit: (t: EmailTemplate) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [preview, setPreview] = useState(false);
  const [previewVars, setPreviewVars] = useState<Record<string, string>>({});
  const [showVars, setShowVars] = useState(false);

  function previewBody(body: string): string {
    let result = body;
    Object.entries(previewVars).forEach(([k, v]) => {
      result = result.replace(new RegExp(k.replace(/[{}]/g, ''), 'g'), v || `[${k}]`);
    });
    return result;
  }

  return (
    <div className="bg-white rounded-xl border border-[var(--line)] shadow-sm overflow-hidden">
      <div
        className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-[var(--paper2)] transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="px-2 py-0.5 bg-[var(--paper2)] text-[var(--ink)] text-[10px] font-semibold rounded uppercase">
              {template.type}
            </span>
            {template.abTestEnabled && (
              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-semibold rounded uppercase">
                A/B
              </span>
            )}
          </div>
          <h4 className="text-sm font-semibold text-[var(--ink)]">{template.name}</h4>
          <p className="text-xs text-[var(--muted)] mt-0.5 truncate">{template.subject}</p>
        </div>
        <div className="flex gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => { setPreview((v) => !v); setShowVars(true); }}
            className="px-3 py-1.5 bg-[var(--paper2)] text-[var(--ink2)] text-xs font-medium rounded-lg hover:bg-[var(--paper2)] transition-colors"
          >
            {preview ? 'Edit' : 'Preview'}
          </button>
          <button
            onClick={() => onEdit(template)}
            className="px-3 py-1.5 bg-[rgba(10,22,40,0.08)] text-[var(--ink)] text-xs font-medium rounded-lg hover:bg-[rgba(10,22,40,0.08)] transition-colors"
          >
            Edit
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-[var(--line)] bg-[var(--paper2)] p-5 space-y-3">
          {preview ? (
            <div className="space-y-3">
              <div>
                <span className="text-xs font-semibold text-[var(--muted)] uppercase">Subject: </span>
                <span className="text-sm text-[var(--ink)] font-medium">{previewBody(template.subject)}</span>
              </div>
              {showVars && (
                <div className="bg-white border border-[var(--line)] rounded-lg p-3 space-y-2">
                  <p className="text-[11px] text-[var(--muted)] font-medium">Preview Variables</p>
                  {VARIABLE_HINTS.map(({ var: v, desc }) => (
                    <div key={v} className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-[var(--ink)] w-24">{v}</span>
                      <input
                        type="text"
                        value={previewVars[v] ?? ''}
                        onChange={(e) => setPreviewVars((pv) => ({ ...pv, [v]: e.target.value }))}
                        className="flex-1 px-2 py-1 border border-[var(--line)] rounded text-xs"
                        placeholder={desc}
                      />
                    </div>
                  ))}
                </div>
              )}
              <div className="bg-white border border-[var(--line)] rounded-lg p-4 text-sm text-[var(--ink2)] whitespace-pre-wrap">
                {previewBody(template.body) || <span className="text-[var(--line)] italic">No body content</span>}
              </div>
              {template.abTestEnabled && template.variantB && (
                <div>
                  <p className="text-xs font-semibold text-amber-600 uppercase mb-1">Variant B</p>
                  <div className="bg-white border border-amber-200 rounded-lg p-4 text-sm text-[var(--ink2)] whitespace-pre-wrap">
                    {previewBody(template.variantB)}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--muted)] uppercase">Variables</span>
                <span className="text-[11px] text-[var(--muted)]">{template.variables?.length ?? 0} detected</span>
              </div>
              <VariableChips onInsert={() => {}} />
              <div>
                <span className="text-xs font-semibold text-[var(--muted)] uppercase">Body</span>
                <p className="text-sm text-[var(--ink2)] mt-1 whitespace-pre-wrap">{template.body}</p>
              </div>
              {template.abTestEnabled && template.variantB && (
                <div>
                  <span className="text-xs font-semibold text-amber-600 uppercase">Variant B</span>
                  <p className="text-sm text-[var(--ink2)] mt-1 whitespace-pre-wrap">{template.variantB}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminEmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
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
      const res = await fetch('/api/admin/email-templates');
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      const json = await res.json();
      if (res.ok) {
        const rows: any[] = json.data ?? json.templates ?? [];
        setTemplates(rows.map((t: any) => ({
          ...t,
          body: t.bodyHtml ?? t.body ?? '',
        })));
      }
      else setTemplates([]);
    } catch {
      showToast('error', 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  function startEdit(t: EmailTemplate) {
    setEditing(t);
    setShowForm(true);
  }

  function startNew() {
    setEditing({
      id: '',
      key: '',
      name: '',
      subject: '',
      body: '',
      type: 'notification',
      variables: [],
      variantA: '',
      variantB: '',
      abTestEnabled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!editing) return;
    if (!editing.name.trim() || !editing.subject.trim()) {
      showToast('error', 'Name and subject are required');
      return;
    }
    if (!editing.id && !editing.key.trim()) {
      showToast('error', 'Template key is required');
      return;
    }
    setSaving(true);
    try {
      const isEdit = !!editing.id;
      const method = isEdit ? 'PATCH' : 'POST';
      const url = isEdit
        ? `/api/admin/email-templates?id=${editing.id}`
        : '/api/admin/email-templates';
      const payload = {
        ...(isEdit ? { key: editing.key } : {}),
        name: editing.name,
        subject: editing.subject,
        bodyHtml: editing.body,
        bodyText: null,
        variables: editing.variables,
        active: true,
      };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (res.ok) {
        showToast('success', isEdit ? 'Template updated' : 'Template created');
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

  function insertVariable(text: string, setText: (t: string) => void) {
    setText(text + '{{variable}}');
  }

  const filtered = filter
    ? templates.filter((t) => t.type === filter)
    : templates;

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
          <h2 className="text-xl font-semibold text-[var(--ink)]">Email Templates</h2>
          <p className="text-sm text-[var(--muted)] mt-0.5">{templates.length} template{templates.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={startNew}
          className="px-4 py-2 bg-[var(--ink)] hover:bg-[var(--ink)] text-white text-sm font-semibold rounded-lg transition-colors"
        >
          + New Template
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            !filter ? 'bg-[var(--ink)] text-white' : 'bg-white border border-[var(--line)] text-[var(--ink2)] hover:bg-[var(--paper2)]'
          }`}
        >All</button>
        {EMAIL_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize ${
              filter === t ? 'bg-[var(--ink)] text-white' : 'bg-white border border-[var(--line)] text-[var(--ink2)] hover:bg-[var(--paper2)]'
            }`}
          >{t}</button>
        ))}
      </div>

      {/* Editor panel */}
      {showForm && editing && (
        <div className="bg-white rounded-xl border border-[rgba(10,22,40,0.15)] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 bg-[rgba(10,22,40,0.08)] border-b border-[rgba(10,22,40,0.15)]">
            <span className="text-sm font-semibold text-[var(--ink)]">
              {editing.id ? 'Edit Template' : 'New Template'}
            </span>
            <button
              onClick={() => { setShowForm(false); setEditing(null); }}
              className="text-[var(--ink2)] hover:text-[var(--ink)]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--ink2)] mb-1">Template Key *</label>
                <input
                  type="text"
                  value={editing.key}
                  onChange={(e) => setEditing((v) => v ? { ...v, key: e.target.value } : v)}
                  className="w-full px-3 py-2 border border-[var(--line)] rounded-lg text-sm focus:border-[var(--ink2)] focus:ring-1 focus:ring-[rgba(10,22,40,0.15)]"
                  placeholder="e.g. welcome-email"
                  disabled={!!editing.id}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--ink2)] mb-1">Template Name *</label>
                <input
                  type="text"
                  value={editing.name}
                  onChange={(e) => setEditing((v) => v ? { ...v, name: e.target.value } : v)}
                  className="w-full px-3 py-2 border border-[var(--line)] rounded-lg text-sm focus:border-[var(--ink2)] focus:ring-1 focus:ring-[rgba(10,22,40,0.15)]"
                  placeholder="e.g. Welcome Email"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--ink2)] mb-1">Type</label>
                <select
                  value={editing.type}
                  onChange={(e) => setEditing((v) => v ? { ...v, type: e.target.value } : v)}
                  className="w-full px-3 py-2 border border-[var(--line)] rounded-lg text-sm focus:border-[var(--ink2)] focus:ring-1 focus:ring-[rgba(10,22,40,0.15)]"
                >
                  {EMAIL_TYPES.map((t) => (
                    <option key={t} value={t} className="capitalize">{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--ink2)] mb-1">Subject *</label>
              <input
                type="text"
                value={editing.subject}
                onChange={(e) => setEditing((v) => v ? { ...v, subject: e.target.value } : v)}
                className="w-full px-3 py-2 border border-[var(--line)] rounded-lg text-sm focus:border-[var(--ink2)] focus:ring-1 focus:ring-[rgba(10,22,40,0.15)]"
                placeholder="Email subject line..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--ink2)] mb-1">Variables</label>
              <VariableChips onInsert={(v) => setEditing((prev) => prev ? { ...prev, body: prev.body + v } : prev)} />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--ink2)] mb-1">Body</label>
              <textarea
                value={editing.body}
                onChange={(e) => setEditing((v) => v ? { ...v, body: e.target.value } : v)}
                rows={10}
                className="w-full px-3 py-2 border border-[var(--line)] rounded-lg text-sm focus:border-[var(--ink2)] focus:ring-1 focus:ring-[rgba(10,22,40,0.15)] resize-y font-mono text-sm"
                placeholder="Email body content..."
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editing.abTestEnabled}
                    onChange={(e) => setEditing((v) => v ? { ...v, abTestEnabled: e.target.checked } : v)}
                    className="w-4 h-4 text-[var(--ink)] border-[var(--line)] rounded"
                  />
                  <span className="text-sm font-medium text-[var(--ink2)]">Enable A/B Testing</span>
                </label>
              </div>
              {editing.abTestEnabled && (
                <div>
                  <label className="block text-xs font-medium text-[var(--ink2)] mb-1">Variant B Body</label>
                  <textarea
                    value={editing.variantB ?? ''}
                    onChange={(e) => setEditing((v) => v ? { ...v, variantB: e.target.value } : v)}
                    rows={6}
                    className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm focus:border-amber-400 focus:ring-1 focus:ring-amber-100 resize-y font-mono text-sm"
                    placeholder="Alternative variant body..."
                  />
                  <p className="text-[11px] text-amber-600 mt-1">A/B testing sends variant A to 50% and variant B to 50% of recipients</p>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 px-6 py-4 bg-[var(--paper2)] border-t border-[var(--line)]">
            <button
              onClick={() => { setShowForm(false); setEditing(null); }}
              className="px-4 py-2 bg-[var(--paper2)] text-[var(--ink2)] text-sm font-medium rounded-lg hover:bg-[var(--paper2)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-[var(--ink)] hover:bg-[var(--ink)] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </div>
      )}

      {/* Templates list */}
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block w-5 h-5 border-2 border-[var(--line)] border-t-[#0A1628] rounded-full animate-spin mb-2" />
          <p className="text-[var(--muted)] text-sm">Loading templates...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-[var(--line)] p-12 text-center">
          <div className="w-12 h-12 bg-[var(--paper2)] rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h4 className="text-sm font-medium text-[var(--ink2)] mb-1">No templates yet</h4>
          <p className="text-sm text-[var(--muted)]">Create your first email template.</p>
          <button onClick={startNew} className="mt-4 px-4 py-2 bg-[var(--ink)] hover:bg-[var(--ink)] text-white text-sm font-semibold rounded-lg transition-colors">
            + Create Template
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => (
            <TemplateCard key={t.id} template={t} onEdit={startEdit} />
          ))}
        </div>
      )}
    </div>
  );
}
