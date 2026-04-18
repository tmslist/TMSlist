'use client';

import { useState } from 'react';
import type { Badge } from '../../../hooks/useAchievements';

interface AchievementBadgesProps {
  badges: Badge[];
  onReset: () => void;
}

export function AchievementBadges({ badges, onReset }: AchievementBadgesProps) {
  const [expanded, setExpanded] = useState(false);
  const earned = badges.filter(b => b.earned);
  const locked = badges.filter(b => !b.earned);

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">Achievements</span>
          <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-[9px] font-bold text-amber-400">
            {earned.length}/{badges.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {earned.length > 0 && (
            <div className="flex -space-x-1">
              {earned.slice(0, 3).map(b => (
                <span key={b.id} title={b.name}>{b.emoji}</span>
              ))}
            </div>
          )}
          <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          {earned.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Earned</div>
              {earned.map(badge => (
                <div key={badge.id} className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                  <span className="text-base">{badge.emoji}</span>
                  <div>
                    <div className="text-[10px] font-semibold text-amber-300">{badge.name}</div>
                    <div className="text-[9px] text-amber-400/60">{badge.description}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {locked.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Locked</div>
              {locked.map(badge => (
                <div key={badge.id} className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/30 rounded-lg px-3 py-2 opacity-50">
                  <span className="text-base grayscale">{badge.emoji}</span>
                  <div>
                    <div className="text-[10px] font-semibold text-slate-400">{badge.name}</div>
                    <div className="text-[9px] text-slate-500">{badge.description}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={onReset}
            className="w-full text-[9px] text-slate-600 hover:text-slate-400 mt-2 transition-colors"
          >
            Reset achievements
          </button>
        </div>
      )}
    </div>
  );
}
