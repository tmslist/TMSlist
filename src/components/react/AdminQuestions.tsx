'use client';
import { useState, useEffect } from 'react';

interface Question {
  id: string;
  slug: string;
  category: string;
  question: string;
  answer: string;
  relatedSlugs: string[] | null;
  sortOrder: number;
  createdAt: string;
}

interface Category {
  category: string;
  count: number;
}

export default function AdminQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [editing, setEditing] = useState<Question | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { fetchQuestions(); }, [categoryFilter]);

  async function fetchQuestions() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter) params.set('category', categoryFilter);
      if (search) params.set('search', search);
      params.set('limit', '100');
      const res = await fetch(`/api/admin/questions?${params}`);
      const data = await res.json();
      if (res.ok) {
        setQuestions(data.questions || []);
        setCategories(data.categories || []);
      } else setError(data.error || 'Failed to load');
    } catch { setError('Failed to load questions'); }
    finally { setLoading(false); }
  }

  async function saveQuestion(q: Partial<Question>) {
    const method = q.id ? 'PUT' : 'POST';
    const res = await fetch('/api/admin/questions', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(q),
    });
    if (res.ok) { fetchQuestions(); setEditing(null); setShowAdd(false); }
  }

  async function deleteQuestion(id: string) {
    if (!confirm('Delete this question?')) return;
    const res = await fetch(`/api/admin/questions?id=${id}`, { method: 'DELETE' });
    if (res.ok) setQuestions(prev => prev.filter(q => q.id !== id));
  }

  const filtered = search
    ? questions.filter(q =>
        q.question.toLowerCase().includes(search.toLowerCase()) ||
        q.answer.toLowerCase().includes(search.toLowerCase())
      )
    : questions;

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search questions..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 text-sm border border-[var(--line)] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 min-w-64"
        />
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-[var(--line)] rounded-lg bg-white focus:outline-none"
        >
          <option value="">All Categories</option>
          {categories.map(c => (
            <option key={c.category} value={c.category}>{c.category} ({c.count})</option>
          ))}
        </select>
        <button
          onClick={() => { setShowAdd(true); setEditing({ id: '', slug: '', category: categoryFilter || '', question: '', answer: '', relatedSlugs: null, sortOrder: 0, createdAt: '' }); }}
          className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700"
        >
          + Add Question
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[var(--line)] overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Question</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sort</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-16 text-center text-gray-400">Loading...</td></tr>
            ) : error ? (
              <tr><td colSpan={4} className="px-6 py-16 text-center text-red-500">{error}</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-16 text-center text-gray-400">No questions found</td></tr>
            ) : filtered.map(q => (
              <tr key={q.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">{q.category}</span>
                </td>
                <td className="px-6 py-4 max-w-md">
                  <p className="text-sm font-medium text-[var(--ink)] line-clamp-2">{q.question}</p>
                  <p className="text-xs text-[var(--muted)] mt-1 line-clamp-1">{q.answer}</p>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{q.sortOrder}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => setEditing(q)} className="text-xs text-violet-600 hover:underline mr-3">Edit</button>
                  <button onClick={() => deleteQuestion(q.id)} className="text-xs text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(editing || showAdd) && (
        <QuestionModal
          question={editing!}
          onSave={saveQuestion}
          onClose={() => { setEditing(null); setShowAdd(false); }}
          categories={categories.map(c => c.category)}
        />
      )}
    </div>
  );
}

function QuestionModal({ question, onSave, onClose, categories }: {
  question: Question;
  onSave: (q: Partial<Question>) => void;
  onClose: () => void;
  categories: string[];
}) {
  const [form, setForm] = useState(question);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-[var(--ink)]">
            {form.id ? 'Edit Question' : 'Add Question'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
              <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} required
                className="w-full px-3 py-2 text-sm border rounded-lg" placeholder="tms-benefits" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required
                list="categories"
                className="w-full px-3 py-2 text-sm border rounded-lg" placeholder="tms" />
              <datalist id="categories">{categories.map(c => <option key={c} value={c} />)}</datalist>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Question *</label>
            <textarea value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} required
              rows={2} className="w-full px-3 py-2 text-sm border rounded-lg" placeholder="What is TMS therapy?" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Answer *</label>
            <textarea value={form.answer} onChange={e => setForm({ ...form, answer: e.target.value })} required
              rows={4} className="w-full px-3 py-2 text-sm border rounded-lg" placeholder="Transcranial Magnetic Stimulation (TMS) is..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
            <input type="number" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: Number(e.target.value) })}
              className="w-full px-3 py-2 text-sm border rounded-lg" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}