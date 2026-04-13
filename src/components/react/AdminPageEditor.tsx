import { useState, useCallback, useEffect } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface PageSection {
  id: string;
  page: string;
  section: string;
  title: string | null;
  content: string | null;
  imageUrl: string | null;
  order: number;
}

interface PageSectionInput {
  page: string;
  section: string;
  title: string;
  content: string;
  imageUrl: string;
  order: number;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const PAGES = [
  { key: 'homepage', label: 'Homepage' },
  { key: 'about', label: 'About' },
  { key: 'faq', label: 'FAQ' },
  { key: 'contact', label: 'Contact' },
  { key: 'footer', label: 'Footer' },
  { key: 'header', label: 'Header' },
];

const SECTION_PLACEHOLDERS: Record<string, string> = {
  hero: 'Hero section content — e.g. headline, subheadline, CTA text. Supports markdown.',
  features: 'Feature cards or highlights. List each feature with a title and description.',
  cta: 'Call-to-action banner content — headline, button text, supporting copy.',
  pricing_section: 'Pricing table or pricing overview content.',
  testimonials: 'Customer quotes or testimonials.',
  trust_signals: 'Statistics, certifications, accreditations.',
  intro: 'Introductory paragraph(s) for this page.',
  mission: 'Mission statement or core values.',
  team: 'Team or company background.',
  contact_info: 'Address, phone, email, hours.',
  faq_list: 'FAQ items formatted as Q&A pairs.',
  social_proof: 'Logos, awards, media mentions.',
  default: 'Enter content for this section. Supports markdown formatting.',
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionCard({
  data,
  onSave,
  onDelete,
}: {
  data: PageSection;
  onSave: (updated: PageSection) => void;
  onDelete: (section: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [preview, setPreview] = useState(false);
  const [form, setForm] = useState({
    title: data.title ?? '',
    content: data.content ?? '',
    imageUrl: data.imageUrl ?? '',
    order: data.order,
  });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    setForm({
      title: data.title ?? '',
      content: data.content ?? '',
      imageUrl: data.imageUrl ?? '',
      order: data.order,
    });
  }, [data]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/page-content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: data.page,
          section: data.section,
          title: form.title || null,
          content: form.content || null,
          imageUrl: form.imageUrl || null,
          order: form.order,
        }),
      });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to save');
      const json = await res.json();
      onSave({ ...data, ...json.data });
    } catch {
      alert('Failed to save section');
    } finally {
      setSaving(false);
    }
  }

  const placeholder = SECTION_PLACEHOLDERS[data.section] ?? SECTION_PLACEHOLDERS.default;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Card header */}
      <div
        className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Drag handle (visual only) */}
        <span className="text-gray-300 cursor-grab shrink-0">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 6a2 2 0 11-4 0 2 2 0 014 0zm0 6a2 2 0 11-4 0 2 2 0 014 0zm0 6a2 2 0 11-4 0 2 2 0 014 0zm8-12a2 2 0 11-4 0 2 2 0 014 0zm0 6a2 2 0 11-4 0 2 2 0 014 0zm0 6a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="px-2 py-0.5 bg-violet-50 text-violet-700 text-[10px] font-semibold rounded uppercase">
              {data.section}
            </span>
            <span className="text-xs text-gray-400">Order: {data.order}</span>
          </div>
          <h4 className="text-sm font-medium text-gray-900 truncate">
            {data.title || <span className="text-gray-400 italic">Untitled section</span>}
          </h4>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
            {data.content || <span className="text-gray-300 italic">No content yet</span>}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setPreview((v) => !v)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              preview
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {preview ? 'Edit' : 'Preview'}
          </button>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="px-3 py-1.5 bg-violet-50 text-violet-700 text-xs font-medium rounded-lg hover:bg-violet-100 transition-colors"
          >
            {expanded ? 'Close' : 'Edit'}
          </button>
        </div>
      </div>

      {/* Expanded editor */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-5 space-y-4">
          {preview ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Live Preview</span>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-semibold rounded uppercase">{data.section}</span>
              </div>
              {form.imageUrl && (
                <img
                  src={form.imageUrl}
                  alt={form.title || data.section}
                  className="w-full h-40 object-cover rounded-lg border border-gray-200"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
              {form.title && (
                <h3 className="text-xl font-bold text-gray-900">{form.title}</h3>
              )}
              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {form.content || <span className="text-gray-400 italic">No content</span>}
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Section Name</label>
                  <input
                    type="text"
                    value={data.section}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={form.order}
                    onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                    min={0}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                  placeholder="Section title..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Content</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200 resize-y"
                  placeholder={placeholder}
                />
                <p className="text-[11px] text-gray-400 mt-1">Supports markdown. Separate paragraphs with blank lines.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Image URL</label>
                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                  placeholder="https://..."
                />
                {form.imageUrl && (
                  <img
                    src={form.imageUrl}
                    alt="Preview"
                    className="mt-2 w-24 h-16 object-cover rounded-lg border border-gray-200"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                {deleteConfirm ? (
                  <div className="flex gap-2 items-center">
                    <span className="text-sm text-red-600">Delete this section?</span>
                    <button
                      onClick={async () => {
                        const res = await fetch('/api/admin/page-content', {
                          method: 'DELETE',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ page: data.page, section: data.section }),
                        });
                        if (res.ok) onDelete(data.section);
                        else alert('Failed to delete');
                        setDeleteConfirm(false);
                      }}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg"
                    >
                      Confirm Delete
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(false)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(true)}
                    className="px-4 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors"
                  >
                    Delete Section
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Section'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function AdminPageEditor() {
  const [activePage, setActivePage] = useState('homepage');
  const [sections, setSections] = useState<PageSection[]>([]);
  const [allPages, setAllPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSection, setNewSection] = useState({ section: '', title: '', content: '', imageUrl: '', order: 0 });
  const [savingNew, setSavingNew] = useState(false);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/page-content?page=${activePage}`);
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setSections(json.data ?? []);
      if (json.pages) setAllPages(json.pages);
    } catch {
      showToast('error', 'Failed to load page content');
    } finally {
      setLoading(false);
    }
  }, [activePage, showToast]);

  useEffect(() => { fetchContent(); }, [fetchContent]);

  function handleSave(updated: PageSection) {
    setSections((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    showToast('success', 'Section saved');
  }

  function handleDelete(sectionKey: string) {
    setSections((prev) => prev.filter((s) => s.section !== sectionKey));
    showToast('success', 'Section deleted');
  }

  async function handleAddSection() {
    if (!newSection.section.trim()) {
      showToast('error', 'Section name is required');
      return;
    }
    if (sections.find((s) => s.section === newSection.section.trim())) {
      showToast('error', 'Section already exists on this page');
      return;
    }
    setSavingNew(true);
    try {
      const res = await fetch('/api/admin/page-content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: activePage,
          section: newSection.section.trim(),
          title: newSection.title || null,
          content: newSection.content || null,
          imageUrl: newSection.imageUrl || null,
          order: newSection.order,
        }),
      });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to add section');
      const json = await res.json();
      setSections((prev) => [...prev, json.data]);
      setShowAddSection(false);
      setNewSection({ section: '', title: '', content: '', imageUrl: '', order: 0 });
      showToast('success', 'Section added');
    } catch {
      showToast('error', 'Failed to add section');
    } finally {
      setSavingNew(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Page tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-0 overflow-x-auto">
          {PAGES.map((p) => (
            <button
              key={p.key}
              onClick={() => { setActivePage(p.key); setShowAddSection(false); }}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors shrink-0 ${
                activePage === p.key
                  ? 'border-violet-600 text-violet-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {PAGES.find((p) => p.key === activePage)?.label} Sections
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {sections.length} section{sections.length !== 1 ? 's' : ''} on this page
          </p>
        </div>
        <button
          onClick={() => setShowAddSection(true)}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          + Add Section
        </button>
      </div>

      {/* Add section form */}
      {showAddSection && (
        <div className="bg-white rounded-xl border border-violet-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 bg-violet-50 border-b border-violet-200">
            <span className="text-sm font-semibold text-violet-700">Add New Section</span>
            <button onClick={() => setShowAddSection(false)} className="text-violet-400 hover:text-violet-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Section Name *</label>
                <input
                  type="text"
                  value={newSection.section}
                  onChange={(e) => setNewSection((v) => ({ ...v, section: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                  placeholder="e.g. hero, features, cta"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Display Order</label>
                <input
                  type="number"
                  value={newSection.order}
                  onChange={(e) => setNewSection((v) => ({ ...v, order: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                  min={0}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
              <input
                type="text"
                value={newSection.title}
                onChange={(e) => setNewSection((v) => ({ ...v, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                placeholder="Section title..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Content</label>
              <textarea
                value={newSection.content}
                onChange={(e) => setNewSection((v) => ({ ...v, content: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200 resize-y"
                placeholder="Section content..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Image URL</label>
              <input
                type="url"
                value={newSection.imageUrl}
                onChange={(e) => setNewSection((v) => ({ ...v, imageUrl: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                placeholder="https://..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowAddSection(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSection}
                disabled={savingNew}
                className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {savingNew ? 'Adding...' : 'Add Section'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sections list */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-5 h-5 border-2 border-gray-300 border-t-violet-600 rounded-full animate-spin mb-2"></div>
          <p className="text-gray-400 text-sm">Loading sections...</p>
        </div>
      ) : sections.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h4 className="text-sm font-medium text-gray-700 mb-1">No sections yet</h4>
          <p className="text-sm text-gray-500">Add sections to build out this page's content.</p>
          <button
            onClick={() => setShowAddSection(true)}
            className="mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            + Add Your First Section
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map((s) => (
            <SectionCard
              key={s.id}
              data={s}
              onSave={handleSave}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
