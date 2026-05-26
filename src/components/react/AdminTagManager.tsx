'use client';
import { useState, useMemo } from 'react';

interface Props {
  value: string[];
  onChange: (tags: string[]) => void;
  className?: string;
}

const SUGGESTED_TAGS = [
  'depression', 'anxiety', 'ocd', 'bipolar', 'ptsd', 'autism', 'adhd',
  'neurostar', 'brainsway', 'magventure', 'deep-tms', 'fast-tms',
  'medication-resistant', 'psychiatric', 'neuropsychiatric',
  'adolescent', 'geriatric', 'perinatal', 'veteran',
  'experimental', 'clinical-trial', 'research',
  'affordable', 'sliding-scale', 'pro-bono',
  'telehealth', 'virtual', 'in-person', 'home-visit',
  'spanish-speaking', 'multilingual', 'asian-owned', 'black-owned',
  'lgbtq-friendly', 'trauma-informed', 'accessible',
  '24-7', 'evening', 'weekend', 'same-day',
  'insurance', 'out-of-network', 'self-pay',
];

export default function AdminTagManager({ value, onChange, className = '' }: Props) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const addTag = (tag: string) => {
    const normalized = tag.toLowerCase().trim().replace(/\s+/g, '-');
    if (normalized && !value.includes(normalized)) {
      onChange([...value, normalized]);
    }
    setInput('');
    setSuggestions([]);
  };

  const removeTag = (tag: string) => {
    onChange(value.filter(t => t !== tag));
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    if (val.length > 0) {
      const q = val.toLowerCase();
      const filtered = SUGGESTED_TAGS.filter(t =>
        t.includes(q) && !value.includes(t)
      );
      setSuggestions(filtered.slice(0, 10));
    } else {
      setSuggestions([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (input.trim()) addTag(input);
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  return (
    <div className={`${className}`}>
      {/* Current tags */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {value.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-[var(--paper2)] text-[var(--ink2)] text-xs font-medium rounded-full group"
            >
              <span className="text-[var(--muted)]">#</span>{tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-0.5 text-[var(--muted)] hover:text-[var(--ink2)] opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input + suggestions */}
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Add tags (press Enter or comma to add)"
          className="w-full px-3 py-2 border border-[var(--line)] rounded-lg text-sm focus:ring-2 focus:ring-[#1E2A3B] focus:border-[var(--ink2)] outline-none"
          autoComplete="off"
        />
        {suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-[var(--line)] rounded-lg shadow-lg">
            {suggestions.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => addTag(s)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--paper2)] border-b border-[var(--line)] last:border-0"
              >
                <span className="text-[var(--muted)] mr-1">#</span>{s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick-add categories */}
      <div className="mt-3">
        <p className="text-xs text-[var(--muted)] mb-1.5">Quick add:</p>
        <div className="flex flex-wrap gap-1">
          {SUGGESTED_TAGS.slice(0, 12).filter(t => !value.includes(t)).map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => addTag(tag)}
              className="px-2 py-0.5 bg-[var(--paper2)] text-[var(--muted)] text-xs rounded border border-[var(--line)] hover:bg-[rgba(10,22,40,0.08)] hover:border-[rgba(10,22,40,0.15)] hover:text-[var(--ink)] transition-colors"
            >
              <span className="text-[var(--line)]">#</span>{tag}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-2 text-xs text-[var(--muted)]">{value.length} tag{value.length !== 1 ? 's' : ''}</p>
    </div>
  );
}