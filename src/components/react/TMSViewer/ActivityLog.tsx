'use client';

import { useEffect, useRef } from 'react';
import type { NarrationEntry, NarrationLevel } from '../../../hooks/useNarration';
import { BoltIcon, BrainIcon, WarningIcon, TrophyIcon, ClipboardIcon } from '../Icons';

interface ActivityLogProps {
  entries: NarrationEntry[];
  level: NarrationLevel;
  getText: (entry: NarrationEntry) => string;
  onLevelChange: (level: NarrationLevel) => void;
}

const typeColors: Record<NarrationEntry['type'], string> = {
  info: 'rgba(251,250,247,0.55)',
  pulse: '#5BA8BD',
  region: '#D4806A',
  warning: '#D29922',
  achievement: '#FFB347',
  protocol: '#4ade80',
};

function TypeIcon({ type, color }: { type: NarrationEntry['type']; color: string }) {
  const sz = 11;
  switch (type) {
    case 'pulse':       return <BoltIcon size={sz} className="" />;
    case 'region':      return <BrainIcon size={sz} className="" />;
    case 'warning':     return <WarningIcon size={sz} className="" />;
    case 'achievement': return <TrophyIcon size={sz} className="" />;
    case 'protocol':    return <ClipboardIcon size={sz} className="" />;
    default:            return <span style={{ display: 'inline-block', width: 4, height: 4, borderRadius: '50%', background: color, marginTop: 4 }} />;
  }
}

export function ActivityLog({ entries, level, getText, onLevelChange }: ActivityLogProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [entries.length]);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(10,22,40,0.4)', border: '1px solid rgba(201,101,74,0.18)' }}>
      <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid rgba(201,101,74,0.15)' }}>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/55">Live narration</span>
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: entries.length > 0 ? '#5BA8BD' : 'rgba(255,255,255,0.2)',
              boxShadow: entries.length > 0 ? '0 0 6px rgba(91,168,189,0.6)' : 'none',
            }}
          />
        </div>
        <div className="flex items-center gap-0.5 rounded-lg p-0.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {(['patient', 'clinical'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => onLevelChange(mode)}
              className="px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider rounded transition-colors"
              style={{
                background: level === mode ? 'rgba(201,101,74,0.18)' : 'transparent',
                color: level === mode ? '#D4806A' : 'rgba(255,255,255,0.45)',
              }}
              aria-pressed={level === mode}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div ref={listRef} className="p-3 space-y-1.5 max-h-[200px] overflow-y-auto custom-scrollbar">
        {entries.length === 0 ? (
          <div className="text-[10px] italic text-center py-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Fire pulses or hover brain regions to see real-time narration
          </div>
        ) : (
          entries.map(entry => {
            const color = typeColors[entry.type];
            return (
              <div key={entry.id} className="flex items-start gap-2 group">
                <span className="shrink-0 mt-0.5" style={{ color }}>
                  <TypeIcon type={entry.type} color={color} />
                </span>
                <p className="text-[10px] leading-relaxed opacity-90 group-hover:opacity-100 transition-opacity" style={{ color }}>
                  {getText(entry)}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
