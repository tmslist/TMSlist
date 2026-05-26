'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import insurersData from '../../data/insurance-providers.json';

interface Props {
  value: string[];
  onChange: (insurances: string[]) => void;
  className?: string;
}

export default function AdminInsuranceAutocomplete({ value, onChange, className = '' }: Props) {
  const [input, setInput] = useState('');
  const [focused, setFocused] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!input.trim()) return insurersData.insurers.slice(0, 15);
    const q = input.toLowerCase();
    return insurersData.insurers.filter(ins =>
      !value.includes(ins.name) &&
      (ins.name.toLowerCase().includes(q) ||
        ins.aliases.some(a => a.toLowerCase().includes(q)))
    ).slice(0, 15);
  }, [input, value]);

  const add = (insName: string) => {
    if (!value.includes(insName)) {
      onChange([...value, insName]);
    }
    setInput('');
    setHighlightedIdx(-1);
    inputRef.current?.focus();
  };

  const remove = (insName: string) => {
    onChange(value.filter(v => v !== insName));
  };

  useEffect(() => {
    setHighlightedIdx(-1);
  }, [input]);

  return (
    <div className={`${className}`}>
      {/* Selected chips */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {value.map(v => (
            <span
              key={v}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-[rgba(10,22,40,0.08)] text-[var(--ink)] text-xs font-medium rounded-full"
            >
              {v}
              <button
                type="button"
                onClick={() => remove(v)}
                className="hover:text-[var(--ink)] ml-0.5"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={e => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setHighlightedIdx(i => Math.min(i + 1, filtered.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHighlightedIdx(i => Math.max(i - 1, -1));
            } else if (e.key === 'Enter' && highlightedIdx >= 0) {
              e.preventDefault();
              add(filtered[highlightedIdx].name);
            } else if (e.key === 'Escape') {
              setFocused(false);
              inputRef.current?.blur();
            } else if (e.key === 'Backspace' && !input && value.length > 0) {
              remove(value[value.length - 1]);
            }
          }}
          placeholder="Search insurance providers..."
          className="w-full px-3 py-2 border border-[var(--line)] rounded-lg text-sm focus:ring-2 focus:ring-[#1E2A3B] focus:border-[var(--ink2)] outline-none"
          autoComplete="off"
        />

        {/* Dropdown */}
        {focused && (
          <ul className="absolute z-50 w-full bg-white border border-[var(--line)] rounded-lg shadow-lg mt-1 max-h-64 overflow-auto">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-xs text-[var(--muted)]">No matches found</li>
            ) : (
              filtered.map((ins, i) => (
                <li
                  key={ins.id}
                  onClick={() => add(ins.name)}
                  className={`px-3 py-2 cursor-pointer text-sm border-b border-[var(--line)] last:border-0 ${
                    highlightedIdx === i ? 'bg-[rgba(10,22,40,0.08)]' : 'hover:bg-[var(--paper2)]'
                  }`}
                >
                  <span className="font-medium text-[var(--ink)]">{ins.name}</span>
                  {ins.aliases.length > 0 && (
                    <span className="text-[var(--muted)] ml-2 text-xs">{ins.aliases.slice(0, 3).join(', ')}</span>
                  )}
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      <p className="mt-1.5 text-xs text-[var(--muted)]">
        {value.length} provider{value.length !== 1 ? 's' : ''} selected. {insurersData.insurers.length - value.length} available.
      </p>
    </div>
  );
}