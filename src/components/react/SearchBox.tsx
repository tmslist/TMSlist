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

export default function SearchBox() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const res = await fetch(`/api/clinics/search?query=${encodeURIComponent(q)}&verified=true&limit=8`, {
        signal: controller.signal,
      });
      if (res.ok) {
        const { data } = await res.json();
        setResults(data);
        setIsOpen(data.length > 0);
        setActiveIndex(-1);
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setResults([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.closest('.search-container')?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      const item = results[activeIndex];
      if (item) window.location.href = `/clinic/${item.slug}`;
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.children[activeIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  return (
    <div className="search-container relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder="Search clinics by name, city, or state..."
          className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 bg-white text-base shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="search-results"
          aria-activedescendant={activeIndex >= 0 ? `search-result-${activeIndex}` : undefined}
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && (
        <ul
          ref={listRef}
          id="search-results"
          role="listbox"
          className="absolute z-50 w-full mt-2 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden max-h-96 overflow-y-auto"
        >
          {results.map((clinic, index) => (
            <li key={clinic.id} id={`search-result-${index}`} role="option" aria-selected={index === activeIndex}>
              <a
                href={`/clinic/${clinic.slug}`}
                className={`flex items-center justify-between px-4 py-3 hover:bg-indigo-50 transition-colors ${
                  index === activeIndex ? 'bg-indigo-50' : ''
                }`}
              >
                <div>
                  <p className="font-medium text-gray-900">{clinic.name}</p>
                  <p className="text-sm text-gray-500">{clinic.city}, {clinic.state}</p>
                </div>
                <div className="flex items-center gap-2">
                  {clinic.verified && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Verified</span>
                  )}
                  {Number(clinic.ratingAvg) > 0 && (
                    <span className="text-sm font-medium text-amber-600">
                      {Number(clinic.ratingAvg).toFixed(1)} ★
                    </span>
                  )}
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
