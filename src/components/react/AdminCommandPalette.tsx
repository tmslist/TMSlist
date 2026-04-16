import { useState, useEffect, useCallback } from 'react';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  href: string;
  category: string;
}

const COMMANDS: CommandItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/admin/', category: 'Overview' },
  { id: 'clinics', label: 'Clinics', description: 'Manage all TMS clinics', href: '/admin/clinics', category: 'Content' },
  { id: 'doctors', label: 'Doctors', description: 'Manage doctor profiles', href: '/admin/doctors', category: 'Content' },
  { id: 'reviews', label: 'Reviews', description: 'Moderate patient reviews', href: '/admin/reviews', category: 'Content' },
  { id: 'blog', label: 'Blog Posts', description: 'Create and edit blog content', href: '/admin/blog', category: 'Content' },
  { id: 'content', label: 'Page Content', description: 'Edit static pages', href: '/admin/content', category: 'Content' },
  { id: 'leads', label: 'Leads', description: 'View patient enquiries', href: '/admin/leads', category: 'Revenue' },
  { id: 'revenue', label: 'Revenue', description: 'Revenue reports', href: '/admin/revenue', category: 'Revenue' },
  { id: 'analytics', label: 'Analytics', description: 'Site traffic analytics', href: '/admin/analytics', category: 'Revenue' },
  { id: 'users', label: 'Users', description: 'Manage user accounts', href: '/admin/users', category: 'Settings' },
  { id: 'settings', label: 'Settings', description: 'Admin configuration', href: '/admin/settings', category: 'Settings' },
  { id: 'seo', label: 'SEO', description: 'Meta tags and redirects', href: '/admin/seo', category: 'Settings' },
  { id: 'advertising', label: 'Advertising', description: 'Ad campaigns', href: '/admin/advertising', category: 'Settings' },
  { id: 'audit', label: 'Audit Log', description: 'Activity history', href: '/admin/audit-log', category: 'Settings' },
  { id: 'data-quality', label: 'Data Quality', description: 'Data integrity checks', href: '/admin/data-quality', category: 'Settings' },
];

const CATEGORY_ICONS: Record<string, string> = {
  Overview: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  Content: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  Revenue: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  Settings: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
};

function CategoryIcon({ category }: { category: string }) {
  const path = CATEGORY_ICONS[category] || CATEGORY_ICONS.Content;
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

export default function AdminCommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);

  const filtered = query.trim()
    ? COMMANDS.filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.description?.toLowerCase().includes(query.toLowerCase())
      )
    : COMMANDS;

  const openPalette = useCallback(() => {
    setOpen(true);
    setQuery('');
    setSelected(0);
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        open ? setOpen(false) : openPalette();
      }
      if (!open) return;
      if (e.key === 'Escape') { setOpen(false); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === 'Enter' && filtered[selected]) {
        window.location.href = filtered[selected].href;
        setOpen(false);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, selected, filtered, openPalette]);

  if (!open) return (
    <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-500 cursor-pointer hover:bg-gray-200 transition-colors" onClick={openPalette}>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
      <span className="hidden lg:inline">Search...</span>
      <kbd className="hidden lg:inline text-xs bg-white px-1.5 py-0.5 rounded border border-gray-300">⌘K</kbd>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
          <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            autoFocus
            type="text"
            placeholder="Search pages, actions..."
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0); }}
            className="flex-1 text-base outline-none placeholder-gray-400"
          />
          <kbd className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">No results for "{query}"</div>
          ) : (
            filtered.map((cmd, i) => (
              <a
                key={cmd.id}
                href={cmd.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-colors ${i === selected ? 'bg-violet-50 text-violet-700' : 'hover:bg-gray-50'}`}
                onMouseEnter={() => setSelected(i)}
              >
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${i === selected ? 'bg-violet-100 text-violet-600' : 'bg-gray-100 text-gray-500'}`}>
                  <CategoryIcon category={cmd.category} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{cmd.label}</div>
                  {cmd.description && <div className="text-xs text-gray-400 truncate">{cmd.description}</div>}
                </div>
                <span className="text-xs text-gray-400 shrink-0">{cmd.category}</span>
                {i === selected && <svg className="w-4 h-4 text-violet-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>}
              </a>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-400">
          <span><kbd className="bg-gray-100 px-1.5 py-0.5 rounded">↑↓</kbd> navigate</span>
          <span><kbd className="bg-gray-100 px-1.5 py-0.5 rounded">↵</kbd> select</span>
          <span><kbd className="bg-gray-100 px-1.5 py-0.5 rounded">esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}