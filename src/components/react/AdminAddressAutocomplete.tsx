'use client';
import { useState, useRef, useEffect } from 'react';

interface Props {
  value: string;
  onChange: (address: string) => void;
  placeholder?: string;
  className?: string;
}

export default function AdminAddressAutocomplete({ value, onChange, placeholder = 'Start typing an address...', className = '' }: Props) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Array<{ description: string; mainText: string; secondaryText: string }>>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        // Use Google Places Autocomplete via API proxy to protect key
        const res = await fetch(`/api/places/autocomplete?input=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.predictions || []);
          setShowDropdown(true);
        } else {
          // Fallback to Nominatim
          const nomRes = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=0`,
            { headers: { 'User-Agent': 'TMSList/1.0' } }
          );
          if (nomRes.ok) {
            const nomData = await nomRes.json();
            setSuggestions(nomData.map((r: { display_name: string }) => ({
              description: r.display_name,
              mainText: r.display_name.split(',')[0],
              secondaryText: r.display_name.split(',').slice(1).join(','),
            })));
            setShowDropdown(true);
          }
        }
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); onChange(e.target.value); }}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-[var(--line)] rounded-lg text-sm focus:ring-2 focus:ring-[#1E2A3B] focus:border-[var(--ink2)] outline-none"
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[var(--line)] border-t-[#0A1628] rounded-full animate-spin" />
        )}
        {!loading && query && (
          <button
            type="button"
            onClick={() => { setQuery(''); onChange(''); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink2)]"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {showDropdown && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full bg-white border border-[var(--line)] rounded-lg shadow-lg mt-1 max-h-60 overflow-auto">
          {suggestions.map((s, i) => (
            <li
              key={i}
              onClick={() => {
                onChange(s.description);
                setQuery(s.description);
                setShowDropdown(false);
              }}
              className="px-3 py-2 hover:bg-[var(--paper2)] cursor-pointer text-sm border-b border-[var(--line)] last:border-0"
            >
              <span className="font-medium text-[var(--ink)]">{s.mainText}</span>
              {s.secondaryText && <span className="text-[var(--muted)] ml-1.5">{s.secondaryText}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}