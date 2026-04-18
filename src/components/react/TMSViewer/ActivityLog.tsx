'use client';

import { useEffect, useRef } from 'react';
import type { NarrationEntry, NarrationLevel } from '../../../hooks/useNarration';
import { BoltIcon, BrainIcon, WarningIcon, TrophyIcon, ClipboardIcon, UserIcon, ScientificIcon } from '../Icons';

interface ActivityLogProps {
  entries: NarrationEntry[];
  level: NarrationLevel;
  getText: (entry: NarrationEntry) => string;
  onLevelChange: (level: NarrationLevel) => void;
}

const typeStyles: Record<NarrationEntry['type'], string> = {
  info: 'text-slate-300',
  pulse: 'text-cyan-300',
  region: 'text-violet-300',
  warning: 'text-amber-300',
  achievement: 'text-amber-400',
  protocol: 'text-emerald-300',
};

const typeIcons: Record<NarrationEntry['type'], string> = {
  info: '·',
  pulse: '⚡',
  region: '🧠',
  warning: '⚠️',
  achievement: '🏆',
  protocol: '📋',
};

export function ActivityLog({ entries, level, getText, onLevelChange }: ActivityLogProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [entries.length]);

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">Live Narration</span>
          <div className={`w-1.5 h-1.5 rounded-full ${entries.length > 0 ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`} />
        </div>
        {/* Language toggle */}
        <button
          onClick={() => onLevelChange(level === 'patient' ? 'clinical' : 'patient')}
          className="flex items-center gap-1 text-[9px] font-medium px-2 py-1 rounded-lg border transition-all bg-slate-800/80 border-slate-600/50 text-slate-400 hover:text-slate-200"
          title={level === 'patient' ? 'Switch to clinical language' : 'Switch to patient-friendly language'}
        >
          <span className={level === 'patient' ? 'text-cyan-400' : 'text-slate-500'}>👤</span>
          <span className="text-slate-600">|</span>
          <span className={level === 'clinical' ? 'text-violet-400' : 'text-slate-500'}>🔬</span>
        </button>
      </div>

      {/* Log entries */}
      <div ref={listRef} className="p-3 space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
        {entries.length === 0 ? (
          <div className="text-[10px] text-slate-600 italic text-center py-4">
            Fire pulses or hover brain regions to see real-time narration
          </div>
        ) : (
          entries.map(entry => (
            <div key={entry.id} className="flex items-start gap-2 group">
              <span className={`text-[11px] leading-tight mt-0.5 shrink-0 ${typeStyles[entry.type]}`}>
                {typeIcons[entry.type]}
              </span>
              <p className={`text-[10px] leading-relaxed ${typeStyles[entry.type]} opacity-90 group-hover:opacity-100 transition-opacity`}>
                {getText(entry)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
