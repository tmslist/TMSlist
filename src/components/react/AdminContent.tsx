import { useState, useEffect, useCallback } from 'react';

// ---- Types ----

interface Question {
  id: string;
  slug: string;
  category: string;
  question: string;
  answer: string;
  relatedSlugs: string[];
  sortOrder: number;
}

interface Treatment {
  id: string;
  slug: string;
  name: string;
  fullName: string;
  description: string;
  fdaApproved: boolean;
  conditions: string[];
  howItWorks: string;
  sessionDuration: string;
  treatmentCourse: string;
  insuranceCoverage: string;
}

const EMPTY_QUESTION: Omit<Question, 'id'> = {
  slug: '',
  category: '',
  question: '',
  answer: '',
  relatedSlugs: [],
  sortOrder: 0,
};

const EMPTY_TREATMENT: Omit<Treatment, 'id'> = {
  slug: '',
  name: '',
  fullName: '',
  description: '',
  fdaApproved: false,
  conditions: [],
  howItWorks: '',
  sessionDuration: '',
  treatmentCourse: '',
  insuranceCoverage: '',
};

// ---- Reusable sub-components ----

function TagInput({
  tags,
  onChange,
  placeholder = 'Add tag...',
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState('');

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      const value = input.trim();
      if (!tags.includes(value)) {
        onChange([...tags, value]);
      }
      setInput('');
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5 p-2 border border-gray-300 rounded-lg bg-white min-h-[42px] focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-200 transition-colors">
      {tags.map((tag, i) => (
        <span
          key={`${tag}-${i}`}
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-50 text-violet-700 text-xs font-medium rounded-full"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(tags.filter((_, idx) => idx !== i))}
            className="text-violet-400 hover:text-violet-700"
            aria-label={`Remove ${tag}`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[120px] text-sm outline-none bg-transparent placeholder:text-gray-400"
      />
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-violet-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ${
            checked ? 'translate-x-[22px]' : 'translate-x-0.5'
          }`}
        />
      </button>
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}

// ---- Main Component ----

export default function AdminContent() {
  const [activeTab, setActiveTab] = useState<'questions' | 'treatments'>('questions');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

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

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-0">
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'questions'
                ? 'border-violet-600 text-violet-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Questions
          </button>
          <button
            onClick={() => setActiveTab('treatments')}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'treatments'
                ? 'border-violet-600 text-violet-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Treatments
          </button>
        </div>
      </div>

      {activeTab === 'questions' && <QuestionsPanel showToast={showToast} />}
      {activeTab === 'treatments' && <TreatmentsPanel showToast={showToast} />}
    </div>
  );
}

// ---- Questions Panel ----

function QuestionsPanel({ showToast }: { showToast: (type: 'success' | 'error', msg: string) => void }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Question>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [newItem, setNewItem] = useState<Omit<Question, 'id'>>(EMPTY_QUESTION);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const limit = 25;

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ type: 'questions', limit: String(limit), offset: String(page * limit) });
      if (search) params.set('search', search);
      if (categoryFilter) params.set('category', categoryFilter);

      const res = await fetch(`/api/admin/content?${params}`);
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to fetch questions');
      const json = await res.json();
      setQuestions(json.data);
      setTotal(json.total);
      if (json.categories) setCategories(json.categories);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, page]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  async function handleSave() {
    if (!editingId) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/content?type=questions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, ...editData }),
      });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to update question');
      showToast('success', 'Question updated');
      setEditingId(null);
      fetchQuestions();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreate() {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/content?type=questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to create question');
      showToast('success', 'Question created');
      setShowCreate(false);
      setNewItem(EMPTY_QUESTION);
      fetchQuestions();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch('/api/admin/content?type=questions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to delete question');
      showToast('success', 'Question deleted');
      setDeleteConfirm(null);
      fetchQuestions();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : "An error occurred");
    }
  }

  const totalPages = Math.ceil(total / limit);

  function renderQuestionForm(
    data: Partial<Question> | Omit<Question, 'id'>,
    setData: (updates: Partial<typeof data>) => void,
    onSave: () => void,
    saveLabel: string
  ) {
    return (
      <div className="space-y-4 p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              type="text"
              value={data.slug || ''}
              onChange={(e) => setData({ slug: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
              placeholder="how-does-tms-work"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input
              type="text"
              value={data.category || ''}
              onChange={(e) => setData({ category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
              placeholder="e.g. general, side-effects, cost"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
          <input
            type="text"
            value={data.question || ''}
            onChange={(e) => setData({ question: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
            placeholder="How does TMS therapy work?"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Answer</label>
          <textarea
            value={data.answer || ''}
            onChange={(e) => setData({ answer: e.target.value })}
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
            placeholder="Detailed answer..."
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Related Slugs</label>
            <TagInput
              tags={data.relatedSlugs || []}
              onChange={(tags) => setData({ relatedSlugs: tags })}
              placeholder="Add related question slug..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
            <input
              type="number"
              value={data.sortOrder ?? 0}
              onChange={(e) => setData({ sortOrder: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : saveLabel}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Questions</h3>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          + Add Question
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search questions..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-violet-500 focus:ring-violet-200"
          />
        </div>
        {categories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(0); }}
            className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:border-violet-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      <div className="text-sm text-gray-500">{total} question{total !== 1 ? 's' : ''}</div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-white rounded-xl border border-violet-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 bg-violet-50 border-b border-violet-200">
            <span className="text-sm font-semibold text-violet-700">New Question</span>
            <button onClick={() => setShowCreate(false)} className="text-violet-400 hover:text-violet-600" aria-label="Close">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {renderQuestionForm(
            newItem,
            (updates) => setNewItem((prev) => ({ ...prev, ...updates } as Omit<Question, 'id'>)),
            handleCreate,
            'Create Question'
          )}
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="px-4 py-12 text-center text-gray-400"><div class="inline-block w-5 h-5 border-2 border-gray-300 border-t-violet-600 rounded-full animate-spin mb-2"></div><br/>Loading</div>
          ) : questions.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">No questions found.</div>
          ) : questions.map((q) => (
            <div key={q.id}>
              <div
                className={`px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${editingId === q.id ? 'bg-violet-50/50' : ''}`}
                onClick={() => {
                  if (editingId === q.id) {
                    setEditingId(null);
                  } else {
                    setEditingId(q.id);
                    setEditData({ ...q });
                  }
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-semibold rounded uppercase">{q.category}</span>
                      <span className="text-xs text-gray-400">#{q.sortOrder}</span>
                    </div>
                    <h4 className="text-sm font-medium text-gray-900">{q.question}</h4>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{q.answer}</p>
                  </div>
                  <div className="flex gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        if (editingId === q.id) { setEditingId(null); }
                        else { setEditingId(q.id); setEditData({ ...q }); }
                      }}
                      className="px-3 py-1.5 bg-violet-50 text-violet-700 text-xs font-medium rounded-lg hover:bg-violet-100 transition-colors"
                    >
                      {editingId === q.id ? 'Close' : 'Edit'}
                    </button>
                    {deleteConfirm === q.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => handleDelete(q.id)} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg">Confirm</button>
                        <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(q.id)} className="px-3 py-1.5 bg-red-50 text-red-700 text-xs font-medium rounded-lg hover:bg-red-100">Delete</button>
                    )}
                  </div>
                </div>
              </div>
              {editingId === q.id && (
                <div className="border-t border-gray-200 bg-gray-50">
                  {renderQuestionForm(
                    editData,
                    (updates) => setEditData((prev) => ({ ...prev, ...updates })),
                    handleSave,
                    'Save Changes'
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-500">Page {page + 1} of {totalPages}</div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Treatments Panel ----

function TreatmentsPanel({ showToast }: { showToast: (type: 'success' | 'error', msg: string) => void }) {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Treatment>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [newItem, setNewItem] = useState<Omit<Treatment, 'id'>>(EMPTY_TREATMENT);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const limit = 25;

  const fetchTreatments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ type: 'treatments', limit: String(limit), offset: String(page * limit) });
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/content?${params}`);
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to fetch treatments');
      const json = await res.json();
      setTreatments(json.data);
      setTotal(json.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { fetchTreatments(); }, [fetchTreatments]);

  async function handleSave() {
    if (!editingId) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/content?type=treatments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, ...editData }),
      });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to update treatment');
      showToast('success', 'Treatment updated');
      setEditingId(null);
      fetchTreatments();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreate() {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/content?type=treatments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to create treatment');
      showToast('success', 'Treatment created');
      setShowCreate(false);
      setNewItem(EMPTY_TREATMENT);
      fetchTreatments();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch('/api/admin/content?type=treatments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to delete treatment');
      showToast('success', 'Treatment deleted');
      setDeleteConfirm(null);
      fetchTreatments();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : "An error occurred");
    }
  }

  const totalPages = Math.ceil(total / limit);

  function renderTreatmentForm(
    data: Partial<Treatment> | Omit<Treatment, 'id'>,
    setData: (updates: Partial<typeof data>) => void,
    onSave: () => void,
    saveLabel: string
  ) {
    return (
      <div className="space-y-4 p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              type="text"
              value={data.slug || ''}
              onChange={(e) => setData({ slug: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
              placeholder="deep-tms"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={data.name || ''}
              onChange={(e) => setData({ name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
              placeholder="Deep TMS"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={data.fullName || ''}
              onChange={(e) => setData({ fullName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
              placeholder="Deep Transcranial Magnetic Stimulation"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={data.description || ''}
            onChange={(e) => setData({ description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
            placeholder="Short description of the treatment..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">How It Works</label>
          <textarea
            value={data.howItWorks || ''}
            onChange={(e) => setData({ howItWorks: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
            placeholder="Detailed explanation of the mechanism..."
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Session Duration</label>
            <input
              type="text"
              value={data.sessionDuration || ''}
              onChange={(e) => setData({ sessionDuration: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
              placeholder="20-40 minutes"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Course</label>
            <input
              type="text"
              value={data.treatmentCourse || ''}
              onChange={(e) => setData({ treatmentCourse: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
              placeholder="36 sessions over 6 weeks"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Coverage</label>
            <input
              type="text"
              value={data.insuranceCoverage || ''}
              onChange={(e) => setData({ insuranceCoverage: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
              placeholder="Covered by most major insurers"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Conditions Treated</label>
          <TagInput
            tags={data.conditions || []}
            onChange={(tags) => setData({ conditions: tags })}
            placeholder="Add condition..."
          />
        </div>
        <div className="pt-1">
          <Toggle
            checked={data.fdaApproved ?? false}
            onChange={(v) => setData({ fdaApproved: v })}
            label="FDA Approved"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : saveLabel}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Treatments</h3>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          + Add Treatment
        </button>
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Search treatments..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-violet-500 focus:ring-violet-200"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      <div className="text-sm text-gray-500">{total} treatment{total !== 1 ? 's' : ''}</div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-white rounded-xl border border-violet-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 bg-violet-50 border-b border-violet-200">
            <span className="text-sm font-semibold text-violet-700">New Treatment</span>
            <button onClick={() => setShowCreate(false)} className="text-violet-400 hover:text-violet-600" aria-label="Close">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {renderTreatmentForm(
            newItem,
            (updates) => setNewItem((prev) => ({ ...prev, ...updates } as Omit<Treatment, 'id'>)),
            handleCreate,
            'Create Treatment'
          )}
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="px-4 py-12 text-center text-gray-400"><div class="inline-block w-5 h-5 border-2 border-gray-300 border-t-violet-600 rounded-full animate-spin mb-2"></div><br/>Loading</div>
          ) : error ? (
            <div className="px-4 py-8 text-center">
              <p className="text-red-600 font-medium mb-2">{error}</p>
              <button onClick={fetchTreatments} className="text-violet-600 hover:text-violet-700 text-sm font-medium">Try again</button>
            </div>
          ) : treatments.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">No treatments found.</div>
          ) : treatments.map((t) => (
            <div key={t.id}>
              <div
                className={`px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${editingId === t.id ? 'bg-violet-50/50' : ''}`}
                onClick={() => {
                  if (editingId === t.id) {
                    setEditingId(null);
                  } else {
                    setEditingId(t.id);
                    setEditData({ ...t });
                  }
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-gray-900">{t.name}</h4>
                      {t.fdaApproved && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded-full">FDA Approved</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-1">{t.description}</p>
                    {(t.conditions || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {t.conditions.slice(0, 4).map((c) => (
                          <span key={c} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded">{c}</span>
                        ))}
                        {t.conditions.length > 4 && <span className="text-[10px] text-gray-400">+{t.conditions.length - 4}</span>}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        if (editingId === t.id) { setEditingId(null); }
                        else { setEditingId(t.id); setEditData({ ...t }); }
                      }}
                      className="px-3 py-1.5 bg-violet-50 text-violet-700 text-xs font-medium rounded-lg hover:bg-violet-100 transition-colors"
                    >
                      {editingId === t.id ? 'Close' : 'Edit'}
                    </button>
                    {deleteConfirm === t.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => handleDelete(t.id)} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg">Confirm</button>
                        <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(t.id)} className="px-3 py-1.5 bg-red-50 text-red-700 text-xs font-medium rounded-lg hover:bg-red-100">Delete</button>
                    )}
                  </div>
                </div>
              </div>
              {editingId === t.id && (
                <div className="border-t border-gray-200 bg-gray-50">
                  {renderTreatmentForm(
                    editData,
                    (updates) => setEditData((prev) => ({ ...prev, ...updates })),
                    handleSave,
                    'Save Changes'
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-500">Page {page + 1} of {totalPages}</div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
