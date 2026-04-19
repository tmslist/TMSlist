import { useState, useCallback, useEffect } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface HelpArticle {
  id: string;
  title: string;
  slug: string;
  category: string;
  content: string;
  excerpt: string;
  status: 'draft' | 'published';
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  authorEmail: string | null;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

interface HelpCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  articleCount: number;
  sortOrder: number;
}

interface SearchAnalytics {
  query: string;
  count: number;
  lastSearched: string;
}

interface PopularArticle {
  id: string;
  title: string;
  viewCount: number;
  helpfulPercentage: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Toast ──────────────────────────────────────────────────────────────────────

interface Toast { id: string; message: string; type: 'success' | 'error' | 'info'; }

function ToastBar({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-slide-up ${
          t.type === 'success' ? 'bg-emerald-600 text-white' :
          t.type === 'error' ? 'bg-red-600 text-white' :
          'bg-indigo-600 text-white'
        }`}>
          {t.type === 'success' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
          {t.type === 'error' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────────

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 animate-scale-in">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          {children}
        </div>
      </div>
      <style>{`@keyframes scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } } .animate-scale-in { animation: scale-in 0.2s ease-out; }`}</style>
    </>
  );
}

// ── Article Editor Form ─────────────────────────────────────────────────────────

function ArticleForm({ existing, categories, onSave, onCancel }: {
  existing: HelpArticle | null;
  categories: HelpCategory[];
  onSave: (data: { title: string; slug: string; category: string; content: string; excerpt: string; status: string; tags: string[] }) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(existing?.title || '');
  const [slug, setSlug] = useState(existing?.slug || '');
  const [category, setCategory] = useState(existing?.category || (categories[0]?.id || ''));
  const [excerpt, setExcerpt] = useState(existing?.excerpt || '');
  const [content, setContent] = useState(existing?.content || '');
  const [status, setStatus] = useState(existing?.status || 'draft');
  const [tags, setTags] = useState((existing?.tags || []).join(', '));
  const [saving, setSaving] = useState(false);

  const generateSlug = () => {
    setSlug(title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  };

  const handleSubmit = () => {
    if (!title || !content) return;
    onSave({
      title,
      slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category,
      excerpt,
      content,
      status,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Article title..."
          className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Slug
          <button onClick={generateSlug} type="button" className="ml-2 text-xs text-indigo-600 hover:text-indigo-700 font-normal">Auto-generate</button>
        </label>
        <input type="text" value={slug} onChange={e => setSlug(e.target.value)} placeholder="url-friendly-slug"
          className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-white">
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select value={status} onChange={e => setStatus(e.target.value)} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-white">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
        <input type="text" value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="Short description for article preview..."
          className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Content * (Markdown supported)</label>
        <textarea value={content} onChange={e => setContent(e.target.value)} rows={10} placeholder="Article content... Supports Markdown: **bold**, *italic*, ## headings, etc."
          className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none font-mono text-xs" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
        <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="tms, depression, therapy"
          className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <button onClick={onCancel} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50">Cancel</button>
        <button onClick={handleSubmit} disabled={saving} className="px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
          {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {existing ? 'Update Article' : 'Create Article'}
        </button>
      </div>
    </div>
  );
}

// ── Category Form ───────────────────────────────────────────────────────────────

function CategoryForm({ existing, onSave, onCancel }: {
  existing: HelpCategory | null;
  onSave: (data: { name: string; slug: string; description: string; sortOrder: number }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(existing?.name || '');
  const [slug, setSlug] = useState(existing?.slug || '');
  const [description, setDescription] = useState(existing?.description || '');
  const [sortOrder, setSortOrder] = useState(existing?.sortOrder?.toString() || '0');

  const generateSlug = () => {
    setSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  };

  const handleSubmit = () => {
    if (!name) return;
    onSave({ name, slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), description, sortOrder: parseInt(sortOrder) || 0 });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Category name..."
          className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Slug <button onClick={generateSlug} type="button" className="ml-2 text-xs text-indigo-600">Auto</button>
        </label>
        <input type="text" value={slug} onChange={e => setSlug(e.target.value)} className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 font-mono outline-none" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="What this category covers..."
          className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
        <input type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" />
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <button onClick={onCancel} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50">Cancel</button>
        <button onClick={handleSubmit} className="px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700">Save Category</button>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

type TabKey = 'articles' | 'categories' | 'analytics';

const TABS = [
  { key: 'articles', label: 'Articles', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
  { key: 'categories', label: 'Categories', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
  { key: 'analytics', label: 'Search Analytics', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
];

export default function AdminHelpCenter() {
  const [tab, setTab] = useState<TabKey>('articles');
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [searchAnalytics, setSearchAnalytics] = useState<SearchAnalytics[]>([]);
  const [popularArticles, setPopularArticles] = useState<PopularArticle[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters/search
  const [articleSearch, setArticleSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<HelpArticle | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<HelpCategory | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<HelpArticle | null>(null);
  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState<HelpCategory | null>(null);

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = String(Date.now());
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/help-center');
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (res.ok) {
        const json = await res.json();
        setArticles(json.articles || []);
        setCategories(json.categories || []);
        setSearchAnalytics(json.searchAnalytics || []);
        setPopularArticles(json.popularArticles || []);
      }
    } catch { /* fail silently */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Article actions ───────────────────────────────────────────────────────────

  function openArticleModal(article?: HelpArticle) {
    setEditingArticle(article || null);
    setShowArticleModal(true);
  }

  async function saveArticle(data: { title: string; slug: string; category: string; content: string; excerpt: string; status: string; tags: string[] }) {
    try {
      const method = editingArticle ? 'PUT' : 'POST';
      const url = editingArticle ? `/api/admin/help-center/article?id=${editingArticle.id}` : '/api/admin/help-center/article';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (res.ok) { showToast(editingArticle ? 'Article updated' : 'Article created'); setShowArticleModal(false); fetchData(); }
    } catch { showToast('Failed to save article', 'error'); }
  }

  async function deleteArticle(id: string) {
    try {
      const res = await fetch(`/api/admin/help-center/article?id=${id}`, { method: 'DELETE' });
      if (res.ok) { setArticles(prev => prev.filter(a => a.id !== id)); showToast('Article deleted'); }
    } catch { showToast('Failed to delete', 'error'); }
    setConfirmDelete(null);
  }

  // ── Category actions ──────────────────────────────────────────────────────────

  function openCategoryModal(category?: HelpCategory) {
    setEditingCategory(category || null);
    setShowCategoryModal(true);
  }

  async function saveCategory(data: { name: string; slug: string; description: string; sortOrder: number }) {
    try {
      const method = editingCategory ? 'PUT' : 'POST';
      const url = editingCategory ? `/api/admin/help-center/category?id=${editingCategory.id}` : '/api/admin/help-center/category';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (res.ok) { showToast(editingCategory ? 'Category updated' : 'Category created'); setShowCategoryModal(false); fetchData(); }
    } catch { showToast('Failed to save category', 'error'); }
  }

  async function deleteCategory(id: string) {
    try {
      const res = await fetch(`/api/admin/help-center/category?id=${id}`, { method: 'DELETE' });
      if (res.ok) { setCategories(prev => prev.filter(c => c.id !== id)); showToast('Category deleted'); }
    } catch { showToast('Failed to delete', 'error'); }
    setConfirmDeleteCategory(null);
  }

  // ── Filtered data ─────────────────────────────────────────────────────────────

  const filteredArticles = articles.filter(a => {
    if (articleSearch) {
      const q = articleSearch.toLowerCase();
      if (!a.title.toLowerCase().includes(q) && !a.excerpt.toLowerCase().includes(q)) return false;
    }
    if (categoryFilter && a.category !== categoryFilter) return false;
    if (statusFilter && a.status !== statusFilter) return false;
    return true;
  });

  const filteredSearch = searchAnalytics.filter(s => {
    if (searchQuery) {
      return s.query.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  // ── Stats ────────────────────────────────────────────────────────────────────

  const totalViews = articles.reduce((sum, a) => sum + a.viewCount, 0);
  const publishedCount = articles.filter(a => a.status === 'published').length;
  const draftCount = articles.filter(a => a.status === 'draft').length;

  return (
    <div className="space-y-6">
      <ToastBar toasts={toasts} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Help Center</h1>
          <p className="text-gray-500 mt-1 text-sm">Knowledge base articles, categories, and search analytics</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Views', value: totalViews.toLocaleString(), color: 'text-indigo-600' },
            { label: 'Published', value: publishedCount, color: 'text-emerald-600' },
            { label: 'Drafts', value: draftCount, color: 'text-gray-500' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-center">
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex gap-1 px-4">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key as TabKey)} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {t.icon}
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : tab === 'articles' ? (
            <>
              {/* Article filters */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="relative flex-1 min-w-[200px]">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <input type="text" placeholder="Search articles..." value={articleSearch} onChange={e => setArticleSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                </div>
                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white">
                  <option value="">All Categories</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white">
                  <option value="">All Statuses</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
                <button onClick={() => openArticleModal()} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  New Article
                </button>
              </div>

              {/* Articles table */}
              {filteredArticles.length === 0 ? (
                <div className="text-center py-12 text-gray-400"><p className="text-sm">No articles found</p></div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-100">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Views</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Helpfulness</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Updated</th>
                        <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredArticles.map(article => {
                        const total = article.helpfulCount + article.notHelpfulCount;
                        const helpfulPct = total > 0 ? Math.round((article.helpfulCount / total) * 100) : 0;
                        const cat = categories.find(c => c.id === article.category);
                        return (
                          <tr key={article.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <p className="text-sm font-medium text-gray-900">{article.title}</p>
                              {article.excerpt && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{article.excerpt}</p>}
                              {article.tags.length > 0 && (
                                <div className="flex gap-1 mt-1">
                                  {article.tags.slice(0, 3).map(tag => <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{tag}</span>)}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-600">{cat?.name || article.category}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${article.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                {article.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{article.viewCount.toLocaleString()}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${helpfulPct}%` }} />
                                </div>
                                <span className="text-xs text-gray-500">{helpfulPct}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{formatRelativeTime(article.updatedAt)}</td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button onClick={() => openArticleModal(article)} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50" title="Edit">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </button>
                                <button onClick={() => setConfirmDelete(article)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50" title="Delete">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : tab === 'categories' ? (
            <>
              <div className="flex justify-end mb-4">
                <button onClick={() => openCategoryModal()} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  New Category
                </button>
              </div>
              {categories.length === 0 ? (
                <div className="text-center py-12 text-gray-400"><p className="text-sm">No categories yet</p></div>
              ) : (
                <div className="space-y-3">
                  {categories.sort((a, b) => a.sortOrder - b.sortOrder).map(cat => (
                    <div key={cat.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{cat.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{cat.description || 'No description'}</p>
                        <span className="text-xs text-gray-400 mt-1">{cat.articleCount} articles</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openCategoryModal(cat)} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => setConfirmDeleteCategory(cat)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : tab === 'analytics' ? (
            <div className="space-y-8">
              {/* Popular Articles */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Most Viewed Articles</h3>
                {popularArticles.length === 0 ? (
                  <div className="text-center py-8 text-gray-400"><p className="text-sm">No data yet</p></div>
                ) : (
                  <div className="space-y-2">
                    {popularArticles.map((article, i) => (
                      <div key={article.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                        <span className="text-lg font-bold text-gray-300 w-6 text-center">#{i + 1}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{article.title}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-500">{article.viewCount.toLocaleString()} views</span>
                            <div className="flex items-center gap-1">
                              <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${article.helpfulPercentage}%` }} />
                              </div>
                              <span className="text-xs text-gray-400">{article.helpfulPercentage}% helpful</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Search Analytics */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Search Queries</h3>
                <div className="mb-3">
                  <input type="text" placeholder="Filter searches..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    className="w-full sm:w-64 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                </div>
                {filteredSearch.length === 0 ? (
                  <div className="text-center py-8 text-gray-400"><p className="text-sm">No search data yet</p></div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-gray-100">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Query</th>
                          <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Searches</th>
                          <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Last Searched</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredSearch.map(s => (
                          <tr key={s.query} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.query}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{s.count}</td>
                            <td className="px-4 py-3 text-xs text-gray-400">{formatRelativeTime(s.lastSearched)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Modals */}
      <Modal open={showArticleModal} onClose={() => setShowArticleModal(false)} title={editingArticle ? 'Edit Article' : 'New Article'}>
        <ArticleForm existing={editingArticle} categories={categories} onSave={saveArticle} onCancel={() => setShowArticleModal(false)} />
      </Modal>

      <Modal open={showCategoryModal} onClose={() => setShowCategoryModal(false)} title={editingCategory ? 'Edit Category' : 'New Category'}>
        <CategoryForm existing={editingCategory} onSave={saveCategory} onCancel={() => setShowCategoryModal(false)} />
      </Modal>

      {/* Delete confirmations */}
      {confirmDelete && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={() => setConfirmDelete(null)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-scale-in">
              <h3 className="text-base font-semibold text-gray-900 mb-2">Delete Article?</h3>
              <p className="text-sm text-gray-500 mb-5">Are you sure you want to delete "{confirmDelete.title}"? This cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50">Cancel</button>
                <button onClick={() => deleteArticle(confirmDelete.id)} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700">Delete</button>
              </div>
            </div>
          </div>
          <style>{`@keyframes scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } } .animate-scale-in { animation: scale-in 0.2s ease-out; }`}</style>
        </>
      )}

      {confirmDeleteCategory && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={() => setConfirmDeleteCategory(null)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-scale-in">
              <h3 className="text-base font-semibold text-gray-900 mb-2">Delete Category?</h3>
              <p className="text-sm text-gray-500 mb-5">Deleting "{confirmDeleteCategory.name}" will not delete its articles. Are you sure?</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setConfirmDeleteCategory(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50">Cancel</button>
                <button onClick={() => deleteCategory(confirmDeleteCategory.id)} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700">Delete</button>
              </div>
            </div>
          </div>
          <style>{`@keyframes scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } } .animate-scale-in { animation: scale-in 0.2s ease-out; }`}</style>
        </>
      )}
    </div>
  );
}