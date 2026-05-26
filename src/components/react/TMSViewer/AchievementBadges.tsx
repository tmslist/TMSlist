'use client';

import { useState } from 'react';
import type { Badge } from '../../../hooks/useAchievements';

interface AchievementBadgesProps {
  badges: Badge[];
  onReset: () => void;
  /** When true, omit the outer card chrome and the toggle button (parent provides them). */
  embedded?: boolean;
}

export function AchievementBadges({ badges, onReset, embedded = false }: AchievementBadgesProps) {
  const [expanded, setExpanded] = useState(false);
  const earned = badges.filter(b => b.earned);
  const locked = badges.filter(b => !b.earned);

  if (embedded) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium text-white/55">{earned.length} of {badges.length} earned</span>
          {earned.length > 0 && (
            <button onClick={onReset} className="text-[10px] text-white/40 hover:text-white/70 transition-colors">Reset</button>
          )}
        </div>
        {earned.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[9px] font-semibold text-white/40 uppercase tracking-wider">Earned</div>
            {earned.map(badge => (
              <div key={badge.id} className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: 'rgba(201,101,74,0.10)', border: '1px solid rgba(201,101,74,0.25)' }}>
                <span className="inline-flex items-center justify-center w-5 h-5 shrink-0" dangerouslySetInnerHTML={{ __html: badge.emoji }} />
                <div>
                  <div className="text-[10px] font-semibold" style={{ color: '#D4806A' }}>{badge.name}</div>
                  <div className="text-[9px]" style={{ color: 'rgba(212,128,106,0.6)' }}>{badge.description}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {locked.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[9px] font-semibold text-white/40 uppercase tracking-wider">Locked</div>
            {locked.map(badge => (
              <div key={badge.id} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 opacity-50">
                <span className="inline-flex items-center justify-center w-5 h-5 shrink-0 grayscale opacity-60" dangerouslySetInnerHTML={{ __html: badge.emoji }} />
                <div>
                  <div className="text-[10px] font-semibold text-white/55">{badge.name}</div>
                  <div className="text-[9px] text-white/40">{badge.description}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-[var(--paper2)]/60 backdrop-blur-sm border border-[var(--line)]/50 rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--paper2)]/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Achievements</span>
          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ background: 'rgba(201,101,74,0.2)', border: '1px solid rgba(201,101,74,0.3)', color: '#D4806A' }}>
            {earned.length}/{badges.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {earned.length > 0 && (
            <div className="flex -space-x-1">
              {earned.slice(0, 3).map(b => (
                <span key={b.id} title={b.name} className="inline-flex items-center justify-center w-4 h-4" dangerouslySetInnerHTML={{ __html: b.emoji }} />
              ))}
            </div>
          )}
          <svg className={`w-3.5 h-3.5 text-white/40 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          {earned.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[9px] font-semibold text-white/40 uppercase tracking-wider">Earned</div>
              {earned.map(badge => (
                <div key={badge.id} className="flex items-center gap-2 bg-[#C9654A]/20/10 border border-amber-500/20 rounded-lg px-3 py-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 shrink-0" dangerouslySetInnerHTML={{ __html: badge.emoji }} />
                  <div>
                    <div className="text-[10px] font-semibold text-[var(--warm)]">{badge.name}</div>
                    <div className="text-[9px] text-[#C9654A]/60">{badge.description}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {locked.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[9px] font-semibold text-white/40 uppercase tracking-wider">Locked</div>
              {locked.map(badge => (
                <div key={badge.id} className="flex items-center gap-2 bg-[var(--paper2)]/60 border border-[var(--line)]/30 rounded-lg px-3 py-2 opacity-50">
                  <span className="inline-flex items-center justify-center w-5 h-5 shrink-0 grayscale opacity-60" dangerouslySetInnerHTML={{ __html: badge.emoji }} />
                  <div>
                    <div className="text-[10px] font-semibold text-white/40">{badge.name}</div>
                    <div className="text-[9px] text-white/40">{badge.description}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={onReset}
            className="w-full text-[9px] text-white/40 hover:text-white/40 mt-2 transition-colors"
          >
            Reset achievements
          </button>
        </div>
      )}
    </div>
  );
}
