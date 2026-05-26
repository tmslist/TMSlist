import { useEffect, useRef, useState } from 'react';

interface SearchResult {
  type: 'clinic' | 'doctor' | 'user' | 'lead' | 'blog';
  title: string;
  subtitle: string;
  href: string;
  publicHref?: string;
}

const TYPE_LABELS: Record<SearchResult['type'], string> = {
  clinic: 'Clinic', doctor: 'Doctor', user: 'User', lead: 'Lead', blog: 'Blog',
};
const TYPE_COLORS: Record<SearchResult['type'], string> = {
  clinic: 'bg-blue-100 text-blue-700',
  doctor: 'bg-emerald-100 text-emerald-700',
  user: 'bg-purple-100 text-purple-700',
  lead: 'bg-amber-100 text-amber-700',
  blog: 'bg-rose-100 text-rose-700',
};

const QUICK_LINKS: { label: string; href: string; category: string }[] = [
  { label: 'Dashboard', href: '/admin/dashboard', category: 'Overview' },
  { label: 'Clinics', href: '/admin/clinics', category: 'Content' },
  { label: 'Doctors', href: '/admin/doctors', category: 'Content' },
  { label: 'Reviews', href: '/admin/reviews', category: 'Content' },
  { label: 'Blog Posts', href: '/admin/blog', category: 'Content' },
  { label: 'Page Content', href: '/admin/content', category: 'Content' },
  { label: 'Leads', href: '/admin/leads', category: 'Revenue' },
  { label: 'Revenue', href: '/admin/revenue', category: 'Revenue' },
  { label: 'Analytics', href: '/admin/analytics', category: 'Revenue' },
  { label: 'Tracking & Pixels', href: '/admin/tracking', category: 'Settings' },
  { label: 'SEO', href: '/admin/seo', category: 'Settings' },
  { label: 'Users', href: '/admin/users', category: 'Settings' },
  { label: 'Settings', href: '/admin/settings', category: 'Settings' },
  { label: 'Audit Log', href: '/admin/audit', category: 'Settings' },
  { label: 'Data Quality', href: '/admin/data-quality', category: 'Settings' },
];

export default function AdminCommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else { setQuery(''); setResults([]); setActiveIdx(0); }
  }, [open]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    const t = setTimeout(() => {
      fetch(`/api/admin/search?q=${encodeURIComponent(q)}`)
        .then(r => r.json())
        .then(d => { setResults(d.results || []); setActiveIdx(0); })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 180);
    return () => clearTimeout(t);
  }, [query]);

  const showQuick = query.trim().length < 2;
  const filteredQuick = showQuick
    ? QUICK_LINKS.filter(l => l.label.toLowerCase().includes(query.trim().toLowerCase()))
    : [];
  const items: Array<SearchResult | typeof QUICK_LINKS[number]> = showQuick ? filteredQuick : results;

  function go(href: string) {
    setOpen(false);
    window.location.href = href;
  }

  function onContainerKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, items.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const item: any = items[activeIdx];
      if (item?.href) go(item.href);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--line)] bg-white/60 hover:bg-white text-xs text-[var(--muted)] transition-colors"
        aria-label="Open command palette"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <span>Search…</span>
        <kbd className="ml-2 px-1.5 py-0.5 rounded border border-[var(--line)] bg-[var(--paper2)] font-mono text-[10px]">⌘K</kbd>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[400] flex items-start justify-center pt-[12vh] px-4 bg-black/40 backdrop-blur-sm"
      onClick={() => setOpen(false)}
      onKeyDown={onContainerKeyDown}
    >
      <div
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-[var(--line)] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--line)]">
          <svg className="w-5 h-5 text-[var(--muted)]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search clinics, doctors, leads, users, posts…"
            className="flex-1 bg-transparent outline-none text-base text-[var(--ink)] placeholder:text-[var(--muted)]"
          />
          <kbd className="px-1.5 py-0.5 rounded border border-[var(--line)] bg-[var(--paper2)] font-mono text-[10px] text-[var(--muted)]">ESC</kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto py-2">
          <div className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
            {showQuick ? 'Quick links' : loading ? 'Searching…' : `${results.length} result${results.length === 1 ? '' : 's'}`}
          </div>

          {items.length === 0 && !loading && (
            <div className="px-4 py-8 text-center text-sm text-[var(--muted)]">
              {showQuick ? 'No matching pages' : 'No matches. Try a different query.'}
            </div>
          )}

          {showQuick
            ? filteredQuick.map((l, i) => (
                <button
                  key={l.href}
                  type="button"
                  onClick={() => go(l.href)}
                  onMouseEnter={() => setActiveIdx(i)}
                  className={`w-full text-left px-4 py-2.5 flex items-center gap-3 ${i === activeIdx ? 'bg-[var(--paper2)]' : ''}`}
                >
                  <span className="text-sm text-[var(--ink)] flex-1">{l.label}</span>
                  <span className="text-[10px] uppercase tracking-wider text-[var(--muted)]">{l.category}</span>
                </button>
              ))
            : results.map((r, i) => (
                <div
                  key={`${r.type}-${i}`}
                  onMouseEnter={() => setActiveIdx(i)}
                  onClick={() => go(r.href)}
                  className={`px-4 py-2.5 flex items-center gap-3 cursor-pointer ${i === activeIdx ? 'bg-[var(--paper2)]' : ''}`}
                >
                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${TYPE_COLORS[r.type]}`}>
                    {TYPE_LABELS[r.type]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[var(--ink)] truncate">{r.title}</div>
                    {r.subtitle && <div className="text-xs text-[var(--muted)] truncate">{r.subtitle}</div>}
                  </div>
                  {r.publicHref && (
                    <a
                      href={r.publicHref}
                      target="_blank"
                      rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-xs text-[var(--muted)] hover:text-[var(--ink)] shrink-0"
                      title="Open public page"
                    >↗</a>
                  )}
                </div>
              ))}
        </div>

        <div className="px-4 py-2 border-t border-[var(--line)] bg-[var(--paper2)] flex items-center gap-4 text-[11px] text-[var(--muted)]">
          <span><kbd className="px-1 rounded border border-[var(--line)] bg-white font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="px-1 rounded border border-[var(--line)] bg-white font-mono">↵</kbd> open</span>
          <span><kbd className="px-1 rounded border border-[var(--line)] bg-white font-mono">esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
