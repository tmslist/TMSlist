import { useState, useRef, useEffect, useCallback } from 'react';

interface SearchResult {
  id: string;
  slug: string;
  name: string;
  city: string;
  state: string;
  ratingAvg: string;
  verified: boolean;
}

interface QuickSuggestion {
  label: string;
  subLabel: string;
  value: string;
  type: 'state' | 'city' | 'condition' | 'clinic';
}

const CONDITION_SUGGESTIONS: QuickSuggestion[] = [
  { label: 'Depression', subLabel: 'Most common', value: '/treatments/depression/', type: 'condition' },
  { label: 'Anxiety', subLabel: 'Treatment', value: '/treatments/anxiety/', type: 'condition' },
  { label: 'OCD', subLabel: 'Treatment', value: '/treatments/ocd/', type: 'condition' },
  { label: 'PTSD', subLabel: 'Treatment', value: '/treatments/ptsd/', type: 'condition' },
  { label: 'Migraine', subLabel: 'Treatment', value: '/treatments/migraine/', type: 'condition' },
];

const RECENT_KEY = 'tms-recent-searches';
const MAX_RECENT = 5;

function getRecentSearches(): { query: string; url: string }[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string, url: string) {
  try {
    const recent = getRecentSearches().filter(r => r.query !== query);
    recent.unshift({ query, url });
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
  } catch { /* private browsing or storage full */ }
}

function clearRecentSearches() {
  try { localStorage.removeItem(RECENT_KEY); } catch { /* ignore */ }
}

const TYPE_ICONS: Record<string, JSX.Element> = {
  clinic: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  recent: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  condition: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
};

export default function SearchBox() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<{ query: string; url: string }[]>([]);
  const [showInitial, setShowInitial] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const res = await fetch(`/api/clinics/search?query=${encodeURIComponent(q)}&verified=true&limit=6`, {
        signal: controller.signal,
      });
      if (res.ok) {
        const { data } = await res.json();
        setResults(data);
        setActiveIndex(-1);
        window.posthog?.capture('clinic_searched', { query: q, result_count: data.length });
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setResults([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 250);
    return () => clearTimeout(timer);
  }, [query, search]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowInitial(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Matching conditions from the query
  const matchedConditions = query.length >= 2
    ? CONDITION_SUGGESTIONS.filter(c => c.label.toLowerCase().includes(query.toLowerCase()))
    : [];

  // Compute all items for keyboard nav
  const allItems: { type: string; url: string; label: string }[] = [];

  if (query.length < 2 && showInitial) {
    recentSearches.forEach(r => allItems.push({ type: 'recent', url: r.url, label: r.query }));
    CONDITION_SUGGESTIONS.forEach(c => allItems.push({ type: 'condition', url: c.value, label: c.label }));
  } else {
    matchedConditions.forEach(c => allItems.push({ type: 'condition', url: c.value, label: c.label }));
    results.forEach(r => allItems.push({ type: 'clinic', url: `/clinic/${r.slug}`, label: r.name }));
  }

  const hasContent = allItems.length > 0;
  const dropdownVisible = isOpen && (hasContent || loading);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!dropdownVisible) {
      if (e.key === 'ArrowDown') {
        setIsOpen(true);
        setShowInitial(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && allItems[activeIndex]) {
        e.preventDefault();
        const item = allItems[activeIndex];
        saveRecentSearch(item.label, item.url);
        window.posthog?.capture('search_result_clicked', { label: item.label, url: item.url, result_type: item.type, query });
        window.location.href = item.url;
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setShowInitial(false);
    }
  }

  function navigateTo(label: string, url: string, type?: string) {
    saveRecentSearch(label, url);
    window.posthog?.capture('search_result_clicked', { label, url, result_type: type || 'unknown', query });
    window.location.href = url;
  }

  // Track rendered index for keyboard highlight
  let itemIndex = -1;

  return (
    <div ref={containerRef} className="search-container relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setShowInitial(false);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsOpen(true);
            if (query.length < 2) setShowInitial(true);
          }}
          placeholder="Search clinics, cities, conditions..."
          className="w-full pl-12 pr-12 py-4 rounded-2xl border border-gray-200 bg-white text-base shadow-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all placeholder:text-gray-400"
          role="combobox"
          aria-expanded={dropdownVisible}
          aria-controls="search-results"
          aria-activedescendant={activeIndex >= 0 ? `search-item-${activeIndex}` : undefined}
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
          </div>
        )}
        {query.length > 0 && !loading && (
          <button
            onClick={() => { setQuery(''); setResults([]); setIsOpen(false); inputRef.current?.focus(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Clear search"
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {dropdownVisible && (
        <div
          ref={listRef}
          id="search-results"
          role="listbox"
          className="absolute z-50 w-full mt-2 bg-white rounded-2xl border border-gray-100 shadow-[0_12px_40px_rgb(0,0,0,0.08)] overflow-hidden max-h-[420px] overflow-y-auto"
        >
          {/* Initial state: recent + conditions */}
          {query.length < 2 && showInitial && (
            <>
              {recentSearches.length > 0 && (
                <div className="p-2">
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Recent</span>
                    <button
                      onClick={() => { clearRecentSearches(); setRecentSearches([]); }}
                      className="text-[11px] font-medium text-gray-400 hover:text-red-500 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  {recentSearches.map((r) => {
                    itemIndex++;
                    const idx = itemIndex;
                    return (
                      <button
                        key={`recent-${r.query}`}
                        id={`search-item-${idx}`}
                        role="option"
                        aria-selected={idx === activeIndex}
                        onClick={() => navigateTo(r.query, r.url, 'recent')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                          idx === activeIndex ? 'bg-violet-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                          {TYPE_ICONS.recent}
                        </div>
                        <span className="text-sm font-medium text-gray-700 truncate">{r.query}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="p-2 border-t border-gray-50">
                <div className="px-3 py-2">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Browse by Condition</span>
                </div>
                {CONDITION_SUGGESTIONS.map((c) => {
                  itemIndex++;
                  const idx = itemIndex;
                  return (
                    <button
                      key={c.label}
                      id={`search-item-${idx}`}
                      role="option"
                      aria-selected={idx === activeIndex}
                      onClick={() => navigateTo(c.label, c.value, 'condition')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                        idx === activeIndex ? 'bg-violet-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center text-violet-500 shrink-0">
                        {TYPE_ICONS.condition}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-800">{c.label}</div>
                        <div className="text-[11px] text-gray-400">{c.subLabel}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Search results */}
          {query.length >= 2 && (
            <>
              {/* Matched conditions */}
              {matchedConditions.length > 0 && (
                <div className="p-2 border-b border-gray-50">
                  <div className="px-3 py-1.5">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Conditions</span>
                  </div>
                  {matchedConditions.map((c) => {
                    itemIndex++;
                    const idx = itemIndex;
                    return (
                      <button
                        key={c.label}
                        id={`search-item-${idx}`}
                        role="option"
                        aria-selected={idx === activeIndex}
                        onClick={() => navigateTo(c.label, c.value, 'condition')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                          idx === activeIndex ? 'bg-violet-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center text-violet-500 shrink-0">
                          {TYPE_ICONS.condition}
                        </div>
                        <div className="text-sm font-medium text-gray-800">{c.label}</div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Clinic results */}
              {results.length > 0 && (
                <div className="p-2">
                  <div className="px-3 py-1.5">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Clinics</span>
                  </div>
                  {results.map((clinic) => {
                    itemIndex++;
                    const idx = itemIndex;
                    return (
                      <button
                        key={clinic.id}
                        id={`search-item-${idx}`}
                        role="option"
                        aria-selected={idx === activeIndex}
                        onClick={() => navigateTo(clinic.name, `/clinic/${clinic.slug}`, 'clinic')}
                        className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                          idx === activeIndex ? 'bg-violet-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                            {TYPE_ICONS.clinic}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-800 truncate">{clinic.name}</div>
                            <div className="text-[11px] text-gray-400">{clinic.city}, {clinic.state}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {clinic.verified && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Verified" />
                          )}
                          {Number(clinic.ratingAvg) > 0 && (
                            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                              {Number(clinic.ratingAvg).toFixed(1)} ★
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* No results */}
              {!loading && results.length === 0 && matchedConditions.length === 0 && (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-500">No results for "{query}"</p>
                  <p className="text-xs text-gray-400 mt-1">Try a city name, state, or condition</p>
                </div>
              )}

              {/* Loading skeleton */}
              {loading && results.length === 0 && (
                <div className="p-2 space-y-1">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2.5 animate-pulse">
                      <div className="w-8 h-8 rounded-lg bg-gray-100" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 bg-gray-100 rounded w-3/4" />
                        <div className="h-2.5 bg-gray-50 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Footer hint */}
          <div className="px-4 py-2.5 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3 text-[11px] text-gray-400">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200 text-[10px] font-mono">↑↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200 text-[10px] font-mono">↵</kbd>
                select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200 text-[10px] font-mono">esc</kbd>
                close
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
