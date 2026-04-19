import { useState, useEffect, useCallback } from 'react';

interface Page {
  id: string;
  slug: string;
  title: string;
  description: string;
  canonical: string;
  status: 'draft' | 'published';
  content: string;
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  createdAt: string;
  updatedAt: string;
}

interface PageInput {
  slug: string;
  title: string;
  description: string;
  canonical: string;
  status: 'draft' | 'published';
  content: string;
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
}

const PAGE_SLUGS = [
  { key: 'homepage', label: 'Homepage' },
  { key: 'about', label: 'About' },
  { key: 'faq', label: 'FAQ' },
  { key: 'contact', label: 'Contact' },
  { key: 'footer', label: 'Footer' },
  { key: 'header', label: 'Header' },
  { key: 'privacy', label: 'Privacy Policy' },
  { key: 'terms', label: 'Terms of Service' },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function MarkdownPreview({ content }: { content: string }) {
  const lines = content.split('\n');
  return (
    <div className="prose prose-sm max-w-none text-gray-700">
      {lines.map((line, i) => {
        if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold text-gray-900 mb-3">{line.slice(2)}</h1>;
        if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-semibold text-gray-900 mb-2">{line.slice(3)}</h2>;
        if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-semibold text-gray-800 mb-1">{line.slice(4)}</h3>;
        if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc text-gray-700">{line.slice(2)}</li>;
        if (line.startsWith('> ')) return <blockquote key={i} className="border-l-4 border-violet-300 pl-4 italic text-gray-600">{line.slice(2)}</blockquote>;
        if (line.trim() === '') return <br key={i} />;
        return <p key={i} className="text-gray-700 mb-1 leading-relaxed">{line}</p>;
      })}
    </div>
  );
}

export default function AdminPageEditor() {
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedSlug, setSelectedSlug] = useState('homepage');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [seoOpen, setSeoOpen] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [slugManual, setSlugManual] = useState(false);
  const [form, setForm] = useState<PageInput>({
    slug: 'homepage',
    title: '',
    description: '',
    canonical: '',
    status: 'draft',
    content: '',
    metaTitle: '',
    metaDescription: '',
    ogImage: '',
  });

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchPages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/page-content?page=all');
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      const json = await res.json();
      if (res.ok) {
        setPages(json.pages ?? []);
        if (json.pages?.length > 0) {
          const first = json.pages.find((p: Page) => p.slug === selectedSlug) ?? json.pages[0];
          setForm({
            slug: first.slug,
            title: first.title ?? '',
            description: first.description ?? '',
            canonical: first.canonical ?? '',
            status: first.status ?? 'draft',
            content: first.content ?? '',
            metaTitle: first.metaTitle ?? '',
            metaDescription: first.metaDescription ?? '',
            ogImage: first.ogImage ?? '',
          });
        }
      }
    } catch {
      showToast('error', 'Failed to load pages');
    } finally {
      setLoading(false);
    }
  }, [selectedSlug, showToast]);

  useEffect(() => { fetchPages(); }, [fetchPages]);

  function handleTitleChange(value: string) {
    setForm((f) => ({ ...f, title: value }));
    if (!slugManual) {
      setForm((f) => ({ ...f, slug: slugify(value) }));
    }
  }

  async function handleSave() {
    if (!form.title.trim()) {
      showToast('error', 'Page title is required');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/page-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (res.ok) {
        showToast('success', 'Page saved');
        fetchPages();
      } else {
        showToast('error', 'Failed to save page');
      }
    } catch {
      showToast('error', 'Failed to save page');
    } finally {
      setSaving(false);
    }
  }

  const seoScore = form.metaTitle && form.metaDescription ? (form.metaTitle.length <= 60 && form.metaDescription.length <= 160 ? 100 : 50) : 0;

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
          <h2 className="text-xl font-semibold text-gray-900">CMS Page Editor</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage pages with SEO metadata</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPreview((v) => !v)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              preview ? 'bg-indigo-100 text-indigo-700' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {preview ? 'Edit' : 'Preview'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Page'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Main editor */}
        <div className="space-y-5">
          {preview ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 min-h-[400px]">
              <div className="mb-6 pb-6 border-b border-gray-100">
                <h1 className="text-3xl font-bold text-gray-900">{form.title || <span className="text-gray-300 italic">Untitled Page</span>}</h1>
              </div>
              {form.content ? (
                <MarkdownPreview content={form.content} />
              ) : (
                <p className="text-gray-300 italic">No content yet. Switch to Edit mode to add content.</p>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Page Title *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                    placeholder="Page title..."
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-gray-600">Content</label>
                    <span className="text-[11px] text-gray-400">Markdown supported</span>
                  </div>
                  <textarea
                    value={form.content}
                    onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                    rows={16}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200 resize-y font-mono"
                    placeholder="Write your page content in markdown..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* SEO Panel */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div
              className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setSeoOpen((v) => !v)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                  seoScore === 100 ? 'bg-emerald-100 text-emerald-700' : seoScore > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {seoScore > 0 ? `${seoScore}%` : '?'}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">SEO Metadata</h3>
                  <p className="text-xs text-gray-500">
                    {form.metaTitle && form.metaDescription ? 'Complete' : 'Incomplete'}
                  </p>
                </div>
              </div>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${seoOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {seoOpen && (
              <div className="border-t border-gray-100 p-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Meta Title</label>
                  <input
                    type="text"
                    value={form.metaTitle}
                    onChange={(e) => setForm((f) => ({ ...f, metaTitle: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                    placeholder="SEO title (recommended: 50-60 chars)"
                  />
                  <p className={`text-[11px] mt-1 ${form.metaTitle.length > 60 ? 'text-red-500' : 'text-gray-400'}`}>
                    {form.metaTitle.length}/60 characters
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Meta Description</label>
                  <textarea
                    value={form.metaDescription}
                    onChange={(e) => setForm((f) => ({ ...f, metaDescription: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200 resize-y"
                    placeholder="SEO description (recommended: 150-160 chars)"
                  />
                  <p className={`text-[11px] mt-1 ${form.metaDescription.length > 160 ? 'text-red-500' : 'text-gray-400'}`}>
                    {form.metaDescription.length}/160 characters
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Canonical URL</label>
                  <input
                    type="url"
                    value={form.canonical}
                    onChange={(e) => setForm((f) => ({ ...f, canonical: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                    placeholder="https://tmslist.com/..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">OG Image URL</label>
                  <input
                    type="url"
                    value={form.ogImage}
                    onChange={(e) => setForm((f) => ({ ...f, ogImage: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                    placeholder="https://..."
                  />
                  {form.ogImage && (
                    <img
                      src={form.ogImage}
                      alt="OG Preview"
                      className="mt-2 w-full h-32 object-cover rounded-lg border border-gray-200"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                </div>

                {/* Preview snippet */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wide mb-2">Search Preview</p>
                  <div className="space-y-1">
                    <p className="text-lg text-blue-600 hover:underline cursor-pointer truncate">
                      {form.metaTitle || form.title || 'Page Title'}
                    </p>
                    <p className="text-sm text-green-700 truncate">{form.canonical || 'https://tmslist.com/' + form.slug}</p>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {form.metaDescription || form.description || 'Add a meta description for search results...'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Page selector */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">Pages</h3>
            </div>
            <div className="p-2 max-h-[300px] overflow-y-auto">
              {PAGE_SLUGS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setSelectedSlug(p.key)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedSlug === p.key
                      ? 'bg-violet-50 text-violet-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Slug & Status */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">Settings</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-gray-600">Slug</label>
                  <button
                    onClick={() => setSlugManual((v) => !v)}
                    className="text-[11px] text-violet-600 hover:underline"
                  >
                    {slugManual ? 'Auto' : 'Custom'}
                  </button>
                </div>
                <div className="flex">
                  <span className="inline-flex items-center px-3 py-2 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 text-xs text-gray-500">
                    /pages/
                  </span>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => { setSlugManual(true); setForm((f) => ({ ...f, slug: slugify(e.target.value) })); }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                    placeholder="page-slug"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200 resize-y"
                  placeholder="Short page description..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Status</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setForm((f) => ({ ...f, status: 'draft' }))}
                    className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                      form.status === 'draft' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Draft
                  </button>
                  <button
                    onClick={() => setForm((f) => ({ ...f, status: 'published' }))}
                    className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                      form.status === 'published' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Published
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
