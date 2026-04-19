import { useState, useEffect, useCallback } from 'react';

interface PageContent {
  id: string;
  slug: string;
  title: string;
  description: string;
  canonical: string;
  status: 'draft' | 'published';
  content: string;
  metaTitle: string;
  metaDescription: string;
}

interface PageContentInput {
  slug: string;
  title: string;
  description: string;
  canonical: string;
  status: 'draft' | 'published';
  content: string;
  metaTitle: string;
  metaDescription: string;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
      status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
    }`}>
      {status}
    </span>
  );
}

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
        if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold text-gray-900 mb-2">{line.slice(2)}</h1>;
        if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-semibold text-gray-900 mb-2">{line.slice(3)}</h2>;
        if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-semibold text-gray-800 mb-1">{line.slice(4)}</h3>;
        if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc text-gray-700">{line.slice(2)}</li>;
        if (line.trim() === '') return <br key={i} />;
        return <p key={i} className="text-gray-700 mb-1">{line}</p>;
      })}
    </div>
  );
}

export default function AdminContentCalendar() {
  const [posts, setPosts] = useState<PageContent[]>([]);
  const [scheduled, setScheduled] = useState<Record<string, PageContent[]>>({});
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'list'>('month');
  const [dragItem, setDragItem] = useState<PageContent | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/blog-content?status=scheduled');
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      const json = await res.json();
      if (res.ok) {
        const all: PageContent[] = json.posts ?? [];
        setPosts(all);
        const byDate: Record<string, PageContent[]> = {};
        all.forEach((p: PageContent) => {
          if (p.description) {
            const dateKey = p.description.split('T')[0];
            if (!byDate[dateKey]) byDate[dateKey] = [];
            byDate[dateKey].push(p);
          }
        });
        setScheduled(byDate);
      }
    } catch {
      showToast('error', 'Failed to load content');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchContent(); }, [fetchContent]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  function getCellDate(day: number): string {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  function handleDragStart(e: React.DragEvent, post: PageContent) {
    setDragItem(post);
    e.dataTransfer.effectAllowed = 'move';
  }

  async function handleDrop(e: React.DragEvent, dateKey: string) {
    e.preventDefault();
    setDragOver(null);
    if (!dragItem) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/blog-content/${dragItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: dateKey }),
      });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (res.ok) {
        showToast('success', `Scheduled "${dragItem.title}" for ${dateKey}`);
        fetchContent();
      } else {
        showToast('error', 'Failed to reschedule');
      }
    } catch {
      showToast('error', 'Failed to reschedule');
    } finally {
      setSaving(false);
      setDragItem(null);
    }
  }

  const colorByStatus: Record<string, string> = {
    draft: 'bg-gray-400',
    published: 'bg-emerald-500',
    scheduled: 'bg-blue-500',
  };

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
          <h2 className="text-xl font-semibold text-gray-900">Content Calendar</h2>
          <p className="text-sm text-gray-500 mt-0.5">Drag posts to reschedule</p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                view === 'month' ? 'bg-violet-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >Month</button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                view === 'list' ? 'bg-violet-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >List</button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-medium text-gray-700 min-w-[140px] text-center">{monthName}</span>
            <button onClick={nextMonth} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 flex-wrap">
        {Object.entries(colorByStatus).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded-full ${color}`} />
            <span className="text-xs text-gray-600 capitalize">{status}</span>
          </div>
        ))}
      </div>

      {/* Calendar */}
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block w-5 h-5 border-2 border-gray-300 border-t-violet-600 rounded-full animate-spin mb-2" />
          <p className="text-gray-400 text-sm">Loading calendar...</p>
        </div>
      ) : view === 'month' ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">{d}</div>
            ))}
          </div>
          {/* Day cells */}
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }, (_, i) => (
              <div key={`empty-${i}`} className="min-h-[100px] bg-gray-50 border-r border-b border-gray-100" />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dateKey = getCellDate(day);
              const dayPosts = scheduled[dateKey] ?? [];
              const isToday = dateKey === new Date().toISOString().split('T')[0];
              return (
                <div
                  key={day}
                  className={`min-h-[100px] border-r border-b border-gray-100 p-1.5 transition-colors ${
                    dragOver === dateKey ? 'bg-violet-50' : 'hover:bg-gray-50'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(dateKey); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={(e) => handleDrop(e, dateKey)}
                >
                  <div className={`text-xs font-medium mb-1.5 w-7 h-7 flex items-center justify-center rounded-full ${
                    isToday ? 'bg-violet-600 text-white' : 'text-gray-600'
                  }`}>{day}</div>
                  <div className="space-y-1">
                    {dayPosts.slice(0, 3).map((p) => (
                      <div
                        key={p.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, p)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium text-white truncate cursor-grab hover:opacity-80 ${colorByStatus[p.status] ?? 'bg-blue-500'}`}
                        title={p.title}
                      >
                        {p.title}
                      </div>
                    ))}
                    {dayPosts.length > 3 && (
                      <div className="text-[10px] text-gray-400 text-center">+{dayPosts.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {posts.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-gray-400">No scheduled content</p>
              </div>
            ) : posts.map((post) => (
              <div key={post.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`w-2 h-2 rounded-full ${colorByStatus[post.status] ?? 'bg-blue-500'}`} />
                    <span className="text-sm font-medium text-gray-900 truncate">{post.title}</span>
                    <StatusBadge status={post.status} />
                  </div>
                  <p className="text-xs text-gray-500 ml-4">{post.description || 'No schedule date'}</p>
                </div>
                <div className="text-xs text-gray-400">{post.metaDescription || '--'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drag instruction */}
      <div className="text-center">
        <p className="text-xs text-gray-400">Drag items from the list below onto calendar days to reschedule</p>
      </div>

      {/* Unscheduled content */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Unscheduled Content</h3>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
            {posts.filter((p) => !p.description).length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-400">All content is scheduled</p>
              </div>
            ) : posts.filter((p) => !p.description).map((post) => (
              <div
                key={post.id}
                draggable
                onDragStart={(e) => handleDragStart(e, post)}
                className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors cursor-grab"
              >
                <svg className="w-4 h-4 text-gray-300 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 6a2 2 0 11-4 0 2 2 0 014 0zm0 6a2 2 0 11-4 0 2 2 0 014 0zm0 6a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{post.title}</p>
                  <p className="text-xs text-gray-500">{post.status} &middot; {post.metaDescription || 'No meta desc'}</p>
                </div>
                <StatusBadge status={post.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
